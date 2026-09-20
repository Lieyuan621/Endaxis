import type { ScenarioDocument } from '../../../core/project/schema';
import type { ScenarioSimulationService } from '../../../application/simulation/scenarioSimulationService';
import type { PlaceSkillGroupResult } from './placeSkillGroup';

/** 只管理异步放置的身份与过期检查，不解释任何技能接续规则。 */
export class SkillPlacementTransaction {
  #request = 0;
  #controller: AbortController | null = null;

  constructor(
    readonly service: Pick<ScenarioSimulationService, 'planSkillChain'>,
    readonly getRevision: () => number,
  ) {}

  cancel(): boolean {
    const pending = this.#controller !== null;
    this.#controller?.abort();
    this.#controller = null;
    this.#request++;
    return pending;
  }

  async resolve(
    placed: PlaceSkillGroupResult,
    mode: 'continuation' | 'compact' = 'continuation',
  ): Promise<{
    readonly scenario: ScenarioDocument;
    readonly incomplete: boolean;
    readonly skillCastIds?: readonly string[];
    readonly error?: unknown;
    readonly plannedStartFrames?: ReadonlyMap<string, number>;
  } | null> {
    this.cancel();
    const request = this.#request;
    const revision = this.getRevision();
    const controller = new AbortController();
    this.#controller = controller;
    const isCurrent = () =>
      !controller.signal.aborted && request === this.#request && revision === this.getRevision();
    try {
      if (placed.skillCastIds.length < 2 && placed.extension === undefined)
        return { scenario: placed.scenario, incomplete: false };
      const result = await this.service.planSkillChain(
        placed.scenario,
        placed.skillCastIds,
        placed.scenario.battle.durationFrames,
        controller.signal,
        mode,
        placed.extension,
      );
      if (!isCurrent()) return null;
      return result.status === 'planned'
        ? {
            scenario: result.scenario,
            incomplete: false,
            ...(result.skillCastIds ? { skillCastIds: result.skillCastIds } : {}),
          }
        : {
            scenario: placed.fallback?.scenario ?? result.scenario ?? placed.scenario,
            ...(placed.fallback
              ? { skillCastIds: placed.fallback.skillCastIds }
              : result.skillCastIds
                ? { skillCastIds: result.skillCastIds }
                : {}),
            incomplete: true,
            ...(result.plannedStartFrames === undefined
              ? {}
              : {
                  plannedStartFrames: result.plannedStartFrames,
                }),
          };
    } catch (error) {
      if (!isCurrent()) return null;
      // 规划只是编辑建议。失败保留作者布局及原始错误，不能成为编辑门禁。
      return {
        scenario: placed.fallback?.scenario ?? placed.scenario,
        ...(placed.fallback ? { skillCastIds: placed.fallback.skillCastIds } : {}),
        incomplete: true,
        error,
      };
    } finally {
      if (request === this.#request) this.#controller = null;
    }
  }
}
