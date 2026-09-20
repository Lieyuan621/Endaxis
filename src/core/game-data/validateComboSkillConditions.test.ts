import { describe, expect, it } from 'vitest';
import { validateComboSkillConditions } from './validateComboSkillConditions';
import { ABILITY_EVENTS, type ComboSkillConditionDefinition } from './operatorDefinition';
import { perlica } from '../../data/operators/perlica.generated';
import { compileOperatorComboSkillConditions } from '../compiler/compileOperatorComboSkillConditions';
import { createEmptyProject } from '../project/createProject';
import { deriveProjectOperatorTemplate } from '../project/projectDefinitionLibrary';
import { parseProjectDocument, serializeProjectDocument } from '../project/serialization';

const entry: ComboSkillConditionDefinition = {
  key: 'condition',
  skillKey: 'chr_0004_pelica_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: { count: 1, label: 'local', empty: null },
  sequence: { steps: [] },
};
const build = {
  operatorSlug: perlica.slug,
  level: 90,
  promoted: true,
  potential: 0,
  trustLevel: 4,
  skillLevels: { comboSkill: 2 },
  talentStates: {},
};
function project(condition: ComboSkillConditionDefinition = entry) {
  return deriveProjectOperatorTemplate(createEmptyProject({ createdWith: 'test' }), {
    id: 'project:operator:conditions',
    name: 'conditions',
    baseTemplateId: perlica.slug,
    definition: { ...perlica, comboSkillConditions: [condition] },
  });
}

describe('正式原生连携条件结构与绑定', () => {
  it.each(ABILITY_EVENTS)('%s 接受公共 AbilitySystem 事件及现有动作树', event => {
    expect(validateComboSkillConditions([{ ...entry, event }])).toEqual([]);
  });
  it.each(
    [undefined, [], [{ ...entry, initialValues: null }], [{ ...entry, initialValues: {} }]].map(
      value => ({ value }),
    ),
  )('缺省/空列表/禁用板/空板均可表示：%j', ({ value }) => {
    expect(validateComboSkillConditions(value)).toEqual([]);
  });
  it.each(
    [
      null,
      {},
      [null],
      [{ ...entry, key: '' }],
      [entry, entry],
      [{ ...entry, skillKey: 1 }],
      [{ ...entry, event: 'elementalInflictionApplied' }],
      [{ ...entry, event: 121 }],
      [{ ...entry, initialValues: undefined }],
      [{ ...entry, initialValues: { x: [0, 1] } }],
      [{ ...entry, initialValues: { x: NaN } }],
      [{ ...entry, initialValues: { '': 0 } }],
      [{ ...entry, initialValues: { x: false } }],
      [{ ...entry, immediately: 'yes' }],
      [{ ...entry, sequence: { steps: [{ kind: 'unknown', parameters: {} }] } }],
    ].map(value => ({ value })),
  )('损坏或尚未支持的字段给出可定位路径：%j', ({ value }) => {
    const issues = validateComboSkillConditions(value, '$.operator.comboSkillConditions');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every(issue => issue.path.startsWith('$.operator.comboSkillConditions'))).toBe(
      true,
    );
  });
  it('序列按绑定技能等级展开，局部字面板不混进实体板或被当作等级数组', () => {
    const definition = {
      ...perlica,
      comboSkillConditions: [
        {
          ...entry,
          sequence: {
            steps: [
              {
                kind: 'changeResource' as const,
                parameters: { resource: 'sp' as const, amount: [4, 9], recipient: 'team' as const },
              },
            ],
          },
        },
      ],
    };
    const [compiled] = compileOperatorComboSkillConditions(definition, build);
    expect(compiled?.sequence.steps[0]).toMatchObject({
      kind: 'changeResource',
      parameters: { amount: 9 },
    });
    expect(compiled?.initialValues).toEqual(entry.initialValues);
    expect(compiled?.initialValues).not.toBe(entry.initialValues);
    expect(Object.isFrozen(compiled?.initialValues)).toBe(true);
  });
  it.each(['missing', 'battleSkill'])('引用 %s 在项目定义入口和编译入口均严格拒绝', skillKey => {
    const condition = { ...entry, skillKey };
    expect(() => project(condition)).toThrow('unknown combo skill');
    expect(() =>
      compileOperatorComboSkillConditions({ ...perlica, comboSkillConditions: [condition] }, build),
    ).toThrow('must resolve to exactly one combo skill');
  });
  it.each([undefined, 0, 1.5, -1])('空序列也不能绕过缺失/非法组等级 %s', level => {
    const invalidBuild: import('../project/schema').OperatorInstanceDocument = {
      ...build,
      skillLevels: level === undefined ? {} : { comboSkill: level },
    };
    expect(() =>
      compileOperatorComboSkillConditions(
        { ...perlica, comboSkillConditions: [entry] },
        invalidBuild,
      ),
    ).toThrow('requires a positive integer level');
  });
  it('重复技能身份不能悄悄绑定第一项', () => {
    const combo = perlica.skillGroups.find(group => group.key === 'comboSkill')!;
    expect(() =>
      compileOperatorComboSkillConditions(
        { ...perlica, skillGroups: [combo, combo], comboSkillConditions: [entry] },
        build,
      ),
    ).toThrow('exactly one combo skill');
  });
  it('项目模板保存加载保留原生条件和 null/字符串，不污染内置定义', () => {
    const builtInConditions = structuredClone(perlica.comboSkillConditions);
    const loaded = parseProjectDocument(serializeProjectDocument(project()));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) throw new Error('invalid project');
    expect(
      loaded.value.definitionLibrary?.operators['project:operator:conditions']?.definition
        .comboSkillConditions,
    ).toEqual([entry]);
    expect(perlica.comboSkillConditions).toEqual(builtInConditions);
    const raw = JSON.parse(serializeProjectDocument(project()));
    raw.definitionLibrary.operators[
      'project:operator:conditions'
    ].definition.comboSkillConditions[0].initialValues = { count: [0, 1] };
    const rejected = parseProjectDocument(raw);
    expect(rejected.ok).toBe(false);
    if (rejected.ok || rejected.kind !== 'invalid-document')
      throw new Error('expected structure failure');
    expect(rejected.issues[0]?.path).toContain('comboSkillConditions[0].initialValues');
  });
});
