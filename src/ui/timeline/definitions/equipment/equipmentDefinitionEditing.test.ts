import { describe, expect, it } from 'vitest';
import healingWeapon from '../../../../data/equipment/generated-weapons/greatsword/wpn_claym_0006.generated';
import damageScaleGear from '../../../../data/equipment/generated/suit_atk02/item_equip_t4_suit_atk02_body_04.generated';
import cooldownGearSet from '../../../../data/equipment/generated-gear-sets/suit_combo_cd01.generated';
import {
  validateGearDefinition,
  validateGearSetDefinition,
  validateWeaponDefinition,
} from '../../../../core/game-data/equipmentDefinitionValidation';
import type {
  EquipmentModifierDefinition,
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import { replaceStructureValueAtPath } from '../skillStructureEditorCommands';

describe('equipment definition editing with generated samples', () => {
  it('武器治疗增幅只替换选中修正，不重建初始化行为', () => {
    const original = healingWeapon as WeaponDefinition;
    const modifier = original.traits[2]!.modifiers![0]!;
    if (modifier.kind !== 'staticHealingIncrease') throw new Error('expected healing modifier');

    const changed = replaceStructureValueAtPath(original, 'traits[2].modifiers[0]', {
      ...modifier,
      target: 'taken',
    } satisfies EquipmentModifierDefinition) as WeaponDefinition;

    expect(changed.traits[2]!.modifiers![0]).toMatchObject({
      kind: 'staticHealingIncrease',
      target: 'taken',
    });
    expect(changed.traits[2]!.initializationSequence).toStrictEqual(
      original.traits[2]!.initializationSequence,
    );
    expect(changed.traits[0]).toStrictEqual(original.traits[0]);
    expect(validateWeaponDefinition(changed, '$.weapon')).toEqual([]);
  });

  it('装备原生伤害倍率只修改目标身份并保留逐级值与兄弟修正', () => {
    const original = damageScaleGear as GearDefinition;
    const trait = original.traits[2]!;
    const modifier = trait.modifiers![0]!;
    if (modifier.kind !== 'damageScale') throw new Error('expected damage scale modifier');

    const changed = replaceStructureValueAtPath(original, 'traits[2].modifiers[0]', {
      ...modifier,
      target: 'physical',
    } satisfies EquipmentModifierDefinition) as GearDefinition;

    expect(changed.traits[2]!.modifiers![0]).toMatchObject({
      kind: 'damageScale',
      target: 'physical',
      slot: 'baseAddition',
    });
    expect(changed.traits[2]!.modifiers![0]!.value).toStrictEqual(modifier.value);
    expect(changed.traits[2]!.modifiers![1]).toStrictEqual(trait.modifiers![1]);
    expect(validateGearDefinition(changed, '$.gear')).toEqual([]);
  });

  it('套装冷却倍率修改技能类型时完整保留附属 Buff 闭包', () => {
    const original = cooldownGearSet as GearSetDefinition;
    const modifier = original.modifiers![0]!;
    if (modifier.kind !== 'skillCooldownMultiplier') {
      throw new Error('expected skill cooldown modifier');
    }

    const changed = replaceStructureValueAtPath(original, 'modifiers[0]', {
      ...modifier,
      skillTypes: ['comboSkill', 'ultimate'],
    } satisfies EquipmentModifierDefinition) as GearSetDefinition;

    expect(changed.modifiers![0]).toMatchObject({
      kind: 'skillCooldownMultiplier',
      skillTypes: ['comboSkill', 'ultimate'],
    });
    expect(changed.buffDefinitions).toStrictEqual(original.buffDefinitions);
    expect(validateGearSetDefinition(changed, '$.gearSet')).toEqual([]);
  });
});
