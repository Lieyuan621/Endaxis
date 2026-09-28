/**
 * 当前方案的单切面试验：优先保留最近编辑位置之前的运行状态，不保留完整结果或分支历史。
 * 战斗执行、保存和恢复仍由正式会话完成；这里仅决定什么时候复用。
 */
import type { ScenarioDocument } from '../../core/project/schema';
import { resolveScenarioInitialFrame } from '../../core/project/skillCastPlacement';
import { CombatInputSchedule, type CombatInputScheduleCheckpoint } from './combatInputSchedule';
import type { ScenarioSimulationService } from './scenarioSimulationService';
import { assertScenarioSimulationEndFrame } from './runStandardPlayerDamageScenarioSimulation';

type InputPlan = ReturnType<ScenarioSimulationService['compileInputSchedule']>;
interface SavedPrefix {
  key: string;
  frame: number;
  schedule: CombatInputSchedule;
  checkpoint: CombatInputScheduleCheckpoint;
}

type InputIdentity = Pick<InputPlan, 'inputs' | 'groups'>;
interface PreviousInput {
  scenario: ScenarioDocument;
  plan: InputIdentity;
}

function prefixKey(scenario: ScenarioDocument, plan: InputIdentity, frame: number): string {
  const inputs = plan.inputs.filter(input => input.frame <= frame);
  const ids = new Set(inputs.flatMap(input => (input.skills ?? []).map(skill => skill.castId)));
  // 连续组的成员虽尚未执行，接续规则已经从组启动时生效，必须一起校验。
  const groups = plan.groups.filter(group => group.castIds.some(id => ids.has(id)));
  return JSON.stringify({
    scenario: {
      ...scenario,
      name: '',
      editor: null,
      connections: [],
      tracks: scenario.tracks.map(
        track =>
          track && {
            ...track,
            skillCasts: track.skillCasts.filter(cast => ids.has(cast.id)),
            consumableUses: [],
          },
      ),
      battle: {
        ...scenario.battle,
        controlSwitches: [],
        dodgeMarkers: [],
        externalEventMarkers: [],
      },
    },
    initialFrame: resolveScenarioInitialFrame(scenario),
    inputs,
    groups,
  });
}

export class IncrementalScenarioSimulation {
  #saved: SavedPrefix | undefined;
  #expiry: ReturnType<typeof setTimeout> | undefined;
  #previous: PreviousInput | undefined;
  #preferredFrame: number | undefined;
  constructor(private readonly now: () => number = () => performance.now()) {}
  /** 最近一次复用的切面帧；null 表示本次从头执行。 */
  resumedFromFrame: number | null = null;

