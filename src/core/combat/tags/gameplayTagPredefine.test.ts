import { describe, expect, it } from 'vitest';
import { GameplayTagPredefine } from './gameplayTagPredefine';
import { CombatBuffContainer } from '../buffs/combatBuffs';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { GAMEPLAY_TAG_PREDEFINE } from '../../../data/combat/gameplayTagPredefine.generated';
import { GAMEPLAY_TAG_PATHS } from '../../../data/combat/gameplayTagCatalog.generated';

const knockDown = 'Status/Immobilized/KnockDown';
const immune = 'Immune/KnockDown';
const physical = 'Skill/Character/Common/PhysicalStatus/KnockdownStatus';
function setup() {
  const target = new CombatBuffContainer('enemy', new CombatAttributeSet<string>());
  const table = new GameplayTagPredefine({
    tags: { KnockDown: knockDown },
    queries: {},
    immunityQueries: [{ tag: knockDown, query: { queryType: 'hasAny', tags: [immune] } }],
  });
  return { target, table };
}

describe('原生预定义标签的安装与退出', () => {
  it('闪避输入分别报告定身、禁止闪避和霸体三项原生门禁', () => {
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    const target = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    const immobilized = table.getQuery('InImmobilized').tags[0]!;
    const disableDash = table.getQuery('InDisableDash').tags[0]!;
    const superArmor = table.getTag('SuperArmor');
    target.addEntityTags([immobilized, disableDash, superArmor]);
    expect(table.getDashInputBlockers(target)).toEqual([
      'InImmobilized',
      'InDisableDash',
      'SuperArmor',
    ]);
    target.removeEntityTags([immobilized]);
    expect(table.getDashInputBlockers(target)).toEqual(['InDisableDash', 'SuperArmor']);
    target.removeEntityTags([disableDash, superArmor]);
    expect(table.getDashInputBlockers(target)).toEqual([]);
  });

  it('主战技禁用仅作用于身份相符的 NormalSkill，且沉默先短路', () => {
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    const target = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    // 查询同时含沉默；此夹具只安装主战技专属标签，单独测试身份条件。
    target.addEntityTags([table.getQuery('DisableNormalSkill').tags[1]!]);
    expect(table.getSkillTypeCastBlocker(target, 'normalSkill', true)).toBe('DisableNormalSkill');
    expect(table.getSkillTypeCastBlocker(target, 'normalSkill', false)).toBeUndefined();
    expect(table.getSkillTypeCastBlocker(target, 'normalSkill')).toBeUndefined();
    expect(table.getSkillTypeCastBlocker(target, 'attachSkill', true)).toBeUndefined();
    target.addEntityTags(table.getQuery('InSilence').tags);
    expect(table.getSkillTypeCastBlocker(target, 'normalSkill', true)).toBe('InSilence');
  });

  it.each([
    ['attack', ['InDisarmed']],
    ['breakingAttack', ['InDisarmed']],
    ['normalSkill', ['InSilence']],
    ['comboSkill', ['InSilence', 'DisableCastComboSkill']],
    ['ultimateSkill', ['InSilence']],
    ['extraActiveSkill', ['InSilence']],
    ['dodge', ['InDisableDash']],
    ['attachSkill', []],
    ['passiveSkill', []],
  ] as const)('原生类型 %s 只消费相应的预定义查询', (type, expected) => {
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    for (const name of ['InDisarmed', 'InSilence', 'DisableCastComboSkill', 'InDisableDash']) {
      const query = table.getQuery(name);
      const target = {
        matchesEntityTags: (tags: readonly string[], queryType: string) =>
          tags === query.tags && queryType === query.queryType,
      };
      expect(table.getSkillTypeCastBlocker(target, type)).toBe(
        (expected as readonly string[]).includes(name) ? name : undefined,
      );
    }
    expect(table.getSkillTypeCastBlocker({ matchesEntityTags: () => true }, type)).toBe(
      expected[0],
    );
  });

  it('公共施法门禁使用导出查询与实时实体标签，保留短路顺序', () => {
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    const target = new CombatBuffContainer('operator', new CombatAttributeSet<string>());
    expect(table.getCommonSkillCastBlocker(target)).toBeUndefined();
    const channeling = table.getTag('CantCastSkillWhenChanneling');
    target.addEntityTags([channeling]);
    expect(table.getCommonSkillCastBlocker(target)).toBe('CantCastSkillWhenChanneling');
    const query = table.getQuery('CantCastAnySkill');
    target.addEntityTags(query.tags);
    expect(table.getCommonSkillCastBlocker(target)).toBe('CantCastAnySkill');
    target.removeEntityTags(query.tags);
    expect(table.getCommonSkillCastBlocker(target)).toBe('CantCastSkillWhenChanneling');
    target.removeEntityTags([channeling]);
    expect(table.getCommonSkillCastBlocker(target)).toBeUndefined();
  });

  it('真实全表已解析成可读路径，公共运行时直接消费且保持两道免疫门独立', () => {
    expect(Object.keys(GAMEPLAY_TAG_PREDEFINE.tags)).toHaveLength(179);
    expect(Object.keys(GAMEPLAY_TAG_PREDEFINE.queries)).toHaveLength(67);
    expect(GAMEPLAY_TAG_PREDEFINE.immunityQueries).toHaveLength(37);
    const paths = new Set<string>(GAMEPLAY_TAG_PATHS);
    const used = [
      ...Object.values(GAMEPLAY_TAG_PREDEFINE.tags),
      ...Object.values(GAMEPLAY_TAG_PREDEFINE.queries).flatMap(query => query.tags),
      ...GAMEPLAY_TAG_PREDEFINE.immunityQueries.flatMap(entry => [entry.tag, ...entry.query.tags]),
    ];
    expect(used.every(tag => paths.has(tag))).toBe(true);
    const table = new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE);
    const target = new CombatBuffContainer('enemy', new CombatAttributeSet<string>());
    expect(table.getTag('Interactive')).toBe('Category/Interactive');
    expect(table.getTag('KnockDown')).toBe(knockDown);
    target.addEntityTags(['Immune/KnockDown']);
    expect(table.canAddTag(target, knockDown)).toBe(false);
    expect(table.canAddTag(target, physical)).toBe(true);
    expect(table.canAddTag(target, table.getTag('Getup'))).toBe(true);
  });
  it('组件标签免疫不等于物理异常状态 Buff 的准入', () => {
    const { target, table } = setup();
    target.addEntityTags([immune]);
    expect(table.canAddTag(target, physical)).toBe(true);
    expect(table.canAddTag(target, knockDown)).toBe(false);
  });

  it('Before 之后新增免疫会阻止真正安装；不会缓存早期准入', () => {
    const { target, table } = setup();
    expect(table.canAddTag(target, knockDown)).toBe(true);
    target.addEntityTags([immune]);
    table.addTagIfNotHaving(target, 'KnockDown');
    expect(target.hasEntityTag(knockDown)).toBe(false);
  });

  it('安装幂等，退出移除一次共享计数，没有第二份标签状态', () => {
    const { target, table } = setup();
    table.addTagIfNotHaving(target, 'KnockDown');
    table.addTagIfNotHaving(target, 'KnockDown');
    expect(target.matchesEntityTags([knockDown], 'hasAll')).toBe(true);
    table.removeTagIfHaving(target, 'KnockDown');
    expect(target.hasEntityTag(knockDown)).toBe(false);
    table.removeTagIfHaving(target, 'KnockDown');
    expect(target.hasEntityTag(knockDown)).toBe(false);
  });

  it('已有标签不增层；退出不是仅删除自己创建的句柄', () => {
    const { target, table } = setup();
    target.addEntityTags([knockDown, knockDown]);
    table.addTagIfNotHaving(target, 'KnockDown');
    table.removeTagIfHaving(target, 'KnockDown');
    expect(target.hasEntityTag(knockDown)).toBe(true);
    target.removeEntityTags([knockDown]);
    expect(target.hasEntityTag(knockDown)).toBe(false);
  });

  it('无映射明确失败；不能把预定义枚举整数当成标签 ID', () => {
    const { target, table } = setup();
    expect(() => table.getTag('Getup')).toThrow('missing predefined gameplay tag');
    expect(() => table.getQuery('CantCastAnySkill')).toThrow(
      'missing predefined gameplay tag query',
    );
    expect(() => table.addTagIfNotHaving(target, 'Getup')).toThrow(
      'missing predefined gameplay tag',
    );
  });

  it('同一配置不会共享不同模拟的可变标签', () => {
    const { target, table } = setup();
    const other = new CombatBuffContainer('enemy', new CombatAttributeSet<string>());
    table.addTagIfNotHaving(target, 'KnockDown');
    expect(other.hasEntityTag(knockDown)).toBe(false);
  });

  it('重复免疫身份不能覆盖，数字串不允许进入运行时', () => {
    expect(
      () =>
        new GameplayTagPredefine({ tags: { X: '2147483648' }, queries: {}, immunityQueries: [] }),
    ).toThrow('可读路径');
    const entry = { tag: knockDown, query: { queryType: 'hasAny' as const, tags: [] } };
    expect(
      () => new GameplayTagPredefine({ tags: {}, queries: {}, immunityQueries: [entry, entry] }),
    ).toThrow('duplicate immunity');
  });
});
