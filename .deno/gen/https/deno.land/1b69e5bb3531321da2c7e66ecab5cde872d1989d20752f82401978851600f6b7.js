import { debug as d } from "../platform.deno.ts";
const debug = d("grammy:session");
/**
 * Session middleware provides a persistent data storage for your bot. You can
 * use it to let your bot remember any data you want, for example the messages
 * it sent or received in the past. This is done by attaching _session data_ to
 * every chat. The stored data is then provided on the context object under
 * `ctx.session`.
 *
 * > **What is a session?** Simply put, the session of a chat is a little
 * > persistent storage that is attached to it. As an example, your bot can send
 * > a message to a chat and store the identifier of that message in the
 * > corresponding session. The next time your bot receives an update from that
 * > chat, the session will still contain that ID.
 * >
 * > Session data can be stored in a database, in a file, or simply in memory.
 * > grammY only supports memory sessions out of the box, but you can use
 * > third-party session middleware to connect to other storage solutions. Note
 * > that memory sessions will be lost when you stop your bot and the process
 * > exits, so they are usually not useful in production.
 *
 * Whenever your bot receives an update, the first thing the session middleware
 * will do is to load the correct session from your storage solution. This
 * object is then provided on `ctx.session` while your other middleware is
 * running. As soon as your bot is done handling the update, the middleware
 * takes over again and writes back the session object to your storage. This
 * allows you to modify the session object arbitrarily in your middleware, and
 * to stop worrying about the database.
 *
 * ```ts
 * bot.use(session())
 *
 * bot.on('message', ctx => {
 *   // The session object is persisted across updates!
 *   const session = ctx.session
 * })
 * ```
 *
 * It is recommended to make use of the `initial` option in the configuration
 * object, which correctly initializes session objects for new chats.
 *
 * You can delete the session data by setting `ctx.session` to `null` or
 * `undefined`.
 *
 * Check out the [documentation](https://grammy.dev/plugins/session) on the
 * website to know more about how sessions work in grammY.
 *
 * @param options Optional configuration to pass to the session middleware
 */ export function session(options = {}) {
  return options.type === "multi" ? strictMultiSession(options) : strictSingleSession(options);
}
function strictSingleSession(options) {
  const { initial, storage, getSessionKey, custom } = fillDefaults(options);
  return async (ctx, next)=>{
    const propSession = new PropertySession(storage, ctx, "session", initial);
    const key = await getSessionKey(ctx);
    await propSession.init(key, {
      custom,
      lazy: false
    });
    await next(); // no catch: do not write back if middleware throws
    await propSession.finish();
  };
}
function strictMultiSession(options) {
  const props = Object.keys(options).filter((k)=>k !== "type");
  const defaults = Object.fromEntries(props.map((prop)=>[
      prop,
      fillDefaults(options[prop])
    ]));
  return async (ctx, next)=>{
    ctx.session = {};
    const propSessions = await Promise.all(props.map(async (prop)=>{
      const { initial, storage, getSessionKey, custom } = defaults[prop];
      const s = new PropertySession(// @ts-expect-error cannot express that the storage works for a concrete prop
      storage, ctx.session, prop, initial);
      const key = await getSessionKey(ctx);
      await s.init(key, {
        custom,
        lazy: false
      });
      return s;
    }));
    await next(); // no catch: do not write back if middleware throws
    if (ctx.session == null) propSessions.forEach((s)=>s.delete());
    await Promise.all(propSessions.map((s)=>s.finish()));
  };
}
/**
 * > This is an advanced function of grammY.
 *
 * Generally speaking, lazy sessions work just like normal sessions—just they
 * are loaded on demand. Except for a few `async`s and `await`s here and there,
 * their usage looks 100 % identical.
 *
 * Instead of directly querying the storage every time an update arrives, lazy
 * sessions quickly do this _once you access_ `ctx.session`. This can
 * significantly reduce the database traffic (especially when your bot is added
 * to group chats), because it skips a read and a wrote operation for all
 * updates that the bot does not react to.
 *
 * ```ts
 * // The options are identical
 * bot.use(lazySession({ storage: ... }))
 *
 * bot.on('message', async ctx => {
 *   // The session object is persisted across updates!
 *   const session = await ctx.session
 *   //                        ^
 *   //                        |
 *   //                       This plain property access (no function call) will trigger the database query!
 * })
 * ```
 *
 * Check out the
 * [documentation](https://grammy.dev/plugins/session#lazy-sessions) on the
 * website to know more about how lazy sessions work in grammY.
 *
 * @param options Optional configuration to pass to the session middleware
 */ export function lazySession(options = {}) {
  if (options.type !== undefined && options.type !== "single") {
    throw new Error("Cannot use lazy multi sessions!");
  }
  const { initial, storage, getSessionKey, custom } = fillDefaults(options);
  return async (ctx, next)=>{
    const propSession = new PropertySession(// @ts-expect-error suppress promise nature of values
    storage, ctx, "session", initial);
    const key = await getSessionKey(ctx);
    await propSession.init(key, {
      custom,
      lazy: true
    });
    await next(); // no catch: do not write back if middleware throws
    await propSession.finish();
  };
}
/**
 * Internal class that manages a single property on the session. Can be used
 * both in a strict and a lazy way. Works by using `Object.defineProperty` to
 * install `O[P]`.
 */ // deno-lint-ignore ban-types
