import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMBAT_STEP_KINDS } from '../../../../../packages/game-data-contract/src/actions';
import { formatStepSchema } from '../../../../../tools/inspector-schema/contractSchema';
import { stepStructure } from './stepStructure.generated';
import { stepInspectorFields, validateStepInspector } from './stepInspectorSchema';
import { inspectorProperty } from './inspectorProperty';
import { useDefinitionDraftHistory } from '../useDefinitionDraftHistory';
import { shallowRef } from 'vue';
import type { CombatStepParameters } from '../../../../../packages/game-data-contract/src/actions';
import {
  initialInspectorValue,
  matchesInspectorValue,
  inspectorFieldIssues,
} from './inspectorFields';

describe('参数集合保留原始数据形态', () => {
  it('Buff 时长、暂停与结束原因按契约编辑，操作切换不重置操作数', () => {
    const original: CombatStepParameters['setCurrentBuffRemainingDuration'] = {
      operation: 'assign',
      value: { kind: 'blackboard', key: 'duration' },
    };
    const operation = stepInspectorFields('setCurrentBuffRemainingDuration')!.find(
      field => field.key === 'operation',
    )!;
    for (const value of ['assign', 'add', 'multiply']) {
      expect(operation.write(original, value)).toEqual({ ...original, operation: value });
    }
    expect(operation.write(original, 'invalid')).toBe(original);
    const reason = stepInspectorFields('finishCurrentBuff')![0]!;
    expect(reason.write({ reason: 'early', finishSource: 'actionOwner' }, 'absorbed')).toEqual({
      reason: 'absorbed',
      finishSource: 'actionOwner',
    });
    expect(
      stepInspectorFields('setCurrentBuffTimePaused')![0]!.write({ paused: true }, false),
    ).toEqual({ paused: false });
    expect(stepInspectorFields('refreshCurrentBuffAttributeModifiers')).toEqual([]);
    const read = { target: 'enemy' as const, buffIds: ['a', 'a', 'b'], outputKey: 'old' };
    const output = stepInspectorFields('readBuffRemainingDuration')!.find(
      field => field.key === 'outputKey',
    )!;
    expect(output.write(read, 'new')).toEqual({ ...read, outputKey: 'new' });
    expect(
      existsSync(new URL('./components/BuffRuntimeStateStepEditor.vue', import.meta.url)),
    ).toBe(false);
  });
  it('实体生命周期复用空参数、文本与操作数，不增加目标或结构字段', () => {
    for (const kind of [
      'finishCurrentAbilityEntity',
      'finishActionOwnerAbilityEntity',
      'finishCurrentAbilityEntityWhenSourceDies',
    ] as const)
      expect(stepInspectorFields(kind)).toEqual([]);
    const read = stepInspectorFields('readAbilityEntityRemainingDuration')!;
    expect(read.map(field => field.key)).toEqual(['outputKey']);
    expect(read[0]!.write({ outputKey: 'old' }, 'remaining')).toEqual({ outputKey: 'remaining' });
    const duration = stepInspectorFields('setAbilityEntityRemainingDuration')![0]!;
    expect(
      duration.write(
        { value: { kind: 'constant', value: 5 } },
        { kind: 'blackboard', key: 'duration' },
      ),
    ).toEqual({ value: { kind: 'blackboard', key: 'duration' } });
    expect(
      stepInspectorFields('startCurrentAbilityEntityChildSkillById')!.map(field => field.key),
    ).toEqual(['childSkillId']);
    expect(
      existsSync(new URL('./components/AbilityEntityLifecycleStepEditor.vue', import.meta.url)),
    ).toBe(false);
  });
  it('来源属性读取的选择器、算式与输出键独立编辑，不提前求值', () => {
    const original: CombatStepParameters['storeSourceAttributeValue'] = {
      attribute: { kind: 'specific', key: 'strength' },
      stage: 'armedNonConverted',
      useFloor: false,
      divisor: { kind: 'blackboard', key: 'divisor' },
      multiplier: { kind: 'constant', value: 2 },
      base: { kind: 'constant', value: 1 },
      targetKey: 'out',
    };
    const fields = stepInspectorFields('storeSourceAttributeValue')!;
    const attribute = fields.find(field => field.key === 'attribute')!;
    expect(attribute.write(original, { kind: 'main' })).toEqual({
      ...original,
      attribute: { kind: 'main' },
    });
    expect(attribute.write(original, { kind: 'invalid' })).toBe(original);
    const stage = fields.find(field => field.key === 'stage')!;
    expect(stage.write(original, 'finalNonConverted')).toEqual({
      ...original,
      stage: 'finalNonConverted',
    });
    const floor = fields.find(field => field.key === 'useFloor')!;
    expect(floor.write(original, true).divisor).toBe(original.divisor);
    expect(
      stepInspectorFields('storeEntityPropertyValue')!.find(field => field.key === 'property')!
        .options,
    ).toEqual(['currentHealth', 'maxHealth', 'currentPoise']);
    expect(existsSync(new URL('./components/SourceValueStepEditor.vue', import.meta.url))).toBe(
      false,
    );
    const setting = readFileSync(
      new URL('../actions/SkillSettingStepEditor.vue', import.meta.url),
      'utf8',
    );
    expect(setting).toContain('values: [0, 0, 0, 0]');
    expect(setting).toContain('paramA: item.enhance.formula.paramA');
    expect(setting).not.toContain('storeSourceAttributeValue');
  });
  it('实体时钟查询保留空数组、ID 限定和 Context；布尔修改不重建查询', () => {
    const original: CombatStepParameters['setIgnoreGlobalTimeScale'] = {
      abilityEntityTargets: [
        { kind: 'ownerSpawned', abilityEntityIds: [] },
        { kind: 'context', contextKey: 'a.b' },
      ],
      ignore: true,
      revertOnEnd: false,
    };
    const fields = stepInspectorFields('setIgnoreGlobalTimeScale')!;
    const queries = fields.find(field => field.key === 'abilityEntityTargets')!;
    const ignore = fields.find(field => field.key === 'ignore')!;
    expect(ignore.write(original, false)).toEqual({ ...original, ignore: false });
    expect(ignore.write(original, false).abilityEntityTargets).toBe(original.abilityEntityTargets);
    expect(queries.write(original, []).abilityEntityTargets).toEqual([]);
    expect(queries.write(original, [{ kind: 'ownerSpawned' }]).abilityEntityTargets).toEqual([
      { kind: 'ownerSpawned' },
    ]);
    expect(
      queries.write(original, [{ kind: 'ownerSpawned', abilityEntityIds: [] }])
        .abilityEntityTargets,
    ).toEqual([{ kind: 'ownerSpawned', abilityEntityIds: [] }]);
    expect(queries.optionLabelPrefix).toBe('timeline.skillEditing.abilityEntityQueryKinds.');
    expect(
      existsSync(new URL('./components/IgnoreGlobalTimeScaleStepEditor.vue', import.meta.url)),
    ).toBe(false);
  });
  it('冷却操作联动一次进入历史，禁用基准不可写，撤销恢复两个字段', () => {
    const original: CombatStepParameters['adjustSkillCooldown'] = {
      target: 'caster',
      skill: { kind: 'id', skillId: 'test' },
      operation: 'set',
      basis: 'absoluteSeconds',
      value: { kind: 'constant', value: 3 },
    };
    const draft = shallowRef(original);
    const history = useDefinitionDraftHistory(
      () => draft.value,
      next => {
        draft.value = next;
      },
    );
    let commits = 0;
    const source = {
      read: () => draft.value,
      issues: () => [],
      commit(next: typeof original) {
        commits++;
        history.commit(next, { path: 'parameters' });
      },
    };
    const fields = stepInspectorFields('adjustSkillCooldown')!;
    const operation = inspectorProperty(
      source,
      fields.find(field => field.key === 'operation')!,
    );
    const basis = inspectorProperty(
      source,
      fields.find(field => field.key === 'basis')!,
    );
    operation.set('reduce');
    expect(draft.value).toEqual({ ...original, operation: 'reduce', basis: 'baseDurationRatio' });
    expect(basis.disabled).toBe(true);
    basis.set('absoluteSeconds');
    expect(commits).toBe(1);
    history.restore('undo');
    expect(draft.value).toEqual(original);
    expect(basis.disabled).toBe(false);
    history.restore('redo');
    expect(draft.value.basis).toBe('baseDurationRatio');
    expect(existsSync(new URL('./components/SkillCooldownStepEditor.vue', import.meta.url))).toBe(
      false,
    );
  });
  it('逐级值不折算成当前等级，也不改变原数组', () => {
    const field = stepInspectorFields('changeResource')!.find(field => field.key === 'amount')!;
    const original = { resource: 'sp' as const, amount: [1, 2, 3], recipient: 'team' as const };
    expect(field.editor).toBe('levelValues');
    expect(field.read(original)).toEqual([1, 2, 3]);
    expect(field.write(original, [1, 20, 3])).toEqual({ ...original, amount: [1, 20, 3] });
    expect(original.amount).toEqual([1, 2, 3]);
  });

  it('SkillSetting 列是普通数值列表，不冒充等级；列表长度交由领域校验', () => {
    const field = stepInspectorFields('readSkillSettingData')![0]!;
    expect(field.editor).toBe('array');
    expect(field.element?.properties?.values?.type).toBe('array');
    const item = {
      values: [1, 2, 3, 4],
      column: { kind: 'constant' as const, value: 0 },
      storeKey: 'a',
    };
    const original = { items: [item, { ...item, storeKey: 'b' }] };
    const updated = field.write(original, [{ ...item, values: [9, 2, 3, 4] }, original.items[1]]);
    expect(updated.items[0]?.values).toEqual([9, 2, 3, 4]);
    expect(updated.items[1]).toBe(original.items[1]);
    expect(item.values).toEqual([1, 2, 3, 4]);
    expect(
      validateStepInspector({
        kind: 'readSkillSettingData',
        parameters: { items: [{ ...item, values: [1] }] },
      }).some(issue => issue.path === 'items[0].values'),
    ).toBe(true);
  });

  it('每次新增对象独立初始化，子序列仍不进入参数集合', () => {
    const element = stepInspectorFields('readSkillSettingData')![0]!.element!;
    const first = initialInspectorValue(element);
    const second = initialInspectorValue(element);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(stepInspectorFields('conditional')).toBeUndefined();
    expect(stepInspectorFields('spawnAbilityEntity')).toBeUndefined();
  });
});

