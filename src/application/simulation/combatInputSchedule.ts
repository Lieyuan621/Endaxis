import type {
  CombatFrameInput,
  CombatSkillInputPhase,
} from '../../core/combat/runtime/combatFrameInput';
import {
  CombatInputRuntime,
  type SkillInputGroup,
} from '../../core/combat/runtime/combatInputRuntime';
import type { CombatSkillCastProgram } from '../../core/combat/runtime/combatRuntimeAssembly';
import type { CombatRuntimeCheckpoint } from '../../core/combat/runtime/combatRuntimeSession';
import type { CombatInputRuntimeState } from '../../core/combat/state/environmentState';
import {
  type CombatSkillInput,
  type ScheduledSkillInput,
} from '../../core/combat/state/environmentState';
import type { StandardPlayerDamageCombatSession } from './standardPlayerDamageCombatSession';

/** 排程器在指定帧提交的一组人工输入。同帧技能按数组顺序，切人及人工标记保留各自的执行阶段。 */
export interface ScheduledCombatFrameInput extends CombatFrameInput {
  readonly skills?: readonly (CombatSkillInput & Pick<ScheduledSkillInput, 'declarationOrder'>)[];
  readonly frame: number;
}

const scheduleCheckpoint = Symbol('combat input schedule checkpoint');
const scheduleRestoration = Symbol('combat input schedule restoration');
export interface CombatInputScheduleCheckpoint {
  readonly [scheduleCheckpoint]: true;
}
interface SavedSchedule {
  readonly combat: CombatRuntimeCheckpoint;
  readonly inputBoundary: number;
  readonly nextIndex: number;
  readonly skills: CombatInputRuntimeState | undefined;
}
interface ScheduleRestoration {
  readonly [scheduleRestoration]: Pick<SavedSchedule, 'nextIndex' | 'skills'>;
}

interface ContinuationPlan {
  readonly castIds: readonly string[];
  readonly mode: 'continuation' | 'compact';
}

/**
 * 一个试跑分支的人工输入驱动。战斗只接收当前帧，不持有未来排程。
 * 延长观察直接继续当前分支；回退后重建驱动，禁止沿用旧候选游标。
 */
export class CombatInputSchedule {
  readonly #inputs: readonly ScheduledCombatFrameInput[];
  readonly #generation: number;
  #expectedFrame: number;
  #expectedInitialInputPending: boolean;
  #nextIndex = 0;
  readonly #groups: readonly SkillInputGroup[];
  readonly #customSkillProgramsByCastId: ReadonlyMap<string, CombatSkillCastProgram>;
  #skills: CombatInputRuntime | undefined;
  #phase: CombatSkillInputPhase | undefined;
  readonly #checkpoints = new WeakMap<CombatInputScheduleCheckpoint, SavedSchedule>();

