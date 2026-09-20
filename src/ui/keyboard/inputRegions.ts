/** Logical ownership, independent of DOM ancestry and CSS stacking contexts. */
export interface InputRegion {
  readonly id: symbol;
  readonly parent: InputRegion | null;
  readonly modal: boolean;
}

export class InputRegions {
  contains(region: InputRegion): boolean {
    return this.#isLive(region);
  }
  readonly #listeners = new Set<() => void>();
  onChange(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }
  #notify(): void {
    for (const listener of this.#listeners) listener();
  }
  readonly #live = new Set<InputRegion>();
  readonly #activations: { region: InputRegion; token: symbol }[] = [];

  create(label: string, parent: InputRegion | null = null, modal = false): InputRegion {
    if (parent !== null && !this.#isLive(parent))
      throw new Error('Input region parent is not live');
    const region = Object.freeze({ id: Symbol(label), parent, modal });
    this.#live.add(region);
    return region;
  }

  dispose(region: InputRegion): void {
    this.#live.delete(region);
    for (const child of this.#live) if (!this.#isLive(child)) this.#live.delete(child);
    // Descendants cannot outlive their parent, including teleported descendants.
    for (let index = this.#activations.length - 1; index >= 0; index--) {
      if (!this.#isLive(this.#activations[index]!.region)) this.#activations.splice(index, 1);
    }
    this.#notify();
  }

  activate(region: InputRegion): () => void {
    if (!this.#isLive(region)) throw new Error('Input region is not live');
    const current = this.path();
    const modal = current.find(item => item.modal);
    if (modal && !this.#descendsFrom(region, modal)) {
      throw new Error('Cannot activate a background region through a modal boundary');
    }
    const entry = { region, token: Symbol('input-region-activation') };
    this.#activations.push(entry);
    this.#notify();
    return () => {
      const index = this.#activations.indexOf(entry);
      if (index >= 0) {
        this.#activations.splice(index, 1);
        this.#notify();
      }
    };
  }

  /** Deepest region first. A modal is eligible itself but excludes its ancestors. */
  path(): readonly InputRegion[] {
    const path: InputRegion[] = [];
    let current: InputRegion | null = this.#activations.at(-1)?.region ?? null;
    while (current !== null && this.#isLive(current)) {
      path.push(current);
      if (current.modal) break;
      current = current.parent;
    }
    return path;
  }

  #isLive(region: InputRegion): boolean {
    return this.#live.has(region) && (region.parent === null || this.#isLive(region.parent));
  }

  #descendsFrom(region: InputRegion, ancestor: InputRegion): boolean {
    return (
      region === ancestor || (region.parent !== null && this.#descendsFrom(region.parent, ancestor))
    );
  }
}