class PropertySession {
  storage;
  obj;
  prop;
  initial;
  key;
  value;
  promise;
  fetching;
  read;
  wrote;
  constructor(storage, obj, prop, initial){
    this.storage = storage;
    this.obj = obj;
    this.prop = prop;
    this.initial = initial;
    this.fetching = false;
    this.read = false;
    this.wrote = false;
  }
  /** Performs a read op and stores the result in `this.value` */ load() {
    if (this.key === undefined) {
      // No session key provided, cannot load
      return;
    }
    if (this.wrote) {
      // Value was set, no need to load
      return;
    }
    // Perform read op if not cached
    if (this.promise === undefined) {
      this.fetching = true;
      this.promise = Promise.resolve(this.storage.read(this.key)).then((val)=>{
        this.fetching = false;
        // Check for write op in the meantime
        if (this.wrote) {
          // Discard read op
          return this.value;
        }
        // Store received value in `this.value`
        if (val !== undefined) {
          this.value = val;
          return val;
        }
        // No value, need to initialize
        val = this.initial?.();
        if (val !== undefined) {
          // Wrote initial value
          this.wrote = true;
          this.value = val;
        }
        return val;
      });
    }
    return this.promise;
  }
  async init(key, opts) {
    this.key = key;
    if (!opts.lazy) await this.load();
    Object.defineProperty(this.obj, this.prop, {
      enumerable: true,
      get: ()=>{
        if (key === undefined) {
          const msg = undef("access", opts);
          throw new Error(msg);
        }
        this.read = true;
        if (!opts.lazy || this.wrote) return this.value;
        this.load();
        return this.fetching ? this.promise : this.value;
      },
      set: (v)=>{
        if (key === undefined) {
          const msg = undef("assign", opts);
          throw new Error(msg);
        }
        this.wrote = true;
        this.fetching = false;
        this.value = v;
      }
    });
  }
  delete() {
    Object.assign(this.obj, {
      [this.prop]: undefined
    });
  }
  async finish() {
    if (this.key !== undefined) {
      if (this.read) await this.load();
      if (this.read || this.wrote) {
        const value = await this.value;
        if (value == null) await this.storage.delete(this.key);
        else await this.storage.write(this.key, value);
      }
    }
  }
}
function fillDefaults(opts = {}) {
  let { getSessionKey = defaultGetSessionKey, initial, storage } = opts;
  if (storage == null) {
    debug("Storing session data in memory, all data will be lost when the bot restarts.");
    storage = new MemorySessionStorage();
  }
  const custom = getSessionKey !== defaultGetSessionKey;
  return {
    initial,
    storage,
    getSessionKey,
    custom
  };
}
/** Stores session data per chat by default */ function defaultGetSessionKey(ctx) {
  return ctx.chatId?.toString();
}
/** Returns a useful error message for when the session key is undefined */ function undef(op, opts) {
  const { lazy = false, custom } = opts;
  const reason = custom ? "the custom `getSessionKey` function returned undefined for this update" : "this update does not belong to a chat, so the session key is undefined";
  return `Cannot ${op} ${lazy ? "lazy " : ""}session data because ${reason}!`;
}
function isEnhance(value) {
  return value === undefined || typeof value === "object" && value !== null && "__d" in value;
}
/**
 * You can use this function to transform an existing storage adapter, and add
 * more features to it. Currently, you can add session migrations and expiry
 * dates.
 *
 * You can use this function like so:
 * ```ts
 * const storage = ... // define your storage adapter
 * const enhanced = enhanceStorage({ storage, millisecondsToLive: 500 })
 * bot.use(session({ storage: enhanced }))
 * ```
 *
 * @param options Session enhancing options
 * @returns The enhanced storage adapter
 */ export function enhanceStorage(options) {
  let { storage, millisecondsToLive, migrations } = options;
  storage = compatStorage(storage);
  if (millisecondsToLive !== undefined) {
    storage = timeoutStorage(storage, millisecondsToLive);
  }
  if (migrations !== undefined) {
    storage = migrationStorage(storage, migrations);
  }
  return wrapStorage(storage);
}
function compatStorage(storage) {
  return {
    read: async (k)=>{
      const v = await storage.read(k);
      return isEnhance(v) ? v : {
        __d: v
      };
    },
    write: (k, v)=>storage.write(k, v),
    delete: (k)=>storage.delete(k)
  };
}
function timeoutStorage(storage, millisecondsToLive) {
  const ttlStorage = {
    read: async (k)=>{
      const value = await storage.read(k);
      if (value === undefined) return undefined;
      if (value.e === undefined) {
        await ttlStorage.write(k, value);
        return value;
      }
      if (value.e < Date.now()) {
        await ttlStorage.delete(k);
        return undefined;
      }
      return value;
    },
    write: async (k, v)=>{
      v.e = addExpiryDate(v, millisecondsToLive).expires;
      await storage.write(k, v);
    },
    delete: (k)=>storage.delete(k)
  };
  return ttlStorage;
}
function migrationStorage(storage, migrations) {
  const versions = Object.keys(migrations).map((v)=>parseInt(v)).sort((a, b)=>a - b);
  const count = versions.length;
  if (count === 0) throw new Error("No migrations given!");
  const earliest = versions[0];
  const last = count - 1;
  const latest = versions[last];
  const index = new Map();
  versions.forEach((v, i)=>index.set(v, i)); // inverse array lookup
  function nextAfter(current) {
    // TODO: use `findLastIndex` with Node 18
    let i = last;
    while(current <= versions[i])i--;
    return i;
  // return versions.findLastIndex((v) => v < current)
  }
  return {
    read: async (k)=>{
      const val = await storage.read(k);
      if (val === undefined) return val;
      let { __d: value, v: current = earliest - 1 } = val;
      let i = 1 + (index.get(current) ?? nextAfter(current));
      for(; i < count; i++)value = migrations[versions[i]](value);
      return {
        ...val,
        v: latest,
        __d: value
      };
    },
    write: (k, v)=>storage.write(k, {
        v: latest,
        ...v
      }),
    delete: (k)=>storage.delete(k)
  };
}
function wrapStorage(storage) {
  return {
    read: (k)=>Promise.resolve(storage.read(k)).then((v)=>v?.__d),
    write: (k, v)=>storage.write(k, {
        __d: v
      }),
    delete: (k)=>storage.delete(k)
  };
}
// === Memory storage adapter
/**
 * The memory session storage is a built-in storage adapter that saves your
 * session data in RAM using a regular JavaScript `Map` object. If you use this
 * storage adapter, all sessions will be lost when your process terminates or
 * restarts. Hence, you should only use it for short-lived data that is not
 * important to persist.
 *
 * This class is used as default if you do not provide a storage adapter, e.g.
 * to your database.
 *
 * This storage adapter features expiring sessions. When instantiating this
 * class yourself, you can pass a time to live in milliseconds that will be used
 * for each session object. If a session for a user expired, the session data
 * will be discarded on its first read, and a fresh session object as returned
 * by the `initial` option (or undefined) will be put into place.
 */ export class MemorySessionStorage {
  timeToLive;
  /**
     * Internally used `Map` instance that stores the session data
     */ storage;
  /**
     * Constructs a new memory session storage with the given time to live. Note
     * that this storage adapter will not store your data permanently.
     *
     * @param timeToLive TTL in milliseconds, default is `Infinity`
     */ constructor(timeToLive){
    this.timeToLive = timeToLive;
    this.storage = new Map();
  }
  read(key) {
    const value = this.storage.get(key);
    if (value === undefined) return undefined;
    if (value.expires !== undefined && value.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }
    return value.session;
  }
  /**
     * @deprecated Use {@link readAllValues} instead
     */ readAll() {
    return this.readAllValues();
  }
  readAllKeys() {
    return Array.from(this.storage.keys());
  }
  readAllValues() {
    return Array.from(this.storage.keys()).map((key)=>this.read(key)).filter((value)=>value !== undefined);
  }
  readAllEntries() {
    return Array.from(this.storage.keys()).map((key)=>[
        key,
        this.read(key)
      ]).filter((pair)=>pair[1] !== undefined);
  }
  has(key) {
    return this.storage.has(key);
  }
  write(key, value) {
    this.storage.set(key, addExpiryDate(value, this.timeToLive));
  }
  delete(key) {
    this.storage.delete(key);
  }
}
function addExpiryDate(value, ttl) {
  if (ttl !== undefined && ttl < Infinity) {
    const now = Date.now();
    return {
      session: value,
      expires: now + ttl
    };
  } else {
    return {
      session: value
    };
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29udmVuaWVuY2Uvc2Vzc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0eXBlIE1pZGRsZXdhcmVGbiB9IGZyb20gXCIuLi9jb21wb3Nlci50c1wiO1xuaW1wb3J0IHsgdHlwZSBDb250ZXh0IH0gZnJvbSBcIi4uL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IGRlYnVnIGFzIGQgfSBmcm9tIFwiLi4vcGxhdGZvcm0uZGVuby50c1wiO1xuY29uc3QgZGVidWcgPSBkKFwiZ3JhbW15OnNlc3Npb25cIik7XG5cbnR5cGUgTWF5YmVQcm9taXNlPFQ+ID0gUHJvbWlzZTxUPiB8IFQ7XG5cbi8vID09PSBNYWluIHNlc3Npb24gcGx1Z2luXG4vKipcbiAqIEEgc2Vzc2lvbiBmbGF2b3IgaXMgYSBjb250ZXh0IGZsYXZvciB0aGF0IGhvbGRzIHNlc3Npb24gZGF0YSB1bmRlclxuICogYGN0eC5zZXNzaW9uYC5cbiAqXG4gKiBTZXNzaW9uIG1pZGRsZXdhcmUgd2lsbCBsb2FkIHRoZSBzZXNzaW9uIGRhdGEgb2YgYSBzcGVjaWZpYyBjaGF0IGZyb20geW91clxuICogc3RvcmFnZSBzb2x1dGlvbiwgYW5kIG1ha2UgaXQgYXZhaWxhYmxlIHRvIHlvdSBvbiB0aGUgY29udGV4dCBvYmplY3QuIENoZWNrXG4gKiBvdXQgdGhlIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvcmVmL2NvcmUvc2Vzc2lvbikgb24gc2Vzc2lvblxuICogbWlkZGxld2FyZSB0byBrbm93IG1vcmUsIGFuZCByZWFkIHRoZSBzZWN0aW9uIGFib3V0IHNlc3Npb25zIG9uIHRoZVxuICogW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3Nlc3Npb24pLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25GbGF2b3I8Uz4ge1xuICAgIC8qKlxuICAgICAqIFNlc3Npb24gZGF0YSBvbiB0aGUgY29udGV4dCBvYmplY3QuXG4gICAgICpcbiAgICAgKiAqKldBUk5JTkc6KiogWW91IGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgeW91ciBzZXNzaW9uIGRhdGEgaXMgbm90XG4gICAgICogdW5kZWZpbmVkIGJ5IF9wcm92aWRpbmcgYW4gaW5pdGlhbCB2YWx1ZSB0byB0aGUgc2Vzc2lvbiBtaWRkbGV3YXJlXywgb3JcbiAgICAgKiBieSBtYWtpbmcgc3VyZSB0aGF0IGBjdHguc2Vzc2lvbmAgaXMgYXNzaWduZWQgaWYgaXQgaXMgZW1wdHkhIFRoZSB0eXBlXG4gICAgICogc3lzdGVtIGRvZXMgbm90IGluY2x1ZGUgYHwgdW5kZWZpbmVkYCBiZWNhdXNlIHRoaXMgaXMgcmVhbGx5IGFubm95aW5nIHRvXG4gICAgICogd29yayB3aXRoLlxuICAgICAqXG4gICAgICogQWNjZXNzaW5nIGBjdHguc2Vzc2lvbmAgYnkgcmVhZGluZyBvciB3cml0aW5nIHdpbGwgdGhyb3cgaWZcbiAgICAgKiBgZ2V0U2Vzc2lvbktleShjdHgpID09PSB1bmRlZmluZWRgIGZvciB0aGUgcmVzcGVjdGl2ZSBjb250ZXh0IG9iamVjdFxuICAgICAqIGBjdHhgLlxuICAgICAqL1xuICAgIGdldCBzZXNzaW9uKCk6IFM7XG4gICAgc2V0IHNlc3Npb24oc2Vzc2lvbjogUyB8IG51bGwgfCB1bmRlZmluZWQpO1xufVxuLyoqXG4gKiBBIGxhenkgc2Vzc2lvbiBmbGF2b3IgaXMgYSBjb250ZXh0IGZsYXZvciB0aGF0IGhvbGRzIGEgcHJvbWlzZSBvZiBzb21lXG4gKiBzZXNzaW9uIGRhdGEgdW5kZXIgYGN0eC5zZXNzaW9uYC5cbiAqXG4gKiBMYXp5IHNlc3Npb24gbWlkZGxld2FyZSB3aWxsIHByb3ZpZGUgdGhpcyBwcm9taXNlIGxhemlseSBvbiB0aGUgY29udGV4dFxuICogb2JqZWN0LiBPbmNlIHlvdSBhY2Nlc3MgYGN0eC5zZXNzaW9uYCwgdGhlIHN0b3JhZ2Ugd2lsbCBiZSBxdWVyaWVkIGFuZCB0aGVcbiAqIHNlc3Npb24gZGF0YSBiZWNvbWVzIGF2YWlsYWJsZS4gSWYgeW91IGFjY2VzcyBgY3R4LnNlc3Npb25gIGFnYWluIGZvciB0aGVcbiAqIHNhbWUgY29udGV4dCBvYmplY3QsIHRoZSBjYWNoZWQgdmFsdWUgd2lsbCBiZSB1c2VkLiBDaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3JlZi9jb3JlL2xhenlzZXNzaW9uKSBvbiBsYXp5IHNlc3Npb25cbiAqIG1pZGRsZXdhcmUgdG8ga25vdyBtb3JlLCBhbmQgcmVhZCB0aGUgc2VjdGlvbiBhYm91dCBsYXp5IHNlc3Npb25zIG9uIHRoZVxuICogW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3Nlc3Npb24jbGF6eS1zZXNzaW9ucykuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTGF6eVNlc3Npb25GbGF2b3I8Uz4ge1xuICAgIC8qKlxuICAgICAqIFNlc3Npb24gZGF0YSBvbiB0aGUgY29udGV4dCBvYmplY3QsIHBvdGVudGlhbGx5IGEgcHJvbWlzZS5cbiAgICAgKlxuICAgICAqICoqV0FSTklORzoqKiBZb3UgaGF2ZSB0byBtYWtlIHN1cmUgdGhhdCB5b3VyIHNlc3Npb24gZGF0YSBpcyBub3RcbiAgICAgKiB1bmRlZmluZWQgYnkgX3Byb3ZpZGluZyBhIGRlZmF1bHQgdmFsdWUgdG8gdGhlIHNlc3Npb24gbWlkZGxld2FyZV8sIG9yIGJ5XG4gICAgICogbWFraW5nIHN1cmUgdGhhdCBgY3R4LnNlc3Npb25gIGlzIGFzc2lnbmVkIGlmIGl0IGlzIGVtcHR5ISBUaGUgdHlwZVxuICAgICAqIHN5c3RlbSBkb2VzIG5vdCBpbmNsdWRlIGB8IHVuZGVmaW5lZGAgYmVjYXVzZSB0aGlzIGlzIHJlYWxseSBhbm5veWluZyB0b1xuICAgICAqIHdvcmsgd2l0aC5cbiAgICAgKlxuICAgICAqIEFjY2Vzc2luZyBgY3R4LnNlc3Npb25gIGJ5IHJlYWRpbmcgb3Igd3JpdGluZyB3aWxsIHRocm93IGlmZlxuICAgICAqIGBnZXRTZXNzaW9uS2V5KGN0eCkgPT09IHVuZGVmaW5lZGAgaG9sZHMgZm9yIHRoZSByZXNwZWN0aXZlIGNvbnRleHRcbiAgICAgKiBvYmplY3QgYGN0eGAuXG4gICAgICovXG4gICAgZ2V0IHNlc3Npb24oKTogTWF5YmVQcm9taXNlPFM+O1xuICAgIHNldCBzZXNzaW9uKHNlc3Npb246IE1heWJlUHJvbWlzZTxTIHwgbnVsbCB8IHVuZGVmaW5lZD4pO1xufVxuXG4vKipcbiAqIEEgc3RvcmFnZSBhZGFwdGVyIGlzIGFuIGFic3RyYWN0aW9uIHRoYXQgcHJvdmlkZXMgcmVhZCwgd3JpdGUsIGFuZCBkZWxldGVcbiAqIGFjY2VzcyB0byBhIHN0b3JhZ2Ugc29sdXRpb24gb2YgYW55IGtpbmQuIFN0b3JhZ2UgYWRhcHRlcnMgYXJlIHVzZWQgdG8ga2VlcFxuICogc2Vzc2lvbiBtaWRkbGV3YXJlIGluZGVwZW5kZW50IG9mIHlvdXIgZGF0YWJhc2UgcHJvdmlkZXIsIGFuZCB0aGV5IGFsbG93IHlvdVxuICogdG8gcGFzcyB5b3VyIG93biBzdG9yYWdlIHNvbHV0aW9uLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JhZ2VBZGFwdGVyPFQ+IHtcbiAgICAvKipcbiAgICAgKiBSZWFkcyBhIHZhbHVlIGZvciB0aGUgZ2l2ZW4ga2V5IGZyb20gdGhlIHN0b3JhZ2UuIE1heSByZXR1cm4gdGhlIHZhbHVlIG9yXG4gICAgICogdW5kZWZpbmVkLCBvciBhIHByb21pc2Ugb2YgZWl0aGVyLlxuICAgICAqL1xuICAgIHJlYWQ6IChrZXk6IHN0cmluZykgPT4gTWF5YmVQcm9taXNlPFQgfCB1bmRlZmluZWQ+O1xuICAgIC8qKlxuICAgICAqIFdyaXRlcyBhIHZhbHVlIGZvciB0aGUgZ2l2ZW4ga2V5IHRvIHRoZSBzdG9yYWdlLlxuICAgICAqL1xuICAgIHdyaXRlOiAoa2V5OiBzdHJpbmcsIHZhbHVlOiBUKSA9PiBNYXliZVByb21pc2U8dm9pZD47XG4gICAgLyoqXG4gICAgICogRGVsZXRlcyBhIHZhbHVlIGZvciB0aGUgZ2l2ZW4ga2V5IGZyb20gdGhlIHN0b3JhZ2UuXG4gICAgICovXG4gICAgZGVsZXRlOiAoa2V5OiBzdHJpbmcpID0+IE1heWJlUHJvbWlzZTx2b2lkPjtcbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2hldGhlciBhIGtleSBleGlzdHMgaW4gdGhlIHN0b3JhZ2UuXG4gICAgICovXG4gICAgaGFzPzogKGtleTogc3RyaW5nKSA9PiBNYXliZVByb21pc2U8Ym9vbGVhbj47XG4gICAgLyoqXG4gICAgICogTGlzdHMgYWxsIGtleXMuXG4gICAgICovXG4gICAgcmVhZEFsbEtleXM/OiAoKSA9PiBJdGVyYWJsZTxzdHJpbmc+IHwgQXN5bmNJdGVyYWJsZTxzdHJpbmc+O1xuICAgIC8qKlxuICAgICAqIExpc3RzIGFsbCB2YWx1ZXMuXG4gICAgICovXG4gICAgcmVhZEFsbFZhbHVlcz86ICgpID0+IEl0ZXJhYmxlPFQ+IHwgQXN5bmNJdGVyYWJsZTxUPjtcbiAgICAvKipcbiAgICAgKiBMaXN0cyBhbGwga2V5cyB3aXRoIHRoZWlyIHZhbHVlcy5cbiAgICAgKi9cbiAgICByZWFkQWxsRW50cmllcz86ICgpID0+XG4gICAgICAgIHwgSXRlcmFibGU8W2tleTogc3RyaW5nLCB2YWx1ZTogVF0+XG4gICAgICAgIHwgQXN5bmNJdGVyYWJsZTxba2V5OiBzdHJpbmcsIHZhbHVlOiBUXT47XG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3Igc2Vzc2lvbiBtaWRkbGV3YXJlLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25PcHRpb25zPFMsIEMgZXh0ZW5kcyBDb250ZXh0ID0gQ29udGV4dD4ge1xuICAgIHR5cGU/OiBcInNpbmdsZVwiO1xuICAgIC8qKlxuICAgICAqICoqUmVjb21tZW5kZWQgdG8gdXNlLioqXG4gICAgICpcbiAgICAgKiBBIGZ1bmN0aW9uIHRoYXQgcHJvZHVjZXMgYW4gaW5pdGlhbCB2YWx1ZSBmb3IgYGN0eC5zZXNzaW9uYC4gVGhpc1xuICAgICAqIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWUgdGhlIHN0b3JhZ2Ugc29sdXRpb24gcmV0dXJucyB1bmRlZmluZWRcbiAgICAgKiBmb3IgYSBnaXZlbiBzZXNzaW9uIGtleS4gTWFrZSBzdXJlIHRvIGNyZWF0ZSBhIG5ldyB2YWx1ZSBldmVyeSB0aW1lLCBzdWNoXG4gICAgICogdGhhdCBkaWZmZXJlbnQgY29udGV4dCBvYmplY3RzIGRvIHRoYXQgYWNjaWRlbnRhbGx5IHNoYXJlIHRoZSBzYW1lXG4gICAgICogc2Vzc2lvbiBkYXRhLlxuICAgICAqL1xuICAgIGluaXRpYWw/OiAoKSA9PiBTO1xuICAgIC8qKlxuICAgICAqIFRoaXMgb3B0aW9uIGxldHMgeW91IGdlbmVyYXRlIHlvdXIgb3duIHNlc3Npb24ga2V5cyBwZXIgY29udGV4dCBvYmplY3QuXG4gICAgICogVGhlIHNlc3Npb24ga2V5IGRldGVybWluZXMgaG93IHRvIG1hcCB0aGUgZGlmZmVyZW50IHNlc3Npb24gb2JqZWN0cyB0b1xuICAgICAqIHlvdXIgY2hhdHMgYW5kIHVzZXJzLiBDaGVjayBvdXQgdGhlXG4gICAgICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3Nlc3Npb24jaG93LXRvLXVzZS1zZXNzaW9ucylcbiAgICAgKiBvbiB0aGUgd2Vic2l0ZSBhYm91dCBob3cgdG8gdXNlIHNlc3Npb24gbWlkZGxld2FyZSB0byBrbm93IGhvdyBzZXNzaW9uXG4gICAgICoga2V5cyBhcmUgdXNlZC5cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHdpbGwgc3RvcmUgc2Vzc2lvbnMgcGVyIGNoYXQsIGFzIGRldGVybWluZWQgYnlcbiAgICAgKiBgY3R4LmNoYXRJZGAuXG4gICAgICovXG4gICAgZ2V0U2Vzc2lvbktleT86IChcbiAgICAgICAgY3R4OiBPbWl0PEMsIFwic2Vzc2lvblwiPixcbiAgICApID0+IE1heWJlUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICAgIC8qKlxuICAgICAqIEEgc3RvcmFnZSBhZGFwdGVyIHRvIHlvdXIgc3RvcmFnZSBzb2x1dGlvbi4gUHJvdmlkZXMgcmVhZCwgd3JpdGUsIGFuZFxuICAgICAqIGRlbGV0ZSBhY2Nlc3MgdG8gdGhlIHNlc3Npb24gbWlkZGxld2FyZS5cbiAgICAgKlxuICAgICAqIENvbnNpZGVyIHVzaW5nIGEgW2tub3duIHN0b3JhZ2VcbiAgICAgKiBhZGFwdGVyXShodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9zZXNzaW9uI2tub3duLXN0b3JhZ2UtYWRhcHRlcnMpXG4gICAgICogaW5zdGVhZCBvZiByb2xsaW5nIHlvdXIgb3duIGltcGxlbWVudGF0aW9uIG9mIHRoaXMuXG4gICAgICpcbiAgICAgKiBUaGUgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiB3aWxsIHN0b3JlIHNlc3Npb24gaW4gbWVtb3J5LiBUaGUgZGF0YSB3aWxsIGJlXG4gICAgICogbG9zdCB3aGVuZXZlciB5b3VyIGJvdCByZXN0YXJ0cy5cbiAgICAgKi9cbiAgICBzdG9yYWdlPzogU3RvcmFnZUFkYXB0ZXI8Uz47XG59XG5cbi8qKlxuICogT3B0aW9ucyBmb3Igc2Vzc2lvbiBtaWRkbGV3YXJlIGlmIG11bHRpIHNlc3Npb25zIGFyZSB1c2VkLiBTcGVjaWZ5IGBcInR5cGVcIjpcbiAqIFwibXVsdGlcImAgaW4gdGhlIG9wdGlvbnMgdG8gdXNlIG11bHRpIHNlc3Npb25zLlxuICovXG5leHBvcnQgdHlwZSBNdWx0aVNlc3Npb25PcHRpb25zPFMsIEMgZXh0ZW5kcyBDb250ZXh0PiA9XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICBTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55PiAvLyB1bmtub3duIGJyZWFrcyBleHRlbmRzXG4gICAgICAgID8geyB0eXBlOiBcIm11bHRpXCIgfSAmIE11bHRpU2Vzc2lvbk9wdGlvbnNSZWNvcmQ8UywgQz5cbiAgICAgICAgOiBuZXZlcjtcbnR5cGUgTXVsdGlTZXNzaW9uT3B0aW9uc1JlY29yZDxcbiAgICBTIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgQyBleHRlbmRzIENvbnRleHQsXG4+ID0ge1xuICAgIFtLIGluIGtleW9mIFNdOiBTZXNzaW9uT3B0aW9uczxTW0tdLCBDPjtcbn07XG5cbi8qKlxuICogU2Vzc2lvbiBtaWRkbGV3YXJlIHByb3ZpZGVzIGEgcGVyc2lzdGVudCBkYXRhIHN0b3JhZ2UgZm9yIHlvdXIgYm90LiBZb3UgY2FuXG4gKiB1c2UgaXQgdG8gbGV0IHlvdXIgYm90IHJlbWVtYmVyIGFueSBkYXRhIHlvdSB3YW50LCBmb3IgZXhhbXBsZSB0aGUgbWVzc2FnZXNcbiAqIGl0IHNlbnQgb3IgcmVjZWl2ZWQgaW4gdGhlIHBhc3QuIFRoaXMgaXMgZG9uZSBieSBhdHRhY2hpbmcgX3Nlc3Npb24gZGF0YV8gdG9cbiAqIGV2ZXJ5IGNoYXQuIFRoZSBzdG9yZWQgZGF0YSBpcyB0aGVuIHByb3ZpZGVkIG9uIHRoZSBjb250ZXh0IG9iamVjdCB1bmRlclxuICogYGN0eC5zZXNzaW9uYC5cbiAqXG4gKiA+ICoqV2hhdCBpcyBhIHNlc3Npb24/KiogU2ltcGx5IHB1dCwgdGhlIHNlc3Npb24gb2YgYSBjaGF0IGlzIGEgbGl0dGxlXG4gKiA+IHBlcnNpc3RlbnQgc3RvcmFnZSB0aGF0IGlzIGF0dGFjaGVkIHRvIGl0LiBBcyBhbiBleGFtcGxlLCB5b3VyIGJvdCBjYW4gc2VuZFxuICogPiBhIG1lc3NhZ2UgdG8gYSBjaGF0IGFuZCBzdG9yZSB0aGUgaWRlbnRpZmllciBvZiB0aGF0IG1lc3NhZ2UgaW4gdGhlXG4gKiA+IGNvcnJlc3BvbmRpbmcgc2Vzc2lvbi4gVGhlIG5leHQgdGltZSB5b3VyIGJvdCByZWNlaXZlcyBhbiB1cGRhdGUgZnJvbSB0aGF0XG4gKiA+IGNoYXQsIHRoZSBzZXNzaW9uIHdpbGwgc3RpbGwgY29udGFpbiB0aGF0IElELlxuICogPlxuICogPiBTZXNzaW9uIGRhdGEgY2FuIGJlIHN0b3JlZCBpbiBhIGRhdGFiYXNlLCBpbiBhIGZpbGUsIG9yIHNpbXBseSBpbiBtZW1vcnkuXG4gKiA+IGdyYW1tWSBvbmx5IHN1cHBvcnRzIG1lbW9yeSBzZXNzaW9ucyBvdXQgb2YgdGhlIGJveCwgYnV0IHlvdSBjYW4gdXNlXG4gKiA+IHRoaXJkLXBhcnR5IHNlc3Npb24gbWlkZGxld2FyZSB0byBjb25uZWN0IHRvIG90aGVyIHN0b3JhZ2Ugc29sdXRpb25zLiBOb3RlXG4gKiA+IHRoYXQgbWVtb3J5IHNlc3Npb25zIHdpbGwgYmUgbG9zdCB3aGVuIHlvdSBzdG9wIHlvdXIgYm90IGFuZCB0aGUgcHJvY2Vzc1xuICogPiBleGl0cywgc28gdGhleSBhcmUgdXN1YWxseSBub3QgdXNlZnVsIGluIHByb2R1Y3Rpb24uXG4gKlxuICogV2hlbmV2ZXIgeW91ciBib3QgcmVjZWl2ZXMgYW4gdXBkYXRlLCB0aGUgZmlyc3QgdGhpbmcgdGhlIHNlc3Npb24gbWlkZGxld2FyZVxuICogd2lsbCBkbyBpcyB0byBsb2FkIHRoZSBjb3JyZWN0IHNlc3Npb24gZnJvbSB5b3VyIHN0b3JhZ2Ugc29sdXRpb24uIFRoaXNcbiAqIG9iamVjdCBpcyB0aGVuIHByb3ZpZGVkIG9uIGBjdHguc2Vzc2lvbmAgd2hpbGUgeW91ciBvdGhlciBtaWRkbGV3YXJlIGlzXG4gKiBydW5uaW5nLiBBcyBzb29uIGFzIHlvdXIgYm90IGlzIGRvbmUgaGFuZGxpbmcgdGhlIHVwZGF0ZSwgdGhlIG1pZGRsZXdhcmVcbiAqIHRha2VzIG92ZXIgYWdhaW4gYW5kIHdyaXRlcyBiYWNrIHRoZSBzZXNzaW9uIG9iamVjdCB0byB5b3VyIHN0b3JhZ2UuIFRoaXNcbiAqIGFsbG93cyB5b3UgdG8gbW9kaWZ5IHRoZSBzZXNzaW9uIG9iamVjdCBhcmJpdHJhcmlseSBpbiB5b3VyIG1pZGRsZXdhcmUsIGFuZFxuICogdG8gc3RvcCB3b3JyeWluZyBhYm91dCB0aGUgZGF0YWJhc2UuXG4gKlxuICogYGBgdHNcbiAqIGJvdC51c2Uoc2Vzc2lvbigpKVxuICpcbiAqIGJvdC5vbignbWVzc2FnZScsIGN0eCA9PiB7XG4gKiAgIC8vIFRoZSBzZXNzaW9uIG9iamVjdCBpcyBwZXJzaXN0ZWQgYWNyb3NzIHVwZGF0ZXMhXG4gKiAgIGNvbnN0IHNlc3Npb24gPSBjdHguc2Vzc2lvblxuICogfSlcbiAqIGBgYFxuICpcbiAqIEl0IGlzIHJlY29tbWVuZGVkIHRvIG1ha2UgdXNlIG9mIHRoZSBgaW5pdGlhbGAgb3B0aW9uIGluIHRoZSBjb25maWd1cmF0aW9uXG4gKiBvYmplY3QsIHdoaWNoIGNvcnJlY3RseSBpbml0aWFsaXplcyBzZXNzaW9uIG9iamVjdHMgZm9yIG5ldyBjaGF0cy5cbiAqXG4gKiBZb3UgY2FuIGRlbGV0ZSB0aGUgc2Vzc2lvbiBkYXRhIGJ5IHNldHRpbmcgYGN0eC5zZXNzaW9uYCB0byBgbnVsbGAgb3JcbiAqIGB1bmRlZmluZWRgLlxuICpcbiAqIENoZWNrIG91dCB0aGUgW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3Nlc3Npb24pIG9uIHRoZVxuICogd2Vic2l0ZSB0byBrbm93IG1vcmUgYWJvdXQgaG93IHNlc3Npb25zIHdvcmsgaW4gZ3JhbW1ZLlxuICpcbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIGNvbmZpZ3VyYXRpb24gdG8gcGFzcyB0byB0aGUgc2Vzc2lvbiBtaWRkbGV3YXJlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXNzaW9uPFMsIEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBvcHRpb25zOiBTZXNzaW9uT3B0aW9uczxTLCBDPiB8IE11bHRpU2Vzc2lvbk9wdGlvbnM8UywgQz4gPSB7fSxcbik6IE1pZGRsZXdhcmVGbjxDICYgU2Vzc2lvbkZsYXZvcjxTPj4ge1xuICAgIHJldHVybiBvcHRpb25zLnR5cGUgPT09IFwibXVsdGlcIlxuICAgICAgICA/IHN0cmljdE11bHRpU2Vzc2lvbihvcHRpb25zKVxuICAgICAgICA6IHN0cmljdFNpbmdsZVNlc3Npb24ob3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIHN0cmljdFNpbmdsZVNlc3Npb248UywgQyBleHRlbmRzIENvbnRleHQ+KFxuICAgIG9wdGlvbnM6IFNlc3Npb25PcHRpb25zPFMsIEM+LFxuKTogTWlkZGxld2FyZUZuPEMgJiBTZXNzaW9uRmxhdm9yPFM+PiB7XG4gICAgY29uc3QgeyBpbml0aWFsLCBzdG9yYWdlLCBnZXRTZXNzaW9uS2V5LCBjdXN0b20gfSA9IGZpbGxEZWZhdWx0cyhvcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9wU2Vzc2lvbiA9IG5ldyBQcm9wZXJ0eVNlc3Npb248U2Vzc2lvbkZsYXZvcjxTPiwgXCJzZXNzaW9uXCI+KFxuICAgICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgIFwic2Vzc2lvblwiLFxuICAgICAgICAgICAgaW5pdGlhbCxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgZ2V0U2Vzc2lvbktleShjdHgpO1xuICAgICAgICBhd2FpdCBwcm9wU2Vzc2lvbi5pbml0KGtleSwgeyBjdXN0b20sIGxhenk6IGZhbHNlIH0pO1xuICAgICAgICBhd2FpdCBuZXh0KCk7IC8vIG5vIGNhdGNoOiBkbyBub3Qgd3JpdGUgYmFjayBpZiBtaWRkbGV3YXJlIHRocm93c1xuICAgICAgICBhd2FpdCBwcm9wU2Vzc2lvbi5maW5pc2goKTtcbiAgICB9O1xufVxuZnVuY3Rpb24gc3RyaWN0TXVsdGlTZXNzaW9uPFMsIEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBvcHRpb25zOiBNdWx0aVNlc3Npb25PcHRpb25zPFMsIEM+LFxuKTogTWlkZGxld2FyZUZuPEMgJiBTZXNzaW9uRmxhdm9yPFM+PiB7XG4gICAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhvcHRpb25zKS5maWx0ZXIoKGspID0+IGsgIT09IFwidHlwZVwiKTtcbiAgICBjb25zdCBkZWZhdWx0cyA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgcHJvcHMubWFwKChwcm9wKSA9PiBbcHJvcCwgZmlsbERlZmF1bHRzKG9wdGlvbnNbcHJvcF0pXSksXG4gICAgKTtcbiAgICByZXR1cm4gYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICBjdHguc2Vzc2lvbiA9IHt9IGFzIFM7XG4gICAgICAgIGNvbnN0IHByb3BTZXNzaW9ucyA9IGF3YWl0IFByb21pc2UuYWxsKHByb3BzLm1hcChhc3luYyAocHJvcCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyBpbml0aWFsLCBzdG9yYWdlLCBnZXRTZXNzaW9uS2V5LCBjdXN0b20gfSA9IGRlZmF1bHRzW3Byb3BdO1xuICAgICAgICAgICAgY29uc3QgcyA9IG5ldyBQcm9wZXJ0eVNlc3Npb24oXG4gICAgICAgICAgICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBjYW5ub3QgZXhwcmVzcyB0aGF0IHRoZSBzdG9yYWdlIHdvcmtzIGZvciBhIGNvbmNyZXRlIHByb3BcbiAgICAgICAgICAgICAgICBzdG9yYWdlLFxuICAgICAgICAgICAgICAgIGN0eC5zZXNzaW9uLFxuICAgICAgICAgICAgICAgIHByb3AsXG4gICAgICAgICAgICAgICAgaW5pdGlhbCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBhd2FpdCBnZXRTZXNzaW9uS2V5KGN0eCk7XG4gICAgICAgICAgICBhd2FpdCBzLmluaXQoa2V5LCB7IGN1c3RvbSwgbGF6eTogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgfSkpO1xuICAgICAgICBhd2FpdCBuZXh0KCk7IC8vIG5vIGNhdGNoOiBkbyBub3Qgd3JpdGUgYmFjayBpZiBtaWRkbGV3YXJlIHRocm93c1xuICAgICAgICBpZiAoY3R4LnNlc3Npb24gPT0gbnVsbCkgcHJvcFNlc3Npb25zLmZvckVhY2goKHMpID0+IHMuZGVsZXRlKCkpO1xuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9wU2Vzc2lvbnMubWFwKChzKSA9PiBzLmZpbmlzaCgpKSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgZnVuY3Rpb24gb2YgZ3JhbW1ZLlxuICpcbiAqIEdlbmVyYWxseSBzcGVha2luZywgbGF6eSBzZXNzaW9ucyB3b3JrIGp1c3QgbGlrZSBub3JtYWwgc2Vzc2lvbnPigJRqdXN0IHRoZXlcbiAqIGFyZSBsb2FkZWQgb24gZGVtYW5kLiBFeGNlcHQgZm9yIGEgZmV3IGBhc3luY2BzIGFuZCBgYXdhaXRgcyBoZXJlIGFuZCB0aGVyZSxcbiAqIHRoZWlyIHVzYWdlIGxvb2tzIDEwMCAlIGlkZW50aWNhbC5cbiAqXG4gKiBJbnN0ZWFkIG9mIGRpcmVjdGx5IHF1ZXJ5aW5nIHRoZSBzdG9yYWdlIGV2ZXJ5IHRpbWUgYW4gdXBkYXRlIGFycml2ZXMsIGxhenlcbiAqIHNlc3Npb25zIHF1aWNrbHkgZG8gdGhpcyBfb25jZSB5b3UgYWNjZXNzXyBgY3R4LnNlc3Npb25gLiBUaGlzIGNhblxuICogc2lnbmlmaWNhbnRseSByZWR1Y2UgdGhlIGRhdGFiYXNlIHRyYWZmaWMgKGVzcGVjaWFsbHkgd2hlbiB5b3VyIGJvdCBpcyBhZGRlZFxuICogdG8gZ3JvdXAgY2hhdHMpLCBiZWNhdXNlIGl0IHNraXBzIGEgcmVhZCBhbmQgYSB3cm90ZSBvcGVyYXRpb24gZm9yIGFsbFxuICogdXBkYXRlcyB0aGF0IHRoZSBib3QgZG9lcyBub3QgcmVhY3QgdG8uXG4gKlxuICogYGBgdHNcbiAqIC8vIFRoZSBvcHRpb25zIGFyZSBpZGVudGljYWxcbiAqIGJvdC51c2UobGF6eVNlc3Npb24oeyBzdG9yYWdlOiAuLi4gfSkpXG4gKlxuICogYm90Lm9uKCdtZXNzYWdlJywgYXN5bmMgY3R4ID0+IHtcbiAqICAgLy8gVGhlIHNlc3Npb24gb2JqZWN0IGlzIHBlcnNpc3RlZCBhY3Jvc3MgdXBkYXRlcyFcbiAqICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IGN0eC5zZXNzaW9uXG4gKiAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAvLyAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgLy8gICAgICAgICAgICAgICAgICAgICAgIFRoaXMgcGxhaW4gcHJvcGVydHkgYWNjZXNzIChubyBmdW5jdGlvbiBjYWxsKSB3aWxsIHRyaWdnZXIgdGhlIGRhdGFiYXNlIHF1ZXJ5IVxuICogfSlcbiAqIGBgYFxuICpcbiAqIENoZWNrIG91dCB0aGVcbiAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9zZXNzaW9uI2xhenktc2Vzc2lvbnMpIG9uIHRoZVxuICogd2Vic2l0ZSB0byBrbm93IG1vcmUgYWJvdXQgaG93IGxhenkgc2Vzc2lvbnMgd29yayBpbiBncmFtbVkuXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiB0byBwYXNzIHRvIHRoZSBzZXNzaW9uIG1pZGRsZXdhcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhenlTZXNzaW9uPFMsIEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBvcHRpb25zOiBTZXNzaW9uT3B0aW9uczxTLCBDPiA9IHt9LFxuKTogTWlkZGxld2FyZUZuPEMgJiBMYXp5U2Vzc2lvbkZsYXZvcjxTPj4ge1xuICAgIGlmIChvcHRpb25zLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnR5cGUgIT09IFwic2luZ2xlXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHVzZSBsYXp5IG11bHRpIHNlc3Npb25zIVwiKTtcbiAgICB9XG4gICAgY29uc3QgeyBpbml0aWFsLCBzdG9yYWdlLCBnZXRTZXNzaW9uS2V5LCBjdXN0b20gfSA9IGZpbGxEZWZhdWx0cyhvcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9wU2Vzc2lvbiA9IG5ldyBQcm9wZXJ0eVNlc3Npb24oXG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHN1cHByZXNzIHByb21pc2UgbmF0dXJlIG9mIHZhbHVlc1xuICAgICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgIFwic2Vzc2lvblwiLFxuICAgICAgICAgICAgaW5pdGlhbCxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgZ2V0U2Vzc2lvbktleShjdHgpO1xuICAgICAgICBhd2FpdCBwcm9wU2Vzc2lvbi5pbml0KGtleSwgeyBjdXN0b20sIGxhenk6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IG5leHQoKTsgLy8gbm8gY2F0Y2g6IGRvIG5vdCB3cml0ZSBiYWNrIGlmIG1pZGRsZXdhcmUgdGhyb3dzXG4gICAgICAgIGF3YWl0IHByb3BTZXNzaW9uLmZpbmlzaCgpO1xuICAgIH07XG59XG5cbi8qKlxuICogSW50ZXJuYWwgY2xhc3MgdGhhdCBtYW5hZ2VzIGEgc2luZ2xlIHByb3BlcnR5IG9uIHRoZSBzZXNzaW9uLiBDYW4gYmUgdXNlZFxuICogYm90aCBpbiBhIHN0cmljdCBhbmQgYSBsYXp5IHdheS4gV29ya3MgYnkgdXNpbmcgYE9iamVjdC5kZWZpbmVQcm9wZXJ0eWAgdG9cbiAqIGluc3RhbGwgYE9bUF1gLlxuICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuY2xhc3MgUHJvcGVydHlTZXNzaW9uPE8gZXh0ZW5kcyB7fSwgUCBleHRlbmRzIGtleW9mIE8+IHtcbiAgICBwcml2YXRlIGtleT86IHN0cmluZztcbiAgICBwcml2YXRlIHZhbHVlOiBPW1BdIHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcHJvbWlzZTogUHJvbWlzZTxPW1BdIHwgdW5kZWZpbmVkPiB8IHVuZGVmaW5lZDtcblxuICAgIHByaXZhdGUgZmV0Y2hpbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIHJlYWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIHdyb3RlID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBzdG9yYWdlOiBTdG9yYWdlQWRhcHRlcjxPW1BdPixcbiAgICAgICAgcHJpdmF0ZSBvYmo6IE8sXG4gICAgICAgIHByaXZhdGUgcHJvcDogUCxcbiAgICAgICAgcHJpdmF0ZSBpbml0aWFsOiAoKCkgPT4gT1tQXSkgfCB1bmRlZmluZWQsXG4gICAgKSB7fVxuXG4gICAgLyoqIFBlcmZvcm1zIGEgcmVhZCBvcCBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYHRoaXMudmFsdWVgICovXG4gICAgcHJpdmF0ZSBsb2FkKCkge1xuICAgICAgICBpZiAodGhpcy5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gTm8gc2Vzc2lvbiBrZXkgcHJvdmlkZWQsIGNhbm5vdCBsb2FkXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMud3JvdGUpIHtcbiAgICAgICAgICAgIC8vIFZhbHVlIHdhcyBzZXQsIG5vIG5lZWQgdG8gbG9hZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFBlcmZvcm0gcmVhZCBvcCBpZiBub3QgY2FjaGVkXG4gICAgICAgIGlmICh0aGlzLnByb21pc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5mZXRjaGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLnJlYWQodGhpcy5rZXkpKVxuICAgICAgICAgICAgICAgIC50aGVuKCh2YWw/OiBPW1BdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHdyaXRlIG9wIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy53cm90ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlzY2FyZCByZWFkIG9wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSByZWNlaXZlZCB2YWx1ZSBpbiBgdGhpcy52YWx1ZWBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBObyB2YWx1ZSwgbmVlZCB0byBpbml0aWFsaXplXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHRoaXMuaW5pdGlhbD8uKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV3JvdGUgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cm90ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KFxuICAgICAgICBrZXk6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgb3B0czogeyBjdXN0b206IGJvb2xlYW47IGxhenk6IGJvb2xlYW4gfSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgICAgIGlmICghb3B0cy5sYXp5KSBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMub2JqLCB0aGlzLnByb3AsIHtcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbXNnID0gdW5kZWYoXCJhY2Nlc3NcIiwgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmICghb3B0cy5sYXp5IHx8IHRoaXMud3JvdGUpIHJldHVybiB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZldGNoaW5nID8gdGhpcy5wcm9taXNlIDogdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6ICh2KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IHVuZGVmKFwiYXNzaWduXCIsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy53cm90ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5mZXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMub2JqLCB7IFt0aGlzLnByb3BdOiB1bmRlZmluZWQgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmluaXNoKCkge1xuICAgICAgICBpZiAodGhpcy5rZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZCkgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkIHx8IHRoaXMud3JvdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIGF3YWl0IHRoaXMuc3RvcmFnZS5kZWxldGUodGhpcy5rZXkpO1xuICAgICAgICAgICAgICAgIGVsc2UgYXdhaXQgdGhpcy5zdG9yYWdlLndyaXRlKHRoaXMua2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbGxEZWZhdWx0czxTLCBDIGV4dGVuZHMgQ29udGV4dD4ob3B0czogU2Vzc2lvbk9wdGlvbnM8UywgQz4gPSB7fSkge1xuICAgIGxldCB7IGdldFNlc3Npb25LZXkgPSBkZWZhdWx0R2V0U2Vzc2lvbktleSwgaW5pdGlhbCwgc3RvcmFnZSB9ID0gb3B0cztcbiAgICBpZiAoc3RvcmFnZSA9PSBudWxsKSB7XG4gICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgXCJTdG9yaW5nIHNlc3Npb24gZGF0YSBpbiBtZW1vcnksIGFsbCBkYXRhIHdpbGwgYmUgbG9zdCB3aGVuIHRoZSBib3QgcmVzdGFydHMuXCIsXG4gICAgICAgICk7XG4gICAgICAgIHN0b3JhZ2UgPSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2U8Uz4oKTtcbiAgICB9XG4gICAgY29uc3QgY3VzdG9tID0gZ2V0U2Vzc2lvbktleSAhPT0gZGVmYXVsdEdldFNlc3Npb25LZXk7XG4gICAgcmV0dXJuIHsgaW5pdGlhbCwgc3RvcmFnZSwgZ2V0U2Vzc2lvbktleSwgY3VzdG9tIH07XG59XG5cbi8qKiBTdG9yZXMgc2Vzc2lvbiBkYXRhIHBlciBjaGF0IGJ5IGRlZmF1bHQgKi9cbmZ1bmN0aW9uIGRlZmF1bHRHZXRTZXNzaW9uS2V5KGN0eDogQ29udGV4dCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGN0eC5jaGF0SWQ/LnRvU3RyaW5nKCk7XG59XG5cbi8qKiBSZXR1cm5zIGEgdXNlZnVsIGVycm9yIG1lc3NhZ2UgZm9yIHdoZW4gdGhlIHNlc3Npb24ga2V5IGlzIHVuZGVmaW5lZCAqL1xuZnVuY3Rpb24gdW5kZWYoXG4gICAgb3A6IFwiYWNjZXNzXCIgfCBcImFzc2lnblwiLFxuICAgIG9wdHM6IHsgY3VzdG9tOiBib29sZWFuOyBsYXp5PzogYm9vbGVhbiB9LFxuKSB7XG4gICAgY29uc3QgeyBsYXp5ID0gZmFsc2UsIGN1c3RvbSB9ID0gb3B0cztcbiAgICBjb25zdCByZWFzb24gPSBjdXN0b21cbiAgICAgICAgPyBcInRoZSBjdXN0b20gYGdldFNlc3Npb25LZXlgIGZ1bmN0aW9uIHJldHVybmVkIHVuZGVmaW5lZCBmb3IgdGhpcyB1cGRhdGVcIlxuICAgICAgICA6IFwidGhpcyB1cGRhdGUgZG9lcyBub3QgYmVsb25nIHRvIGEgY2hhdCwgc28gdGhlIHNlc3Npb24ga2V5IGlzIHVuZGVmaW5lZFwiO1xuICAgIHJldHVybiBgQ2Fubm90ICR7b3B9ICR7bGF6eSA/IFwibGF6eSBcIiA6IFwiXCJ9c2Vzc2lvbiBkYXRhIGJlY2F1c2UgJHtyZWFzb259IWA7XG59XG5cbi8vID09PSBTZXNzaW9uIG1pZ3JhdGlvbnNcbi8qKlxuICogV2hlbiBlbmhhbmNpbmcgYSBzdG9yYWdlIGFkYXB0ZXIsIGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gc3RvcmUgYWRkaXRpb25hbFxuICogaW5mb3JtYXRpb24uIEl0IGRvZXMgdGhpcyBieSB3cmFwcGluZyB0aGUgYWN0dWFsIGRhdGEgaW5zaWRlIGFuIG9iamVjdCwgYW5kXG4gKiBhZGRpbmcgbW9yZSBwcm9wZXJ0aWVzIHRvIHRoaXMgd3JhcHBlci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBkZWZpbmVzIHRoZSBhZGRpdGlvbmFsIHByb3BlcnRpZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBieSBhXG4gKiBzdG9yYWdlIGFkYXB0ZXIgdGhhdCBzdXBwb3J0cyBlbmhhbmNlZCBzZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlPFQ+IHtcbiAgICAvKiogVmVyc2lvbiAqL1xuICAgIHY/OiBudW1iZXI7XG4gICAgLyoqIERhdGEgKi9cbiAgICBfX2Q6IFQ7XG4gICAgLyoqIEV4cGlyeSBkYXRlICovXG4gICAgZT86IG51bWJlcjtcbn1cbmZ1bmN0aW9uIGlzRW5oYW5jZTxUPih2YWx1ZT86IFQgfCBFbmhhbmNlPFQ+KTogdmFsdWUgaXMgRW5oYW5jZTxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwiX19kXCIgaW4gdmFsdWU7XG59XG4vKiogT3B0aW9ucyBmb3IgZW5oYW5jZWQgc2Vzc2lvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uT3B0aW9uczxUPiB7XG4gICAgLyoqIFRoZSBvcmlnaW5hbCBzdG9yYWdlIGFkYXB0ZXIgdGhhdCB3aWxsIGJlIGVuaGFuY2VkICovXG4gICAgc3RvcmFnZTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj47XG4gICAgLyoqXG4gICAgICogQSBzZXQgb2Ygc2Vzc2lvbiBtaWdyYXRpb25zLCBkZWZpbmVkIGFzIGFuIG9iamVjdCBtYXBwaW5nIGZyb20gdmVyc2lvblxuICAgICAqIG51bWJlcnMgdG8gbWlncmF0aW9uIGZ1bmN0aW9ucyB0aGF0IHRyYW5zZm9ybSBkYXRhIHRvIHRoZSByZXNwZWN0aXZlXG4gICAgICogdmVyc2lvbi5cbiAgICAgKi9cbiAgICBtaWdyYXRpb25zPzogTWlncmF0aW9ucztcbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgbWlsbGlzZWNvbmRzIGFmdGVyIHRoZSBsYXN0IHdyaXRlIG9wZXJhdGlvbiB1bnRpbCB0aGUgc2Vzc2lvblxuICAgICAqIGRhdGEgZXhwaXJlcy5cbiAgICAgKi9cbiAgICBtaWxsaXNlY29uZHNUb0xpdmU/OiBudW1iZXI7XG59XG4vKipcbiAqIEEgbWFwcGluZyBmcm9tIHZlcnNpb24gbnVtYmVycyB0byBzZXNzaW9uIG1pZ3JhdGlvbiBmdW5jdGlvbnMuIEVhY2ggZW50cnkgaW5cbiAqIHRoaXMgb2JqZWN0IGhhcyBhIHZlcnNpb24gbnVtYmVyIGFzIGEga2V5LCBhbmQgYSBmdW5jdGlvbiBhcyBhIHZhbHVlLlxuICpcbiAqIEZvciBhIGtleSBgbmAsIHRoZSByZXNwZWN0aXZlIHZhbHVlIHNob3VsZCBiZSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdGhlXG4gKiBwcmV2aW91cyBzZXNzaW9uIGRhdGEgYW5kIG1pZ3JhdGVzIGl0IHRvIGNvbmZvcm0gd2l0aCB0aGUgZGF0YSB0aGF0IGlzIHVzZWRcbiAqIGJ5IHZlcnNpb24gYG5gLiBUaGUgcHJldmlvdXMgc2Vzc2lvbiBkYXRhIGlzIGRlZmluZWQgYnkgdGhlIG5leHQga2V5IGxlc3NcbiAqIHRoYW4gYG5gLCBzdWNoIGFzIGBuLTFgLiBWZXJzaW9ucyBkb24ndCBoYXZlIHRvIGJlIGludGVnZXJzLCBub3IgZG8gYWxsXG4gKiB2ZXJzaW9ucyBoYXZlIHRvIGJlIGFkamFjZW50LiBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgYFsxLCAxLjUsIDRdYCBhc1xuICogdmVyc2lvbnMuIElmIGBuYCBpcyB0aGUgbG93ZXN0IHZhbHVlIGluIHRoZSBzZXQgb2Yga2V5cywgdGhlIGZ1bmN0aW9uIHN0b3JlZFxuICogZm9yIGBuYCBjYW4gYmUgdXNlZCB0byBtaWdyYXRlIHNlc3Npb24gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYmVmb3JlIG1pZ3JhdGlvbnNcbiAqIHdlcmUgdXNlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25zIHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIFt2ZXJzaW9uOiBudW1iZXJdOiAob2xkOiBhbnkpID0+IGFueTtcbn1cblxuLyoqXG4gKiBZb3UgY2FuIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSBhbiBleGlzdGluZyBzdG9yYWdlIGFkYXB0ZXIsIGFuZCBhZGRcbiAqIG1vcmUgZmVhdHVyZXMgdG8gaXQuIEN1cnJlbnRseSwgeW91IGNhbiBhZGQgc2Vzc2lvbiBtaWdyYXRpb25zIGFuZCBleHBpcnlcbiAqIGRhdGVzLlxuICpcbiAqIFlvdSBjYW4gdXNlIHRoaXMgZnVuY3Rpb24gbGlrZSBzbzpcbiAqIGBgYHRzXG4gKiBjb25zdCBzdG9yYWdlID0gLi4uIC8vIGRlZmluZSB5b3VyIHN0b3JhZ2UgYWRhcHRlclxuICogY29uc3QgZW5oYW5jZWQgPSBlbmhhbmNlU3RvcmFnZSh7IHN0b3JhZ2UsIG1pbGxpc2Vjb25kc1RvTGl2ZTogNTAwIH0pXG4gKiBib3QudXNlKHNlc3Npb24oeyBzdG9yYWdlOiBlbmhhbmNlZCB9KSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFNlc3Npb24gZW5oYW5jaW5nIG9wdGlvbnNcbiAqIEByZXR1cm5zIFRoZSBlbmhhbmNlZCBzdG9yYWdlIGFkYXB0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuaGFuY2VTdG9yYWdlPFQ+KFxuICAgIG9wdGlvbnM6IE1pZ3JhdGlvbk9wdGlvbnM8VD4sXG4pOiBTdG9yYWdlQWRhcHRlcjxUPiB7XG4gICAgbGV0IHsgc3RvcmFnZSwgbWlsbGlzZWNvbmRzVG9MaXZlLCBtaWdyYXRpb25zIH0gPSBvcHRpb25zO1xuICAgIHN0b3JhZ2UgPSBjb21wYXRTdG9yYWdlKHN0b3JhZ2UpO1xuICAgIGlmIChtaWxsaXNlY29uZHNUb0xpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdG9yYWdlID0gdGltZW91dFN0b3JhZ2Uoc3RvcmFnZSwgbWlsbGlzZWNvbmRzVG9MaXZlKTtcbiAgICB9XG4gICAgaWYgKG1pZ3JhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdG9yYWdlID0gbWlncmF0aW9uU3RvcmFnZShzdG9yYWdlLCBtaWdyYXRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHdyYXBTdG9yYWdlKHN0b3JhZ2UpO1xufVxuXG5mdW5jdGlvbiBjb21wYXRTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuKTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlYWQ6IGFzeW5jIChrKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2ID0gYXdhaXQgc3RvcmFnZS5yZWFkKGspO1xuICAgICAgICAgICAgcmV0dXJuIGlzRW5oYW5jZSh2KSA/IHYgOiB7IF9fZDogdiB9O1xuICAgICAgICB9LFxuICAgICAgICB3cml0ZTogKGssIHYpID0+IHN0b3JhZ2Uud3JpdGUoaywgdiksXG4gICAgICAgIGRlbGV0ZTogKGspID0+IHN0b3JhZ2UuZGVsZXRlKGspLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRpbWVvdXRTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuICAgIG1pbGxpc2Vjb25kc1RvTGl2ZTogbnVtYmVyLFxuKTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4ge1xuICAgIGNvbnN0IHR0bFN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+ID0ge1xuICAgICAgICByZWFkOiBhc3luYyAoaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBzdG9yYWdlLnJlYWQoayk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0dGxTdG9yYWdlLndyaXRlKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUuZSA8IERhdGUubm93KCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0dGxTdG9yYWdlLmRlbGV0ZShrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICB3cml0ZTogYXN5bmMgKGssIHYpID0+IHtcbiAgICAgICAgICAgIHYuZSA9IGFkZEV4cGlyeURhdGUodiwgbWlsbGlzZWNvbmRzVG9MaXZlKS5leHBpcmVzO1xuICAgICAgICAgICAgYXdhaXQgc3RvcmFnZS53cml0ZShrLCB2KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiAoaykgPT4gc3RvcmFnZS5kZWxldGUoayksXG4gICAgfTtcbiAgICByZXR1cm4gdHRsU3RvcmFnZTtcbn1cbmZ1bmN0aW9uIG1pZ3JhdGlvblN0b3JhZ2U8VD4oXG4gICAgc3RvcmFnZTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4sXG4gICAgbWlncmF0aW9uczogTWlncmF0aW9ucyxcbik6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+IHtcbiAgICBjb25zdCB2ZXJzaW9ucyA9IE9iamVjdC5rZXlzKG1pZ3JhdGlvbnMpXG4gICAgICAgIC5tYXAoKHYpID0+IHBhcnNlSW50KHYpKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIGNvbnN0IGNvdW50ID0gdmVyc2lvbnMubGVuZ3RoO1xuICAgIGlmIChjb3VudCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWlncmF0aW9ucyBnaXZlbiFcIik7XG4gICAgY29uc3QgZWFybGllc3QgPSB2ZXJzaW9uc1swXTtcbiAgICBjb25zdCBsYXN0ID0gY291bnQgLSAxO1xuICAgIGNvbnN0IGxhdGVzdCA9IHZlcnNpb25zW2xhc3RdO1xuICAgIGNvbnN0IGluZGV4ID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcbiAgICB2ZXJzaW9ucy5mb3JFYWNoKCh2LCBpKSA9PiBpbmRleC5zZXQodiwgaSkpOyAvLyBpbnZlcnNlIGFycmF5IGxvb2t1cFxuICAgIGZ1bmN0aW9uIG5leHRBZnRlcihjdXJyZW50OiBudW1iZXIpIHtcbiAgICAgICAgLy8gVE9ETzogdXNlIGBmaW5kTGFzdEluZGV4YCB3aXRoIE5vZGUgMThcbiAgICAgICAgbGV0IGkgPSBsYXN0O1xuICAgICAgICB3aGlsZSAoY3VycmVudCA8PSB2ZXJzaW9uc1tpXSkgaS0tO1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgLy8gcmV0dXJuIHZlcnNpb25zLmZpbmRMYXN0SW5kZXgoKHYpID0+IHYgPCBjdXJyZW50KVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZWFkOiBhc3luYyAoaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gYXdhaXQgc3RvcmFnZS5yZWFkKGspO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdmFsO1xuICAgICAgICAgICAgbGV0IHsgX19kOiB2YWx1ZSwgdjogY3VycmVudCA9IGVhcmxpZXN0IC0gMSB9ID0gdmFsO1xuICAgICAgICAgICAgbGV0IGkgPSAxICsgKGluZGV4LmdldChjdXJyZW50KSA/PyBuZXh0QWZ0ZXIoY3VycmVudCkpO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBjb3VudDsgaSsrKSB2YWx1ZSA9IG1pZ3JhdGlvbnNbdmVyc2lvbnNbaV1dKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLnZhbCwgdjogbGF0ZXN0LCBfX2Q6IHZhbHVlIH07XG4gICAgICAgIH0sXG4gICAgICAgIHdyaXRlOiAoaywgdikgPT4gc3RvcmFnZS53cml0ZShrLCB7IHY6IGxhdGVzdCwgLi4udiB9KSxcbiAgICAgICAgZGVsZXRlOiAoaykgPT4gc3RvcmFnZS5kZWxldGUoayksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHdyYXBTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuKTogU3RvcmFnZUFkYXB0ZXI8VD4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlYWQ6IChrKSA9PiBQcm9taXNlLnJlc29sdmUoc3RvcmFnZS5yZWFkKGspKS50aGVuKCh2KSA9PiB2Py5fX2QpLFxuICAgICAgICB3cml0ZTogKGssIHYpID0+IHN0b3JhZ2Uud3JpdGUoaywgeyBfX2Q6IHYgfSksXG4gICAgICAgIGRlbGV0ZTogKGspID0+IHN0b3JhZ2UuZGVsZXRlKGspLFxuICAgIH07XG59XG5cbi8vID09PSBNZW1vcnkgc3RvcmFnZSBhZGFwdGVyXG4vKipcbiAqIFRoZSBtZW1vcnkgc2Vzc2lvbiBzdG9yYWdlIGlzIGEgYnVpbHQtaW4gc3RvcmFnZSBhZGFwdGVyIHRoYXQgc2F2ZXMgeW91clxuICogc2Vzc2lvbiBkYXRhIGluIFJBTSB1c2luZyBhIHJlZ3VsYXIgSmF2YVNjcmlwdCBgTWFwYCBvYmplY3QuIElmIHlvdSB1c2UgdGhpc1xuICogc3RvcmFnZSBhZGFwdGVyLCBhbGwgc2Vzc2lvbnMgd2lsbCBiZSBsb3N0IHdoZW4geW91ciBwcm9jZXNzIHRlcm1pbmF0ZXMgb3JcbiAqIHJlc3RhcnRzLiBIZW5jZSwgeW91IHNob3VsZCBvbmx5IHVzZSBpdCBmb3Igc2hvcnQtbGl2ZWQgZGF0YSB0aGF0IGlzIG5vdFxuICogaW1wb3J0YW50IHRvIHBlcnNpc3QuXG4gKlxuICogVGhpcyBjbGFzcyBpcyB1c2VkIGFzIGRlZmF1bHQgaWYgeW91IGRvIG5vdCBwcm92aWRlIGEgc3RvcmFnZSBhZGFwdGVyLCBlLmcuXG4gKiB0byB5b3VyIGRhdGFiYXNlLlxuICpcbiAqIFRoaXMgc3RvcmFnZSBhZGFwdGVyIGZlYXR1cmVzIGV4cGlyaW5nIHNlc3Npb25zLiBXaGVuIGluc3RhbnRpYXRpbmcgdGhpc1xuICogY2xhc3MgeW91cnNlbGYsIHlvdSBjYW4gcGFzcyBhIHRpbWUgdG8gbGl2ZSBpbiBtaWxsaXNlY29uZHMgdGhhdCB3aWxsIGJlIHVzZWRcbiAqIGZvciBlYWNoIHNlc3Npb24gb2JqZWN0LiBJZiBhIHNlc3Npb24gZm9yIGEgdXNlciBleHBpcmVkLCB0aGUgc2Vzc2lvbiBkYXRhXG4gKiB3aWxsIGJlIGRpc2NhcmRlZCBvbiBpdHMgZmlyc3QgcmVhZCwgYW5kIGEgZnJlc2ggc2Vzc2lvbiBvYmplY3QgYXMgcmV0dXJuZWRcbiAqIGJ5IHRoZSBgaW5pdGlhbGAgb3B0aW9uIChvciB1bmRlZmluZWQpIHdpbGwgYmUgcHV0IGludG8gcGxhY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uU3RvcmFnZTxTPiBpbXBsZW1lbnRzIFN0b3JhZ2VBZGFwdGVyPFM+IHtcbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbGx5IHVzZWQgYE1hcGAgaW5zdGFuY2UgdGhhdCBzdG9yZXMgdGhlIHNlc3Npb24gZGF0YVxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBzdG9yYWdlID0gbmV3IE1hcDxcbiAgICAgICAgc3RyaW5nLFxuICAgICAgICB7IHNlc3Npb246IFM7IGV4cGlyZXM/OiBudW1iZXIgfVxuICAgID4oKTtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgbWVtb3J5IHNlc3Npb24gc3RvcmFnZSB3aXRoIHRoZSBnaXZlbiB0aW1lIHRvIGxpdmUuIE5vdGVcbiAgICAgKiB0aGF0IHRoaXMgc3RvcmFnZSBhZGFwdGVyIHdpbGwgbm90IHN0b3JlIHlvdXIgZGF0YSBwZXJtYW5lbnRseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0aW1lVG9MaXZlIFRUTCBpbiBtaWxsaXNlY29uZHMsIGRlZmF1bHQgaXMgYEluZmluaXR5YFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdGltZVRvTGl2ZT86IG51bWJlcikge31cblxuICAgIHJlYWQoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLnN0b3JhZ2UuZ2V0KGtleSk7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmFsdWUuZXhwaXJlcyAhPT0gdW5kZWZpbmVkICYmIHZhbHVlLmV4cGlyZXMgPCBEYXRlLm5vdygpKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUuc2Vzc2lvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIHJlYWRBbGxWYWx1ZXN9IGluc3RlYWRcbiAgICAgKi9cbiAgICByZWFkQWxsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkQWxsVmFsdWVzKCk7XG4gICAgfVxuXG4gICAgcmVhZEFsbEtleXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuc3RvcmFnZS5rZXlzKCkpO1xuICAgIH1cblxuICAgIHJlYWRBbGxWYWx1ZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheVxuICAgICAgICAgICAgLmZyb20odGhpcy5zdG9yYWdlLmtleXMoKSlcbiAgICAgICAgICAgIC5tYXAoKGtleSkgPT4gdGhpcy5yZWFkKGtleSkpXG4gICAgICAgICAgICAuZmlsdGVyKCh2YWx1ZSk6IHZhbHVlIGlzIFMgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmVhZEFsbEVudHJpZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuc3RvcmFnZS5rZXlzKCkpXG4gICAgICAgICAgICAubWFwKChrZXkpID0+IFtrZXksIHRoaXMucmVhZChrZXkpXSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHBhaXIpOiBwYWlyIGlzIFtzdHJpbmcsIFNdID0+IHBhaXJbMV0gIT09IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgaGFzKGtleTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JhZ2UuaGFzKGtleSk7XG4gICAgfVxuXG4gICAgd3JpdGUoa2V5OiBzdHJpbmcsIHZhbHVlOiBTKSB7XG4gICAgICAgIHRoaXMuc3RvcmFnZS5zZXQoa2V5LCBhZGRFeHBpcnlEYXRlKHZhbHVlLCB0aGlzLnRpbWVUb0xpdmUpKTtcbiAgICB9XG5cbiAgICBkZWxldGUoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zdG9yYWdlLmRlbGV0ZShrZXkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkRXhwaXJ5RGF0ZTxUPih2YWx1ZTogVCwgdHRsPzogbnVtYmVyKSB7XG4gICAgaWYgKHR0bCAhPT0gdW5kZWZpbmVkICYmIHR0bCA8IEluZmluaXR5KSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHJldHVybiB7IHNlc3Npb246IHZhbHVlLCBleHBpcmVzOiBub3cgKyB0dGwgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4geyBzZXNzaW9uOiB2YWx1ZSB9O1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUFTLFNBQVMsQ0FBQyxRQUFRLHNCQUFzQjtBQUNqRCxNQUFNLFFBQVEsRUFBRTtBQWlLaEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4Q0MsR0FDRCxPQUFPLFNBQVMsUUFDWixVQUE0RCxDQUFDLENBQUM7RUFFOUQsT0FBTyxRQUFRLElBQUksS0FBSyxVQUNsQixtQkFBbUIsV0FDbkIsb0JBQW9CO0FBQzlCO0FBRUEsU0FBUyxvQkFDTCxPQUE2QjtFQUU3QixNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxFQUFFLEdBQUcsYUFBYTtFQUNqRSxPQUFPLE9BQU8sS0FBSztJQUNmLE1BQU0sY0FBYyxJQUFJLGdCQUNwQixTQUNBLEtBQ0EsV0FDQTtJQUVKLE1BQU0sTUFBTSxNQUFNLGNBQWM7SUFDaEMsTUFBTSxZQUFZLElBQUksQ0FBQyxLQUFLO01BQUU7TUFBUSxNQUFNO0lBQU07SUFDbEQsTUFBTSxRQUFRLG1E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