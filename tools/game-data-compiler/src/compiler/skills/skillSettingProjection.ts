import type { SkillSettingReadActionSource } from '../../source/skillSettingActions.ts';
import type { SkillSettingCatalogSource } from '../../source/skillSettingCatalog.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import type { CompiledBuffStepSource } from '../actions/combatActionProjectionTypes.ts';
import {
  actionValueOperand,
  requireActionOwnerProjection,
  type CombatActionProjectionContextSource,
  type CombatActionProjectionExtensionsSource,
} from '../combatProjectionCommon.ts';

export function createSkillSettingProjectionExtensions(
  catalog: SkillSettingCatalogSource,
): CombatActionProjectionExtensionsSource {
  return {
    compileSkillSettingRead: (action, sourcePath, context) => [
      compileSkillSettingRead(action, sourcePath, context, catalog),
    ],
  };
}

function compileSkillSettingRead(
  action: SkillSettingReadActionSource,
  sourcePath: string,
  context: CombatActionProjectionContextSource,
  catalog: SkillSettingCatalogSource,
): CompiledBuffStepSource {
  return {
    kind: 'readSkillSettingData',
    parameters: {
      items: action.items.map((item, index) => {
        const itemPath = `${sourcePath}.dataList[${index}]`;
        const setting = catalog.data.get(item.dataKey);
        if (setting === undefined) {
          throw new Error(`${itemPath}: missing SkillSetting ${JSON.stringify(item.dataKey)}`);
        }
        const enhanceTarget = projectEnhanceTarget(item.enhanceAttributeSource, context, itemPath);
        const formula =
          setting.enhanceFormulaKey === ''
            ? undefined
            : catalog.formulas.get(setting.enhanceFormulaKey);
        if (formula === undefined && setting.enhanceFormulaKey !== '') {
          throw new Error(`${itemPath}: missing enhance formula ${setting.enhanceFormulaKey}`);
        }
        return {
          values: setting.values,
          column: actionValueOperand(item.column),
          storeKey: item.storeKey,
          ...(formula === undefined || formula.kind === 'none'
            ? {}
            : { enhance: { target: enhanceTarget, formula } }),
        };
      }),
    },
  };
}

function projectEnhanceTarget(
  target: TargetReferenceSource,
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): 'caster' | 'buffOwner' | 'buffSource' {
  if (
    target.targetGroupKey !== '' ||
    target.finderType !== null ||
    target.validatorTypes.length !== 0 ||
    target.postProcessorTypes.length !== 0
  ) {
    throw new Error(`${sourcePath}: unsupported SkillSetting enhance target selector`);
  }
  if (target.targetSource === 'Owner') {
    const owner = requireActionOwnerProjection(context, sourcePath);
    if (owner === 'currentAbilityEntity')
      throw new Error(`${sourcePath}: AbilityEntity SkillSetting enhance target is unsupported`);
    return owner;
  }
  if (target.targetSource === 'Source') return context.actionSourceTarget;
  throw new Error(`${sourcePath}: unsupported SkillSetting enhance target ${target.targetSource}`);
}
