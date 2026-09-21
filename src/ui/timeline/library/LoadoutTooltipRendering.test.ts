import { beforeAll, describe, expect, it } from 'vitest';
import { createSSRApp, h, type Component } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { i18n, setLocale } from '../../../i18n/index';
import { gameDataRepository } from '../../../data/gameDataRepository';
import {
  getGearPieceGameName,
  getOperatorPotentialDescription,
  getOperatorTalentDescription,
} from '../../gameText';
import { GameRichTextRenderer } from '../../presentation';
import EquipmentSelectionTooltip from './EquipmentSelectionTooltip.vue';
import OperatorSkillTooltip from './OperatorSkillTooltip.vue';
import { getGearDefinitionSelectionAffixRows } from './gearAffixPresentation';
import WeaponSelectionTooltip from './WeaponSelectionTooltip.vue';
import { KeyboardShortcutRouter } from '../../keyboard/keyboardShortcutRouter';

async function renderComponent(component: Component, props: Record<string, unknown>) {
  const app = createSSRApp({
    render: () => h(component, props),
  });
  app.use(i18n);
  app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
  app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  return renderToString(app);
}

describe('构筑 tooltip 渲染', () => {
  beforeAll(async () => {
    await setLocale('zh-CN', ['operators', 'weapons', 'gears']);
  });

  it('梨诺终结技名称、等级和富文本进入干员技能 tooltip', async () => {
    const html = await renderComponent(OperatorSkillTooltip, {
      operator: gameDataRepository.getOperator('liino'),
      operatorSlug: 'liino',
      skillKey: 'ultimate',
      skillLevel: 12,
      skillTypeName: '终结技',
    });

    expect(html).toContain('operator-skill-tooltip');
    expect(html).toContain('晨星的协奏曲');
    expect(html).toContain('终结技');
    expect(html).toContain('高歌姿态');
    expect(html).toContain('game-rich-text');
    expect(html).toContain('终结技能量');
    expect(html).not.toContain('>ultimateEnergy<');
  });

  it('战技消耗使用技力的中文名称', async () => {
    const html = await renderComponent(OperatorSkillTooltip, {
      operator: gameDataRepository.getOperator('arcane'),
      operatorSlug: 'arcane',
      skillKey: 'battleSkill',
      skillLevel: 1,
      skillTypeName: '战技',
    });
    expect(html).toContain('技力');
    expect(html).not.toContain('>sp<');
  });

  it('提弗洛斯战技显示自身消耗，而非按战技等级升级的强化普攻', async () => {
    const html = await renderComponent(OperatorSkillTooltip, {
      operator: gameDataRepository.getOperator('typhoeus'),
      operatorSlug: 'typhoeus',
      skillKey: 'battleSkill',
      skillLevel: 1,
      skillTypeName: '战技',
    });
    expect(html).toMatch(
      /operator-skill-tooltip-resource[^>]*><span[^>]*>技力<\/span><span[^>]*>100<\/span>/,
    );
  });

  it('诀的两种形态显示各自说明与相同的原生基础冷却', async () => {
    const operator = gameDataRepository.getOperator('arcane');
    for (const [form, name] of [
      ['int', '阵诀·智'],
      ['will', '阵诀·意'],
    ] as const) {
      const html = await renderComponent(OperatorSkillTooltip, {
        operator,
        operatorSlug: 'arcane',
        skillKey: 'comboSkill',
        skillLevel: 12,
        skillTypeName: '连携',
        activeFormKey: form,
      });
      expect(html).toContain(name);
      expect(html).toContain('18秒');
    }
  });

  it('曜夜选择 tooltip 按潜能状态渲染正确等级和值', async () => {
    const bedazzlingNightDebut = gameDataRepository.getWeapon('wpn_lance_0014')!;
    const normalHtml = await renderComponent(WeaponSelectionTooltip, {
      weapon: bedazzlingNightDebut,
      name: '曜夜的首演',
      fullPotential: false,
    });
    const fullHtml = await renderComponent(WeaponSelectionTooltip, {
      weapon: bedazzlingNightDebut,
      name: '曜夜的首演',
      fullPotential: true,
    });

    expect(normalHtml).toContain('weapon-selection-preview');
    expect(normalHtml).toContain('曜夜的首演');
    expect(normalHtml).toContain('医疗·闪耀帷幕');
    expect(normalHtml).toContain('Lv4');
    expect(normalHtml).toContain('+25.6%');
    expect(normalHtml).toContain('game-rich-text');

    expect(fullHtml).toContain('Lv9');
    expect(fullHtml).toContain('+44.8%');
    expect(fullHtml).toContain('+9.8%');
  });

  it('三星武器 tooltip 使用 skill1 与 skill3，而不是虚构 skill2', async () => {
    const weapon = gameDataRepository.getWeapon('wpn_pistol_0001')!;
    expect(weapon.traits.map(trait => trait.key)).toEqual(['skill1', 'skill3']);
    const html = await renderComponent(WeaponSelectionTooltip, {
      weapon,
      name: '测试三星武器',
      fullPotential: false,
    });
    expect(html).toContain('测试三星武器');
    expect(html).toContain('weapon-selection-preview__skill');
    expect(html).toContain('主能力提升·小');
    expect(html).toContain('强攻·武装整备');
  });

  it('按住状态路由驱动满潜 tooltip，松开及遮挡恢复且不修改定义', async () => {
    const weapon = gameDataRepository.getWeapon('wpn_lance_0014')!;
    const original = JSON.stringify(weapon);
    const router = new KeyboardShortcutRouter();
    let fullPotential = false;
    let covered = false;
    router.register({
      id: 'weapon-selection',
      priority: 1500,
      active: () => true,
      blockLowerScopes: true,
      handle: () => false,
      observeKeyboardState: event => {
        fullPotential = event?.ctrlKey ?? false;
      },
    });
    router.register({
      id: 'modal',
      priority: 2000,
      active: () => covered,
      blockLowerScopes: true,
      handle: () => false,
    });
    const renderPreview = () =>
      renderComponent(WeaponSelectionTooltip, {
        weapon,
        name: '曜夜的首演',
        fullPotential,
      });
    const normal = await renderPreview();
    const down = Object.assign(new Event('keydown', { cancelable: true }), {
      key: 'Control',
      ctrlKey: true,
    }) as KeyboardEvent;
    router.route(down);
    const full = await renderPreview();
    expect(full).toContain('Lv9');
    expect(full).toContain('+44.8%');
    expect(down.defaultPrevented).toBe(false);
    router.updateKeyboardState(
      Object.assign(new Event('keyup'), {
        key: 'Control',
        ctrlKey: false,
      }) as KeyboardEvent,
    );
    expect(await renderPreview()).toBe(normal);
    router.route(down);
    covered = true;
    router.revokeInactiveKeyboardState();
    expect(await renderPreview()).toBe(normal);
    expect(JSON.stringify(weapon)).toBe(original);
  });

  it('全部当前武器 tooltip 不使用默认图标', async () => {
    const failures: string[] = [];
    for (const weapon of gameDataRepository.getWeapons()) {
      const html = await renderComponent(WeaponSelectionTooltip, {
        weapon,
        name: weapon.displayName ?? weapon.slug,
        fullPotential: false,
      });
      if (html.includes('/icons/default_icon.webp')) {
        failures.push(`${weapon.slug}: default icon`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('装备选择 tooltip 渲染词条和套装富文本', async () => {
    const canonicalSlug = 'item_equip_t4_suit_expend_spell01_body_02';
    const definition = gameDataRepository.getGear(canonicalSlug)!;
    const affixRows = getGearDefinitionSelectionAffixRows(definition, (key, named) =>
      String(i18n.global.t(key, named ?? {})),
    );
    const html = await renderComponent(EquipmentSelectionTooltip, {
      equipment: {
        id: canonicalSlug,
        canonicalId: canonicalSlug,
        name: getGearPieceGameName(canonicalSlug, 'zh-CN'),
        category: definition.gearSetSlug ?? '',
      },
      affixRows,
      gearSetName: '壤流',
      gearSetDescription: '测试套装说明',
    });

    expect(affixRows.length).toBeGreaterThan(0);
    expect(html).toContain('equipment-selection-preview');
    expect(html).toContain('壤流轻甲');
    expect(html).toContain('equipment-selection-preview__affix-row');
    expect(html).toContain('equipment-selection-preview__set-bonus');
    expect(html).toContain('game-rich-text');
  });

  it('全部当前装备都能从自身定义投影出可读词条', () => {
    const failures = gameDataRepository.getGears().flatMap(definition => {
      const rows = getGearDefinitionSelectionAffixRows(definition, (key, named) =>
        String(i18n.global.t(key, named ?? {})),
      );
      if (rows.length === 0) return [`${definition.slug}: no rows`];
      return rows.flatMap(row => {
        if (row.modifierId.length === 0 || row.label.length === 0 || row.valueText.length === 0) {
          return [`${definition.slug}: incomplete ${row.modifierId}`];
        }
        if (row.label === row.modifierId) {
          return [`${definition.slug}: untranslated ${row.modifierId}`];
        }
        if (row.src === '/icons/default_icon.webp') {
          return [`${definition.slug}: default icon ${row.modifierId}`];
        }
        return [];
      });
    });
    expect(failures).toEqual([]);
  });

  it('梨诺天赋和潜能描述可由统一富文本组件渲染', async () => {
    const talentHtml = await renderComponent(GameRichTextRenderer, {
      text: getOperatorTalentDescription('liino', 0, 0, 'zh-CN'),
      locale: 'zh-CN',
    });
    const potentialHtml = await renderComponent(GameRichTextRenderer, {
      text: getOperatorPotentialDescription('liino', 0, 'zh-CN'),
      locale: 'zh-CN',
    });

    expect(talentHtml).toContain('game-rich-text');
    expect(talentHtml).toContain('+10%');
    expect(potentialHtml).toContain('game-rich-text');
    expect(potentialHtml).toContain('返还');
  });
});