  constructor(
    readonly session: StandardPlayerDamageCombatSession,
    inputs: readonly ScheduledCombatFrameInput[],
    groups: readonly SkillInputGroup[] = [],
    customSkillPrograms: readonly CombatSkillCastProgram[] = [],
    restoration?: ScheduleRestoration,
    continuationPlan?: ContinuationPlan,
  ) {
    const restored = restoration?.[scheduleRestoration];
    if (restoration !== undefined && restored === undefined) {
      throw new Error('input schedule restoration requires an owned checkpoint');
    }
    if (
      (session.compiled.inputs?.length ?? 0) > 0 ||
      (session.compiled.externalEvents?.length ?? 0) > 0 ||
      (session.compiled.skillInputGroups?.length ?? 0) > 0 ||
      session.compiled.continuationPlanCastIds !== undefined
    ) {
      throw new Error('candidate schedule requires a session without prearranged inputs');
    }
    const boundary = session.runtime.frame + (session.runtime.initialInputPending ? 0 : 1);
    let previousFrame = restored === undefined ? boundary - 1 : Number.NEGATIVE_INFINITY;
    for (const input of inputs) {
      if (!Number.isSafeInteger(input.frame) || input.frame <= previousFrame) {
        throw new RangeError(
          'candidate frames must be ordered, unique and after the saved input boundary',
        );
      }
      previousFrame = input.frame;
    }
    this.#inputs = structuredClone(inputs);
    this.#groups = structuredClone(groups);
    const scheduledSkills = new Map(
      this.#inputs.flatMap(input =>
        (input.skills ?? []).flatMap(skill =>
          skill.castId === undefined ? [] : [[skill.castId, skill] as const],
        ),
      ),
    );
    const programsByCastId = new Map<string, CombatSkillCastProgram>();
    for (const binding of customSkillPrograms) {
      const skill = scheduledSkills.get(binding.castId);
      if (skill === undefined) {
        throw new Error(`skill program '${binding.castId}' has no scheduled input`);
      }
      if (
        binding.program.operatorId !== skill.operatorId ||
        binding.program.skillId !== skill.skillId
      ) {
        throw new Error(`skill program '${binding.castId}' does not match its scheduled input`);
      }
      if (programsByCastId.has(binding.castId)) {
        throw new Error(`duplicate scheduled skill program '${binding.castId}'`);
      }
      programsByCastId.set(binding.castId, binding);
    }
    this.#customSkillProgramsByCastId = programsByCastId;
    this.#nextIndex = restored?.nextIndex ?? 0;
    this.#generation = session.runtime.generation;
    this.#expectedFrame = session.runtime.frame;
    this.#expectedInitialInputPending = session.runtime.initialInputPending;
    if (groups.length > 0 || continuationPlan !== undefined) {
      const requirePhase = () => {
        if (this.#phase === undefined)
          throw new Error('skill schedule requires the current input phase');
        return this.#phase;
      };
      this.#skills = new CombatInputRuntime({
        clock: {
          get frame() {
            return session.runtime.frame;
          },
        },
        inputs: this.#inputs.flatMap(input =>
          (input.skills ?? []).map(skill => ({ ...skill, frame: input.frame })),
        ),
        execution: {
          submit: (input, frame) => this.#submitSkill(requirePhase(), input, frame),
          groupBlocked: input => requirePhase().groupBlocked(input),
        },
        skillInputGroups: {
          groups: this.#groups,
          canContinue: previous => requirePhase().canContinue(previous),
        },
        ...(continuationPlan === undefined
          ? {}
          : {
              continuationPlan: {
                castIds: continuationPlan.castIds,
                ignoreInputFailures: continuationPlan.mode === 'compact',
                canContinue: (input, previous) =>
                  requirePhase().canPlanContinuation(input, previous, continuationPlan.mode),
              },
            }),
        ...(restored?.skills === undefined ? {} : { restoredState: restored.skills }),
      });
    }
  }

  save(): CombatInputScheduleCheckpoint {
    this.#assertCurrent();
    const handle: CombatInputScheduleCheckpoint = Object.freeze({
      [scheduleCheckpoint]: true as const,
    });
    this.#checkpoints.set(handle, {
      combat: this.session.runtime.save(),
      inputBoundary:
        this.session.runtime.frame + (this.session.runtime.initialInputPending ? 0 : 1),
      nextIndex: this.#nextIndex,
      skills: this.#skills === undefined ? undefined : structuredClone(this.#skills.runtimeState),
    });
    return handle;
  }

  fork(
    checkpoint: CombatInputScheduleCheckpoint,
    additions: readonly ScheduledCombatFrameInput[] = [],
    addedGroups: readonly SkillInputGroup[] = [],
    addedCustomSkillPrograms: readonly CombatSkillCastProgram[] = [],
  ): CombatInputSchedule {
    this.#assertCurrent();
    const saved = this.#checkpoints.get(checkpoint);
    if (saved === undefined) throw new Error('checkpoint does not belong to this input schedule');
    let previousFrame = saved.inputBoundary - 1;
    for (const input of additions) {
      if (!Number.isSafeInteger(input.frame) || input.frame <= previousFrame) {
        throw new RangeError(
          'added inputs must be ordered, unique and after the saved input boundary',
        );
      }
      previousFrame = input.frame;
    }
    const existingIds = new Set(
      this.#inputs.flatMap(input =>
        (input.skills ?? []).flatMap(skill => (skill.castId === undefined ? [] : [skill.castId])),
      ),
    );
    const addedIds = new Set<string>();
    for (const input of additions)
      for (const skill of input.skills ?? []) {
        if (skill.castId === undefined) continue;
        if (existingIds.has(skill.castId) || addedIds.has(skill.castId)) {
          throw new Error(`added cast '${skill.castId}' must have a new identity`);
        }
        addedIds.add(skill.castId);
      }
    for (const group of addedGroups) {
      if (
        this.#groups.some(existing => existing.anchorCastId === group.anchorCastId) ||
        group.castIds.some(id => !addedIds.has(id))
      ) {
        throw new Error('added groups must contain only new casts and have new anchors');
      }
    }
    // 新增操作排在既有声明之后；不能以调用方的排序号插到既有同帧操作之前。
    const existingSkills = this.#inputs.flatMap(input => input.skills ?? []);
    let order =
      existingSkills.reduce(
        (max, skill, index) => Math.max(max, skill.declarationOrder ?? index),
        -1,
      ) + 1;
    const frames = new Map(this.#inputs.map(input => [input.frame, input]));
    for (const input of additions) {
      const existing = frames.get(input.frame);
      frames.set(input.frame, {
        ...existing,
        ...input,
        ...(input.controlledOperatorId === undefined && existing?.controlledOperatorId !== undefined
          ? { controlledOperatorId: existing.controlledOperatorId }
          : {}),
        skills: [
          ...(existing?.skills ?? []),
          ...(input.skills ?? []).map(skill => ({ ...skill, declarationOrder: order++ })),
        ],
        consumableUses: [...(existing?.consumableUses ?? []), ...(input.consumableUses ?? [])],
        externalEvents: [...(existing?.externalEvents ?? []), ...(input.externalEvents ?? [])],
      });
    }
    const inputs = [...frames.values()].sort((left, right) => left.frame - right.frame);
    const groups = [...this.#groups, ...addedGroups];
    let skills = saved.skills === undefined ? undefined : structuredClone(saved.skills);
    if (groups.length > 0) {
      if (skills === undefined) {
        const consumed = this.#inputs
          .slice(0, saved.nextIndex)
          .flatMap(input => (input.skills ?? []).map(skill => ({ ...skill, frame: input.frame })));
        skills = {
          nextInputIndex: consumed.length,
          previousFixedInput: consumed.at(-1) ?? null,
          continuation: { nextIndex: 1, previous: null, stopped: false },
          groups: [],
        };
      }
      skills.groups.push(
        ...addedGroups.map(group => ({
          anchorCastId: group.anchorCastId,
          nextIndex: 0,
          previous: null,
          stopped: false,
        })),
      );
    }
    return new CombatInputSchedule(
      this.session.fork(saved.combat),
      inputs,
      groups,
      [...this.#customSkillProgramsByCastId.values(), ...addedCustomSkillPrograms],
      {
        [scheduleRestoration]: { nextIndex: saved.nextIndex, skills },
      },
    );
  }

  /**
   * 从保存点建立分支，并明确指定该保存点之后要提交的全部输入。
   * 保存点前已提交的输入，以及已经启动或停止的连续组属于历史，必须保留原定义和游标。
   */
  forkWithInputsAfterCheckpoint(
    checkpoint: CombatInputScheduleCheckpoint,
    inputsAfterCheckpoint: readonly ScheduledCombatFrameInput[],
    groupsAfterCheckpoint: readonly SkillInputGroup[] = [],
    customSkillProgramsAfterCheckpoint: readonly CombatSkillCastProgram[] = [],
    continuationPlan?: ContinuationPlan,
  ): CombatInputSchedule {
    this.#assertCurrent();
    const saved = this.#checkpoints.get(checkpoint);
    if (saved === undefined) throw new Error('checkpoint does not belong to this input schedule');
    let previousFrame = saved.inputBoundary - 1;
    for (const input of inputsAfterCheckpoint) {
      if (!Number.isSafeInteger(input.frame) || input.frame <= previousFrame) {
        throw new RangeError(
          'inputs after a checkpoint must be ordered, unique and after the saved input boundary',
        );
      }
      previousFrame = input.frame;
    }

    const prefix = this.#inputs.slice(0, saved.nextIndex);
    const historicalCastIds = new Set(
      prefix.flatMap(input =>
        (input.skills ?? []).flatMap(skill => (skill.castId === undefined ? [] : [skill.castId])),
      ),
    );
    const castIdsAfterCheckpoint = new Set<string>();
    for (const input of inputsAfterCheckpoint) {
      for (const skill of input.skills ?? []) {
        if (skill.castId === undefined) continue;
        if (historicalCastIds.has(skill.castId)) {
          throw new Error(
            `cast '${skill.castId}' after the checkpoint already belongs to submitted history`,
          );
        }
        if (castIdsAfterCheckpoint.has(skill.castId)) {
          throw new Error(`cast '${skill.castId}' after the checkpoint must be unique`);
        }
        castIdsAfterCheckpoint.add(skill.castId);
      }
    }

    const savedGroupStates = saved.skills?.groups ?? [];
    const retainedGroups: SkillInputGroup[] = [];
    const retainedGroupStates: CombatInputRuntimeState['groups'][number][] = [];
    this.#groups.forEach((group, index) => {
      const state = savedGroupStates[index];
      if (
        state !== undefined &&
        (state.nextIndex > 0 || state.previous !== null || state.stopped)
      ) {
        retainedGroups.push(group);
        retainedGroupStates.push(structuredClone(state));
      }
    });
    const retainedAnchors = new Set(retainedGroups.map(group => group.anchorCastId));
    for (const group of groupsAfterCheckpoint) {
      if (retainedAnchors.has(group.anchorCastId)) {
        throw new Error(
          `group '${group.anchorCastId}' after the checkpoint already belongs to history`,
        );
      }
      if (group.castIds.some(castId => !castIdsAfterCheckpoint.has(castId))) {
        throw new Error('groups after a checkpoint must contain only casts after the checkpoint');
      }
    }

    const groups = [...retainedGroups, ...groupsAfterCheckpoint];
    const retainedCastIds = new Set([
      ...historicalCastIds,
      ...retainedGroups.flatMap(group => group.castIds),
    ]);
    const customSkillPrograms = [
      ...[...this.#customSkillProgramsByCastId.values()].filter(binding =>
        retainedCastIds.has(binding.castId),
      ),
      ...customSkillProgramsAfterCheckpoint,
    ];
    let skills: CombatInputRuntimeState | undefined;
    if (groups.length > 0 || continuationPlan !== undefined) {
      const base =
        saved.skills ??
        (() => {
          const consumed = prefix.flatMap(input =>
            (input.skills ?? []).map(skill => ({ ...skill, frame: input.frame })),
          );
          return {
            nextInputIndex: consumed.length,
            previousFixedInput: consumed.at(-1) ?? null,
            continuation: { nextIndex: 1, previous: null, stopped: false },
            groups: [],
          } satisfies CombatInputRuntimeState;
        })();
      skills = {
        ...structuredClone(base),
        continuation: { nextIndex: 1, previous: null, stopped: false },
        groups: [
          ...retainedGroupStates,
          ...groupsAfterCheckpoint.map(group => ({
            anchorCastId: group.anchorCastId,
            nextIndex: 0,
            previous: null,
            stopped: false,
          })),
        ],
      };
    }
    return new CombatInputSchedule(
      this.session.fork(saved.combat),
      [...prefix, ...inputsAfterCheckpoint],
      groups,
      customSkillPrograms,
      {
        [scheduleRestoration]: { nextIndex: saved.nextIndex, skills },
      },
      continuationPlan,
    );
  }

  discardCheckpoint(checkpoint: CombatInputScheduleCheckpoint): void {
    const saved = this.#checkpoints.get(checkpoint);
    if (saved === undefined) throw new Error('checkpoint does not belong to this input schedule');
    this.session.runtime.discardCheckpoint(saved.combat);
    this.#checkpoints.delete(checkpoint);
  }

  #frameInput(input?: ScheduledCombatFrameInput): CombatFrameInput {
    if (this.#skills === undefined && this.#customSkillProgramsByCastId.size === 0)
      return input ?? {};
    return {
      ...input,
      skills: phase => {
        if (this.#skills === undefined) {
          for (const skill of input?.skills ?? []) {
            this.#submitSkill(phase, { ...skill, frame: input!.frame }, input!.frame);
          }
        } else {
          this.#phase = phase;
          try {
            this.#skills.applyCurrentFrame();
          } finally {
            this.#phase = undefined;
          }
        }
      },
    };
  }

  #submitSkill(
    phase: CombatSkillInputPhase,
    input: ScheduledSkillInput,
    actualFrame: number,
  ): boolean {
    if (input.castId !== undefined) {
      const binding = this.#customSkillProgramsByCastId.get(input.castId);
      if (binding !== undefined) return phase.submit(input, actualFrame, binding);
    }
    return phase.submit(input, actualFrame);
  }

  #assertCurrent(): void {
    const runtime = this.session.runtime;
    if (runtime.generation !== this.#generation) {
      throw new Error('candidate schedule belongs to a previous combat generation');
    }
    if (
      runtime.frame !== this.#expectedFrame ||
      runtime.initialInputPending !== this.#expectedInitialInputPending
    ) {
      throw new Error('combat session advanced outside its candidate schedule');
    }
  }

  advanceToFrame(endFrame: number): void {
    const runtime = this.session.runtime;
    this.#assertCurrent();
    if (!Number.isSafeInteger(endFrame) || endFrame < runtime.frame) {
      throw new RangeError('candidate end frame must be at or after the current frame');
    }
    if (runtime.initialInputPending) {
      const input = this.#inputs[this.#nextIndex];
      runtime.applyInitialInput(
        this.#frameInput(input?.frame === runtime.frame ? input : undefined),
      );
      if (input?.frame === runtime.frame) this.#nextIndex += 1;
    }
    if (this.#skills !== undefined) {
      while (runtime.frame < endFrame) {
        const input = this.#inputs[this.#nextIndex];
        const due = input?.frame === runtime.frame + 1;
        runtime.advanceInputFrame(this.#frameInput(due ? input : undefined));
        if (due) this.#nextIndex += 1;
      }
    }
    while (this.#nextIndex < this.#inputs.length) {
      const input = this.#inputs[this.#nextIndex]!;
      if (input.frame > endFrame) break;
      this.session.advanceToFrame(input.frame - 1);
      runtime.advanceInputFrame(input);
      this.#nextIndex += 1;
    }
    this.session.advanceToFrame(endFrame);
    this.#expectedFrame = runtime.frame;
    this.#expectedInitialInputPending = runtime.initialInputPending;
  }
}
