import type { State, Identifier, Nullable } from "./util.ts";
import type { CacheOptions } from "./cache.ts";

const decoder = new TextDecoder("utf-8");

interface CacheValues {
  limit: number;
  overwrites: number;
}

export class CacheState {
  #internal: State;
  #logical: boolean;
  #threshold: number;
  #increase: number;
  #entries: Map<Identifier, any>;
  constructor(opts?: CacheOptions) {
    this.#entries = new Map();
    this.#logical = opts?.logical ?? false;
    this.#threshold = opts?.threshold ?? 10;
    this.#increase = opts?.increase ?? 10;
    this.#internal = {
      limit: opts?.limit ?? 10000,
      oldLimit: opts?.logical ? opts.limit ?? 10000 : undefined,
      overwrites: 0,
    };
  }
  private updateState(newState: any): void {
    this.#internal = { ...this.#internal, ...newState };
  }
  addItem(key: Identifier, value: any): void {
    if (this.#entries.size >= this.#internal.limit) {
      if (this.#logical) {
        this.updateState({ overwrites: this.#internal.overwrites + 1 });
        if (this.#internal.overwrites >= this.#threshold) {
          this.updateState({ overwrites: 0 });
          this.updateState({ limit: this.#internal.limit + this.#increase });
        }
      }
      this.#entries.delete(this.#entries.keys().next().value);
      this.#entries.set(key, value);
    } else this.#entries.set(key, value);
  }
  getItem(key: Identifier): Nullable<any> {
    if (!this.#entries.has(key)) return null;
    this.#entries.set(key, this.#entries.get(key));
    const data = this.#entries.get(key);
    if (data instanceof Uint8Array) {
      return JSON.parse(decoder.decode(data));
    } else return data;
  }
  hasItem(key: Identifier): boolean {
    return this.#entries.has(key);
  }
  removeItem(key: Identifier): void {
    this.#entries.delete(key);
  }
  reset(): void {
    this.#entries.clear();
    if (this.#logical) {
      this.updateState({ overwrites: 0 });
      if (this.#internal.oldLimit) {
        this.updateState({ limit: this.#internal.oldLimit });
      }
    }
  }
  get entries(): Map<Identifier, any> {
    return this.#entries;
  }
  get values(): CacheValues {
    return {
      limit: this.#internal.limit,
      overwrites: this.#internal.overwrites,
    };
  }
}
