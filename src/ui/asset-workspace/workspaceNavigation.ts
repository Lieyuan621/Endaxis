/** 导航只记录打开的内容；节点选择、输入焦点和资产修改历史各自独立。 */
export interface WorkspaceLocation {
  readonly document: string;
  readonly resource: string;
  readonly page: string;
  readonly graphOpen: boolean;
}

export class WorkspaceNavigation {
  private entries: WorkspaceLocation[] = [];
  private index = -1;

  get canBack() {
    return this.index > 0;
  }

  get canForward() {
    return this.index < this.entries.length - 1;
  }

  get current(): WorkspaceLocation | undefined {
    return this.entries[this.index];
  }

  record(location: WorkspaceLocation) {
    const previous = this.current;
    if (
      previous?.document === location.document &&
      previous.resource === location.resource &&
      previous.page === location.page &&
      previous.graphOpen === location.graphOpen
    )
      return;
    this.entries = [...this.entries.slice(0, this.index + 1), { ...location }];
    this.index = this.entries.length - 1;
  }

  travel(direction: -1 | 1): WorkspaceLocation | undefined {
    const next = this.index + direction;
    if (!this.entries[next]) return undefined;
    this.index = next;
    return this.current;
  }

  /** 关闭文档时保持当前历史位置；若当前文档被关闭，优先回到前一个仍打开的文档。 */
  close(document: string): WorkspaceLocation | undefined {
    const before = this.entries
      .slice(0, this.index + 1)
      .filter(entry => entry.document !== document);
    const after = this.entries.slice(this.index + 1).filter(entry => entry.document !== document);
    this.entries = [...before, ...after];
    this.index = before.length ? before.length - 1 : after.length ? 0 : -1;
    return this.current;
  }
}
