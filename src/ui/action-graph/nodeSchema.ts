import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { FieldSemanticMetadata } from '../field-editor/fieldSemantics';
import type { ActionGraphStep } from '../../../packages/game-data-contract/src/actionGraph.ts';

/** 从动作契约生成的表单字段；路径相对于节点的 action。 */
export interface NodeFieldSchema extends FieldSemanticMetadata {
  readonly valueSchema?: DefinitionFieldSchema;
  readonly path: readonly string[];
  readonly label: string;
  readonly description: string;
  readonly type: string;
  readonly required: boolean;
  readonly control:
    | 'number'
    | 'levelValues'
    | 'boolean'
    | 'string'
    | 'select'
    | 'multiselect'
    | 'operand'
    | 'json'
    | 'sequence'
    | 'resource';
  readonly options?: readonly (string | number | boolean)[];
}

export interface ActionNodeSchema {
  readonly kind: ActionGraphStep['kind'];
  readonly description: string;
  readonly fields: readonly NodeFieldSchema[];
}

export interface DataNodeSchema {
  readonly description: string;
  readonly fields: readonly NodeFieldSchema[];
}
