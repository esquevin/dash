type Nullable<T> = T | null;
type Identifier = string | number;

const decoder = new TextDecoder("utf-8");

/**
 * The options for the cache class
 */
export interface CacheOptions {
  limit?: number;
  serialize?: boolean;
}

/**
 * Check if data is JSON serializable
 * @param value The value to check
 */
function isSerializable(value: any): boolean {
  if (typeof value == "boolean") return true;
  else if (typeof value == "number") return true;
  else if (typeof value == "string") return true;
  else if (value instanceof Object) return true;
  else return false;
}

/**
 * The main Dash cache class
 */
export class Cache {
  #limit: number;
  #entries: Map<Identifier, any>;
  #serialize: boolean;
  /**
   * Creates an instance of Cache
   * @param cacheLimit The max number of items the cache can store
   */
  constructor(options?: CacheOptions) {
    this.#serialize = options?.serialize ?? false;
    this.#limit = options?.limit ?? 10000;
    this.#entries = new Map();
  }
  /**
   * Set's a key:value pair in the cache
   * @param key The key to store the value under
   * @param data The value to store in the cache
   */
  set(key: Identifier, data: any): void {
    let serializedData = data;
    if (this.#serialize && isSerializable(data)) {
      const dataString = JSON.stringify(data);
      serializedData = new Uint8Array(dataString.length);
      serializedData.set(dataString.split("").map((c) => c.charCodeAt(0)));
    }
    if (this.#entries.size >= this.#limit) {
      this.#entries.delete(this.#entries.keys().next().value);
      this.#entries.set(key, serializedData);
    } else this.#entries.set(key, serializedData);
  }
  /**
   * Attemps to retrieve a value from the cache
   * @param key The key to get a value from the cache
   */
  get(key: Identifier): Nullable<any> {
    if (this.#entries.has(key)) {
      this.#entries.set(key, this.#entries.get(key));
      const data = this.#entries.get(key);
      if (data instanceof Uint8Array) {
        return JSON.parse(decoder.decode(data));
      } else return data;
    } else return null;
  }
  /**
   * Returns the internal cache limit
   */
  get limit(): number {
    return this.#limit;
  }
  /**
   * Returns the current amount of items in the cache
   */
  get size(): number {
    return this.#entries.size;
  }
}
