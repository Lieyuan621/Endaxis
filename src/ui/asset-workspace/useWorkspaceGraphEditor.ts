import { computed, reactive } from 'vue';
import type { SkillDefinition } from '../../core/game-data/operatorDefinition';
import type { ActionGraphResourceOwner } from '../../application/editor/actionGraphResourceEditing';
import { useResourceGraphEditor } from '../action-graph/useResourceGraphEditor';
import { useSkillGraphEditor } from '../action-graph/useSkillGraphEditor';
import { resourcePresentationKey } from '../definition-editor/definitionResources';
import type { WorkspaceAssetSession } from './workspaceSession';
import type { WorkspaceResourceView } from './workspaceViews';

/** 将当前资源的图操作接入资产文档；不持有副本，也不建立独立的修改历史。 */
export interface WorkspaceGraphHost {
  session: () => WorkspaceAssetSession;
  view: () => WorkspaceResourceView;
  identity: () => string;
  label: () => string;
  path: () => readonly (string | number)[];
  owner: () => ActionGraphResourceOwner | undefined;
  skill: () => SkillDefinition | undefined;
  busy: () => boolean;
  changed: () => void;
  undo: () => void;
  redo: () => void;
}

export function useWorkspaceGraphEditor(host: WorkspaceGraphHost) {
  const presentation = computed(() => {
    const session = host.session();
    if (!session.history.editable) return undefined;
    const draft = session.current;
    return draft.graphPresentations[resourcePresentationKey(draft.edit.definition, host.path())];
  });
  const resource = reactive(
    useResourceGraphEditor({
      label: host.label,
      view: host.view,
      owner: () => host.owner()!,
      readonly: () => !host.session().history.editable,
      presentation: () => presentation.value,
      identity: host.identity,
      change: (change, layout) => {
        host.session().changeGraph(host.path(), change, layout);
        host.changed();
      },
    }),
  );
  const skill = reactive(
    useSkillGraphEditor({
      view: host.view,
      definition: () => host.skill()!,
      editable: () => host.session().history.editable,
      busy: host.busy,
      label: host.label,
      identity: host.identity,
      presentation: () => presentation.value,
      change: (change, layout) => {
        host.session().changeGraph(host.path(), owner => change(owner as SkillDefinition), layout);
        host.changed();
      },
      undo: host.undo,
      redo: host.redo,
    }),
  );
  function canLeaveFields() {
    return host.skill() ? skill.canLeaveFields() : resource.canLeaveFields();
  }
  function cancelConnection() {
    (host.skill() ? skill.canvas : resource.canvas)?.cancelConnection();
  }
  return { skill, resource, canLeaveFields, cancelConnection };
}
