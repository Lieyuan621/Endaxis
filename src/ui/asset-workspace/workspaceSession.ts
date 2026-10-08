import {
  DefinitionDraftSession,
  updateDefinitionField,
} from '../../application/editor/definitionDraftSession';
import type { ProjectTemplateEdit } from '../../application/editor/projectTemplateCommands';
import type { SkillGraphPresentation } from '../../core/project/graphPresentation';
import type { ActionGraphResourceOwner } from '../../application/editor/actionGraphResourceEditing';
import { validateActionGraphOwner } from '../../core/action-graph/actionGraphValidation';
import {
  listDefinitionResources,
  resourcePresentationKey,
} from '../definition-editor/definitionResources';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import { assertEditableDefinitionField } from '../definition-editor/definitionFieldRuntime';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import {
  editOperatorResources,
  type OperatorResourceCommand,
} from '../../application/editor/operatorResourceCommands';
import type { AssetCatalogEntry } from './assetCatalog';
import { supportsCustomAsset, type WorkspaceAssetDefinition } from './workspaceAssetDefinition';

export interface WorkspaceAssetSource extends AssetCatalogEntry {
  readonly edit: WorkspaceAssetDefinition;
  readonly graphPresentations?: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface WorkspaceAssetDraft {
  readonly edit: WorkspaceAssetDefinition;
  readonly name: string;
  readonly graphPresentations: Readonly<Record<string, SkillGraphPresentation>>;
}

export interface WorkspaceAssetSave {
  readonly draft: WorkspaceAssetDraft & { readonly edit: ProjectTemplateEdit };
  readonly sourceId: string;
  readonly targetId: string;
  readonly replace: boolean;
}

/** 一个顶级资产及其内部资源共用一份草稿。导航不复制定义，不另建子资源会话。 */
export class WorkspaceAssetSession {
  readonly history: DefinitionDraftSession<WorkspaceAssetDraft>;
  readonly sourceId: string;
  readonly targetId: string;
  #persisted: boolean;
  #saved: WorkspaceAssetDraft;

  constructor(
    readonly source: WorkspaceAssetSource,
    customId?: string,
  ) {
    if (!supportsCustomAsset(source.edit) && (customId !== undefined || source.custom))
      throw new Error('this asset is read-only');
    // 全局效果没有 slug；资产身份就是 definition.id，派生保存时由命令改写为项目 ID。
    this.sourceId = supportsCustomAsset(source.edit)
      ? source.edit.kind === 'globalEffect'
        ? source.edit.definition.id
        : source.edit.definition.slug
      : source.id;
    this.targetId = customId ?? this.sourceId;
    this.#persisted = customId === undefined;
    this.history = new DefinitionDraftSession(
      {
        edit: source.edit,
        name: source.name,
        graphPresentations: source.custom ? (source.graphPresentations ?? {}) : {},
      },
      source.custom || customId !== undefined,
    );
    this.#saved = this.history.current;
  }

  get current(): WorkspaceAssetDraft {
    return this.history.current;
  }
  get dirty(): boolean {
    return this.history.editable && (!this.#persisted || this.current !== this.#saved);
  }

  change(path: readonly (string | number)[], value: unknown): void {
    const current = this.current;
    if (!supportsCustomAsset(current.edit)) throw new Error('this asset is read-only');
    if (current.edit.kind === 'globalEffect' && path[0] === 'id')
      throw new Error('definition identity is read-only');
    // 父资产的字段表刻意不展开独立资源；进入子资源后使用它自己的完整字段表。
    // 只允许修改资源内部字段，不能借此替换整个资源或绕过身份、图结构校验。
    const resource = listDefinitionResources(current.edit.kind, current.edit.definition)
      .filter(
        resource =>
          resource.path.length < path.length &&
          resource.path.every((part, index) => path[index] === part),
      )
      .sort((left, right) => right.path.length - left.path.length)[0]!;
    const owner = fieldValueAt(current.edit.definition, resource.path);
    const graphOwner =
      owner && typeof owner === 'object' && 'actionGraph' in owner
        ? (owner as ActionGraphResourceOwner)
        : undefined;
    assertEditableDefinitionField(
      definitionSchemas[resource.kind],
      fieldValueAt(current.edit.definition, resource.path),
      path.slice(resource.path.length),
      value,
      'definition',
      undefined,
      graphOwner?.actionGraph.main,
    );
    this.history.update(draft =>
      updateDefinitionField(draft, ['edit', 'definition', ...path], value, true),
    );
  }

  editOperatorResources(command: OperatorResourceCommand): void {
    this.history.update(draft => {
      if (draft.edit.kind !== 'operator') throw new Error('Expected an operator');
      const definition = editOperatorResources(draft.edit.definition, command);
      return definition === draft.edit.definition
        ? draft
        : { ...draft, edit: { kind: 'operator', definition } };
    });
  }

  /** 图命令读取当前资源，直接写回资产历史；节点、调度和普通属性共享撤销顺序。 */
  changeGraph(
    path: readonly (string | number)[],
    change: (owner: ActionGraphResourceOwner) => ActionGraphResourceOwner,
    presentation?: SkillGraphPresentation,
  ): boolean {
    return this.history.update(draft => {
      const owner = fieldValueAt(draft.edit.definition, path);
      if (!owner || typeof owner !== 'object' || !('actionGraph' in owner))
        throw new Error('selected resource has no action graph');
      const next = change(owner as ActionGraphResourceOwner);
      if (next !== owner) validateActionGraphOwner(next, 'resource');
      const key = resourcePresentationKey(draft.edit.definition, path);
      const layoutChanged =
        presentation !== undefined && presentation !== draft.graphPresentations[key];
      if (next === owner && !layoutChanged) return draft;
      const updated =
        next === owner
          ? draft
          : updateDefinitionField(draft, ['edit', 'definition', ...path], next);
      return layoutChanged
        ? { ...updated, graphPresentations: { ...updated.graphPresentations, [key]: presentation } }
        : updated;
    });
  }

  rename(name: string): void {
    if (!name.trim()) throw new Error('asset name must not be empty');
    this.history.update(draft => (draft.name === name ? draft : { ...draft, name }));
  }

  saveRequest(): WorkspaceAssetSave {
    const draft = this.history.exportDefinition();
    if (!supportsCustomAsset(draft.edit)) throw new Error('this asset is read-only');
    return {
      draft: { ...draft, edit: draft.edit },
      sourceId: this.sourceId,
      targetId: this.targetId,
      replace: this.#persisted,
    };
  }

  /** 仅在项目提交成功后确认保存；失败时保留整个草稿和撤销历史。 */
  saved(): void {
    this.#persisted = true;
    this.#saved = this.current;
  }
}
