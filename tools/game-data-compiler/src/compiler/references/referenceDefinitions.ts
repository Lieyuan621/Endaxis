import {
  collectBuffActionReferences,
  type BuffActionGraphSource,
} from '../../source/buffActionGraph.ts';
import {
  type ReferenceAwareActionLeafSource,
  type SkillDefinitionReferenceSource,
} from '../../source/referenceGraph.ts';
import type { DefinitionReferenceNodeSource } from './referenceClosure.ts';
import { parseReferenceAwareBuffActionGraphSource } from '../../source/buffActionGraph.ts';
import { requireRecord } from '../../source/primitives.ts';
import { parseSkillPatchSource } from '../../source/skillPatch.ts';
import { prepareSkillDefinitionInputSource } from '../skills/skillDefinitionInput.ts';
import { parseSkillDefinitionReferenceSource } from '../../source/referenceGraph.ts';
import {
  compileAbilityEntityTemplateCatalogSource,
  type CompiledAbilityEntityTemplateCatalogSource,
} from '../abilities/abilityEntityCatalog.ts';

/**
 * 把已经严格读取的 SkillData 接到公共定义图。根 Buff 引用已经包含在 references 中，
 * 这里不能只从动作图重新收集，否则会静默丢掉附属、条件切换和换技 Buff。
 */
export function createSkillDefinitionReferenceNode(
  source: SkillDefinitionReferenceSource,
  sourcePath: string,
): DefinitionReferenceNodeSource {
  return {
    kind: 'skill',
    id: source.actionGraph.skillId,
    sourcePath,
    references: source.references,
  };
}

/**
 * 按定义 ID 懒加载一个被其他 Skill/Buff 引用的 SkillData。子技能与主动/被动入口共用
 * SkillPatch 和声明黑板解析，不能为了闭包审计建立“只看 ID”的宽松旁路。
 */
export function compileReferencedSkillDefinitionNode(
  skillId: string,
  skillDataValue: unknown,
  skillPatchValue: unknown,
  sourceName = 'SkillData',
): DefinitionReferenceNodeSource {
  const skillData = requireRecord(skillDataValue, sourceName);
  const skillPatches = requireRecord(skillPatchValue, 'SkillPatchTable');
  const sourcePath = `${sourceName}.${skillId}`;
  if (!(skillId in skillData)) {
    throw new Error(`${sourcePath}: missing referenced SkillData definition`);
  }
  const patch =
    skillId in skillPatches ? parseSkillPatchSource(skillPatches[skillId], skillId) : null;
  const prepared = prepareSkillDefinitionInputSource(skillData[skillId], sourcePath, patch);
  const definition = parseSkillDefinitionReferenceSource(
    skillData[skillId],
    sourcePath,
    prepared.blackboard.values,
  );
  if (definition.actionGraph.skillId !== skillId) {
    throw new Error(
      `${sourcePath}.skillId: expected ${JSON.stringify(skillId)}, got ${JSON.stringify(definition.actionGraph.skillId)}`,
    );
  }
  return createSkillDefinitionReferenceNode(definition, sourcePath);
}

/** BuffData 与 SkillData 共用同一动作叶子和引用边模型，只保留定义容器自身的差异。 */
export function createBuffDefinitionReferenceNode(
  source: BuffActionGraphSource<ReferenceAwareActionLeafSource>,
  sourcePath: string,
): DefinitionReferenceNodeSource {
  return {
    kind: 'buff',
    id: source.buffId,
    sourcePath,
    references: collectBuffActionReferences(source),
  };
}

/** 一次解析完整 BuffData 定义索引，供多个领域闭包复用，避免逐内容重复扫描。 */
export function parseBuffDefinitionReferenceNodes(
  value: unknown,
  sourceName = 'BuffData',
): DefinitionReferenceNodeSource[] {
  const table = requireRecord(value, sourceName);
  return Object.keys(table)
    .sort((left, right) => left.localeCompare(right))
    .map(buffId => {
      const sourcePath = `${sourceName}.${buffId}`;
      const graph = parseReferenceAwareBuffActionGraphSource(table[buffId], sourcePath, {});
      if (graph.buffId !== buffId) {
        throw new Error(`${sourcePath}.id: expected ${JSON.stringify(buffId)}`);
      }
      return createBuffDefinitionReferenceNode(graph, sourcePath);
    });
}

/**
 * ProjectileComponentData 当前只用于关闭“发射哪个模板”的静态身份边。组件字段的行为
 * 投影仍由后续领域编译器负责；这里绝不把未知字段猜成额外引用。
 */
export function parseProjectileDefinitionReferenceNodes(
  value: unknown,
  sourceName = 'ProjectileData',
): DefinitionReferenceNodeSource[] {
  return parseTerminalDefinitionReferenceNodes(value, 'projectile', 'id', sourceName);
}

/**
 * AbilityEntityTemplateData 兼容资源只包含已证实的逻辑前缀。它能证明模板身份存在，
 * 但不会声称尚未解码的组件列表没有行为；组件语义属于后续显式编译阶段。
 */
export function parseAbilityEntityDefinitionReferenceNodes(
  value: unknown,
  sourceName = 'AbilityEntityData',
): DefinitionReferenceNodeSource[] {
  return createAbilityEntityDefinitionReferenceNodes(
    compileAbilityEntityTemplateCatalogSource(value, sourceName),
    sourceName,
  );
}

/** 从已严格编译的公共模板目录派生定义图节点，避免正式闭包再次解析同一份原始资产。 */
export function createAbilityEntityDefinitionReferenceNodes(
  catalog: CompiledAbilityEntityTemplateCatalogSource,
  sourceName = 'AbilityEntityData',
): DefinitionReferenceNodeSource[] {
  return catalog.templates.map(definition => ({
    kind: 'abilityEntity',
    id: definition.gameId,
    sourcePath: `${sourceName}.${definition.gameId}`,
    references: [],
  }));
}

function parseTerminalDefinitionReferenceNodes(
  value: unknown,
  kind: 'projectile' | 'abilityEntity',
  identityField: string,
  sourceName: string,
): DefinitionReferenceNodeSource[] {
  const table = requireRecord(value, sourceName);
  return Object.keys(table)
    .sort((left, right) => left.localeCompare(right))
    .map(id => {
      const sourcePath = `${sourceName}.${id}`;
      const definition = requireRecord(table[id], sourcePath);
      const definitionId = definition[identityField];
      if (definitionId !== id) {
        throw new Error(
          `${sourcePath}.${identityField}: expected ${JSON.stringify(id)}, got ${JSON.stringify(definitionId)}`,
        );
      }
      return { kind, id, sourcePath, references: [] };
    });
}
