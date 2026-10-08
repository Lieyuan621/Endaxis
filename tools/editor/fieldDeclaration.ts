/** Build-only declaration recognition. Runtime receives capabilities, never source positions. */
import ts from 'typescript';
import type {
  FieldDeclarationId,
  FieldDeclarationMetadata,
} from '../../src/core/editor/fieldSemantics.ts';
import { schemaSourceLocation } from './schemaSourceLocation.ts';

const declarationFiles: Readonly<Record<FieldDeclarationId, string>> = {
  'DealDamageParameters.instantAttributeModifiers': 'actions',
  'DealDamageParameters.instantDamageScaleModifiers': 'actions',
  'CombatStepParameters.spawnAbilityEntity.definition': 'actions',
  'CombatStepParameters.applyBuff.keywordEnhancements': 'actions',
  'CombatStepParameters.applyBuff.onActionEndBuffs': 'actions',
  'CombatStepParameters.readSkillSettingData.items': 'actions',
  'CombatStepParameters.createGlobalBuff.definition': 'actions',
  'CombatStepParameters.listenForCombatEvents.responses': 'actions',
  'CombatStepNode.options': 'actions',
  'AbilityEntityDefinition.childSkill': 'skills',
  'AbilityEntityDefinition.childSkills': 'skills',
  'AbilityEntityDefinition.passiveSkills': 'skills',
  'CombatStepParameters.readSkillSettingData.items.values': 'actions',
  'CombatStepParameters.withActionBlackboardScope.initialValues': 'actions',
  'CombatStepParameters.withActionBlackboardScope.entityInitialValues': 'actions',
  'CombatStepParameters.withActionBlackboardScope.entityAssignments': 'actions',
  'CombatStepParameters.applyBuff.blackboardAssignments': 'actions',
  'CombatStepParameters.applyBuff.stringBlackboardAssignments': 'actions',
  'CombatStepParameters.applyBuff.copiedBlackboardAssignments': 'actions',
  'CombatStepParameters.applyBuff.onActionEndBuffs.blackboardAssignments': 'actions',
  'CombatStepParameters.applyBuff.onActionEndBuffs.stringBlackboardAssignments': 'actions',
  'CombatStepParameters.spawnAbilityEntity.blackboardAssignments': 'actions',
  'CombatStepParameters.spawnAbilityEntity.stringBlackboardAssignments': 'actions',
  'CombatStepParameters.createGlobalBuff.blackboardAssignments': 'actions',
  'ActionGraphMacroCall.arguments': 'actionGraph',
  'SkillGlobalBuffChildDefinition.blackboardAssignments': 'buffs',
};

const REFERENCE_DECLARATIONS: Readonly<
  Record<
    string,
    {
      readonly kind: 'gearSet' | 'buff' | 'skillGroup' | 'skillSlot' | 'skill' | 'abilityEntity';
      readonly files: readonly string[];
    }
  >
> = {
  gearSetSlug: { kind: 'gearSet', files: ['equipment'] },
  buffId: { kind: 'buff', files: ['buffs', 'actions', 'operators', 'consumables'] },
  normalBuffId: { kind: 'buff', files: ['operators'] },
  ultimateBuffId: { kind: 'buff', files: ['operators'] },
  reserveArrowBuffId: { kind: 'buff', files: ['operators'] },
  battleArrowBuffId: { kind: 'buff', files: ['operators'] },
  pointBuffId: { kind: 'buff', files: ['operators'] },
  skillGroupKey: { kind: 'skillGroup', files: ['operators'] },
  skillSlotKey: { kind: 'skillSlot', files: ['buffs', 'actions', 'skills'] },
  skillKey: { kind: 'skill', files: ['actions', 'operators'] },
  executionSkillKey: { kind: 'skill', files: ['skills'] },
  // Equipment skillId records provenance; it is not an operator skill reference.
  skillId: { kind: 'skill', files: ['actions', 'skills'] },
  targetSkillKey: { kind: 'skill', files: ['buffs', 'actions'] },
  targetSkillId: { kind: 'skill', files: ['skills'] },
  timelineContinuationSkillId: { kind: 'skill', files: ['skills'] },
  timelineBlockFollowUpSkillId: { kind: 'skill', files: ['skills'] },
  skillIds: { kind: 'skill', files: ['actions', 'skills', 'conditions'] },
  enhancementStateBuffId: { kind: 'buff', files: ['skills'] },
  revertedSkillKey: { kind: 'skill', files: ['buffs', 'actions'] },
  baseSkillKey: { kind: 'skill', files: ['skills'] },
  defaultSkillKey: { kind: 'skill', files: ['skills'] },
  firstSkillKey: { kind: 'skill', files: ['skills'] },
  terminalSkillKey: { kind: 'skill', files: ['skills'] },
  placementSequenceSkillKeys: { kind: 'skill', files: ['skills'] },
  replacementSkillKeys: { kind: 'skill', files: ['skills'] },
  stableSkillKeys: { kind: 'skill', files: ['skills'] },
  normalAttackSkillKeys: { kind: 'skill', files: ['skills'] },
  abilityEntityId: { kind: 'abilityEntity', files: ['actions', 'operators'] },
  skillKeys: { kind: 'skill', files: ['skills'] },
  triggerBuffIds: { kind: 'buff', files: ['actions', 'buffs'] },
  buffIds: { kind: 'buff', files: ['actions', 'operators', 'conditions', 'modifiers'] },
  inheritToNextSkillIds: { kind: 'skill', files: ['actions'] },
  abilityEntityIds: { kind: 'abilityEntity', files: ['actions', 'skills', 'conditions'] },
};

