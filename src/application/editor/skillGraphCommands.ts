import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills.ts';
/** 技能图的场景编辑命令；逻辑和排版一起提交，排版独立保存，不写入技能程序。 */
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { validateActionGraphOwner } from '../../core/action-graph/actionGraphValidation';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';

import { validateSkillDefinition } from '../../core/game-data/validateSkillDefinition';
import { resolveEffectiveSkillDefinition } from '../../core/compiler/resolveSkillDefinition';
import type { ScenarioDocument } from '../../core/project/schema';
import type { ScenarioCommand } from './scenarioEditorSession';
import type { SkillGraphPresentation } from '../../core/project/graphPresentation';
import { copyCustomGraphDocument, freezeGraphDocument } from './immutableGraphDocument';

/** 宏名称只在该技能自己的资源内解析，不能跨宿主编辑同名技能。 */
export type SkillGraphAddress =
  | { readonly kind: 'main' }
  | {
      readonly kind: 'macro';
      readonly macroId: string;
    };

function requireSkillActionGraph(skill: SkillDefinition): void {
  if (
    !('actionGraph' in skill) ||
    skill.actionGraph === null ||
    typeof skill.actionGraph !== 'object' ||
    !('main' in skill.actionGraph) ||
    !('macros' in skill.actionGraph)
  ) {
    throw new Error(`skill '${skill.key}' has no action graph`);
  }
}

/** 批量改动同一张图后一次校验，允许接线和删除节点在同一事务完成。 */
export function updateSkillGraph(
  skill: SkillDefinition,
  address: SkillGraphAddress,
  update: (graph: ActionGraphDefinition) => ActionGraphDefinition,
): SkillDefinition {
  requireSkillActionGraph(skill);
  const resource = skill.actionGraph;
  const macro =
    address.kind === 'macro' && Object.hasOwn(resource.macros, address.macroId)
      ? resource.macros[address.macroId]
      : undefined;
  if (address.kind === 'macro' && macro === undefined)
    throw new Error(`skill '${skill.key}' has no macro '${address.macroId}'`);
  const previous = macro?.graph ?? resource.main;
  // 与 ScenarioCommand 相同：调用方必须不可变更新，原引用表示没有改动。
  const next = update(freezeGraphDocument(previous));
  if (next === previous) return skill;
  const changed: SkillDefinition = {
    ...skill,
    actionGraph:
      address.kind === 'main'
        ? { ...resource, main: next }
        : {
            ...resource,
            macros: { ...resource.macros, [address.macroId]: { ...macro!, graph: next } },
          },
  };
  const issues = validateSkillDefinition(changed, `skill.${skill.key}`);
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  validateActionGraphOwner(changed, `skill.${skill.key}`);
  return changed;
}

function findSkillCast(
  repository: Pick<GameDataRepository, 'getOperator'>,
  scenario: ScenarioDocument,
  castId: string,
) {
  const matches = scenario.tracks.flatMap(track =>
    track === null
      ? []
      : track.skillCasts.filter(cast => cast.id === castId).map(cast => ({ track, cast })),
  );
  if (matches.length !== 1) throw new Error(`expected exactly one skill cast '${castId}'`);
  const { track, cast } = matches[0]!;
  const source = cast.source;
  if (source.kind !== 'operatorSkill')
    throw new Error(`skill cast '${castId}' uses unsupported source kind '${source.kind}'`);
  const operator =
    track.operator === null ? null : repository.getOperator(track.operator.operatorSlug);
  if (operator === null) throw new Error(`skill cast '${castId}' has no operator definition`);
  const { definition } = resolveEffectiveSkillDefinition(cast, operator);
  return { track, cast, source, definition };
}

/** JSON 定义按字段比较；编辑器的响应式代理或深拷贝不应被误判为并发改动。 */
function sameDefinition(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object')
    return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return (
    keys.length === Object.keys(rightRecord).length &&
    keys.every(
      key => Object.hasOwn(rightRecord, key) && sameDefinition(leftRecord[key], rightRecord[key]),
    )
  );
}

/**
 * 一次保存完整技能覆盖。expectedDefinition 是打开编辑器时的定义，可防止覆盖之后的修改；
 * 提交前再次按目标技能身份和正式契约校验，撤销与继承约束由场景会话统一负责。
 */
export function replaceSkillCastDefinition(
  repository: Pick<GameDataRepository, 'getOperator'>,
  castId: string,
  definition: SkillDefinition,
  expectedDefinition?: SkillDefinition,
  presentation?: SkillGraphPresentation,
  createCustom = false,
): ScenarioCommand {
  return scenario => {
    const current = findSkillCast(repository, scenario, castId);
    if (expectedDefinition !== undefined && !sameDefinition(current.definition, expectedDefinition))
      throw new Error(`skill cast '${castId}' changed after the editor was opened`);
    if (definition.key !== current.source.skillKey)
      throw new Error(
        `custom definition key '${definition.key}' does not match source skill key '${current.source.skillKey}'`,
      );
    requireSkillActionGraph(definition);
    const issues = validateSkillDefinition(definition, `skill.${definition.key}`);
    if (issues.length)
      throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
    validateActionGraphOwner(definition, `skill.${definition.key}`);
    const definitionChanged = !sameDefinition(current.definition, definition);
    if (definitionChanged && !createCustom && current.cast.customDefinition === undefined)
      throw new Error('库图只读，请先选择自定义。');
    // 库图只按当前算法临时布局；只有已有或本次产生的自定义图保存坐标。
    const canSavePresentation = createCustom || current.cast.customDefinition !== undefined;
    const presentationChanged =
      canSavePresentation &&
      presentation !== undefined &&
      !sameDefinition(current.cast.presentation?.graph, presentation);
    if (!definitionChanged && !presentationChanged && !createCustom) return scenario;
    const tracks = [...scenario.tracks];
    tracks[scenario.tracks.indexOf(current.track)] = {
      ...current.track,
      skillCasts: current.track.skillCasts.map(candidate =>
        candidate === current.cast
          ? {
              ...candidate,
              ...(definitionChanged || createCustom
                ? { customDefinition: copyCustomGraphDocument(definition) }
                : {}),
              ...(presentationChanged
                ? {
                    presentation: {
                      ...candidate.presentation,
                      graph: copyCustomGraphDocument(presentation),
                    },
                  }
                : {}),
            }
          : candidate,
      ),
    };
    return { ...scenario, tracks: [tracks[0]!, tracks[1]!, tracks[2]!, tracks[3]!] };
  };
}

/** 修改一个已放置技能的局部覆盖；提交、撤销和继承边界由 ScenarioEditingSession 管理。 */
export function editSkillCastGraph(
  repository: Pick<GameDataRepository, 'getOperator'>,
  castId: string,
  address: SkillGraphAddress,
  update: (graph: ActionGraphDefinition) => ActionGraphDefinition,
): ScenarioCommand {
  return scenario => {
    if (findSkillCast(repository, scenario, castId).cast.customDefinition === undefined)
      throw new Error('库图只读，请先选择自定义。');
    const { definition } = findSkillCast(repository, scenario, castId);
    requireSkillActionGraph(definition);
    const changed = updateSkillGraph(definition, address, update);
    if (changed === definition) return scenario;
    return replaceSkillCastDefinition(repository, castId, changed, definition)(scenario);
  };
}