  clear(): void {
    if (this.#expiry !== undefined) clearTimeout(this.#expiry);
    this.#expiry = undefined;
    this.#previous = undefined;
    this.#preferredFrame = undefined;
    this.#discardSaved();
    this.resumedFromFrame = null;
  }

  #discardSaved(): void {
    if (this.#saved) this.#saved.schedule.discardCheckpoint(this.#saved.checkpoint);
    this.#saved = undefined;
  }

  run(service: ScenarioSimulationService, scenario: ScenarioDocument, endFrame: number) {
    assertScenarioSimulationEndFrame(scenario, endFrame);
    this.resumedFromFrame = null;
    const plan = service.compileInputSchedule(scenario);
    const initialFrame = resolveScenarioInitialFrame(scenario);
    this.#updatePreferredFrame(scenario, plan, initialFrame, endFrame);
    const target = Math.min(
      endFrame - 1,
      this.#preferredFrame ?? Math.floor((initialFrame + endFrame) / 2),
    );
    const saved = this.#saved;
    if (saved && saved.frame < endFrame && saved.key === prefixKey(scenario, plan, saved.frame)) {
      this.resumedFromFrame = saved.frame;
      try {
        const branch = this.#fork(saved, plan);
        // 离编辑处超过三秒才前移；小幅拖动保持切面稳定，不逐帧保存。
        if (target > saved.frame + 90) {
          branch.advanceToFrame(target);
          if (branch.session.runtime.readHistory().length <= 20_000) {
            return this.#finishWithCheckpoint(branch, target, scenario, plan, endFrame);
          }
        }
        branch.advanceToFrame(endFrame);
        const result = branch.session.collectResult();
        this.#rememberInput(scenario, plan);
        return result;
      } catch (error) {
        this.clear();
        throw error;
      }
    }
    this.#discardSaved();
    const session = service.createInputCombatSession(scenario, initialFrame);
    const schedule = new CombatInputSchedule(
      session,
      plan.inputs,
      plan.groups,
      plan.customSkillPrograms,
    );
    if (target <= initialFrame) {
      schedule.advanceToFrame(endFrame);
      this.#rememberInput(scenario, plan);
      return session.collectResult();
    }
    const startedAt = this.now();
    schedule.advanceToFrame(target);
    // 快轴不支付保存/恢复成本。回执特别多时也不保留额外的运行状态。
    if (this.now() - startedAt < 25 || session.runtime.readHistory().length > 20_000) {
      schedule.advanceToFrame(endFrame);
      this.#rememberInput(scenario, plan);
      return session.collectResult();
    }
    return this.#finishWithCheckpoint(schedule, target, scenario, plan, endFrame);
  }

  #finishWithCheckpoint(
    schedule: CombatInputSchedule,
    frame: number,
    scenario: ScenarioDocument,
    plan: InputPlan,
    endFrame: number,
  ) {
    const checkpoint = schedule.save();
    const candidate = {
      key: prefixKey(scenario, plan, frame),
      frame,
      schedule,
      checkpoint,
    };
    try {
      const branch = this.#fork(candidate, plan);
      branch.advanceToFrame(endFrame);
      const result = branch.session.collectResult();
      this.#discardSaved();
      this.#saved = candidate;
      this.#rememberInput(scenario, plan);
      return result;
    } catch (error) {
      schedule.discardCheckpoint(checkpoint);
      throw error;
    }
  }

  #updatePreferredFrame(
    scenario: ScenarioDocument,
    plan: InputPlan,
    initial: number,
    end: number,
  ): void {
    const previous = this.#previous;
    if (!previous) return;
    const sameThrough = (frame: number) =>
      prefixKey(previous.scenario, previous.plan, frame) === prefixKey(scenario, plan, frame);
    // 构筑、初始状态或方案身份变化，旧编辑位置不再具有参考意义。
    if (!sameThrough(initial - 1)) {
      this.#preferredFrame = undefined;
      return;
    }
    if (sameThrough(end)) return;
    // 前缀一旦不同，后面的前缀也不再相同。用二分找到最早受影响的输入帧，
    // 同时覆盖移动的原位置/新位置、删除、连续组、技能种子和自定义技能变更。
    let low = initial;
    let high = end;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (sameThrough(middle)) low = middle + 1;
      else high = middle;
    }
    // 留一秒供左右拖动；切面包含保存帧，必须严格早于变化帧。
    this.#preferredFrame = Math.max(initial, low - 31);
  }

  #rememberInput(scenario: ScenarioDocument, plan: InputPlan): void {
    this.#previous = {
      scenario: structuredClone(scenario),
      plan: structuredClone({ inputs: plan.inputs, groups: plan.groups }),
    };
    this.#releaseWhenIdle();
  }

  #releaseWhenIdle(): void {
    if (this.#expiry !== undefined) clearTimeout(this.#expiry);
    // 只为一轮连续编辑付出额外内存，停手后不长期保留。
    this.#expiry = setTimeout(() => this.clear(), 15_000);
  }

  #fork(saved: SavedPrefix, plan: InputPlan): CombatInputSchedule {
    const inputs = plan.inputs.filter(input => input.frame > saved.frame);
    const ids = new Set(inputs.flatMap(input => (input.skills ?? []).map(skill => skill.castId)));
    return saved.schedule.forkWithInputsAfterCheckpoint(
      saved.checkpoint,
      inputs,
      plan.groups.filter(group => group.castIds.every(id => ids.has(id))),
      plan.customSkillPrograms.filter(binding => ids.has(binding.castId)),
    );
  }
}
