import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Inspector from './BuffCalculationNodeInspector.vue';
import { buildBuffCalculationModifierGraph } from './buffCalculationModifierGraph';
import { createDefinitionEditContext } from '../definitionEditContext';
import { indexSkillStructureNodes } from '../skillStructureMindMapModel';
import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';

it('renders own fields only, keeping healing sides and damage tag vocabulary separate', async () => {
  const doc: SkillBuffDefinition = {
    stackingType: 'refresh',
    healModifiers: [
      {
        enabledSide: 'receiver',
        condition: {
          kind: 'buffBlackboardCompare',
          left: { blackboardKey: 'left' },
          operator: 'equal',
          right: 2,
        },
        processors: [
          {
            kind: 'modifyCalculationResult',
            timing: 'afterCalculation',
            baseMultiplier: 0.5,
            multiplierCount: 2,
          },
          {
            kind: 'modifyHealingIncrease',
            timing: 'beforeCalculation',
            side: 'healer',
            addition: 1,
          },
        ],
      },
    ],
    poiseModifiers: [
      {
        enabledSide: 'attacker',
        condition: {
          kind: 'all',
          conditions: [{ kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalAttack'] }],
        },
        processors: [
          { kind: 'modifyPoiseScalar', timing: 'beforeCalculation', side: 'defender', addition: 1 },
        ],
      },
    ],
  };
  const roots = buildBuffCalculationModifierGraph(doc);
  const binding = createDefinitionEditContext({ read: () => doc, commit: vi.fn() }).root;
  async function render(path: (string | number)[]) {
    const sourcePath = path.reduce<string>(
      (s, part) => (typeof part === 'number' ? `${s}[${part}]` : `${s ? `${s}.` : ''}${part}`),
      '',
    );
    const node = roots
      .flatMap(root => [...indexSkillStructureNodes(root).values()])
      .find(node => node.sourcePath === sourcePath)!;
    const property = path.reduce((p, key) => p.child(key), binding);
    const app = createSSRApp({ render: () => h(Inspector, { node, property }) });
    app.use(
      createI18n({
        legacy: false,
        locale: 'zh',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    return renderToString(app);
  }
  const parent = await render(['healModifiers', 0]);
  expect(parent).toContain('治疗接收方');
  expect(parent).not.toContain('基础倍率');
  expect(await render(['healModifiers', 0, 'condition'])).toContain('value="left"');
  expect(await render(['healModifiers', 0, 'processors', 0])).toContain('计算结束后处理');
  expect(await render(['healModifiers', 0, 'processors', 1])).toContain('治疗施加方');
  expect(await render(['poiseModifiers', 0, 'processors', 0])).toContain('伤害目标方');
  const all = await render(['poiseModifiers', 0, 'condition']);
  expect(all).toContain('子条件在节点图中编辑');
  expect(all).not.toContain('normalAttack');
  const tags = await render(['poiseModifiers', 0, 'condition', 'conditions', 0]);
  expect(tags).toContain('normalAttack');
  expect(tags).not.toContain('GameplayTag');
});
