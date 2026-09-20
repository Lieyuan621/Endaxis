import { describe, expect, it } from 'vitest';
import {
  indexDefinitionReferenceNodes,
  resolveDefinitionReferenceClosure,
  type DefinitionReferenceNodeSource,
  type DefinitionReferenceSource,
} from '../../src/index.ts';

describe('定义引用闭包', () => {
  it('只沿活动静态边遍历，并安全终止循环', () => {
    const nodes: DefinitionReferenceNodeSource[] = [
      node('skill', 'root', [
        reference('skill', 'child', 'active'),
        reference('buff', 'ignored', 'inactive'),
      ]),
      node('skill', 'child', [
        reference('skill', 'root', 'active'),
        reference('buff', 'missing_buff', 'active'),
      ]),
    ];
    const closure = resolveDefinitionReferenceClosure([['skill', 'root']], nodes);
    expect(closure.definitions.map(item => item.id)).toEqual(['root', 'child']);
    expect(closure.missing).toMatchObject([
      { sourceKind: 'skill', sourceId: 'child', reference: { kind: 'buff', id: 'missing_buff' } },
    ]);
  });

  it('拒绝同类型重复定义和不存在的根', () => {
    expect(() =>
      indexDefinitionReferenceNodes([node('skill', 'same'), node('skill', 'same')]),
    ).toThrow(/duplicate skill/);
    expect(() => resolveDefinitionReferenceClosure([['skill', 'missing']], [])).toThrow(
      /missing root definition/,
    );
  });
});

function node(
  kind: DefinitionReferenceNodeSource['kind'],
  id: string,
  references: DefinitionReferenceSource[] = [],
): DefinitionReferenceNodeSource {
  return { kind, id, sourcePath: `${kind}/${id}.json`, references };
}

function reference(
  kind: DefinitionReferenceSource['kind'],
  id: string,
  state: DefinitionReferenceSource['state'],
): DefinitionReferenceSource {
  return { kind, usage: 'test', state, id, blackboardKey: null, sourcePath: 'fixture.reference' };
}