/** Ignore anonymous containers, union branches, and array/Readonly wrappers. An exact
 * named top-level declaration plus property ancestry survives formatting and movement. */
function declarationPath(node: ts.PropertySignature | ts.PropertyDeclaration): string | undefined {
  const names: string[] = [];
  for (let current: ts.Node | undefined = node; current; current = current.parent) {
    if (ts.isPropertySignature(current) || ts.isPropertyDeclaration(current))
      names.unshift(current.name.getText().replace(/^['"]|['"]$/g, ''));
    if (ts.isInterfaceDeclaration(current) || ts.isTypeAliasDeclaration(current)) {
      if (!ts.isSourceFile(current.parent)) return undefined;
      names.unshift(current.name.text);
      return names.join('.');
    }
  }
  return undefined;
}

function declarationVariant(node: ts.Node): string | undefined {
  for (let current = node.parent; current && !ts.isSourceFile(current); current = current.parent) {
    if (!ts.isTypeLiteralNode(current)) continue;
    const kind = current.members.find(
      member => ts.isPropertySignature(member) && member.name.getText() === 'kind',
    );
    if (
      kind &&
      ts.isPropertySignature(kind) &&
      kind.type &&
      ts.isLiteralTypeNode(kind.type) &&
      ts.isStringLiteral(kind.type.literal)
    )
      return kind.type.literal.text;
  }
  return undefined;
}

const blackboardActionPaths = new Set([
  'findOwnerSpawnedAbilityEntities.saveCountToBlackboardKey',
  'findOwnerSpawnedAbilityEntities.circularOrder.indexBlackboardKey',
  'readAbilityEntityRemainingDuration.outputKey',
  'readSkillSettingData.items.storeKey',
  'readBuffBlackboard.desiredKey',
  'readBuffBlackboard.outputKey',
  'readEventBuffBlackboard.desiredKey',
  'readEventBuffBlackboard.outputKey',
  'readCurrentBuffRemainingDuration.outputKey',
  'readBuffRemainingDuration.outputKey',
  'readBuffStackCount.outputKey',
  'storeCurrentTimelineFrame.outputKey',
  'storeEventSpGainAmount.outputKey',
  'storeEventSpGainAmount.realDeltaOutputKey',
  'storeEventHealValues.finalHealOutputKey',
  'storeEventHealValues.realHealOutputKey',
  'storeShieldValue.outputKey',
  'modifyActionValue.key',
  'calculateActionValue.key',
  'storeSourceAttributeValue.targetKey',
  'storeEntityPropertyValue.targetKey',
]);

export function mergeFieldDeclarationMetadata(
  values: readonly FieldDeclarationMetadata[],
): FieldDeclarationMetadata {
  const result: Record<string, unknown> = {};
  const keys = [
    'declaration',
    'referenceKind',
    'readonlyDeclaration',
    'nativeId',
    'blackboardOrigin',
  ] as const;
  for (const key of keys) {
    const present = [...new Set(values.map(value => value[key]))];
    // Conflicting capabilities must never silently select the first union branch.
    if (present.length === 1 && present[0] !== undefined) result[key] = present[0];
  }
  return result as FieldDeclarationMetadata;
}

export function createFieldDeclarationExtractor(root: string) {
  const sources = schemaSourceLocation(root);
  return (symbol: ts.Symbol | undefined): FieldDeclarationMetadata => {
    const values = (symbol?.declarations ?? []).map((node): FieldDeclarationMetadata => {
      if (!ts.isPropertySignature(node) && !ts.isPropertyDeclaration(node)) return {};
      const path = declarationPath(node);
      if (!path) return {};
      const file = sources.filePath(node.getSourceFile().fileName);
      if (file === 'src/core/game-data/enemyDefinition.ts' && path === 'EnemyDefinition.levelHp')
        return { readonlyDeclaration: true };
      const match = /^packages\/game-data-contract\/src\/([^/]+)\.ts$/.exec(file);
      if (!match) return {};
      const module = match[1]!;
      const name = node.name.getText().replace(/^['"]|['"]$/g, '');
      const reference = REFERENCE_DECLARATIONS[name];
      const declaration =
        declarationFiles[path as FieldDeclarationId] === module
          ? (path as FieldDeclarationId)
          : undefined;
      const readonlyDeclaration =
        module === 'operators' && path === 'OperatorDefinition.skillAliases';
      const nativeId =
        module === 'actions' && path === 'CombatStepParameters.finishGlobalBuffsById.globalBuffIds';
      const blackboardOrigin =
        module === 'skills' && path === 'AbilityEntityDefinitionNumber.blackboardKey'
          ? 'abilityEntity'
          : module === 'buffs' && path === 'BuffDuration.blackboardKey'
            ? 'globalBuff'
            : (module === 'actions' &&
                  blackboardActionPaths.has(path.replace(/^CombatStepParameters\./, ''))) ||
                (module === 'conditions' &&
                  (['ActionValueExpression.key', 'ActionValueExpression.parameter'].includes(
                    path,
                  ) ||
                    ([
                      'CombatConditionExpression.desiredKey',
                      'CombatConditionExpression.outputKey',
                    ].includes(path) &&
                      declarationVariant(node) === 'buffBlackboardValueCompare')))
              ? 'contract'
              : undefined;
      return {
        ...(declaration ? { declaration } : {}),
        ...(reference?.files.includes(module) ? { referenceKind: reference.kind } : {}),
        ...(readonlyDeclaration ? { readonlyDeclaration: true } : {}),
        ...(nativeId ? { nativeId: true } : {}),
        ...(blackboardOrigin ? { blackboardOrigin } : {}),
      };
    });
    return mergeFieldDeclarationMetadata(values);
  };
}
