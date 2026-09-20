import { describe, expect, it } from 'vitest';
import { auditGameplayTagReferences } from '../src/audits/gameplayTagReferences.ts';
import { GameplayTagRegistry, gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';

const tags = ['Status/Immobilized/KnockDown', 'Status/Immobilized/Getup'];
const registry = new GameplayTagRegistry(tags);
const ref = (path: string) => ({ tagId: gameplayTagIdFromPath(path) });
const query = (type = 'CheckTagMatch') => ({
  $type: `Beyond.Gameplay.Core.Conditions.${type}+Data, Gameplay.Beyond`,
  checkTarget: { targetSource: 'Owner' },
  query: { queryType: 'ExceptAny', tags: [ref('Status/Immobilized')] },
});

describe('原始标签引用盘点', () => {
  it('祖先查询影响两个子标签，Owner 只保留来源语义，不猜成敌人', () => {
    const result = auditGameplayTagReferences(query(), 'BuffData.test', registry, tags);
    expect(result.references).toEqual([
      {
        sourcePath: 'BuffData.test.query.tags[0]',
        tag: 'Status/Immobilized',
        affectedTags: tags,
        role: 'entity-query',
        nativeType: query().$type,
        targetSource: 'Owner',
        queryType: 'ExceptAny',
        disabled: false,
      },
    ]);
  });
  it('标签写入与 Buff 分类检查不冒充实体状态读取', () => {
    const result = auditGameplayTagReferences(
      { applyTags: [ref(tags[0]!)], condition: query('CheckBuffIdInContext') },
      'buff',
      registry,
      tags,
    );
    expect(result.references.map(ref => ref.role)).toEqual(['other-reference', 'other-reference']);
  });
  it('保留禁用祖先和准确路径，不把原始出现次数当运行覆盖率', () => {
    const result = auditGameplayTagReferences(
      { isEnable: false, actions: [query()] },
      'skill',
      registry,
      tags,
    );
    expect(result.references[0]).toMatchObject({
      disabled: true,
      sourcePath: 'skill.actions[0].query.tags[0]',
    });
  });
  it('未知和畸形 ID 明确报告，原生无效零值不造成虚假的依赖', () => {
    const result = auditGameplayTagReferences(
      [{ tagId: 0 }, { tagId: 123 }, { tagId: '123' }],
      'input',
      registry,
      tags,
    );
    expect(result.tagReferenceCount).toBe(3);
    expect(result.references).toEqual([]);
    expect(result.unresolved).toHaveLength(2);
  });
  it('子标签引用不会反过来命中兄弟或父标签', () => {
    const result = auditGameplayTagReferences(ref(tags[0]!), 'query', registry, [
      tags[1]!,
      'Status/Immobilized',
    ]);
    expect(result.references).toEqual([]);
  });
});
