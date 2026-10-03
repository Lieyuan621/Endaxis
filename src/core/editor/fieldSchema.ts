import type { FieldSemanticMetadata } from './fieldSemantics.ts';

/** 对象字段编辑器消费的类型描述；由工具从正式契约生成。 */
export type DefinitionFieldSchema = FieldSemanticMetadata & {
  readonly references?: DefinitionSchemaReferences;
} & (
    | {
        readonly kind: 'ref';
        readonly ref: string;
        readonly optional?: boolean;
        readonly description?: string;
      }
    | {
        readonly kind: 'number' | 'string' | 'boolean' | 'null';
        readonly optional?: boolean;
        readonly description?: string;
      }
    | {
        readonly kind: 'enum';
        readonly options: readonly (string | number | boolean)[];
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
        readonly kind: 'tuple';
        readonly elements: readonly DefinitionFieldSchema[];
        readonly minLength: number;
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
        readonly kind: 'graph' | 'condition' | 'opaque' | 'timeScaleCurve';
        readonly optional?: boolean;
        readonly description?: string;
      }
  );

export type DefinitionSchemaCatalog = Readonly<Record<string, DefinitionFieldSchema>>;

/** Finite, JSON-shaped bodies scoped to one generated root, never a global catalog. */
export type DefinitionSchemaReferences = Readonly<Record<string, DefinitionFieldSchema>>;
