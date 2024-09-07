// deno-lint-ignore-file camelcase
import { BotError, Composer, run } from "./composer.ts";
import { Context } from "./context.ts";
import { Api } from "./core/api.ts";
import { GrammyError, HttpError } from "./core/error.ts";
import { parse, preprocess } from "./filter.ts";
import { debug as d } from "./platform.deno.ts";
const debug = d("grammy:bot");
const debugWarn = d("grammy:warn");
const debugErr = d("grammy:error");
export const DEFAULT_UPDATE_TYPES = [
  "message",
  "edited_message",
  "channel_post",
  "edited_channel_post",
  "business_connection",
  "business_message",
  "edited_business_message",
  "deleted_business_messages",
  "inline_query",
  "chosen_inline_result",
  "callback_query",
  "shipping_query",
  "pre_checkout_query",
  "poll",
  "poll_answer",
  "my_chat_member",
  "chat_join_request",
  "chat_boost",
  "removed_chat_boost"
];
export { BotError };
/**
 * This is the single most important class of grammY. It represents your bot.
 *
 * First, you must create a bot by talking to @BotFather, check out
 * https://t.me/BotFather. Once it is ready, you obtain a secret token for your
 * bot. grammY will use that token to identify as your bot when talking to the
 * Telegram servers. Got the token? You are now ready to write some code and run
 * your bot!
 *
 * You should do three things to run your bot:
 * ```ts
 * // 1. Create a bot instance
 * const bot = new Bot('<secret-token>')
 * // 2. Listen for updates
 * bot.on('message:text', ctx => ctx.reply('You wrote: ' + ctx.message.text))
 * // 3. Launch it!
 * bot.start()
 * ```
 */ export class Bot extends Composer {
  token;
  pollingRunning;
  pollingAbortController;
  lastTriedUpdateId;
  /**
     * Gives you full access to the Telegram Bot API.
     * ```ts
     * // This is how to call the Bot API methods:
     * bot.api.sendMessage(chat_id, 'Hello, grammY!')
     * ```
     *
     * Use this only outside of your middleware. If you have access to `ctx`,
     * then using `ctx.api` instead of `bot.api` is preferred.
     */ api;
  me;
  mePromise;
  clientConfig;
  ContextConstructor;
  /** Used to log a warning if some update types are not in allowed_updates */ observedUpdateTypes;
  /**
     * Holds the bot's error handler that is invoked whenever middleware throws
     * (rejects). If you set your own error handler via `bot.catch`, all that
     * happens is that this variable is assigned.
     */ errorHandler;
  /**
     * Creates a new Bot with the given token.
     *
     * Remember that you can listen for messages by calling
     * ```ts
     * bot.on('message', ctx => { ... })
     * ```
     * or similar methods.
     *
     * The simplest way to start your bot is via simple long polling:
     * ```ts
     * bot.start()
     * ```
     *
     * @param token The bot's token as acquired from https://t.me/BotFather
     * @param config Optional configuration properties for the bot
     */ constructor(token, config){
    super();
    this.token = token;
    this.pollingRunning = false;
    this.lastTriedUpdateId = 0;
    this.observedUpdateTypes = new Set();
    this.errorHandler = async (err)=>{
      console.error("Error in middleware while handling update", err.ctx?.update?.update_id, err.error);
      console.error("No error handler was set!");
      console.error("Set your own error handler with `bot.catch = ...`");
      if (this.pollingRunning) {
        console.error("Stopping bot");
        await this.stop();
      }
      throw err;
    };
    if (!token) throw new Error("Empty token!");
    this.me = config?.botInfo;
    this.clientConfig = config?.client;
    this.ContextConstructor = config?.ContextConstructor ?? Context;
    this.api = new Api(token, this.clientConfig);
  }
  /**
     * Information about the bot itself as retrieved from `api.getMe()`. Only
     * available after the bot has been initialized via `await bot.init()`, or
     * after the value has been set manually.
     *
     * Starting the bot will always perform the initialization automatically,
     * unless a manual value is already set.
     *
     * Note that the recommended way to set a custom bot information object is
     * to pass it to the configuration object of the `new Bot()` instantiation,
     * rather than assigning this property.
     */ set botInfo(botInfo) {
    this.me = botInfo;
  }
  get botInfo() {
    if (this.me === undefined) {
      throw new Error("Bot information unavailable! Make sure to call `await bot.init()` before accessing `bot.botInfo`!");
    }
    return this.me;
  }
  /**
     * @inheritdoc
     */ on(filter, ...middleware) {
    for (const [u] of parse(filter).flatMap(preprocess)){
      this.observedUpdateTypes.add(u);
    }
    return super.on(filter, ...middleware);
  }
  /**
     * @inheritdoc
     */ reaction(reaction, ...middleware) {
    this.observedUpdateTypes.add("message_reaction");
    return super.reaction(reaction, ...middleware);
  }
  /**
     * Checks if the bot has been initialized. A bot is initialized if the bot
     * information is set. The bot information can either be set automatically
     * by calling `bot.init`, or manually through the bot constructor. Note that
     * usually, initialization is done automatically and you do not have to care
     * about this method.
     *
     * @returns true if the bot is initialized, and false otherwise
     */ isInited() {
    return this.me !== undefined;
  }
  /**
     * Initializes the bot, i.e. fetches information about the bot itself. This
     * method is called automatically, you usually don't have to call it
     * manually.
     *
     * @param signal Optional `AbortSignal` to cancel the initialization
     */ async init(signal) {
    if (!this.isInited()) {
      debug("Initializing bot");
      this.mePromise ??= withRetries(()=>this.api.getMe(signal), signal);
      let me;
      try {
        me = await this.mePromise;
      } finally{
        this.mePromise = undefined;
      }
      if (this.me === undefined) this.me = me;
      else debug("Bot info was set by now, will not overwrite");
    }
    debug(`I am ${this.me.username}!`);
  }
  /**
     * Internal. Do not call. Handles an update batch sequentially by supplying
     * it one-by-one to the middleware. Handles middleware errors and stores the
     * last update identifier that was being tried to handle.
     *
     * @param updates An array of updates to handle
     */ async handleUpdates(updates) {
    // handle updates sequentially (!)
    for (const update of updates){
      this.lastTriedUpdateId = update.update_id;
      try {
        await this.handleUpdate(update);
      } catch (err) {
        // should always be true
        if (err instanceof BotError) {
          await this.errorHandler(err);
        } else {
          console.error("FATAL: grammY unable to handle:", err);
          throw err;
        }
      }
    }
  }
  /**
     * This is an internal method that you probably will not ever need to call.
     * It is used whenever a new update arrives from the Telegram servers that
     * your bot will handle.
     *
     * If you're writing a library on top of grammY, check out the
     * [documentation](https://grammy.dev/plugins/runner) of the runner
     * plugin for an example that uses this method.
     *
     * @param update An update from the Telegram Bot API
     * @param webhookReplyEnvelope An optional webhook reply envelope
     */ async handleUpdate(update, webhookReplyEnvelope) {
    if (this.me === undefined) {
      throw new Error("Bot not initialized! Either call `await bot.init()`, \
or directly set the `botInfo` option in the `Bot` constructor to specify \
a known bot info object.");
    }
    debug(`Processing update ${update.update_id}`);
    // create API object
    const api = new Api(this.token, this.clientConfig, webhookReplyEnvelope);
    // configure it with the same transformers as bot.api
    const t = this.api.config.installedTransformers();
    if (t.length > 0) api.config.use(...t);
    // create context object
    const ctx = new this.ContextConstructor(update, api, this.me);
    try {
      // run middleware stack
      await run(this.middleware(), ctx);
    } catch (err) {
      debugErr(`Error in middleware for update ${update.update_id}`);
      throw new BotError(err, ctx);
    }
  }
  /**
     * Starts your bot using long polling.
     *
     * > This method returns a `Promise` that will never resolve except if your
     * > bot is stopped. **You don't need to `await` the call to `bot.start`**,
     * > but remember to catch potential errors by calling `bot.catch`.
     * > Otherwise your bot will crash (and stop) if something goes wrong in
     * > your code.
     *
     * This method effectively enters a loop that will repeatedly call
     * `getUpdates` and run your middleware for every received update, allowing
     * your bot to respond to messages.
     *
     * If your bot is already running, this method does nothing.
     *
     * **Note that this starts your bot using a very simple long polling
     * implementation.** `bot.start` should only be used for small bots. While
     * the rest of grammY was built to perform well even under extreme loads,
     * simple long polling is not capable of scaling up in a similar fashion.
     * You should switch over to using `@grammyjs/runner` if you are running a
     * bot with high load.
     *
     * What exactly _high load_ means differs from bot to bot, but as a rule of
     * thumb, simple long polling should not be processing more than ~5K
     * messages every hour. Also, if your bot has long-running operations such
     * as large file transfers that block the middleware from completing, this
     * will impact the responsiveness negatively, so it makes sense to use the
     * `@grammyjs/runner` package even if you receive much fewer messages. If
     * you worry about how much load your bot can handle, check out the grammY
     * [documentation](https://grammy.dev/advanced/scaling) about scaling
     * up.
     *
     * @param options Options to use for simple long polling
     */ async start(options) {
    // Perform setup
    const setup = [];
    if (!this.isInited()) {
      setup.push(this.init(this.pollingAbortController?.signal));
    }
    if (this.pollingRunning) {
      await Promise.all(setup);
      debug("Simple long polling already running!");
      return;
    }
    this.pollingRunning = true;
    this.pollingAbortController = new AbortController();
    try {
      setup.push(withRetries(async ()=>{
        await this.api.deleteWebhook({
          drop_pending_updates: options?.drop_pending_updates
        }, this.pollingAbortController?.signal);
      }, this.pollingAbortController?.signal));
      await Promise.all(setup);
      // All async ops of setup complete, run callback
      await options?.onStart?.(this.botInfo);
    } catch (err) {
      this.pollingRunning = false;
      this.pollingAbortController = undefined;
      throw err;
    }
    // Bot was stopped during `onStart`
    if (!this.pollingRunning) return;
    // Prevent common misuse that leads to missing updates
    validateAllowedUpdates(this.observedUpdateTypes, options?.allowed_updates);
    // Prevent common misuse that causes memory leak
    this.use = noUseFunction;
    // Start polling
    debug("Starting simple long polling");
    await this.loop(options);
    debug("Middleware is done running");
  }
  /**
     * Stops the bot from long polling.
     *
     * All middleware that is currently being executed may complete, but no
     * further `getUpdates` calls will be performed. The current `getUpdates`
     * request will be cancelled.
     *
     * In addition, this method will _confirm_ the last received update to the
     * Telegram servers by calling `getUpdates` one last time with the latest
     * offset value. If any updates are received in this call, they are
     * discarded and will be fetched again when the bot starts up the next time.
     * Confer the official documentation on confirming updates if you want to
     * know more: https://core.telegram.org/bots/api#getupdates
     *
     * > Note that this method will not wait for the middleware stack to finish.
     * > If you need to run code after all middleware is done, consider waiting
     * > for the promise returned by `bot.start()` to resolve.
     */ async stop() {
    if (this.pollingRunning) {
      debug("Stopping bot, saving update offset");
      this.pollingRunning = false;
      this.pollingAbortController?.abort();
      const offset = this.lastTriedUpdateId + 1;
      await this.api.getUpdates({
        offset,
        limit: 1
      }).finally(()=>this.pollingAbortController = undefined);
    } else {
      debug("Bot is not running!");
    }
  }
  /**
     * Sets the bots error handler that is used during long polling.
     *
     * You should call this method to set an error handler if you are using long
     * polling, no matter whether you use `bot.start` or the `@grammyjs/runner`
     * package to run your bot.
     *
     * Calling `bot.catch` when using other means of running your bot (or
     * webhooks) has no effect.
     *
     * @param errorHandler A function that handles potential middleware errors
     */ catch(errorHandler) {
    this.errorHandler = errorHandler;
  }
  /**
     * Internal. Do not call. Enters a loop that will perform long polling until
     * the bot is stopped.
     */ async loop(options) {
    const limit = options?.limit;
    const timeout = options?.timeout ?? 30; // seconds
    let allowed_updates = options?.allowed_updates ?? []; // reset to default if unspecified
    while(this.pollingRunning){
      // fetch updates
      const updates = await this.fetchUpdates({
        limit,
        timeout,
        allowed_updates
      });
      // check if polling stopped
      if (updates === undefined) break;
      // handle updates
      await this.handleUpdates(updates);
      // Telegram uses the last setting if `allowed_updates` is omitted so
      // we can save some traffic by only sending it in the first request
      allowed_updates = undefined;
    }
  }
  /**
     * Internal. Do not call. Reliably fetches an update batch via `getUpdates`.
     * Handles all known errors. Returns `undefined` if the bot is stopped and
     * the call gets cancelled.
     *
     * @param options Polling options
     * @returns An array of updates, or `undefined` if the bot is stopped.
     */ async fetchUpdates({ limit, timeout, allowed_updates }) {
    const offset = this.lastTriedUpdateId + 1;
    let updates = undefined;
    do {
      try {
        updates = await this.api.getUpdates({
          offset,
          limit,
          timeout,
          allowed_updates
        }, this.pollingAbortController?.signal);
      } catch (error) {
        await this.handlePollingError(error);
      }
    }while (updates === undefined && this.pollingRunning)
    return updates;
  }
  /**
     * Internal. Do not call. Handles an error that occurred during long
     * polling.
     */ async handlePollingError(error) {
    if (!this.pollingRunning) {
      debug("Pending getUpdates request cancelled");
      return;
    }
    let sleepSeconds = 3;
    if (error instanceof GrammyError) {
      debugErr(error.message);
      // rethrow upon unauthorized or conflict
      if (error.error_code === 401 || error.error_code === 409) {
        throw error;
      } else if (error.error_code === 429) {
        debugErr("Bot API server is closing.");
        sleepSeconds = error.parameters.retry_after ?? sleepSeconds;
      }
    } else debugErr(error);
    debugErr(`Call to getUpdates failed, retrying in ${sleepSeconds} seconds ...`);
    await sleep(sleepSeconds);
  }
}
/**
 * Performs a network call task, retrying upon known errors until success.
 *
 * If the task errors and a retry_after value can be used, a subsequent retry
 * will be delayed by the specified period of time.
 *
 * Otherwise, if the first attempt at running the task fails, the task is
 * retried immediately. If second attempt fails, too, waits for 100 ms, and then
 * doubles this delay for every subsequent attemt. Never waits longer than 1
 * hour before retrying.
 *
 * @param task Async task to perform
 * @param signal Optional `AbortSignal` to prevent further retries
 */ async function withRetries(task, signal) {
  // Set up delays between retries
  const INITIAL_DELAY = 50; // ms
  let lastDelay = INITIAL_DELAY;
  // Define error handler
  /**
     * Determines the error handling strategy based on various error types.
     * Sleeps if necessary, and returns whether to retry or rethrow an error.
     */ async function handleError(error) {
    let delay = false;
    let strategy = "rethrow";
    if (error instanceof HttpError) {
      delay = true;
      strategy = "retry";
    } else if (error instanceof GrammyError) {
      if (error.error_code >= 500) {
        delay = true;
        strategy = "retry";
      } else if (error.error_code === 429) {
        const retryAfter = error.parameters.retry_after;
        if (typeof retryAfter === "number") {
          // ignore the backoff for sleep, then reset it
          await sleep(retryAfter, signal);
          lastDelay = INITIAL_DELAY;
        } else {
          delay = true;
        }
        strategy = "retry";
      }
    }
    if (delay) {
      // Do not sleep for the first retry
      if (lastDelay !== INITIAL_DELAY) {
        await sleep(lastDelay, signal);
      }
      const TWENTY_MINUTES = 20 * 60 * 1000; // ms
      lastDelay = Math.min(TWENTY_MINUTES, 2 * lastDelay);
    }
    return strategy;
  }
  // Perform the actual task with retries
  let result = {
    ok: false
  };
  while(!result.ok){
    try {
      result = {
        ok: true,
        value: await task()
      };
    } catch (error) {
      debugErr(error);
      const strategy = await handleError(error);
      switch(strategy){
        case "retry":
          continue;
        case "rethrow":
          throw error;
      }
    }
  }
  return result.value;
}
/**
 * Returns a new promise that resolves after the specified number of seconds, or
 * rejects as soon as the given signal is aborted.
 */ async function sleep(seconds, signal) {
  let handle;
  let reject;
  function abort() {
    reject?.(new Error("Aborted delay"));
    if (handle !== undefined) clearTimeout(handle);
  }
  try {
    await new Promise((res, rej)=>{
      reject = rej;
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener("abort", abort);
      handle = setTimeout(res, 1000 * seconds);
    });
  } finally{
    signal?.removeEventListener("abort", abort);
  }
}
/**
 * Takes a set of observed update types and a list of allowed updates and logs a
 * warning in debug mode if some update types were observed that have not been
 * allowed.
 */ function validateAllowedUpdates(updates, allowed = DEFAULT_UPDATE_TYPES) {
  const impossible = Array.from(updates).filter((u)=>!allowed.includes(u));
  if (impossible.length > 0) {
    debugWarn(`You registered listeners for the following update types, \
but you did not specify them in \`allowed_updates\` \
so they may not be received: ${impossible.map((u)=>`'${u}'`).join(", ")}`);
  }
}
function noUseFunction() {
  throw new Error(`It looks like you are registering more listeners \
on your bot from within other listeners! This means that every time your bot \
handles a message like this one, new listeners will be added. This list grows until \
your machine crashes, so grammY throws this error to tell you that you should \
probably do things a bit differently. If you're unsure how to resolve this problem, \
you can ask in the group chat: https://telegram.me/grammyjs

On the other hand, if you actually know what you're doing and you do need to install \
further middleware while your bot is running, consider installing a composer \
instance on your bot, and in turn augment the composer after the fact. This way, \
you can circumvent this protection against memory leaks.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvYm90LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBjYW1lbGNhc2VcbmltcG9ydCB7XG4gICAgQm90RXJyb3IsXG4gICAgQ29tcG9zZXIsXG4gICAgdHlwZSBNaWRkbGV3YXJlLFxuICAgIHR5cGUgUmVhY3Rpb25NaWRkbGV3YXJlLFxuICAgIHJ1bixcbn0gZnJvbSBcIi4vY29tcG9zZXIudHNcIjtcbmltcG9ydCB7IENvbnRleHQsIHR5cGUgTWF5YmVBcnJheSwgdHlwZSBSZWFjdGlvbkNvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyBBcGkgfSBmcm9tIFwiLi9jb3JlL2FwaS50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIEFwaUNsaWVudE9wdGlvbnMsXG4gICAgdHlwZSBXZWJob29rUmVwbHlFbnZlbG9wZSxcbn0gZnJvbSBcIi4vY29yZS9jbGllbnQudHNcIjtcbmltcG9ydCB7IEdyYW1teUVycm9yLCBIdHRwRXJyb3IgfSBmcm9tIFwiLi9jb3JlL2Vycm9yLnRzXCI7XG5pbXBvcnQgeyB0eXBlIEZpbHRlciwgdHlwZSBGaWx0ZXJRdWVyeSwgcGFyc2UsIHByZXByb2Nlc3MgfSBmcm9tIFwiLi9maWx0ZXIudHNcIjtcbmltcG9ydCB7IGRlYnVnIGFzIGQgfSBmcm9tIFwiLi9wbGF0Zm9ybS5kZW5vLnRzXCI7XG5pbXBvcnQge1xuICAgIHR5cGUgUmVhY3Rpb25UeXBlLFxuICAgIHR5cGUgUmVhY3Rpb25UeXBlRW1vamksXG4gICAgdHlwZSBVcGRhdGUsXG4gICAgdHlwZSBVc2VyRnJvbUdldE1lLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuY29uc3QgZGVidWcgPSBkKFwiZ3JhbW15OmJvdFwiKTtcbmNvbnN0IGRlYnVnV2FybiA9IGQoXCJncmFtbXk6d2FyblwiKTtcbmNvbnN0IGRlYnVnRXJyID0gZChcImdyYW1teTplcnJvclwiKTtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVVBEQVRFX1RZUEVTID0gW1xuICAgIFwibWVzc2FnZVwiLFxuICAgIFwiZWRpdGVkX21lc3NhZ2VcIixcbiAgICBcImNoYW5uZWxfcG9zdFwiLFxuICAgIFwiZWRpdGVkX2NoYW5uZWxfcG9zdFwiLFxuICAgIFwiYnVzaW5lc3NfY29ubmVjdGlvblwiLFxuICAgIFwiYnVzaW5lc3NfbWVzc2FnZVwiLFxuICAgIFwiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIixcbiAgICBcImRlbGV0ZWRfYnVzaW5lc3NfbWVzc2FnZXNcIixcbiAgICBcImlubGluZV9xdWVyeVwiLFxuICAgIFwiY2hvc2VuX2lubGluZV9yZXN1bHRcIixcbiAgICBcImNhbGxiYWNrX3F1ZXJ5XCIsXG4gICAgXCJzaGlwcGluZ19xdWVyeVwiLFxuICAgIFwicHJlX2NoZWNrb3V0X3F1ZXJ5XCIsXG4gICAgXCJwb2xsXCIsXG4gICAgXCJwb2xsX2Fuc3dlclwiLFxuICAgIFwibXlfY2hhdF9tZW1iZXJcIixcbiAgICBcImNoYXRfam9pbl9yZXF1ZXN0XCIsXG4gICAgXCJjaGF0X2Jvb3N0XCIsXG4gICAgXCJyZW1vdmVkX2NoYXRfYm9vc3RcIixcbl0gYXMgY29uc3Q7XG5cbi8qKlxuICogT3B0aW9ucyB0aGF0IGNhbiBiZSBzcGVjaWZpZWQgd2hlbiBydW5uaW5nIHRoZSBib3QgdmlhIHNpbXBsZSBsb25nIHBvbGxpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9sbGluZ09wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIExpbWl0cyB0aGUgbnVtYmVyIG9mIHVwZGF0ZXMgdG8gYmUgcmV0cmlldmVkIHBlciBgZ2V0VXBkYXRlc2AgY2FsbC5cbiAgICAgKiBWYWx1ZXMgYmV0d2VlbiAxLTEwMCBhcmUgYWNjZXB0ZWQuIERlZmF1bHRzIHRvIDEwMC5cbiAgICAgKi9cbiAgICBsaW1pdD86IG51bWJlcjtcbiAgICAvKipcbiAgICAgKiBUaW1lb3V0IGluIHNlY29uZHMgZm9yIGxvbmcgcG9sbGluZy4gZ3JhbW1ZIHVzZXMgMzAgc2Vjb25kcyBhcyBhIGRlZmF1bHRcbiAgICAgKiB2YWx1ZS5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xuICAgIC8qKlxuICAgICAqIEEgbGlzdCBvZiB0aGUgdXBkYXRlIHR5cGVzIHlvdSB3YW50IHlvdXIgYm90IHRvIHJlY2VpdmUuIEZvciBleGFtcGxlLFxuICAgICAqIHNwZWNpZnkgW+KAnG1lc3NhZ2XigJ0sIOKAnGVkaXRlZF9jaGFubmVsX3Bvc3TigJ0sIOKAnGNhbGxiYWNrX3F1ZXJ54oCdXSB0byBvbmx5XG4gICAgICogcmVjZWl2ZSB1cGRhdGVzIG9mIHRoZXNlIHR5cGVzLiBTZWUgVXBkYXRlIGZvciBhIGNvbXBsZXRlIGxpc3Qgb2ZcbiAgICAgKiBhdmFpbGFibGUgdXBkYXRlIHR5cGVzLiBTcGVjaWZ5IGFuIGVtcHR5IGxpc3QgdG8gcmVjZWl2ZSBhbGwgdXBkYXRlIHR5cGVzXG4gICAgICogZXhjZXB0IGNoYXRfbWVtYmVyIChkZWZhdWx0KS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHByZXZpb3VzIHNldHRpbmcgd2lsbFxuICAgICAqIGJlIHVzZWQuXG4gICAgICpcbiAgICAgKiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgcGFyYW1ldGVyIGRvZXNuJ3QgYWZmZWN0IHVwZGF0ZXMgY3JlYXRlZCBiZWZvcmUgdGhlXG4gICAgICogY2FsbCB0byB0aGUgZ2V0VXBkYXRlcywgc28gdW53YW50ZWQgdXBkYXRlcyBtYXkgYmUgcmVjZWl2ZWQgZm9yIGEgc2hvcnRcbiAgICAgKiBwZXJpb2Qgb2YgdGltZS5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3VwZGF0ZXM/OiBSZWFkb25seUFycmF5PEV4Y2x1ZGU8a2V5b2YgVXBkYXRlLCBcInVwZGF0ZV9pZFwiPj47XG4gICAgLyoqXG4gICAgICogUGFzcyBUcnVlIHRvIGRyb3AgYWxsIHBlbmRpbmcgdXBkYXRlcyBiZWZvcmUgc3RhcnRpbmcgdGhlIGxvbmcgcG9sbGluZy5cbiAgICAgKi9cbiAgICBkcm9wX3BlbmRpbmdfdXBkYXRlcz86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIHVzZWZ1bCBmb3IgbG9nZ2luZyAob3Igc2V0dGluZyB1cCBtaWRkbGV3YXJlXG4gICAgICogaWYgeW91IGRpZCBub3QgZG8gdGhpcyBiZWZvcmUpLiBJdCB3aWxsIGJlIGV4ZWN1dGVkIGFmdGVyIHRoZSBzZXR1cCBvZlxuICAgICAqIHRoZSBib3QgaGFzIGNvbXBsZXRlZCwgYW5kIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZmlyc3QgdXBkYXRlcyBhcmUgYmVpbmdcbiAgICAgKiBmZXRjaGVkLiBUaGUgYm90IGluZm9ybWF0aW9uIGBib3QuYm90SW5mb2Agd2lsbCBiZSBhdmFpbGFibGUgd2hlbiB0aGVcbiAgICAgKiBmdW5jdGlvbiBpcyBydW4uIEZvciBjb252ZW5pZW5jZSwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHJlY2VpdmVzIHRoZVxuICAgICAqIHZhbHVlIG9mIGBib3QuYm90SW5mb2AgYXMgYW4gYXJndW1lbnQuXG4gICAgICovXG4gICAgb25TdGFydD86IChib3RJbmZvOiBVc2VyRnJvbUdldE1lKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IHsgQm90RXJyb3IgfTtcbi8qKlxuICogRXJyb3IgaGFuZGxlciB0aGF0IGNhbiBiZSBpbnN0YWxsZWQgb24gYSBib3QgdG8gY2F0Y2ggZXJyb3IgdGhyb3duIGJ5XG4gKiBtaWRkbGV3YXJlLlxuICovXG5leHBvcnQgdHlwZSBFcnJvckhhbmRsZXI8QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiA9IChcbiAgICBlcnJvcjogQm90RXJyb3I8Qz4sXG4pID0+IHVua25vd247XG5cbi8qKlxuICogT3B0aW9ucyB0byBwYXNzIHRvIHRoZSBib3Qgd2hlbiBjcmVhdGluZyBpdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb3RDb25maWc8QyBleHRlbmRzIENvbnRleHQ+IHtcbiAgICAvKipcbiAgICAgKiBZb3UgY2FuIHNwZWNpZnkgYSBudW1iZXIgb2YgYWR2YW5jZWQgb3B0aW9ucyB1bmRlciB0aGUgYGNsaWVudGAgcHJvcGVydHkuXG4gICAgICogVGhlIG9wdGlvbnMgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGdyYW1tWSBjbGllbnTigJR0aGlzIGlzIHRoZSBwYXJ0IG9mXG4gICAgICogZ3JhbW1ZIHRoYXQgYWN0dWFsbHkgY29ubmVjdHMgdG8gdGhlIFRlbGVncmFtIEJvdCBBUEkgc2VydmVyIGluIHRoZSBlbmRcbiAgICAgKiB3aGVuIG1ha2luZyBIVFRQIHJlcXVlc3RzLlxuICAgICAqL1xuICAgIGNsaWVudD86IEFwaUNsaWVudE9wdGlvbnM7XG4gICAgLyoqXG4gICAgICogZ3JhbW1ZIGF1dG9tYXRpY2FsbHkgY2FsbHMgYGdldE1lYCB3aGVuIHN0YXJ0aW5nIHVwIHRvIG1ha2Ugc3VyZSB0aGF0XG4gICAgICogeW91ciBib3QgaGFzIGFjY2VzcyB0byB0aGUgYm90J3Mgb3duIGluZm9ybWF0aW9uLiBJZiB5b3UgcmVzdGFydCB5b3VyIGJvdFxuICAgICAqIG9mdGVuLCBmb3IgZXhhbXBsZSBiZWNhdXNlIGl0IGlzIHJ1bm5pbmcgaW4gYSBzZXJ2ZXJsZXNzIGVudmlyb25tZW50LFxuICAgICAqIHRoZW4geW91IG1heSB3YW50IHRvIHNraXAgdGhpcyBpbml0aWFsIEFQSSBjYWxsLlxuICAgICAqXG4gICAgICogU2V0IHRoaXMgcHJvcGVydHkgb2YgdGhlIG9wdGlvbnMgdG8gcHJlLWluaXRpYWxpemUgdGhlIGJvdCB3aXRoIGNhY2hlZFxuICAgICAqIHZhbHVlcy4gSWYgeW91IHVzZSB0aGlzIG9wdGlvbiwgZ3JhbW1ZIHdpbGwgbm90IGF0dGVtcHQgdG8gbWFrZSBhIGBnZXRNZWBcbiAgICAgKiBjYWxsIGJ1dCB1c2UgdGhlIHByb3ZpZGVkIGRhdGEgaW5zdGVhZC5cbiAgICAgKi9cbiAgICBib3RJbmZvPzogVXNlckZyb21HZXRNZTtcbiAgICAvKipcbiAgICAgKiBQYXNzIHRoZSBjb25zdHJ1Y3RvciBvZiBhIGN1c3RvbSBjb250ZXh0IG9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCB3aGVuXG4gICAgICogY3JlYXRpbmcgdGhlIGNvbnRleHQgZm9yIGVhY2ggaW5jb21pbmcgdXBkYXRlLlxuICAgICAqL1xuICAgIENvbnRleHRDb25zdHJ1Y3Rvcj86IG5ldyAoXG4gICAgICAgIC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQ29udGV4dD5cbiAgICApID0+IEM7XG59XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgc2luZ2xlIG1vc3QgaW1wb3J0YW50IGNsYXNzIG9mIGdyYW1tWS4gSXQgcmVwcmVzZW50cyB5b3VyIGJvdC5cbiAqXG4gKiBGaXJzdCwgeW91IG11c3QgY3JlYXRlIGEgYm90IGJ5IHRhbGtpbmcgdG8gQEJvdEZhdGhlciwgY2hlY2sgb3V0XG4gKiBodHRwczovL3QubWUvQm90RmF0aGVyLiBPbmNlIGl0IGlzIHJlYWR5LCB5b3Ugb2J0YWluIGEgc2VjcmV0IHRva2VuIGZvciB5b3VyXG4gKiBib3QuIGdyYW1tWSB3aWxsIHVzZSB0aGF0IHRva2VuIHRvIGlkZW50aWZ5IGFzIHlvdXIgYm90IHdoZW4gdGFsa2luZyB0byB0aGVcbiAqIFRlbGVncmFtIHNlcnZlcnMuIEdvdCB0aGUgdG9rZW4/IFlvdSBhcmUgbm93IHJlYWR5IHRvIHdyaXRlIHNvbWUgY29kZSBhbmQgcnVuXG4gKiB5b3VyIGJvdCFcbiAqXG4gKiBZb3Ugc2hvdWxkIGRvIHRocmVlIHRoaW5ncyB0byBydW4geW91ciBib3Q6XG4gKiBgYGB0c1xuICogLy8gMS4gQ3JlYXRlIGEgYm90IGluc3RhbmNlXG4gKiBjb25zdCBib3QgPSBuZXcgQm90KCc8c2VjcmV0LXRva2VuPicpXG4gKiAvLyAyLiBMaXN0ZW4gZm9yIHVwZGF0ZXNcbiAqIGJvdC5vbignbWVzc2FnZTp0ZXh0JywgY3R4ID0+IGN0eC5yZXBseSgnWW91IHdyb3RlOiAnICsgY3R4Lm1lc3NhZ2UudGV4dCkpXG4gKiAvLyAzLiBMYXVuY2ggaXQhXG4gKiBib3Quc3RhcnQoKVxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBCb3Q8XG4gICAgQyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0LFxuICAgIEEgZXh0ZW5kcyBBcGkgPSBBcGksXG4+IGV4dGVuZHMgQ29tcG9zZXI8Qz4ge1xuICAgIHByaXZhdGUgcG9sbGluZ1J1bm5pbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIHBvbGxpbmdBYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGxhc3RUcmllZFVwZGF0ZUlkID0gMDtcblxuICAgIC8qKlxuICAgICAqIEdpdmVzIHlvdSBmdWxsIGFjY2VzcyB0byB0aGUgVGVsZWdyYW0gQm90IEFQSS5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFRoaXMgaXMgaG93IHRvIGNhbGwgdGhlIEJvdCBBUEkgbWV0aG9kczpcbiAgICAgKiBib3QuYXBpLnNlbmRNZXNzYWdlKGNoYXRfaWQsICdIZWxsbywgZ3JhbW1ZIScpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBvbmx5IG91dHNpZGUgb2YgeW91ciBtaWRkbGV3YXJlLiBJZiB5b3UgaGF2ZSBhY2Nlc3MgdG8gYGN0eGAsXG4gICAgICogdGhlbiB1c2luZyBgY3R4LmFwaWAgaW5zdGVhZCBvZiBgYm90LmFwaWAgaXMgcHJlZmVycmVkLlxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBhcGk6IEE7XG5cbiAgICBwcml2YXRlIG1lOiBVc2VyRnJvbUdldE1lIHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgbWVQcm9taXNlOiBQcm9taXNlPFVzZXJGcm9tR2V0TWU+IHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2xpZW50Q29uZmlnOiBBcGlDbGllbnRPcHRpb25zIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBDb250ZXh0Q29uc3RydWN0b3I6IG5ldyAoXG4gICAgICAgIC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQ29udGV4dD5cbiAgICApID0+IEM7XG5cbiAgICAvKiogVXNlZCB0byBsb2cgYSB3YXJuaW5nIGlmIHNvbWUgdXBkYXRlIHR5cGVzIGFyZSBub3QgaW4gYWxsb3dlZF91cGRhdGVzICovXG4gICAgcHJpdmF0ZSBvYnNlcnZlZFVwZGF0ZVR5cGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAvKipcbiAgICAgKiBIb2xkcyB0aGUgYm90J3MgZXJyb3IgaGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbmV2ZXIgbWlkZGxld2FyZSB0aHJvd3NcbiAgICAgKiAocmVqZWN0cykuIElmIHlvdSBzZXQgeW91ciBvd24gZXJyb3IgaGFuZGxlciB2aWEgYGJvdC5jYXRjaGAsIGFsbCB0aGF0XG4gICAgICogaGFwcGVucyBpcyB0aGF0IHRoaXMgdmFyaWFibGUgaXMgYXNzaWduZWQuXG4gICAgICovXG4gICAgcHVibGljIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyPEM+ID0gYXN5bmMgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgXCJFcnJvciBpbiBtaWRkbGV3YXJlIHdoaWxlIGhhbmRsaW5nIHVwZGF0ZVwiLFxuICAgICAgICAgICAgZXJyLmN0eD8udXBkYXRlPy51cGRhdGVfaWQsXG4gICAgICAgICAgICBlcnIuZXJyb3IsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBlcnJvciBoYW5kbGVyIHdhcyBzZXQhXCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiU2V0IHlvdXIgb3duIGVycm9yIGhhbmRsZXIgd2l0aCBgYm90LmNhdGNoID0gLi4uYFwiKTtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZ1J1bm5pbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdG9wcGluZyBib3RcIik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgQm90IHdpdGggdGhlIGdpdmVuIHRva2VuLlxuICAgICAqXG4gICAgICogUmVtZW1iZXIgdGhhdCB5b3UgY2FuIGxpc3RlbiBmb3IgbWVzc2FnZXMgYnkgY2FsbGluZ1xuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICogb3Igc2ltaWxhciBtZXRob2RzLlxuICAgICAqXG4gICAgICogVGhlIHNpbXBsZXN0IHdheSB0byBzdGFydCB5b3VyIGJvdCBpcyB2aWEgc2ltcGxlIGxvbmcgcG9sbGluZzpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5zdGFydCgpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9rZW4gVGhlIGJvdCdzIHRva2VuIGFzIGFjcXVpcmVkIGZyb20gaHR0cHM6Ly90Lm1lL0JvdEZhdGhlclxuICAgICAqIEBwYXJhbSBjb25maWcgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgYm90XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHRva2VuOiBzdHJpbmcsIGNvbmZpZz86IEJvdENvbmZpZzxDPikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJFbXB0eSB0b2tlbiFcIik7XG4gICAgICAgIHRoaXMubWUgPSBjb25maWc/LmJvdEluZm87XG4gICAgICAgIHRoaXMuY2xpZW50Q29uZmlnID0gY29uZmlnPy5jbGllbnQ7XG4gICAgICAgIHRoaXMuQ29udGV4dENvbnN0cnVjdG9yID0gY29uZmlnPy5Db250ZXh0Q29uc3RydWN0b3IgPz9cbiAgICAgICAgICAgIChDb250ZXh0IGFzIHVua25vd24gYXMgbmV3IChcbiAgICAgICAgICAgICAgICAuLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIENvbnRleHQ+XG4gICAgICAgICAgICApID0+IEMpO1xuICAgICAgICB0aGlzLmFwaSA9IG5ldyBBcGkodG9rZW4sIHRoaXMuY2xpZW50Q29uZmlnKSBhcyBBO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBib3QgaXRzZWxmIGFzIHJldHJpZXZlZCBmcm9tIGBhcGkuZ2V0TWUoKWAuIE9ubHlcbiAgICAgKiBhdmFpbGFibGUgYWZ0ZXIgdGhlIGJvdCBoYXMgYmVlbiBpbml0aWFsaXplZCB2aWEgYGF3YWl0IGJvdC5pbml0KClgLCBvclxuICAgICAqIGFmdGVyIHRoZSB2YWx1ZSBoYXMgYmVlbiBzZXQgbWFudWFsbHkuXG4gICAgICpcbiAgICAgKiBTdGFydGluZyB0aGUgYm90IHdpbGwgYWx3YXlzIHBlcmZvcm0gdGhlIGluaXRpYWxpemF0aW9uIGF1dG9tYXRpY2FsbHksXG4gICAgICogdW5sZXNzIGEgbWFudWFsIHZhbHVlIGlzIGFscmVhZHkgc2V0LlxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gc2V0IGEgY3VzdG9tIGJvdCBpbmZvcm1hdGlvbiBvYmplY3QgaXNcbiAgICAgKiB0byBwYXNzIGl0IHRvIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdCBvZiB0aGUgYG5ldyBCb3QoKWAgaW5zdGFudGlhdGlvbixcbiAgICAgKiByYXRoZXIgdGhhbiBhc3NpZ25pbmcgdGhpcyBwcm9wZXJ0eS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0IGJvdEluZm8oYm90SW5mbzogVXNlckZyb21HZXRNZSkge1xuICAgICAgICB0aGlzLm1lID0gYm90SW5mbztcbiAgICB9XG4gICAgcHVibGljIGdldCBib3RJbmZvKCk6IFVzZXJGcm9tR2V0TWUge1xuICAgICAgICBpZiAodGhpcy5tZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJCb3QgaW5mb3JtYXRpb24gdW5hdmFpbGFibGUhIE1ha2Ugc3VyZSB0byBjYWxsIGBhd2FpdCBib3QuaW5pdCgpYCBiZWZvcmUgYWNjZXNzaW5nIGBib3QuYm90SW5mb2AhXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgb248USBleHRlbmRzIEZpbHRlclF1ZXJ5PihcbiAgICAgICAgZmlsdGVyOiBRIHwgUVtdLFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEZpbHRlcjxDLCBRPj4+XG4gICAgKTogQ29tcG9zZXI8RmlsdGVyPEMsIFE+PiB7XG4gICAgICAgIGZvciAoY29uc3QgW3VdIG9mIHBhcnNlKGZpbHRlcikuZmxhdE1hcChwcmVwcm9jZXNzKSkge1xuICAgICAgICAgICAgdGhpcy5vYnNlcnZlZFVwZGF0ZVR5cGVzLmFkZCh1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIub24oZmlsdGVyLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICByZWFjdGlvbihcbiAgICAgICAgcmVhY3Rpb246IE1heWJlQXJyYXk8UmVhY3Rpb25UeXBlRW1vamlbXCJlbW9qaVwiXSB8IFJlYWN0aW9uVHlwZT4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PFJlYWN0aW9uTWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxSZWFjdGlvbkNvbnRleHQ8Qz4+IHtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFVwZGF0ZVR5cGVzLmFkZChcIm1lc3NhZ2VfcmVhY3Rpb25cIik7XG4gICAgICAgIHJldHVybiBzdXBlci5yZWFjdGlvbihyZWFjdGlvbiwgLi4ubWlkZGxld2FyZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBib3QgaGFzIGJlZW4gaW5pdGlhbGl6ZWQuIEEgYm90IGlzIGluaXRpYWxpemVkIGlmIHRoZSBib3RcbiAgICAgKiBpbmZvcm1hdGlvbiBpcyBzZXQuIFRoZSBib3QgaW5mb3JtYXRpb24gY2FuIGVpdGhlciBiZSBzZXQgYXV0b21hdGljYWxseVxuICAgICAqIGJ5IGNhbGxpbmcgYGJvdC5pbml0YCwgb3IgbWFudWFsbHkgdGhyb3VnaCB0aGUgYm90IGNvbnN0cnVjdG9yLiBOb3RlIHRoYXRcbiAgICAgKiB1c3VhbGx5LCBpbml0aWFsaXphdGlvbiBpcyBkb25lIGF1dG9tYXRpY2FsbHkgYW5kIHlvdSBkbyBub3QgaGF2ZSB0byBjYXJlXG4gICAgICogYWJvdXQgdGhpcyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBib3QgaXMgaW5pdGlhbGl6ZWQsIGFuZCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBpc0luaXRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWUgIT09IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgYm90LCBpLmUuIGZldGNoZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGJvdCBpdHNlbGYuIFRoaXNcbiAgICAgKiBtZXRob2QgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHksIHlvdSB1c3VhbGx5IGRvbid0IGhhdmUgdG8gY2FsbCBpdFxuICAgICAqIG1hbnVhbGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgaW5pdGlhbGl6YXRpb25cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0luaXRlZCgpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIkluaXRpYWxpemluZyBib3RcIik7XG4gICAgICAgICAgICB0aGlzLm1lUHJvbWlzZSA/Pz0gd2l0aFJldHJpZXMoXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5hcGkuZ2V0TWUoc2lnbmFsKSxcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IG1lOiBVc2VyRnJvbUdldE1lO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBtZSA9IGF3YWl0IHRoaXMubWVQcm9taXNlO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lUHJvbWlzZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1lID09PSB1bmRlZmluZWQpIHRoaXMubWUgPSBtZTtcbiAgICAgICAgICAgIGVsc2UgZGVidWcoXCJCb3QgaW5mbyB3YXMgc2V0IGJ5IG5vdywgd2lsbCBub3Qgb3ZlcndyaXRlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKGBJIGFtICR7dGhpcy5tZSEudXNlcm5hbWV9IWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsLiBEbyBub3QgY2FsbC4gSGFuZGxlcyBhbiB1cGRhdGUgYmF0Y2ggc2VxdWVudGlhbGx5IGJ5IHN1cHBseWluZ1xuICAgICAqIGl0IG9uZS1ieS1vbmUgdG8gdGhlIG1pZGRsZXdhcmUuIEhhbmRsZXMgbWlkZGxld2FyZSBlcnJvcnMgYW5kIHN0b3JlcyB0aGVcbiAgICAgKiBsYXN0IHVwZGF0ZSBpZGVudGlmaWVyIHRoYXQgd2FzIGJlaW5nIHRyaWVkIHRvIGhhbmRsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1cGRhdGVzIEFuIGFycmF5IG9mIHVwZGF0ZXMgdG8gaGFuZGxlXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVVcGRhdGVzKHVwZGF0ZXM6IFVwZGF0ZVtdKSB7XG4gICAgICAgIC8vIGhhbmRsZSB1cGRhdGVzIHNlcXVlbnRpYWxseSAoISlcbiAgICAgICAgZm9yIChjb25zdCB1cGRhdGUgb2YgdXBkYXRlcykge1xuICAgICAgICAgICAgdGhpcy5sYXN0VHJpZWRVcGRhdGVJZCA9IHVwZGF0ZS51cGRhdGVfaWQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlVXBkYXRlKHVwZGF0ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYWx3YXlzIGJlIHRydWVcbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgQm90RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lcnJvckhhbmRsZXIoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFUQUw6IGdyYW1tWSB1bmFibGUgdG8gaGFuZGxlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBhbiBpbnRlcm5hbCBtZXRob2QgdGhhdCB5b3UgcHJvYmFibHkgd2lsbCBub3QgZXZlciBuZWVkIHRvIGNhbGwuXG4gICAgICogSXQgaXMgdXNlZCB3aGVuZXZlciBhIG5ldyB1cGRhdGUgYXJyaXZlcyBmcm9tIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIHRoYXRcbiAgICAgKiB5b3VyIGJvdCB3aWxsIGhhbmRsZS5cbiAgICAgKlxuICAgICAqIElmIHlvdSdyZSB3cml0aW5nIGEgbGlicmFyeSBvbiB0b3Agb2YgZ3JhbW1ZLCBjaGVjayBvdXQgdGhlXG4gICAgICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3J1bm5lcikgb2YgdGhlIHJ1bm5lclxuICAgICAqIHBsdWdpbiBmb3IgYW4gZXhhbXBsZSB0aGF0IHVzZXMgdGhpcyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXBkYXRlIEFuIHVwZGF0ZSBmcm9tIHRoZSBUZWxlZ3JhbSBCb3QgQVBJXG4gICAgICogQHBhcmFtIHdlYmhvb2tSZXBseUVudmVsb3BlIEFuIG9wdGlvbmFsIHdlYmhvb2sgcmVwbHkgZW52ZWxvcGVcbiAgICAgKi9cbiAgICBhc3luYyBoYW5kbGVVcGRhdGUoXG4gICAgICAgIHVwZGF0ZTogVXBkYXRlLFxuICAgICAgICB3ZWJob29rUmVwbHlFbnZlbG9wZT86IFdlYmhvb2tSZXBseUVudmVsb3BlLFxuICAgICkge1xuICAgICAgICBpZiAodGhpcy5tZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJCb3Qgbm90IGluaXRpYWxpemVkISBFaXRoZXIgY2FsbCBgYXdhaXQgYm90LmluaXQoKWAsIFxcXG5vciBkaXJlY3RseSBzZXQgdGhlIGBib3RJbmZvYCBvcHRpb24gaW4gdGhlIGBCb3RgIGNvbnN0cnVjdG9yIHRvIHNwZWNpZnkgXFxcbmEga25vd24gYm90IGluZm8gb2JqZWN0LlwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBkZWJ1ZyhgUHJvY2Vzc2luZyB1cGRhdGUgJHt1cGRhdGUudXBkYXRlX2lkfWApO1xuICAgICAgICAvLyBjcmVhdGUgQVBJIG9iamVjdFxuICAgICAgICBjb25zdCBhcGkgPSBuZXcgQXBpKFxuICAgICAgICAgICAgdGhpcy50b2tlbixcbiAgICAgICAgICAgIHRoaXMuY2xpZW50Q29uZmlnLFxuICAgICAgICAgICAgd2ViaG9va1JlcGx5RW52ZWxvcGUsXG4gICAgICAgICk7XG4gICAgICAgIC8vIGNvbmZpZ3VyZSBpdCB3aXRoIHRoZSBzYW1lIHRyYW5zZm9ybWVycyBhcyBib3QuYXBpXG4gICAgICAgIGNvbnN0IHQgPSB0aGlzLmFwaS5jb25maWcuaW5zdGFsbGVkVHJhbnNmb3JtZXJzKCk7XG4gICAgICAgIGlmICh0Lmxlbmd0aCA+IDApIGFwaS5jb25maWcudXNlKC4uLnQpO1xuICAgICAgICAvLyBjcmVhdGUgY29udGV4dCBvYmplY3RcbiAgICAgICAgY29uc3QgY3R4ID0gbmV3IHRoaXMuQ29udGV4dENvbnN0cnVjdG9yKHVwZGF0ZSwgYXBpLCB0aGlzLm1lKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIHJ1biBtaWRkbGV3YXJlIHN0YWNrXG4gICAgICAgICAgICBhd2FpdCBydW4odGhpcy5taWRkbGV3YXJlKCksIGN0eCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZGVidWdFcnIoYEVycm9yIGluIG1pZGRsZXdhcmUgZm9yIHVwZGF0ZSAke3VwZGF0ZS51cGRhdGVfaWR9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQm90RXJyb3I8Qz4oZXJyLCBjdHgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RhcnRzIHlvdXIgYm90IHVzaW5nIGxvbmcgcG9sbGluZy5cbiAgICAgKlxuICAgICAqID4gVGhpcyBtZXRob2QgcmV0dXJucyBhIGBQcm9taXNlYCB0aGF0IHdpbGwgbmV2ZXIgcmVzb2x2ZSBleGNlcHQgaWYgeW91clxuICAgICAqID4gYm90IGlzIHN0b3BwZWQuICoqWW91IGRvbid0IG5lZWQgdG8gYGF3YWl0YCB0aGUgY2FsbCB0byBgYm90LnN0YXJ0YCoqLFxuICAgICAqID4gYnV0IHJlbWVtYmVyIHRvIGNhdGNoIHBvdGVudGlhbCBlcnJvcnMgYnkgY2FsbGluZyBgYm90LmNhdGNoYC5cbiAgICAgKiA+IE90aGVyd2lzZSB5b3VyIGJvdCB3aWxsIGNyYXNoIChhbmQgc3RvcCkgaWYgc29tZXRoaW5nIGdvZXMgd3JvbmcgaW5cbiAgICAgKiA+IHlvdXIgY29kZS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGVmZmVjdGl2ZWx5IGVudGVycyBhIGxvb3AgdGhhdCB3aWxsIHJlcGVhdGVkbHkgY2FsbFxuICAgICAqIGBnZXRVcGRhdGVzYCBhbmQgcnVuIHlvdXIgbWlkZGxld2FyZSBmb3IgZXZlcnkgcmVjZWl2ZWQgdXBkYXRlLCBhbGxvd2luZ1xuICAgICAqIHlvdXIgYm90IHRvIHJlc3BvbmQgdG8gbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBJZiB5b3VyIGJvdCBpcyBhbHJlYWR5IHJ1bm5pbmcsIHRoaXMgbWV0aG9kIGRvZXMgbm90aGluZy5cbiAgICAgKlxuICAgICAqICoqTm90ZSB0aGF0IHRoaXMgc3RhcnRzIHlvdXIgYm90IHVzaW5nIGEgdmVyeSBzaW1wbGUgbG9uZyBwb2xsaW5nXG4gICAgICogaW1wbGVtZW50YXRpb24uKiogYGJvdC5zdGFydGAgc2hvdWxkIG9ubHkgYmUgdXNlZCBmb3Igc21hbGwgYm90cy4gV2hpbGVcbiAgICAgKiB0aGUgcmVzdCBvZiBncmFtbVkgd2FzIGJ1aWx0IHRvIHBlcmZvcm0gd2VsbCBldmVuIHVuZGVyIGV4dHJlbWUgbG9hZHMsXG4gICAgICogc2ltcGxlIGxvbmcgcG9sbGluZyBpcyBub3QgY2FwYWJsZSBvZiBzY2FsaW5nIHVwIGluIGEgc2ltaWxhciBmYXNoaW9uLlxuICAgICAqIFlvdSBzaG91bGQgc3dpdGNoIG92ZXIgdG8gdXNpbmcgYEBncmFtbXlqcy9ydW5uZXJgIGlmIHlvdSBhcmUgcnVubmluZyBhXG4gICAgICogYm90IHdpdGggaGlnaCBsb2FkLlxuICAgICAqXG4gICAgICogV2hhdCBleGFjdGx5IF9oaWdoIGxvYWRfIG1lYW5zIGRpZmZlcnMgZnJvbSBib3QgdG8gYm90LCBidXQgYXMgYSBydWxlIG9mXG4gICAgICogdGh1bWIsIHNpbXBsZSBsb25nIHBvbGxpbmcgc2hvdWxkIG5vdCBiZSBwcm9jZXNzaW5nIG1vcmUgdGhhbiB+NUtcbiAgICAgKiBtZXNzYWdlcyBldmVyeSBob3VyLiBBbHNvLCBpZiB5b3VyIGJvdCBoYXMgbG9uZy1ydW5uaW5nIG9wZXJhdGlvbnMgc3VjaFxuICAgICAqIGFzIGxhcmdlIGZpbGUgdHJhbnNmZXJzIHRoYXQgYmxvY2sgdGhlIG1pZGRsZXdhcmUgZnJvbSBjb21wbGV0aW5nLCB0aGlzXG4gICAgICogd2lsbCBpbXBhY3QgdGhlIHJlc3BvbnNpdmVuZXNzIG5lZ2F0aXZlbHksIHNvIGl0IG1ha2VzIHNlbnNlIHRvIHVzZSB0aGVcbiAgICAgKiBgQGdyYW1teWpzL3J1bm5lcmAgcGFja2FnZSBldmVuIGlmIHlvdSByZWNlaXZlIG11Y2ggZmV3ZXIgbWVzc2FnZXMuIElmXG4gICAgICogeW91IHdvcnJ5IGFib3V0IGhvdyBtdWNoIGxvYWQgeW91ciBib3QgY2FuIGhhbmRsZSwgY2hlY2sgb3V0IHRoZSBncmFtbVlcbiAgICAgKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2FkdmFuY2VkL3NjYWxpbmcpIGFib3V0IHNjYWxpbmdcbiAgICAgKiB1cC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgdG8gdXNlIGZvciBzaW1wbGUgbG9uZyBwb2xsaW5nXG4gICAgICovXG4gICAgYXN5bmMgc3RhcnQob3B0aW9ucz86IFBvbGxpbmdPcHRpb25zKSB7XG4gICAgICAgIC8vIFBlcmZvcm0gc2V0dXBcbiAgICAgICAgY29uc3Qgc2V0dXA6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuICAgICAgICBpZiAoIXRoaXMuaXNJbml0ZWQoKSkge1xuICAgICAgICAgICAgc2V0dXAucHVzaCh0aGlzLmluaXQodGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyPy5zaWduYWwpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5wb2xsaW5nUnVubmluZykge1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoc2V0dXApO1xuICAgICAgICAgICAgZGVidWcoXCJTaW1wbGUgbG9uZyBwb2xsaW5nIGFscmVhZHkgcnVubmluZyFcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBvbGxpbmdSdW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2V0dXAucHVzaCh3aXRoUmV0cmllcyhhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcGkuZGVsZXRlV2ViaG9vayh7XG4gICAgICAgICAgICAgICAgICAgIGRyb3BfcGVuZGluZ191cGRhdGVzOiBvcHRpb25zPy5kcm9wX3BlbmRpbmdfdXBkYXRlcyxcbiAgICAgICAgICAgICAgICB9LCB0aGlzLnBvbGxpbmdBYm9ydENvbnRyb2xsZXI/LnNpZ25hbCk7XG4gICAgICAgICAgICB9LCB0aGlzLnBvbGxpbmdBYm9ydENvbnRyb2xsZXI/LnNpZ25hbCkpO1xuICAgICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoc2V0dXApO1xuXG4gICAgICAgICAgICAvLyBBbGwgYXN5bmMgb3BzIG9mIHNldHVwIGNvbXBsZXRlLCBydW4gY2FsbGJhY2tcbiAgICAgICAgICAgIGF3YWl0IG9wdGlvbnM/Lm9uU3RhcnQ/Lih0aGlzLmJvdEluZm8pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRoaXMucG9sbGluZ1J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJvdCB3YXMgc3RvcHBlZCBkdXJpbmcgYG9uU3RhcnRgXG4gICAgICAgIGlmICghdGhpcy5wb2xsaW5nUnVubmluZykgcmV0dXJuO1xuXG4gICAgICAgIC8vIFByZXZlbnQgY29tbW9uIG1pc3VzZSB0aGF0IGxlYWRzIHRvIG1pc3NpbmcgdXBkYXRlc1xuICAgICAgICB2YWxpZGF0ZUFsbG93ZWRVcGRhdGVzKFxuICAgICAgICAgICAgdGhpcy5vYnNlcnZlZFVwZGF0ZVR5cGVzLFxuICAgICAgICAgICAgb3B0aW9ucz8uYWxsb3dlZF91cGRhdGVzLFxuICAgICAgICApO1xuICAgICAgICAvLyBQcmV2ZW50IGNvbW1vbiBtaXN1c2UgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtcbiAgICAgICAgdGhpcy51c2UgPSBub1VzZUZ1bmN0aW9uO1xuXG4gICAgICAgIC8vIFN0YXJ0IHBvbGxpbmdcbiAgICAgICAgZGVidWcoXCJTdGFydGluZyBzaW1wbGUgbG9uZyBwb2xsaW5nXCIpO1xuICAgICAgICBhd2FpdCB0aGlzLmxvb3Aob3B0aW9ucyk7XG4gICAgICAgIGRlYnVnKFwiTWlkZGxld2FyZSBpcyBkb25lIHJ1bm5pbmdcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3RvcHMgdGhlIGJvdCBmcm9tIGxvbmcgcG9sbGluZy5cbiAgICAgKlxuICAgICAqIEFsbCBtaWRkbGV3YXJlIHRoYXQgaXMgY3VycmVudGx5IGJlaW5nIGV4ZWN1dGVkIG1heSBjb21wbGV0ZSwgYnV0IG5vXG4gICAgICogZnVydGhlciBgZ2V0VXBkYXRlc2AgY2FsbHMgd2lsbCBiZSBwZXJmb3JtZWQuIFRoZSBjdXJyZW50IGBnZXRVcGRhdGVzYFxuICAgICAqIHJlcXVlc3Qgd2lsbCBiZSBjYW5jZWxsZWQuXG4gICAgICpcbiAgICAgKiBJbiBhZGRpdGlvbiwgdGhpcyBtZXRob2Qgd2lsbCBfY29uZmlybV8gdGhlIGxhc3QgcmVjZWl2ZWQgdXBkYXRlIHRvIHRoZVxuICAgICAqIFRlbGVncmFtIHNlcnZlcnMgYnkgY2FsbGluZyBgZ2V0VXBkYXRlc2Agb25lIGxhc3QgdGltZSB3aXRoIHRoZSBsYXRlc3RcbiAgICAgKiBvZmZzZXQgdmFsdWUuIElmIGFueSB1cGRhdGVzIGFyZSByZWNlaXZlZCBpbiB0aGlzIGNhbGwsIHRoZXkgYXJlXG4gICAgICogZGlzY2FyZGVkIGFuZCB3aWxsIGJlIGZldGNoZWQgYWdhaW4gd2hlbiB0aGUgYm90IHN0YXJ0cyB1cCB0aGUgbmV4dCB0aW1lLlxuICAgICAqIENvbmZlciB0aGUgb2ZmaWNpYWwgZG9jdW1lbnRhdGlvbiBvbiBjb25maXJtaW5nIHVwZGF0ZXMgaWYgeW91IHdhbnQgdG9cbiAgICAgKiBrbm93IG1vcmU6IGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0dXBkYXRlc1xuICAgICAqXG4gICAgICogPiBOb3RlIHRoYXQgdGhpcyBtZXRob2Qgd2lsbCBub3Qgd2FpdCBmb3IgdGhlIG1pZGRsZXdhcmUgc3RhY2sgdG8gZmluaXNoLlxuICAgICAqID4gSWYgeW91IG5lZWQgdG8gcnVuIGNvZGUgYWZ0ZXIgYWxsIG1pZGRsZXdhcmUgaXMgZG9uZSwgY29uc2lkZXIgd2FpdGluZ1xuICAgICAqID4gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IGBib3Quc3RhcnQoKWAgdG8gcmVzb2x2ZS5cbiAgICAgKi9cbiAgICBhc3luYyBzdG9wKCkge1xuICAgICAgICBpZiAodGhpcy5wb2xsaW5nUnVubmluZykge1xuICAgICAgICAgICAgZGVidWcoXCJTdG9wcGluZyBib3QsIHNhdmluZyB1cGRhdGUgb2Zmc2V0XCIpO1xuICAgICAgICAgICAgdGhpcy5wb2xsaW5nUnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyPy5hYm9ydCgpO1xuICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5sYXN0VHJpZWRVcGRhdGVJZCArIDE7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwaS5nZXRVcGRhdGVzKHsgb2Zmc2V0LCBsaW1pdDogMSB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlciA9IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIkJvdCBpcyBub3QgcnVubmluZyFcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIHRoZSBib3RzIGVycm9yIGhhbmRsZXIgdGhhdCBpcyB1c2VkIGR1cmluZyBsb25nIHBvbGxpbmcuXG4gICAgICpcbiAgICAgKiBZb3Ugc2hvdWxkIGNhbGwgdGhpcyBtZXRob2QgdG8gc2V0IGFuIGVycm9yIGhhbmRsZXIgaWYgeW91IGFyZSB1c2luZyBsb25nXG4gICAgICogcG9sbGluZywgbm8gbWF0dGVyIHdoZXRoZXIgeW91IHVzZSBgYm90LnN0YXJ0YCBvciB0aGUgYEBncmFtbXlqcy9ydW5uZXJgXG4gICAgICogcGFja2FnZSB0byBydW4geW91ciBib3QuXG4gICAgICpcbiAgICAgKiBDYWxsaW5nIGBib3QuY2F0Y2hgIHdoZW4gdXNpbmcgb3RoZXIgbWVhbnMgb2YgcnVubmluZyB5b3VyIGJvdCAob3JcbiAgICAgKiB3ZWJob29rcykgaGFzIG5vIGVmZmVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvckhhbmRsZXIgQSBmdW5jdGlvbiB0aGF0IGhhbmRsZXMgcG90ZW50aWFsIG1pZGRsZXdhcmUgZXJyb3JzXG4gICAgICovXG4gICAgY2F0Y2goZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXI8Qz4pIHtcbiAgICAgICAgdGhpcy5lcnJvckhhbmRsZXIgPSBlcnJvckhhbmRsZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwuIERvIG5vdCBjYWxsLiBFbnRlcnMgYSBsb29wIHRoYXQgd2lsbCBwZXJmb3JtIGxvbmcgcG9sbGluZyB1bnRpbFxuICAgICAqIHRoZSBib3QgaXMgc3RvcHBlZC5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGxvb3Aob3B0aW9ucz86IFBvbGxpbmdPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IGxpbWl0ID0gb3B0aW9ucz8ubGltaXQ7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBvcHRpb25zPy50aW1lb3V0ID8/IDMwOyAvLyBzZWNvbmRzXG4gICAgICAgIGxldCBhbGxvd2VkX3VwZGF0ZXM6IFBvbGxpbmdPcHRpb25zW1wiYWxsb3dlZF91cGRhdGVzXCJdID1cbiAgICAgICAgICAgIG9wdGlvbnM/LmFsbG93ZWRfdXBkYXRlcyA/PyBbXTsgLy8gcmVzZXQgdG8gZGVmYXVsdCBpZiB1bnNwZWNpZmllZFxuXG4gICAgICAgIHdoaWxlICh0aGlzLnBvbGxpbmdSdW5uaW5nKSB7XG4gICAgICAgICAgICAvLyBmZXRjaCB1cGRhdGVzXG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gYXdhaXQgdGhpcy5mZXRjaFVwZGF0ZXMoXG4gICAgICAgICAgICAgICAgeyBsaW1pdCwgdGltZW91dCwgYWxsb3dlZF91cGRhdGVzIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gY2hlY2sgaWYgcG9sbGluZyBzdG9wcGVkXG4gICAgICAgICAgICBpZiAodXBkYXRlcyA9PT0gdW5kZWZpbmVkKSBicmVhaztcbiAgICAgICAgICAgIC8vIGhhbmRsZSB1cGRhdGVzXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZVVwZGF0ZXModXBkYXRlcyk7XG4gICAgICAgICAgICAvLyBUZWxlZ3JhbSB1c2VzIHRoZSBsYXN0IHNldHRpbmcgaWYgYGFsbG93ZWRfdXBkYXRlc2AgaXMgb21pdHRlZCBzb1xuICAgICAgICAgICAgLy8gd2UgY2FuIHNhdmUgc29tZSB0cmFmZmljIGJ5IG9ubHkgc2VuZGluZyBpdCBpbiB0aGUgZmlyc3QgcmVxdWVzdFxuICAgICAgICAgICAgYWxsb3dlZF91cGRhdGVzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwuIERvIG5vdCBjYWxsLiBSZWxpYWJseSBmZXRjaGVzIGFuIHVwZGF0ZSBiYXRjaCB2aWEgYGdldFVwZGF0ZXNgLlxuICAgICAqIEhhbmRsZXMgYWxsIGtub3duIGVycm9ycy4gUmV0dXJucyBgdW5kZWZpbmVkYCBpZiB0aGUgYm90IGlzIHN0b3BwZWQgYW5kXG4gICAgICogdGhlIGNhbGwgZ2V0cyBjYW5jZWxsZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBQb2xsaW5nIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB1cGRhdGVzLCBvciBgdW5kZWZpbmVkYCBpZiB0aGUgYm90IGlzIHN0b3BwZWQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBmZXRjaFVwZGF0ZXMoXG4gICAgICAgIHsgbGltaXQsIHRpbWVvdXQsIGFsbG93ZWRfdXBkYXRlcyB9OiBQb2xsaW5nT3B0aW9ucyxcbiAgICApIHtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5sYXN0VHJpZWRVcGRhdGVJZCArIDE7XG4gICAgICAgIGxldCB1cGRhdGVzOiBVcGRhdGVbXSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB1cGRhdGVzID0gYXdhaXQgdGhpcy5hcGkuZ2V0VXBkYXRlcyhcbiAgICAgICAgICAgICAgICAgICAgeyBvZmZzZXQsIGxpbWl0LCB0aW1lb3V0LCBhbGxvd2VkX3VwZGF0ZXMgfSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyPy5zaWduYWwsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5oYW5kbGVQb2xsaW5nRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IHdoaWxlICh1cGRhdGVzID09PSB1bmRlZmluZWQgJiYgdGhpcy5wb2xsaW5nUnVubmluZyk7XG4gICAgICAgIHJldHVybiB1cGRhdGVzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsLiBEbyBub3QgY2FsbC4gSGFuZGxlcyBhbiBlcnJvciB0aGF0IG9jY3VycmVkIGR1cmluZyBsb25nXG4gICAgICogcG9sbGluZy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIGhhbmRsZVBvbGxpbmdFcnJvcihlcnJvcjogdW5rbm93bikge1xuICAgICAgICBpZiAoIXRoaXMucG9sbGluZ1J1bm5pbmcpIHtcbiAgICAgICAgICAgIGRlYnVnKFwiUGVuZGluZyBnZXRVcGRhdGVzIHJlcXVlc3QgY2FuY2VsbGVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzbGVlcFNlY29uZHMgPSAzO1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBHcmFtbXlFcnJvcikge1xuICAgICAgICAgICAgZGVidWdFcnIoZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAvLyByZXRocm93IHVwb24gdW5hdXRob3JpemVkIG9yIGNvbmZsaWN0XG4gICAgICAgICAgICBpZiAoZXJyb3IuZXJyb3JfY29kZSA9PT0gNDAxIHx8IGVycm9yLmVycm9yX2NvZGUgPT09IDQwOSkge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5lcnJvcl9jb2RlID09PSA0MjkpIHtcbiAgICAgICAgICAgICAgICBkZWJ1Z0VycihcIkJvdCBBUEkgc2VydmVyIGlzIGNsb3NpbmcuXCIpO1xuICAgICAgICAgICAgICAgIHNsZWVwU2Vjb25kcyA9IGVycm9yLnBhcmFtZXRlcnMucmV0cnlfYWZ0ZXIgPz8gc2xlZXBTZWNvbmRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgZGVidWdFcnIoZXJyb3IpO1xuICAgICAgICBkZWJ1Z0VycihcbiAgICAgICAgICAgIGBDYWxsIHRvIGdldFVwZGF0ZXMgZmFpbGVkLCByZXRyeWluZyBpbiAke3NsZWVwU2Vjb25kc30gc2Vjb25kcyAuLi5gLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBzbGVlcChzbGVlcFNlY29uZHMpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBhIG5ldHdvcmsgY2FsbCB0YXNrLCByZXRyeWluZyB1cG9uIGtub3duIGVycm9ycyB1bnRpbCBzdWNjZXNzLlxuICpcbiAqIElmIHRoZSB0YXNrIGVycm9ycyBhbmQgYSByZXRyeV9hZnRlciB2YWx1ZSBjYW4gYmUgdXNlZCwgYSBzdWJzZXF1ZW50IHJldHJ5XG4gKiB3aWxsIGJlIGRlbGF5ZWQgYnkgdGhlIHNwZWNpZmllZCBwZXJpb2Qgb2YgdGltZS5cbiAqXG4gKiBPdGhlcndpc2UsIGlmIHRoZSBmaXJzdCBhdHRlbXB0IGF0IHJ1bm5pbmcgdGhlIHRhc2sgZmFpbHMsIHRoZSB0YXNrIGlzXG4gKiByZXRyaWVkIGltbWVkaWF0ZWx5LiBJZiBzZWNvbmQgYXR0ZW1wdCBmYWlscywgdG9vLCB3YWl0cyBmb3IgMTAwIG1zLCBhbmQgdGhlblxuICogZG91YmxlcyB0aGlzIGRlbGF5IGZvciBldmVyeSBzdWJzZXF1ZW50IGF0dGVtdC4gTmV2ZXIgd2FpdHMgbG9uZ2VyIHRoYW4gMVxuICogaG91ciBiZWZvcmUgcmV0cnlpbmcuXG4gKlxuICogQHBhcmFtIHRhc2sgQXN5bmMgdGFzayB0byBwZXJmb3JtXG4gKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gcHJldmVudCBmdXJ0aGVyIHJldHJpZXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gd2l0aFJldHJpZXM8VD4oXG4gICAgdGFzazogKCkgPT4gUHJvbWlzZTxUPixcbiAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbik6IFByb21pc2U8VD4ge1xuICAgIC8vIFNldCB1cCBkZWxheXMgYmV0d2VlbiByZXRyaWVzXG4gICAgY29uc3QgSU5JVElBTF9ERUxBWSA9IDUwOyAvLyBtc1xuICAgIGxldCBsYXN0RGVsYXkgPSBJTklUSUFMX0RFTEFZO1xuXG4gICAgLy8gRGVmaW5lIGVycm9yIGhhbmRsZXJcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHRoZSBlcnJvciBoYW5kbGluZyBzdHJhdGVneSBiYXNlZCBvbiB2YXJpb3VzIGVycm9yIHR5cGVzLlxuICAgICAqIFNsZWVwcyBpZiBuZWNlc3NhcnksIGFuZCByZXR1cm5zIHdoZXRoZXIgdG8gcmV0cnkgb3IgcmV0aHJvdyBhbiBlcnJvci5cbiAgICAgKi9cbiAgICBhc3luYyBmdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvcjogdW5rbm93bikge1xuICAgICAgICBsZXQgZGVsYXkgPSBmYWxzZTtcbiAgICAgICAgbGV0IHN0cmF0ZWd5OiBcInJldHJ5XCIgfCBcInJldGhyb3dcIiA9IFwicmV0aHJvd1wiO1xuXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEh0dHBFcnJvcikge1xuICAgICAgICAgICAgZGVsYXkgPSB0cnVlO1xuICAgICAgICAgICAgc3RyYXRlZ3kgPSBcInJldHJ5XCI7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IgaW5zdGFuY2VvZiBHcmFtbXlFcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yLmVycm9yX2NvZGUgPj0gNTAwKSB7XG4gICAgICAgICAgICAgICAgZGVsYXkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHN0cmF0ZWd5ID0gXCJyZXRyeVwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvci5lcnJvcl9jb2RlID09PSA0MjkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXRyeUFmdGVyID0gZXJyb3IucGFyYW1ldGVycy5yZXRyeV9hZnRlcjtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJldHJ5QWZ0ZXIgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWdub3JlIHRoZSBiYWNrb2ZmIGZvciBzbGVlcCwgdGhlbiByZXNldCBpdFxuICAgICAgICAgICAgICAgICAgICBhd2FpdCBzbGVlcChyZXRyeUFmdGVyLCBzaWduYWwpO1xuICAgICAgICAgICAgICAgICAgICBsYXN0RGVsYXkgPSBJTklUSUFMX0RFTEFZO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RyYXRlZ3kgPSBcInJldHJ5XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVsYXkpIHtcbiAgICAgICAgICAgIC8vIERvIG5vdCBzbGVlcCBmb3IgdGhlIGZpcnN0IHJldHJ5XG4gICAgICAgICAgICBpZiAobGFzdERlbGF5ICE9PSBJTklUSUFMX0RFTEFZKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2xlZXAobGFzdERlbGF5LCBzaWduYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgVFdFTlRZX01JTlVURVMgPSAyMCAqIDYwICogMTAwMDsgLy8gbXNcbiAgICAgICAgICAgIGxhc3REZWxheSA9IE1hdGgubWluKFRXRU5UWV9NSU5VVEVTLCAyICogbGFzdERlbGF5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdHJhdGVneTtcbiAgICB9XG5cbiAgICAvLyBQZXJmb3JtIHRoZSBhY3R1YWwgdGFzayB3aXRoIHJldHJpZXNcbiAgICBsZXQgcmVzdWx0OiB7IG9rOiBmYWxzZSB9IHwgeyBvazogdHJ1ZTsgdmFsdWU6IFQgfSA9IHsgb2s6IGZhbHNlIH07XG4gICAgd2hpbGUgKCFyZXN1bHQub2spIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHsgb2s6IHRydWUsIHZhbHVlOiBhd2FpdCB0YXNrKCkgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGRlYnVnRXJyKGVycm9yKTtcbiAgICAgICAgICAgIGNvbnN0IHN0cmF0ZWd5ID0gYXdhaXQgaGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgc3dpdGNoIChzdHJhdGVneSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJyZXRyeVwiOlxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjYXNlIFwicmV0aHJvd1wiOlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0LnZhbHVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgcHJvbWlzZSB0aGF0IHJlc29sdmVzIGFmdGVyIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIHNlY29uZHMsIG9yXG4gKiByZWplY3RzIGFzIHNvb24gYXMgdGhlIGdpdmVuIHNpZ25hbCBpcyBhYm9ydGVkLlxuICovXG5hc3luYyBmdW5jdGlvbiBzbGVlcChzZWNvbmRzOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgbGV0IGhhbmRsZTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGxldCByZWplY3Q6ICgoZXJyOiBFcnJvcikgPT4gdm9pZCkgfCB1bmRlZmluZWQ7XG4gICAgZnVuY3Rpb24gYWJvcnQoKSB7XG4gICAgICAgIHJlamVjdD8uKG5ldyBFcnJvcihcIkFib3J0ZWQgZGVsYXlcIikpO1xuICAgICAgICBpZiAoaGFuZGxlICE9PSB1bmRlZmluZWQpIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgIHJlamVjdCA9IHJlajtcbiAgICAgICAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICAgICAgICBhYm9ydCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNpZ25hbD8uYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0KTtcbiAgICAgICAgICAgIGhhbmRsZSA9IHNldFRpbWVvdXQocmVzLCAxMDAwICogc2Vjb25kcyk7XG4gICAgICAgIH0pO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIHNpZ25hbD8ucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGFib3J0KTtcbiAgICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBzZXQgb2Ygb2JzZXJ2ZWQgdXBkYXRlIHR5cGVzIGFuZCBhIGxpc3Qgb2YgYWxsb3dlZCB1cGRhdGVzIGFuZCBsb2dzIGFcbiAqIHdhcm5pbmcgaW4gZGVidWcgbW9kZSBpZiBzb21lIHVwZGF0ZSB0eXBlcyB3ZXJlIG9ic2VydmVkIHRoYXQgaGF2ZSBub3QgYmVlblxuICogYWxsb3dlZC5cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVBbGxvd2VkVXBkYXRlcyhcbiAgICB1cGRhdGVzOiBTZXQ8c3RyaW5nPixcbiAgICBhbGxvd2VkOiByZWFkb25seSBzdHJpbmdbXSA9IERFRkFVTFRfVVBEQVRFX1RZUEVTLFxuKSB7XG4gICAgY29uc3QgaW1wb3NzaWJsZSA9IEFycmF5LmZyb20odXBkYXRlcykuZmlsdGVyKCh1KSA9PiAhYWxsb3dlZC5pbmNsdWRlcyh1KSk7XG4gICAgaWYgKGltcG9zc2libGUubGVuZ3RoID4gMCkge1xuICAgICAgICBkZWJ1Z1dhcm4oXG4gICAgICAgICAgICBgWW91IHJlZ2lzdGVyZWQgbGlzdGVuZXJzIGZvciB0aGUgZm9sbG93aW5nIHVwZGF0ZSB0eXBlcywgXFxcbmJ1dCB5b3UgZGlkIG5vdCBzcGVjaWZ5IHRoZW0gaW4gXFxgYWxsb3dlZF91cGRhdGVzXFxgIFxcXG5zbyB0aGV5IG1heSBub3QgYmUgcmVjZWl2ZWQ6ICR7aW1wb3NzaWJsZS5tYXAoKHUpID0+IGAnJHt1fSdgKS5qb2luKFwiLCBcIil9YCxcbiAgICAgICAgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBub1VzZUZ1bmN0aW9uKCk6IG5ldmVyIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEl0IGxvb2tzIGxpa2UgeW91IGFyZSByZWdpc3RlcmluZyBtb3JlIGxpc3RlbmVycyBcXFxub24geW91ciBib3QgZnJvbSB3aXRoaW4gb3RoZXIgbGlzdGVuZXJzISBUaGlzIG1lYW5zIHRoYXQgZXZlcnkgdGltZSB5b3VyIGJvdCBcXFxuaGFuZGxlcyBhIG1lc3NhZ2UgbGlrZSB0aGlzIG9uZSwgbmV3IGxpc3RlbmVycyB3aWxsIGJlIGFkZGVkLiBUaGlzIGxpc3QgZ3Jvd3MgdW50aWwgXFxcbnlvdXIgbWFjaGluZSBjcmFzaGVzLCBzbyBncmFtbVkgdGhyb3dzIHRoaXMgZXJyb3IgdG8gdGVsbCB5b3UgdGhhdCB5b3Ugc2hvdWxkIFxcXG5wcm9iYWJseSBkbyB0aGluZ3MgYSBiaXQgZGlmZmVyZW50bHkuIElmIHlvdSdyZSB1bnN1cmUgaG93IHRvIHJlc29sdmUgdGhpcyBwcm9ibGVtLCBcXFxueW91IGNhbiBhc2sgaW4gdGhlIGdyb3VwIGNoYXQ6IGh0dHBzOi8vdGVsZWdyYW0ubWUvZ3JhbW15anNcblxuT24gdGhlIG90aGVyIGhhbmQsIGlmIHlvdSBhY3R1YWxseSBrbm93IHdoYXQgeW91J3JlIGRvaW5nIGFuZCB5b3UgZG8gbmVlZCB0byBpbnN0YWxsIFxcXG5mdXJ0aGVyIG1pZGRsZXdhcmUgd2hpbGUgeW91ciBib3QgaXMgcnVubmluZywgY29uc2lkZXIgaW5zdGFsbGluZyBhIGNvbXBvc2VyIFxcXG5pbnN0YW5jZSBvbiB5b3VyIGJvdCwgYW5kIGluIHR1cm4gYXVnbWVudCB0aGUgY29tcG9zZXIgYWZ0ZXIgdGhlIGZhY3QuIFRoaXMgd2F5LCBcXFxueW91IGNhbiBjaXJjdW12ZW50IHRoaXMgcHJvdGVjdGlvbiBhZ2FpbnN0IG1lbW9yeSBsZWFrcy5gKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxrQ0FBa0M7QUFDbEMsU0FDSSxRQUFRLEVBQ1IsUUFBUSxFQUdSLEdBQUcsUUFDQSxnQkFBZ0I7QUFDdkIsU0FBUyxPQUFPLFFBQStDLGVBQWU7QUFDOUUsU0FBUyxHQUFHLFFBQVEsZ0JBQWdCO0FBS3BDLFNBQVMsV0FBVyxFQUFFLFNBQVMsUUFBUSxrQkFBa0I7QUFDekQsU0FBd0MsS0FBSyxFQUFFLFVBQVUsUUFBUSxjQUFjO0FBQy9FLFNBQVMsU0FBUyxDQUFDLFFBQVEscUJBQXFCO0FBT2hELE1BQU0sUUFBUSxFQUFFO0FBQ2hCLE1BQU0sWUFB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