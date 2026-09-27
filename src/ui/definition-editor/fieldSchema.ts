/** 对象字段编辑器消费的类型描述；由工具从正式契约生成。 */
export type DefinitionFieldSchema =
  | {
      readonly kind: 'number' | 'string' | 'boolean' | 'null';
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'enum';
      readonly options: readonly (string | number)[];
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'array';
      readonly element: DefinitionFieldSchema;
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'record';
      readonly value: DefinitionFieldSchema;
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'object';
      readonly fields: Readonly<Record<string, DefinitionFieldSchema>>;
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'union';
      readonly variants: readonly DefinitionFieldSchema[];
      readonly optional?: boolean;
      readonly description?: string;
    }
  | {
      readonly kind: 'graph' | 'condition' | 'opaque';
      readonly optional?: boolean;
      readonly description?: string;
    };

export type DefinitionSchemaCatalog = Readonly<Record<string, DefinitionFieldSchema>>;
