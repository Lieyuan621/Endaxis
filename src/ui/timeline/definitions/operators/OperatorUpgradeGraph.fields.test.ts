import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it, vi } from 'vitest';
import Page from './OperatorUpgradeGraphPage.vue';

async function editor(kind: 'talents' | 'potentials') {
  let panel: any;
  const commit = vi.fn();
  const upgrade = {
    levels: 2,
    eventHandlers: [
      {
        event: { kind: 'buffConsumed', buffIds: ['unknown,raw', 'same', 'same'] },
        sequence: { steps: [] },
      },
    ],
  };
  await renderToString(
    createSSRApp({
      render: () =>
        h(
          {
            ...(Page as any),
            setup(props: any, context: any) {
              panel = (Page as any).setup(props, context);
              return panel;
            },
            ssrRender() {},
          },
          {
            upgrade,
            kind,
            slot: 0,
            skillLevel: 1,
            skillGroupKeys: [],
            passiveSkillKeys: [],
            history: { commit },
            createModifier: vi.fn(),
          },
        ),
    }),
  );
  return { panel, commit, upgrade };
}

it('does not coerce empty or fractional talent levels and never edits potential levels', async () => {
  const { panel, commit } = await editor('talents');
  for (const value of ['', ' ', '0', '1.5', 'NaN']) panel.setTalentLevels({ target: { value } });
  expect(commit).not.toHaveBeenCalled();
  panel.setTalentLevels({ target: { value: '3' } });
  expect(commit).toHaveBeenCalledWith(expect.objectContaining({ levels: 3 }), {
    path: '',
    propertyPath: ['levels'],
  });
  const potential = await editor('potentials');
  potential.panel.setTalentLevels({ target: { value: '3' } });
  expect(potential.commit).not.toHaveBeenCalled();
});

it('records the owning event and field without normalizing list references', async () => {
  const { panel, commit, upgrade } = await editor('talents');
  const buffIds = ['same', 'unknown,raw', 'same'];
  panel.patch('eventHandlers[0].event', upgrade.eventHandlers[0]!.event, 'buffIds', buffIds);
  expect(commit.mock.calls[0]![0].eventHandlers[0].event.buffIds).toEqual(buffIds);
  expect(commit.mock.calls[0]![1]).toEqual({
    path: 'eventHandlers[0].event',
    propertyPath: ['buffIds'],
  });
  expect(upgrade.eventHandlers[0]!.event.buffIds).toEqual(['unknown,raw', 'same', 'same']);
});
