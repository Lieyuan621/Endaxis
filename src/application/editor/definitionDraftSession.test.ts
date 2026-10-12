import { describe, expect, it } from 'vitest';
import { DefinitionDraftSession, updateDefinitionField } from './definitionDraftSession';

describe('对象与附属资源共用草稿', () => {
  it('撤销字段和子图修改，取消不会改变来源，导出的定义不暴露草稿引用', () => {
    const source = { name: '原名', skill: { graph: { nodes: [{ value: 1 }] } } };
    const session = new DefinitionDraftSession(source);
    expect(() => session.update(current => ({ ...current, name: '非法修改' }))).toThrow(
      /read-only/,
    );
    expect(session.current).toBe(source);
    session.customize();
    session.update(current => updateDefinitionField(current, ['name'], '新名'));
    session.update(current =>
      updateDefinitionField(current, ['skill', 'graph', 'nodes', 0, 'value'], 2),
    );
    expect(session.current).toMatchObject({
      name: '新名',
      skill: { graph: { nodes: [{ value: 2 }] } },
    });
    expect(session.undo()).toBe(true);
    expect(session.current.skill.graph.nodes[0]!.value).toBe(1);
    expect(session.undo()).toBe(true);
    expect(session.current.name).toBe('原名');
    expect(session.redo()).toBe(true);
    expect(session.current.name).toBe('新名');
    const saved = session.exportDefinition();
    expect(saved).not.toBe(session.current);
    expect(saved.skill).not.toBe(session.current.skill);
    expect(source).toEqual({ name: '原名', skill: { graph: { nodes: [{ value: 1 }] } } });
  });

  it('不会通过失效的路径重建已删除的附属资源', () => {
    const session = new DefinitionDraftSession<{ buffs: Record<string, { value: number }> }>({
      buffs: { active: { value: 1 } },
    });
    session.customize();
    session.update(current => ({ ...current, buffs: {} }));
    expect(() =>
      session.update(current => updateDefinitionField(current, ['buffs', 'active', 'value'], 2)),
    ).toThrow(/missing/);
    expect(session.current.buffs).toEqual({});
  });
});
