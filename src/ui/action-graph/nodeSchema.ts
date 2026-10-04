import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';

/** 从动作契约生成的表单字段；路径相对于节点的 action。 */
export interface NodeFieldSchema {
  readonly valueSchema: DefinitionFieldSchema;
  readonly path: readonly string[];
  readonly description: string;
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
  /** Only ambiguous enum labels need a domain-specific vocabulary. */
  readonly optionLabels?: 'operatorRole';
  readonly options?: readonly (string | number | boolean)[];
}

export interface NodeSchema {
  readonly fields: readonly NodeFieldSchema[];
}
