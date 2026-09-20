import { type NativeActionNodeSource, type NativeSequenceSource } from './controlFlow.ts';
import {
  nativeActionName,
  requireArray,
  requireBoolean,
  requireExactFields,
  requireNonEmptyString,
  requireRecord,
} from './primitives.ts';
import { parseSkillBuffInstallSources } from './skillBuffInstall.ts';
import { isToggleBuffSkillSource } from './skillDispatch.ts';
import type { BlackboardLevelValues } from './scalar.ts';
import { parseSkillActionGraphSource, type SkillActionGraphSource } from './skillActionGraph.ts';
import {
  tryParseKnownNativeActionLeafSource,
  type KnownNativeActionLeafSource,
} from './actionLeaf.ts';

export type DefinitionReferenceKind =
  'buff' | 'skill' | 'abilityEntity' | 'projectile' | 'globalBuff';
export type DefinitionReferenceState = 'active' | 'inactive' | 'dynamic' | 'empty';

export interface DefinitionReferenceSource {
  readonly kind: DefinitionReferenceKind;
  readonly usage: string;
  readonly state: DefinitionReferenceState;
  readonly id: string | null;
  readonly blackboardKey: string | null;
  readonly sourcePath: string;
}

export interface SkillDefinitionReferenceSource {
  readonly actionGraph: SkillActionGraphSource<ReferenceAwareActionLeafSource>;
  readonly references: readonly DefinitionReferenceSource[];
}

export type ReferenceAwareActionLeafSource =
  KnownNativeActionLeafSource | { readonly family: 'untracked'; readonly nativeName: string };

/**
 * 引用闭包专用的 SkillData 切片。只严格展开会形成定义引用的动作；其余叶子保留类型身份，
 * 避免引用审计被尚未迁移的表现动作阻断。
 */
export function parseReferenceAwareSkillActionGraphSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillActionGraphSource<ReferenceAwareActionLeafSource> {
  return parseSkillActionGraphSource(value, sourcePath, inheritedBlackboard, (leaf, leafPath) =>
    parseReferenceAwareActionLeafSource(leaf, leafPath, inheritedBlackboard),
  );
}

export function parseReferenceAwareActionLeafSource(
  leaf: unknown,
  leafPath: string,
  inheritedBlackboard: BlackboardLevelValues,
): ReferenceAwareActionLeafSource {
  const action = requireRecord(leaf, leafPath);
  const nativeName = nativeActionName(requireNonEmptyString(action.$type, `${leafPath}.$type`));
  return (
    tryParseKnownNativeActionLeafSource(
      leaf,
      leafPath,
      inheritedBlackboard,
      'referenceClosure',
    ) ?? {
      family: 'untracked',
      nativeName,
    }
  );
}

/** 读取技能根 Buff 与动作图引用；条件安装的 Buff 仍是定义闭包中的活动依赖。 */
export function parseSkillDefinitionReferenceSource(
  value: unknown,
  sourcePath: string,
  inheritedBlackboard: BlackboardLevelValues,
): SkillDefinitionReferenceSource {
  const actionGraph = parseReferenceAwareSkillActionGraphSource(
    value,
    sourcePath,
    inheritedBlackboard,
  );
  return {
    actionGraph,
    references: [
      ...collectSkillRootBuffReferences(value, sourcePath),
      ...collectSkillActionReferences(actionGraph),
    ],
  };
}

