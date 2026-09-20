import type { ScenarioDocument } from '../../core/project/schema';
import {
  getSkillCastPlacementChains,
  getDodgeMarkerHistory,
  resolveDodgeMarkerLastInputFrame,
  resolveScenarioInitialFrame,
} from '../../core/project/skillCastPlacement';
import { CombatInputSchedule, type CombatInputScheduleCheckpoint } from './combatInputSchedule';
import type { ScenarioSimulationService } from './scenarioSimulationService';

/** 服务实例绑定固定仓库；这里只缓存一个冻结前缀，替换或清空时释放检查点。 */
export class InheritedScenarioSimulation {
  #saved:
    | { key: string; schedule: CombatInputSchedule; checkpoint: CombatInputScheduleCheckpoint }
    | undefined;

  clear(): void {
    if (this.#saved !== undefined) {
      this.#saved.schedule.discardCheckpoint(this.#saved.checkpoint);
      this.#saved = undefined;
    }
  }

  run(
    service: ScenarioSimulationService,
    scenario: ScenarioDocument,
    endFrame: number,
    continuationPlan?: {
      readonly castIds: readonly string[];
      readonly mode: 'continuation' | 'compact';
    },
  ) {
    const boundary = scenario.inheritance!.frame;
    if (boundary < resolveScenarioInitialFrame(scenario))
      throw new RangeError('inheritance precedes the source simulation');
    if (!Number.isSafeInteger(boundary) || endFrame < boundary)
      throw new RangeError('inherited simulation must reach its input boundary');
    const historicalIds = new Set<string>();
    const prefix = structuredClone(scenario);
    delete prefix.inheritance;
    for (const track of prefix.tracks) {
      if (track === null) continue;
      for (const chain of getSkillCastPlacementChains(track.skillCasts)) {
        if (chain.anchor.placement.startFrame! < boundary)
          for (const cast of chain.casts) historicalIds.add(cast.id);
      }
      track.skillCasts = track.skillCasts.filter(cast => historicalIds.has(cast.id));
      for (const cast of track.skillCasts) {
        // disabled 影响执行；颜色、位置锁和展示条不属于模拟输入。
        const disabled = cast.presentation?.disabled === true;
        delete cast.presentation;
        if (disabled) cast.presentation = { disabled: true };
      }
      track.consumableUses = track.consumableUses?.filter(use => use.frame < boundary);
    }
    prefix.battle.controlSwitches = prefix.battle.controlSwitches.filter(
      marker => marker.frame < boundary,
    );
    prefix.battle.externalEventMarkers = prefix.battle.externalEventMarkers?.filter(
      marker => marker.frame < boundary,
    );
    if (prefix.battle.dodgeMarkers !== undefined)
      prefix.battle.dodgeMarkers = getDodgeMarkerHistory(prefix.battle.dodgeMarkers, boundary);
    // 编辑范围和展示内容不参与历史运行环境，也不使前缀失效。
    delete prefix.battle.simulationRange;
    prefix.battle.durationFrames = Math.max(0, boundary);
    prefix.battle.cycleBoundaries = [];
    prefix.connections = [];
    prefix.name = '';
    prefix.editor = { trackHeightWeights: [1, 1, 1, 1], prepExpanded: false };
    const key = JSON.stringify({ boundary, prefix });
    let saved = this.#saved;
    if (saved?.key !== key) {
      const plan = service.compileInputSchedule(prefix);
      const initialFrame = Math.min(0, boundary, ...plan.inputs.map(input => input.frame));
      const session = service.createInputCombatSession(prefix, initialFrame);
      const schedule = new CombatInputSchedule(
        session,
        plan.inputs,
        plan.groups,
        plan.customSkillPrograms,
      );
      if (initialFrame < boundary) schedule.advanceToFrame(boundary - 1);
      // 历史连续组不能把尚未提交的未来成员偷偷带入保存点。
      const processed = new Set(
        [...session.runtime.readHistory().entries()]
          .filter(entry => entry.event === 'SkillInputProcessed')
          .map(entry => entry.data?.castId),
      );
      for (const group of plan.groups)
        if (group.castIds.some(id => !processed.has(id)))
          throw new Error('continuous group crosses the inheritance input boundary');
      const checkpoint = schedule.save();
      this.clear();
      saved = { key, schedule, checkpoint };
      this.#saved = saved;
    }
    const suffix = structuredClone(scenario);
    delete suffix.inheritance;
    for (const track of suffix.tracks) {
      if (track === null) continue;
      track.skillCasts = track.skillCasts.filter(cast => !historicalIds.has(cast.id));
      track.consumableUses = track.consumableUses?.filter(use => use.frame >= boundary);
    }
    suffix.battle.controlSwitches = suffix.battle.controlSwitches.filter(
      marker => marker.frame >= boundary,
    );
    suffix.battle.externalEventMarkers = suffix.battle.externalEventMarkers?.filter(
      marker => marker.frame >= boundary,
    );
    suffix.battle.dodgeMarkers = suffix.battle.dodgeMarkers?.filter(
      marker => resolveDodgeMarkerLastInputFrame(marker) >= boundary,
    );
    const plan = service.compileInputSchedule(suffix);
    if (continuationPlan?.castIds.some(id => historicalIds.has(id)))
      throw new Error('continuation planning cannot change inherited history');
    const branch = saved.schedule.forkWithInputsAfterCheckpoint(
      saved.checkpoint,
      // 一个标签可以跨过边界，但历史 Dash 不得重放，只提交仍在未来的成功事实。
      plan.inputs.filter(input => input.frame >= boundary),
      plan.groups,
      plan.customSkillPrograms,
      continuationPlan,
    );
    branch.advanceToFrame(endFrame);
    return branch.session.collectResult();
  }
}
