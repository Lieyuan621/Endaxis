import { describe, expect, it } from 'vitest';

import {
  parseAbilityEntitySpawnActionSource,
  parseProjectileLaunchActionSource,
  parseSkillCastActionSource,
} from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  $type: 'Example.Action+Data, Example',
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

const VECTOR_ZERO = { x: 0, y: 0, z: 0 } as const;
const DIRECTION = {
  directionType: 'SourceForward',
  sourceMountPoint: 'None',
  targetMountPoint: 'None',
  customSourceAndTarget: false,
  clampToXZ: true,
  invertDirection: false,
} as const;

describe('引用闭包动作来源载荷', () => {
  it('投射物保留关闭回调的残留 ID，且不会把它伪装成启用引用', () => {
    const source = parseProjectileLaunchActionSource(
      {
        ...META,
        projectileId: 'projectile_fixture',
        projectileSkillId: '',
        projectileSource: targetFixture('Source'),
        syncTimeScale: true,
        assignEntityBlackboard: true,
        assignPairs: [assignmentFixture('damage_scale', 'atk_scale')],
        assignBlackboard: true,
        emitPos: targetFixture('Source'),
        emitMountPoint: 0,
        useWeaponMp: false,
        weaponIndex: 0,
        weaponMp: 100,
        overrideEmitBone: false,
        emitPosFixedOffset: VECTOR_ZERO,
        emitPosOffsetForward: 0,
        emitPosRandomOffset: VECTOR_ZERO,
        targetSettings: targetFixture('Target'),
        overrideHitBone: false,
        hitMountPoint: 0,
        hitBoneFixedOffset: VECTOR_ZERO,
        hitBoneOffsetForward: 1,
        hitBoneRandomOffset: VECTOR_ZERO,
        presetPoints: [{ presetPointKey: 'first', presetPoint: targetFixture('Context') }],
        castSkillOnBlock: false,
        skillIdOnBlock: 'disabled_residue',
        castSkillOnFinish: false,
        skillIdOnFinish: '',
        castSkillOnHit: true,
        castSkillOnReach: false,
        skillIdOnReach: '',
      },
      'fixture.launchProjectile',
    );
    expect(source).toMatchObject({
      kind: 'projectileLaunch',
      projectileSource: { targetSource: 'Source' },
      emitMountPoint: 'None',
      weaponMountPoint: 100,
      hitMountPoint: 'None',
      emitPositionForwardMode: 'SourceForward',
      hitBoneForwardMode: 'TargetForward',
      assignments: [{ targetKey: 'damage_scale', inputValueKey: 'atk_scale' }],
      callbacks: [
        { event: 'block', enabled: false, skillId: 'disabled_residue' },
        { event: 'finish', enabled: false, skillId: '' },
        { event: 'hit', enabled: true, skillId: '' },
        { event: 'reach', enabled: false, skillId: '' },
      ],
      presetPoints: [{ key: 'first', point: { targetSource: 'Context' } }],
    });
  });

  it.each([undefined, false, true, 0, null, 'false'])(
    '能力实体严格读取多输入配置 %s，保留关闭赋值和未启用目标',
    allowMultiInputTarget => {
      const parse = () =>
        parseAbilityEntitySpawnActionSource(
          {
            ...META,
            abilityEntityId: 'abilityentity_fixture',
            setAbilityEntitySource: false,
            abilityEntitySource: 'ActionSource',
            abilityEntitySourceContextKey: '',
            setAbilityEntityTarget: false,
            abilityEntityTarget: targetFixture('Target'),
            bornAt: targetFixture('Source'),
            bornMountPoint: 'None',
            bornPosOffset: VECTOR_ZERO,
            checkNavmeshAreaName: false,
            forbiddenAreaNames: [],
            attachToClosestMeshPoint: false,
            yRotateFromBoneToCurPos: false,
            bornRotation: 'SourceForward',
            bornRotationContextTarget: '',
            useAdvancedDirectionSetting: false,
            advancedDirectionSetting: DIRECTION,
            clampToXZPlane: false,
            applyBornRotationOffset: false,
            bornRotationOffset: { x: 0, y: 0, z: 0, w: 1 },
            assignEntityBlackboard: false,
            assignPairs: [assignmentFixture('', '')],
            assignBlackboard: false,
            abilityEntitySkillId: '',
            ...(allowMultiInputTarget === undefined ? {} : { allowMultiInputTarget }),
            overrideDuration: false,
            duration: scalarFixture(62),
            saveToContext: false,
            contextKey: '',
            pauseEffectOnEnd: false,
            inheritSourceSkillCastId: true,
            dieWhenSourceDie: true,
            forceSyncInit: false,
            dieOnEnd: true,
          },
          'fixture.spawnAbilityEntity',
          {},
        );
      if (allowMultiInputTarget !== undefined && typeof allowMultiInputTarget !== 'boolean') {
        expect(parse).toThrow('allowMultiInputTarget');
        return;
      }
      expect(parse()).toMatchObject({
        kind: 'abilityEntitySpawn',
        allowMultiInputTarget: allowMultiInputTarget ?? false,
        setSource: false,
        setTarget: false,
        target: { targetSource: 'Target' },
        assignEntityBlackboard: false,
        assignments: [{ targetKey: '', inputValueKey: '' }],
        overrideDuration: false,
        duration: { value: 62 },
      });
    },
  );

  it('技能调用保留动态 ID 包装和完整施法者、目标引用', () => {
    expect(
      parseSkillCastActionSource(
        {
          ...META,
          caster: targetFixture('Owner'),
          target: targetFixture('Target'),
          skillId: { value: 'fallback_skill', useBlackboardKey: true, blackboardKey: 'next_skill' },
          skipApplyCost: true,
          inheritSourceSkillCastId: false,
        },
        'fixture.castSkill',
      ),
    ).toMatchObject({
      kind: 'skillCast',
      caster: { targetSource: 'Owner' },
      target: { targetSource: 'Target' },
      skillId: { value: 'fallback_skill', blackboardKey: 'next_skill' },
      skipApplyCost: true,
    });
  });

  const cast = {
    ...META,
    caster: targetFixture('Owner'),
    target: targetFixture('Target'),
    skillId: { value: 'fallback_skill', useBlackboardKey: true, blackboardKey: 'next_skill' },
    skipApplyCost: true,
    inheritSourceSkillCastId: true,
  };
  it('关闭新增施法中断选项不改变费用、动态技能 ID 和来源继承', () => {
    expect(
      parseSkillCastActionSource(
        { ...cast, interruptCurSkillOnlyWhenTargetCastable: false },
        'cast',
      ),
    ).toEqual(parseSkillCastActionSource(cast, 'cast'));
  });
  it('保留“目标技能可施放时才中断当前技能”选项', () => {
    expect(
      parseSkillCastActionSource(
        { ...cast, interruptCurSkillOnlyWhenTargetCastable: true },
        'cast',
      ),
    ).toMatchObject({ interruptCurrentSkillOnlyWhenTargetCastable: true });
  });
  it.each([0, 'false', null, undefined])('阻断非法施法中断选项 %j', flag => {
    expect(() =>
      parseSkillCastActionSource(
        { ...cast, interruptCurSkillOnlyWhenTargetCastable: flag },
        'cast',
      ),
    ).toThrow('interruptCurSkillOnlyWhenTargetCastable');
  });
});

function assignmentFixture(targetKey: string, inputValueKey: string): Record<string, unknown> {
  return {
    targetKey,
    inputValueKey,
    useDirectValue: false,
    directValueType: 'Numeric',
    numericValue: 0,
    stringValue: '',
  };
}