export function collectSkillRootBuffReferences(
  value: unknown,
  sourcePath: string,
): DefinitionReferenceSource[] {
  const root = requireRecord(value, sourcePath);
  const output: DefinitionReferenceSource[] = [];
  const isToggleBuff = isToggleBuffSkillSource(root, sourcePath);
  // ToggleBuffPassiveSkill.DoEnable 覆盖普通 Skill.DoEnable，只读取 +0xD8 toggleBuffs，
  // 不读取 +0xD0 buffs；该字段中的公共 spirit Buff 是死引用，不得进入闭包。
  if (!isToggleBuff) {
    collectRootBuffEntries(root.buffs, `${sourcePath}.buffs`, 'attached', output);
  } else {
    requireArray(root.buffs, `${sourcePath}.buffs`);
  }
  const toggleBuffs = requireArray(root.toggleBuffs, `${sourcePath}.toggleBuffs`);
  // Skill.Create 只在 Passive + ToggleBuff 时创建会读取 toggleBuffs 的运行时子类。
  // 其他被动定义中的同名字段是无效序列化残留，不得形成假的 Buff 依赖。
  if (isToggleBuff) {
    toggleBuffs.forEach((rawGroup, groupIndex) => {
      const groupPath = `${sourcePath}.toggleBuffs[${groupIndex}]`;
      const group = requireRecord(rawGroup, groupPath);
      requireExactFields(group, new Set(['conditions', 'buffs']), groupPath);
      requireArray(group.conditions, `${groupPath}.conditions`);
      collectRootBuffEntries(group.buffs, `${groupPath}.buffs`, 'toggle', output);
    });
  }
  const switchConfig = requireRecord(root.switchToBuffConfig, `${sourcePath}.switchToBuffConfig`);
  requireExactFields(
    switchConfig,
    new Set(['condition', 'buffs', 'buffSource', 'targets', 'asSkillCast']),
    `${sourcePath}.switchToBuffConfig`,
  );
  requireRecord(switchConfig.condition, `${sourcePath}.switchToBuffConfig.condition`);
  requireRecord(switchConfig.buffSource, `${sourcePath}.switchToBuffConfig.buffSource`);
  requireRecord(switchConfig.targets, `${sourcePath}.switchToBuffConfig.targets`);
  requireBoolean(switchConfig.asSkillCast, `${sourcePath}.switchToBuffConfig.asSkillCast`);
  collectRootBuffEntries(
    switchConfig.buffs,
    `${sourcePath}.switchToBuffConfig.buffs`,
    'switch',
    output,
  );
  return output;
}

export function collectSkillActionReferences(
  graph: SkillActionGraphSource<ReferenceAwareActionLeafSource>,
): DefinitionReferenceSource[] {
  const references: DefinitionReferenceSource[] = [];
  for (const timeline of graph.actionGroup.timelineActions) {
    collectSequenceReferences(timeline.sequence, true, references);
  }
  for (const event of graph.actionGroup.passiveEvents) {
    for (const sequence of event.actions) collectSequenceReferences(sequence, true, references);
  }
  return references;
}

function collectSequenceReferences(
  sequence: NativeSequenceSource<ReferenceAwareActionLeafSource>,
  parentEnabled: boolean,
  output: DefinitionReferenceSource[],
): void {
  for (const node of sequence.actions) collectNodeReferences(node, parentEnabled, output);
}

function collectNodeReferences(
  node: NativeActionNodeSource<ReferenceAwareActionLeafSource>,
  parentEnabled: boolean,
  output: DefinitionReferenceSource[],
): void {
  const enabled = parentEnabled && node.metadata.enabled;
  const body = node.body;
  switch (body.kind) {
    case 'leaf':
      collectLeafReferences(body.value, node.sourcePath, enabled, output);
      return;
    case 'ifElse':
      collectSequenceReferences(body.condition, enabled, output);
      collectSequenceReferences(body.whenTrue, enabled, output);
      collectSequenceReferences(body.whenFalse, enabled, output);
      return;
    case 'switch':
      for (const option of body.options) collectSequenceReferences(option.action, enabled, output);
      return;
    case 'once':
    case 'forEach':
      collectSequenceReferences(body.action, enabled, output);
      return;
    case 'channeling':
    case 'tickInterval':
    case 'tickIntervalV2':
      collectSequenceReferences(body.actionOnTick, enabled, output);
      return;
    case 'timelineJump':
      collectSequenceReferences(body.condition, enabled, output);
      return;
    case 'negateNextResult':
      return;
  }
}

