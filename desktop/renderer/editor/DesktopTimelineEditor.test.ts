import { expect, it, vi } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import type { TimelineEditorProps, TimelineExportContext } from '@/ui/timeline/timelineEditorHost';
import { createEmptyProject } from '@/core/project/createProject';
import DesktopTimelineEditor from './DesktopTimelineEditor.vue';

const fixture = vi.hoisted(() => ({
  context: {} as TimelineExportContext,
  receivedContext: undefined as TimelineExportContext | undefined,
  editorProps: undefined as Record<string, unknown> | undefined,
}));

vi.mock('@/ui/timeline/TimelineEditor.vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    default: defineComponent({
      props: [
        'initialScenario',
        'initialProject',
        'gameDataRepository',
        'browserPersistenceEnabled',
        'browserRestoreError',
        'browserRestoreRaw',
      ],
      emits: ['projectChange', 'initialReady'],
      setup(props, { emit, slots }) {
        fixture.editorProps = props;
        emit('projectChange', props.initialProject);
        emit('initialReady');
        return () => h('main', slots['toolbar-actions']?.({ context: fixture.context }));
      },
    }),
  };
});

vi.mock('./OverlayButton.vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    default: defineComponent({
      props: ['context'],
      setup(props) {
        fixture.receivedContext = props.context;
        return () => h('button', 'Desktop action');
      },
    }),
  };
});

it('桌面包装保留编辑器 props、项目更新和首轮就绪事件，并传入同一只读上下文', async () => {
  const initialProject = createEmptyProject({ createdWith: 'desktop-host-test' });
  const props: TimelineEditorProps = {
    initialProject,
    gameDataRepository: {} as TimelineEditorProps['gameDataRepository'],
    browserPersistenceEnabled: true,
    browserRestoreError: 'restore warning',
    browserRestoreRaw: 'saved text',
  };
  const onProjectChange = vi.fn();
  const onInitialReady = vi.fn();
  const app = createSSRApp({
    render: () => h(DesktopTimelineEditor, { ...props, onProjectChange, onInitialReady }),
  });

  expect(await renderToString(app)).toContain('Desktop action');
  expect(fixture.editorProps).toMatchObject(props);
  expect(fixture.receivedContext).toBe(fixture.context);
  expect(onProjectChange).toHaveBeenCalledExactlyOnceWith(initialProject);
  expect(onInitialReady).toHaveBeenCalledOnce();
});
