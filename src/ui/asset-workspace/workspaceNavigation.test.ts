import { describe, expect, it } from 'vitest';
import { WorkspaceNavigation } from './workspaceNavigation';

const location = (document: string, resource = '[]') => ({
  document,
  resource,
  page: 'overview',
  graphOpen: false,
});

describe('工作区导航', () => {
  it('返回后打开新内容丢弃前进记录，重复打开不增加记录', () => {
    const navigation = new WorkspaceNavigation();
    navigation.record(location('operator'));
    navigation.record(location('operator', 'skill'));
    navigation.record(location('weapon'));
    expect(navigation.travel(-1)).toEqual(location('operator', 'skill'));
    navigation.record(location('operator', 'buff'));
    navigation.record(location('operator', 'buff'));
    expect(navigation.canForward).toBe(false);
    expect(navigation.travel(-1)).toEqual(location('operator', 'skill'));
  });

  it('关闭其他文档不会把当前位置跳到历史末尾', () => {
    const navigation = new WorkspaceNavigation();
    navigation.record(location('operator'));
    navigation.record(location('weapon'));
    navigation.record(location('operator', 'skill'));
    navigation.travel(-1);
    navigation.travel(-1);
    expect(navigation.close('weapon')).toEqual(location('operator'));
    expect(navigation.travel(1)).toEqual(location('operator', 'skill'));
  });

  it('关闭当前文档优先回到前面的文档，并保留它的具体视图', () => {
    const navigation = new WorkspaceNavigation();
    const graph = { ...location('operator', 'skill'), page: 'graph', graphOpen: true };
    navigation.record(graph);
    navigation.record(location('weapon'));
    expect(navigation.close('weapon')).toEqual(graph);
    expect(navigation.canBack).toBe(false);
    expect(navigation.canForward).toBe(false);
    expect(navigation.close('operator')).toBeUndefined();
  });
});