function collectLeafReferences(
  leaf: ReferenceAwareActionLeafSource,
  sourcePath: string,
  enabled: boolean,
  output: DefinitionReferenceSource[],
): void {
  if (leaf.family === 'untracked') return;
  switch (leaf.family) {
    case 'physicalInfliction': {
      // 原生 OnlyDead 分支直接跳过目标；保留无效引用用于审计，不伪装成活动闭包。
      const active = enabled && leaf.action.deadOption !== 'OnlyDead';
      const statusBuffId =
        leaf.action.kind === 'knockDown'
          ? 'buff_physical_knockdown'
          : leaf.action.kind === 'airborne'
            ? 'buff_physical_airborne'
            : leaf.action.kind === 'fracture'
              ? 'buff_physical_fracture'
              : 'buff_physical_crushed';
      output.push(
        referenceFromIdentity('buff', 'physicalStatus', active, statusBuffId, null, sourcePath),
      );
      // force 只绕过根动作的破防门；载体自身的依赖仍由 Buff 图继续展开。
      if (
        (leaf.action.kind !== 'knockDown' || !leaf.action.forceKnockDown) &&
        (leaf.action.kind !== 'airborne' || !leaf.action.forceAirborne)
      ) {
        output.push(
          referenceFromIdentity(
            'buff',
            'physicalNoGuardGate',
            active,
            'buff_physical_no_guard',
            null,
            sourcePath,
          ),
        );
      }
      return;
    }
    case 'keywordBuff': {
      const action = leaf.action;
      output.push(
        referenceFromIdentity(
          'buff',
          'keywordCarrier',
          enabled,
          action.carrierBuffId,
          null,
          sourcePath,
        ),
      );
      // 未覆盖时由载体自己的黑板提供默认 child；不能把空白的动作字段当成实际依赖。
      if (
        action.overrideChildBuffId &&
        (action.childBuffId.blackboardKey !== null || action.childBuffId.value !== '')
      ) {
        output.push(
          referenceFromIdentity(
            'buff',
            'keywordChildOverride',
            enabled,
            action.childBuffId.value,
            action.childBuffId.blackboardKey,
            `${sourcePath}.childBuffId`,
          ),
        );
      }
      action.enhancements.forEach((enhancement, index) => {
        enhancement.buffIds.forEach((id, idIndex) => {
          output.push(
            referenceFromIdentity(
              'buff',
              'keywordEnhancementMatch',
              enabled,
              id,
              null,
              `${sourcePath}.enhancingList[${index}].buffIds[${idIndex}]`,
            ),
          );
        });
      });
      return;
    }
    case 'aura': {
      if (leaf.action.kind === 'directRangedAura') {
        collectSequenceReferences(leaf.action.actionOnEnter, enabled, output);
        return;
      }
      for (let index = 0; index < leaf.action.buffs.length; index += 1) {
        output.push(
          referenceFromIdentity(
            'buff',
            'aura',
            enabled,
            leaf.action.buffs[index]!.buffId,
            null,
            `${sourcePath}.buffInput[${index}]`,
          ),
        );
      }
      return;
    }
    case 'buffApplication': {
      const action = leaf.action;
      for (let index = 0; index < action.buffs.length; index += 1) {
        const buff = action.buffs[index]!;
        output.push(
          referenceFromIdentity(
            'buff',
            'apply',
            enabled,
            buff.buffId,
            buff.readIdFromBlackboard ? buff.buffIdKey : null,
            `${sourcePath}.buffs[${index}]`,
          ),
        );
      }
      for (let index = 0; index < action.inheritSkillIds.length; index += 1) {
        output.push(
          referenceFromIdentity(
            'skill',
            'buffInheritance',
            enabled,
            action.inheritSkillIds[index]!,
            null,
            `${sourcePath}.inheritSkillIdList[${index}]`,
          ),
        );
      }
      return;
    }
    case 'forcedElementalStatus': {
      const ids = {
        Fire: 'buff_common_fire_fire_burning_triggered',
        Pulse: 'buff_common_pulse_pulse_conduct_triggered',
        Cryst: 'buff_common_cryst_cryst_frozen_triggered',
        Natural: 'buff_common_natural_natural_corrupt_triggered',
      } as const;
      output.push(
        referenceFromIdentity(
          'buff',
          'apply',
          enabled,
          ids[leaf.action.statusElement],
          null,
          `${sourcePath}.spellStatusType`,
        ),
      );
      return;
    }
    case 'buffInheritance': {
      const action = leaf.action;
      output.push(
        referenceFromIdentity(
          'buff',
          'inherit',
          enabled,
          action.targetBuffId,
          null,
          `${sourcePath}.targetBuffId`,
        ),
      );
      action.inheritSkillIds.forEach((skillId, index) => {
        output.push(
          referenceFromIdentity(
            'skill',
            'buffInheritance',
            enabled,
            skillId,
            null,
            `${sourcePath}.inheritSkillIdList[${index}]`,
          ),
        );
      });
      return;
    }
    case 'globalBuff': {
      const action = leaf.action;
      if (action.kind !== 'createGlobalBuff') return;
      action.globalBuffs.forEach((entry, index) => {
        output.push(
          referenceFromIdentity(
            'globalBuff',
            'create',
            enabled,
            entry.globalBuffId,
            null,
            `${sourcePath}.globalBuffs[${index}].globalBuffId`,
          ),
        );
      });
      return;
    }
    case 'buffFinish': {
      const action = leaf.action;
      if (action.kind === 'buffFinishById') {
        for (let index = 0; index < action.buffIds.length; index += 1) {
          output.push(
            referenceFromIdentity(
              'buff',
              'finish',
              enabled,
              action.buffIds[index]!,
              null,
              `${sourcePath}.buffIds[${index}]`,
            ),
          );
        }
      } else {
        // FinishBuffAdvanced 的 buffIdList 只在 Id 判别分支表示静态定义引用。
        // Tag/Environment 分支中的空字符串是序列化占位，不是动态 Buff ID。
        if (action.settings.checkType !== 'Id') return;
        for (let index = 0; index < action.settings.buffIds.length; index += 1) {
          output.push(
            referenceFromIdentity(
              'buff',
              'finishQuery',
              enabled,
              action.settings.buffIds[index]!,
              null,
              `${sourcePath}.buffSettings.buffIdList[${index}]`,
            ),
          );
        }
      }
      return;
    }
    case 'projectile': {
      const action = leaf.action;
      output.push(
        referenceFromIdentity(
          'projectile',
          'launch',
          enabled,
          action.projectileId,
          null,
          `${sourcePath}.projectileId`,
        ),
      );
      for (const callback of action.callbacks) {
        const idField = {
          block: 'skillIdOnBlock',
          finish: 'skillIdOnFinish',
          hit: 'projectileSkillId',
          reach: 'skillIdOnReach',
        }[callback.event];
        output.push(
          referenceFromIdentity(
            'skill',
            `projectile:${callback.event}`,
            enabled && callback.enabled,
            callback.skillId,
            null,
            `${sourcePath}.${idField}`,
          ),
        );
      }
      return;
    }
    case 'abilityEntity': {
      const action = leaf.action;
      output.push(
        referenceFromIdentity(
          'abilityEntity',
          'spawn',
          enabled,
          action.abilityEntityId,
          null,
          `${sourcePath}.abilityEntityId`,
        ),
      );
      output.push(
        referenceFromIdentity(
          'skill',
          'abilityEntitySkill',
          enabled,
          action.skillId,
          null,
          `${sourcePath}.abilityEntitySkillId`,
        ),
      );
      return;
    }
    case 'skillCast': {
      const action = leaf.action;
      output.push(
        referenceFromIdentity(
          'skill',
          'cast',
          enabled,
          action.skillId.value,
          action.skillId.blackboardKey,
          `${sourcePath}.skillId`,
        ),
      );
      return;
    }
    case 'presentation': {
      const action = leaf.action;
      if (action.kind !== 'playAnimation' || action.onEnd === undefined) return;
      action.onEnd.buffApplications.forEach((application, applicationIndex) => {
        application.buffs.forEach((buff, buffIndex) => {
          output.push(
            referenceFromIdentity(
              'buff',
              'animationEnd',
              enabled,
              buff.buffId,
              buff.readIdFromBlackboard ? buff.buffIdKey : null,
              `${sourcePath}.onEndAction.buffApplications[${applicationIndex}].buffs[${buffIndex}]`,
            ),
          );
        });
      });
      return;
    }
    default:
      return;
  }
}

function collectRootBuffEntries(
  value: unknown,
  path: string,
  usage: string,
  output: DefinitionReferenceSource[],
): void {
  parseSkillBuffInstallSources(value, path).forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    output.push(
      referenceFromIdentity('buff', usage, true, entry.buffId, null, `${entryPath}.buffId`),
    );
  });
}

function referenceFromIdentity(
  kind: DefinitionReferenceKind,
  usage: string,
  enabled: boolean,
  id: string,
  blackboardKey: string | null,
  sourcePath: string,
): DefinitionReferenceSource {
  const state: DefinitionReferenceState = !enabled
    ? 'inactive'
    : blackboardKey
      ? 'dynamic'
      : id
        ? 'active'
        : 'empty';
  return { kind, usage, state, id: id || null, blackboardKey, sourcePath };
}
