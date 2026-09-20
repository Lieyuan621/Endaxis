import { expect, it } from 'vitest';
import { BUFF_OPTIONAL_OBJECTS } from './buffOptionalPropertyDefaults';
import {
  buildBuffStructureMindMap,
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';

it('纯属性对象在独立及内联 Buff 中不再生成节点，无论已启用还是未设置', () => {
  for (const definition of [
    { stackingType: 'refresh' as const },
    {
      stackingType: 'refresh' as const,
      sustainedProtection: BUFF_OPTIONAL_OBJECTS.sustainedProtection.create(),
      role: BUFF_OPTIONAL_OBJECTS.role.create(),
      spellBurst: BUFF_OPTIONAL_OBJECTS.spellBurst.create(),
    },
  ]) {
    const roots = [
      buildBuffStructureMindMap('test', definition),
      buildActionSequenceMindMap({
        steps: [
          {
            kind: 'applyBuff',
            parameters: { target: 'caster', buffId: 'test', definition },
          },
        ],
      }),
    ];
    for (const root of roots) {
      const paths = [...indexSkillStructureNodes(root).values()].map(node => node.sourcePath);
      expect(paths.some(path => /(?:^|\.)(sustainedProtection|role|spellBurst)$/.test(path))).toBe(
        false,
      );
    }
  }
});