describe('契约驱动步骤参数', () => {
  it('捕获参数共享字段编辑，省略和空键分开并保留对象级错误', () => {
    const fields = stepInspectorFields('storeEventSpGainAmount')!;
    const output = fields.find(field => field.key === 'outputKey')!;
    const original = { outputKey: 'amount', realDeltaOutputKey: 'delta' };
    const disabled = output.toggle(original, false);
    expect(disabled).toEqual({ realDeltaOutputKey: 'delta' });
    expect(output.write(original, '')).toEqual({ ...original, outputKey: '' });
    expect(validateStepInspector({ kind: 'storeEventSpGainAmount', parameters: disabled })).toEqual(
      [],
    );
    expect(validateStepInspector({ kind: 'storeEventSpGainAmount', parameters: {} })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '' })]),
    );
    expect(validateStepInspector({ kind: 'storeEventHealValues', parameters: {} })).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '' })]),
    );
    const shield = stepInspectorFields('storeShieldValue')!.find(field => field.key === 'value')!;
    expect(shield.options).toEqual(expect.arrayContaining(['gained', 'current']));
    expect(shield.optionLabelPrefix).toBe('timeline.skillEditing.shieldCaptureValues.');
    expect(existsSync(resolve('src/ui/timeline/components/BlackboardCaptureStepEditor.vue'))).toBe(
      false,
    );
  });

  it('实体标记完整面板共用公共参数，旧组件已删除', () => {
    const fields = stepInspectorFields('createAbilityEntityTimedMarker')!;
    const original = {
      markerId: 'marker',
      durationSeconds: { kind: 'constant' as const, value: 3 },
      timeDomain: 'self' as const,
      autoFinishByAction: false,
    };
    expect(fields.map(field => field.key).sort()).toEqual(Object.keys(original).sort());
    const marker = fields.find(field => field.key === 'markerId')!;
    const clock = fields.find(field => field.key === 'timeDomain')!;
    expect(marker.editor).toBe('stringReference');
    expect(clock.options).toEqual(expect.arrayContaining(['global', 'self']));
    expect(clock.labelKey).toBe('timeline.skillEditing.markerTimeDomain');
    const changed = marker.write(original, { blackboardKey: 'marker_key' });
    expect(changed).toEqual({ ...original, markerId: { blackboardKey: 'marker_key' } });
    expect(clock.write(changed, 'global')).toEqual({ ...changed, timeDomain: 'global' });
    expect(original.markerId).toBe('marker');
    expect(
      existsSync(resolve('src/ui/timeline/components/AbilityEntityTimedMarkerStepEditor.vue')),
    ).toBe(false);
    const source = readFileSync(
      resolve('src/ui/timeline/definitions/actions/CombatStepEditor.vue'),
      'utf8',
    );
    expect(source).toContain("'createAbilityEntityTimedMarker'");
    expect(source).not.toContain('AbilityEntityTimedMarkerStepEditor');
  });

  it('生成物覆盖步骤契约全集，和条件共用提取器', () => {
    expect(
      readFileSync(
        resolve('src/ui/timeline/definitions/inspector/stepStructure.generated.ts'),
        'utf8',
      ).replace(/\r\n/g, '\n'),
    ).toBe(formatStepSchema(process.cwd()));
    expect(Object.keys(stepStructure).sort()).toEqual([...COMBAT_STEP_KINDS].sort());
  });

  it('只有完整参数对象可接管，不摘取部分字段假装完整', () => {
    for (const kind of COMBAT_STEP_KINDS) {
      const shape = stepStructure[kind];
      const fields = stepInspectorFields(kind);
      if (shape.type === 'object')
        expect(fields?.map(field => field.key)).toEqual(Object.keys(shape.properties));
      else if (shape.type === 'union') expect(fields?.[0]?.editor).toBe('union');
      else expect(fields).toBeUndefined();
    }
    expect(stepInspectorFields('applyBuff')).toBeUndefined();
    expect(stepInspectorFields('spawnAbilityEntity')).toBeUndefined();
    expect(stepInspectorFields('conditional')).toBeUndefined();
  });

  it('简单写入参数不丢失原始步骤身份，错误来自领域校验', () => {
    const original = {
      kind: 'storeCurrentTimelineFrame' as const,
      key: 'unique-step',
      parameters: { outputKey: 'frame' },
    };
    const field = stepInspectorFields(original.kind)!.find(field => field.key === 'outputKey')!;
    const updated = { ...original, parameters: field.write(original.parameters, 'saved') };
    expect(updated).toEqual({ ...original, parameters: { outputKey: 'saved' } });
    expect(original.parameters.outputKey).toBe('frame');
    expect(
      validateStepInspector({ ...original, parameters: field.write(original.parameters, '') }).some(
        issue => issue.path === 'outputKey',
      ),
    ).toBe(true);
  });

  it('根联合按必需字段识别，整体切换不残留原分支字段', () => {
    const field = stepInspectorFields('openComboWindow')![0]!;
    const variants = field.variants!;
    const slot = { nextSkillKeyFromSlot: 'comboSkill' as const };
    expect(variants.findIndex(shape => matchesInspectorValue(shape, slot))).toBe(1);
    expect(
      variants.findIndex(shape => matchesInspectorValue(shape, { nextSkillKey: 'combo' })),
    ).toBe(0);
    expect(variants.some(shape => matchesInspectorValue(shape, {}))).toBe(false);
    expect(field.read(slot)).toBe(slot);
    expect(field.write(slot, initialInspectorValue(variants[0]!))).toEqual({ nextSkillKey: '' });
    expect(field.write(slot, {})).toBe(slot);
    const issues = [{ path: 'nextSkillKey', message: 'required' }];
    expect(inspectorFieldIssues(issues, field.key)).toEqual(issues);
  });

  it('明确无参数的契约生成空字段，不生成可新增字典', () => {
    expect(stepInspectorFields('finishTimeline')).toEqual([]);
    expect(stepInspectorFields('finishCurrentAbilityEntity')).toEqual([]);
    expect(stepInspectorFields('inheritSkillCastInfoForBasicAttack')).toEqual([]);
  });

  it('生命下限完整表单复用契约字段，模式切换保留操作数与目标', () => {
    const fields = stepInspectorFields('setHealthFloor')!;
    expect(fields.map(field => field.key)).toEqual(['target', 'mode', 'value']);
    const original = {
      target: 'actionOwner' as const,
      mode: 'absolute' as const,
      value: { kind: 'blackboard' as const, key: 'floor' },
    };
    const mode = fields.find(field => field.key === 'mode')!;
    expect(mode.options).toEqual(['absolute', 'maxHealthRatio']);
    expect(mode.write(original, 'maxHealthRatio')).toEqual({ ...original, mode: 'maxHealthRatio' });
    expect(mode.write(original, 'invalid')).toBe(original);
    const value = fields.find(field => field.key === 'value')!;
    expect(value.write(original, { kind: 'constant', value: 0.25 })).toEqual({
      ...original,
      value: { kind: 'constant', value: 0.25 },
    });
    const source = readFileSync(
      new URL('../actions/CombatStepEditor.vue', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('HealthFloorStepEditor');
    expect(source).toContain("'setHealthFloor'");
  });

  it('自动参数仅替代图内 Inspector，不吞掉完整表单的结构编辑入口', () => {
    const source = readFileSync(
      new URL('../actions/CombatStepEditor.vue', import.meta.url),
      'utf8',
    );
    expect(source).toMatch(/props.inspectorOnly\s*\? stepInspectorFields/);
    expect(source).toContain('v-if="automaticFields"');
    expect(source).toContain('BranchStepEditor');
  });
});
