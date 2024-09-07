import { Context } from "./context.ts";
// === Middleware errors
/**
 * This error is thrown when middleware throws. It simply wraps the original
 * error (accessible via the `error` property), but also provides access to the
 * respective context object that was processed while the error occurred.
 */ export class BotError extends Error {
  error;
  ctx;
  constructor(error, ctx){
    super(generateBotErrorMessage(error));
    this.error = error;
    this.ctx = ctx;
    this.name = "BotError";
    if (error instanceof Error) this.stack = error.stack;
  }
}
function generateBotErrorMessage(error) {
  let msg;
  if (error instanceof Error) {
    msg = `${error.name} in middleware: ${error.message}`;
  } else {
    const type = typeof error;
    msg = `Non-error value of type ${type} thrown in middleware`;
    switch(type){
      case "bigint":
      case "boolean":
      case "number":
      case "symbol":
        msg += `: ${error}`;
        break;
      case "string":
        msg += `: ${String(error).substring(0, 50)}`;
        break;
      default:
        msg += "!";
        break;
    }
  }
  return msg;
}
// === Middleware base functions
function flatten(mw) {
  return typeof mw === "function" ? mw : (ctx, next)=>mw.middleware()(ctx, next);
}
function concat(first, andThen) {
  return async (ctx, next)=>{
    let nextCalled = false;
    await first(ctx, async ()=>{
      if (nextCalled) throw new Error("`next` already called before!");
      else nextCalled = true;
      await andThen(ctx, next);
    });
  };
}
function pass(_ctx, next) {
  return next();
}
const leaf = ()=>Promise.resolve();
/**
 * Runs some given middleware function with a given context object.
 *
 * @param middleware The middleware to run
 * @param ctx The context to use
 */ export async function run(middleware, ctx) {
  await middleware(ctx, leaf);
}
// === Composer
/**
 * The composer is the heart of the middleware system in grammY. It is also the
 * superclass of `Bot`. Whenever you call `use` or `on` or some of the other
 * methods on your bot, you are in fact using the underlying composer instance
 * to register your middleware.
 *
 * If you're just getting started, you do not need to worry about what
 * middleware is, or about how to use a composer.
 *
 * On the other hand, if you want to dig deeper into how grammY implements
 * middleware, check out the
 * [documentation](https://grammy.dev/advanced/middleware) on the website.
 */ export class Composer {
  handler;
  /**
     * Constructs a new composer based on the provided middleware. If no
     * middleware is given, the composer instance will simply make all context
     * objects pass through without touching them.
     *
     * @param middleware The middleware to compose
     */ constructor(...middleware){
    this.handler = middleware.length === 0 ? pass : middleware.map(flatten).reduce(concat);
  }
  middleware() {
    return this.handler;
  }
  /**
     * Registers some middleware that receives all updates. It is installed by
     * concatenating it to the end of all previously installed middleware.
     *
     * Often, this method is used to install middleware that behaves like a
     * plugin, for example session middleware.
     * ```ts
     * bot.use(session())
     * ```
     *
     * This method returns a new instance of composer. The returned instance can
     * be further extended, and all changes will be regarded here. Confer the
     * [documentation](https://grammy.dev/advanced/middleware) on the
     * website if you want to know more about how the middleware system in
     * grammY works, especially when it comes to chaining the method calls
     * (`use( ... ).use( ... ).use( ... )`).
     *
     * @param middleware The middleware to register
     */ use(...middleware) {
    const composer = new Composer(...middleware);
    this.handler = concat(this.handler, flatten(composer));
    return composer;
  }
  /**
     * Registers some middleware that will only be executed for some specific
     * updates, namely those matching the provided filter query. Filter queries
     * are a concise way to specify which updates you are interested in.
     *
     * Here are some examples of valid filter queries:
     * ```ts
     * // All kinds of message updates
     * bot.on('message', ctx => { ... })
     *
     * // Only text messages
     * bot.on('message:text', ctx => { ... })
     *
     * // Only text messages with URL
     * bot.on('message:entities:url', ctx => { ... })
     *
     * // Text messages and text channel posts
     * bot.on(':text', ctx => { ... })
     *
     * // Messages with URL in text or caption (i.e. entities or caption entities)
     * bot.on('message::url', ctx => { ... })
     *
     * // Messages or channel posts with URL in text or caption
     * bot.on('::url', ctx => { ... })
     * ```
     *
     * You can use autocomplete in VS Code to see all available filter queries.
     * Check out the
     * [documentation](https://grammy.dev/guide/filter-queries) on the
     * website to learn more about filter queries in grammY.
     *
     * It is possible to pass multiple filter queries in an array, i.e.
     * ```ts
     * // Matches all text messages and edited text messages that contain a URL
     * bot.on(['message:entities:url', 'edited_message:entities:url'], ctx => { ... })
     * ```
     *
     * Your middleware will be executed if _any of the provided filter queries_
     * matches (logical OR).
     *
     * If you instead want to match _all of the provided filter queries_
     * (logical AND), you can chain the `.on` calls:
     * ```ts
     * // Matches all messages and channel posts that both a) contain a URL and b) are forwards
     * bot.on('::url').on(':forward_origin', ctx => { ... })
     * ```
     *
     * @param filter The filter query to use, may also be an array of queries
     * @param middleware The middleware to register behind the given filter
     */ on(filter, ...middleware) {
    return this.filter(Context.has.filterQuery(filter), ...middleware);
  }
  /**
     * Registers some middleware that will only be executed when the message
     * contains some text. Is it possible to pass a regular expression to match:
     * ```ts
     * // Match some text (exact match)
     * bot.hears('I love grammY', ctx => ctx.reply('And grammY loves you! <3'))
     * // Match a regular expression
     * bot.hears(/\/echo (.+)/, ctx => ctx.reply(ctx.match[1]))
     * ```
     * Note how `ctx.match` will contain the result of the regular expression.
     * Here it is a `RegExpMatchArray` object, so `ctx.match[1]` refers to the
     * part of the regex that was matched by `(.+)`, i.e. the text that comes
     * after “/echo”.
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * Both text and captions of the received messages will be scanned. For
     * example, when a photo is sent to the chat and its caption matches the
     * trigger, your middleware will be executed.
     *
     * If you only want to match text messages and not captions, you can do
     * this:
     * ```ts
     * // Only matches text messages (and channel posts) for the regex
     * bot.on(':text').hears(/\/echo (.+)/, ctx => { ... })
     * ```
     *
     * @param trigger The text to look for
     * @param middleware The middleware to register
     */ hears(trigger, ...middleware) {
    return this.filter(Context.has.text(trigger), ...middleware);
  }
  /**
     * Registers some middleware that will only be executed when a certain
     * command is found.
     * ```ts
     * // Reacts to /start commands
     * bot.command('start', ctx => { ... })
     * // Reacts to /help commands
     * bot.command('help', ctx => { ... })
     * ```
     *
     * The rest of the message (excluding the command, and trimmed) is provided
     * via `ctx.match`.
     *
     * > **Did you know?** You can use deep linking
     * > (https://core.telegram.org/bots/features#deep-linking) to let users
     * > start your bot with a custom payload. As an example, send someone the
     * > link https://t.me/name-of-your-bot?start=custom-payload and register a
     * > start command handler on your bot with grammY. As soon as the user
     * > starts your bot, you will receive `custom-payload` in the `ctx.match`
     * > property!
     * > ```ts
     * > bot.command('start', ctx => {
     * >   const payload = ctx.match // will be 'custom-payload'
     * > })
     * > ```
     *
     * Note that commands are not matched in captions or in the middle of the
     * text.
     * ```ts
     * bot.command('start', ctx => { ... })
     * // ... does not match:
     * // A message saying: “some text /start some more text”
     * // A photo message with the caption “/start”
     * ```
     *
     * By default, commands are detected in channel posts, too. This means that
     * `ctx.message` is potentially `undefined`, so you should use `ctx.msg`
     * instead to grab both messages and channel posts. Alternatively, if you
     * want to limit your bot to finding commands only in private and group
     * chats, you can use `bot.on('message').command('start', ctx => { ... })`,
     * or even store a message-only version of your bot in a variable like so:
     * ```ts
     * const m = bot.on('message')
     *
     * m.command('start', ctx => { ... })
     * m.command('help', ctx => { ... })
     * // etc
     * ```
     *
     * If you need more freedom matching your commands, check out the `commands`
     * plugin.
     *
     * @param command The command to look for
     * @param middleware The middleware to register
     */ command(command, ...middleware) {
    return this.filter(Context.has.command(command), ...middleware);
  }
  /**
     * Registers some middleware that will only be added when a new reaction of
     * the given type is added to a message.
     * ```ts
     * // Reacts to new '👍' reactions
     * bot.reaction('👍', ctx => { ... })
     * // Reacts to new '👍' or '👎' reactions
     * bot.reaction(['👍', '👎'], ctx => { ... })
     * ```
     *
     * > Note that you have to enable `message_reaction` updates in
     * `allowed_updates` if you want your bot to receive updates about message
     * reactions.
     *
     * `bot.reaction` will trigger if:
     * - a new emoji reaction is added to a message
     * - a new custom emoji reaction is added a message
     *
     * `bot.reaction` will not trigger if:
     * - a reaction is removed
     * - an anonymous reaction count is updated, such as on channel posts
     * - `message_reaction` updates are not enabled for your bot
     *
     * @param reaction The reaction to look for
     * @param middleware The middleware to register
     */ reaction(reaction, ...middleware) {
    return this.filter(Context.has.reaction(reaction), ...middleware);
  }
  /**
     * Registers some middleware for certain chat types only. For example, you
     * can use this method to only receive updates from private chats. The four
     * chat types are `"channel"`, `"supergroup"`, `"group"`, and `"private"`.
     * This is especially useful when combined with other filtering logic. For
     * example, this is how can you respond to `/start` commands only from
     * private chats:
     * ```ts
     * bot.chatType("private").command("start", ctx => { ... })
     * ```
     *
     * Naturally, you can also use this method on its own.
     * ```ts
     * // Private chats only
     * bot.chatType("private", ctx => { ... });
     * // Channels only
     * bot.chatType("channel", ctx => { ... });
     * ```
     *
     * You can pass an array of chat types if you want your middleware to run
     * for any of several provided chat types.
     * ```ts
     * // Groups and supergroups only
     * bot.chatType(["group", "supergroup"], ctx => { ... });
     * ```
     * [Remember](https://grammy.dev/guide/context#shortcuts) also that you
     * can access the chat type via `ctx.chat.type`.
     *
     * @param chatType The chat type
     * @param middleware The middleware to register
     */ chatType(chatType, ...middleware) {
    return this.filter(Context.has.chatType(chatType), ...middleware);
  }
  /**
     * Registers some middleware for callback queries, i.e. the updates that
     * Telegram delivers to your bot when a user clicks an inline button (that
     * is a button under a message).
     *
     * This method is essentially the same as calling
     * ```ts
     * bot.on('callback_query:data', ctx => { ... })
     * ```
     * but it also allows you to match the query data against a given text or
     * regular expression.
     *
     * ```ts
     * // Create an inline keyboard
     * const keyboard = new InlineKeyboard().text('Go!', 'button-payload')
     * // Send a message with the keyboard
     * await bot.api.sendMessage(chat_id, 'Press a button!', {
     *   reply_markup: keyboard
     * })
     * // Listen to users pressing buttons with that specific payload
     * bot.callbackQuery('button-payload', ctx => { ... })
     *
     * // Listen to users pressing any button your bot ever sent
     * bot.on('callback_query:data', ctx => { ... })
     * ```
     *
     * Always remember to call `answerCallbackQuery`—even if you don't perform
     * any action: https://core.telegram.org/bots/api#answercallbackquery
     * ```ts
     * bot.on('callback_query:data', async ctx => {
     *   await ctx.answerCallbackQuery()
     * })
     * ```
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * @param trigger The string to look for in the payload
     * @param middleware The middleware to register
     */ callbackQuery(trigger, ...middleware) {
    return this.filter(Context.has.callbackQuery(trigger), ...middleware);
  }
  /**
     * Registers some middleware for game queries, i.e. the updates that
     * Telegram delivers to your bot when a user clicks an inline button for the
     * HTML5 games platform on Telegram.
     *
     * This method is essentially the same as calling
     * ```ts
     * bot.on('callback_query:game_short_name', ctx => { ... })
     * ```
     * but it also allows you to match the query data against a given text or
     * regular expression.
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * @param trigger The string to look for in the payload
     * @param middleware The middleware to register
     */ gameQuery(trigger, ...middleware) {
    return this.filter(Context.has.gameQuery(trigger), ...middleware);
  }
  /**
     * Registers middleware for inline queries. Telegram sends an inline query
     * to your bot whenever a user types “@your_bot_name ...” into a text field
     * in Telegram. You bot will then receive the entered search query and can
     * respond with a number of results (text, images, etc) that the user can
     * pick from to send a message _via_ your bot to the respective chat. Check
     * out https://core.telegram.org/bots/inline to read more about inline bots.
     *
     * > Note that you have to enable inline mode for you bot by contacting
     * > @BotFather first.
     *
     * ```ts
     * // Listen for users typing “@your_bot_name query”
     * bot.inlineQuery('query', async ctx => {
     *   // Answer the inline query, confer https://core.telegram.org/bots/api#answerinlinequery
     *   await ctx.answerInlineQuery( ... )
     * })
     * ```
     *
     * @param trigger The inline query text to match
     * @param middleware The middleware to register
     */ inlineQuery(trigger, ...middleware) {
    return this.filter(Context.has.inlineQuery(trigger), ...middleware);
  }
  /**
     * Registers middleware for the ChosenInlineResult by the given id or ids.
     * ChosenInlineResult represents a result of an inline query that was chosen
     * by the user and sent to their chat partner. Check out
     * https://core.telegram.org/bots/api#choseninlineresult to read more about
     * chosen inline results.
     *
     * ```ts
     * bot.chosenInlineResult('id', async ctx => {
     *   const id = ctx.result_id;
     *   // Your code
     * })
     * ```
     *
     * @param resultId An id or array of ids
     * @param middleware The middleware to register
     */ chosenInlineResult(resultId, ...middleware) {
    return this.filter(Context.has.chosenInlineResult(resultId), ...middleware);
  }
  /**
     * Registers middleware for pre-checkout queries. Telegram sends a
     * pre-checkout query to your bot whenever a user has confirmed their
     * payment and shipping details. You bot will then receive all information
     * about the order and has to respond within 10 seconds with a confirmation
     * of whether everything is alright (goods are available, etc.) and the bot
     * is ready to proceed with the order. Check out
     * https://core.telegram.org/bots/api#precheckoutquery to read more about
     * pre-checkout queries.
     *
     * ```ts
     * bot.preCheckoutQuery('invoice_payload', async ctx => {
     *   // Answer the pre-checkout query, confer https://core.telegram.org/bots/api#answerprecheckoutquery
     *   await ctx.answerPreCheckoutQuery( ... )
     * })
     * ```
     *
     * @param trigger The string to look for in the invoice payload
     * @param middleware The middleware to register
     */ preCheckoutQuery(trigger, ...middleware) {
    return this.filter(Context.has.preCheckoutQuery(trigger), ...middleware);
  }
  /**
     * Registers middleware for shipping queries. If you sent an invoice
     * requesting a shipping address and the parameter _is_flexible_ was
     * specified, Telegram will send a shipping query to your bot whenever a
     * user has confirmed their shipping details. You bot will then receive the
     * shipping information and can respond with a confirmation of whether
     * delivery to the specified address is possible. Check out
     * https://core.telegram.org/bots/api#shippingquery to read more about
     * shipping queries.
     *
     * ```ts
     * bot.shippingQuery('invoice_payload', async ctx => {
     *   // Answer the shipping query, confer https://core.telegram.org/bots/api#answershippingquery
     *   await ctx.answerShippingQuery( ... )
     * })
     * ```
     *
     * @param trigger The string to look for in the invoice payload
     * @param middleware The middleware to register
     */ shippingQuery(trigger, ...middleware) {
    return this.filter(Context.has.shippingQuery(trigger), ...middleware);
  }
  filter(predicate, ...middleware) {
    const composer = new Composer(...middleware);
    this.branch(predicate, composer, pass);
    return composer;
  }
  /**
     * > This is an advanced method of grammY.
     *
     * Registers middleware behind a custom filter function that operates on the
     * context object and decides whether or not to execute the middleware. In
     * other words, the middleware will only be executed if the given predicate
     * returns `false` for the given context object. Otherwise, it will be
     * skipped and the next middleware will be executed. Note that the predicate
     * may be asynchronous, i.e. it can return a Promise of a boolean.
     *
     * This method is the same using `filter` (normal usage) with a negated
     * predicate.
     *
     * @param predicate The predicate to check
     * @param middleware The middleware to register
     */ drop(predicate, ...middleware) {
    return this.filter(async (ctx)=>!await predicate(ctx), ...middleware);
  }
  /**
     * > This is an advanced method of grammY.
     *
     * Registers some middleware that runs concurrently to the executing
     * middleware stack.
     * ```ts
     * bot.use( ... ) // will run first
     * bot.fork( ... ) // will be started second, but run concurrently
     * bot.use( ... ) // will also be run second
     * ```
     * In the first middleware, as soon as `next`'s Promise resolves, both forks
     * have completed.
     *
     * Both the fork and the downstream middleware are awaited with
     * `Promise.all`, so you will only be to catch up to one error (the one that
     * is thrown first).
     *
     * In opposite to the other middleware methods on composer, `fork` does not
     * return simply return the composer connected to the main middleware stack.
     * Instead, it returns the created composer _of the fork_ connected to the
     * middleware stack. This allows for the following pattern.
     * ```ts
     * // Middleware will be run concurrently!
     * bot.fork().on('message', ctx => { ... })
     * ```
     *
     * @param middleware The middleware to run concurrently
     */ fork(...middleware) {
    const composer = new Composer(...middleware);
    const fork = flatten(composer);
    this.use((ctx, next)=>Promise.all([
        next(),
        run(fork, ctx)
      ]));
    return composer;
  }
  /**
     * > This is an advanced method of grammY.
     *
     * Executes some middleware that can be generated on the fly for each
     * context. Pass a factory function that creates some middleware (or a
     * middleware array even). The factory function will be called once per
     * context, and its result will be executed with the context object.
     * ```ts
     * // The middleware returned by `createMyMiddleware` will be used only once
     * bot.lazy(ctx => createMyMiddleware(ctx))
     * ```
     *
     * You may generate this middleware in an `async` fashion.
     *
     * You can decide to return an empty array (`[]`) if you don't want to run
     * any middleware for a given context object. This is equivalent to
     * returning an empty instance of `Composer`.
     *
     * @param middlewareFactory The factory function creating the middleware
     */ lazy(middlewareFactory) {
    return this.use(async (ctx, next)=>{
      const middleware = await middlewareFactory(ctx);
      const arr = Array.isArray(middleware) ? middleware : [
        middleware
      ];
      await flatten(new Composer(...arr))(ctx, next);
    });
  }
  /**
     * > This is an advanced method of grammY.
     *
     * _Not to be confused with the `router` plugin._
     *
     * This method is an alternative to the `router` plugin. It allows you to
     * branch between different middleware per context object. You can pass two
     * things to it:
     * 1. A routing function
     * 2. Different middleware identified by key
     *
     * The routing function decides based on the context object which middleware
     * to run. Each middleware is identified by a key, so the routing function
     * simply returns the key of that middleware.
     * ```ts
     * // Define different route handlers
     * const routeHandlers = {
     *   evenUpdates: (ctx: Context) => { ... }
     *   oddUpdates: (ctx: Context) => { ... }
     * }
     * // Decide for a context object which one to pick
     * const router = (ctx: Context) => ctx.update.update_id % 2 === 0
     *   ? 'evenUpdates'
     *   : 'oddUpdates'
     * // Route it!
     * bot.route(router, routeHandlers)
     * ```
     *
     * Optionally, you can pass a third option that is used as fallback
     * middleware if your route function returns `undefined`, or if the key
     * returned by your router has no middleware associated with it.
     *
     * This method may need less setup than first instantiating a `Router`, but
     * for more complex setups, having a `Router` may be more readable.
     *
     * @param router The routing function to use
     * @param routeHandlers Handlers for every route
     * @param fallback Optional fallback middleware if no route matches
     */ route(router, routeHandlers, fallback = pass) {
    return this.lazy(async (ctx)=>{
      const route = await router(ctx);
      return (route === undefined || !routeHandlers[route] ? fallback : routeHandlers[route]) ?? [];
    });
  }
  /**
     * > This is an advanced method of grammY.
     *
     * Allows you to branch between two cases for a given context object.
     *
     * This method takes a predicate function that is tested once per context
     * object. If it returns `true`, the first supplied middleware is executed.
     * If it returns `false`, the second supplied middleware is executed. Note
     * that the predicate may be asynchronous, i.e. it can return a Promise of a
     * boolean.
     *
     * @param predicate The predicate to check
     * @param trueMiddleware The middleware for the `true` case
     * @param falseMiddleware The middleware for the `false` case
     */ branch(predicate, trueMiddleware, falseMiddleware) {
    return this.lazy(async (ctx)=>await predicate(ctx) ? trueMiddleware : falseMiddleware);
  }
  /**
     * > This is an advanced function of grammY.
     *
     * Installs an error boundary that catches errors that happen only inside
     * the given middleware. This allows you to install custom error handlers
     * that protect some parts of your bot. Errors will not be able to bubble
     * out of this part of your middleware system, unless the supplied error
     * handler rethrows them, in which case the next surrounding error boundary
     * will catch the error.
     *
     * Example usage:
     * ```ts
     * function errHandler(err: BotError) {
     *   console.error('Error boundary caught error!', err)
     * }
     *
     * const safe =
     *   // All passed middleware will be protected by the error boundary.
     *   bot.errorBoundary(errHandler, middleware0, middleware1, middleware2)
     *
     * // Those will also be protected!
     * safe.on('message', middleware3)
     *
     * // No error from `middleware4` will reach the `errHandler` from above,
     * // as errors are suppressed.
     *
     * // do nothing on error (suppress error), and run outside middleware
     * const suppress = (_err: BotError, next: NextFunction) => { return next() }
     * safe.errorBoundary(suppress).on('edited_message', middleware4)
     * ```
     *
     * Check out the
     * [documentation](https://grammy.dev/guide/errors#error-boundaries) on
     * the website to learn more about error boundaries.
     *
     * @param errorHandler The error handler to use
     * @param middleware The middleware to protect
     */ errorBoundary(errorHandler, ...middleware) {
    const composer = new Composer(...middleware);
    const bound = flatten(composer);
    this.use(async (ctx, next)=>{
      let nextCalled = false;
      const cont = ()=>(nextCalled = true, Promise.resolve());
      try {
        await bound(ctx, cont);
      } catch (err) {
        nextCalled = false;
        await errorHandler(new BotError(err, ctx), cont);
      }
      if (nextCalled) await next();
    });
    return composer;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29tcG9zZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICB0eXBlIENhbGxiYWNrUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgQ2hhdFR5cGVDb250ZXh0LFxuICAgIHR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dCxcbiAgICB0eXBlIENvbW1hbmRDb250ZXh0LFxuICAgIENvbnRleHQsXG4gICAgdHlwZSBHYW1lUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgSGVhcnNDb250ZXh0LFxuICAgIHR5cGUgSW5saW5lUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgTWF5YmVBcnJheSxcbiAgICB0eXBlIFByZUNoZWNrb3V0UXVlcnlDb250ZXh0LFxuICAgIHR5cGUgUmVhY3Rpb25Db250ZXh0LFxuICAgIHR5cGUgU2hpcHBpbmdRdWVyeUNvbnRleHQsXG4gICAgdHlwZSBTdHJpbmdXaXRoQ29tbWFuZFN1Z2dlc3Rpb25zLFxufSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyB0eXBlIEZpbHRlciwgdHlwZSBGaWx0ZXJRdWVyeSB9IGZyb20gXCIuL2ZpbHRlci50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIENoYXQsXG4gICAgdHlwZSBSZWFjdGlvblR5cGUsXG4gICAgdHlwZSBSZWFjdGlvblR5cGVFbW9qaSxcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxudHlwZSBNYXliZVByb21pc2U8VD4gPSBUIHwgUHJvbWlzZTxUPjtcblxuLy8gPT09IE1pZGRsZXdhcmUgdHlwZXNcbi8qKlxuICogQSBmdW5jdGlvbiBvZiB0aGlzIHR5cGUgaXMgcGFzc2VkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHRvIGFsbCBtaWRkbGV3YXJlLlxuICogSW52b2tlIGl0IHRvIGNhbGwgdGhlIGRvd25zdHJlYW0gbWlkZGxld2FyZSBhbmQgcGFzcyBvbiB0aGUgY29udHJvbCBmbG93LlxuICpcbiAqIEluIG90aGVyIHdvcmRzLCBpZiB5b3VyIG1pZGRsZXdhcmUgaXMgZG9uZSBoYW5kbGluZyB0aGUgY29udGV4dCBvYmplY3QsIGFuZFxuICogb3RoZXIgbWlkZGxld2FyZSBzaG91bGQgdGFrZSBvdmVyLCB0aGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgYW5kXG4gKiBgYXdhaXRgZWQuXG4gKlxuICogT25jZSB0aGUgYFByb21pc2VgIHJldHVybmVkIGJ5IHRoaXMgZnVuY3Rpb24gcmVzb2x2ZXMsIHRoZSBkb3duc3RyZWFtXG4gKiBtaWRkbGV3YXJlIGlzIGRvbmUgZXhlY3V0aW5nLCBoZW5jZSByZXR1cm5pbmcgdGhlIGNvbnRyb2wuXG4gKi9cbmV4cG9ydCB0eXBlIE5leHRGdW5jdGlvbiA9ICgpID0+IFByb21pc2U8dm9pZD47XG5cbi8qKlxuICogTWlkZGxld2FyZSBpbiB0aGUgZm9ybSBvZiBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgdHlwZSBNaWRkbGV3YXJlRm48QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiA9IChcbiAgICBjdHg6IEMsXG4gICAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuKSA9PiBNYXliZVByb21pc2U8dW5rbm93bj47XG4vKipcbiAqIE1pZGRsZXdhcmUgaW4gdGhlIGZvcm0gb2YgYSBjb250YWluZXIgZm9yIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWlkZGxld2FyZU9iajxDIGV4dGVuZHMgQ29udGV4dCA9IENvbnRleHQ+IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjb250YWluZWQgbWlkZGxld2FyZS5cbiAgICAgKi9cbiAgICBtaWRkbGV3YXJlOiAoKSA9PiBNaWRkbGV3YXJlRm48Qz47XG59XG4vKipcbiAqIE1pZGRsZXdhcmUgZm9yIGdyYW1tWSwgZWl0aGVyIGFzIGEgZnVuY3Rpb24gb3IgYXMgYSBjb250YWluZXIgZm9yIGEgZnVuY3Rpb24uXG4gKlxuICogU2ltcGx5IHB1dCwgbWlkZGxld2FyZSBpcyBqdXN0IGEgZmFuY3kgdGVybSBmb3IgYSBfbGlzdGVuZXJfLiBZb3UgY2FuXG4gKiByZWdpc3RlciBtaWRkbGV3YXJlIG9uIGEgYm90IHRvIGxpc3RlbiBmb3IgdXBkYXRlcy4gRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IGN0eC5yZXBseSgnSSBnb3QgeW91ciBtZXNzYWdlIScpKVxuICogLy8gICAgICAgICAgICAgICAgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XG4gKiAvLyAgICAgICAgICAgICAgICBeXG4gKiAvLyAgICAgICAgICAgICAgICB8XG4gKiAvLyAgICAgICAgICAgICAgIFRoaXMgaXMgbWlkZGxld2FyZSFcbiAqIGBgYFxuICpcbiAqIE1pZGRsZXdhcmUgcmVjZWl2ZXMgb25lIG9iamVjdCB0aGF0IHdlIGNhbGwgdGhlIF9jb250ZXh0IG9iamVjdF8uIFRoaXMgaXNcbiAqIGFub3RoZXIgZmFuY3kgdGVybSBmb3IgYSBzaW1wbGUgb2JqZWN0IHRoYXQgaG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgdGhlXG4gKiB1cGRhdGUgeW91J3JlIHByb2Nlc3NpbmcuIEZvciBpbnN0YW5jZSwgdGhlIGNvbnRleHQgb2JqZWN0IGdpdmVzIHlvdSBhY2Nlc3NcbiAqIHRvIHRoZSBtZXNzYWdlIHRoYXQgd2FzIHNlbnQgdG8geW91ciBib3QgKGBjdHgubWVzc2FnZWApLCBpbmNsdWRpbmcgdGhlIHRleHRcbiAqIChvciBwaG90byBvciB3aGF0ZXZlciBtZXNzYWdlIHRoZSB1c2VyIGhhcyBzZW50KS4gVGhlIGNvbnRleHQgb2JqZWN0IGlzXG4gKiBjb21tb25seSBuYW1lZCBgY3R4YC5cbiAqXG4gKiBJdCBhbHNvIHByb3ZpZGVzIHlvdSB3aXRoIHRoZSBgY3R4LmFwaWAgb2JqZWN0IHRoYXQgeW91IGFsc28gZmluZCBvblxuICogYGJvdC5hcGlgLiBBcyBhIHJlc3VsdCwgeW91IGNhbiBjYWxsIGBjdHguYXBpLnNlbmRNZXNzYWdlYCBpbnN0ZWFkIG9mXG4gKiBgYm90LmFwaS5zZW5kTWVzc2FnZWAuIFRoaXMgcHJldmVudHMgeW91IGZyb20gaGF2aW5nIHRvIHBhc3MgYXJvdW5kIHlvdXJcbiAqIGBib3RgIGluc3RhbmNlIGFsbCBvdmVyIHlvdXIgY29kZS5cbiAqXG4gKiBNb3N0IGltcG9ydGFudGx5LCB0aGUgY29udGV4dCBvYmplY3QgZ2l2ZXMgeW91IGEgaGFuZGZ1bCBvZiByZWFsbHkgdXNlZnVsXG4gKiBzaG9ydGN1dHMsIHN1Y2ggYXMgYSBgcmVwbHlgIG1ldGhvZCAoc2VlIGFib3ZlKS4gVGhpcyBtZXRob2QgaXMgbm90aGluZyBlbHNlXG4gKiB0aGFuIGEgd3JhcHBlciBhcm91bmQgYGN0eC5hcGkuc2VuZE1lc3NhZ2Vg4oCUYnV0IHdpdGggc29tZSBhcmd1bWVudHNcbiAqIHByZS1maWxsZWQgZm9yIHlvdS4gQXMgeW91IGNhbiBzZWUgYWJvdmUsIHlvdSBubyBsb25nZXIgaGF2ZSB0byBzcGVjaWZ5IGFcbiAqIGBjaGF0X2lkYCBvciBhbnl0aGluZzsgdGhlIGNvbnRleHQgb2JqZWN0IGtub3dzIHdoaWNoIGNoYXQgaXQgYmVsb25ncyB0bywgc29cbiAqIHdoZW4geW91IGNhbGwgYHJlcGx5YCwgdGhlIGNvbnRleHQgd2lsbCBjYWxsIGBzZW5kTWVzc2FnZWAgd2l0aCB0aGUgY29ycmVjdFxuICogYGNoYXRfaWRgLCBuYW1lbHkgdGhlIG9uZSBmb3IgdGhlIHNhbWUgY2hhdCB0aGF0IHRoZSBpbmNvbWluZyBtZXNzYWdlXG4gKiBvcmlnaW5hdGVzIGZyb20uIFRoaXMgbWFrZXMgaXQgdmVyeSBjb252ZW5pZW50IHRvIHJlcGx5IHRvIGEgbWVzc2FnZS5cbiAqXG4gKiBNaWRkbGV3YXJlIGlzIGFuIGV4dHJlbWVseSBwb3dlcmZ1bCBjb25jZXB0IGFuZCB0aGlzIHNob3J0IGV4cGxhbmF0aW9uIG9ubHlcbiAqIHNjcmF0Y2hlZCB0aGUgc3VyZmFjZSBvZiB3aGF0IGlzIHBvc3NpYmxlIHdpdGggZ3JhbW1ZLiBJZiB5b3Ugd2FudCB0byBrbm93XG4gKiBtb3JlIGFkdmFuY2VkIHRoaW5ncyBhYm91dCBtaWRkbGV3YXJlLCBjaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL21pZGRsZXdhcmUpIG9uIHRoZSB3ZWJzaXRlLlxuICovXG5leHBvcnQgdHlwZSBNaWRkbGV3YXJlPEMgZXh0ZW5kcyBDb250ZXh0ID0gQ29udGV4dD4gPVxuICAgIHwgTWlkZGxld2FyZUZuPEM+XG4gICAgfCBNaWRkbGV3YXJlT2JqPEM+O1xuXG4vLyA9PT0gTWlkZGxld2FyZSBlcnJvcnNcbi8qKlxuICogVGhpcyBlcnJvciBpcyB0aHJvd24gd2hlbiBtaWRkbGV3YXJlIHRocm93cy4gSXQgc2ltcGx5IHdyYXBzIHRoZSBvcmlnaW5hbFxuICogZXJyb3IgKGFjY2Vzc2libGUgdmlhIHRoZSBgZXJyb3JgIHByb3BlcnR5KSwgYnV0IGFsc28gcHJvdmlkZXMgYWNjZXNzIHRvIHRoZVxuICogcmVzcGVjdGl2ZSBjb250ZXh0IG9iamVjdCB0aGF0IHdhcyBwcm9jZXNzZWQgd2hpbGUgdGhlIGVycm9yIG9jY3VycmVkLlxuICovXG5leHBvcnQgY2xhc3MgQm90RXJyb3I8QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgZXJyb3I6IHVua25vd24sIHB1YmxpYyByZWFkb25seSBjdHg6IEMpIHtcbiAgICAgICAgc3VwZXIoZ2VuZXJhdGVCb3RFcnJvck1lc3NhZ2UoZXJyb3IpKTtcbiAgICAgICAgdGhpcy5uYW1lID0gXCJCb3RFcnJvclwiO1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikgdGhpcy5zdGFjayA9IGVycm9yLnN0YWNrO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdlbmVyYXRlQm90RXJyb3JNZXNzYWdlKGVycm9yOiB1bmtub3duKSB7XG4gICAgbGV0IG1zZzogc3RyaW5nO1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIG1zZyA9IGAke2Vycm9yLm5hbWV9IGluIG1pZGRsZXdhcmU6ICR7ZXJyb3IubWVzc2FnZX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgZXJyb3I7XG4gICAgICAgIG1zZyA9IGBOb24tZXJyb3IgdmFsdWUgb2YgdHlwZSAke3R5cGV9IHRocm93biBpbiBtaWRkbGV3YXJlYDtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiYmlnaW50XCI6XG4gICAgICAgICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgY2FzZSBcInN5bWJvbFwiOlxuICAgICAgICAgICAgICAgIG1zZyArPSBgOiAke2Vycm9yfWA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgICAgICAgICAgbXNnICs9IGA6ICR7U3RyaW5nKGVycm9yKS5zdWJzdHJpbmcoMCwgNTApfWA7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIG1zZyArPSBcIiFcIjtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbXNnO1xufVxuXG4vLyA9PT0gTWlkZGxld2FyZSBiYXNlIGZ1bmN0aW9uc1xuZnVuY3Rpb24gZmxhdHRlbjxDIGV4dGVuZHMgQ29udGV4dD4obXc6IE1pZGRsZXdhcmU8Qz4pOiBNaWRkbGV3YXJlRm48Qz4ge1xuICAgIHJldHVybiB0eXBlb2YgbXcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IG13XG4gICAgICAgIDogKGN0eCwgbmV4dCkgPT4gbXcubWlkZGxld2FyZSgpKGN0eCwgbmV4dCk7XG59XG5mdW5jdGlvbiBjb25jYXQ8QyBleHRlbmRzIENvbnRleHQ+KFxuICAgIGZpcnN0OiBNaWRkbGV3YXJlRm48Qz4sXG4gICAgYW5kVGhlbjogTWlkZGxld2FyZUZuPEM+LFxuKTogTWlkZGxld2FyZUZuPEM+IHtcbiAgICByZXR1cm4gYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICBsZXQgbmV4dENhbGxlZCA9IGZhbHNlO1xuICAgICAgICBhd2FpdCBmaXJzdChjdHgsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGlmIChuZXh0Q2FsbGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJgbmV4dGAgYWxyZWFkeSBjYWxsZWQgYmVmb3JlIVwiKTtcbiAgICAgICAgICAgIGVsc2UgbmV4dENhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBhd2FpdCBhbmRUaGVuKGN0eCwgbmV4dCk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5mdW5jdGlvbiBwYXNzPEMgZXh0ZW5kcyBDb250ZXh0PihfY3R4OiBDLCBuZXh0OiBOZXh0RnVuY3Rpb24pIHtcbiAgICByZXR1cm4gbmV4dCgpO1xufVxuXG5jb25zdCBsZWFmOiBOZXh0RnVuY3Rpb24gPSAoKSA9PiBQcm9taXNlLnJlc29sdmUoKTtcbi8qKlxuICogUnVucyBzb21lIGdpdmVuIG1pZGRsZXdhcmUgZnVuY3Rpb24gd2l0aCBhIGdpdmVuIGNvbnRleHQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJ1blxuICogQHBhcmFtIGN0eCBUaGUgY29udGV4dCB0byB1c2VcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bjxDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgbWlkZGxld2FyZTogTWlkZGxld2FyZUZuPEM+LFxuICAgIGN0eDogQyxcbikge1xuICAgIGF3YWl0IG1pZGRsZXdhcmUoY3R4LCBsZWFmKTtcbn1cblxuLy8gPT09IENvbXBvc2VyXG4vKipcbiAqIFRoZSBjb21wb3NlciBpcyB0aGUgaGVhcnQgb2YgdGhlIG1pZGRsZXdhcmUgc3lzdGVtIGluIGdyYW1tWS4gSXQgaXMgYWxzbyB0aGVcbiAqIHN1cGVyY2xhc3Mgb2YgYEJvdGAuIFdoZW5ldmVyIHlvdSBjYWxsIGB1c2VgIG9yIGBvbmAgb3Igc29tZSBvZiB0aGUgb3RoZXJcbiAqIG1ldGhvZHMgb24geW91ciBib3QsIHlvdSBhcmUgaW4gZmFjdCB1c2luZyB0aGUgdW5kZXJseWluZyBjb21wb3NlciBpbnN0YW5jZVxuICogdG8gcmVnaXN0ZXIgeW91ciBtaWRkbGV3YXJlLlxuICpcbiAqIElmIHlvdSdyZSBqdXN0IGdldHRpbmcgc3RhcnRlZCwgeW91IGRvIG5vdCBuZWVkIHRvIHdvcnJ5IGFib3V0IHdoYXRcbiAqIG1pZGRsZXdhcmUgaXMsIG9yIGFib3V0IGhvdyB0byB1c2UgYSBjb21wb3Nlci5cbiAqXG4gKiBPbiB0aGUgb3RoZXIgaGFuZCwgaWYgeW91IHdhbnQgdG8gZGlnIGRlZXBlciBpbnRvIGhvdyBncmFtbVkgaW1wbGVtZW50c1xuICogbWlkZGxld2FyZSwgY2hlY2sgb3V0IHRoZVxuICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9hZHZhbmNlZC9taWRkbGV3YXJlKSBvbiB0aGUgd2Vic2l0ZS5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbXBvc2VyPEMgZXh0ZW5kcyBDb250ZXh0PiBpbXBsZW1lbnRzIE1pZGRsZXdhcmVPYmo8Qz4ge1xuICAgIHByaXZhdGUgaGFuZGxlcjogTWlkZGxld2FyZUZuPEM+O1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhIG5ldyBjb21wb3NlciBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgbWlkZGxld2FyZS4gSWYgbm9cbiAgICAgKiBtaWRkbGV3YXJlIGlzIGdpdmVuLCB0aGUgY29tcG9zZXIgaW5zdGFuY2Ugd2lsbCBzaW1wbHkgbWFrZSBhbGwgY29udGV4dFxuICAgICAqIG9iamVjdHMgcGFzcyB0aHJvdWdoIHdpdGhvdXQgdG91Y2hpbmcgdGhlbS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIGNvbXBvc2VcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvciguLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+Pikge1xuICAgICAgICB0aGlzLmhhbmRsZXIgPSBtaWRkbGV3YXJlLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgPyBwYXNzXG4gICAgICAgICAgICA6IG1pZGRsZXdhcmUubWFwKGZsYXR0ZW4pLnJlZHVjZShjb25jYXQpO1xuICAgIH1cblxuICAgIG1pZGRsZXdhcmUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhhbmRsZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIHNvbWUgbWlkZGxld2FyZSB0aGF0IHJlY2VpdmVzIGFsbCB1cGRhdGVzLiBJdCBpcyBpbnN0YWxsZWQgYnlcbiAgICAgKiBjb25jYXRlbmF0aW5nIGl0IHRvIHRoZSBlbmQgb2YgYWxsIHByZXZpb3VzbHkgaW5zdGFsbGVkIG1pZGRsZXdhcmUuXG4gICAgICpcbiAgICAgKiBPZnRlbiwgdGhpcyBtZXRob2QgaXMgdXNlZCB0byBpbnN0YWxsIG1pZGRsZXdhcmUgdGhhdCBiZWhhdmVzIGxpa2UgYVxuICAgICAqIHBsdWdpbiwgZm9yIGV4YW1wbGUgc2Vzc2lvbiBtaWRkbGV3YXJlLlxuICAgICAqIGBgYHRzXG4gICAgICogYm90LnVzZShzZXNzaW9uKCkpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCByZXR1cm5zIGEgbmV3IGluc3RhbmNlIG9mIGNvbXBvc2VyLiBUaGUgcmV0dXJuZWQgaW5zdGFuY2UgY2FuXG4gICAgICogYmUgZnVydGhlciBleHRlbmRlZCwgYW5kIGFsbCBjaGFuZ2VzIHdpbGwgYmUgcmVnYXJkZWQgaGVyZS4gQ29uZmVyIHRoZVxuICAgICAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvYWR2YW5jZWQvbWlkZGxld2FyZSkgb24gdGhlXG4gICAgICogd2Vic2l0ZSBpZiB5b3Ugd2FudCB0byBrbm93IG1vcmUgYWJvdXQgaG93IHRoZSBtaWRkbGV3YXJlIHN5c3RlbSBpblxuICAgICAqIGdyYW1tWSB3b3JrcywgZXNwZWNpYWxseSB3aGVuIGl0IGNvbWVzIHRvIGNoYWluaW5nIHRoZSBtZXRob2QgY2FsbHNcbiAgICAgKiAoYHVzZSggLi4uICkudXNlKCAuLi4gKS51c2UoIC4uLiApYCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIHVzZSguLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+Pikge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlciguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVyID0gY29uY2F0KHRoaXMuaGFuZGxlciwgZmxhdHRlbihjb21wb3NlcikpO1xuICAgICAgICByZXR1cm4gY29tcG9zZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIHNvbWUgbWlkZGxld2FyZSB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBmb3Igc29tZSBzcGVjaWZpY1xuICAgICAqIHVwZGF0ZXMsIG5hbWVseSB0aG9zZSBtYXRjaGluZyB0aGUgcHJvdmlkZWQgZmlsdGVyIHF1ZXJ5LiBGaWx0ZXIgcXVlcmllc1xuICAgICAqIGFyZSBhIGNvbmNpc2Ugd2F5IHRvIHNwZWNpZnkgd2hpY2ggdXBkYXRlcyB5b3UgYXJlIGludGVyZXN0ZWQgaW4uXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzIG9mIHZhbGlkIGZpbHRlciBxdWVyaWVzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gQWxsIGtpbmRzIG9mIG1lc3NhZ2UgdXBkYXRlc1xuICAgICAqIGJvdC5vbignbWVzc2FnZScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqXG4gICAgICogLy8gT25seSB0ZXh0IG1lc3NhZ2VzXG4gICAgICogYm90Lm9uKCdtZXNzYWdlOnRleHQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIE9ubHkgdGV4dCBtZXNzYWdlcyB3aXRoIFVSTFxuICAgICAqIGJvdC5vbignbWVzc2FnZTplbnRpdGllczp1cmwnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIFRleHQgbWVzc2FnZXMgYW5kIHRleHQgY2hhbm5lbCBwb3N0c1xuICAgICAqIGJvdC5vbignOnRleHQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIE1lc3NhZ2VzIHdpdGggVVJMIGluIHRleHQgb3IgY2FwdGlvbiAoaS5lLiBlbnRpdGllcyBvciBjYXB0aW9uIGVudGl0aWVzKVxuICAgICAqIGJvdC5vbignbWVzc2FnZTo6dXJsJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICpcbiAgICAgKiAvLyBNZXNzYWdlcyBvciBjaGFubmVsIHBvc3RzIHdpdGggVVJMIGluIHRleHQgb3IgY2FwdGlvblxuICAgICAqIGJvdC5vbignOjp1cmwnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlIGF1dG9jb21wbGV0ZSBpbiBWUyBDb2RlIHRvIHNlZSBhbGwgYXZhaWxhYmxlIGZpbHRlciBxdWVyaWVzLlxuICAgICAqIENoZWNrIG91dCB0aGVcbiAgICAgKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2ZpbHRlci1xdWVyaWVzKSBvbiB0aGVcbiAgICAgKiB3ZWJzaXRlIHRvIGxlYXJuIG1vcmUgYWJvdXQgZmlsdGVyIHF1ZXJpZXMgaW4gZ3JhbW1ZLlxuICAgICAqXG4gICAgICogSXQgaXMgcG9zc2libGUgdG8gcGFzcyBtdWx0aXBsZSBmaWx0ZXIgcXVlcmllcyBpbiBhbiBhcnJheSwgaS5lLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gTWF0Y2hlcyBhbGwgdGV4dCBtZXNzYWdlcyBhbmQgZWRpdGVkIHRleHQgbWVzc2FnZXMgdGhhdCBjb250YWluIGEgVVJMXG4gICAgICogYm90Lm9uKFsnbWVzc2FnZTplbnRpdGllczp1cmwnLCAnZWRpdGVkX21lc3NhZ2U6ZW50aXRpZXM6dXJsJ10sIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogWW91ciBtaWRkbGV3YXJlIHdpbGwgYmUgZXhlY3V0ZWQgaWYgX2FueSBvZiB0aGUgcHJvdmlkZWQgZmlsdGVyIHF1ZXJpZXNfXG4gICAgICogbWF0Y2hlcyAobG9naWNhbCBPUikuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgaW5zdGVhZCB3YW50IHRvIG1hdGNoIF9hbGwgb2YgdGhlIHByb3ZpZGVkIGZpbHRlciBxdWVyaWVzX1xuICAgICAqIChsb2dpY2FsIEFORCksIHlvdSBjYW4gY2hhaW4gdGhlIGAub25gIGNhbGxzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gTWF0Y2hlcyBhbGwgbWVzc2FnZXMgYW5kIGNoYW5uZWwgcG9zdHMgdGhhdCBib3RoIGEpIGNvbnRhaW4gYSBVUkwgYW5kIGIpIGFyZSBmb3J3YXJkc1xuICAgICAqIGJvdC5vbignOjp1cmwnKS5vbignOmZvcndhcmRfb3JpZ2luJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmlsdGVyIFRoZSBmaWx0ZXIgcXVlcnkgdG8gdXNlLCBtYXkgYWxzbyBiZSBhbiBhcnJheSBvZiBxdWVyaWVzXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXIgYmVoaW5kIHRoZSBnaXZlbiBmaWx0ZXJcbiAgICAgKi9cbiAgICBvbjxRIGV4dGVuZHMgRmlsdGVyUXVlcnk+KFxuICAgICAgICBmaWx0ZXI6IFEgfCBRW10sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PE1pZGRsZXdhcmU8RmlsdGVyPEMsIFE+Pj5cbiAgICApOiBDb21wb3NlcjxGaWx0ZXI8QywgUT4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLmZpbHRlclF1ZXJ5KGZpbHRlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgd2hlbiB0aGUgbWVzc2FnZVxuICAgICAqIGNvbnRhaW5zIHNvbWUgdGV4dC4gSXMgaXQgcG9zc2libGUgdG8gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYXRjaDpcbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIE1hdGNoIHNvbWUgdGV4dCAoZXhhY3QgbWF0Y2gpXG4gICAgICogYm90LmhlYXJzKCdJIGxvdmUgZ3JhbW1ZJywgY3R4ID0+IGN0eC5yZXBseSgnQW5kIGdyYW1tWSBsb3ZlcyB5b3UhIDwzJykpXG4gICAgICogLy8gTWF0Y2ggYSByZWd1bGFyIGV4cHJlc3Npb25cbiAgICAgKiBib3QuaGVhcnMoL1xcL2VjaG8gKC4rKS8sIGN0eCA9PiBjdHgucmVwbHkoY3R4Lm1hdGNoWzFdKSlcbiAgICAgKiBgYGBcbiAgICAgKiBOb3RlIGhvdyBgY3R4Lm1hdGNoYCB3aWxsIGNvbnRhaW4gdGhlIHJlc3VsdCBvZiB0aGUgcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqIEhlcmUgaXQgaXMgYSBgUmVnRXhwTWF0Y2hBcnJheWAgb2JqZWN0LCBzbyBgY3R4Lm1hdGNoWzFdYCByZWZlcnMgdG8gdGhlXG4gICAgICogcGFydCBvZiB0aGUgcmVnZXggdGhhdCB3YXMgbWF0Y2hlZCBieSBgKC4rKWAsIGkuZS4gdGhlIHRleHQgdGhhdCBjb21lc1xuICAgICAqIGFmdGVyIOKAnC9lY2hv4oCdLlxuICAgICAqXG4gICAgICogWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIHRyaWdnZXJzLiBZb3VyIG1pZGRsZXdhcmUgd2lsbCBiZSBleGVjdXRlZCBpZiBhdFxuICAgICAqIGxlYXN0IG9uZSBvZiB0aGVtIG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBCb3RoIHRleHQgYW5kIGNhcHRpb25zIG9mIHRoZSByZWNlaXZlZCBtZXNzYWdlcyB3aWxsIGJlIHNjYW5uZWQuIEZvclxuICAgICAqIGV4YW1wbGUsIHdoZW4gYSBwaG90byBpcyBzZW50IHRvIHRoZSBjaGF0IGFuZCBpdHMgY2FwdGlvbiBtYXRjaGVzIHRoZVxuICAgICAqIHRyaWdnZXIsIHlvdXIgbWlkZGxld2FyZSB3aWxsIGJlIGV4ZWN1dGVkLlxuICAgICAqXG4gICAgICogSWYgeW91IG9ubHkgd2FudCB0byBtYXRjaCB0ZXh0IG1lc3NhZ2VzIGFuZCBub3QgY2FwdGlvbnMsIHlvdSBjYW4gZG9cbiAgICAgKiB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gT25seSBtYXRjaGVzIHRleHQgbWVzc2FnZXMgKGFuZCBjaGFubmVsIHBvc3RzKSBmb3IgdGhlIHJlZ2V4XG4gICAgICogYm90Lm9uKCc6dGV4dCcpLmhlYXJzKC9cXC9lY2hvICguKykvLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSB0ZXh0IHRvIGxvb2sgZm9yXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBoZWFycyhcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxIZWFyc01pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8SGVhcnNDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy50ZXh0KHRyaWdnZXIpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIHRoYXQgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIHdoZW4gYSBjZXJ0YWluXG4gICAgICogY29tbWFuZCBpcyBmb3VuZC5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFJlYWN0cyB0byAvc3RhcnQgY29tbWFuZHNcbiAgICAgKiBib3QuY29tbWFuZCgnc3RhcnQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiAvLyBSZWFjdHMgdG8gL2hlbHAgY29tbWFuZHNcbiAgICAgKiBib3QuY29tbWFuZCgnaGVscCcsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogVGhlIHJlc3Qgb2YgdGhlIG1lc3NhZ2UgKGV4Y2x1ZGluZyB0aGUgY29tbWFuZCwgYW5kIHRyaW1tZWQpIGlzIHByb3ZpZGVkXG4gICAgICogdmlhIGBjdHgubWF0Y2hgLlxuICAgICAqXG4gICAgICogPiAqKkRpZCB5b3Uga25vdz8qKiBZb3UgY2FuIHVzZSBkZWVwIGxpbmtpbmdcbiAgICAgKiA+IChodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvZmVhdHVyZXMjZGVlcC1saW5raW5nKSB0byBsZXQgdXNlcnNcbiAgICAgKiA+IHN0YXJ0IHlvdXIgYm90IHdpdGggYSBjdXN0b20gcGF5bG9hZC4gQXMgYW4gZXhhbXBsZSwgc2VuZCBzb21lb25lIHRoZVxuICAgICAqID4gbGluayBodHRwczovL3QubWUvbmFtZS1vZi15b3VyLWJvdD9zdGFydD1jdXN0b20tcGF5bG9hZCBhbmQgcmVnaXN0ZXIgYVxuICAgICAqID4gc3RhcnQgY29tbWFuZCBoYW5kbGVyIG9uIHlvdXIgYm90IHdpdGggZ3JhbW1ZLiBBcyBzb29uIGFzIHRoZSB1c2VyXG4gICAgICogPiBzdGFydHMgeW91ciBib3QsIHlvdSB3aWxsIHJlY2VpdmUgYGN1c3RvbS1wYXlsb2FkYCBpbiB0aGUgYGN0eC5tYXRjaGBcbiAgICAgKiA+IHByb3BlcnR5IVxuICAgICAqID4gYGBgdHNcbiAgICAgKiA+IGJvdC5jb21tYW5kKCdzdGFydCcsIGN0eCA9PiB7XG4gICAgICogPiAgIGNvbnN0IHBheWxvYWQgPSBjdHgubWF0Y2ggLy8gd2lsbCBiZSAnY3VzdG9tLXBheWxvYWQnXG4gICAgICogPiB9KVxuICAgICAqID4gYGBgXG4gICAgICpcbiAgICAgKiBOb3RlIHRoYXQgY29tbWFuZHMgYXJlIG5vdCBtYXRjaGVkIGluIGNhcHRpb25zIG9yIGluIHRoZSBtaWRkbGUgb2YgdGhlXG4gICAgICogdGV4dC5cbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5jb21tYW5kKCdzdGFydCcsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIC8vIC4uLiBkb2VzIG5vdCBtYXRjaDpcbiAgICAgKiAvLyBBIG1lc3NhZ2Ugc2F5aW5nOiDigJxzb21lIHRleHQgL3N0YXJ0IHNvbWUgbW9yZSB0ZXh04oCdXG4gICAgICogLy8gQSBwaG90byBtZXNzYWdlIHdpdGggdGhlIGNhcHRpb24g4oCcL3N0YXJ04oCdXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBCeSBkZWZhdWx0LCBjb21tYW5kcyBhcmUgZGV0ZWN0ZWQgaW4gY2hhbm5lbCBwb3N0cywgdG9vLiBUaGlzIG1lYW5zIHRoYXRcbiAgICAgKiBgY3R4Lm1lc3NhZ2VgIGlzIHBvdGVudGlhbGx5IGB1bmRlZmluZWRgLCBzbyB5b3Ugc2hvdWxkIHVzZSBgY3R4Lm1zZ2BcbiAgICAgKiBpbnN0ZWFkIHRvIGdyYWIgYm90aCBtZXNzYWdlcyBhbmQgY2hhbm5lbCBwb3N0cy4gQWx0ZXJuYXRpdmVseSwgaWYgeW91XG4gICAgICogd2FudCB0byBsaW1pdCB5b3VyIGJvdCB0byBmaW5kaW5nIGNvbW1hbmRzIG9ubHkgaW4gcHJpdmF0ZSBhbmQgZ3JvdXBcbiAgICAgKiBjaGF0cywgeW91IGNhbiB1c2UgYGJvdC5vbignbWVzc2FnZScpLmNvbW1hbmQoJ3N0YXJ0JywgY3R4ID0+IHsgLi4uIH0pYCxcbiAgICAgKiBvciBldmVuIHN0b3JlIGEgbWVzc2FnZS1vbmx5IHZlcnNpb24gb2YgeW91ciBib3QgaW4gYSB2YXJpYWJsZSBsaWtlIHNvOlxuICAgICAqIGBgYHRzXG4gICAgICogY29uc3QgbSA9IGJvdC5vbignbWVzc2FnZScpXG4gICAgICpcbiAgICAgKiBtLmNvbW1hbmQoJ3N0YXJ0JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogbS5jb21tYW5kKCdoZWxwJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogLy8gZXRjXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBJZiB5b3UgbmVlZCBtb3JlIGZyZWVkb20gbWF0Y2hpbmcgeW91ciBjb21tYW5kcywgY2hlY2sgb3V0IHRoZSBgY29tbWFuZHNgXG4gICAgICogcGx1Z2luLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgVGhlIGNvbW1hbmQgdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGNvbW1hbmQoXG4gICAgICAgIGNvbW1hbmQ6IE1heWJlQXJyYXk8U3RyaW5nV2l0aENvbW1hbmRTdWdnZXN0aW9ucz4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PENvbW1hbmRNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPENvbW1hbmRDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5jb21tYW5kKGNvbW1hbmQpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIHRoYXQgd2lsbCBvbmx5IGJlIGFkZGVkIHdoZW4gYSBuZXcgcmVhY3Rpb24gb2ZcbiAgICAgKiB0aGUgZ2l2ZW4gdHlwZSBpcyBhZGRlZCB0byBhIG1lc3NhZ2UuXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBSZWFjdHMgdG8gbmV3ICfwn5GNJyByZWFjdGlvbnNcbiAgICAgKiBib3QucmVhY3Rpb24oJ/CfkY0nLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiAvLyBSZWFjdHMgdG8gbmV3ICfwn5GNJyBvciAn8J+RjicgcmVhY3Rpb25zXG4gICAgICogYm90LnJlYWN0aW9uKFsn8J+RjScsICfwn5GOJ10sIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogPiBOb3RlIHRoYXQgeW91IGhhdmUgdG8gZW5hYmxlIGBtZXNzYWdlX3JlYWN0aW9uYCB1cGRhdGVzIGluXG4gICAgICogYGFsbG93ZWRfdXBkYXRlc2AgaWYgeW91IHdhbnQgeW91ciBib3QgdG8gcmVjZWl2ZSB1cGRhdGVzIGFib3V0IG1lc3NhZ2VcbiAgICAgKiByZWFjdGlvbnMuXG4gICAgICpcbiAgICAgKiBgYm90LnJlYWN0aW9uYCB3aWxsIHRyaWdnZXIgaWY6XG4gICAgICogLSBhIG5ldyBlbW9qaSByZWFjdGlvbiBpcyBhZGRlZCB0byBhIG1lc3NhZ2VcbiAgICAgKiAtIGEgbmV3IGN1c3RvbSBlbW9qaSByZWFjdGlvbiBpcyBhZGRlZCBhIG1lc3NhZ2VcbiAgICAgKlxuICAgICAqIGBib3QucmVhY3Rpb25gIHdpbGwgbm90IHRyaWdnZXIgaWY6XG4gICAgICogLSBhIHJlYWN0aW9uIGlzIHJlbW92ZWRcbiAgICAgKiAtIGFuIGFub255bW91cyByZWFjdGlvbiBjb3VudCBpcyB1cGRhdGVkLCBzdWNoIGFzIG9uIGNoYW5uZWwgcG9zdHNcbiAgICAgKiAtIGBtZXNzYWdlX3JlYWN0aW9uYCB1cGRhdGVzIGFyZSBub3QgZW5hYmxlZCBmb3IgeW91ciBib3RcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFjdGlvbiBUaGUgcmVhY3Rpb24gdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIHJlYWN0aW9uKFxuICAgICAgICByZWFjdGlvbjogTWF5YmVBcnJheTxSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdIHwgUmVhY3Rpb25UeXBlPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8UmVhY3Rpb25NaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPFJlYWN0aW9uQ29udGV4dDxDPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoQ29udGV4dC5oYXMucmVhY3Rpb24ocmVhY3Rpb24pLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIGZvciBjZXJ0YWluIGNoYXQgdHlwZXMgb25seS4gRm9yIGV4YW1wbGUsIHlvdVxuICAgICAqIGNhbiB1c2UgdGhpcyBtZXRob2QgdG8gb25seSByZWNlaXZlIHVwZGF0ZXMgZnJvbSBwcml2YXRlIGNoYXRzLiBUaGUgZm91clxuICAgICAqIGNoYXQgdHlwZXMgYXJlIGBcImNoYW5uZWxcImAsIGBcInN1cGVyZ3JvdXBcImAsIGBcImdyb3VwXCJgLCBhbmQgYFwicHJpdmF0ZVwiYC5cbiAgICAgKiBUaGlzIGlzIGVzcGVjaWFsbHkgdXNlZnVsIHdoZW4gY29tYmluZWQgd2l0aCBvdGhlciBmaWx0ZXJpbmcgbG9naWMuIEZvclxuICAgICAqIGV4YW1wbGUsIHRoaXMgaXMgaG93IGNhbiB5b3UgcmVzcG9uZCB0byBgL3N0YXJ0YCBjb21tYW5kcyBvbmx5IGZyb21cbiAgICAgKiBwcml2YXRlIGNoYXRzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90LmNoYXRUeXBlKFwicHJpdmF0ZVwiKS5jb21tYW5kKFwic3RhcnRcIiwgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBOYXR1cmFsbHksIHlvdSBjYW4gYWxzbyB1c2UgdGhpcyBtZXRob2Qgb24gaXRzIG93bi5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFByaXZhdGUgY2hhdHMgb25seVxuICAgICAqIGJvdC5jaGF0VHlwZShcInByaXZhdGVcIiwgY3R4ID0+IHsgLi4uIH0pO1xuICAgICAqIC8vIENoYW5uZWxzIG9ubHlcbiAgICAgKiBib3QuY2hhdFR5cGUoXCJjaGFubmVsXCIsIGN0eCA9PiB7IC4uLiB9KTtcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFlvdSBjYW4gcGFzcyBhbiBhcnJheSBvZiBjaGF0IHR5cGVzIGlmIHlvdSB3YW50IHlvdXIgbWlkZGxld2FyZSB0byBydW5cbiAgICAgKiBmb3IgYW55IG9mIHNldmVyYWwgcHJvdmlkZWQgY2hhdCB0eXBlcy5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIEdyb3VwcyBhbmQgc3VwZXJncm91cHMgb25seVxuICAgICAqIGJvdC5jaGF0VHlwZShbXCJncm91cFwiLCBcInN1cGVyZ3JvdXBcIl0sIGN0eCA9PiB7IC4uLiB9KTtcbiAgICAgKiBgYGBcbiAgICAgKiBbUmVtZW1iZXJdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9jb250ZXh0I3Nob3J0Y3V0cykgYWxzbyB0aGF0IHlvdVxuICAgICAqIGNhbiBhY2Nlc3MgdGhlIGNoYXQgdHlwZSB2aWEgYGN0eC5jaGF0LnR5cGVgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRUeXBlIFRoZSBjaGF0IHR5cGVcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGNoYXRUeXBlPFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4oXG4gICAgICAgIGNoYXRUeXBlOiBNYXliZUFycmF5PFQ+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPENoYXRUeXBlQ29udGV4dDxDLCBUPj4+XG4gICAgKTogQ29tcG9zZXI8Q2hhdFR5cGVDb250ZXh0PEMsIFQ+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5jaGF0VHlwZShjaGF0VHlwZSksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgZm9yIGNhbGxiYWNrIHF1ZXJpZXMsIGkuZS4gdGhlIHVwZGF0ZXMgdGhhdFxuICAgICAqIFRlbGVncmFtIGRlbGl2ZXJzIHRvIHlvdXIgYm90IHdoZW4gYSB1c2VyIGNsaWNrcyBhbiBpbmxpbmUgYnV0dG9uICh0aGF0XG4gICAgICogaXMgYSBidXR0b24gdW5kZXIgYSBtZXNzYWdlKS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIGNhbGxpbmdcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignY2FsbGJhY2tfcXVlcnk6ZGF0YScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqIGJ1dCBpdCBhbHNvIGFsbG93cyB5b3UgdG8gbWF0Y2ggdGhlIHF1ZXJ5IGRhdGEgYWdhaW5zdCBhIGdpdmVuIHRleHQgb3JcbiAgICAgKiByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIENyZWF0ZSBhbiBpbmxpbmUga2V5Ym9hcmRcbiAgICAgKiBjb25zdCBrZXlib2FyZCA9IG5ldyBJbmxpbmVLZXlib2FyZCgpLnRleHQoJ0dvIScsICdidXR0b24tcGF5bG9hZCcpXG4gICAgICogLy8gU2VuZCBhIG1lc3NhZ2Ugd2l0aCB0aGUga2V5Ym9hcmRcbiAgICAgKiBhd2FpdCBib3QuYXBpLnNlbmRNZXNzYWdlKGNoYXRfaWQsICdQcmVzcyBhIGJ1dHRvbiEnLCB7XG4gICAgICogICByZXBseV9tYXJrdXA6IGtleWJvYXJkXG4gICAgICogfSlcbiAgICAgKiAvLyBMaXN0ZW4gdG8gdXNlcnMgcHJlc3NpbmcgYnV0dG9ucyB3aXRoIHRoYXQgc3BlY2lmaWMgcGF5bG9hZFxuICAgICAqIGJvdC5jYWxsYmFja1F1ZXJ5KCdidXR0b24tcGF5bG9hZCcsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqXG4gICAgICogLy8gTGlzdGVuIHRvIHVzZXJzIHByZXNzaW5nIGFueSBidXR0b24geW91ciBib3QgZXZlciBzZW50XG4gICAgICogYm90Lm9uKCdjYWxsYmFja19xdWVyeTpkYXRhJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBBbHdheXMgcmVtZW1iZXIgdG8gY2FsbCBgYW5zd2VyQ2FsbGJhY2tRdWVyeWDigJRldmVuIGlmIHlvdSBkb24ndCBwZXJmb3JtXG4gICAgICogYW55IGFjdGlvbjogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJjYWxsYmFja3F1ZXJ5XG4gICAgICogYGBgdHNcbiAgICAgKiBib3Qub24oJ2NhbGxiYWNrX3F1ZXJ5OmRhdGEnLCBhc3luYyBjdHggPT4ge1xuICAgICAqICAgYXdhaXQgY3R4LmFuc3dlckNhbGxiYWNrUXVlcnkoKVxuICAgICAqIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBZb3UgY2FuIHBhc3MgYW4gYXJyYXkgb2YgdHJpZ2dlcnMuIFlvdXIgbWlkZGxld2FyZSB3aWxsIGJlIGV4ZWN1dGVkIGlmIGF0XG4gICAgICogbGVhc3Qgb25lIG9mIHRoZW0gbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgdG8gbG9vayBmb3IgaW4gdGhlIHBheWxvYWRcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGNhbGxiYWNrUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8Q2FsbGJhY2tRdWVyeU1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8Q2FsbGJhY2tRdWVyeUNvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLmNhbGxiYWNrUXVlcnkodHJpZ2dlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgZm9yIGdhbWUgcXVlcmllcywgaS5lLiB0aGUgdXBkYXRlcyB0aGF0XG4gICAgICogVGVsZWdyYW0gZGVsaXZlcnMgdG8geW91ciBib3Qgd2hlbiBhIHVzZXIgY2xpY2tzIGFuIGlubGluZSBidXR0b24gZm9yIHRoZVxuICAgICAqIEhUTUw1IGdhbWVzIHBsYXRmb3JtIG9uIFRlbGVncmFtLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgZXNzZW50aWFsbHkgdGhlIHNhbWUgYXMgY2FsbGluZ1xuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdjYWxsYmFja19xdWVyeTpnYW1lX3Nob3J0X25hbWUnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKiBidXQgaXQgYWxzbyBhbGxvd3MgeW91IHRvIG1hdGNoIHRoZSBxdWVyeSBkYXRhIGFnYWluc3QgYSBnaXZlbiB0ZXh0IG9yXG4gICAgICogcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIHRyaWdnZXJzLiBZb3VyIG1pZGRsZXdhcmUgd2lsbCBiZSBleGVjdXRlZCBpZiBhdFxuICAgICAqIGxlYXN0IG9uZSBvZiB0aGVtIG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIHRvIGxvb2sgZm9yIGluIHRoZSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBnYW1lUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8R2FtZVF1ZXJ5TWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxHYW1lUXVlcnlDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5nYW1lUXVlcnkodHJpZ2dlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGZvciBpbmxpbmUgcXVlcmllcy4gVGVsZWdyYW0gc2VuZHMgYW4gaW5saW5lIHF1ZXJ5XG4gICAgICogdG8geW91ciBib3Qgd2hlbmV2ZXIgYSB1c2VyIHR5cGVzIOKAnEB5b3VyX2JvdF9uYW1lIC4uLuKAnSBpbnRvIGEgdGV4dCBmaWVsZFxuICAgICAqIGluIFRlbGVncmFtLiBZb3UgYm90IHdpbGwgdGhlbiByZWNlaXZlIHRoZSBlbnRlcmVkIHNlYXJjaCBxdWVyeSBhbmQgY2FuXG4gICAgICogcmVzcG9uZCB3aXRoIGEgbnVtYmVyIG9mIHJlc3VsdHMgKHRleHQsIGltYWdlcywgZXRjKSB0aGF0IHRoZSB1c2VyIGNhblxuICAgICAqIHBpY2sgZnJvbSB0byBzZW5kIGEgbWVzc2FnZSBfdmlhXyB5b3VyIGJvdCB0byB0aGUgcmVzcGVjdGl2ZSBjaGF0LiBDaGVja1xuICAgICAqIG91dCBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvaW5saW5lIHRvIHJlYWQgbW9yZSBhYm91dCBpbmxpbmUgYm90cy5cbiAgICAgKlxuICAgICAqID4gTm90ZSB0aGF0IHlvdSBoYXZlIHRvIGVuYWJsZSBpbmxpbmUgbW9kZSBmb3IgeW91IGJvdCBieSBjb250YWN0aW5nXG4gICAgICogPiBAQm90RmF0aGVyIGZpcnN0LlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBMaXN0ZW4gZm9yIHVzZXJzIHR5cGluZyDigJxAeW91cl9ib3RfbmFtZSBxdWVyeeKAnVxuICAgICAqIGJvdC5pbmxpbmVRdWVyeSgncXVlcnknLCBhc3luYyBjdHggPT4ge1xuICAgICAqICAgLy8gQW5zd2VyIHRoZSBpbmxpbmUgcXVlcnksIGNvbmZlciBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcmlubGluZXF1ZXJ5XG4gICAgICogICBhd2FpdCBjdHguYW5zd2VySW5saW5lUXVlcnkoIC4uLiApXG4gICAgICogfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBpbmxpbmUgcXVlcnkgdGV4dCB0byBtYXRjaFxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgaW5saW5lUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8SW5saW5lUXVlcnlNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPElubGluZVF1ZXJ5Q29udGV4dDxDPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoQ29udGV4dC5oYXMuaW5saW5lUXVlcnkodHJpZ2dlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGZvciB0aGUgQ2hvc2VuSW5saW5lUmVzdWx0IGJ5IHRoZSBnaXZlbiBpZCBvciBpZHMuXG4gICAgICogQ2hvc2VuSW5saW5lUmVzdWx0IHJlcHJlc2VudHMgYSByZXN1bHQgb2YgYW4gaW5saW5lIHF1ZXJ5IHRoYXQgd2FzIGNob3NlblxuICAgICAqIGJ5IHRoZSB1c2VyIGFuZCBzZW50IHRvIHRoZWlyIGNoYXQgcGFydG5lci4gQ2hlY2sgb3V0XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjaG9zZW5pbmxpbmVyZXN1bHQgdG8gcmVhZCBtb3JlIGFib3V0XG4gICAgICogY2hvc2VuIGlubGluZSByZXN1bHRzLlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBib3QuY2hvc2VuSW5saW5lUmVzdWx0KCdpZCcsIGFzeW5jIGN0eCA9PiB7XG4gICAgICogICBjb25zdCBpZCA9IGN0eC5yZXN1bHRfaWQ7XG4gICAgICogICAvLyBZb3VyIGNvZGVcbiAgICAgKiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc3VsdElkIEFuIGlkIG9yIGFycmF5IG9mIGlkc1xuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgY2hvc2VuSW5saW5lUmVzdWx0KFxuICAgICAgICByZXN1bHRJZDogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxDaG9zZW5JbmxpbmVSZXN1bHRNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPENob3NlbklubGluZVJlc3VsdENvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKFxuICAgICAgICAgICAgQ29udGV4dC5oYXMuY2hvc2VuSW5saW5lUmVzdWx0KHJlc3VsdElkKSxcbiAgICAgICAgICAgIC4uLm1pZGRsZXdhcmUsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIG1pZGRsZXdhcmUgZm9yIHByZS1jaGVja291dCBxdWVyaWVzLiBUZWxlZ3JhbSBzZW5kcyBhXG4gICAgICogcHJlLWNoZWNrb3V0IHF1ZXJ5IHRvIHlvdXIgYm90IHdoZW5ldmVyIGEgdXNlciBoYXMgY29uZmlybWVkIHRoZWlyXG4gICAgICogcGF5bWVudCBhbmQgc2hpcHBpbmcgZGV0YWlscy4gWW91IGJvdCB3aWxsIHRoZW4gcmVjZWl2ZSBhbGwgaW5mb3JtYXRpb25cbiAgICAgKiBhYm91dCB0aGUgb3JkZXIgYW5kIGhhcyB0byByZXNwb25kIHdpdGhpbiAxMCBzZWNvbmRzIHdpdGggYSBjb25maXJtYXRpb25cbiAgICAgKiBvZiB3aGV0aGVyIGV2ZXJ5dGhpbmcgaXMgYWxyaWdodCAoZ29vZHMgYXJlIGF2YWlsYWJsZSwgZXRjLikgYW5kIHRoZSBib3RcbiAgICAgKiBpcyByZWFkeSB0byBwcm9jZWVkIHdpdGggdGhlIG9yZGVyLiBDaGVjayBvdXRcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3ByZWNoZWNrb3V0cXVlcnkgdG8gcmVhZCBtb3JlIGFib3V0XG4gICAgICogcHJlLWNoZWNrb3V0IHF1ZXJpZXMuXG4gICAgICpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5wcmVDaGVja291dFF1ZXJ5KCdpbnZvaWNlX3BheWxvYWQnLCBhc3luYyBjdHggPT4ge1xuICAgICAqICAgLy8gQW5zd2VyIHRoZSBwcmUtY2hlY2tvdXQgcXVlcnksIGNvbmZlciBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcnByZWNoZWNrb3V0cXVlcnlcbiAgICAgKiAgIGF3YWl0IGN0eC5hbnN3ZXJQcmVDaGVja291dFF1ZXJ5KCAuLi4gKVxuICAgICAqIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIHRvIGxvb2sgZm9yIGluIHRoZSBpbnZvaWNlIHBheWxvYWRcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIHByZUNoZWNrb3V0UXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8UHJlQ2hlY2tvdXRRdWVyeU1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8UHJlQ2hlY2tvdXRRdWVyeUNvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKFxuICAgICAgICAgICAgQ29udGV4dC5oYXMucHJlQ2hlY2tvdXRRdWVyeSh0cmlnZ2VyKSxcbiAgICAgICAgICAgIC4uLm1pZGRsZXdhcmUsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIG1pZGRsZXdhcmUgZm9yIHNoaXBwaW5nIHF1ZXJpZXMuIElmIHlvdSBzZW50IGFuIGludm9pY2VcbiAgICAgKiByZXF1ZXN0aW5nIGEgc2hpcHBpbmcgYWRkcmVzcyBhbmQgdGhlIHBhcmFtZXRlciBfaXNfZmxleGlibGVfIHdhc1xuICAgICAqIHNwZWNpZmllZCwgVGVsZWdyYW0gd2lsbCBzZW5kIGEgc2hpcHBpbmcgcXVlcnkgdG8geW91ciBib3Qgd2hlbmV2ZXIgYVxuICAgICAqIHVzZXIgaGFzIGNvbmZpcm1lZCB0aGVpciBzaGlwcGluZyBkZXRhaWxzLiBZb3UgYm90IHdpbGwgdGhlbiByZWNlaXZlIHRoZVxuICAgICAqIHNoaXBwaW5nIGluZm9ybWF0aW9uIGFuZCBjYW4gcmVzcG9uZCB3aXRoIGEgY29uZmlybWF0aW9uIG9mIHdoZXRoZXJcbiAgICAgKiBkZWxpdmVyeSB0byB0aGUgc3BlY2lmaWVkIGFkZHJlc3MgaXMgcG9zc2libGUuIENoZWNrIG91dFxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2hpcHBpbmdxdWVyeSB0byByZWFkIG1vcmUgYWJvdXRcbiAgICAgKiBzaGlwcGluZyBxdWVyaWVzLlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBib3Quc2hpcHBpbmdRdWVyeSgnaW52b2ljZV9wYXlsb2FkJywgYXN5bmMgY3R4ID0+IHtcbiAgICAgKiAgIC8vIEFuc3dlciB0aGUgc2hpcHBpbmcgcXVlcnksIGNvbmZlciBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcnNoaXBwaW5ncXVlcnlcbiAgICAgKiAgIGF3YWl0IGN0eC5hbnN3ZXJTaGlwcGluZ1F1ZXJ5KCAuLi4gKVxuICAgICAqIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIHRvIGxvb2sgZm9yIGluIHRoZSBpbnZvaWNlIHBheWxvYWRcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIHNoaXBwaW5nUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8U2hpcHBpbmdRdWVyeU1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8U2hpcHBpbmdRdWVyeUNvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLnNoaXBwaW5nUXVlcnkodHJpZ2dlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqID4gVGhpcyBpcyBhbiBhZHZhbmNlZCBtZXRob2Qgb2YgZ3JhbW1ZLlxuICAgICAqXG4gICAgICogUmVnaXN0ZXJzIG1pZGRsZXdhcmUgYmVoaW5kIGEgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiB0aGF0IG9wZXJhdGVzIG9uIHRoZVxuICAgICAqIGNvbnRleHQgb2JqZWN0IGFuZCBkZWNpZGVzIHdoZXRoZXIgb3Igbm90IHRvIGV4ZWN1dGUgdGhlIG1pZGRsZXdhcmUuIEluXG4gICAgICogb3RoZXIgd29yZHMsIHRoZSBtaWRkbGV3YXJlIHdpbGwgb25seSBiZSBleGVjdXRlZCBpZiB0aGUgZ2l2ZW4gcHJlZGljYXRlXG4gICAgICogcmV0dXJucyBgdHJ1ZWAgZm9yIHRoZSBnaXZlbiBjb250ZXh0IG9iamVjdC4gT3RoZXJ3aXNlLCBpdCB3aWxsIGJlXG4gICAgICogc2tpcHBlZCBhbmQgdGhlIG5leHQgbWlkZGxld2FyZSB3aWxsIGJlIGV4ZWN1dGVkLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaGFzIHR3byBzaWduYXR1cmVzLiBUaGUgZmlyc3Qgb25lIGlzIHN0cmFpZ2h0Zm9yd2FyZCwgaXQgaXNcbiAgICAgKiB0aGUgb25lIGRlc2NyaWJlZCBhYm92ZS4gTm90ZSB0aGF0IHRoZSBwcmVkaWNhdGUgbWF5IGJlIGFzeW5jaHJvbm91cyxcbiAgICAgKiBpLmUuIGl0IGNhbiByZXR1cm4gYSBQcm9taXNlIG9mIGEgYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gcGFzcyBhIGZ1bmN0aW9uIHRoYXQgaGFzIGEgdHlwZSBwcmVkaWNhdGUgYXNcbiAgICAgKiByZXR1cm4gdHlwZS4gVGhpcyB3aWxsIGFsbG93IHlvdSB0byBuYXJyb3cgZG93biB0aGUgY29udGV4dCBvYmplY3QuIFRoZVxuICAgICAqIGluc3RhbGxlZCBtaWRkbGV3YXJlIGlzIHRoZW4gYWJsZSB0byBvcGVyYXRlIG9uIHRoaXMgY29uc3RyYWluZWQgY29udGV4dFxuICAgICAqIG9iamVjdC5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIE5PUk1BTCBVU0FHRVxuICAgICAqIC8vIE9ubHkgcHJvY2VzcyBldmVyeSBzZWNvbmQgdXBkYXRlXG4gICAgICogYm90LmZpbHRlcihjdHggPT4gY3R4LnVwZGF0ZS51cGRhdGVfaWQgJSAyID09PSAwLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIFRZUEUgUFJFRElDQVRFIFVTQUdFXG4gICAgICogZnVuY3Rpb24gcHJlZGljYXRlKGN0eCk6IGN0eCBpcyBDb250ZXh0ICYgeyBtZXNzYWdlOiB1bmRlZmluZWQgfSB7XG4gICAgICogICByZXR1cm4gY3R4Lm1lc3NhZ2UgPT09IHVuZGVmaW5lZFxuICAgICAqIH1cbiAgICAgKiAvLyBPbmx5IHByb2Nlc3MgdXBkYXRlcyB3aGVyZSBgbWVzc2FnZWAgaXMgYHVuZGVmaW5lZGBcbiAgICAgKiBib3QuZmlsdGVyKHByZWRpY2F0ZSwgY3R4ID0+IHtcbiAgICAgKiAgIGNvbnN0IG0gPSBjdHgubWVzc2FnZSAvLyBpbmZlcnJlZCBhcyBhbHdheXMgdW5kZWZpbmVkIVxuICAgICAqICAgY29uc3QgbTIgPSBjdHgudXBkYXRlLm1lc3NhZ2UgLy8gYWxzbyBpbmZlcnJlZCBhcyBhbHdheXMgdW5kZWZpbmVkIVxuICAgICAqIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJlZGljYXRlIFRoZSBwcmVkaWNhdGUgdG8gY2hlY2tcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGZpbHRlcjxEIGV4dGVuZHMgQz4oXG4gICAgICAgIHByZWRpY2F0ZTogKGN0eDogQykgPT4gY3R4IGlzIEQsXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PE1pZGRsZXdhcmU8RD4+XG4gICAgKTogQ29tcG9zZXI8RD47XG4gICAgZmlsdGVyKFxuICAgICAgICBwcmVkaWNhdGU6IChjdHg6IEMpID0+IE1heWJlUHJvbWlzZTxib29sZWFuPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxDPjtcbiAgICBmaWx0ZXIoXG4gICAgICAgIHByZWRpY2F0ZTogKGN0eDogQykgPT4gTWF5YmVQcm9taXNlPGJvb2xlYW4+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+PlxuICAgICkge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlciguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgdGhpcy5icmFuY2gocHJlZGljYXRlLCBjb21wb3NlciwgcGFzcyk7XG4gICAgICAgIHJldHVybiBjb21wb3NlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGJlaGluZCBhIGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb24gdGhhdCBvcGVyYXRlcyBvbiB0aGVcbiAgICAgKiBjb250ZXh0IG9iamVjdCBhbmQgZGVjaWRlcyB3aGV0aGVyIG9yIG5vdCB0byBleGVjdXRlIHRoZSBtaWRkbGV3YXJlLiBJblxuICAgICAqIG90aGVyIHdvcmRzLCB0aGUgbWlkZGxld2FyZSB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgaWYgdGhlIGdpdmVuIHByZWRpY2F0ZVxuICAgICAqIHJldHVybnMgYGZhbHNlYCBmb3IgdGhlIGdpdmVuIGNvbnRleHQgb2JqZWN0LiBPdGhlcndpc2UsIGl0IHdpbGwgYmVcbiAgICAgKiBza2lwcGVkIGFuZCB0aGUgbmV4dCBtaWRkbGV3YXJlIHdpbGwgYmUgZXhlY3V0ZWQuIE5vdGUgdGhhdCB0aGUgcHJlZGljYXRlXG4gICAgICogbWF5IGJlIGFzeW5jaHJvbm91cywgaS5lLiBpdCBjYW4gcmV0dXJuIGEgUHJvbWlzZSBvZiBhIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyB0aGUgc2FtZSB1c2luZyBgZmlsdGVyYCAobm9ybWFsIHVzYWdlKSB3aXRoIGEgbmVnYXRlZFxuICAgICAqIHByZWRpY2F0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmVkaWNhdGUgVGhlIHByZWRpY2F0ZSB0byBjaGVja1xuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgZHJvcChcbiAgICAgICAgcHJlZGljYXRlOiAoY3R4OiBDKSA9PiBNYXliZVByb21pc2U8Ym9vbGVhbj4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PE1pZGRsZXdhcmU8Qz4+XG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihcbiAgICAgICAgICAgIGFzeW5jIChjdHg6IEMpID0+ICEoYXdhaXQgcHJlZGljYXRlKGN0eCkpLFxuICAgICAgICAgICAgLi4ubWlkZGxld2FyZSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgdGhhdCBydW5zIGNvbmN1cnJlbnRseSB0byB0aGUgZXhlY3V0aW5nXG4gICAgICogbWlkZGxld2FyZSBzdGFjay5cbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC51c2UoIC4uLiApIC8vIHdpbGwgcnVuIGZpcnN0XG4gICAgICogYm90LmZvcmsoIC4uLiApIC8vIHdpbGwgYmUgc3RhcnRlZCBzZWNvbmQsIGJ1dCBydW4gY29uY3VycmVudGx5XG4gICAgICogYm90LnVzZSggLi4uICkgLy8gd2lsbCBhbHNvIGJlIHJ1biBzZWNvbmRcbiAgICAgKiBgYGBcbiAgICAgKiBJbiB0aGUgZmlyc3QgbWlkZGxld2FyZSwgYXMgc29vbiBhcyBgbmV4dGAncyBQcm9taXNlIHJlc29sdmVzLCBib3RoIGZvcmtzXG4gICAgICogaGF2ZSBjb21wbGV0ZWQuXG4gICAgICpcbiAgICAgKiBCb3RoIHRoZSBmb3JrIGFuZCB0aGUgZG93bnN0cmVhbSBtaWRkbGV3YXJlIGFyZSBhd2FpdGVkIHdpdGhcbiAgICAgKiBgUHJvbWlzZS5hbGxgLCBzbyB5b3Ugd2lsbCBvbmx5IGJlIHRvIGNhdGNoIHVwIHRvIG9uZSBlcnJvciAodGhlIG9uZSB0aGF0XG4gICAgICogaXMgdGhyb3duIGZpcnN0KS5cbiAgICAgKlxuICAgICAqIEluIG9wcG9zaXRlIHRvIHRoZSBvdGhlciBtaWRkbGV3YXJlIG1ldGhvZHMgb24gY29tcG9zZXIsIGBmb3JrYCBkb2VzIG5vdFxuICAgICAqIHJldHVybiBzaW1wbHkgcmV0dXJuIHRoZSBjb21wb3NlciBjb25uZWN0ZWQgdG8gdGhlIG1haW4gbWlkZGxld2FyZSBzdGFjay5cbiAgICAgKiBJbnN0ZWFkLCBpdCByZXR1cm5zIHRoZSBjcmVhdGVkIGNvbXBvc2VyIF9vZiB0aGUgZm9ya18gY29ubmVjdGVkIHRvIHRoZVxuICAgICAqIG1pZGRsZXdhcmUgc3RhY2suIFRoaXMgYWxsb3dzIGZvciB0aGUgZm9sbG93aW5nIHBhdHRlcm4uXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBNaWRkbGV3YXJlIHdpbGwgYmUgcnVuIGNvbmN1cnJlbnRseSFcbiAgICAgKiBib3QuZm9yaygpLm9uKCdtZXNzYWdlJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byBydW4gY29uY3VycmVudGx5XG4gICAgICovXG4gICAgZm9yayguLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+Pikge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlciguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgY29uc3QgZm9yayA9IGZsYXR0ZW4oY29tcG9zZXIpO1xuICAgICAgICB0aGlzLnVzZSgoY3R4LCBuZXh0KSA9PiBQcm9taXNlLmFsbChbbmV4dCgpLCBydW4oZm9yaywgY3R4KV0pKTtcbiAgICAgICAgcmV0dXJuIGNvbXBvc2VyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqID4gVGhpcyBpcyBhbiBhZHZhbmNlZCBtZXRob2Qgb2YgZ3JhbW1ZLlxuICAgICAqXG4gICAgICogRXhlY3V0ZXMgc29tZSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIGdlbmVyYXRlZCBvbiB0aGUgZmx5IGZvciBlYWNoXG4gICAgICogY29udGV4dC4gUGFzcyBhIGZhY3RvcnkgZnVuY3Rpb24gdGhhdCBjcmVhdGVzIHNvbWUgbWlkZGxld2FyZSAob3IgYVxuICAgICAqIG1pZGRsZXdhcmUgYXJyYXkgZXZlbikuIFRoZSBmYWN0b3J5IGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIG9uY2UgcGVyXG4gICAgICogY29udGV4dCwgYW5kIGl0cyByZXN1bHQgd2lsbCBiZSBleGVjdXRlZCB3aXRoIHRoZSBjb250ZXh0IG9iamVjdC5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFRoZSBtaWRkbGV3YXJlIHJldHVybmVkIGJ5IGBjcmVhdGVNeU1pZGRsZXdhcmVgIHdpbGwgYmUgdXNlZCBvbmx5IG9uY2VcbiAgICAgKiBib3QubGF6eShjdHggPT4gY3JlYXRlTXlNaWRkbGV3YXJlKGN0eCkpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBZb3UgbWF5IGdlbmVyYXRlIHRoaXMgbWlkZGxld2FyZSBpbiBhbiBgYXN5bmNgIGZhc2hpb24uXG4gICAgICpcbiAgICAgKiBZb3UgY2FuIGRlY2lkZSB0byByZXR1cm4gYW4gZW1wdHkgYXJyYXkgKGBbXWApIGlmIHlvdSBkb24ndCB3YW50IHRvIHJ1blxuICAgICAqIGFueSBtaWRkbGV3YXJlIGZvciBhIGdpdmVuIGNvbnRleHQgb2JqZWN0LiBUaGlzIGlzIGVxdWl2YWxlbnQgdG9cbiAgICAgKiByZXR1cm5pbmcgYW4gZW1wdHkgaW5zdGFuY2Ugb2YgYENvbXBvc2VyYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlRmFjdG9yeSBUaGUgZmFjdG9yeSBmdW5jdGlvbiBjcmVhdGluZyB0aGUgbWlkZGxld2FyZVxuICAgICAqL1xuICAgIGxhenkoXG4gICAgICAgIG1pZGRsZXdhcmVGYWN0b3J5OiAoY3R4OiBDKSA9PiBNYXliZVByb21pc2U8TWF5YmVBcnJheTxNaWRkbGV3YXJlPEM+Pj4sXG4gICAgKTogQ29tcG9zZXI8Qz4ge1xuICAgICAgICByZXR1cm4gdGhpcy51c2UoYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWlkZGxld2FyZSA9IGF3YWl0IG1pZGRsZXdhcmVGYWN0b3J5KGN0eCk7XG4gICAgICAgICAgICBjb25zdCBhcnIgPSBBcnJheS5pc0FycmF5KG1pZGRsZXdhcmUpID8gbWlkZGxld2FyZSA6IFttaWRkbGV3YXJlXTtcbiAgICAgICAgICAgIGF3YWl0IGZsYXR0ZW4obmV3IENvbXBvc2VyKC4uLmFycikpKGN0eCwgbmV4dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqID4gVGhpcyBpcyBhbiBhZHZhbmNlZCBtZXRob2Qgb2YgZ3JhbW1ZLlxuICAgICAqXG4gICAgICogX05vdCB0byBiZSBjb25mdXNlZCB3aXRoIHRoZSBgcm91dGVyYCBwbHVnaW4uX1xuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgYW4gYWx0ZXJuYXRpdmUgdG8gdGhlIGByb3V0ZXJgIHBsdWdpbi4gSXQgYWxsb3dzIHlvdSB0b1xuICAgICAqIGJyYW5jaCBiZXR3ZWVuIGRpZmZlcmVudCBtaWRkbGV3YXJlIHBlciBjb250ZXh0IG9iamVjdC4gWW91IGNhbiBwYXNzIHR3b1xuICAgICAqIHRoaW5ncyB0byBpdDpcbiAgICAgKiAxLiBBIHJvdXRpbmcgZnVuY3Rpb25cbiAgICAgKiAyLiBEaWZmZXJlbnQgbWlkZGxld2FyZSBpZGVudGlmaWVkIGJ5IGtleVxuICAgICAqXG4gICAgICogVGhlIHJvdXRpbmcgZnVuY3Rpb24gZGVjaWRlcyBiYXNlZCBvbiB0aGUgY29udGV4dCBvYmplY3Qgd2hpY2ggbWlkZGxld2FyZVxuICAgICAqIHRvIHJ1bi4gRWFjaCBtaWRkbGV3YXJlIGlzIGlkZW50aWZpZWQgYnkgYSBrZXksIHNvIHRoZSByb3V0aW5nIGZ1bmN0aW9uXG4gICAgICogc2ltcGx5IHJldHVybnMgdGhlIGtleSBvZiB0aGF0IG1pZGRsZXdhcmUuXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBEZWZpbmUgZGlmZmVyZW50IHJvdXRlIGhhbmRsZXJzXG4gICAgICogY29uc3Qgcm91dGVIYW5kbGVycyA9IHtcbiAgICAgKiAgIGV2ZW5VcGRhdGVzOiAoY3R4OiBDb250ZXh0KSA9PiB7IC4uLiB9XG4gICAgICogICBvZGRVcGRhdGVzOiAoY3R4OiBDb250ZXh0KSA9PiB7IC4uLiB9XG4gICAgICogfVxuICAgICAqIC8vIERlY2lkZSBmb3IgYSBjb250ZXh0IG9iamVjdCB3aGljaCBvbmUgdG8gcGlja1xuICAgICAqIGNvbnN0IHJvdXRlciA9IChjdHg6IENvbnRleHQpID0+IGN0eC51cGRhdGUudXBkYXRlX2lkICUgMiA9PT0gMFxuICAgICAqICAgPyAnZXZlblVwZGF0ZXMnXG4gICAgICogICA6ICdvZGRVcGRhdGVzJ1xuICAgICAqIC8vIFJvdXRlIGl0IVxuICAgICAqIGJvdC5yb3V0ZShyb3V0ZXIsIHJvdXRlSGFuZGxlcnMpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBPcHRpb25hbGx5LCB5b3UgY2FuIHBhc3MgYSB0aGlyZCBvcHRpb24gdGhhdCBpcyB1c2VkIGFzIGZhbGxiYWNrXG4gICAgICogbWlkZGxld2FyZSBpZiB5b3VyIHJvdXRlIGZ1bmN0aW9uIHJldHVybnMgYHVuZGVmaW5lZGAsIG9yIGlmIHRoZSBrZXlcbiAgICAgKiByZXR1cm5lZCBieSB5b3VyIHJvdXRlciBoYXMgbm8gbWlkZGxld2FyZSBhc3NvY2lhdGVkIHdpdGggaXQuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBtYXkgbmVlZCBsZXNzIHNldHVwIHRoYW4gZmlyc3QgaW5zdGFudGlhdGluZyBhIGBSb3V0ZXJgLCBidXRcbiAgICAgKiBmb3IgbW9yZSBjb21wbGV4IHNldHVwcywgaGF2aW5nIGEgYFJvdXRlcmAgbWF5IGJlIG1vcmUgcmVhZGFibGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcm91dGVyIFRoZSByb3V0aW5nIGZ1bmN0aW9uIHRvIHVzZVxuICAgICAqIEBwYXJhbSByb3V0ZUhhbmRsZXJzIEhhbmRsZXJzIGZvciBldmVyeSByb3V0ZVxuICAgICAqIEBwYXJhbSBmYWxsYmFjayBPcHRpb25hbCBmYWxsYmFjayBtaWRkbGV3YXJlIGlmIG5vIHJvdXRlIG1hdGNoZXNcbiAgICAgKi9cbiAgICByb3V0ZTxSIGV4dGVuZHMgUmVjb3JkPFByb3BlcnR5S2V5LCBNaWRkbGV3YXJlPEM+Pj4oXG4gICAgICAgIHJvdXRlcjogKGN0eDogQykgPT4gTWF5YmVQcm9taXNlPHVuZGVmaW5lZCB8IGtleW9mIFI+LFxuICAgICAgICByb3V0ZUhhbmRsZXJzOiBSLFxuICAgICAgICBmYWxsYmFjazogTWlkZGxld2FyZTxDPiA9IHBhc3MsXG4gICAgKTogQ29tcG9zZXI8Qz4ge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXp5KGFzeW5jIChjdHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJvdXRlID0gYXdhaXQgcm91dGVyKGN0eCk7XG4gICAgICAgICAgICByZXR1cm4gKHJvdXRlID09PSB1bmRlZmluZWQgfHwgIXJvdXRlSGFuZGxlcnNbcm91dGVdXG4gICAgICAgICAgICAgICAgPyBmYWxsYmFja1xuICAgICAgICAgICAgICAgIDogcm91dGVIYW5kbGVyc1tyb3V0ZV0pID8/IFtdO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIEFsbG93cyB5b3UgdG8gYnJhbmNoIGJldHdlZW4gdHdvIGNhc2VzIGZvciBhIGdpdmVuIGNvbnRleHQgb2JqZWN0LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgdGFrZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBpcyB0ZXN0ZWQgb25jZSBwZXIgY29udGV4dFxuICAgICAqIG9iamVjdC4gSWYgaXQgcmV0dXJucyBgdHJ1ZWAsIHRoZSBmaXJzdCBzdXBwbGllZCBtaWRkbGV3YXJlIGlzIGV4ZWN1dGVkLlxuICAgICAqIElmIGl0IHJldHVybnMgYGZhbHNlYCwgdGhlIHNlY29uZCBzdXBwbGllZCBtaWRkbGV3YXJlIGlzIGV4ZWN1dGVkLiBOb3RlXG4gICAgICogdGhhdCB0aGUgcHJlZGljYXRlIG1heSBiZSBhc3luY2hyb25vdXMsIGkuZS4gaXQgY2FuIHJldHVybiBhIFByb21pc2Ugb2YgYVxuICAgICAqIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJlZGljYXRlIFRoZSBwcmVkaWNhdGUgdG8gY2hlY2tcbiAgICAgKiBAcGFyYW0gdHJ1ZU1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgZm9yIHRoZSBgdHJ1ZWAgY2FzZVxuICAgICAqIEBwYXJhbSBmYWxzZU1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgZm9yIHRoZSBgZmFsc2VgIGNhc2VcbiAgICAgKi9cbiAgICBicmFuY2goXG4gICAgICAgIHByZWRpY2F0ZTogKGN0eDogQykgPT4gTWF5YmVQcm9taXNlPGJvb2xlYW4+LFxuICAgICAgICB0cnVlTWlkZGxld2FyZTogTWF5YmVBcnJheTxNaWRkbGV3YXJlPEM+PixcbiAgICAgICAgZmFsc2VNaWRkbGV3YXJlOiBNYXliZUFycmF5PE1pZGRsZXdhcmU8Qz4+LFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5sYXp5KGFzeW5jIChjdHgpID0+XG4gICAgICAgICAgICAoYXdhaXQgcHJlZGljYXRlKGN0eCkpID8gdHJ1ZU1pZGRsZXdhcmUgOiBmYWxzZU1pZGRsZXdhcmVcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgZnVuY3Rpb24gb2YgZ3JhbW1ZLlxuICAgICAqXG4gICAgICogSW5zdGFsbHMgYW4gZXJyb3IgYm91bmRhcnkgdGhhdCBjYXRjaGVzIGVycm9ycyB0aGF0IGhhcHBlbiBvbmx5IGluc2lkZVxuICAgICAqIHRoZSBnaXZlbiBtaWRkbGV3YXJlLiBUaGlzIGFsbG93cyB5b3UgdG8gaW5zdGFsbCBjdXN0b20gZXJyb3IgaGFuZGxlcnNcbiAgICAgKiB0aGF0IHByb3RlY3Qgc29tZSBwYXJ0cyBvZiB5b3VyIGJvdC4gRXJyb3JzIHdpbGwgbm90IGJlIGFibGUgdG8gYnViYmxlXG4gICAgICogb3V0IG9mIHRoaXMgcGFydCBvZiB5b3VyIG1pZGRsZXdhcmUgc3lzdGVtLCB1bmxlc3MgdGhlIHN1cHBsaWVkIGVycm9yXG4gICAgICogaGFuZGxlciByZXRocm93cyB0aGVtLCBpbiB3aGljaCBjYXNlIHRoZSBuZXh0IHN1cnJvdW5kaW5nIGVycm9yIGJvdW5kYXJ5XG4gICAgICogd2lsbCBjYXRjaCB0aGUgZXJyb3IuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlIHVzYWdlOlxuICAgICAqIGBgYHRzXG4gICAgICogZnVuY3Rpb24gZXJySGFuZGxlcihlcnI6IEJvdEVycm9yKSB7XG4gICAgICogICBjb25zb2xlLmVycm9yKCdFcnJvciBib3VuZGFyeSBjYXVnaHQgZXJyb3IhJywgZXJyKVxuICAgICAqIH1cbiAgICAgKlxuICAgICAqIGNvbnN0IHNhZmUgPVxuICAgICAqICAgLy8gQWxsIHBhc3NlZCBtaWRkbGV3YXJlIHdpbGwgYmUgcHJvdGVjdGVkIGJ5IHRoZSBlcnJvciBib3VuZGFyeS5cbiAgICAgKiAgIGJvdC5lcnJvckJvdW5kYXJ5KGVyckhhbmRsZXIsIG1pZGRsZXdhcmUwLCBtaWRkbGV3YXJlMSwgbWlkZGxld2FyZTIpXG4gICAgICpcbiAgICAgKiAvLyBUaG9zZSB3aWxsIGFsc28gYmUgcHJvdGVjdGVkIVxuICAgICAqIHNhZmUub24oJ21lc3NhZ2UnLCBtaWRkbGV3YXJlMylcbiAgICAgKlxuICAgICAqIC8vIE5vIGVycm9yIGZyb20gYG1pZGRsZXdhcmU0YCB3aWxsIHJlYWNoIHRoZSBgZXJySGFuZGxlcmAgZnJvbSBhYm92ZSxcbiAgICAgKiAvLyBhcyBlcnJvcnMgYXJlIHN1cHByZXNzZWQuXG4gICAgICpcbiAgICAgKiAvLyBkbyBub3RoaW5nIG9uIGVycm9yIChzdXBwcmVzcyBlcnJvciksIGFuZCBydW4gb3V0c2lkZSBtaWRkbGV3YXJlXG4gICAgICogY29uc3Qgc3VwcHJlc3MgPSAoX2VycjogQm90RXJyb3IsIG5leHQ6IE5leHRGdW5jdGlvbikgPT4geyByZXR1cm4gbmV4dCgpIH1cbiAgICAgKiBzYWZlLmVycm9yQm91bmRhcnkoc3VwcHJlc3MpLm9uKCdlZGl0ZWRfbWVzc2FnZScsIG1pZGRsZXdhcmU0KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQ2hlY2sgb3V0IHRoZVxuICAgICAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvZ3VpZGUvZXJyb3JzI2Vycm9yLWJvdW5kYXJpZXMpIG9uXG4gICAgICogdGhlIHdlYnNpdGUgdG8gbGVhcm4gbW9yZSBhYm91dCBlcnJvciBib3VuZGFyaWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVycm9ySGFuZGxlciBUaGUgZXJyb3IgaGFuZGxlciB0byB1c2VcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byBwcm90ZWN0XG4gICAgICovXG4gICAgZXJyb3JCb3VuZGFyeShcbiAgICAgICAgZXJyb3JIYW5kbGVyOiAoXG4gICAgICAgICAgICBlcnJvcjogQm90RXJyb3I8Qz4sXG4gICAgICAgICAgICBuZXh0OiBOZXh0RnVuY3Rpb24sXG4gICAgICAgICkgPT4gTWF5YmVQcm9taXNlPHVua25vd24+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+PlxuICAgICkge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlcjxDPiguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgY29uc3QgYm91bmQgPSBmbGF0dGVuKGNvbXBvc2VyKTtcbiAgICAgICAgdGhpcy51c2UoYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgbGV0IG5leHRDYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnQgPSAoKSA9PiAoKG5leHRDYWxsZWQgPSB0cnVlKSwgUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBib3VuZChjdHgsIGNvbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dENhbGxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGF3YWl0IGVycm9ySGFuZGxlcihuZXcgQm90RXJyb3I8Qz4oZXJyLCBjdHgpLCBjb250KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXh0Q2FsbGVkKSBhd2FpdCBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29tcG9zZXI7XG4gICAgfVxufVxuXG4vLyA9PT0gRmlsdGVyZWQgY29udGV4dCBtaWRkbGV3YXJlIHR5cGVzXG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QuaGVhcnNgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gYW5ub3RhdGUgbWlkZGxld2FyZSBmdW5jdGlvbnMgdGhhdCBhcmVcbiAqIGRlZmluZWQgaW4gb25lIHBsYWNlLCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgY29ycmVjdCB0eXBlIHdoZW4gcGFzc2VkIHRvXG4gKiBgYm90LmhlYXJzYCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZSBtb2R1bGFyXG4gKiBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBIZWFyc01pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBIZWFyc0NvbnRleHQ8Qz5cbj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QuY29tbWFuZGAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuY29tbWFuZGAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yIG1vcmVcbiAqIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWFuZE1pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBDb21tYW5kQ29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5yZWFjdGlvbmAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QucmVhY3Rpb25gIGluIGEgZGlmZmVyZW50IHBsYWNlLiBGb3IgaW5zdGFuY2UsIHRoaXMgYWxsb3dzIGZvciBtb3JlXG4gKiBtb2R1bGFyIGNvZGUgd2hlcmUgaGFuZGxlcnMgYXJlIGRlZmluZWQgaW4gc2VwYXJhdGUgZmlsZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlYWN0aW9uTWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIFJlYWN0aW9uQ29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5jYWxsYmFja1F1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5jYWxsYmFja1F1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBDYWxsYmFja1F1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIENhbGxiYWNrUXVlcnlDb250ZXh0PEM+XG4+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgYm90LmdhbWVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuZ2FtZVF1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBHYW1lUXVlcnlNaWRkbGV3YXJlPEMgZXh0ZW5kcyBDb250ZXh0PiA9IE1pZGRsZXdhcmU8XG4gICAgR2FtZVF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5pbmxpbmVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuaW5saW5lUXVlcnlgIGluIGEgZGlmZmVyZW50IHBsYWNlLiBGb3IgaW5zdGFuY2UsIHRoaXMgYWxsb3dzIGZvciBtb3JlXG4gKiBtb2R1bGFyIGNvZGUgd2hlcmUgaGFuZGxlcnMgYXJlIGRlZmluZWQgaW4gc2VwYXJhdGUgZmlsZXMuXG4gKi9cbmV4cG9ydCB0eXBlIElubGluZVF1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIElubGluZVF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5jaG9zZW5JbmxpbmVSZXN1bHRgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gYW5ub3RhdGUgbWlkZGxld2FyZSBmdW5jdGlvbnMgdGhhdCBhcmVcbiAqIGRlZmluZWQgaW4gb25lIHBsYWNlLCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgY29ycmVjdCB0eXBlIHdoZW4gcGFzc2VkIHRvXG4gKiBgYm90LmNob3NlbklubGluZVJlc3VsdGAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yXG4gKiBtb3JlIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIENob3NlbklubGluZVJlc3VsdENvbnRleHQ8Qz5cbj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yXG4gKiBtb3JlIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgUHJlQ2hlY2tvdXRRdWVyeU1pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBQcmVDaGVja291dFF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5zaGlwcGluZ1F1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5zaGlwcGluZ1F1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBTaGlwcGluZ1F1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIFNoaXBwaW5nUXVlcnlDb250ZXh0PEM+XG4+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgYm90LmNoYXRUeXBlYC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5jaGF0VHlwZWAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yIG1vcmVcbiAqIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hhdFR5cGVNaWRkbGV3YXJlPEMgZXh0ZW5kcyBDb250ZXh0LCBUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+ID1cbiAgICBNaWRkbGV3YXJlPENoYXRUeXBlQ29udGV4dDxDLCBUPj47XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FLSSxPQUFPLFFBU0osZUFBZTtBQW9GdEIsd0JBQXdCO0FBQ3hCOzs7O0NBSUMsR0FDRCxPQUFPLE1BQU0saUJBQThDOzs7RUFDdkQsWUFBWSxBQUFnQixLQUFjLEVBQUUsQUFBZ0IsR0FBTSxDQUFFO0lBQ2hFLEtBQUssQ0FBQyx3QkFBd0I7U0FETixRQUFBO1NBQWdDLE1BQUE7SUFFeEQsSUFBSSxDQUFDLElBQUksR0FBRztJQUNaLElBQUksaUJBQWlCLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEtBQUs7RUFDeEQ7QUFDSjtBQUNBLFNBQVMsd0JBQXdCLEtBQWM7RUFDM0MsSUFBSTtFQUNKLElBQUksaUJBQWlCLE9BQU87SUFDeEIsTUFBTSxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxPQUFPLENBQUMsQ0FBQztFQUN6RCxPQUFPO0lBQ0gsTUFBTSxPQUFPLE9BQU87SUFDcEIsTUFBTSxDQUFDLHdCQUF3QixFQUFFLEtBQUsscUJBQXFCLENBQUM7SUFDNUQsT0FBUTtNQUNKLEtBQUs7TUFDTCxLQUFLO01BQ0wsS0FBSztNQUNMLEtBQUs7UUFDRCxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQztRQUNuQjtNQUNKLEtBQUs7UUFDRCxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sT0FBTyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDNUM7TUFDSjtRQUNJLE9BQU87UUFDUDtJQUNSO0VBQ0o7RUFDQSxPQUFPO0FBQ1g7QUFFQSxnQ0FBZ0M7QUFDaEMsU0FBUyxRQUEyQixFQUFpQjtFQUNqRCxPQUFPLE9BQU8sT0FBTyxhQUNmLEtBQ0EsQ0FBQyxLQUFLLE9BQVMsR0FBRyxVQUFVLEdBQUcsS0FBSztBQUM5QztBQUNBLFNBQVMsT0FDTCxLQUFzQixFQUN0QixPQUF3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