import { expect, it } from 'vitest';
import { createEmptyProject } from './createProject';
import { parseProjectDocument, serializeProjectDocument } from './serialization';

it('编辑中的标记和保存的标记使用同一结构，往返保留同帧顺序和空槽归属', () => {
  const project = createEmptyProject({ createdWith: 'test' });
  const scenario = project.scenarios[0]!;
  scenario.markers = [
    { kind: 'controlSwitch', id: 'switch', frame: 0, owner: { scope: 'emptySlot', trackIndex: 0 } },
    {
      kind: 'comboCooldownControl' as const,
      id: 'team',
      frame: 0,
      owner: { scope: 'team' },
      mode: 'ready',
    },
  ];
  const saved = JSON.parse(serializeProjectDocument(project));
  expect(saved.scenarios[0]).toEqual(scenario);
  expect(parseProjectDocument(saved)).toEqual({ ok: true, value: project });
});
