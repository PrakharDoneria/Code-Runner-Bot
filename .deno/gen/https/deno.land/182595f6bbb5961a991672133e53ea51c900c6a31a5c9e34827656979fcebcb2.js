// deno-lint-ignore-file camelcase
import { matchFilter } from "./filter.ts";
const checker = {
  filterQuery (filter) {
    const pred = matchFilter(filter);
    return (ctx)=>pred(ctx);
  },
  text (trigger) {
    const hasText = checker.filterQuery([
      ":text",
      ":caption"
    ]);
    const trg = triggerFn(trigger);
    return (ctx)=>{
      if (!hasText(ctx)) return false;
      const msg = ctx.message ?? ctx.channelPost;
      const txt = msg.text ?? msg.caption;
      return match(ctx, txt, trg);
    };
  },
  command (command) {
    const hasEntities = checker.filterQuery(":entities:bot_command");
    const atCommands = new Set();
    const noAtCommands = new Set();
    toArray(command).forEach((cmd)=>{
      if (cmd.startsWith("/")) {
        throw new Error(`Do not include '/' when registering command handlers (use '${cmd.substring(1)}' not '${cmd}')`);
      }
      const set = cmd.includes("@") ? atCommands : noAtCommands;
      set.add(cmd);
    });
    return (ctx)=>{
      if (!hasEntities(ctx)) return false;
      const msg = ctx.message ?? ctx.channelPost;
      const txt = msg.text ?? msg.caption;
      return msg.entities.some((e)=>{
        if (e.type !== "bot_command") return false;
        if (e.offset !== 0) return false;
        const cmd = txt.substring(1, e.length);
        if (noAtCommands.has(cmd) || atCommands.has(cmd)) {
          ctx.match = txt.substring(cmd.length + 1).trimStart();
          return true;
        }
        const index = cmd.indexOf("@");
        if (index === -1) return false;
        const atTarget = cmd.substring(index + 1).toLowerCase();
        const username = ctx.me.username.toLowerCase();
        if (atTarget !== username) return false;
        const atCommand = cmd.substring(0, index);
        if (noAtCommands.has(atCommand)) {
          ctx.match = txt.substring(cmd.length + 1).trimStart();
          return true;
        }
        return false;
      });
    };
  },
  reaction (reaction) {
    const hasMessageReaction = checker.filterQuery("message_reaction");
    const normalized = typeof reaction === "string" ? [
      {
        type: "emoji",
        emoji: reaction
      }
    ] : (Array.isArray(reaction) ? reaction : [
      reaction
    ]).map((emoji)=>typeof emoji === "string" ? {
        type: "emoji",
        emoji
      } : emoji);
    const emoji = new Set(normalized.filter((r)=>r.type === "emoji").map((r)=>r.emoji));
    const customEmoji = new Set(normalized.filter((r)=>r.type === "custom_emoji").map((r)=>r.custom_emoji_id));
    const paid = normalized.some((r)=>r.type === "paid");
    return (ctx)=>{
      if (!hasMessageReaction(ctx)) return false;
      const { old_reaction, new_reaction } = ctx.messageReaction;
      // try to find a wanted reaction that is new and not old
      for (const reaction of new_reaction){
        // first check if the reaction existed previously
        let isOld = false;
        if (reaction.type === "emoji") {
          for (const old of old_reaction){
            if (old.type !== "emoji") continue;
            if (old.emoji === reaction.emoji) {
              isOld = true;
              break;
            }
          }
        } else if (reaction.type === "custom_emoji") {
          for (const old of old_reaction){
            if (old.type !== "custom_emoji") continue;
            if (old.custom_emoji_id === reaction.custom_emoji_id) {
              isOld = true;
              break;
            }
          }
        } else if (reaction.type === "paid") {
          for (const old of old_reaction){
            if (old.type !== "paid") continue;
            isOld = true;
            break;
          }
        } else {
        // always regard unsupported emoji types as new
        }
        // disregard reaction if it is not new
        if (isOld) continue;
        // check if the new reaction is wanted and short-circuit
        if (reaction.type === "emoji") {
          if (emoji.has(reaction.emoji)) return true;
        } else if (reaction.type === "custom_emoji") {
          if (customEmoji.has(reaction.custom_emoji_id)) return true;
        } else if (reaction.type === "paid") {
          if (paid) return true;
        } else {
          // always regard unsupported emoji types as new
          return true;
        }
      // new reaction not wanted, check next one
      }
      return false;
    };
  },
  chatType (chatType) {
    const set = new Set(toArray(chatType));
    return (ctx)=>ctx.chat?.type !== undefined && set.has(ctx.chat.type);
  },
  callbackQuery (trigger) {
    const hasCallbackQuery = checker.filterQuery("callback_query:data");
    const trg = triggerFn(trigger);
    return (ctx)=>hasCallbackQuery(ctx) && match(ctx, ctx.callbackQuery.data, trg);
  },
  gameQuery (trigger) {
    const hasGameQuery = checker.filterQuery("callback_query:game_short_name");
    const trg = triggerFn(trigger);
    return (ctx)=>hasGameQuery(ctx) && match(ctx, ctx.callbackQuery.game_short_name, trg);
  },
  inlineQuery (trigger) {
    const hasInlineQuery = checker.filterQuery("inline_query");
    const trg = triggerFn(trigger);
    return (ctx)=>hasInlineQuery(ctx) && match(ctx, ctx.inlineQuery.query, trg);
  },
  chosenInlineResult (trigger) {
    const hasChosenInlineResult = checker.filterQuery("chosen_inline_result");
    const trg = triggerFn(trigger);
    return (ctx)=>hasChosenInlineResult(ctx) && match(ctx, ctx.chosenInlineResult.result_id, trg);
  },
  preCheckoutQuery (trigger) {
    const hasPreCheckoutQuery = checker.filterQuery("pre_checkout_query");
    const trg = triggerFn(trigger);
    return (ctx)=>hasPreCheckoutQuery(ctx) && match(ctx, ctx.preCheckoutQuery.invoice_payload, trg);
  },
  shippingQuery (trigger) {
    const hasShippingQuery = checker.filterQuery("shipping_query");
    const trg = triggerFn(trigger);
    return (ctx)=>hasShippingQuery(ctx) && match(ctx, ctx.shippingQuery.invoice_payload, trg);
  }
};
// === Context class
/**
 * When your bot receives a message, Telegram sends an update object to your
 * bot. The update contains information about the chat, the user, and of course
 * the message itself. There are numerous other updates, too:
 * https://core.telegram.org/bots/api#update
 *
 * When grammY receives an update, it wraps this update into a context object
 * for you. Context objects are commonly named `ctx`. A context object does two
 * things:
 * 1. **`ctx.update`** holds the update object that you can use to process the
 *    message. This includes providing useful shortcuts for the update, for
 *    instance, `ctx.msg` is a shortcut that gives you the message object from
 *    the update—no matter whether it is contained in `ctx.update.message`, or
 *    `ctx.update.edited_message`, or `ctx.update.channel_post`, or
 *    `ctx.update.edited_channel_post`.
 * 2. **`ctx.api`** gives you access to the full Telegram Bot API so that you
 *    can directly call any method, such as responding via
 *    `ctx.api.sendMessage`. Also here, the context objects has some useful
 *    shortcuts for you. For instance, if you want to send a message to the same
 *    chat that a message comes from (i.e. just respond to a user) you can call
 *    `ctx.reply`. This is nothing but a wrapper for `ctx.api.sendMessage` with
 *    the right `chat_id` pre-filled for you. Almost all methods of the Telegram
 *    Bot API have their own shortcut directly on the context object, so you
 *    probably never really have to use `ctx.api` at all.
 *
 * This context object is then passed to all of the listeners (called
 * middleware) that you register on your bot. Because this is so useful, the
 * context object is often used to hold more information. One example are
 * sessions (a chat-specific data storage that is stored in a database), and
 * another example is `ctx.match` that is used by `bot.command` and other
 * methods to keep information about how a regular expression was matched.
 *
 * Read up about middleware on the
 * [website](https://grammy.dev/guide/context) if you want to know more
 * about the powerful opportunities that lie in context objects, and about how
 * grammY implements them.
 */ export class Context {
  update;
  api;
  me;
  /**
     * Used by some middleware to store information about how a certain string
     * or regular expression was matched.
     */ match;
  constructor(/**
         * The update object that is contained in the context.
         */ update, /**
         * An API instance that allows you to call any method of the Telegram
         * Bot API.
         */ api, /**
         * Information about the bot itself.
         */ me){
    this.update = update;
    this.api = api;
    this.me = me;
  }
  // UPDATE SHORTCUTS
  // Keep in sync with types in `filter.ts`.
  /** Alias for `ctx.update.message` */ get message() {
    return this.update.message;
  }
  /** Alias for `ctx.update.edited_message` */ get editedMessage() {
    return this.update.edited_message;
  }
  /** Alias for `ctx.update.channel_post` */ get channelPost() {
    return this.update.channel_post;
  }
  /** Alias for `ctx.update.edited_channel_post` */ get editedChannelPost() {
    return this.update.edited_channel_post;
  }
  /** Alias for `ctx.update.business_connection` */ get businessConnection() {
    return this.update.business_connection;
  }
  /** Alias for `ctx.update.business_message` */ get businessMessage() {
    return this.update.business_message;
  }
  /** Alias for `ctx.update.edited_business_message` */ get editedBusinessMessage() {
    return this.update.edited_business_message;
  }
  /** Alias for `ctx.update.deleted_business_messages` */ get deletedBusinessMessages() {
    return this.update.deleted_business_messages;
  }
  /** Alias for `ctx.update.message_reaction` */ get messageReaction() {
    return this.update.message_reaction;
  }
  /** Alias for `ctx.update.message_reaction_count` */ get messageReactionCount() {
    return this.update.message_reaction_count;
  }
  /** Alias for `ctx.update.inline_query` */ get inlineQuery() {
    return this.update.inline_query;
  }
  /** Alias for `ctx.update.chosen_inline_result` */ get chosenInlineResult() {
    return this.update.chosen_inline_result;
  }
  /** Alias for `ctx.update.callback_query` */ get callbackQuery() {
    return this.update.callback_query;
  }
  /** Alias for `ctx.update.shipping_query` */ get shippingQuery() {
    return this.update.shipping_query;
  }
  /** Alias for `ctx.update.pre_checkout_query` */ get preCheckoutQuery() {
    return this.update.pre_checkout_query;
  }
  /** Alias for `ctx.update.poll` */ get poll() {
    return this.update.poll;
  }
  /** Alias for `ctx.update.poll_answer` */ get pollAnswer() {
    return this.update.poll_answer;
  }
  /** Alias for `ctx.update.my_chat_member` */ get myChatMember() {
    return this.update.my_chat_member;
  }
  /** Alias for `ctx.update.chat_member` */ get chatMember() {
    return this.update.chat_member;
  }
  /** Alias for `ctx.update.chat_join_request` */ get chatJoinRequest() {
    return this.update.chat_join_request;
  }
  /** Alias for `ctx.update.chat_boost` */ get chatBoost() {
    return this.update.chat_boost;
  }
  /** Alias for `ctx.update.removed_chat_boost` */ get removedChatBoost() {
    return this.update.removed_chat_boost;
  }
  /** Alias for `ctx.update.purchased_paid_media` */ get purchasedPaidMedia() {
    return this.update.purchased_paid_media;
  }
  // AGGREGATION SHORTCUTS
  /**
     * Get the message object from wherever possible. Alias for `this.message ??
     * this.editedMessage ?? this.channelPost ?? this.editedChannelPost ??
     * this.businessMessage ?? this.editedBusinessMessage ??
     * this.callbackQuery?.message`.
     */ get msg() {
    // Keep in sync with types in `filter.ts`.
    return this.message ?? this.editedMessage ?? this.channelPost ?? this.editedChannelPost ?? this.businessMessage ?? this.editedBusinessMessage ?? this.callbackQuery?.message;
  }
  /**
     * Get the chat object from wherever possible. Alias for `(this.msg ??
     * this.deletedBusinessMessages ?? this.messageReaction ??
     * this.messageReactionCount ?? this.myChatMember ??  this.chatMember ??
     * this.chatJoinRequest ?? this.chatBoost ??  this.removedChatBoost)?.chat`.
     */ get chat() {
    // Keep in sync with types in `filter.ts`.
    return (this.msg ?? this.deletedBusinessMessages ?? this.messageReaction ?? this.messageReactionCount ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest ?? this.chatBoost ?? this.removedChatBoost)?.chat;
  }
  /**
     * Get the sender chat object from wherever possible. Alias for
     * `ctx.msg?.sender_chat`.
     */ get senderChat() {
    // Keep in sync with types in `filter.ts`.
    return this.msg?.sender_chat;
  }
  /**
     * Get the user object from wherever possible. Alias for
     * `(this.businessConnection ?? this.messageReaction ??
     * (this.chatBoost?.boost ?? this.removedChatBoost)?.source)?.user ??
     * (this.callbackQuery ?? this.msg ?? this.inlineQuery ??
     * this.chosenInlineResult ?? this.shippingQuery ?? this.preCheckoutQuery ??
     * this.myChatMember ?? this.chatMember ?? this.chatJoinRequest ??
     * this.purchasedPaidMedia)?.from`.
     */ get from() {
    // Keep in sync with types in `filter.ts`.
    return (this.businessConnection ?? this.messageReaction ?? (this.chatBoost?.boost ?? this.removedChatBoost)?.source)?.user ?? (this.callbackQuery ?? this.msg ?? this.inlineQuery ?? this.chosenInlineResult ?? this.shippingQuery ?? this.preCheckoutQuery ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest ?? this.purchasedPaidMedia)?.from;
  }
  /**
     * Get the message identifier from wherever possible. Alias for
     * `this.msg?.message_id ?? this.messageReaction?.message_id ??
     * this.messageReactionCount?.message_id`.
     */ get msgId() {
    // Keep in sync with types in `filter.ts`.
    return this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id;
  }
  /**
     * Gets the chat identifier from wherever possible. Alias for `this.chat?.id
     * ?? this.businessConnection?.user_chat_id`.
     */ get chatId() {
    // Keep in sync with types in `filter.ts`.
    return this.chat?.id ?? this.businessConnection?.user_chat_id;
  }
  /**
     * Get the inline message identifier from wherever possible. Alias for
     * `(ctx.callbackQuery ?? ctx.chosenInlineResult)?.inline_message_id`.
     */ get inlineMessageId() {
    return this.callbackQuery?.inline_message_id ?? this.chosenInlineResult?.inline_message_id;
  }
  /**
     * Get the business connection identifier from wherever possible. Alias for
     * `this.msg?.business_connection_id ?? this.businessConnection?.id ??
     * this.deletedBusinessMessages?.business_connection_id`.
     */ get businessConnectionId() {
    return this.msg?.business_connection_id ?? this.businessConnection?.id ?? this.deletedBusinessMessages?.business_connection_id;
  }
  entities(types) {
    const message = this.msg;
    if (message === undefined) return [];
    const text = message.text ?? message.caption;
    if (text === undefined) return [];
    let entities = message.entities ?? message.caption_entities;
    if (entities === undefined) return [];
    if (types !== undefined) {
      const filters = new Set(toArray(types));
      entities = entities.filter((entity)=>filters.has(entity.type));
    }
    return entities.map((entity)=>({
        ...entity,
        text: text.substring(entity.offset, entity.offset + entity.length)
      }));
  }
  /**
     * Find out which reactions were added and removed in a `message_reaction`
     * update. This method looks at `ctx.messageReaction` and computes the
     * difference between the old reaction and the new reaction. It also groups
     * the reactions by emoji reactions and custom emoji reactions. For example,
     * the resulting object could look like this:
     * ```ts
     * {
     *   emoji: ['👍', '🎉']
     *   emojiAdded: ['🎉'],
     *   emojiKept: ['👍'],
     *   emojiRemoved: [],
     *   customEmoji: [],
     *   customEmojiAdded: [],
     *   customEmojiKept: [],
     *   customEmojiRemoved: ['id0123'],
     *   paid: true,
     *   paidAdded: false,
     *   paidRemoved: false,
     * }
     * ```
     * In the above example, a tada reaction was added by the user, and a custom
     * emoji reaction with the custom emoji 'id0123' was removed in the same
     * update. The user had already reacted with a thumbs up reaction and a paid
     * star reaction, which they left both unchanged. As a result, the current
     * reaction by the user is thumbs up, tada, and a paid reaction. Note that
     * the current reaction (all emoji reactions regardless of type in one list)
     * can also be obtained from `ctx.messageReaction.new_reaction`.
     *
     * Remember that reaction updates only include information about the
     * reaction of a specific user. The respective message may have many more
     * reactions by other people which will not be included in this update.
     *
     * @returns An object containing information about the reaction update
     */ reactions() {
    const emoji = [];
    const emojiAdded = [];
    const emojiKept = [];
    const emojiRemoved = [];
    const customEmoji = [];
    const customEmojiAdded = [];
    const customEmojiKept = [];
    const customEmojiRemoved = [];
    let paid = false;
    let paidAdded = false;
    const r = this.messageReaction;
    if (r !== undefined) {
      const { old_reaction, new_reaction } = r;
      // group all current emoji in `emoji` and `customEmoji`
      for (const reaction of new_reaction){
        if (reaction.type === "emoji") {
          emoji.push(reaction.emoji);
        } else if (reaction.type === "custom_emoji") {
          customEmoji.push(reaction.custom_emoji_id);
        } else if (reaction.type === "paid") {
          paid = paidAdded = true;
        }
      }
      // temporarily move all old emoji to the *Removed arrays
      for (const reaction of old_reaction){
        if (reaction.type === "emoji") {
          emojiRemoved.push(reaction.emoji);
        } else if (reaction.type === "custom_emoji") {
          customEmojiRemoved.push(reaction.custom_emoji_id);
        } else if (reaction.type === "paid") {
          paidAdded = false;
        }
      }
      // temporarily move all new emoji to the *Added arrays
      emojiAdded.push(...emoji);
      customEmojiAdded.push(...customEmoji);
      // drop common emoji from both lists and add them to `emojiKept`
      for(let i = 0; i < emojiRemoved.length; i++){
        const len = emojiAdded.length;
        if (len === 0) break;
        const rem = emojiRemoved[i];
        for(let j = 0; j < len; j++){
          if (rem === emojiAdded[j]) {
            emojiKept.push(rem);
            emojiRemoved.splice(i, 1);
            emojiAdded.splice(j, 1);
            i--;
            break;
          }
        }
      }
      // drop common custom emoji from both lists and add them to `customEmojiKept`
      for(let i = 0; i < customEmojiRemoved.length; i++){
        const len = customEmojiAdded.length;
        if (len === 0) break;
        const rem = customEmojiRemoved[i];
        for(let j = 0; j < len; j++){
          if (rem === customEmojiAdded[j]) {
            customEmojiKept.push(rem);
            customEmojiRemoved.splice(i, 1);
            customEmojiAdded.splice(j, 1);
            i--;
            break;
          }
        }
      }
    }
    return {
      emoji,
      emojiAdded,
      emojiKept,
      emojiRemoved,
      customEmoji,
      customEmojiAdded,
      customEmojiKept,
      customEmojiRemoved,
      paid,
      paidAdded
    };
  }
  // PROBING SHORTCUTS
  /**
     * `Context.has` is an object that contains a number of useful functions for
     * probing context objects. Each of these functions can generate a predicate
     * function, to which you can pass context objects in order to check if a
     * condition holds for the respective context object.
     *
     * For example, you can call `Context.has.filterQuery(":text")` to generate
     * a predicate function that tests context objects for containing text:
     * ```ts
     * const hasText = Context.has.filterQuery(":text");
     *
     * if (hasText(ctx0)) {} // `ctx0` matches the filter query `:text`
     * if (hasText(ctx1)) {} // `ctx1` matches the filter query `:text`
     * if (hasText(ctx2)) {} // `ctx2` matches the filter query `:text`
     * ```
     * These predicate functions are used internally by the has-methods that are
     * installed on every context object. This means that calling
     * `ctx.has(":text")` is equivalent to
     * `Context.has.filterQuery(":text")(ctx)`.
     */ static has = checker;
  /**
     * Returns `true` if this context object matches the given filter query, and
     * `false` otherwise. This uses the same logic as `bot.on`.
     *
     * @param filter The filter query to check
     */ has(filter) {
    return Context.has.filterQuery(filter)(this);
  }
  /**
     * Returns `true` if this context object contains the given text, or if it
     * contains text that matches the given regular expression. It returns
     * `false` otherwise. This uses the same logic as `bot.hears`.
     *
     * @param trigger The string or regex to match
     */ hasText(trigger) {
    return Context.has.text(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the given command, and
     * `false` otherwise. This uses the same logic as `bot.command`.
     *
     * @param command The command to match
     */ hasCommand(command) {
    return Context.has.command(command)(this);
  }
  hasReaction(reaction) {
    return Context.has.reaction(reaction)(this);
  }
  /**
     * Returns `true` if this context object belongs to a chat with the given
     * chat type, and `false` otherwise. This uses the same logic as
     * `bot.chatType`.
     *
     * @param chatType The chat type to match
     */ hasChatType(chatType) {
    return Context.has.chatType(chatType)(this);
  }
  /**
     * Returns `true` if this context object contains the given callback query,
     * or if the contained callback query data matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.callbackQuery`.
     *
     * @param trigger The string or regex to match
     */ hasCallbackQuery(trigger) {
    return Context.has.callbackQuery(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the given game query, or
     * if the contained game query matches the given regular expression. It
     * returns `false` otherwise. This uses the same logic as `bot.gameQuery`.
     *
     * @param trigger The string or regex to match
     */ hasGameQuery(trigger) {
    return Context.has.gameQuery(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the given inline query, or
     * if the contained inline query matches the given regular expression. It
     * returns `false` otherwise. This uses the same logic as `bot.inlineQuery`.
     *
     * @param trigger The string or regex to match
     */ hasInlineQuery(trigger) {
    return Context.has.inlineQuery(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the chosen inline result,
     * or if the contained chosen inline result matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.chosenInlineResult`.
     *
     * @param trigger The string or regex to match
     */ hasChosenInlineResult(trigger) {
    return Context.has.chosenInlineResult(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the given pre-checkout
     * query, or if the contained pre-checkout query matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.preCheckoutQuery`.
     *
     * @param trigger The string or regex to match
     */ hasPreCheckoutQuery(trigger) {
    return Context.has.preCheckoutQuery(trigger)(this);
  }
  /**
     * Returns `true` if this context object contains the given shipping query,
     * or if the contained shipping query matches the given regular expression.
     * It returns `false` otherwise. This uses the same logic as
     * `bot.shippingQuery`.
     *
     * @param trigger The string or regex to match
     */ hasShippingQuery(trigger) {
    return Context.has.shippingQuery(trigger)(this);
  }
  // API
  /**
     * Context-aware alias for `api.sendMessage`. Use this method to send text messages. On success, the sent Message is returned.
     *
     * @param text Text of the message to be sent, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmessage
     */ reply(text, other, signal) {
    return this.api.sendMessage(orThrow(this.chatId, "sendMessage"), text, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.forwardMessage`. Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessage
     */ forwardMessage(chat_id, other, signal) {
    return this.api.forwardMessage(chat_id, orThrow(this.chatId, "forwardMessage"), orThrow(this.msgId, "forwardMessage"), other, signal);
  }
  /**
     * Context-aware alias for `api.forwardMessages`. Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the current chat to forward. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessages
     */ forwardMessages(chat_id, message_ids, other, signal) {
    return this.api.forwardMessages(chat_id, orThrow(this.chatId, "forwardMessages"), message_ids, other, signal);
  }
  /**
     * Context-aware alias for `api.copyMessage`. Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessage
     */ copyMessage(chat_id, other, signal) {
    return this.api.copyMessage(chat_id, orThrow(this.chatId, "copyMessage"), orThrow(this.msgId, "copyMessage"), other, signal);
  }
  /**
     * Context-aware alias for `api.copyMessages`. Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the current chat to copy. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessages
     */ copyMessages(chat_id, message_ids, other, signal) {
    return this.api.copyMessages(chat_id, orThrow(this.chatId, "copyMessages"), message_ids, other, signal);
  }
  /**
     * Context-aware alias for `api.sendPhoto`. Use this method to send photos. On success, the sent Message is returned.
     *
     * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendphoto
     */ replyWithPhoto(photo, other, signal) {
    return this.api.sendPhoto(orThrow(this.chatId, "sendPhoto"), photo, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendAudio`. Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
     *
     * For sending voice messages, use the sendVoice method instead.
     *
     * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendaudio
     */ replyWithAudio(audio, other, signal) {
    return this.api.sendAudio(orThrow(this.chatId, "sendAudio"), audio, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendDocument`. Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddocument
     */ replyWithDocument(document, other, signal) {
    return this.api.sendDocument(orThrow(this.chatId, "sendDocument"), document, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendVideo`. Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param video Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideo
     */ replyWithVideo(video, other, signal) {
    return this.api.sendVideo(orThrow(this.chatId, "sendVideo"), video, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendAnimation`. Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param animation Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendanimation
     */ replyWithAnimation(animation, other, signal) {
    return this.api.sendAnimation(orThrow(this.chatId, "sendAnimation"), animation, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendVoice`. Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvoice
     */ replyWithVoice(voice, other, signal) {
    return this.api.sendVoice(orThrow(this.chatId, "sendVoice"), voice, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendVideoNote`. Use this method to send video messages. On success, the sent Message is returned.
     * As of v.4.0, Telegram clients support rounded square mp4 videos of up to 1 minute long.
     *
     * @param video_note Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideonote
     */ replyWithVideoNote(video_note, other, signal) {
    return this.api.sendVideoNote(orThrow(this.chatId, "sendVideoNote"), video_note, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendMediaGroup`. Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Messages that were sent is returned.
     *
     * @param media An array describing messages to be sent, must include 2-10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmediagroup
     */ replyWithMediaGroup(media, other, signal) {
    return this.api.sendMediaGroup(orThrow(this.chatId, "sendMediaGroup"), media, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendLocation`. Use this method to send point on the map. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendlocation
     */ replyWithLocation(latitude, longitude, other, signal) {
    return this.api.sendLocation(orThrow(this.chatId, "sendLocation"), latitude, longitude, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.editMessageLiveLocation`. Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocation(latitude, longitude, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.editMessageLiveLocationInline(inlineId, latitude, longitude, other) : this.api.editMessageLiveLocation(orThrow(this.chatId, "editMessageLiveLocation"), orThrow(this.msgId, "editMessageLiveLocation"), latitude, longitude, other, signal);
  }
  /**
     * Context-aware alias for `api.stopMessageLiveLocation`. Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocation(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.stopMessageLiveLocationInline(inlineId, other) : this.api.stopMessageLiveLocation(orThrow(this.chatId, "stopMessageLiveLocation"), orThrow(this.msgId, "stopMessageLiveLocation"), other, signal);
  }
  /**
     * Context-aware alias for `api.sendPaidMedia`. Use this method to send paid media. On success, the sent Message is returned.
     *
     * @param star_count The number of Telegram Stars that must be paid to buy access to the media
     * @param media An array describing the media to be sent; up to 10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpaidmedia
     */ sendPaidMedia(star_count, media, other, signal) {
    return this.api.sendPaidMedia(orThrow(this.chatId, "sendPaidMedia"), star_count, media, other, signal);
  }
  /**
     * Context-aware alias for `api.sendVenue`. Use this method to send information about a venue. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the venue
     * @param longitude Longitude of the venue
     * @param title Name of the venue
     * @param address Address of the venue
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvenue
     */ replyWithVenue(latitude, longitude, title, address, other, signal) {
    return this.api.sendVenue(orThrow(this.chatId, "sendVenue"), latitude, longitude, title, address, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendContact`. Use this method to send phone contacts. On success, the sent Message is returned.
     *
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendcontact
     */ replyWithContact(phone_number, first_name, other, signal) {
    return this.api.sendContact(orThrow(this.chatId, "sendContact"), phone_number, first_name, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendPoll`. Use this method to send a native poll. On success, the sent Message is returned.
     *
     * @param question Poll question, 1-300 characters
     * @param options A list of answer options, 2-10 strings 1-100 characters each
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpoll
     */ replyWithPoll(question, options, other, signal) {
    return this.api.sendPoll(orThrow(this.chatId, "sendPoll"), question, options, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendDice`. Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
     *
     * @param emoji Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, “🎳”, or “🎰”. Dice can have values 1-6 for “🎲”, “🎯” and “🎳”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲”
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */ replyWithDice(emoji, other, signal) {
    return this.api.sendDice(orThrow(this.chatId, "sendDice"), emoji, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.sendChatAction`. Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success.
     *
     * Example: The ImageBot needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use sendChatAction with action = upload_photo. The user will see a “sending photo” status for the bot.
     *
     * We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
     *
     * @param action Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendchataction
     */ replyWithChatAction(action, other, signal) {
    return this.api.sendChatAction(orThrow(this.chatId, "sendChatAction"), action, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Context-aware alias for `api.setMessageReaction`. Use this method to change the chosen reactions on a message. Service messages can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. Bots can't use paid reactions. Returns True on success.
     *
     * @param reaction A list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators. Paid reactions can't be used by bots.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmessagereaction
     */ react(reaction, other, signal) {
    return this.api.setMessageReaction(orThrow(this.chatId, "setMessageReaction"), orThrow(this.msgId, "setMessageReaction"), typeof reaction === "string" ? [
      {
        type: "emoji",
        emoji: reaction
      }
    ] : (Array.isArray(reaction) ? reaction : [
      reaction
    ]).map((emoji)=>typeof emoji === "string" ? {
        type: "emoji",
        emoji
      } : emoji), other, signal);
  }
  /**
     * Context-aware alias for `api.getUserProfilePhotos`. Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserprofilephotos
     */ getUserProfilePhotos(other, signal) {
    return this.api.getUserProfilePhotos(orThrow(this.from, "getUserProfilePhotos").id, other, signal);
  }
  /**
     * Context-aware alias for `api.getUserChatBoosts`. Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
     *
     * @param chat_id Unique identifier for the chat or username of the channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserchatboosts
     */ getUserChatBoosts(chat_id, signal) {
    return this.api.getUserChatBoosts(chat_id, orThrow(this.from, "getUserChatBoosts").id, signal);
  }
  /**
     * Context-aware alias for `api.getBusinessConnection`. Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getbusinessconnection
     */ getBusinessConnection(signal) {
    return this.api.getBusinessConnection(orThrow(this.businessConnectionId, "getBusinessConnection"), signal);
  }
  /**
     * Context-aware alias for `api.getFile`. Use this method to get basic info about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a File object is returned. The file can then be downloaded via the link https://api.telegram.org/file/bot<token>/<file_path>, where <file_path> is taken from the response. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile again.
     *
     * Note: This function may not preserve the original file name and MIME type. You should save the file's MIME type and name (if available) when the File object is received.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getfile
     */ getFile(signal) {
    const m = orThrow(this.msg, "getFile");
    const file = m.photo !== undefined ? m.photo[m.photo.length - 1] : m.animation ?? m.audio ?? m.document ?? m.video ?? m.video_note ?? m.voice ?? m.sticker;
    return this.api.getFile(orThrow(file, "getFile").file_id, signal);
  }
  /** @deprecated Use `banAuthor` instead. */ kickAuthor(...args) {
    return this.banAuthor(...args);
  }
  /**
     * Context-aware alias for `api.banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banAuthor(other, signal) {
    return this.api.banChatMember(orThrow(this.chatId, "banAuthor"), orThrow(this.from, "banAuthor").id, other, signal);
  }
  /** @deprecated Use `banChatMember` instead. */ kickChatMember(...args) {
    return this.banChatMember(...args);
  }
  /**
     * Context-aware alias for `api.banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banChatMember(user_id, other, signal) {
    return this.api.banChatMember(orThrow(this.chatId, "banChatMember"), user_id, other, signal);
  }
  /**
     * Context-aware alias for `api.unbanChatMember`. Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatmember
     */ unbanChatMember(user_id, other, signal) {
    return this.api.unbanChatMember(orThrow(this.chatId, "unbanChatMember"), user_id, other, signal);
  }
  /**
     * Context-aware alias for `api.restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictAuthor(permissions, other, signal) {
    return this.api.restrictChatMember(orThrow(this.chatId, "restrictAuthor"), orThrow(this.from, "restrictAuthor").id, permissions, other, signal);
  }
  /**
     * Context-aware alias for `api.restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictChatMember(user_id, permissions, other, signal) {
    return this.api.restrictChatMember(orThrow(this.chatId, "restrictChatMember"), user_id, permissions, other, signal);
  }
  /**
     * Context-aware alias for `api.promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteAuthor(other, signal) {
    return this.api.promoteChatMember(orThrow(this.chatId, "promoteAuthor"), orThrow(this.from, "promoteAuthor").id, other, signal);
  }
  /**
     * Context-aware alias for `api.promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteChatMember(user_id, other, signal) {
    return this.api.promoteChatMember(orThrow(this.chatId, "promoteChatMember"), user_id, other, signal);
  }
  /**
     * Context-aware alias for `api.setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorAuthorCustomTitle(custom_title, signal) {
    return this.api.setChatAdministratorCustomTitle(orThrow(this.chatId, "setChatAdministratorAuthorCustomTitle"), orThrow(this.from, "setChatAdministratorAuthorCustomTitle").id, custom_title, signal);
  }
  /**
     * Context-aware alias for `api.setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorCustomTitle(user_id, custom_title, signal) {
    return this.api.setChatAdministratorCustomTitle(orThrow(this.chatId, "setChatAdministratorCustomTitle"), user_id, custom_title, signal);
  }
  /**
     * Context-aware alias for `api.banChatSenderChat`. Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatsenderchat
     */ banChatSenderChat(sender_chat_id, signal) {
    return this.api.banChatSenderChat(orThrow(this.chatId, "banChatSenderChat"), sender_chat_id, signal);
  }
  /**
     * Context-aware alias for `api.unbanChatSenderChat`. Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatsenderchat
     */ unbanChatSenderChat(sender_chat_id, signal) {
    return this.api.unbanChatSenderChat(orThrow(this.chatId, "unbanChatSenderChat"), sender_chat_id, signal);
  }
  /**
     * Context-aware alias for `api.setChatPermissions`. Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success.
     *
     * @param permissions New default chat permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatpermissions
     */ setChatPermissions(permissions, other, signal) {
    return this.api.setChatPermissions(orThrow(this.chatId, "setChatPermissions"), permissions, other, signal);
  }
  /**
     * Context-aware alias for `api.exportChatInviteLink`. Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success.
     *
     * Note: Each administrator in a chat generates their own invite links. Bots can't use invite links generated by other administrators. If you want your bot to work with invite links, it will need to generate its own link using exportChatInviteLink or by calling the getChat method. If your bot needs to generate a new primary invite link replacing its previous one, use exportChatInviteLink again.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#exportchatinvitelink
     */ exportChatInviteLink(signal) {
    return this.api.exportChatInviteLink(orThrow(this.chatId, "exportChatInviteLink"), signal);
  }
  /**
     * Context-aware alias for `api.createChatInviteLink`. Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatinvitelink
     */ createChatInviteLink(other, signal) {
    return this.api.createChatInviteLink(orThrow(this.chatId, "createChatInviteLink"), other, signal);
  }
  /**
     * Context-aware alias for `api.editChatInviteLink`. Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatinvitelink
     */ editChatInviteLink(invite_link, other, signal) {
    return this.api.editChatInviteLink(orThrow(this.chatId, "editChatInviteLink"), invite_link, other, signal);
  }
  /**
     * Context-aware alias for `api.createChatSubscriptionInviteLink`. Use this method to create a subscription invite link for a channel chat. The bot must have the can_invite_users administrator rights. The link can be edited using the method editChatSubscriptionInviteLink or revoked using the method revokeChatInviteLink. Returns the new invite link as a ChatInviteLink object.
     *
     * @param subscription_period The number of seconds the subscription will be active for before the next payment. Currently, it must always be 2592000 (30 days).
     * @param subscription_price The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to be a member of the chat; 1-2500
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
     */ createChatSubscriptionInviteLink(subscription_period, subscription_price, other, signal) {
    return this.api.createChatSubscriptionInviteLink(orThrow(this.chatId, "createChatSubscriptionInviteLink"), subscription_period, subscription_price, other, signal);
  }
  /**
     * Context-aware alias for `api.editChatSubscriptionInviteLink`. Use this method to edit a subscription invite link created by the bot. The bot must have the can_invite_users administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
     */ editChatSubscriptionInviteLink(invite_link, other, signal) {
    return this.api.editChatSubscriptionInviteLink(orThrow(this.chatId, "editChatSubscriptionInviteLink"), invite_link, other, signal);
  }
  /**
     * Context-aware alias for `api.revokeChatInviteLink`. Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object.
     *
     * @param invite_link The invite link to revoke
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#revokechatinvitelink
     */ revokeChatInviteLink(invite_link, signal) {
    return this.api.revokeChatInviteLink(orThrow(this.chatId, "editChatInviteLink"), invite_link, signal);
  }
  /**
     * Context-aware alias for `api.approveChatJoinRequest`. Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#approvechatjoinrequest
     */ approveChatJoinRequest(user_id, signal) {
    return this.api.approveChatJoinRequest(orThrow(this.chatId, "approveChatJoinRequest"), user_id, signal);
  }
  /**
     * Context-aware alias for `api.declineChatJoinRequest`. Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#declinechatjoinrequest
     */ declineChatJoinRequest(user_id, signal) {
    return this.api.declineChatJoinRequest(orThrow(this.chatId, "declineChatJoinRequest"), user_id, signal);
  }
  /**
     * Context-aware alias for `api.setChatPhoto`. Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param photo New chat photo, uploaded using multipart/form-data
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatphoto
     */ setChatPhoto(photo, signal) {
    return this.api.setChatPhoto(orThrow(this.chatId, "setChatPhoto"), photo, signal);
  }
  /**
     * Context-aware alias for `api.deleteChatPhoto`. Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatphoto
     */ deleteChatPhoto(signal) {
    return this.api.deleteChatPhoto(orThrow(this.chatId, "deleteChatPhoto"), signal);
  }
  /**
     * Context-aware alias for `api.setChatTitle`. Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param title New chat title, 1-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchattitle
     */ setChatTitle(title, signal) {
    return this.api.setChatTitle(orThrow(this.chatId, "setChatTitle"), title, signal);
  }
  /**
     * Context-aware alias for `api.setChatDescription`. Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param description New chat description, 0-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatdescription
     */ setChatDescription(description, signal) {
    return this.api.setChatDescription(orThrow(this.chatId, "setChatDescription"), description, signal);
  }
  /**
     * Context-aware alias for `api.pinChatMessage`. Use this method to add a message to the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to pin
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#pinchatmessage
     */ pinChatMessage(message_id, other, signal) {
    return this.api.pinChatMessage(orThrow(this.chatId, "pinChatMessage"), message_id, other, signal);
  }
  /**
     * Context-aware alias for `api.unpinChatMessage`. Use this method to remove a message from the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinchatmessage
     */ unpinChatMessage(message_id, signal) {
    return this.api.unpinChatMessage(orThrow(this.chatId, "unpinChatMessage"), message_id, signal);
  }
  /**
     * Context-aware alias for `api.unpinAllChatMessages`. Use this method to clear the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallchatmessages
     */ unpinAllChatMessages(signal) {
    return this.api.unpinAllChatMessages(orThrow(this.chatId, "unpinAllChatMessages"), signal);
  }
  /**
     * Context-aware alias for `api.leaveChat`. Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#leavechat
     */ leaveChat(signal) {
    return this.api.leaveChat(orThrow(this.chatId, "leaveChat"), signal);
  }
  /**
     * Context-aware alias for `api.getChat`. Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.). Returns a Chat object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchat
     */ getChat(signal) {
    return this.api.getChat(orThrow(this.chatId, "getChat"), signal);
  }
  /**
     * Context-aware alias for `api.getChatAdministrators`. Use this method to get a list of administrators in a chat, which aren't bots. Returns an Array of ChatMember objects.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatadministrators
     */ getChatAdministrators(signal) {
    return this.api.getChatAdministrators(orThrow(this.chatId, "getChatAdministrators"), signal);
  }
  /** @deprecated Use `getChatMembersCount` instead. */ getChatMembersCount(...args) {
    return this.getChatMemberCount(...args);
  }
  /**
     * Context-aware alias for `api.getChatMemberCount`. Use this method to get the number of members in a chat. Returns Int on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmembercount
     */ getChatMemberCount(signal) {
    return this.api.getChatMemberCount(orThrow(this.chatId, "getChatMemberCount"), signal);
  }
  /**
     * Context-aware alias for `api.getChatMember`. Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getAuthor(signal) {
    return this.api.getChatMember(orThrow(this.chatId, "getAuthor"), orThrow(this.from, "getAuthor").id, signal);
  }
  /**
     * Context-aware alias for `api.getChatMember`. Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getChatMember(user_id, signal) {
    return this.api.getChatMember(orThrow(this.chatId, "getChatMember"), user_id, signal);
  }
  /**
     * Context-aware alias for `api.setChatStickerSet`. Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param sticker_set_name Name of the sticker set to be set as the group sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatstickerset
     */ setChatStickerSet(sticker_set_name, signal) {
    return this.api.setChatStickerSet(orThrow(this.chatId, "setChatStickerSet"), sticker_set_name, signal);
  }
  /**
     * Context-aware alias for `api.deleteChatStickerSet`. Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatstickerset
     */ deleteChatStickerSet(signal) {
    return this.api.deleteChatStickerSet(orThrow(this.chatId, "deleteChatStickerSet"), signal);
  }
  /**
     * Context-aware alias for `api.createForumTopic`. Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a ForumTopic object.
     *
     * @param name Topic name, 1-128 characters
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createforumtopic
     */ createForumTopic(name, other, signal) {
    return this.api.createForumTopic(orThrow(this.chatId, "createForumTopic"), name, other, signal);
  }
  /**
     * Context-aware alias for `api.editForumTopic`. Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editforumtopic
     */ editForumTopic(other, signal) {
    const message = orThrow(this.msg, "editForumTopic");
    const thread = orThrow(message.message_thread_id, "editForumTopic");
    return this.api.editForumTopic(message.chat.id, thread, other, signal);
  }
  /**
     * Context-aware alias for `api.closeForumTopic`. Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closeforumtopic
     */ closeForumTopic(signal) {
    const message = orThrow(this.msg, "closeForumTopic");
    const thread = orThrow(message.message_thread_id, "closeForumTopic");
    return this.api.closeForumTopic(message.chat.id, thread, signal);
  }
  /**
     * Context-aware alias for `api.reopenForumTopic`. Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopenforumtopic
     */ reopenForumTopic(signal) {
    const message = orThrow(this.msg, "reopenForumTopic");
    const thread = orThrow(message.message_thread_id, "reopenForumTopic");
    return this.api.reopenForumTopic(message.chat.id, thread, signal);
  }
  /**
     * Context-aware alias for `api.deleteForumTopic`. Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deleteforumtopic
     */ deleteForumTopic(signal) {
    const message = orThrow(this.msg, "deleteForumTopic");
    const thread = orThrow(message.message_thread_id, "deleteForumTopic");
    return this.api.deleteForumTopic(message.chat.id, thread, signal);
  }
  /**
     * Context-aware alias for `api.unpinAllForumTopicMessages`. Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallforumtopicmessages
     */ unpinAllForumTopicMessages(signal) {
    const message = orThrow(this.msg, "unpinAllForumTopicMessages");
    const thread = orThrow(message.message_thread_id, "unpinAllForumTopicMessages");
    return this.api.unpinAllForumTopicMessages(message.chat.id, thread, signal);
  }
  /**
     * Context-aware alias for `api.editGeneralForumTopic`. Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param name New topic name, 1-128 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editgeneralforumtopic
     */ editGeneralForumTopic(name, signal) {
    return this.api.editGeneralForumTopic(orThrow(this.chatId, "editGeneralForumTopic"), name, signal);
  }
  /**
     * Context-aware alias for `api.closeGeneralForumTopic`. Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closegeneralforumtopic
     */ closeGeneralForumTopic(signal) {
    return this.api.closeGeneralForumTopic(orThrow(this.chatId, "closeGeneralForumTopic"), signal);
  }
  /**
     * Context-aware alias for `api.reopenGeneralForumTopic`. Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success.     *
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopengeneralforumtopic
     */ reopenGeneralForumTopic(signal) {
    return this.api.reopenGeneralForumTopic(orThrow(this.chatId, "reopenGeneralForumTopic"), signal);
  }
  /**
     * Context-aware alias for `api.hideGeneralForumTopic`. Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#hidegeneralforumtopic
     */ hideGeneralForumTopic(signal) {
    return this.api.hideGeneralForumTopic(orThrow(this.chatId, "hideGeneralForumTopic"), signal);
  }
  /**
     * Context-aware alias for `api.unhideGeneralForumTopic`. Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unhidegeneralforumtopic
     */ unhideGeneralForumTopic(signal) {
    return this.api.unhideGeneralForumTopic(orThrow(this.chatId, "unhideGeneralForumTopic"), signal);
  }
  /**
     * Context-aware alias for `api.unpinAllGeneralForumTopicMessages`. Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
     */ unpinAllGeneralForumTopicMessages(signal) {
    return this.api.unpinAllGeneralForumTopicMessages(orThrow(this.chatId, "unpinAllGeneralForumTopicMessages"), signal);
  }
  /**
     * Context-aware alias for `api.answerCallbackQuery`. Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
     *
     * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
     */ answerCallbackQuery(other, signal) {
    return this.api.answerCallbackQuery(orThrow(this.callbackQuery, "answerCallbackQuery").id, typeof other === "string" ? {
      text: other
    } : other, signal);
  }
  /**
     * Context-aware alias for `api.setChatMenuButton`. Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatmenubutton
     */ setChatMenuButton(other, signal) {
    return this.api.setChatMenuButton(other, signal);
  }
  /**
     * Context-aware alias for `api.getChatMenuButton`. Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmenubutton
     */ getChatMenuButton(other, signal) {
    return this.api.getChatMenuButton(other, signal);
  }
  /**
     * Context-aware alias for `api.setMyDefaultAdministratorRights`. Use this method to the change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are are free to modify the list before adding the bot. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydefaultadministratorrights
     */ setMyDefaultAdministratorRights(other, signal) {
    return this.api.setMyDefaultAdministratorRights(other, signal);
  }
  /**
     * Context-aware alias for `api.getMyDefaultAdministratorRights`. Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     */ getMyDefaultAdministratorRights(other, signal) {
    return this.api.getMyDefaultAdministratorRights(other, signal);
  }
  /**
     * Context-aware alias for `api.editMessageText`. Use this method to edit text and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param text New text of the message, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageText(text, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.editMessageTextInline(inlineId, text, other) : this.api.editMessageText(orThrow(this.chatId, "editMessageText"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageText"), text, other, signal);
  }
  /**
     * Context-aware alias for `api.editMessageCaption`. Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaption(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.editMessageCaptionInline(inlineId, other) : this.api.editMessageCaption(orThrow(this.chatId, "editMessageCaption"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageCaption"), other, signal);
  }
  /**
     * Context-aware alias for `api.editMessageMedia`. Use this method to edit animation, audio, document, photo, or video messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMedia(media, other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.editMessageMediaInline(inlineId, media, other) : this.api.editMessageMedia(orThrow(this.chatId, "editMessageMedia"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageMedia"), media, other, signal);
  }
  /**
     * Context-aware alias for `api.editMessageReplyMarkup`. Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkup(other, signal) {
    const inlineId = this.inlineMessageId;
    return inlineId !== undefined ? this.api.editMessageReplyMarkupInline(inlineId, other) : this.api.editMessageReplyMarkup(orThrow(this.chatId, "editMessageReplyMarkup"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageReplyMarkup"), other, signal);
  }
  /**
     * Context-aware alias for `api.stopPoll`. Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stoppoll
     */ stopPoll(other, signal) {
    return this.api.stopPoll(orThrow(this.chatId, "stopPoll"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "stopPoll"), other, signal);
  }
  /**
     * Context-aware alias for `api.deleteMessage`. Use this method to delete a message, including service messages, with the following limitations:
     * - A message can only be deleted if it was sent less than 48 hours ago.
     * - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago.
     * - Bots can delete outgoing messages in private chats, groups, and supergroups.
     * - Bots can delete incoming messages in private chats.
     * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
     * - If the bot is an administrator of a group, it can delete any message there.
     * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
     * Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessage
     */ deleteMessage(signal) {
    return this.api.deleteMessage(orThrow(this.chatId, "deleteMessage"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "deleteMessage"), signal);
  }
  /**
     * Context-aware alias for `api.deleteMessages`. Use this method to delete multiple messages simultaneously. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessages
     */ deleteMessages(message_ids, signal) {
    return this.api.deleteMessages(orThrow(this.chatId, "deleteMessages"), message_ids, signal);
  }
  /**
     * Context-aware alias for `api.sendSticker`. Use this method to send static .WEBP, animated .TGS, or video .WEBM stickers. On success, the sent Message is returned.
     *
     * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. Video and animated stickers can't be sent via an HTTP URL.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendsticker
     */ replyWithSticker(sticker, other, signal) {
    return this.api.sendSticker(orThrow(this.chatId, "sendSticker"), sticker, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
  /**
     * Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects.
     *
     * @param custom_emoji_ids A list of custom emoji identifiers
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getcustomemojistickers
     */ getCustomEmojiStickers(signal) {
    return this.api.getCustomEmojiStickers((this.msg?.entities ?? []).filter((e)=>e.type === "custom_emoji").map((e)=>e.custom_emoji_id), signal);
  }
  /**
     * Context-aware alias for `api.answerInlineQuery`. Use this method to send answers to an inline query. On success, True is returned.
     * No more than 50 results per query are allowed.
     *
     * Example: An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an OAuth link. Once done, the bot can offer a switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities.
     *
     * @param results An array of results for the inline query
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerinlinequery
     */ answerInlineQuery(results, other, signal) {
    return this.api.answerInlineQuery(orThrow(this.inlineQuery, "answerInlineQuery").id, results, other, signal);
  }
  /**
     * Context-aware alias for `api.sendInvoice`. Use this method to send invoices. On success, the sent Message is returned.
     *
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendinvoice
     */ replyWithInvoice(title, description, payload, currency, prices, other, signal) {
    return this.api.sendInvoice(orThrow(this.chatId, "sendInvoice"), title, description, payload, currency, prices, other, signal);
  }
  /**
     * Context-aware alias for `api.answerShippingQuery`. If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
     *
     * @param shipping_query_id Unique identifier for the query to be answered
     * @param ok Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answershippingquery
     */ answerShippingQuery(ok, other, signal) {
    return this.api.answerShippingQuery(orThrow(this.shippingQuery, "answerShippingQuery").id, ok, other, signal);
  }
  /**
     * Context-aware alias for `api.answerPreCheckoutQuery`. Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
     *
     * @param ok Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerprecheckoutquery
     */ answerPreCheckoutQuery(ok, other, signal) {
    return this.api.answerPreCheckoutQuery(orThrow(this.preCheckoutQuery, "answerPreCheckoutQuery").id, ok, typeof other === "string" ? {
      error_message: other
    } : other, signal);
  }
  /**
     * Context-aware alias for `api.refundStarPayment`. Refunds a successful payment in Telegram Stars.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#refundstarpayment
     */ refundStarPayment(signal) {
    return this.api.refundStarPayment(orThrow(this.from, "refundStarPayment").id, orThrow(this.msg?.successful_payment, "refundStarPayment").telegram_payment_charge_id, signal);
  }
  /**
     * Context-aware alias for `api.setPassportDataErrors`. Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success.
     *
     * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
     *
     * @param errors An array describing the errors
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setpassportdataerrors
     */ setPassportDataErrors(errors, signal) {
    return this.api.setPassportDataErrors(orThrow(this.from, "setPassportDataErrors").id, errors, signal);
  }
  /**
     * Context-aware alias for `api.sendGame`. Use this method to send a game. On success, the sent Message is returned.
     *
     * @param game_short_name Short name of the game, serves as the unique identifier for the game. Set up your games via BotFather.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendgame
     */ replyWithGame(game_short_name, other, signal) {
    return this.api.sendGame(orThrow(this.chatId, "sendGame"), game_short_name, {
      business_connection_id: this.businessConnectionId,
      ...other
    }, signal);
  }
}
// === Util functions
function orThrow(value, method) {
  if (value === undefined) {
    throw new Error(`Missing information for API call to ${method}`);
  }
  return value;
}
function triggerFn(trigger) {
  return toArray(trigger).map((t)=>typeof t === "string" ? (txt)=>txt === t ? t : null : (txt)=>txt.match(t));
}
function match(ctx, content, triggers) {
  for (const t of triggers){
    const res = t(content);
    if (res) {
      ctx.match = res;
      return true;
    }
  }
  return false;
}
function toArray(e) {
  return Array.isArray(e) ? e : [
    e
  ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29udGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgY2FtZWxjYXNlXG5pbXBvcnQgeyB0eXBlIEFwaSwgdHlwZSBPdGhlciBhcyBPdGhlckFwaSB9IGZyb20gXCIuL2NvcmUvYXBpLnRzXCI7XG5pbXBvcnQgeyB0eXBlIE1ldGhvZHMsIHR5cGUgUmF3QXBpIH0gZnJvbSBcIi4vY29yZS9jbGllbnQudHNcIjtcbmltcG9ydCB7XG4gICAgdHlwZSBGaWx0ZXIsXG4gICAgdHlwZSBGaWx0ZXJDb3JlLFxuICAgIHR5cGUgRmlsdGVyUXVlcnksXG4gICAgbWF0Y2hGaWx0ZXIsXG59IGZyb20gXCIuL2ZpbHRlci50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIENoYXQsXG4gICAgdHlwZSBDaGF0UGVybWlzc2lvbnMsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdCxcbiAgICB0eXBlIElucHV0RmlsZSxcbiAgICB0eXBlIElucHV0TWVkaWEsXG4gICAgdHlwZSBJbnB1dE1lZGlhQXVkaW8sXG4gICAgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8sXG4gICAgdHlwZSBJbnB1dE1lZGlhVmlkZW8sXG4gICAgdHlwZSBJbnB1dFBhaWRNZWRpYSxcbiAgICB0eXBlIElucHV0UG9sbE9wdGlvbixcbiAgICB0eXBlIExhYmVsZWRQcmljZSxcbiAgICB0eXBlIE1lc3NhZ2UsXG4gICAgdHlwZSBNZXNzYWdlRW50aXR5LFxuICAgIHR5cGUgUGFzc3BvcnRFbGVtZW50RXJyb3IsXG4gICAgdHlwZSBSZWFjdGlvblR5cGUsXG4gICAgdHlwZSBSZWFjdGlvblR5cGVFbW9qaSxcbiAgICB0eXBlIFVwZGF0ZSxcbiAgICB0eXBlIFVzZXIsXG4gICAgdHlwZSBVc2VyRnJvbUdldE1lLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vLyA9PT0gVXRpbCB0eXBlc1xuZXhwb3J0IHR5cGUgTWF5YmVBcnJheTxUPiA9IFQgfCBUW107XG4vKiogcGVybWl0cyBgc3RyaW5nYCBidXQgZ2l2ZXMgaGludHMgKi9cbmV4cG9ydCB0eXBlIFN0cmluZ1dpdGhDb21tYW5kU3VnZ2VzdGlvbnMgPVxuICAgIHwgKHN0cmluZyAmIFJlY29yZDxuZXZlciwgbmV2ZXI+KVxuICAgIHwgXCJzdGFydFwiXG4gICAgfCBcImhlbHBcIlxuICAgIHwgXCJzZXR0aW5nc1wiXG4gICAgfCBcInByaXZhY3lcIlxuICAgIHwgXCJkZXZlbG9wZXJfaW5mb1wiO1xuXG50eXBlIE90aGVyPE0gZXh0ZW5kcyBNZXRob2RzPFJhd0FwaT4sIFggZXh0ZW5kcyBzdHJpbmcgPSBuZXZlcj4gPSBPdGhlckFwaTxcbiAgICBSYXdBcGksXG4gICAgTSxcbiAgICBYXG4+O1xudHlwZSBTbmFrZVRvQ2FtZWxDYXNlPFMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIGAke2luZmVyIEx9XyR7aW5mZXIgUn1gXG4gICAgPyBgJHtMfSR7Q2FwaXRhbGl6ZTxTbmFrZVRvQ2FtZWxDYXNlPFI+Pn1gXG4gICAgOiBTO1xudHlwZSBBbGlhc1Byb3BzPFU+ID0ge1xuICAgIFtLIGluIHN0cmluZyAmIGtleW9mIFUgYXMgU25ha2VUb0NhbWVsQ2FzZTxLPl06IFVbS107XG59O1xudHlwZSBSZW5hbWVkVXBkYXRlID0gQWxpYXNQcm9wczxPbWl0PFVwZGF0ZSwgXCJ1cGRhdGVfaWRcIj4+O1xuXG4vLyA9PT0gQ29udGV4dCBwcm9iaW5nIGxvZ2ljXG5pbnRlcmZhY2UgU3RhdGljSGFzIHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yIG1hdGNoaW5nXG4gICAgICogdGhlIGdpdmVuIGZpbHRlciBxdWVyeS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3Qub25gLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbHRlciBUaGUgZmlsdGVyIHF1ZXJ5IHRvIGNoZWNrXG4gICAgICovXG4gICAgZmlsdGVyUXVlcnk8USBleHRlbmRzIEZpbHRlclF1ZXJ5PihcbiAgICAgICAgZmlsdGVyOiBRIHwgUVtdLFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgRmlsdGVyPEMsIFE+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIHRoZSBnaXZlbiB0ZXh0LCBvciBmb3IgdGhlIHRleHQgdG8gbWF0Y2ggdGhlIGdpdmVuIHJlZ3VsYXJcbiAgICAgKiBleHByZXNzaW9uLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5oZWFyc2AuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgdGV4dChcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgSGVhcnNDb250ZXh0PEM+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIGEgY29tbWFuZC4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3QuY29tbWFuZGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBtYXRjaFxuICAgICAqL1xuICAgIGNvbW1hbmQoXG4gICAgICAgIGNvbW1hbmQ6IE1heWJlQXJyYXk8U3RyaW5nV2l0aENvbW1hbmRTdWdnZXN0aW9ucz4sXG4gICAgKTogPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpID0+IGN0eCBpcyBDb21tYW5kQ29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyBhIG1lc3NhZ2UgcmVhY3Rpb24gdXBkYXRlLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXNcbiAgICAgKiBgYm90LnJlYWN0aW9uYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFjdGlvbiBUaGUgcmVhY3Rpb24gdG8gdGVzdCBhZ2FpbnN0XG4gICAgICovXG4gICAgcmVhY3Rpb24oXG4gICAgICAgIHJlYWN0aW9uOiBNYXliZUFycmF5PFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl0gfCBSZWFjdGlvblR5cGU+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgUmVhY3Rpb25Db250ZXh0PEM+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBiZWxvbmdpbmcgdG8gYSBjaGF0IHdpdGggdGhlIGdpdmVuIGNoYXQgdHlwZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5jaGF0VHlwZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdFR5cGUgVGhlIGNoYXQgdHlwZSB0byBtYXRjaFxuICAgICAqL1xuICAgIGNoYXRUeXBlPFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4oXG4gICAgICAgIGNoYXRUeXBlOiBNYXliZUFycmF5PFQ+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgQ2hhdFR5cGVDb250ZXh0PEMsIFQ+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIHRoZSBnaXZlbiBjYWxsYmFjayBxdWVyeSwgb3IgZm9yIHRoZSBjYWxsYmFjayBxdWVyeSBkYXRhIHRvXG4gICAgICogbWF0Y2ggdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbi4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5jYWxsYmFja1F1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBjYWxsYmFja1F1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpID0+IGN0eCBpcyBDYWxsYmFja1F1ZXJ5Q29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gZ2FtZSBxdWVyeSwgb3IgZm9yIHRoZSBnYW1lIG5hbWUgdG8gbWF0Y2ggdGhlIGdpdmVuXG4gICAgICogcmVndWxhciBleHByZXNzaW9uLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5nYW1lUXVlcnlgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIGdhbWVRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgR2FtZVF1ZXJ5Q29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gaW5saW5lIHF1ZXJ5LCBvciBmb3IgdGhlIGlubGluZSBxdWVyeSB0byBtYXRjaCB0aGVcbiAgICAgKiBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmlubGluZVF1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBpbmxpbmVRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgSW5saW5lUXVlcnlDb250ZXh0PEM+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIHRoZSBjaG9zZW4gaW5saW5lIHJlc3VsdCwgb3IgZm9yIHRoZSBjaG9zZW4gaW5saW5lIHJlc3VsdCB0b1xuICAgICAqIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgY2hvc2VuSW5saW5lUmVzdWx0KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpID0+IGN0eCBpcyBDaG9zZW5JbmxpbmVSZXN1bHRDb250ZXh0PEM+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIHRoZSBnaXZlbiBwcmUtY2hlY2tvdXQgcXVlcnksIG9yIGZvciB0aGUgcHJlLWNoZWNrb3V0IHF1ZXJ5XG4gICAgICogcGF5bG9hZCB0byBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWNcbiAgICAgKiBhcyBgYm90LnByZUNoZWNrb3V0UXVlcnlgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIHByZUNoZWNrb3V0UXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIFByZUNoZWNrb3V0UXVlcnlDb250ZXh0PEM+O1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHByZWRpY2F0ZSBmdW5jdGlvbiB0aGF0IGNhbiB0ZXN0IGNvbnRleHQgb2JqZWN0cyBmb3JcbiAgICAgKiBjb250YWluaW5nIHRoZSBnaXZlbiBzaGlwcGluZyBxdWVyeSwgb3IgZm9yIHRoZSBzaGlwcGluZyBxdWVyeSB0byBtYXRjaFxuICAgICAqIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3Quc2hpcHBpbmdRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgc2hpcHBpbmdRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgU2hpcHBpbmdRdWVyeUNvbnRleHQ8Qz47XG59XG5jb25zdCBjaGVja2VyOiBTdGF0aWNIYXMgPSB7XG4gICAgZmlsdGVyUXVlcnk8USBleHRlbmRzIEZpbHRlclF1ZXJ5PihmaWx0ZXI6IFEgfCBRW10pIHtcbiAgICAgICAgY29uc3QgcHJlZCA9IG1hdGNoRmlsdGVyKGZpbHRlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBGaWx0ZXI8QywgUT4gPT4gcHJlZChjdHgpO1xuICAgIH0sXG4gICAgdGV4dCh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc1RleHQgPSBjaGVja2VyLmZpbHRlclF1ZXJ5KFtcIjp0ZXh0XCIsIFwiOmNhcHRpb25cIl0pO1xuICAgICAgICBjb25zdCB0cmcgPSB0cmlnZ2VyRm4odHJpZ2dlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBIZWFyc0NvbnRleHQ8Qz4gPT4ge1xuICAgICAgICAgICAgaWYgKCFoYXNUZXh0KGN0eCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGN0eC5tZXNzYWdlID8/IGN0eC5jaGFubmVsUG9zdDtcbiAgICAgICAgICAgIGNvbnN0IHR4dCA9IG1zZy50ZXh0ID8/IG1zZy5jYXB0aW9uO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoKGN0eCwgdHh0LCB0cmcpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgY29tbWFuZChjb21tYW5kKSB7XG4gICAgICAgIGNvbnN0IGhhc0VudGl0aWVzID0gY2hlY2tlci5maWx0ZXJRdWVyeShcIjplbnRpdGllczpib3RfY29tbWFuZFwiKTtcbiAgICAgICAgY29uc3QgYXRDb21tYW5kcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICBjb25zdCBub0F0Q29tbWFuZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgdG9BcnJheShjb21tYW5kKS5mb3JFYWNoKChjbWQpID0+IHtcbiAgICAgICAgICAgIGlmIChjbWQuc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIGBEbyBub3QgaW5jbHVkZSAnLycgd2hlbiByZWdpc3RlcmluZyBjb21tYW5kIGhhbmRsZXJzICh1c2UgJyR7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbWQuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgICAgIH0nIG5vdCAnJHtjbWR9JylgLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzZXQgPSBjbWQuaW5jbHVkZXMoXCJAXCIpID8gYXRDb21tYW5kcyA6IG5vQXRDb21tYW5kcztcbiAgICAgICAgICAgIHNldC5hZGQoY21kKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBDb21tYW5kQ29udGV4dDxDPiA9PiB7XG4gICAgICAgICAgICBpZiAoIWhhc0VudGl0aWVzKGN0eCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGN0eC5tZXNzYWdlID8/IGN0eC5jaGFubmVsUG9zdDtcbiAgICAgICAgICAgIGNvbnN0IHR4dCA9IG1zZy50ZXh0ID8/IG1zZy5jYXB0aW9uO1xuICAgICAgICAgICAgcmV0dXJuIG1zZy5lbnRpdGllcy5zb21lKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGUudHlwZSAhPT0gXCJib3RfY29tbWFuZFwiKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKGUub2Zmc2V0ICE9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc3QgY21kID0gdHh0LnN1YnN0cmluZygxLCBlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vQXRDb21tYW5kcy5oYXMoY21kKSB8fCBhdENvbW1hbmRzLmhhcyhjbWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5tYXRjaCA9IHR4dC5zdWJzdHJpbmcoY21kLmxlbmd0aCArIDEpLnRyaW1TdGFydCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjbWQuaW5kZXhPZihcIkBcIik7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAtMSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0VGFyZ2V0ID0gY21kLnN1YnN0cmluZyhpbmRleCArIDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdXNlcm5hbWUgPSBjdHgubWUudXNlcm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAoYXRUYXJnZXQgIT09IHVzZXJuYW1lKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc3QgYXRDb21tYW5kID0gY21kLnN1YnN0cmluZygwLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKG5vQXRDb21tYW5kcy5oYXMoYXRDb21tYW5kKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHgubWF0Y2ggPSB0eHQuc3Vic3RyaW5nKGNtZC5sZW5ndGggKyAxKS50cmltU3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgcmVhY3Rpb24ocmVhY3Rpb24pIHtcbiAgICAgICAgY29uc3QgaGFzTWVzc2FnZVJlYWN0aW9uID0gY2hlY2tlci5maWx0ZXJRdWVyeShcIm1lc3NhZ2VfcmVhY3Rpb25cIik7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQ6IFJlYWN0aW9uVHlwZVtdID0gdHlwZW9mIHJlYWN0aW9uID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICA/IFt7IHR5cGU6IFwiZW1vamlcIiwgZW1vamk6IHJlYWN0aW9uIH1dXG4gICAgICAgICAgICA6IChBcnJheS5pc0FycmF5KHJlYWN0aW9uKSA/IHJlYWN0aW9uIDogW3JlYWN0aW9uXSkubWFwKChlbW9qaSkgPT5cbiAgICAgICAgICAgICAgICB0eXBlb2YgZW1vamkgPT09IFwic3RyaW5nXCIgPyB7IHR5cGU6IFwiZW1vamlcIiwgZW1vamkgfSA6IGVtb2ppXG4gICAgICAgICAgICApO1xuICAgICAgICBjb25zdCBlbW9qaSA9IG5ldyBTZXQoXG4gICAgICAgICAgICBub3JtYWxpemVkLmZpbHRlcigocikgPT4gci50eXBlID09PSBcImVtb2ppXCIpXG4gICAgICAgICAgICAgICAgLm1hcCgocikgPT4gci5lbW9qaSksXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGN1c3RvbUVtb2ppID0gbmV3IFNldChcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQuZmlsdGVyKChyKSA9PiByLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpXG4gICAgICAgICAgICAgICAgLm1hcCgocikgPT4gci5jdXN0b21fZW1vamlfaWQpLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBwYWlkID0gbm9ybWFsaXplZC5zb21lKChyKSA9PiByLnR5cGUgPT09IFwicGFpZFwiKTtcbiAgICAgICAgcmV0dXJuIDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKTogY3R4IGlzIFJlYWN0aW9uQ29udGV4dDxDPiA9PiB7XG4gICAgICAgICAgICBpZiAoIWhhc01lc3NhZ2VSZWFjdGlvbihjdHgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCB7IG9sZF9yZWFjdGlvbiwgbmV3X3JlYWN0aW9uIH0gPSBjdHgubWVzc2FnZVJlYWN0aW9uO1xuICAgICAgICAgICAgLy8gdHJ5IHRvIGZpbmQgYSB3YW50ZWQgcmVhY3Rpb24gdGhhdCBpcyBuZXcgYW5kIG5vdCBvbGRcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgbmV3X3JlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgLy8gZmlyc3QgY2hlY2sgaWYgdGhlIHJlYWN0aW9uIGV4aXN0ZWQgcHJldmlvdXNseVxuICAgICAgICAgICAgICAgIGxldCBpc09sZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChyZWFjdGlvbi50eXBlID09PSBcImVtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBvbGQgb2Ygb2xkX3JlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkLnR5cGUgIT09IFwiZW1vamlcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkLmVtb2ppID09PSByZWFjdGlvbi5lbW9qaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzT2xkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJjdXN0b21fZW1vamlcIikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG9sZCBvZiBvbGRfcmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGQudHlwZSAhPT0gXCJjdXN0b21fZW1vamlcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkLmN1c3RvbV9lbW9qaV9pZCA9PT0gcmVhY3Rpb24uY3VzdG9tX2Vtb2ppX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNPbGQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZWFjdGlvbi50eXBlID09PSBcInBhaWRcIikge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IG9sZCBvZiBvbGRfcmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvbGQudHlwZSAhPT0gXCJwYWlkXCIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNPbGQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHdheXMgcmVnYXJkIHVuc3VwcG9ydGVkIGVtb2ppIHR5cGVzIGFzIG5ld1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBkaXNyZWdhcmQgcmVhY3Rpb24gaWYgaXQgaXMgbm90IG5ld1xuICAgICAgICAgICAgICAgIGlmIChpc09sZCkgY29udGludWU7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIG5ldyByZWFjdGlvbiBpcyB3YW50ZWQgYW5kIHNob3J0LWNpcmN1aXRcbiAgICAgICAgICAgICAgICBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJlbW9qaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbW9qaS5oYXMocmVhY3Rpb24uZW1vamkpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbUVtb2ppLmhhcyhyZWFjdGlvbi5jdXN0b21fZW1vamlfaWQpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwicGFpZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChwYWlkKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhbHdheXMgcmVnYXJkIHVuc3VwcG9ydGVkIGVtb2ppIHR5cGVzIGFzIG5ld1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gbmV3IHJlYWN0aW9uIG5vdCB3YW50ZWQsIGNoZWNrIG5leHQgb25lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBjaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+KGNoYXRUeXBlOiBNYXliZUFycmF5PFQ+KSB7XG4gICAgICAgIGNvbnN0IHNldCA9IG5ldyBTZXQ8Q2hhdFtcInR5cGVcIl0+KHRvQXJyYXkoY2hhdFR5cGUpKTtcbiAgICAgICAgcmV0dXJuIDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKTogY3R4IGlzIENoYXRUeXBlQ29udGV4dDxDLCBUPiA9PlxuICAgICAgICAgICAgY3R4LmNoYXQ/LnR5cGUgIT09IHVuZGVmaW5lZCAmJiBzZXQuaGFzKGN0eC5jaGF0LnR5cGUpO1xuICAgIH0sXG4gICAgY2FsbGJhY2tRdWVyeSh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc0NhbGxiYWNrUXVlcnkgPSBjaGVja2VyLmZpbHRlclF1ZXJ5KFwiY2FsbGJhY2tfcXVlcnk6ZGF0YVwiKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgQ2FsbGJhY2tRdWVyeUNvbnRleHQ8Qz4gPT5cbiAgICAgICAgICAgIGhhc0NhbGxiYWNrUXVlcnkoY3R4KSAmJiBtYXRjaChjdHgsIGN0eC5jYWxsYmFja1F1ZXJ5LmRhdGEsIHRyZyk7XG4gICAgfSxcbiAgICBnYW1lUXVlcnkodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBoYXNHYW1lUXVlcnkgPSBjaGVja2VyLmZpbHRlclF1ZXJ5KFxuICAgICAgICAgICAgXCJjYWxsYmFja19xdWVyeTpnYW1lX3Nob3J0X25hbWVcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgR2FtZVF1ZXJ5Q29udGV4dDxDPiA9PlxuICAgICAgICAgICAgaGFzR2FtZVF1ZXJ5KGN0eCkgJiZcbiAgICAgICAgICAgIG1hdGNoKGN0eCwgY3R4LmNhbGxiYWNrUXVlcnkuZ2FtZV9zaG9ydF9uYW1lLCB0cmcpO1xuICAgIH0sXG4gICAgaW5saW5lUXVlcnkodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBoYXNJbmxpbmVRdWVyeSA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXCJpbmxpbmVfcXVlcnlcIik7XG4gICAgICAgIGNvbnN0IHRyZyA9IHRyaWdnZXJGbih0cmlnZ2VyKTtcbiAgICAgICAgcmV0dXJuIDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKTogY3R4IGlzIElubGluZVF1ZXJ5Q29udGV4dDxDPiA9PlxuICAgICAgICAgICAgaGFzSW5saW5lUXVlcnkoY3R4KSAmJiBtYXRjaChjdHgsIGN0eC5pbmxpbmVRdWVyeS5xdWVyeSwgdHJnKTtcbiAgICB9LFxuICAgIGNob3NlbklubGluZVJlc3VsdCh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc0Nob3NlbklubGluZVJlc3VsdCA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXG4gICAgICAgICAgICBcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCIsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IHRyZyA9IHRyaWdnZXJGbih0cmlnZ2VyKTtcbiAgICAgICAgcmV0dXJuIDxDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgICAgICAgICBjdHg6IEMsXG4gICAgICAgICk6IGN0eCBpcyBDaG9zZW5JbmxpbmVSZXN1bHRDb250ZXh0PEM+ID0+XG4gICAgICAgICAgICBoYXNDaG9zZW5JbmxpbmVSZXN1bHQoY3R4KSAmJlxuICAgICAgICAgICAgbWF0Y2goY3R4LCBjdHguY2hvc2VuSW5saW5lUmVzdWx0LnJlc3VsdF9pZCwgdHJnKTtcbiAgICB9LFxuICAgIHByZUNoZWNrb3V0UXVlcnkodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBoYXNQcmVDaGVja291dFF1ZXJ5ID0gY2hlY2tlci5maWx0ZXJRdWVyeShcInByZV9jaGVja291dF9xdWVyeVwiKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgUHJlQ2hlY2tvdXRRdWVyeUNvbnRleHQ8Qz4gPT5cbiAgICAgICAgICAgIGhhc1ByZUNoZWNrb3V0UXVlcnkoY3R4KSAmJlxuICAgICAgICAgICAgbWF0Y2goY3R4LCBjdHgucHJlQ2hlY2tvdXRRdWVyeS5pbnZvaWNlX3BheWxvYWQsIHRyZyk7XG4gICAgfSxcbiAgICBzaGlwcGluZ1F1ZXJ5KHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgaGFzU2hpcHBpbmdRdWVyeSA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXCJzaGlwcGluZ19xdWVyeVwiKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgU2hpcHBpbmdRdWVyeUNvbnRleHQ8Qz4gPT5cbiAgICAgICAgICAgIGhhc1NoaXBwaW5nUXVlcnkoY3R4KSAmJlxuICAgICAgICAgICAgbWF0Y2goY3R4LCBjdHguc2hpcHBpbmdRdWVyeS5pbnZvaWNlX3BheWxvYWQsIHRyZyk7XG4gICAgfSxcbn07XG5cbi8vID09PSBDb250ZXh0IGNsYXNzXG4vKipcbiAqIFdoZW4geW91ciBib3QgcmVjZWl2ZXMgYSBtZXNzYWdlLCBUZWxlZ3JhbSBzZW5kcyBhbiB1cGRhdGUgb2JqZWN0IHRvIHlvdXJcbiAqIGJvdC4gVGhlIHVwZGF0ZSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY2hhdCwgdGhlIHVzZXIsIGFuZCBvZiBjb3Vyc2VcbiAqIHRoZSBtZXNzYWdlIGl0c2VsZi4gVGhlcmUgYXJlIG51bWVyb3VzIG90aGVyIHVwZGF0ZXMsIHRvbzpcbiAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdXBkYXRlXG4gKlxuICogV2hlbiBncmFtbVkgcmVjZWl2ZXMgYW4gdXBkYXRlLCBpdCB3cmFwcyB0aGlzIHVwZGF0ZSBpbnRvIGEgY29udGV4dCBvYmplY3RcbiAqIGZvciB5b3UuIENvbnRleHQgb2JqZWN0cyBhcmUgY29tbW9ubHkgbmFtZWQgYGN0eGAuIEEgY29udGV4dCBvYmplY3QgZG9lcyB0d29cbiAqIHRoaW5nczpcbiAqIDEuICoqYGN0eC51cGRhdGVgKiogaG9sZHMgdGhlIHVwZGF0ZSBvYmplY3QgdGhhdCB5b3UgY2FuIHVzZSB0byBwcm9jZXNzIHRoZVxuICogICAgbWVzc2FnZS4gVGhpcyBpbmNsdWRlcyBwcm92aWRpbmcgdXNlZnVsIHNob3J0Y3V0cyBmb3IgdGhlIHVwZGF0ZSwgZm9yXG4gKiAgICBpbnN0YW5jZSwgYGN0eC5tc2dgIGlzIGEgc2hvcnRjdXQgdGhhdCBnaXZlcyB5b3UgdGhlIG1lc3NhZ2Ugb2JqZWN0IGZyb21cbiAqICAgIHRoZSB1cGRhdGXigJRubyBtYXR0ZXIgd2hldGhlciBpdCBpcyBjb250YWluZWQgaW4gYGN0eC51cGRhdGUubWVzc2FnZWAsIG9yXG4gKiAgICBgY3R4LnVwZGF0ZS5lZGl0ZWRfbWVzc2FnZWAsIG9yIGBjdHgudXBkYXRlLmNoYW5uZWxfcG9zdGAsIG9yXG4gKiAgICBgY3R4LnVwZGF0ZS5lZGl0ZWRfY2hhbm5lbF9wb3N0YC5cbiAqIDIuICoqYGN0eC5hcGlgKiogZ2l2ZXMgeW91IGFjY2VzcyB0byB0aGUgZnVsbCBUZWxlZ3JhbSBCb3QgQVBJIHNvIHRoYXQgeW91XG4gKiAgICBjYW4gZGlyZWN0bHkgY2FsbCBhbnkgbWV0aG9kLCBzdWNoIGFzIHJlc3BvbmRpbmcgdmlhXG4gKiAgICBgY3R4LmFwaS5zZW5kTWVzc2FnZWAuIEFsc28gaGVyZSwgdGhlIGNvbnRleHQgb2JqZWN0cyBoYXMgc29tZSB1c2VmdWxcbiAqICAgIHNob3J0Y3V0cyBmb3IgeW91LiBGb3IgaW5zdGFuY2UsIGlmIHlvdSB3YW50IHRvIHNlbmQgYSBtZXNzYWdlIHRvIHRoZSBzYW1lXG4gKiAgICBjaGF0IHRoYXQgYSBtZXNzYWdlIGNvbWVzIGZyb20gKGkuZS4ganVzdCByZXNwb25kIHRvIGEgdXNlcikgeW91IGNhbiBjYWxsXG4gKiAgICBgY3R4LnJlcGx5YC4gVGhpcyBpcyBub3RoaW5nIGJ1dCBhIHdyYXBwZXIgZm9yIGBjdHguYXBpLnNlbmRNZXNzYWdlYCB3aXRoXG4gKiAgICB0aGUgcmlnaHQgYGNoYXRfaWRgIHByZS1maWxsZWQgZm9yIHlvdS4gQWxtb3N0IGFsbCBtZXRob2RzIG9mIHRoZSBUZWxlZ3JhbVxuICogICAgQm90IEFQSSBoYXZlIHRoZWlyIG93biBzaG9ydGN1dCBkaXJlY3RseSBvbiB0aGUgY29udGV4dCBvYmplY3QsIHNvIHlvdVxuICogICAgcHJvYmFibHkgbmV2ZXIgcmVhbGx5IGhhdmUgdG8gdXNlIGBjdHguYXBpYCBhdCBhbGwuXG4gKlxuICogVGhpcyBjb250ZXh0IG9iamVjdCBpcyB0aGVuIHBhc3NlZCB0byBhbGwgb2YgdGhlIGxpc3RlbmVycyAoY2FsbGVkXG4gKiBtaWRkbGV3YXJlKSB0aGF0IHlvdSByZWdpc3RlciBvbiB5b3VyIGJvdC4gQmVjYXVzZSB0aGlzIGlzIHNvIHVzZWZ1bCwgdGhlXG4gKiBjb250ZXh0IG9iamVjdCBpcyBvZnRlbiB1c2VkIHRvIGhvbGQgbW9yZSBpbmZvcm1hdGlvbi4gT25lIGV4YW1wbGUgYXJlXG4gKiBzZXNzaW9ucyAoYSBjaGF0LXNwZWNpZmljIGRhdGEgc3RvcmFnZSB0aGF0IGlzIHN0b3JlZCBpbiBhIGRhdGFiYXNlKSwgYW5kXG4gKiBhbm90aGVyIGV4YW1wbGUgaXMgYGN0eC5tYXRjaGAgdGhhdCBpcyB1c2VkIGJ5IGBib3QuY29tbWFuZGAgYW5kIG90aGVyXG4gKiBtZXRob2RzIHRvIGtlZXAgaW5mb3JtYXRpb24gYWJvdXQgaG93IGEgcmVndWxhciBleHByZXNzaW9uIHdhcyBtYXRjaGVkLlxuICpcbiAqIFJlYWQgdXAgYWJvdXQgbWlkZGxld2FyZSBvbiB0aGVcbiAqIFt3ZWJzaXRlXShodHRwczovL2dyYW1teS5kZXYvZ3VpZGUvY29udGV4dCkgaWYgeW91IHdhbnQgdG8ga25vdyBtb3JlXG4gKiBhYm91dCB0aGUgcG93ZXJmdWwgb3Bwb3J0dW5pdGllcyB0aGF0IGxpZSBpbiBjb250ZXh0IG9iamVjdHMsIGFuZCBhYm91dCBob3dcbiAqIGdyYW1tWSBpbXBsZW1lbnRzIHRoZW0uXG4gKi9cbmV4cG9ydCBjbGFzcyBDb250ZXh0IGltcGxlbWVudHMgUmVuYW1lZFVwZGF0ZSB7XG4gICAgLyoqXG4gICAgICogVXNlZCBieSBzb21lIG1pZGRsZXdhcmUgdG8gc3RvcmUgaW5mb3JtYXRpb24gYWJvdXQgaG93IGEgY2VydGFpbiBzdHJpbmdcbiAgICAgKiBvciByZWd1bGFyIGV4cHJlc3Npb24gd2FzIG1hdGNoZWQuXG4gICAgICovXG4gICAgcHVibGljIG1hdGNoOiBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5IHwgdW5kZWZpbmVkO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdXBkYXRlIG9iamVjdCB0aGF0IGlzIGNvbnRhaW5lZCBpbiB0aGUgY29udGV4dC5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyByZWFkb25seSB1cGRhdGU6IFVwZGF0ZSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFuIEFQSSBpbnN0YW5jZSB0aGF0IGFsbG93cyB5b3UgdG8gY2FsbCBhbnkgbWV0aG9kIG9mIHRoZSBUZWxlZ3JhbVxuICAgICAgICAgKiBCb3QgQVBJLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHJlYWRvbmx5IGFwaTogQXBpLFxuICAgICAgICAvKipcbiAgICAgICAgICogSW5mb3JtYXRpb24gYWJvdXQgdGhlIGJvdCBpdHNlbGYuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbWU6IFVzZXJGcm9tR2V0TWUsXG4gICAgKSB7fVxuXG4gICAgLy8gVVBEQVRFIFNIT1JUQ1VUU1xuXG4gICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5tZXNzYWdlYCAqL1xuICAgIGdldCBtZXNzYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUubWVzc2FnZTtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5lZGl0ZWRfbWVzc2FnZWAgKi9cbiAgICBnZXQgZWRpdGVkTWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmVkaXRlZF9tZXNzYWdlO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmNoYW5uZWxfcG9zdGAgKi9cbiAgICBnZXQgY2hhbm5lbFBvc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5jaGFubmVsX3Bvc3Q7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuZWRpdGVkX2NoYW5uZWxfcG9zdGAgKi9cbiAgICBnZXQgZWRpdGVkQ2hhbm5lbFBvc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5lZGl0ZWRfY2hhbm5lbF9wb3N0O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmJ1c2luZXNzX2Nvbm5lY3Rpb25gICovXG4gICAgZ2V0IGJ1c2luZXNzQ29ubmVjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmJ1c2luZXNzX2Nvbm5lY3Rpb247XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuYnVzaW5lc3NfbWVzc2FnZWAgKi9cbiAgICBnZXQgYnVzaW5lc3NNZXNzYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuYnVzaW5lc3NfbWVzc2FnZTtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5lZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZWAgKi9cbiAgICBnZXQgZWRpdGVkQnVzaW5lc3NNZXNzYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuZWRpdGVkX2J1c2luZXNzX21lc3NhZ2U7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuZGVsZXRlZF9idXNpbmVzc19tZXNzYWdlc2AgKi9cbiAgICBnZXQgZGVsZXRlZEJ1c2luZXNzTWVzc2FnZXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5kZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLm1lc3NhZ2VfcmVhY3Rpb25gICovXG4gICAgZ2V0IG1lc3NhZ2VSZWFjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLm1lc3NhZ2VfcmVhY3Rpb247XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUubWVzc2FnZV9yZWFjdGlvbl9jb3VudGAgKi9cbiAgICBnZXQgbWVzc2FnZVJlYWN0aW9uQ291bnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5tZXNzYWdlX3JlYWN0aW9uX2NvdW50O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmlubGluZV9xdWVyeWAgKi9cbiAgICBnZXQgaW5saW5lUXVlcnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5pbmxpbmVfcXVlcnk7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuY2hvc2VuX2lubGluZV9yZXN1bHRgICovXG4gICAgZ2V0IGNob3NlbklubGluZVJlc3VsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmNob3Nlbl9pbmxpbmVfcmVzdWx0O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmNhbGxiYWNrX3F1ZXJ5YCAqL1xuICAgIGdldCBjYWxsYmFja1F1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuY2FsbGJhY2tfcXVlcnk7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuc2hpcHBpbmdfcXVlcnlgICovXG4gICAgZ2V0IHNoaXBwaW5nUXVlcnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5zaGlwcGluZ19xdWVyeTtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5wcmVfY2hlY2tvdXRfcXVlcnlgICovXG4gICAgZ2V0IHByZUNoZWNrb3V0UXVlcnkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5wcmVfY2hlY2tvdXRfcXVlcnk7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUucG9sbGAgKi9cbiAgICBnZXQgcG9sbCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLnBvbGw7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUucG9sbF9hbnN3ZXJgICovXG4gICAgZ2V0IHBvbGxBbnN3ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5wb2xsX2Fuc3dlcjtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5teV9jaGF0X21lbWJlcmAgKi9cbiAgICBnZXQgbXlDaGF0TWVtYmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUubXlfY2hhdF9tZW1iZXI7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuY2hhdF9tZW1iZXJgICovXG4gICAgZ2V0IGNoYXRNZW1iZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5jaGF0X21lbWJlcjtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5jaGF0X2pvaW5fcmVxdWVzdGAgKi9cbiAgICBnZXQgY2hhdEpvaW5SZXF1ZXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuY2hhdF9qb2luX3JlcXVlc3Q7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuY2hhdF9ib29zdGAgKi9cbiAgICBnZXQgY2hhdEJvb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuY2hhdF9ib29zdDtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5yZW1vdmVkX2NoYXRfYm9vc3RgICovXG4gICAgZ2V0IHJlbW92ZWRDaGF0Qm9vc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5yZW1vdmVkX2NoYXRfYm9vc3Q7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUucHVyY2hhc2VkX3BhaWRfbWVkaWFgICovXG4gICAgZ2V0IHB1cmNoYXNlZFBhaWRNZWRpYSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLnB1cmNoYXNlZF9wYWlkX21lZGlhO1xuICAgIH1cblxuICAgIC8vIEFHR1JFR0FUSU9OIFNIT1JUQ1VUU1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBtZXNzYWdlIG9iamVjdCBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3IgYHRoaXMubWVzc2FnZSA/P1xuICAgICAqIHRoaXMuZWRpdGVkTWVzc2FnZSA/PyB0aGlzLmNoYW5uZWxQb3N0ID8/IHRoaXMuZWRpdGVkQ2hhbm5lbFBvc3QgPz9cbiAgICAgKiB0aGlzLmJ1c2luZXNzTWVzc2FnZSA/PyB0aGlzLmVkaXRlZEJ1c2luZXNzTWVzc2FnZSA/P1xuICAgICAqIHRoaXMuY2FsbGJhY2tRdWVyeT8ubWVzc2FnZWAuXG4gICAgICovXG4gICAgZ2V0IG1zZygpOiBNZXNzYWdlIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRlZE1lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5uZWxQb3N0ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0ZWRDaGFubmVsUG9zdCA/P1xuICAgICAgICAgICAgICAgIHRoaXMuYnVzaW5lc3NNZXNzYWdlID8/XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0ZWRCdXNpbmVzc01lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrUXVlcnk/Lm1lc3NhZ2VcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjaGF0IG9iamVjdCBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3IgYCh0aGlzLm1zZyA/P1xuICAgICAqIHRoaXMuZGVsZXRlZEJ1c2luZXNzTWVzc2FnZXMgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgKiB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50ID8/IHRoaXMubXlDaGF0TWVtYmVyID8/ICB0aGlzLmNoYXRNZW1iZXIgPz9cbiAgICAgKiB0aGlzLmNoYXRKb2luUmVxdWVzdCA/PyB0aGlzLmNoYXRCb29zdCA/PyAgdGhpcy5yZW1vdmVkQ2hhdEJvb3N0KT8uY2hhdGAuXG4gICAgICovXG4gICAgZ2V0IGNoYXQoKTogQ2hhdCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIC8vIEtlZXAgaW4gc3luYyB3aXRoIHR5cGVzIGluIGBmaWx0ZXIudHNgLlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5tc2cgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZWRCdXNpbmVzc01lc3NhZ2VzID8/XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5teUNoYXRNZW1iZXIgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYXRNZW1iZXIgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYXRKb2luUmVxdWVzdCA/P1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhdEJvb3N0ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVkQ2hhdEJvb3N0XG4gICAgICAgICk/LmNoYXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2VuZGVyIGNoYXQgb2JqZWN0IGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGBjdHgubXNnPy5zZW5kZXJfY2hhdGAuXG4gICAgICovXG4gICAgZ2V0IHNlbmRlckNoYXQoKTogQ2hhdCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIC8vIEtlZXAgaW4gc3luYyB3aXRoIHR5cGVzIGluIGBmaWx0ZXIudHNgLlxuICAgICAgICByZXR1cm4gdGhpcy5tc2c/LnNlbmRlcl9jaGF0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHVzZXIgb2JqZWN0IGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGAodGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24gPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgKiAodGhpcy5jaGF0Qm9vc3Q/LmJvb3N0ID8/IHRoaXMucmVtb3ZlZENoYXRCb29zdCk/LnNvdXJjZSk/LnVzZXIgPz9cbiAgICAgKiAodGhpcy5jYWxsYmFja1F1ZXJ5ID8/IHRoaXMubXNnID8/IHRoaXMuaW5saW5lUXVlcnkgPz9cbiAgICAgKiB0aGlzLmNob3NlbklubGluZVJlc3VsdCA/PyB0aGlzLnNoaXBwaW5nUXVlcnkgPz8gdGhpcy5wcmVDaGVja291dFF1ZXJ5ID8/XG4gICAgICogdGhpcy5teUNoYXRNZW1iZXIgPz8gdGhpcy5jaGF0TWVtYmVyID8/IHRoaXMuY2hhdEpvaW5SZXF1ZXN0ID8/XG4gICAgICogdGhpcy5wdXJjaGFzZWRQYWlkTWVkaWEpPy5mcm9tYC5cbiAgICAgKi9cbiAgICBnZXQgZnJvbSgpOiBVc2VyIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbiA/P1xuICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWN0aW9uID8/XG4gICAgICAgICAgICAgICAgKHRoaXMuY2hhdEJvb3N0Py5ib29zdCA/PyB0aGlzLnJlbW92ZWRDaGF0Qm9vc3QpPy5zb3VyY2VcbiAgICAgICAgKT8udXNlciA/P1xuICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tRdWVyeSA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1zZyA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlubGluZVF1ZXJ5ID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuSW5saW5lUmVzdWx0ID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hpcHBpbmdRdWVyeSA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByZUNoZWNrb3V0UXVlcnkgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5teUNoYXRNZW1iZXIgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGF0TWVtYmVyID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhdEpvaW5SZXF1ZXN0ID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVyY2hhc2VkUGFpZE1lZGlhXG4gICAgICAgICAgICApPy5mcm9tO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbWVzc2FnZSBpZGVudGlmaWVyIGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAqIHRoaXMubWVzc2FnZVJlYWN0aW9uQ291bnQ/Lm1lc3NhZ2VfaWRgLlxuICAgICAqL1xuICAgIGdldCBtc2dJZCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgICAgICAvLyBLZWVwIGluIHN5bmMgd2l0aCB0eXBlcyBpbiBgZmlsdGVyLnRzYC5cbiAgICAgICAgcmV0dXJuIHRoaXMubXNnPy5tZXNzYWdlX2lkID8/IHRoaXMubWVzc2FnZVJlYWN0aW9uPy5tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXRzIHRoZSBjaGF0IGlkZW50aWZpZXIgZnJvbSB3aGVyZXZlciBwb3NzaWJsZS4gQWxpYXMgZm9yIGB0aGlzLmNoYXQ/LmlkXG4gICAgICogPz8gdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24/LnVzZXJfY2hhdF9pZGAuXG4gICAgICovXG4gICAgZ2V0IGNoYXRJZCgpOiBudW1iZXIgfCB1bmRlZmluZWQge1xuICAgICAgICAvLyBLZWVwIGluIHN5bmMgd2l0aCB0eXBlcyBpbiBgZmlsdGVyLnRzYC5cbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhdD8uaWQgPz8gdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24/LnVzZXJfY2hhdF9pZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBpbmxpbmUgbWVzc2FnZSBpZGVudGlmaWVyIGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGAoY3R4LmNhbGxiYWNrUXVlcnkgPz8gY3R4LmNob3NlbklubGluZVJlc3VsdCk/LmlubGluZV9tZXNzYWdlX2lkYC5cbiAgICAgKi9cbiAgICBnZXQgaW5saW5lTWVzc2FnZUlkKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrUXVlcnk/LmlubGluZV9tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICAgICAgdGhpcy5jaG9zZW5JbmxpbmVSZXN1bHQ/LmlubGluZV9tZXNzYWdlX2lkXG4gICAgICAgICk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgYnVzaW5lc3MgY29ubmVjdGlvbiBpZGVudGlmaWVyIGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGB0aGlzLm1zZz8uYnVzaW5lc3NfY29ubmVjdGlvbl9pZCA/PyB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbj8uaWQgPz9cbiAgICAgKiB0aGlzLmRlbGV0ZWRCdXNpbmVzc01lc3NhZ2VzPy5idXNpbmVzc19jb25uZWN0aW9uX2lkYC5cbiAgICAgKi9cbiAgICBnZXQgYnVzaW5lc3NDb25uZWN0aW9uSWQoKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubXNnPy5idXNpbmVzc19jb25uZWN0aW9uX2lkID8/XG4gICAgICAgICAgICB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbj8uaWQgPz9cbiAgICAgICAgICAgIHRoaXMuZGVsZXRlZEJ1c2luZXNzTWVzc2FnZXM/LmJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCBlbnRpdGllcyBhbmQgdGhlaXIgdGV4dC4gRXh0cmFjdHMgdGhlIHRleHQgZnJvbSBgY3R4Lm1zZy50ZXh0YCBvclxuICAgICAqIGBjdHgubXNnLmNhcHRpb25gLiBSZXR1cm5zIGFuIGVtcHR5IGFycmF5IGlmIG9uZSBvZiBgY3R4Lm1zZ2AsXG4gICAgICogYGN0eC5tc2cudGV4dGAgb3IgYGN0eC5tc2cuZW50aXRpZXNgIGlzIHVuZGVmaW5lZC5cbiAgICAgKlxuICAgICAqIFlvdSBjYW4gZmlsdGVyIHNwZWNpZmljIGVudGl0eSB0eXBlcyBieSBwYXNzaW5nIHRoZSBgdHlwZXNgIHBhcmFtZXRlci5cbiAgICAgKiBFeGFtcGxlOlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBjdHguZW50aXRpZXMoKSAvLyBSZXR1cm5zIGFsbCBlbnRpdHkgdHlwZXNcbiAgICAgKiBjdHguZW50aXRpZXMoJ3VybCcpIC8vIFJldHVybnMgb25seSB1cmwgZW50aXRpZXNcbiAgICAgKiBjdHguZW50dGl0aWVzKFsndXJsJywgJ2VtYWlsJ10pIC8vIFJldHVybnMgdXJsIGFuZCBlbWFpbCBlbnRpdGllc1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHR5cGVzIFR5cGVzIG9mIGVudGl0aWVzIHRvIHJldHVybi4gT21pdCB0byBnZXQgYWxsIGVudGl0aWVzLlxuICAgICAqIEByZXR1cm5zIEFycmF5IG9mIGVudGl0aWVzIGFuZCB0aGVpciB0ZXh0cywgb3IgZW1wdHkgYXJyYXkgd2hlbiB0aGVyZSdzIG5vIHRleHRcbiAgICAgKi9cbiAgICBlbnRpdGllcygpOiBBcnJheTxcbiAgICAgICAgTWVzc2FnZUVudGl0eSAmIHtcbiAgICAgICAgICAgIC8qKiBTbGljZSBvZiB0aGUgbWVzc2FnZSB0ZXh0IHRoYXQgY29udGFpbnMgdGhpcyBlbnRpdHkgKi9cbiAgICAgICAgICAgIHRleHQ6IHN0cmluZztcbiAgICAgICAgfVxuICAgID47XG4gICAgZW50aXRpZXM8VCBleHRlbmRzIE1lc3NhZ2VFbnRpdHlbXCJ0eXBlXCJdPihcbiAgICAgICAgdHlwZXM6IE1heWJlQXJyYXk8VD4sXG4gICAgKTogQXJyYXk8XG4gICAgICAgIE1lc3NhZ2VFbnRpdHkgJiB7XG4gICAgICAgICAgICB0eXBlOiBUO1xuICAgICAgICAgICAgLyoqIFNsaWNlIG9mIHRoZSBtZXNzYWdlIHRleHQgdGhhdCBjb250YWlucyB0aGlzIGVudGl0eSAqL1xuICAgICAgICAgICAgdGV4dDogc3RyaW5nO1xuICAgICAgICB9XG4gICAgPjtcbiAgICBlbnRpdGllcyh0eXBlcz86IE1heWJlQXJyYXk8TWVzc2FnZUVudGl0eVtcInR5cGVcIl0+KSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLm1zZztcbiAgICAgICAgaWYgKG1lc3NhZ2UgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBtZXNzYWdlLnRleHQgPz8gbWVzc2FnZS5jYXB0aW9uO1xuICAgICAgICBpZiAodGV4dCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gW107XG4gICAgICAgIGxldCBlbnRpdGllcyA9IG1lc3NhZ2UuZW50aXRpZXMgPz8gbWVzc2FnZS5jYXB0aW9uX2VudGl0aWVzO1xuICAgICAgICBpZiAoZW50aXRpZXMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgICAgICBpZiAodHlwZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgZmlsdGVycyA9IG5ldyBTZXQodG9BcnJheSh0eXBlcykpO1xuICAgICAgICAgICAgZW50aXRpZXMgPSBlbnRpdGllcy5maWx0ZXIoKGVudGl0eSkgPT4gZmlsdGVycy5oYXMoZW50aXR5LnR5cGUpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbnRpdGllcy5tYXAoKGVudGl0eSkgPT4gKHtcbiAgICAgICAgICAgIC4uLmVudGl0eSxcbiAgICAgICAgICAgIHRleHQ6IHRleHQuc3Vic3RyaW5nKGVudGl0eS5vZmZzZXQsIGVudGl0eS5vZmZzZXQgKyBlbnRpdHkubGVuZ3RoKSxcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBGaW5kIG91dCB3aGljaCByZWFjdGlvbnMgd2VyZSBhZGRlZCBhbmQgcmVtb3ZlZCBpbiBhIGBtZXNzYWdlX3JlYWN0aW9uYFxuICAgICAqIHVwZGF0ZS4gVGhpcyBtZXRob2QgbG9va3MgYXQgYGN0eC5tZXNzYWdlUmVhY3Rpb25gIGFuZCBjb21wdXRlcyB0aGVcbiAgICAgKiBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIG9sZCByZWFjdGlvbiBhbmQgdGhlIG5ldyByZWFjdGlvbi4gSXQgYWxzbyBncm91cHNcbiAgICAgKiB0aGUgcmVhY3Rpb25zIGJ5IGVtb2ppIHJlYWN0aW9ucyBhbmQgY3VzdG9tIGVtb2ppIHJlYWN0aW9ucy4gRm9yIGV4YW1wbGUsXG4gICAgICogdGhlIHJlc3VsdGluZyBvYmplY3QgY291bGQgbG9vayBsaWtlIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiB7XG4gICAgICogICBlbW9qaTogWyfwn5GNJywgJ/CfjoknXVxuICAgICAqICAgZW1vamlBZGRlZDogWyfwn46JJ10sXG4gICAgICogICBlbW9qaUtlcHQ6IFsn8J+RjSddLFxuICAgICAqICAgZW1vamlSZW1vdmVkOiBbXSxcbiAgICAgKiAgIGN1c3RvbUVtb2ppOiBbXSxcbiAgICAgKiAgIGN1c3RvbUVtb2ppQWRkZWQ6IFtdLFxuICAgICAqICAgY3VzdG9tRW1vamlLZXB0OiBbXSxcbiAgICAgKiAgIGN1c3RvbUVtb2ppUmVtb3ZlZDogWydpZDAxMjMnXSxcbiAgICAgKiAgIHBhaWQ6IHRydWUsXG4gICAgICogICBwYWlkQWRkZWQ6IGZhbHNlLFxuICAgICAqICAgcGFpZFJlbW92ZWQ6IGZhbHNlLFxuICAgICAqIH1cbiAgICAgKiBgYGBcbiAgICAgKiBJbiB0aGUgYWJvdmUgZXhhbXBsZSwgYSB0YWRhIHJlYWN0aW9uIHdhcyBhZGRlZCBieSB0aGUgdXNlciwgYW5kIGEgY3VzdG9tXG4gICAgICogZW1vamkgcmVhY3Rpb24gd2l0aCB0aGUgY3VzdG9tIGVtb2ppICdpZDAxMjMnIHdhcyByZW1vdmVkIGluIHRoZSBzYW1lXG4gICAgICogdXBkYXRlLiBUaGUgdXNlciBoYWQgYWxyZWFkeSByZWFjdGVkIHdpdGggYSB0aHVtYnMgdXAgcmVhY3Rpb24gYW5kIGEgcGFpZFxuICAgICAqIHN0YXIgcmVhY3Rpb24sIHdoaWNoIHRoZXkgbGVmdCBib3RoIHVuY2hhbmdlZC4gQXMgYSByZXN1bHQsIHRoZSBjdXJyZW50XG4gICAgICogcmVhY3Rpb24gYnkgdGhlIHVzZXIgaXMgdGh1bWJzIHVwLCB0YWRhLCBhbmQgYSBwYWlkIHJlYWN0aW9uLiBOb3RlIHRoYXRcbiAgICAgKiB0aGUgY3VycmVudCByZWFjdGlvbiAoYWxsIGVtb2ppIHJlYWN0aW9ucyByZWdhcmRsZXNzIG9mIHR5cGUgaW4gb25lIGxpc3QpXG4gICAgICogY2FuIGFsc28gYmUgb2J0YWluZWQgZnJvbSBgY3R4Lm1lc3NhZ2VSZWFjdGlvbi5uZXdfcmVhY3Rpb25gLlxuICAgICAqXG4gICAgICogUmVtZW1iZXIgdGhhdCByZWFjdGlvbiB1cGRhdGVzIG9ubHkgaW5jbHVkZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVcbiAgICAgKiByZWFjdGlvbiBvZiBhIHNwZWNpZmljIHVzZXIuIFRoZSByZXNwZWN0aXZlIG1lc3NhZ2UgbWF5IGhhdmUgbWFueSBtb3JlXG4gICAgICogcmVhY3Rpb25zIGJ5IG90aGVyIHBlb3BsZSB3aGljaCB3aWxsIG5vdCBiZSBpbmNsdWRlZCBpbiB0aGlzIHVwZGF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0IHRoZSByZWFjdGlvbiB1cGRhdGVcbiAgICAgKi9cbiAgICByZWFjdGlvbnMoKToge1xuICAgICAgICAvKiogRW1vamkgY3VycmVudGx5IHByZXNlbnQgaW4gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamk6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXTtcbiAgICAgICAgLyoqIEVtb2ppIG5ld2x5IGFkZGVkIHRvIHRoaXMgdXNlcidzIHJlYWN0aW9uICovXG4gICAgICAgIGVtb2ppQWRkZWQ6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXTtcbiAgICAgICAgLyoqIEVtb2ppIG5vdCBjaGFuZ2VkIGJ5IHRoZSB1cGRhdGUgdG8gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamlLZXB0OiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW107XG4gICAgICAgIC8qKiBFbW9qaSByZW1vdmVkIGZyb20gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamlSZW1vdmVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW107XG4gICAgICAgIC8qKiBDdXN0b20gZW1vamkgY3VycmVudGx5IHByZXNlbnQgaW4gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamk6IHN0cmluZ1tdO1xuICAgICAgICAvKiogQ3VzdG9tIGVtb2ppIG5ld2x5IGFkZGVkIHRvIHRoaXMgdXNlcidzIHJlYWN0aW9uICovXG4gICAgICAgIGN1c3RvbUVtb2ppQWRkZWQ6IHN0cmluZ1tdO1xuICAgICAgICAvKiogQ3VzdG9tIGVtb2ppIG5vdCBjaGFuZ2VkIGJ5IHRoZSB1cGRhdGUgdG8gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamlLZXB0OiBzdHJpbmdbXTtcbiAgICAgICAgLyoqIEN1c3RvbSBlbW9qaSByZW1vdmVkIGZyb20gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamlSZW1vdmVkOiBzdHJpbmdbXTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGB0cnVlYCBpZiBhIHBhaWQgcmVhY3Rpb24gaXMgY3VycmVudGx5IHByZXNlbnQgaW4gdGhpcyB1c2VyJ3NcbiAgICAgICAgICogcmVhY3Rpb24sIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAgICAgKi9cbiAgICAgICAgcGFpZDogYm9vbGVhbjtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGB0cnVlYCBpZiBhIHBhaWQgcmVhY3Rpb24gd2FzIG5ld2x5IGFkZGVkIHRvIHRoaXMgdXNlcidzIHJlYWN0aW9uLFxuICAgICAgICAgKiBhbmQgYGZhbHNlYCBvdGhlcndpc2VcbiAgICAgICAgICovXG4gICAgICAgIHBhaWRBZGRlZDogYm9vbGVhbjtcbiAgICB9IHtcbiAgICAgICAgY29uc3QgZW1vamk6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXSA9IFtdO1xuICAgICAgICBjb25zdCBlbW9qaUFkZGVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgZW1vamlLZXB0OiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgZW1vamlSZW1vdmVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgY3VzdG9tRW1vamk6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGN1c3RvbUVtb2ppQWRkZWQ6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGN1c3RvbUVtb2ppS2VwdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgY3VzdG9tRW1vamlSZW1vdmVkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBsZXQgcGFpZCA9IGZhbHNlO1xuICAgICAgICBsZXQgcGFpZEFkZGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHIgPSB0aGlzLm1lc3NhZ2VSZWFjdGlvbjtcbiAgICAgICAgaWYgKHIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgeyBvbGRfcmVhY3Rpb24sIG5ld19yZWFjdGlvbiB9ID0gcjtcbiAgICAgICAgICAgIC8vIGdyb3VwIGFsbCBjdXJyZW50IGVtb2ppIGluIGBlbW9qaWAgYW5kIGBjdXN0b21FbW9qaWBcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2YgbmV3X3JlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiZW1vamlcIikge1xuICAgICAgICAgICAgICAgICAgICBlbW9qaS5wdXNoKHJlYWN0aW9uLmVtb2ppKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tRW1vamkucHVzaChyZWFjdGlvbi5jdXN0b21fZW1vamlfaWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJwYWlkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFpZCA9IHBhaWRBZGRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gdGVtcG9yYXJpbHkgbW92ZSBhbGwgb2xkIGVtb2ppIHRvIHRoZSAqUmVtb3ZlZCBhcnJheXNcbiAgICAgICAgICAgIGZvciAoY29uc3QgcmVhY3Rpb24gb2Ygb2xkX3JlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiZW1vamlcIikge1xuICAgICAgICAgICAgICAgICAgICBlbW9qaVJlbW92ZWQucHVzaChyZWFjdGlvbi5lbW9qaSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZWFjdGlvbi50eXBlID09PSBcImN1c3RvbV9lbW9qaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUVtb2ppUmVtb3ZlZC5wdXNoKHJlYWN0aW9uLmN1c3RvbV9lbW9qaV9pZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZWFjdGlvbi50eXBlID09PSBcInBhaWRcIikge1xuICAgICAgICAgICAgICAgICAgICBwYWlkQWRkZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0ZW1wb3JhcmlseSBtb3ZlIGFsbCBuZXcgZW1vamkgdG8gdGhlICpBZGRlZCBhcnJheXNcbiAgICAgICAgICAgIGVtb2ppQWRkZWQucHVzaCguLi5lbW9qaSk7XG4gICAgICAgICAgICBjdXN0b21FbW9qaUFkZGVkLnB1c2goLi4uY3VzdG9tRW1vamkpO1xuICAgICAgICAgICAgLy8gZHJvcCBjb21tb24gZW1vamkgZnJvbSBib3RoIGxpc3RzIGFuZCBhZGQgdGhlbSB0byBgZW1vamlLZXB0YFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbW9qaVJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBlbW9qaUFkZGVkLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCByZW0gPSBlbW9qaVJlbW92ZWRbaV07XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtID09PSBlbW9qaUFkZGVkW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbW9qaUtlcHQucHVzaChyZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1vamlSZW1vdmVkLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtb2ppQWRkZWQuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkcm9wIGNvbW1vbiBjdXN0b20gZW1vamkgZnJvbSBib3RoIGxpc3RzIGFuZCBhZGQgdGhlbSB0byBgY3VzdG9tRW1vamlLZXB0YFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21FbW9qaVJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBjdXN0b21FbW9qaUFkZGVkLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCByZW0gPSBjdXN0b21FbW9qaVJlbW92ZWRbaV07XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtID09PSBjdXN0b21FbW9qaUFkZGVkW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21FbW9qaUtlcHQucHVzaChyZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tRW1vamlSZW1vdmVkLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUVtb2ppQWRkZWQuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgICAgZW1vamlBZGRlZCxcbiAgICAgICAgICAgIGVtb2ppS2VwdCxcbiAgICAgICAgICAgIGVtb2ppUmVtb3ZlZCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppLFxuICAgICAgICAgICAgY3VzdG9tRW1vamlBZGRlZCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppS2VwdCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppUmVtb3ZlZCxcbiAgICAgICAgICAgIHBhaWQsXG4gICAgICAgICAgICBwYWlkQWRkZWQsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUFJPQklORyBTSE9SVENVVFNcblxuICAgIC8qKlxuICAgICAqIGBDb250ZXh0Lmhhc2AgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgYSBudW1iZXIgb2YgdXNlZnVsIGZ1bmN0aW9ucyBmb3JcbiAgICAgKiBwcm9iaW5nIGNvbnRleHQgb2JqZWN0cy4gRWFjaCBvZiB0aGVzZSBmdW5jdGlvbnMgY2FuIGdlbmVyYXRlIGEgcHJlZGljYXRlXG4gICAgICogZnVuY3Rpb24sIHRvIHdoaWNoIHlvdSBjYW4gcGFzcyBjb250ZXh0IG9iamVjdHMgaW4gb3JkZXIgdG8gY2hlY2sgaWYgYVxuICAgICAqIGNvbmRpdGlvbiBob2xkcyBmb3IgdGhlIHJlc3BlY3RpdmUgY29udGV4dCBvYmplY3QuXG4gICAgICpcbiAgICAgKiBGb3IgZXhhbXBsZSwgeW91IGNhbiBjYWxsIGBDb250ZXh0Lmhhcy5maWx0ZXJRdWVyeShcIjp0ZXh0XCIpYCB0byBnZW5lcmF0ZVxuICAgICAqIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgdGVzdHMgY29udGV4dCBvYmplY3RzIGZvciBjb250YWluaW5nIHRleHQ6XG4gICAgICogYGBgdHNcbiAgICAgKiBjb25zdCBoYXNUZXh0ID0gQ29udGV4dC5oYXMuZmlsdGVyUXVlcnkoXCI6dGV4dFwiKTtcbiAgICAgKlxuICAgICAqIGlmIChoYXNUZXh0KGN0eDApKSB7fSAvLyBgY3R4MGAgbWF0Y2hlcyB0aGUgZmlsdGVyIHF1ZXJ5IGA6dGV4dGBcbiAgICAgKiBpZiAoaGFzVGV4dChjdHgxKSkge30gLy8gYGN0eDFgIG1hdGNoZXMgdGhlIGZpbHRlciBxdWVyeSBgOnRleHRgXG4gICAgICogaWYgKGhhc1RleHQoY3R4MikpIHt9IC8vIGBjdHgyYCBtYXRjaGVzIHRoZSBmaWx0ZXIgcXVlcnkgYDp0ZXh0YFxuICAgICAqIGBgYFxuICAgICAqIFRoZXNlIHByZWRpY2F0ZSBmdW5jdGlvbnMgYXJlIHVzZWQgaW50ZXJuYWxseSBieSB0aGUgaGFzLW1ldGhvZHMgdGhhdCBhcmVcbiAgICAgKiBpbnN0YWxsZWQgb24gZXZlcnkgY29udGV4dCBvYmplY3QuIFRoaXMgbWVhbnMgdGhhdCBjYWxsaW5nXG4gICAgICogYGN0eC5oYXMoXCI6dGV4dFwiKWAgaXMgZXF1aXZhbGVudCB0b1xuICAgICAqIGBDb250ZXh0Lmhhcy5maWx0ZXJRdWVyeShcIjp0ZXh0XCIpKGN0eClgLlxuICAgICAqL1xuICAgIHN0YXRpYyBoYXMgPSBjaGVja2VyO1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgbWF0Y2hlcyB0aGUgZ2l2ZW4gZmlsdGVyIHF1ZXJ5LCBhbmRcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3Qub25gLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbHRlciBUaGUgZmlsdGVyIHF1ZXJ5IHRvIGNoZWNrXG4gICAgICovXG4gICAgaGFzPFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4oZmlsdGVyOiBRIHwgUVtdKTogdGhpcyBpcyBGaWx0ZXJDb3JlPFE+IHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLmZpbHRlclF1ZXJ5KGZpbHRlcikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIHRleHQsIG9yIGlmIGl0XG4gICAgICogY29udGFpbnMgdGV4dCB0aGF0IG1hdGNoZXMgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbi4gSXQgcmV0dXJuc1xuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5oZWFyc2AuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzVGV4dCh0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4pOiB0aGlzIGlzIEhlYXJzQ29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMudGV4dCh0cmlnZ2VyKSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBjb250YWlucyB0aGUgZ2l2ZW4gY29tbWFuZCwgYW5kXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmNvbW1hbmRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgVGhlIGNvbW1hbmQgdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNDb21tYW5kKFxuICAgICAgICBjb21tYW5kOiBNYXliZUFycmF5PFN0cmluZ1dpdGhDb21tYW5kU3VnZ2VzdGlvbnM+LFxuICAgICk6IHRoaXMgaXMgQ29tbWFuZENvbnRleHRDb3JlIHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLmNvbW1hbmQoY29tbWFuZCkodGhpcyk7XG4gICAgfVxuICAgIGhhc1JlYWN0aW9uKFxuICAgICAgICByZWFjdGlvbjogTWF5YmVBcnJheTxSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdIHwgUmVhY3Rpb25UeXBlPixcbiAgICApOiB0aGlzIGlzIFJlYWN0aW9uQ29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMucmVhY3Rpb24ocmVhY3Rpb24pKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGJlbG9uZ3MgdG8gYSBjaGF0IHdpdGggdGhlIGdpdmVuXG4gICAgICogY2hhdCB0eXBlLCBhbmQgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3QuY2hhdFR5cGVgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRUeXBlIFRoZSBjaGF0IHR5cGUgdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNDaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+KFxuICAgICAgICBjaGF0VHlwZTogTWF5YmVBcnJheTxUPixcbiAgICApOiB0aGlzIGlzIENoYXRUeXBlQ29udGV4dENvcmU8VD4ge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuY2hhdFR5cGUoY2hhdFR5cGUpKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGNvbnRhaW5zIHRoZSBnaXZlbiBjYWxsYmFjayBxdWVyeSxcbiAgICAgKiBvciBpZiB0aGUgY29udGFpbmVkIGNhbGxiYWNrIHF1ZXJ5IGRhdGEgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhclxuICAgICAqIGV4cHJlc3Npb24uIEl0IHJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3QuY2FsbGJhY2tRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzQ2FsbGJhY2tRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgQ2FsbGJhY2tRdWVyeUNvbnRleHRDb3JlIHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLmNhbGxiYWNrUXVlcnkodHJpZ2dlcikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIGdhbWUgcXVlcnksIG9yXG4gICAgICogaWYgdGhlIGNvbnRhaW5lZCBnYW1lIHF1ZXJ5IG1hdGNoZXMgdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbi4gSXRcbiAgICAgKiByZXR1cm5zIGBmYWxzZWAgb3RoZXJ3aXNlLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5nYW1lUXVlcnlgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIGhhc0dhbWVRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgR2FtZVF1ZXJ5Q29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuZ2FtZVF1ZXJ5KHRyaWdnZXIpKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGNvbnRhaW5zIHRoZSBnaXZlbiBpbmxpbmUgcXVlcnksIG9yXG4gICAgICogaWYgdGhlIGNvbnRhaW5lZCBpbmxpbmUgcXVlcnkgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBJdFxuICAgICAqIHJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmlubGluZVF1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNJbmxpbmVRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgSW5saW5lUXVlcnlDb250ZXh0Q29yZSB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy5pbmxpbmVRdWVyeSh0cmlnZ2VyKSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBjb250YWlucyB0aGUgY2hvc2VuIGlubGluZSByZXN1bHQsXG4gICAgICogb3IgaWYgdGhlIGNvbnRhaW5lZCBjaG9zZW4gaW5saW5lIHJlc3VsdCBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyXG4gICAgICogZXhwcmVzc2lvbi4gSXQgcmV0dXJucyBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5jaG9zZW5JbmxpbmVSZXN1bHRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIGhhc0Nob3NlbklubGluZVJlc3VsdChcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuY2hvc2VuSW5saW5lUmVzdWx0KHRyaWdnZXIpKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGNvbnRhaW5zIHRoZSBnaXZlbiBwcmUtY2hlY2tvdXRcbiAgICAgKiBxdWVyeSwgb3IgaWYgdGhlIGNvbnRhaW5lZCBwcmUtY2hlY2tvdXQgcXVlcnkgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhclxuICAgICAqIGV4cHJlc3Npb24uIEl0IHJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzUHJlQ2hlY2tvdXRRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgUHJlQ2hlY2tvdXRRdWVyeUNvbnRleHRDb3JlIHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLnByZUNoZWNrb3V0UXVlcnkodHJpZ2dlcikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIHNoaXBwaW5nIHF1ZXJ5LFxuICAgICAqIG9yIGlmIHRoZSBjb250YWluZWQgc2hpcHBpbmcgcXVlcnkgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqIEl0IHJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3Quc2hpcHBpbmdRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzU2hpcHBpbmdRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IHRoaXMgaXMgU2hpcHBpbmdRdWVyeUNvbnRleHRDb3JlIHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLnNoaXBwaW5nUXVlcnkodHJpZ2dlcikodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gQVBJXG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRNZXNzYWdlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdGV4dCBtZXNzYWdlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRleHQgb2YgdGhlIG1lc3NhZ2UgdG8gYmUgc2VudCwgMS00MDk2IGNoYXJhY3RlcnMgYWZ0ZXIgZW50aXRpZXMgcGFyc2luZ1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRtZXNzYWdlXG4gICAgICovXG4gICAgcmVwbHkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRNZXNzYWdlXCIsIFwiY2hhdF9pZFwiIHwgXCJ0ZXh0XCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRNZXNzYWdlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kTWVzc2FnZVwiKSxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5mb3J3YXJkTWVzc2FnZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBmb3J3YXJkIG1lc3NhZ2VzIG9mIGFueSBraW5kLiBTZXJ2aWNlIG1lc3NhZ2VzIGFuZCBtZXNzYWdlcyB3aXRoIHByb3RlY3RlZCBjb250ZW50IGNhbid0IGJlIGZvcndhcmRlZC4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZm9yd2FyZG1lc3NhZ2VcbiAgICAgKi9cbiAgICBmb3J3YXJkTWVzc2FnZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5mb3J3YXJkTWVzc2FnZShcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImZvcndhcmRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLm1zZ0lkLCBcImZvcndhcmRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5mb3J3YXJkTWVzc2FnZXNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZm9yd2FyZCBtdWx0aXBsZSBtZXNzYWdlcyBvZiBhbnkga2luZC4gSWYgc29tZSBvZiB0aGUgc3BlY2lmaWVkIG1lc3NhZ2VzIGNhbid0IGJlIGZvdW5kIG9yIGZvcndhcmRlZCwgdGhleSBhcmUgc2tpcHBlZC4gU2VydmljZSBtZXNzYWdlcyBhbmQgbWVzc2FnZXMgd2l0aCBwcm90ZWN0ZWQgY29udGVudCBjYW4ndCBiZSBmb3J3YXJkZWQuIEFsYnVtIGdyb3VwaW5nIGlzIGtlcHQgZm9yIGZvcndhcmRlZCBtZXNzYWdlcy4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZUlkIG9mIHRoZSBzZW50IG1lc3NhZ2VzIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZHMgQSBsaXN0IG9mIDEtMTAwIGlkZW50aWZpZXJzIG9mIG1lc3NhZ2VzIGluIHRoZSBjdXJyZW50IGNoYXQgdG8gZm9yd2FyZC4gVGhlIGlkZW50aWZpZXJzIG11c3QgYmUgc3BlY2lmaWVkIGluIGEgc3RyaWN0bHkgaW5jcmVhc2luZyBvcmRlci5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNmb3J3YXJkbWVzc2FnZXNcbiAgICAgKi9cbiAgICBmb3J3YXJkTWVzc2FnZXMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZHM6IG51bWJlcltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZXNcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJmcm9tX2NoYXRfaWRcIiB8IFwibWVzc2FnZV9pZHNcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmZvcndhcmRNZXNzYWdlcyhcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImZvcndhcmRNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIG1lc3NhZ2VfaWRzLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jb3B5TWVzc2FnZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBjb3B5IG1lc3NhZ2VzIG9mIGFueSBraW5kLiBTZXJ2aWNlIG1lc3NhZ2VzLCBwYWlkIG1lZGlhIG1lc3NhZ2VzLCBnaXZlYXdheSBtZXNzYWdlcywgZ2l2ZWF3YXkgd2lubmVycyBtZXNzYWdlcywgYW5kIGludm9pY2UgbWVzc2FnZXMgY2FuJ3QgYmUgY29waWVkLiBBIHF1aXogcG9sbCBjYW4gYmUgY29waWVkIG9ubHkgaWYgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCBjb3JyZWN0X29wdGlvbl9pZCBpcyBrbm93biB0byB0aGUgYm90LiBUaGUgbWV0aG9kIGlzIGFuYWxvZ291cyB0byB0aGUgbWV0aG9kIGZvcndhcmRNZXNzYWdlLCBidXQgdGhlIGNvcGllZCBtZXNzYWdlIGRvZXNuJ3QgaGF2ZSBhIGxpbmsgdG8gdGhlIG9yaWdpbmFsIG1lc3NhZ2UuIFJldHVybnMgdGhlIE1lc3NhZ2VJZCBvZiB0aGUgc2VudCBtZXNzYWdlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2NvcHltZXNzYWdlXG4gICAgICovXG4gICAgY29weU1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImNvcHlNZXNzYWdlXCIsIFwiY2hhdF9pZFwiIHwgXCJmcm9tX2NoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jb3B5TWVzc2FnZShcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImNvcHlNZXNzYWdlXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLm1zZ0lkLCBcImNvcHlNZXNzYWdlXCIpLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jb3B5TWVzc2FnZXNgLiBVc2UgdGhpcyBtZXRob2QgdG8gY29weSBtZXNzYWdlcyBvZiBhbnkga2luZC4gSWYgc29tZSBvZiB0aGUgc3BlY2lmaWVkIG1lc3NhZ2VzIGNhbid0IGJlIGZvdW5kIG9yIGNvcGllZCwgdGhleSBhcmUgc2tpcHBlZC4gU2VydmljZSBtZXNzYWdlcywgcGFpZCBtZWRpYSBtZXNzYWdlcywgZ2l2ZWF3YXkgbWVzc2FnZXMsIGdpdmVhd2F5IHdpbm5lcnMgbWVzc2FnZXMsIGFuZCBpbnZvaWNlIG1lc3NhZ2VzIGNhbid0IGJlIGNvcGllZC4gQSBxdWl6IHBvbGwgY2FuIGJlIGNvcGllZCBvbmx5IGlmIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgY29ycmVjdF9vcHRpb25faWQgaXMga25vd24gdG8gdGhlIGJvdC4gVGhlIG1ldGhvZCBpcyBhbmFsb2dvdXMgdG8gdGhlIG1ldGhvZCBmb3J3YXJkTWVzc2FnZXMsIGJ1dCB0aGUgY29waWVkIG1lc3NhZ2VzIGRvbid0IGhhdmUgYSBsaW5rIHRvIHRoZSBvcmlnaW5hbCBtZXNzYWdlLiBBbGJ1bSBncm91cGluZyBpcyBrZXB0IGZvciBjb3BpZWQgbWVzc2FnZXMuIE9uIHN1Y2Nlc3MsIGFuIGFycmF5IG9mIE1lc3NhZ2VJZCBvZiB0aGUgc2VudCBtZXNzYWdlcyBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWRzIEEgbGlzdCBvZiAxLTEwMCBpZGVudGlmaWVycyBvZiBtZXNzYWdlcyBpbiB0aGUgY3VycmVudCBjaGF0IHRvIGNvcHkuIFRoZSBpZGVudGlmaWVycyBtdXN0IGJlIHNwZWNpZmllZCBpbiBhIHN0cmljdGx5IGluY3JlYXNpbmcgb3JkZXIuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY29weW1lc3NhZ2VzXG4gICAgICovXG4gICAgY29weU1lc3NhZ2VzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWRzOiBudW1iZXJbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiY29weU1lc3NhZ2VzXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwiZnJvbV9jaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmNvcHlNZXNzYWdlcyhcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImNvcHlNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIG1lc3NhZ2VfaWRzLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kUGhvdG9gLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwaG90b3MuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGhvdG8gUGhvdG8gdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYSBwaG90byB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBwaG90byBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IHBob3RvIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuIFRoZSBwaG90byBtdXN0IGJlIGF0IG1vc3QgMTAgTUIgaW4gc2l6ZS4gVGhlIHBob3RvJ3Mgd2lkdGggYW5kIGhlaWdodCBtdXN0IG5vdCBleGNlZWQgMTAwMDAgaW4gdG90YWwuIFdpZHRoIGFuZCBoZWlnaHQgcmF0aW8gbXVzdCBiZSBhdCBtb3N0IDIwLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRwaG90b1xuICAgICAqL1xuICAgIHJlcGx5V2l0aFBob3RvKFxuICAgICAgICBwaG90bzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFBob3RvXCIsIFwiY2hhdF9pZFwiIHwgXCJwaG90b1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kUGhvdG8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRQaG90b1wiKSxcbiAgICAgICAgICAgIHBob3RvLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZEF1ZGlvYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYXVkaW8gZmlsZXMsIGlmIHlvdSB3YW50IFRlbGVncmFtIGNsaWVudHMgdG8gZGlzcGxheSB0aGVtIGluIHRoZSBtdXNpYyBwbGF5ZXIuIFlvdXIgYXVkaW8gbXVzdCBiZSBpbiB0aGUgLk1QMyBvciAuTTRBIGZvcm1hdC4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC4gQm90cyBjYW4gY3VycmVudGx5IHNlbmQgYXVkaW8gZmlsZXMgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogRm9yIHNlbmRpbmcgdm9pY2UgbWVzc2FnZXMsIHVzZSB0aGUgc2VuZFZvaWNlIG1ldGhvZCBpbnN0ZWFkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGF1ZGlvIEF1ZGlvIGZpbGUgdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYW4gYXVkaW8gZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYW4gYXVkaW8gZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhdWRpb1xuICAgICAqL1xuICAgIHJlcGx5V2l0aEF1ZGlvKFxuICAgICAgICBhdWRpbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZEF1ZGlvXCIsIFwiY2hhdF9pZFwiIHwgXCJhdWRpb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kQXVkaW8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRBdWRpb1wiKSxcbiAgICAgICAgICAgIGF1ZGlvLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZERvY3VtZW50YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgZ2VuZXJhbCBmaWxlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC4gQm90cyBjYW4gY3VycmVudGx5IHNlbmQgZmlsZXMgb2YgYW55IHR5cGUgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRvY3VtZW50IEZpbGUgdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYSBmaWxlIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIGZpbGUgZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyBvbmUgdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kZG9jdW1lbnRcbiAgICAgKi9cbiAgICByZXBseVdpdGhEb2N1bWVudChcbiAgICAgICAgZG9jdW1lbnQ6IElucHV0RmlsZSB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmREb2N1bWVudFwiLCBcImNoYXRfaWRcIiB8IFwiZG9jdW1lbnRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZERvY3VtZW50KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kRG9jdW1lbnRcIiksXG4gICAgICAgICAgICBkb2N1bWVudCxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRWaWRlb2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIGZpbGVzLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgbXA0IHZpZGVvcyAob3RoZXIgZm9ybWF0cyBtYXkgYmUgc2VudCBhcyBEb2N1bWVudCkuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIHZpZGVvIGZpbGVzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2aWRlbyBWaWRlbyB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIHZpZGVvIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIHZpZGVvIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgdmlkZW8gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kdmlkZW9cbiAgICAgKi9cbiAgICByZXBseVdpdGhWaWRlbyhcbiAgICAgICAgdmlkZW86IElucHV0RmlsZSB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRWaWRlb1wiLCBcImNoYXRfaWRcIiB8IFwidmlkZW9cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZFZpZGVvKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kVmlkZW9cIiksXG4gICAgICAgICAgICB2aWRlbyxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRBbmltYXRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbmltYXRpb24gZmlsZXMgKEdJRiBvciBILjI2NC9NUEVHLTQgQVZDIHZpZGVvIHdpdGhvdXQgc291bmQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBhbmltYXRpb24gZmlsZXMgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGFuaW1hdGlvbiBBbmltYXRpb24gdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYW4gYW5pbWF0aW9uIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhbiBhbmltYXRpb24gZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyBhbmltYXRpb24gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kYW5pbWF0aW9uXG4gICAgICovXG4gICAgcmVwbHlXaXRoQW5pbWF0aW9uKFxuICAgICAgICBhbmltYXRpb246IElucHV0RmlsZSB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRBbmltYXRpb25cIiwgXCJjaGF0X2lkXCIgfCBcImFuaW1hdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kQW5pbWF0aW9uKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kQW5pbWF0aW9uXCIpLFxuICAgICAgICAgICAgYW5pbWF0aW9uLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFZvaWNlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYXVkaW8gZmlsZXMsIGlmIHlvdSB3YW50IFRlbGVncmFtIGNsaWVudHMgdG8gZGlzcGxheSB0aGUgZmlsZSBhcyBhIHBsYXlhYmxlIHZvaWNlIG1lc3NhZ2UuIEZvciB0aGlzIHRvIHdvcmssIHlvdXIgYXVkaW8gbXVzdCBiZSBpbiBhbiAuT0dHIGZpbGUgZW5jb2RlZCB3aXRoIE9QVVMgKG90aGVyIGZvcm1hdHMgbWF5IGJlIHNlbnQgYXMgQXVkaW8gb3IgRG9jdW1lbnQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCB2b2ljZSBtZXNzYWdlcyBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdm9pY2UgQXVkaW8gZmlsZSB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIGZpbGUgdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmR2b2ljZVxuICAgICAqL1xuICAgIHJlcGx5V2l0aFZvaWNlKFxuICAgICAgICB2b2ljZTogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFZvaWNlXCIsIFwiY2hhdF9pZFwiIHwgXCJ2b2ljZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kVm9pY2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRWb2ljZVwiKSxcbiAgICAgICAgICAgIHZvaWNlLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFZpZGVvTm90ZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqIEFzIG9mIHYuNC4wLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgcm91bmRlZCBzcXVhcmUgbXA0IHZpZGVvcyBvZiB1cCB0byAxIG1pbnV0ZSBsb25nLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpZGVvX25vdGUgVmlkZW8gbm90ZSB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIHZpZGVvIG5vdGUgdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSBvciB1cGxvYWQgYSBuZXcgdmlkZW8gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4uIFNlbmRpbmcgdmlkZW8gbm90ZXMgYnkgYSBVUkwgaXMgY3VycmVudGx5IHVuc3VwcG9ydGVkXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZpZGVvbm90ZVxuICAgICAqL1xuICAgIHJlcGx5V2l0aFZpZGVvTm90ZShcbiAgICAgICAgdmlkZW9fbm90ZTogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFZpZGVvTm90ZVwiLCBcImNoYXRfaWRcIiB8IFwidmlkZW9fbm90ZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kVmlkZW9Ob3RlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kVmlkZW9Ob3RlXCIpLFxuICAgICAgICAgICAgdmlkZW9fbm90ZSxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRNZWRpYUdyb3VwYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYSBncm91cCBvZiBwaG90b3MsIHZpZGVvcywgZG9jdW1lbnRzIG9yIGF1ZGlvcyBhcyBhbiBhbGJ1bS4gRG9jdW1lbnRzIGFuZCBhdWRpbyBmaWxlcyBjYW4gYmUgb25seSBncm91cGVkIGluIGFuIGFsYnVtIHdpdGggbWVzc2FnZXMgb2YgdGhlIHNhbWUgdHlwZS4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZXMgdGhhdCB3ZXJlIHNlbnQgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gYXJyYXkgZGVzY3JpYmluZyBtZXNzYWdlcyB0byBiZSBzZW50LCBtdXN0IGluY2x1ZGUgMi0xMCBpdGVtc1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRtZWRpYWdyb3VwXG4gICAgICovXG4gICAgcmVwbHlXaXRoTWVkaWFHcm91cChcbiAgICAgICAgbWVkaWE6IFJlYWRvbmx5QXJyYXk8XG4gICAgICAgICAgICB8IElucHV0TWVkaWFBdWRpb1xuICAgICAgICAgICAgfCBJbnB1dE1lZGlhRG9jdW1lbnRcbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYVBob3RvXG4gICAgICAgICAgICB8IElucHV0TWVkaWFWaWRlb1xuICAgICAgICA+LFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZE1lZGlhR3JvdXBcIiwgXCJjaGF0X2lkXCIgfCBcIm1lZGlhXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRNZWRpYUdyb3VwKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kTWVkaWFHcm91cFwiKSxcbiAgICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZExvY2F0aW9uYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgcG9pbnQgb24gdGhlIG1hcC4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXRpdHVkZSBMYXRpdHVkZSBvZiB0aGUgbG9jYXRpb25cbiAgICAgKiBAcGFyYW0gbG9uZ2l0dWRlIExvbmdpdHVkZSBvZiB0aGUgbG9jYXRpb25cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kbG9jYXRpb25cbiAgICAgKi9cbiAgICByZXBseVdpdGhMb2NhdGlvbihcbiAgICAgICAgbGF0aXR1ZGU6IG51bWJlcixcbiAgICAgICAgbG9uZ2l0dWRlOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kTG9jYXRpb25cIiwgXCJjaGF0X2lkXCIgfCBcImxhdGl0dWRlXCIgfCBcImxvbmdpdHVkZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kTG9jYXRpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRMb2NhdGlvblwiKSxcbiAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgbG9uZ2l0dWRlLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBsaXZlIGxvY2F0aW9uIG1lc3NhZ2VzLiBBIGxvY2F0aW9uIGNhbiBiZSBlZGl0ZWQgdW50aWwgaXRzIGxpdmVfcGVyaW9kIGV4cGlyZXMgb3IgZWRpdGluZyBpcyBleHBsaWNpdGx5IGRpc2FibGVkIGJ5IGEgY2FsbCB0byBzdG9wTWVzc2FnZUxpdmVMb2NhdGlvbi4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXRpdHVkZSBMYXRpdHVkZSBvZiBuZXcgbG9jYXRpb25cbiAgICAgKiBAcGFyYW0gbG9uZ2l0dWRlIExvbmdpdHVkZSBvZiBuZXcgbG9jYXRpb25cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZWxpdmVsb2NhdGlvblxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgICAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIHwgXCJjaGF0X2lkXCJcbiAgICAgICAgICAgIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgICAgICB8IFwibGF0aXR1ZGVcIlxuICAgICAgICAgICAgfCBcImxvbmdpdHVkZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICBjb25zdCBpbmxpbmVJZCA9IHRoaXMuaW5saW5lTWVzc2FnZUlkO1xuICAgICAgICByZXR1cm4gaW5saW5lSWQgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyB0aGlzLmFwaS5lZGl0TWVzc2FnZUxpdmVMb2NhdGlvbklubGluZShcbiAgICAgICAgICAgICAgICBpbmxpbmVJZCxcbiAgICAgICAgICAgICAgICBsYXRpdHVkZSxcbiAgICAgICAgICAgICAgICBsb25naXR1ZGUsXG4gICAgICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICA6IHRoaXMuYXBpLmVkaXRNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIiksXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLm1zZ0lkLCBcImVkaXRNZXNzYWdlTGl2ZUxvY2F0aW9uXCIpLFxuICAgICAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gc3RvcCB1cGRhdGluZyBhIGxpdmUgbG9jYXRpb24gbWVzc2FnZSBiZWZvcmUgbGl2ZV9wZXJpb2QgZXhwaXJlcy4gT24gc3VjY2VzcywgaWYgdGhlIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc3RvcG1lc3NhZ2VsaXZlbG9jYXRpb25cbiAgICAgKi9cbiAgICBzdG9wTWVzc2FnZUxpdmVMb2NhdGlvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwic3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGlubGluZUlkID0gdGhpcy5pbmxpbmVNZXNzYWdlSWQ7XG4gICAgICAgIHJldHVybiBpbmxpbmVJZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IHRoaXMuYXBpLnN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uSW5saW5lKGlubGluZUlkLCBvdGhlcilcbiAgICAgICAgICAgIDogdGhpcy5hcGkuc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzdG9wTWVzc2FnZUxpdmVMb2NhdGlvblwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KHRoaXMubXNnSWQsIFwic3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25cIiksXG4gICAgICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRQYWlkTWVkaWFgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwYWlkIG1lZGlhLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0YXJfY291bnQgVGhlIG51bWJlciBvZiBUZWxlZ3JhbSBTdGFycyB0aGF0IG11c3QgYmUgcGFpZCB0byBidXkgYWNjZXNzIHRvIHRoZSBtZWRpYVxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBhcnJheSBkZXNjcmliaW5nIHRoZSBtZWRpYSB0byBiZSBzZW50OyB1cCB0byAxMCBpdGVtc1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRwYWlkbWVkaWFcbiAgICAgKi9cbiAgICBzZW5kUGFpZE1lZGlhKFxuICAgICAgICBzdGFyX2NvdW50OiBudW1iZXIsXG4gICAgICAgIG1lZGlhOiBJbnB1dFBhaWRNZWRpYVtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFBhaWRNZWRpYVwiLCBcImNoYXRfaWRcIiB8IFwic3Rhcl9jb3VudFwiIHwgXCJtZWRpYVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kUGFpZE1lZGlhKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kUGFpZE1lZGlhXCIpLFxuICAgICAgICAgICAgc3Rhcl9jb3VudCxcbiAgICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kVmVudWVgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBpbmZvcm1hdGlvbiBhYm91dCBhIHZlbnVlLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSB0aXRsZSBOYW1lIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBhZGRyZXNzIEFkZHJlc3Mgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZlbnVlXG4gICAgICovXG4gICAgcmVwbHlXaXRoVmVudWUoXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcInNlbmRWZW51ZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImxhdGl0dWRlXCIgfCBcImxvbmdpdHVkZVwiIHwgXCJ0aXRsZVwiIHwgXCJhZGRyZXNzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kVmVudWUoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRWZW51ZVwiKSxcbiAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgbG9uZ2l0dWRlLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBhZGRyZXNzLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZENvbnRhY3RgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwaG9uZSBjb250YWN0cy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwaG9uZV9udW1iZXIgQ29udGFjdCdzIHBob25lIG51bWJlclxuICAgICAqIEBwYXJhbSBmaXJzdF9uYW1lIENvbnRhY3QncyBmaXJzdCBuYW1lXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGNvbnRhY3RcbiAgICAgKi9cbiAgICByZXBseVdpdGhDb250YWN0KFxuICAgICAgICBwaG9uZV9udW1iZXI6IHN0cmluZyxcbiAgICAgICAgZmlyc3RfbmFtZTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZENvbnRhY3RcIiwgXCJjaGF0X2lkXCIgfCBcInBob25lX251bWJlclwiIHwgXCJmaXJzdF9uYW1lXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRDb250YWN0KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kQ29udGFjdFwiKSxcbiAgICAgICAgICAgIHBob25lX251bWJlcixcbiAgICAgICAgICAgIGZpcnN0X25hbWUsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kUG9sbGAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGEgbmF0aXZlIHBvbGwuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcXVlc3Rpb24gUG9sbCBxdWVzdGlvbiwgMS0zMDAgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBvcHRpb25zIEEgbGlzdCBvZiBhbnN3ZXIgb3B0aW9ucywgMi0xMCBzdHJpbmdzIDEtMTAwIGNoYXJhY3RlcnMgZWFjaFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRwb2xsXG4gICAgICovXG4gICAgcmVwbHlXaXRoUG9sbChcbiAgICAgICAgcXVlc3Rpb246IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogSW5wdXRQb2xsT3B0aW9uW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kUG9sbFwiLCBcImNoYXRfaWRcIiB8IFwicXVlc3Rpb25cIiB8IFwib3B0aW9uc1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kUG9sbChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZFBvbGxcIiksXG4gICAgICAgICAgICBxdWVzdGlvbixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kRGljZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGFuIGFuaW1hdGVkIGVtb2ppIHRoYXQgd2lsbCBkaXNwbGF5IGEgcmFuZG9tIHZhbHVlLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVtb2ppIEVtb2ppIG9uIHdoaWNoIHRoZSBkaWNlIHRocm93IGFuaW1hdGlvbiBpcyBiYXNlZC4gQ3VycmVudGx5LCBtdXN0IGJlIG9uZSBvZiDigJzwn46y4oCdLCDigJzwn46v4oCdLCDigJzwn4+A4oCdLCDigJzimr3igJ0sIOKAnPCfjrPigJ0sIG9yIOKAnPCfjrDigJ0uIERpY2UgY2FuIGhhdmUgdmFsdWVzIDEtNiBmb3Ig4oCc8J+OsuKAnSwg4oCc8J+Or+KAnSBhbmQg4oCc8J+Os+KAnSwgdmFsdWVzIDEtNSBmb3Ig4oCc8J+PgOKAnSBhbmQg4oCc4pq94oCdLCBhbmQgdmFsdWVzIDEtNjQgZm9yIOKAnPCfjrDigJ0uIERlZmF1bHRzIHRvIOKAnPCfjrLigJ1cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kZGljZVxuICAgICAqL1xuICAgIHJlcGx5V2l0aERpY2UoXG4gICAgICAgIGVtb2ppOlxuICAgICAgICAgICAgfCAoc3RyaW5nICYgUmVjb3JkPG5ldmVyLCBuZXZlcj4pXG4gICAgICAgICAgICB8IFwi8J+OslwiXG4gICAgICAgICAgICB8IFwi8J+Or1wiXG4gICAgICAgICAgICB8IFwi8J+PgFwiXG4gICAgICAgICAgICB8IFwi4pq9XCJcbiAgICAgICAgICAgIHwgXCLwn46zXCJcbiAgICAgICAgICAgIHwgXCLwn46wXCIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kRGljZVwiLCBcImNoYXRfaWRcIiB8IFwiZW1vamlcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZERpY2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmREaWNlXCIpLFxuICAgICAgICAgICAgZW1vamksXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kQ2hhdEFjdGlvbmAuIFVzZSB0aGlzIG1ldGhvZCB3aGVuIHlvdSBuZWVkIHRvIHRlbGwgdGhlIHVzZXIgdGhhdCBzb21ldGhpbmcgaXMgaGFwcGVuaW5nIG9uIHRoZSBib3QncyBzaWRlLiBUaGUgc3RhdHVzIGlzIHNldCBmb3IgNSBzZWNvbmRzIG9yIGxlc3MgKHdoZW4gYSBtZXNzYWdlIGFycml2ZXMgZnJvbSB5b3VyIGJvdCwgVGVsZWdyYW0gY2xpZW50cyBjbGVhciBpdHMgdHlwaW5nIHN0YXR1cykuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogRXhhbXBsZTogVGhlIEltYWdlQm90IG5lZWRzIHNvbWUgdGltZSB0byBwcm9jZXNzIGEgcmVxdWVzdCBhbmQgdXBsb2FkIHRoZSBpbWFnZS4gSW5zdGVhZCBvZiBzZW5kaW5nIGEgdGV4dCBtZXNzYWdlIGFsb25nIHRoZSBsaW5lcyBvZiDigJxSZXRyaWV2aW5nIGltYWdlLCBwbGVhc2Ugd2FpdOKApuKAnSwgdGhlIGJvdCBtYXkgdXNlIHNlbmRDaGF0QWN0aW9uIHdpdGggYWN0aW9uID0gdXBsb2FkX3Bob3RvLiBUaGUgdXNlciB3aWxsIHNlZSBhIOKAnHNlbmRpbmcgcGhvdG/igJ0gc3RhdHVzIGZvciB0aGUgYm90LlxuICAgICAqXG4gICAgICogV2Ugb25seSByZWNvbW1lbmQgdXNpbmcgdGhpcyBtZXRob2Qgd2hlbiBhIHJlc3BvbnNlIGZyb20gdGhlIGJvdCB3aWxsIHRha2UgYSBub3RpY2VhYmxlIGFtb3VudCBvZiB0aW1lIHRvIGFycml2ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBhY3Rpb24gVHlwZSBvZiBhY3Rpb24gdG8gYnJvYWRjYXN0LiBDaG9vc2Ugb25lLCBkZXBlbmRpbmcgb24gd2hhdCB0aGUgdXNlciBpcyBhYm91dCB0byByZWNlaXZlOiB0eXBpbmcgZm9yIHRleHQgbWVzc2FnZXMsIHVwbG9hZF9waG90byBmb3IgcGhvdG9zLCByZWNvcmRfdmlkZW8gb3IgdXBsb2FkX3ZpZGVvIGZvciB2aWRlb3MsIHJlY29yZF92b2ljZSBvciB1cGxvYWRfdm9pY2UgZm9yIHZvaWNlIG5vdGVzLCB1cGxvYWRfZG9jdW1lbnQgZm9yIGdlbmVyYWwgZmlsZXMsIGNob29zZV9zdGlja2VyIGZvciBzdGlja2VycywgZmluZF9sb2NhdGlvbiBmb3IgbG9jYXRpb24gZGF0YSwgcmVjb3JkX3ZpZGVvX25vdGUgb3IgdXBsb2FkX3ZpZGVvX25vdGUgZm9yIHZpZGVvIG5vdGVzLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRjaGF0YWN0aW9uXG4gICAgICovXG4gICAgcmVwbHlXaXRoQ2hhdEFjdGlvbihcbiAgICAgICAgYWN0aW9uOlxuICAgICAgICAgICAgfCBcInR5cGluZ1wiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3Bob3RvXCJcbiAgICAgICAgICAgIHwgXCJyZWNvcmRfdmlkZW9cIlxuICAgICAgICAgICAgfCBcInVwbG9hZF92aWRlb1wiXG4gICAgICAgICAgICB8IFwicmVjb3JkX3ZvaWNlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdm9pY2VcIlxuICAgICAgICAgICAgfCBcInVwbG9hZF9kb2N1bWVudFwiXG4gICAgICAgICAgICB8IFwiY2hvb3NlX3N0aWNrZXJcIlxuICAgICAgICAgICAgfCBcImZpbmRfbG9jYXRpb25cIlxuICAgICAgICAgICAgfCBcInJlY29yZF92aWRlb19ub3RlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdmlkZW9fbm90ZVwiLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZENoYXRBY3Rpb25cIiwgXCJjaGF0X2lkXCIgfCBcImFjdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kQ2hhdEFjdGlvbihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZENoYXRBY3Rpb25cIiksXG4gICAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZXRNZXNzYWdlUmVhY3Rpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBjaG9zZW4gcmVhY3Rpb25zIG9uIGEgbWVzc2FnZS4gU2VydmljZSBtZXNzYWdlcyBjYW4ndCBiZSByZWFjdGVkIHRvLiBBdXRvbWF0aWNhbGx5IGZvcndhcmRlZCBtZXNzYWdlcyBmcm9tIGEgY2hhbm5lbCB0byBpdHMgZGlzY3Vzc2lvbiBncm91cCBoYXZlIHRoZSBzYW1lIGF2YWlsYWJsZSByZWFjdGlvbnMgYXMgbWVzc2FnZXMgaW4gdGhlIGNoYW5uZWwuIEJvdHMgY2FuJ3QgdXNlIHBhaWQgcmVhY3Rpb25zLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFjdGlvbiBBIGxpc3Qgb2YgcmVhY3Rpb24gdHlwZXMgdG8gc2V0IG9uIHRoZSBtZXNzYWdlLiBDdXJyZW50bHksIGFzIG5vbi1wcmVtaXVtIHVzZXJzLCBib3RzIGNhbiBzZXQgdXAgdG8gb25lIHJlYWN0aW9uIHBlciBtZXNzYWdlLiBBIGN1c3RvbSBlbW9qaSByZWFjdGlvbiBjYW4gYmUgdXNlZCBpZiBpdCBpcyBlaXRoZXIgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBtZXNzYWdlIG9yIGV4cGxpY2l0bHkgYWxsb3dlZCBieSBjaGF0IGFkbWluaXN0cmF0b3JzLiBQYWlkIHJlYWN0aW9ucyBjYW4ndCBiZSB1c2VkIGJ5IGJvdHMuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0bWVzc2FnZXJlYWN0aW9uXG4gICAgICovXG4gICAgcmVhY3QoXG4gICAgICAgIHJlYWN0aW9uOiBNYXliZUFycmF5PFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl0gfCBSZWFjdGlvblR5cGU+LFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJzZXRNZXNzYWdlUmVhY3Rpb25cIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcInJlYWN0aW9uXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRNZXNzYWdlUmVhY3Rpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldE1lc3NhZ2VSZWFjdGlvblwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5tc2dJZCwgXCJzZXRNZXNzYWdlUmVhY3Rpb25cIiksXG4gICAgICAgICAgICB0eXBlb2YgcmVhY3Rpb24gPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IFt7IHR5cGU6IFwiZW1vamlcIiwgZW1vamk6IHJlYWN0aW9uIH1dXG4gICAgICAgICAgICAgICAgOiAoQXJyYXkuaXNBcnJheShyZWFjdGlvbikgPyByZWFjdGlvbiA6IFtyZWFjdGlvbl0pXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKGVtb2ppKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGVtb2ppID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB7IHR5cGU6IFwiZW1vamlcIiwgZW1vamkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogZW1vamlcbiAgICAgICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0VXNlclByb2ZpbGVQaG90b3NgLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGEgbGlzdCBvZiBwcm9maWxlIHBpY3R1cmVzIGZvciBhIHVzZXIuIFJldHVybnMgYSBVc2VyUHJvZmlsZVBob3RvcyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR1c2VycHJvZmlsZXBob3Rvc1xuICAgICAqL1xuICAgIGdldFVzZXJQcm9maWxlUGhvdG9zKFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiZ2V0VXNlclByb2ZpbGVQaG90b3NcIiwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldFVzZXJQcm9maWxlUGhvdG9zKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwiZ2V0VXNlclByb2ZpbGVQaG90b3NcIikuaWQsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmdldFVzZXJDaGF0Qm9vc3RzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgbGlzdCBvZiBib29zdHMgYWRkZWQgdG8gYSBjaGF0IGJ5IGEgdXNlci4gUmVxdWlyZXMgYWRtaW5pc3RyYXRvciByaWdodHMgaW4gdGhlIGNoYXQuIFJldHVybnMgYSBVc2VyQ2hhdEJvb3N0cyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldHVzZXJjaGF0Ym9vc3RzXG4gICAgICovXG4gICAgZ2V0VXNlckNoYXRCb29zdHMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0VXNlckNoYXRCb29zdHMoXG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwiZ2V0VXNlckNoYXRCb29zdHNcIikuaWQsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRCdXNpbmVzc0Nvbm5lY3Rpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb25uZWN0aW9uIG9mIHRoZSBib3Qgd2l0aCBhIGJ1c2luZXNzIGFjY291bnQuIFJldHVybnMgYSBCdXNpbmVzc0Nvbm5lY3Rpb24gb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRidXNpbmVzc2Nvbm5lY3Rpb25cbiAgICAgKi9cbiAgICBnZXRCdXNpbmVzc0Nvbm5lY3Rpb24oc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldEJ1c2luZXNzQ29ubmVjdGlvbihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgXCJnZXRCdXNpbmVzc0Nvbm5lY3Rpb25cIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRGaWxlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBiYXNpYyBpbmZvIGFib3V0IGEgZmlsZSBhbmQgcHJlcGFyZSBpdCBmb3IgZG93bmxvYWRpbmcuIEZvciB0aGUgbW9tZW50LCBib3RzIGNhbiBkb3dubG9hZCBmaWxlcyBvZiB1cCB0byAyME1CIGluIHNpemUuIE9uIHN1Y2Nlc3MsIGEgRmlsZSBvYmplY3QgaXMgcmV0dXJuZWQuIFRoZSBmaWxlIGNhbiB0aGVuIGJlIGRvd25sb2FkZWQgdmlhIHRoZSBsaW5rIGh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9maWxlL2JvdDx0b2tlbj4vPGZpbGVfcGF0aD4sIHdoZXJlIDxmaWxlX3BhdGg+IGlzIHRha2VuIGZyb20gdGhlIHJlc3BvbnNlLiBJdCBpcyBndWFyYW50ZWVkIHRoYXQgdGhlIGxpbmsgd2lsbCBiZSB2YWxpZCBmb3IgYXQgbGVhc3QgMSBob3VyLiBXaGVuIHRoZSBsaW5rIGV4cGlyZXMsIGEgbmV3IG9uZSBjYW4gYmUgcmVxdWVzdGVkIGJ5IGNhbGxpbmcgZ2V0RmlsZSBhZ2Fpbi5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gbWF5IG5vdCBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgZmlsZSBuYW1lIGFuZCBNSU1FIHR5cGUuIFlvdSBzaG91bGQgc2F2ZSB0aGUgZmlsZSdzIE1JTUUgdHlwZSBhbmQgbmFtZSAoaWYgYXZhaWxhYmxlKSB3aGVuIHRoZSBGaWxlIG9iamVjdCBpcyByZWNlaXZlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0ZmlsZVxuICAgICAqL1xuICAgIGdldEZpbGUoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgY29uc3QgbSA9IG9yVGhyb3codGhpcy5tc2csIFwiZ2V0RmlsZVwiKTtcbiAgICAgICAgY29uc3QgZmlsZSA9IG0ucGhvdG8gIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBtLnBob3RvW20ucGhvdG8ubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIDogbS5hbmltYXRpb24gPz9cbiAgICAgICAgICAgICAgICBtLmF1ZGlvID8/XG4gICAgICAgICAgICAgICAgbS5kb2N1bWVudCA/P1xuICAgICAgICAgICAgICAgIG0udmlkZW8gPz9cbiAgICAgICAgICAgICAgICBtLnZpZGVvX25vdGUgPz9cbiAgICAgICAgICAgICAgICBtLnZvaWNlID8/XG4gICAgICAgICAgICAgICAgbS5zdGlja2VyO1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0RmlsZShvclRocm93KGZpbGUsIFwiZ2V0RmlsZVwiKS5maWxlX2lkLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgYGJhbkF1dGhvcmAgaW5zdGVhZC4gKi9cbiAgICBraWNrQXV0aG9yKC4uLmFyZ3M6IFBhcmFtZXRlcnM8Q29udGV4dFtcImJhbkF1dGhvclwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFuQXV0aG9yKC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuYmFuQ2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byBiYW4gYSB1c2VyIGluIGEgZ3JvdXAsIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIEluIHRoZSBjYXNlIG9mIHN1cGVyZ3JvdXBzIGFuZCBjaGFubmVscywgdGhlIHVzZXIgd2lsbCBub3QgYmUgYWJsZSB0byByZXR1cm4gdG8gdGhlIGNoYXQgb24gdGhlaXIgb3duIHVzaW5nIGludml0ZSBsaW5rcywgZXRjLiwgdW5sZXNzIHVuYmFubmVkIGZpcnN0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2JhbmNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBiYW5BdXRob3IoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJiYW5DaGF0TWVtYmVyXCIsIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmJhbkNoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImJhbkF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcImJhbkF1dGhvclwiKS5pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgYGJhbkNoYXRNZW1iZXJgIGluc3RlYWQuICovXG4gICAga2lja0NoYXRNZW1iZXIoLi4uYXJnczogUGFyYW1ldGVyczxDb250ZXh0W1wiYmFuQ2hhdE1lbWJlclwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFuQ2hhdE1lbWJlciguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmJhbkNoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gYmFuIGEgdXNlciBpbiBhIGdyb3VwLCBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBJbiB0aGUgY2FzZSBvZiBzdXBlcmdyb3VwcyBhbmQgY2hhbm5lbHMsIHRoZSB1c2VyIHdpbGwgbm90IGJlIGFibGUgdG8gcmV0dXJuIHRvIHRoZSBjaGF0IG9uIHRoZWlyIG93biB1c2luZyBpbnZpdGUgbGlua3MsIGV0Yy4sIHVubGVzcyB1bmJhbm5lZCBmaXJzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgYmFuQ2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiYmFuQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5iYW5DaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJiYW5DaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkudW5iYW5DaGF0TWVtYmVyYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHVuYmFuIGEgcHJldmlvdXNseSBiYW5uZWQgdXNlciBpbiBhIHN1cGVyZ3JvdXAgb3IgY2hhbm5lbC4gVGhlIHVzZXIgd2lsbCBub3QgcmV0dXJuIHRvIHRoZSBncm91cCBvciBjaGFubmVsIGF1dG9tYXRpY2FsbHksIGJ1dCB3aWxsIGJlIGFibGUgdG8gam9pbiB2aWEgbGluaywgZXRjLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBmb3IgdGhpcyB0byB3b3JrLiBCeSBkZWZhdWx0LCB0aGlzIG1ldGhvZCBndWFyYW50ZWVzIHRoYXQgYWZ0ZXIgdGhlIGNhbGwgdGhlIHVzZXIgaXMgbm90IGEgbWVtYmVyIG9mIHRoZSBjaGF0LCBidXQgd2lsbCBiZSBhYmxlIHRvIGpvaW4gaXQuIFNvIGlmIHRoZSB1c2VyIGlzIGEgbWVtYmVyIG9mIHRoZSBjaGF0IHRoZXkgd2lsbCBhbHNvIGJlIHJlbW92ZWQgZnJvbSB0aGUgY2hhdC4gSWYgeW91IGRvbid0IHdhbnQgdGhpcywgdXNlIHRoZSBwYXJhbWV0ZXIgb25seV9pZl9iYW5uZWQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5iYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgdW5iYW5DaGF0TWVtYmVyKFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJ1bmJhbkNoYXRNZW1iZXJcIiwgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkudW5iYW5DaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bmJhbkNoYXRNZW1iZXJcIiksXG4gICAgICAgICAgICB1c2VyX2lkLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5yZXN0cmljdENoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gcmVzdHJpY3QgYSB1c2VyIGluIGEgc3VwZXJncm91cC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIHN1cGVyZ3JvdXAgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUGFzcyBUcnVlIGZvciBhbGwgcGVybWlzc2lvbnMgdG8gbGlmdCByZXN0cmljdGlvbnMgZnJvbSBhIHVzZXIuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlcm1pc3Npb25zIEFuIG9iamVjdCBmb3IgbmV3IHVzZXIgcGVybWlzc2lvbnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXN0cmljdGNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICByZXN0cmljdEF1dGhvcihcbiAgICAgICAgcGVybWlzc2lvbnM6IENoYXRQZXJtaXNzaW9ucyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwicmVzdHJpY3RDaGF0TWVtYmVyXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucmVzdHJpY3RDaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJyZXN0cmljdEF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcInJlc3RyaWN0QXV0aG9yXCIpLmlkLFxuICAgICAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnJlc3RyaWN0Q2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byByZXN0cmljdCBhIHVzZXIgaW4gYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIFRydWUgZm9yIGFsbCBwZXJtaXNzaW9ucyB0byBsaWZ0IHJlc3RyaWN0aW9ucyBmcm9tIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gcGVybWlzc2lvbnMgQW4gb2JqZWN0IGZvciBuZXcgdXNlciBwZXJtaXNzaW9uc1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Jlc3RyaWN0Y2hhdG1lbWJlclxuICAgICAqL1xuICAgIHJlc3RyaWN0Q2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJyZXN0cmljdENoYXRNZW1iZXJcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCIgfCBcInBlcm1pc3Npb25zXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZXN0cmljdENoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInJlc3RyaWN0Q2hhdE1lbWJlclwiKSxcbiAgICAgICAgICAgIHVzZXJfaWQsXG4gICAgICAgICAgICBwZXJtaXNzaW9ucyxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucHJvbW90ZUNoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gcHJvbW90ZSBvciBkZW1vdGUgYSB1c2VyIGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFBhc3MgRmFsc2UgZm9yIGFsbCBib29sZWFuIHBhcmFtZXRlcnMgdG8gZGVtb3RlIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwcm9tb3RlY2hhdG1lbWJlclxuICAgICAqL1xuICAgIHByb21vdGVBdXRob3IoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJwcm9tb3RlQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5wcm9tb3RlQ2hhdE1lbWJlcihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwicHJvbW90ZUF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcInByb21vdGVBdXRob3JcIikuaWQsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnByb21vdGVDaGF0TWVtYmVyYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHByb21vdGUgb3IgZGVtb3RlIGEgdXNlciBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIEZhbHNlIGZvciBhbGwgYm9vbGVhbiBwYXJhbWV0ZXJzIHRvIGRlbW90ZSBhIHVzZXIuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcHJvbW90ZWNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBwcm9tb3RlQ2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwicHJvbW90ZUNoYXRNZW1iZXJcIiwgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucHJvbW90ZUNoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInByb21vdGVDaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2V0Q2hhdEFkbWluaXN0cmF0b3JDdXN0b21UaXRsZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBjdXN0b20gdGl0bGUgZm9yIGFuIGFkbWluaXN0cmF0b3IgaW4gYSBzdXBlcmdyb3VwIHByb21vdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGN1c3RvbV90aXRsZSBOZXcgY3VzdG9tIHRpdGxlIGZvciB0aGUgYWRtaW5pc3RyYXRvcjsgMC0xNiBjaGFyYWN0ZXJzLCBlbW9qaSBhcmUgbm90IGFsbG93ZWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRhZG1pbmlzdHJhdG9yY3VzdG9tdGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0QWRtaW5pc3RyYXRvckF1dGhvckN1c3RvbVRpdGxlKFxuICAgICAgICBjdXN0b21fdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZXRDaGF0QWRtaW5pc3RyYXRvckF1dGhvckN1c3RvbVRpdGxlXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwic2V0Q2hhdEFkbWluaXN0cmF0b3JBdXRob3JDdXN0b21UaXRsZVwiKS5pZCxcbiAgICAgICAgICAgIGN1c3RvbV90aXRsZSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRBZG1pbmlzdHJhdG9yQ3VzdG9tVGl0bGVgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IGEgY3VzdG9tIHRpdGxlIGZvciBhbiBhZG1pbmlzdHJhdG9yIGluIGEgc3VwZXJncm91cCBwcm9tb3RlZCBieSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBjdXN0b21fdGl0bGUgTmV3IGN1c3RvbSB0aXRsZSBmb3IgdGhlIGFkbWluaXN0cmF0b3I7IDAtMTYgY2hhcmFjdGVycywgZW1vamkgYXJlIG5vdCBhbGxvd2VkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0YWRtaW5pc3RyYXRvcmN1c3RvbXRpdGxlXG4gICAgICovXG4gICAgc2V0Q2hhdEFkbWluaXN0cmF0b3JDdXN0b21UaXRsZShcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBjdXN0b21fdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIGN1c3RvbV90aXRsZSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmJhbkNoYXRTZW5kZXJDaGF0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGJhbiBhIGNoYW5uZWwgY2hhdCBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBVbnRpbCB0aGUgY2hhdCBpcyB1bmJhbm5lZCwgdGhlIG93bmVyIG9mIHRoZSBiYW5uZWQgY2hhdCB3b24ndCBiZSBhYmxlIHRvIHNlbmQgbWVzc2FnZXMgb24gYmVoYWxmIG9mIGFueSBvZiB0aGVpciBjaGFubmVscy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZW5kZXJfY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHNlbmRlciBjaGF0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0c2VuZGVyY2hhdFxuICAgICAqL1xuICAgIGJhbkNoYXRTZW5kZXJDaGF0KHNlbmRlcl9jaGF0X2lkOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5iYW5DaGF0U2VuZGVyQ2hhdChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiYmFuQ2hhdFNlbmRlckNoYXRcIiksXG4gICAgICAgICAgICBzZW5kZXJfY2hhdF9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVuYmFuQ2hhdFNlbmRlckNoYXRgLiBVc2UgdGhpcyBtZXRob2QgdG8gdW5iYW4gYSBwcmV2aW91c2x5IGJhbm5lZCBjaGFubmVsIGNoYXQgaW4gYSBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNlbmRlcl9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgc2VuZGVyIGNoYXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VuYmFuY2hhdHNlbmRlcmNoYXRcbiAgICAgKi9cbiAgICB1bmJhbkNoYXRTZW5kZXJDaGF0KFxuICAgICAgICBzZW5kZXJfY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVuYmFuQ2hhdFNlbmRlckNoYXQoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInVuYmFuQ2hhdFNlbmRlckNoYXRcIiksXG4gICAgICAgICAgICBzZW5kZXJfY2hhdF9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRQZXJtaXNzaW9uc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgZGVmYXVsdCBjaGF0IHBlcm1pc3Npb25zIGZvciBhbGwgbWVtYmVycy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGdyb3VwIG9yIGEgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9yZXN0cmljdF9tZW1iZXJzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwZXJtaXNzaW9ucyBOZXcgZGVmYXVsdCBjaGF0IHBlcm1pc3Npb25zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHBlcm1pc3Npb25zXG4gICAgICovXG4gICAgc2V0Q2hhdFBlcm1pc3Npb25zKFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2V0Q2hhdFBlcm1pc3Npb25zXCIsIFwiY2hhdF9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0UGVybWlzc2lvbnMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXRQZXJtaXNzaW9uc1wiKSxcbiAgICAgICAgICAgIHBlcm1pc3Npb25zLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5leHBvcnRDaGF0SW52aXRlTGlua2AuIFVzZSB0aGlzIG1ldGhvZCB0byBnZW5lcmF0ZSBhIG5ldyBwcmltYXJ5IGludml0ZSBsaW5rIGZvciBhIGNoYXQ7IGFueSBwcmV2aW91c2x5IGdlbmVyYXRlZCBwcmltYXJ5IGxpbmsgaXMgcmV2b2tlZC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyB0aGUgbmV3IGludml0ZSBsaW5rIGFzIFN0cmluZyBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogTm90ZTogRWFjaCBhZG1pbmlzdHJhdG9yIGluIGEgY2hhdCBnZW5lcmF0ZXMgdGhlaXIgb3duIGludml0ZSBsaW5rcy4gQm90cyBjYW4ndCB1c2UgaW52aXRlIGxpbmtzIGdlbmVyYXRlZCBieSBvdGhlciBhZG1pbmlzdHJhdG9ycy4gSWYgeW91IHdhbnQgeW91ciBib3QgdG8gd29yayB3aXRoIGludml0ZSBsaW5rcywgaXQgd2lsbCBuZWVkIHRvIGdlbmVyYXRlIGl0cyBvd24gbGluayB1c2luZyBleHBvcnRDaGF0SW52aXRlTGluayBvciBieSBjYWxsaW5nIHRoZSBnZXRDaGF0IG1ldGhvZC4gSWYgeW91ciBib3QgbmVlZHMgdG8gZ2VuZXJhdGUgYSBuZXcgcHJpbWFyeSBpbnZpdGUgbGluayByZXBsYWNpbmcgaXRzIHByZXZpb3VzIG9uZSwgdXNlIGV4cG9ydENoYXRJbnZpdGVMaW5rIGFnYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNleHBvcnRjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGV4cG9ydENoYXRJbnZpdGVMaW5rKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5leHBvcnRDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZXhwb3J0Q2hhdEludml0ZUxpbmtcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jcmVhdGVDaGF0SW52aXRlTGlua2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYW4gYWRkaXRpb25hbCBpbnZpdGUgbGluayBmb3IgYSBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgbGluayBjYW4gYmUgcmV2b2tlZCB1c2luZyB0aGUgbWV0aG9kIHJldm9rZUNoYXRJbnZpdGVMaW5rLiBSZXR1cm5zIHRoZSBuZXcgaW52aXRlIGxpbmsgYXMgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY3JlYXRlY2hhdGludml0ZWxpbmtcbiAgICAgKi9cbiAgICBjcmVhdGVDaGF0SW52aXRlTGluayhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImNyZWF0ZUNoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jcmVhdGVDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiY3JlYXRlQ2hhdEludml0ZUxpbmtcIiksXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmVkaXRDaGF0SW52aXRlTGlua2AuIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGEgbm9uLXByaW1hcnkgaW52aXRlIGxpbmsgY3JlYXRlZCBieSB0aGUgYm90LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSBlZGl0ZWQgaW52aXRlIGxpbmsgYXMgYSBDaGF0SW52aXRlTGluayBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW52aXRlX2xpbmsgVGhlIGludml0ZSBsaW5rIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0Y2hhdGludml0ZWxpbmtcbiAgICAgKi9cbiAgICBlZGl0Q2hhdEludml0ZUxpbmsoXG4gICAgICAgIGludml0ZV9saW5rOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJlZGl0Q2hhdEludml0ZUxpbmtcIiwgXCJjaGF0X2lkXCIgfCBcImludml0ZV9saW5rXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmVkaXRDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdENoYXRJbnZpdGVMaW5rXCIpLFxuICAgICAgICAgICAgaW52aXRlX2xpbmssXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNyZWF0ZUNoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhIHN1YnNjcmlwdGlvbiBpbnZpdGUgbGluayBmb3IgYSBjaGFubmVsIGNoYXQuIFRoZSBib3QgbXVzdCBoYXZlIHRoZSBjYW5faW52aXRlX3VzZXJzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgbGluayBjYW4gYmUgZWRpdGVkIHVzaW5nIHRoZSBtZXRob2QgZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rIG9yIHJldm9rZWQgdXNpbmcgdGhlIG1ldGhvZCByZXZva2VDaGF0SW52aXRlTGluay4gUmV0dXJucyB0aGUgbmV3IGludml0ZSBsaW5rIGFzIGEgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHN1YnNjcmlwdGlvbl9wZXJpb2QgVGhlIG51bWJlciBvZiBzZWNvbmRzIHRoZSBzdWJzY3JpcHRpb24gd2lsbCBiZSBhY3RpdmUgZm9yIGJlZm9yZSB0aGUgbmV4dCBwYXltZW50LiBDdXJyZW50bHksIGl0IG11c3QgYWx3YXlzIGJlIDI1OTIwMDAgKDMwIGRheXMpLlxuICAgICAqIEBwYXJhbSBzdWJzY3JpcHRpb25fcHJpY2UgVGhlIGFtb3VudCBvZiBUZWxlZ3JhbSBTdGFycyBhIHVzZXIgbXVzdCBwYXkgaW5pdGlhbGx5IGFuZCBhZnRlciBlYWNoIHN1YnNlcXVlbnQgc3Vic2NyaXB0aW9uIHBlcmlvZCB0byBiZSBhIG1lbWJlciBvZiB0aGUgY2hhdDsgMS0yNTAwXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY3JlYXRlY2hhdHN1YnNjcmlwdGlvbmludml0ZWxpbmtcbiAgICAgKi9cbiAgICBjcmVhdGVDaGF0U3Vic2NyaXB0aW9uSW52aXRlTGluayhcbiAgICAgICAgc3Vic2NyaXB0aW9uX3BlcmlvZDogbnVtYmVyLFxuICAgICAgICBzdWJzY3JpcHRpb25fcHJpY2U6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiY3JlYXRlQ2hhdFN1YnNjcmlwdGlvbkludml0ZUxpbmtcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJzdWJzY3JpcHRpb25fcGVyaW9kXCIgfCBcInN1YnNjcmlwdGlvbl9wcmljZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuY3JlYXRlQ2hhdFN1YnNjcmlwdGlvbkludml0ZUxpbmsoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImNyZWF0ZUNoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rXCIpLFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uX3BlcmlvZCxcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbl9wcmljZSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgYSBzdWJzY3JpcHRpb24gaW52aXRlIGxpbmsgY3JlYXRlZCBieSB0aGUgYm90LiBUaGUgYm90IG11c3QgaGF2ZSB0aGUgY2FuX2ludml0ZV91c2VycyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyB0aGUgZWRpdGVkIGludml0ZSBsaW5rIGFzIGEgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGludml0ZV9saW5rIFRoZSBpbnZpdGUgbGluayB0byBlZGl0XG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGNoYXRzdWJzY3JpcHRpb25pbnZpdGVsaW5rXG4gICAgICovXG4gICAgZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rKFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJlZGl0Q2hhdFN1YnNjcmlwdGlvbkludml0ZUxpbmtcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJpbnZpdGVfbGlua1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJlZGl0Q2hhdFN1YnNjcmlwdGlvbkludml0ZUxpbmtcIiksXG4gICAgICAgICAgICBpbnZpdGVfbGluayxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucmV2b2tlQ2hhdEludml0ZUxpbmtgLiBVc2UgdGhpcyBtZXRob2QgdG8gcmV2b2tlIGFuIGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gSWYgdGhlIHByaW1hcnkgbGluayBpcyByZXZva2VkLCBhIG5ldyBsaW5rIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSByZXZva2VkIGludml0ZSBsaW5rIGFzIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbnZpdGVfbGluayBUaGUgaW52aXRlIGxpbmsgdG8gcmV2b2tlXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXZva2VjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIHJldm9rZUNoYXRJbnZpdGVMaW5rKGludml0ZV9saW5rOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZXZva2VDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdENoYXRJbnZpdGVMaW5rXCIpLFxuICAgICAgICAgICAgaW52aXRlX2xpbmssXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5hcHByb3ZlQ2hhdEpvaW5SZXF1ZXN0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGFwcHJvdmUgYSBjaGF0IGpvaW4gcmVxdWVzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5faW52aXRlX3VzZXJzIGFkbWluaXN0cmF0b3IgcmlnaHQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhcHByb3ZlY2hhdGpvaW5yZXF1ZXN0XG4gICAgICovXG4gICAgYXBwcm92ZUNoYXRKb2luUmVxdWVzdChcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImFwcHJvdmVDaGF0Sm9pblJlcXVlc3RcIiksXG4gICAgICAgICAgICB1c2VyX2lkLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVjbGluZUNoYXRKb2luUmVxdWVzdGAuIFVzZSB0aGlzIG1ldGhvZCB0byBkZWNsaW5lIGEgY2hhdCBqb2luIHJlcXVlc3QuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX2ludml0ZV91c2VycyBhZG1pbmlzdHJhdG9yIHJpZ2h0LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVjbGluZWNoYXRqb2lucmVxdWVzdFxuICAgICAqL1xuICAgIGRlY2xpbmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5kZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0XCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRQaG90b2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBuZXcgcHJvZmlsZSBwaG90byBmb3IgdGhlIGNoYXQuIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwaG90byBOZXcgY2hhdCBwaG90bywgdXBsb2FkZWQgdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHBob3RvXG4gICAgICovXG4gICAgc2V0Q2hhdFBob3RvKHBob3RvOiBJbnB1dEZpbGUsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0UGhvdG8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXRQaG90b1wiKSxcbiAgICAgICAgICAgIHBob3RvLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlQ2hhdFBob3RvYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIGNoYXQgcGhvdG8uIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlY2hhdHBob3RvXG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFBob3RvKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5kZWxldGVDaGF0UGhvdG8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImRlbGV0ZUNoYXRQaG90b1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRUaXRsZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIHRpdGxlIG9mIGEgY2hhdC4gVGl0bGVzIGNhbid0IGJlIGNoYW5nZWQgZm9yIHByaXZhdGUgY2hhdHMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlIE5ldyBjaGF0IHRpdGxlLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0dGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0VGl0bGUodGl0bGU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNldENoYXRUaXRsZShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2V0Q2hhdFRpdGxlXCIpLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZXRDaGF0RGVzY3JpcHRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBkZXNjcmlwdGlvbiBvZiBhIGdyb3VwLCBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBOZXcgY2hhdCBkZXNjcmlwdGlvbiwgMC0yNTUgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgc2V0Q2hhdERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0RGVzY3JpcHRpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXREZXNjcmlwdGlvblwiKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucGluQ2hhdE1lc3NhZ2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gYWRkIGEgbWVzc2FnZSB0byB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiBhIG1lc3NhZ2UgdG8gcGluXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcGluY2hhdG1lc3NhZ2VcbiAgICAgKi9cbiAgICBwaW5DaGF0TWVzc2FnZShcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwicGluQ2hhdE1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInBpbkNoYXRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkudW5waW5DaGF0TWVzc2FnZWAuIFVzZSB0aGlzIG1ldGhvZCB0byByZW1vdmUgYSBtZXNzYWdlIGZyb20gdGhlIGxpc3Qgb2YgcGlubmVkIG1lc3NhZ2VzIGluIGEgY2hhdC4gSWYgdGhlIGNoYXQgaXMgbm90IGEgcHJpdmF0ZSBjaGF0LCB0aGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlICdjYW5fcGluX21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgc3VwZXJncm91cCBvciAnY2FuX2VkaXRfbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBjaGFubmVsLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgYSBtZXNzYWdlIHRvIHVucGluLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbW9zdCByZWNlbnQgcGlubmVkIG1lc3NhZ2UgKGJ5IHNlbmRpbmcgZGF0ZSkgd2lsbCBiZSB1bnBpbm5lZC5cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluY2hhdG1lc3NhZ2VcbiAgICAgKi9cbiAgICB1bnBpbkNoYXRNZXNzYWdlKG1lc3NhZ2VfaWQ/OiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS51bnBpbkNoYXRNZXNzYWdlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bnBpbkNoYXRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVucGluQWxsQ2hhdE1lc3NhZ2VzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNsZWFyIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIGNoYXQuIElmIHRoZSBjaGF0IGlzIG5vdCBhIHByaXZhdGUgY2hhdCwgdGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSAnY2FuX3Bpbl9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIHN1cGVyZ3JvdXAgb3IgJ2Nhbl9lZGl0X21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgY2hhbm5lbC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsY2hhdG1lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxDaGF0TWVzc2FnZXMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVucGluQWxsQ2hhdE1lc3NhZ2VzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bnBpbkFsbENoYXRNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmxlYXZlQ2hhdGAuIFVzZSB0aGlzIG1ldGhvZCBmb3IgeW91ciBib3QgdG8gbGVhdmUgYSBncm91cCwgc3VwZXJncm91cCBvciBjaGFubmVsLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbGVhdmVjaGF0XG4gICAgICovXG4gICAgbGVhdmVDaGF0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5sZWF2ZUNoYXQob3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJsZWF2ZUNoYXRcIiksIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRDaGF0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB1cCB0byBkYXRlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjaGF0IChjdXJyZW50IG5hbWUgb2YgdGhlIHVzZXIgZm9yIG9uZS1vbi1vbmUgY29udmVyc2F0aW9ucywgY3VycmVudCB1c2VybmFtZSBvZiBhIHVzZXIsIGdyb3VwIG9yIGNoYW5uZWwsIGV0Yy4pLiBSZXR1cm5zIGEgQ2hhdCBvYmplY3Qgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdFxuICAgICAqL1xuICAgIGdldENoYXQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXQob3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0XCIpLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdEFkbWluaXN0cmF0b3JzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBhIGxpc3Qgb2YgYWRtaW5pc3RyYXRvcnMgaW4gYSBjaGF0LCB3aGljaCBhcmVuJ3QgYm90cy4gUmV0dXJucyBhbiBBcnJheSBvZiBDaGF0TWVtYmVyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRhZG1pbmlzdHJhdG9yc1xuICAgICAqL1xuICAgIGdldENoYXRBZG1pbmlzdHJhdG9ycyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0Q2hhdEFkbWluaXN0cmF0b3JzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0QWRtaW5pc3RyYXRvcnNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqIEBkZXByZWNhdGVkIFVzZSBgZ2V0Q2hhdE1lbWJlcnNDb3VudGAgaW5zdGVhZC4gKi9cbiAgICBnZXRDaGF0TWVtYmVyc0NvdW50KC4uLmFyZ3M6IFBhcmFtZXRlcnM8Q29udGV4dFtcImdldENoYXRNZW1iZXJDb3VudFwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2hhdE1lbWJlckNvdW50KC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdE1lbWJlckNvdW50YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgbnVtYmVyIG9mIG1lbWJlcnMgaW4gYSBjaGF0LiBSZXR1cm5zIEludCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyY291bnRcbiAgICAgKi9cbiAgICBnZXRDaGF0TWVtYmVyQ291bnQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXRNZW1iZXJDb3VudChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZ2V0Q2hhdE1lbWJlckNvdW50XCIpLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBtZW1iZXIgb2YgYSBjaGF0LiBUaGUgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8gd29yayBvbmx5IGlmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIENoYXRNZW1iZXIgb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBnZXRBdXRob3Ioc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImdldEF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcImdldEF1dGhvclwiKS5pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmdldENoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IGEgbWVtYmVyIG9mIGEgY2hhdC4gVGhlIG1ldGhvZCBpcyBndWFyYW50ZWVkIHRvIHdvcmsgb25seSBpZiB0aGUgYm90IGlzIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQuIFJldHVybnMgYSBDaGF0TWVtYmVyIG9iamVjdCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyXG4gICAgICovXG4gICAgZ2V0Q2hhdE1lbWJlcih1c2VyX2lkOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRDaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRTdGlja2VyU2V0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNldCBhIG5ldyBncm91cCBzdGlja2VyIHNldCBmb3IgYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBVc2UgdGhlIGZpZWxkIGNhbl9zZXRfc3RpY2tlcl9zZXQgbHkgcmV0dXJuZWQgaW4gZ2V0Q2hhdCByZXF1ZXN0cyB0byBjaGVjayBpZiB0aGUgYm90IGNhbiB1c2UgdGhpcyBtZXRob2QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXJfc2V0X25hbWUgTmFtZSBvZiB0aGUgc3RpY2tlciBzZXQgdG8gYmUgc2V0IGFzIHRoZSBncm91cCBzdGlja2VyIHNldFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHN0aWNrZXJzZXRcbiAgICAgKi9cbiAgICBzZXRDaGF0U3RpY2tlclNldChzdGlja2VyX3NldF9uYW1lOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0U3RpY2tlclNldChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2V0Q2hhdFN0aWNrZXJTZXRcIiksXG4gICAgICAgICAgICBzdGlja2VyX3NldF9uYW1lLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlQ2hhdFN0aWNrZXJTZXRgLiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIGEgZ3JvdXAgc3RpY2tlciBzZXQgZnJvbSBhIHN1cGVyZ3JvdXAuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFVzZSB0aGUgZmllbGQgY2FuX3NldF9zdGlja2VyX3NldCBseSByZXR1cm5lZCBpbiBnZXRDaGF0IHJlcXVlc3RzIHRvIGNoZWNrIGlmIHRoZSBib3QgY2FuIHVzZSB0aGlzIG1ldGhvZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFN0aWNrZXJTZXQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmRlbGV0ZUNoYXRTdGlja2VyU2V0KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWxldGVDaGF0U3RpY2tlclNldFwiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNyZWF0ZUZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGEgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNyZWF0ZWQgdG9waWMgYXMgYSBGb3J1bVRvcGljIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVmb3J1bXRvcGljXG4gICAgICovXG4gICAgY3JlYXRlRm9ydW1Ub3BpYyhcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiY3JlYXRlRm9ydW1Ub3BpY1wiLCBcImNoYXRfaWRcIiB8IFwibmFtZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jcmVhdGVGb3J1bVRvcGljKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJjcmVhdGVGb3J1bVRvcGljXCIpLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdEZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBuYW1lIGFuZCBpY29uIG9mIGEgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMsIHVubGVzcyBpdCBpcyB0aGUgY3JlYXRvciBvZiB0aGUgdG9waWMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGZvcnVtdG9waWNcbiAgICAgKi9cbiAgICBlZGl0Rm9ydW1Ub3BpYyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImVkaXRGb3J1bVRvcGljXCIsIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX3RocmVhZF9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvclRocm93KHRoaXMubXNnLCBcImVkaXRGb3J1bVRvcGljXCIpO1xuICAgICAgICBjb25zdCB0aHJlYWQgPSBvclRocm93KG1lc3NhZ2UubWVzc2FnZV90aHJlYWRfaWQsIFwiZWRpdEZvcnVtVG9waWNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5lZGl0Rm9ydW1Ub3BpYyhtZXNzYWdlLmNoYXQuaWQsIHRocmVhZCwgb3RoZXIsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jbG9zZUZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gY2xvc2UgYW4gb3BlbiB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cywgdW5sZXNzIGl0IGlzIHRoZSBjcmVhdG9yIG9mIHRoZSB0b3BpYy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Nsb3NlZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGNsb3NlRm9ydW1Ub3BpYyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gb3JUaHJvdyh0aGlzLm1zZywgXCJjbG9zZUZvcnVtVG9waWNcIik7XG4gICAgICAgIGNvbnN0IHRocmVhZCA9IG9yVGhyb3cobWVzc2FnZS5tZXNzYWdlX3RocmVhZF9pZCwgXCJjbG9zZUZvcnVtVG9waWNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jbG9zZUZvcnVtVG9waWMobWVzc2FnZS5jaGF0LmlkLCB0aHJlYWQsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5yZW9wZW5Gb3J1bVRvcGljYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHJlb3BlbiBhIGNsb3NlZCB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cywgdW5sZXNzIGl0IGlzIHRoZSBjcmVhdG9yIG9mIHRoZSB0b3BpYy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Jlb3BlbmZvcnVtdG9waWNcbiAgICAgKi9cbiAgICByZW9wZW5Gb3J1bVRvcGljKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvclRocm93KHRoaXMubXNnLCBcInJlb3BlbkZvcnVtVG9waWNcIik7XG4gICAgICAgIGNvbnN0IHRocmVhZCA9IG9yVGhyb3cobWVzc2FnZS5tZXNzYWdlX3RocmVhZF9pZCwgXCJyZW9wZW5Gb3J1bVRvcGljXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucmVvcGVuRm9ydW1Ub3BpYyhtZXNzYWdlLmNoYXQuaWQsIHRocmVhZCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmRlbGV0ZUZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIGEgZm9ydW0gdG9waWMgYWxvbmcgd2l0aCBhbGwgaXRzIG1lc3NhZ2VzIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9kZWxldGVfbWVzc2FnZXMgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVmb3J1bXRvcGljXG4gICAgICovXG4gICAgZGVsZXRlRm9ydW1Ub3BpYyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gb3JUaHJvdyh0aGlzLm1zZywgXCJkZWxldGVGb3J1bVRvcGljXCIpO1xuICAgICAgICBjb25zdCB0aHJlYWQgPSBvclRocm93KG1lc3NhZ2UubWVzc2FnZV90aHJlYWRfaWQsIFwiZGVsZXRlRm9ydW1Ub3BpY1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmRlbGV0ZUZvcnVtVG9waWMobWVzc2FnZS5jaGF0LmlkLCB0aHJlYWQsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS51bnBpbkFsbEZvcnVtVG9waWNNZXNzYWdlc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBmb3J1bSB0b3BpYy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fcGluX21lc3NhZ2VzIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gdGhlIHN1cGVyZ3JvdXAuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1bnBpbmFsbGZvcnVtdG9waWNtZXNzYWdlc1xuICAgICAqL1xuICAgIHVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvclRocm93KHRoaXMubXNnLCBcInVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzXCIpO1xuICAgICAgICBjb25zdCB0aHJlYWQgPSBvclRocm93KFxuICAgICAgICAgICAgbWVzc2FnZS5tZXNzYWdlX3RocmVhZF9pZCxcbiAgICAgICAgICAgIFwidW5waW5BbGxGb3J1bVRvcGljTWVzc2FnZXNcIixcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzKFxuICAgICAgICAgICAgbWVzc2FnZS5jaGF0LmlkLFxuICAgICAgICAgICAgdGhyZWFkLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdEdlbmVyYWxGb3J1bVRvcGljYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgdGhlIG5hbWUgb2YgdGhlICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBOZXcgdG9waWMgbmFtZSwgMS0xMjggY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgZWRpdEdlbmVyYWxGb3J1bVRvcGljKG5hbWU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmVkaXRHZW5lcmFsRm9ydW1Ub3BpYyhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdEdlbmVyYWxGb3J1bVRvcGljXCIpLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNsb3NlR2VuZXJhbEZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gY2xvc2UgYW4gb3BlbiAnR2VuZXJhbCcgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjbG9zZWdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgY2xvc2VHZW5lcmFsRm9ydW1Ub3BpYyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuY2xvc2VHZW5lcmFsRm9ydW1Ub3BpYyhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiY2xvc2VHZW5lcmFsRm9ydW1Ub3BpY1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnJlb3BlbkdlbmVyYWxGb3J1bVRvcGljYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHJlb3BlbiBhIGNsb3NlZCAnR2VuZXJhbCcgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFRoZSB0b3BpYyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgdW5oaWRkZW4gaWYgaXQgd2FzIGhpZGRlbi4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuICAgICAqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Jlb3BlbmdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgcmVvcGVuR2VuZXJhbEZvcnVtVG9waWMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnJlb3BlbkdlbmVyYWxGb3J1bVRvcGljKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJyZW9wZW5HZW5lcmFsRm9ydW1Ub3BpY1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmhpZGVHZW5lcmFsRm9ydW1Ub3BpY2AuIFVzZSB0aGlzIG1ldGhvZCB0byBoaWRlIHRoZSAnR2VuZXJhbCcgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFRoZSB0b3BpYyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgY2xvc2VkIGlmIGl0IHdhcyBvcGVuLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaGlkZWdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgaGlkZUdlbmVyYWxGb3J1bVRvcGljKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5oaWRlR2VuZXJhbEZvcnVtVG9waWMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImhpZGVHZW5lcmFsRm9ydW1Ub3BpY1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVuaGlkZUdlbmVyYWxGb3J1bVRvcGljYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHVuaGlkZSB0aGUgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5oaWRlZ2VuZXJhbGZvcnVtdG9waWNcbiAgICAgKi9cbiAgICB1bmhpZGVHZW5lcmFsRm9ydW1Ub3BpYyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkudW5oaWRlR2VuZXJhbEZvcnVtVG9waWMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInVuaGlkZUdlbmVyYWxGb3J1bVRvcGljXCIpLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkudW5waW5BbGxHZW5lcmFsRm9ydW1Ub3BpY01lc3NhZ2VzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNsZWFyIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIEdlbmVyYWwgZm9ydW0gdG9waWMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX3Bpbl9tZXNzYWdlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIHRoZSBzdXBlcmdyb3VwLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5waW5hbGxnZW5lcmFsZm9ydW10b3BpY21lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxHZW5lcmFsRm9ydW1Ub3BpY01lc3NhZ2VzKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS51bnBpbkFsbEdlbmVyYWxGb3J1bVRvcGljTWVzc2FnZXMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInVucGluQWxsR2VuZXJhbEZvcnVtVG9waWNNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmFuc3dlckNhbGxiYWNrUXVlcnlgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbnN3ZXJzIHRvIGNhbGxiYWNrIHF1ZXJpZXMgc2VudCBmcm9tIGlubGluZSBrZXlib2FyZHMuIFRoZSBhbnN3ZXIgd2lsbCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIgYXMgYSBub3RpZmljYXRpb24gYXQgdGhlIHRvcCBvZiB0aGUgY2hhdCBzY3JlZW4gb3IgYXMgYW4gYWxlcnQuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBBbHRlcm5hdGl2ZWx5LCB0aGUgdXNlciBjYW4gYmUgcmVkaXJlY3RlZCB0byB0aGUgc3BlY2lmaWVkIEdhbWUgVVJMLiBGb3IgdGhpcyBvcHRpb24gdG8gd29yaywgeW91IG11c3QgZmlyc3QgY3JlYXRlIGEgZ2FtZSBmb3IgeW91ciBib3QgdmlhIEBCb3RGYXRoZXIgYW5kIGFjY2VwdCB0aGUgdGVybXMuIE90aGVyd2lzZSwgeW91IG1heSB1c2UgbGlua3MgbGlrZSB0Lm1lL3lvdXJfYm90P3N0YXJ0PVhYWFggdGhhdCBvcGVuIHlvdXIgYm90IHdpdGggYSBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJjYWxsYmFja3F1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VyQ2FsbGJhY2tRdWVyeShcbiAgICAgICAgb3RoZXI/OiBzdHJpbmcgfCBPdGhlcjxcImFuc3dlckNhbGxiYWNrUXVlcnlcIiwgXCJjYWxsYmFja19xdWVyeV9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5hbnN3ZXJDYWxsYmFja1F1ZXJ5KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNhbGxiYWNrUXVlcnksIFwiYW5zd2VyQ2FsbGJhY2tRdWVyeVwiKS5pZCxcbiAgICAgICAgICAgIHR5cGVvZiBvdGhlciA9PT0gXCJzdHJpbmdcIiA/IHsgdGV4dDogb3RoZXIgfSA6IG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2V0Q2hhdE1lbnVCdXR0b25gLiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBib3QncyBtZW51IGJ1dHRvbiBpbiBhIHByaXZhdGUgY2hhdCwgb3IgdGhlIGRlZmF1bHQgbWVudSBidXR0b24uIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdG1lbnVidXR0b25cbiAgICAgKi9cbiAgICBzZXRDaGF0TWVudUJ1dHRvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNldENoYXRNZW51QnV0dG9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNldENoYXRNZW51QnV0dG9uKG90aGVyLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdE1lbnVCdXR0b25gLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBib3QncyBtZW51IGJ1dHRvbiBpbiBhIHByaXZhdGUgY2hhdCwgb3IgdGhlIGRlZmF1bHQgbWVudSBidXR0b24uIFJldHVybnMgTWVudUJ1dHRvbiBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdG1lbnVidXR0b25cbiAgICAgKi9cbiAgICBnZXRDaGF0TWVudUJ1dHRvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImdldENoYXRNZW51QnV0dG9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXRNZW51QnV0dG9uKG90aGVyLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0c2AuIFVzZSB0aGlzIG1ldGhvZCB0byB0aGUgY2hhbmdlIHRoZSBkZWZhdWx0IGFkbWluaXN0cmF0b3IgcmlnaHRzIHJlcXVlc3RlZCBieSB0aGUgYm90IHdoZW4gaXQncyBhZGRlZCBhcyBhbiBhZG1pbmlzdHJhdG9yIHRvIGdyb3VwcyBvciBjaGFubmVscy4gVGhlc2UgcmlnaHRzIHdpbGwgYmUgc3VnZ2VzdGVkIHRvIHVzZXJzLCBidXQgdGhleSBhcmUgYXJlIGZyZWUgdG8gbW9kaWZ5IHRoZSBsaXN0IGJlZm9yZSBhZGRpbmcgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRteWRlZmF1bHRhZG1pbmlzdHJhdG9ycmlnaHRzXG4gICAgICovXG4gICAgc2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhvdGhlciwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmdldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IGRlZmF1bHQgYWRtaW5pc3RyYXRvciByaWdodHMgb2YgdGhlIGJvdC4gUmV0dXJucyBDaGF0QWRtaW5pc3RyYXRvclJpZ2h0cyBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKi9cbiAgICBnZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzKFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0c1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzKG90aGVyLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdE1lc3NhZ2VUZXh0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgdGV4dCBhbmQgZ2FtZSBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgTmV3IHRleHQgb2YgdGhlIG1lc3NhZ2UsIDEtNDA5NiBjaGFyYWN0ZXJzIGFmdGVyIGVudGl0aWVzIHBhcnNpbmdcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZXRleHRcbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZVRleHQoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VUZXh0XCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJ0ZXh0XCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGlubGluZUlkID0gdGhpcy5pbmxpbmVNZXNzYWdlSWQ7XG4gICAgICAgIHJldHVybiBpbmxpbmVJZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IHRoaXMuYXBpLmVkaXRNZXNzYWdlVGV4dElubGluZShpbmxpbmVJZCwgdGV4dCwgb3RoZXIpXG4gICAgICAgICAgICA6IHRoaXMuYXBpLmVkaXRNZXNzYWdlVGV4dChcbiAgICAgICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImVkaXRNZXNzYWdlVGV4dFwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJlZGl0TWVzc2FnZVRleHRcIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmVkaXRNZXNzYWdlQ2FwdGlvbmAuIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGNhcHRpb25zIG9mIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZWNhcHRpb25cbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZUNhcHRpb24oXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlQ2FwdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgaW5saW5lSWQgPSB0aGlzLmlubGluZU1lc3NhZ2VJZDtcbiAgICAgICAgcmV0dXJuIGlubGluZUlkICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gdGhpcy5hcGkuZWRpdE1lc3NhZ2VDYXB0aW9uSW5saW5lKGlubGluZUlkLCBvdGhlcilcbiAgICAgICAgICAgIDogdGhpcy5hcGkuZWRpdE1lc3NhZ2VDYXB0aW9uKFxuICAgICAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdE1lc3NhZ2VDYXB0aW9uXCIpLFxuICAgICAgICAgICAgICAgIG9yVGhyb3coXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubXNnPy5tZXNzYWdlX2lkID8/IHRoaXMubWVzc2FnZVJlYWN0aW9uPy5tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkLFxuICAgICAgICAgICAgICAgICAgICBcImVkaXRNZXNzYWdlQ2FwdGlvblwiLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmVkaXRNZXNzYWdlTWVkaWFgLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBhbmltYXRpb24sIGF1ZGlvLCBkb2N1bWVudCwgcGhvdG8sIG9yIHZpZGVvIG1lc3NhZ2VzLiBJZiBhIG1lc3NhZ2UgaXMgcGFydCBvZiBhIG1lc3NhZ2UgYWxidW0sIHRoZW4gaXQgY2FuIGJlIGVkaXRlZCBvbmx5IHRvIGFuIGF1ZGlvIGZvciBhdWRpbyBhbGJ1bXMsIG9ubHkgdG8gYSBkb2N1bWVudCBmb3IgZG9jdW1lbnQgYWxidW1zIGFuZCB0byBhIHBob3RvIG9yIGEgdmlkZW8gb3RoZXJ3aXNlLiBXaGVuIGFuIGlubGluZSBtZXNzYWdlIGlzIGVkaXRlZCwgYSBuZXcgZmlsZSBjYW4ndCBiZSB1cGxvYWRlZDsgdXNlIGEgcHJldmlvdXNseSB1cGxvYWRlZCBmaWxlIHZpYSBpdHMgZmlsZV9pZCBvciBzcGVjaWZ5IGEgVVJMLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gb2JqZWN0IGZvciBhIG5ldyBtZWRpYSBjb250ZW50IG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VtZWRpYVxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlTWVkaWEoXG4gICAgICAgIG1lZGlhOiBJbnB1dE1lZGlhLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZU1lZGlhXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJtZWRpYVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICBjb25zdCBpbmxpbmVJZCA9IHRoaXMuaW5saW5lTWVzc2FnZUlkO1xuICAgICAgICByZXR1cm4gaW5saW5lSWQgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyB0aGlzLmFwaS5lZGl0TWVzc2FnZU1lZGlhSW5saW5lKGlubGluZUlkLCBtZWRpYSwgb3RoZXIpXG4gICAgICAgICAgICA6IHRoaXMuYXBpLmVkaXRNZXNzYWdlTWVkaWEoXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJlZGl0TWVzc2FnZU1lZGlhXCIpLFxuICAgICAgICAgICAgICAgIG9yVGhyb3coXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubXNnPy5tZXNzYWdlX2lkID8/IHRoaXMubWVzc2FnZVJlYWN0aW9uPy5tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkLFxuICAgICAgICAgICAgICAgICAgICBcImVkaXRNZXNzYWdlTWVkaWFcIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIG1lZGlhLFxuICAgICAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0TWVzc2FnZVJlcGx5TWFya3VwYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgb25seSB0aGUgcmVwbHkgbWFya3VwIG9mIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZXJlcGx5bWFya3VwXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VSZXBseU1hcmt1cChcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VSZXBseU1hcmt1cFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgaW5saW5lSWQgPSB0aGlzLmlubGluZU1lc3NhZ2VJZDtcbiAgICAgICAgcmV0dXJuIGlubGluZUlkICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gdGhpcy5hcGkuZWRpdE1lc3NhZ2VSZXBseU1hcmt1cElubGluZShpbmxpbmVJZCwgb3RoZXIpXG4gICAgICAgICAgICA6IHRoaXMuYXBpLmVkaXRNZXNzYWdlUmVwbHlNYXJrdXAoXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJlZGl0TWVzc2FnZVJlcGx5TWFya3VwXCIpLFxuICAgICAgICAgICAgICAgIG9yVGhyb3coXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubXNnPy5tZXNzYWdlX2lkID8/IHRoaXMubWVzc2FnZVJlYWN0aW9uPy5tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkLFxuICAgICAgICAgICAgICAgICAgICBcImVkaXRNZXNzYWdlUmVwbHlNYXJrdXBcIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zdG9wUG9sbGAuIFVzZSB0aGlzIG1ldGhvZCB0byBzdG9wIGEgcG9sbCB3aGljaCB3YXMgc2VudCBieSB0aGUgYm90LiBPbiBzdWNjZXNzLCB0aGUgc3RvcHBlZCBQb2xsIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc3RvcHBvbGxcbiAgICAgKi9cbiAgICBzdG9wUG9sbChcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInN0b3BQb2xsXCIsIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnN0b3BQb2xsKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzdG9wUG9sbFwiKSxcbiAgICAgICAgICAgIG9yVGhyb3coXG4gICAgICAgICAgICAgICAgdGhpcy5tc2c/Lm1lc3NhZ2VfaWQgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24/Lm1lc3NhZ2VfaWQgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICBcInN0b3BQb2xsXCIsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5kZWxldGVNZXNzYWdlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIG1lc3NhZ2UsIGluY2x1ZGluZyBzZXJ2aWNlIG1lc3NhZ2VzLCB3aXRoIHRoZSBmb2xsb3dpbmcgbGltaXRhdGlvbnM6XG4gICAgICogLSBBIG1lc3NhZ2UgY2FuIG9ubHkgYmUgZGVsZXRlZCBpZiBpdCB3YXMgc2VudCBsZXNzIHRoYW4gNDggaG91cnMgYWdvLlxuICAgICAqIC0gQSBkaWNlIG1lc3NhZ2UgaW4gYSBwcml2YXRlIGNoYXQgY2FuIG9ubHkgYmUgZGVsZXRlZCBpZiBpdCB3YXMgc2VudCBtb3JlIHRoYW4gMjQgaG91cnMgYWdvLlxuICAgICAqIC0gQm90cyBjYW4gZGVsZXRlIG91dGdvaW5nIG1lc3NhZ2VzIGluIHByaXZhdGUgY2hhdHMsIGdyb3VwcywgYW5kIHN1cGVyZ3JvdXBzLlxuICAgICAqIC0gQm90cyBjYW4gZGVsZXRlIGluY29taW5nIG1lc3NhZ2VzIGluIHByaXZhdGUgY2hhdHMuXG4gICAgICogLSBCb3RzIGdyYW50ZWQgY2FuX3Bvc3RfbWVzc2FnZXMgcGVybWlzc2lvbnMgY2FuIGRlbGV0ZSBvdXRnb2luZyBtZXNzYWdlcyBpbiBjaGFubmVscy5cbiAgICAgKiAtIElmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBvZiBhIGdyb3VwLCBpdCBjYW4gZGVsZXRlIGFueSBtZXNzYWdlIHRoZXJlLlxuICAgICAqIC0gSWYgdGhlIGJvdCBoYXMgY2FuX2RlbGV0ZV9tZXNzYWdlcyBwZXJtaXNzaW9uIGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwsIGl0IGNhbiBkZWxldGUgYW55IG1lc3NhZ2UgdGhlcmUuXG4gICAgICogUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZW1lc3NhZ2VcbiAgICAgKi9cbiAgICBkZWxldGVNZXNzYWdlKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5kZWxldGVNZXNzYWdlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWxldGVNZXNzYWdlXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyhcbiAgICAgICAgICAgICAgICB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkLFxuICAgICAgICAgICAgICAgIFwiZGVsZXRlTWVzc2FnZVwiLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmRlbGV0ZU1lc3NhZ2VzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBtdWx0aXBsZSBtZXNzYWdlcyBzaW11bHRhbmVvdXNseS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkcyBBIGxpc3Qgb2YgMS0xMDAgaWRlbnRpZmllcnMgb2YgbWVzc2FnZXMgdG8gZGVsZXRlLiBTZWUgZGVsZXRlTWVzc2FnZSBmb3IgbGltaXRhdGlvbnMgb24gd2hpY2ggbWVzc2FnZXMgY2FuIGJlIGRlbGV0ZWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZW1lc3NhZ2VzXG4gICAgICovXG4gICAgZGVsZXRlTWVzc2FnZXMobWVzc2FnZV9pZHM6IG51bWJlcltdLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZGVsZXRlTWVzc2FnZXMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImRlbGV0ZU1lc3NhZ2VzXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kU3RpY2tlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHN0YXRpYyAuV0VCUCwgYW5pbWF0ZWQgLlRHUywgb3IgdmlkZW8gLldFQk0gc3RpY2tlcnMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBTdGlja2VyIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSAuV0VCUCBzdGlja2VyIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgLldFQlAsIC5UR1MsIG9yIC5XRUJNIHN0aWNrZXIgdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gVmlkZW8gYW5kIGFuaW1hdGVkIHN0aWNrZXJzIGNhbid0IGJlIHNlbnQgdmlhIGFuIEhUVFAgVVJMLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRzdGlja2VyXG4gICAgICovXG4gICAgcmVwbHlXaXRoU3RpY2tlcihcbiAgICAgICAgc3RpY2tlcjogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFN0aWNrZXJcIiwgXCJjaGF0X2lkXCIgfCBcInN0aWNrZXJcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZFN0aWNrZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRTdGlja2VyXCIpLFxuICAgICAgICAgICAgc3RpY2tlcixcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IGN1c3RvbSBlbW9qaSBzdGlja2VycyBieSB0aGVpciBpZGVudGlmaWVycy4gUmV0dXJucyBhbiBBcnJheSBvZiBTdGlja2VyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY3VzdG9tX2Vtb2ppX2lkcyBBIGxpc3Qgb2YgY3VzdG9tIGVtb2ppIGlkZW50aWZpZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjdXN0b21lbW9qaXN0aWNrZXJzXG4gICAgICovXG4gICAgZ2V0Q3VzdG9tRW1vamlTdGlja2VycyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICB0eXBlIEVtb2ppID0gTWVzc2FnZUVudGl0eS5DdXN0b21FbW9qaU1lc3NhZ2VFbnRpdHk7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRDdXN0b21FbW9qaVN0aWNrZXJzKFxuICAgICAgICAgICAgKHRoaXMubXNnPy5lbnRpdGllcyA/PyBbXSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChlKTogZSBpcyBFbW9qaSA9PiBlLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpXG4gICAgICAgICAgICAgICAgLm1hcCgoZSkgPT4gZS5jdXN0b21fZW1vamlfaWQpLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuYW5zd2VySW5saW5lUXVlcnlgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbnN3ZXJzIHRvIGFuIGlubGluZSBxdWVyeS4gT24gc3VjY2VzcywgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKiBObyBtb3JlIHRoYW4gNTAgcmVzdWx0cyBwZXIgcXVlcnkgYXJlIGFsbG93ZWQuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlOiBBbiBpbmxpbmUgYm90IHRoYXQgc2VuZHMgWW91VHViZSB2aWRlb3MgY2FuIGFzayB0aGUgdXNlciB0byBjb25uZWN0IHRoZSBib3QgdG8gdGhlaXIgWW91VHViZSBhY2NvdW50IHRvIGFkYXB0IHNlYXJjaCByZXN1bHRzIGFjY29yZGluZ2x5LiBUbyBkbyB0aGlzLCBpdCBkaXNwbGF5cyBhICdDb25uZWN0IHlvdXIgWW91VHViZSBhY2NvdW50JyBidXR0b24gYWJvdmUgdGhlIHJlc3VsdHMsIG9yIGV2ZW4gYmVmb3JlIHNob3dpbmcgYW55LiBUaGUgdXNlciBwcmVzc2VzIHRoZSBidXR0b24sIHN3aXRjaGVzIHRvIGEgcHJpdmF0ZSBjaGF0IHdpdGggdGhlIGJvdCBhbmQsIGluIGRvaW5nIHNvLCBwYXNzZXMgYSBzdGFydCBwYXJhbWV0ZXIgdGhhdCBpbnN0cnVjdHMgdGhlIGJvdCB0byByZXR1cm4gYW4gT0F1dGggbGluay4gT25jZSBkb25lLCB0aGUgYm90IGNhbiBvZmZlciBhIHN3aXRjaF9pbmxpbmUgYnV0dG9uIHNvIHRoYXQgdGhlIHVzZXIgY2FuIGVhc2lseSByZXR1cm4gdG8gdGhlIGNoYXQgd2hlcmUgdGhleSB3YW50ZWQgdG8gdXNlIHRoZSBib3QncyBpbmxpbmUgY2FwYWJpbGl0aWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJlc3VsdHMgQW4gYXJyYXkgb2YgcmVzdWx0cyBmb3IgdGhlIGlubGluZSBxdWVyeVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcmlubGluZXF1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VySW5saW5lUXVlcnkoXG4gICAgICAgIHJlc3VsdHM6IHJlYWRvbmx5IElubGluZVF1ZXJ5UmVzdWx0W10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJhbnN3ZXJJbmxpbmVRdWVyeVwiLCBcImlubGluZV9xdWVyeV9pZFwiIHwgXCJyZXN1bHRzXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmFuc3dlcklubGluZVF1ZXJ5KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmlubGluZVF1ZXJ5LCBcImFuc3dlcklubGluZVF1ZXJ5XCIpLmlkLFxuICAgICAgICAgICAgcmVzdWx0cyxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZEludm9pY2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBpbnZvaWNlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0aXRsZSBQcm9kdWN0IG5hbWUsIDEtMzIgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBQcm9kdWN0IGRlc2NyaXB0aW9uLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHBheWxvYWQgQm90LWRlZmluZWQgaW52b2ljZSBwYXlsb2FkLCAxLTEyOCBieXRlcy4gVGhpcyB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIsIHVzZSBmb3IgeW91ciBpbnRlcm5hbCBwcm9jZXNzZXMuXG4gICAgICogQHBhcmFtIGN1cnJlbmN5IFRocmVlLWxldHRlciBJU08gNDIxNyBjdXJyZW5jeSBjb2RlLCBzZWUgbW9yZSBvbiBjdXJyZW5jaWVzXG4gICAgICogQHBhcmFtIHByaWNlcyBQcmljZSBicmVha2Rvd24sIGEgbGlzdCBvZiBjb21wb25lbnRzIChlLmcuIHByb2R1Y3QgcHJpY2UsIHRheCwgZGlzY291bnQsIGRlbGl2ZXJ5IGNvc3QsIGRlbGl2ZXJ5IHRheCwgYm9udXMsIGV0Yy4pXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGludm9pY2VcbiAgICAgKi9cbiAgICByZXBseVdpdGhJbnZvaWNlKFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgICAgICBwYXlsb2FkOiBzdHJpbmcsXG4gICAgICAgIGN1cnJlbmN5OiBzdHJpbmcsXG4gICAgICAgIHByaWNlczogcmVhZG9ubHkgTGFiZWxlZFByaWNlW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcInNlbmRJbnZvaWNlXCIsXG4gICAgICAgICAgICB8IFwiY2hhdF9pZFwiXG4gICAgICAgICAgICB8IFwidGl0bGVcIlxuICAgICAgICAgICAgfCBcImRlc2NyaXB0aW9uXCJcbiAgICAgICAgICAgIHwgXCJwYXlsb2FkXCJcbiAgICAgICAgICAgIHwgXCJjdXJyZW5jeVwiXG4gICAgICAgICAgICB8IFwicHJpY2VzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kSW52b2ljZShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZEludm9pY2VcIiksXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgICAgIGN1cnJlbmN5LFxuICAgICAgICAgICAgcHJpY2VzLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5hbnN3ZXJTaGlwcGluZ1F1ZXJ5YC4gSWYgeW91IHNlbnQgYW4gaW52b2ljZSByZXF1ZXN0aW5nIGEgc2hpcHBpbmcgYWRkcmVzcyBhbmQgdGhlIHBhcmFtZXRlciBpc19mbGV4aWJsZSB3YXMgc3BlY2lmaWVkLCB0aGUgQm90IEFQSSB3aWxsIHNlbmQgYW4gVXBkYXRlIHdpdGggYSBzaGlwcGluZ19xdWVyeSBmaWVsZCB0byB0aGUgYm90LiBVc2UgdGhpcyBtZXRob2QgdG8gcmVwbHkgdG8gc2hpcHBpbmcgcXVlcmllcy4gT24gc3VjY2VzcywgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaGlwcGluZ19xdWVyeV9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHF1ZXJ5IHRvIGJlIGFuc3dlcmVkXG4gICAgICogQHBhcmFtIG9rIFBhc3MgVHJ1ZSBpZiBkZWxpdmVyeSB0byB0aGUgc3BlY2lmaWVkIGFkZHJlc3MgaXMgcG9zc2libGUgYW5kIEZhbHNlIGlmIHRoZXJlIGFyZSBhbnkgcHJvYmxlbXMgKGZvciBleGFtcGxlLCBpZiBkZWxpdmVyeSB0byB0aGUgc3BlY2lmaWVkIGFkZHJlc3MgaXMgbm90IHBvc3NpYmxlKVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcnNoaXBwaW5ncXVlcnlcbiAgICAgKi9cbiAgICBhbnN3ZXJTaGlwcGluZ1F1ZXJ5KFxuICAgICAgICBvazogYm9vbGVhbixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImFuc3dlclNoaXBwaW5nUXVlcnlcIiwgXCJzaGlwcGluZ19xdWVyeV9pZFwiIHwgXCJva1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5hbnN3ZXJTaGlwcGluZ1F1ZXJ5KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLnNoaXBwaW5nUXVlcnksIFwiYW5zd2VyU2hpcHBpbmdRdWVyeVwiKS5pZCxcbiAgICAgICAgICAgIG9rLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5hbnN3ZXJQcmVDaGVja291dFF1ZXJ5YC4gT25jZSB0aGUgdXNlciBoYXMgY29uZmlybWVkIHRoZWlyIHBheW1lbnQgYW5kIHNoaXBwaW5nIGRldGFpbHMsIHRoZSBCb3QgQVBJIHNlbmRzIHRoZSBmaW5hbCBjb25maXJtYXRpb24gaW4gdGhlIGZvcm0gb2YgYW4gVXBkYXRlIHdpdGggdGhlIGZpZWxkIHByZV9jaGVja291dF9xdWVyeS4gVXNlIHRoaXMgbWV0aG9kIHRvIHJlc3BvbmQgdG8gc3VjaCBwcmUtY2hlY2tvdXQgcXVlcmllcy4gT24gc3VjY2VzcywgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZTogVGhlIEJvdCBBUEkgbXVzdCByZWNlaXZlIGFuIGFuc3dlciB3aXRoaW4gMTAgc2Vjb25kcyBhZnRlciB0aGUgcHJlLWNoZWNrb3V0IHF1ZXJ5IHdhcyBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG9rIFNwZWNpZnkgVHJ1ZSBpZiBldmVyeXRoaW5nIGlzIGFscmlnaHQgKGdvb2RzIGFyZSBhdmFpbGFibGUsIGV0Yy4pIGFuZCB0aGUgYm90IGlzIHJlYWR5IHRvIHByb2NlZWQgd2l0aCB0aGUgb3JkZXIuIFVzZSBGYWxzZSBpZiB0aGVyZSBhcmUgYW55IHByb2JsZW1zLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcnByZWNoZWNrb3V0cXVlcnlcbiAgICAgKi9cbiAgICBhbnN3ZXJQcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICBvazogYm9vbGVhbixcbiAgICAgICAgb3RoZXI/OlxuICAgICAgICAgICAgfCBzdHJpbmdcbiAgICAgICAgICAgIHwgT3RoZXI8XCJhbnN3ZXJQcmVDaGVja291dFF1ZXJ5XCIsIFwicHJlX2NoZWNrb3V0X3F1ZXJ5X2lkXCIgfCBcIm9rXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmFuc3dlclByZUNoZWNrb3V0UXVlcnkoXG4gICAgICAgICAgICBvclRocm93KHRoaXMucHJlQ2hlY2tvdXRRdWVyeSwgXCJhbnN3ZXJQcmVDaGVja291dFF1ZXJ5XCIpLmlkLFxuICAgICAgICAgICAgb2ssXG4gICAgICAgICAgICB0eXBlb2Ygb3RoZXIgPT09IFwic3RyaW5nXCIgPyB7IGVycm9yX21lc3NhZ2U6IG90aGVyIH0gOiBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnJlZnVuZFN0YXJQYXltZW50YC4gUmVmdW5kcyBhIHN1Y2Nlc3NmdWwgcGF5bWVudCBpbiBUZWxlZ3JhbSBTdGFycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmVmdW5kc3RhcnBheW1lbnRcbiAgICAgKi9cbiAgICByZWZ1bmRTdGFyUGF5bWVudChzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucmVmdW5kU3RhclBheW1lbnQoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuZnJvbSwgXCJyZWZ1bmRTdGFyUGF5bWVudFwiKS5pZCxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5tc2c/LnN1Y2Nlc3NmdWxfcGF5bWVudCwgXCJyZWZ1bmRTdGFyUGF5bWVudFwiKVxuICAgICAgICAgICAgICAgIC50ZWxlZ3JhbV9wYXltZW50X2NoYXJnZV9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldFBhc3Nwb3J0RGF0YUVycm9yc2AuIEluZm9ybXMgYSB1c2VyIHRoYXQgc29tZSBvZiB0aGUgVGVsZWdyYW0gUGFzc3BvcnQgZWxlbWVudHMgdGhleSBwcm92aWRlZCBjb250YWlucyBlcnJvcnMuIFRoZSB1c2VyIHdpbGwgbm90IGJlIGFibGUgdG8gcmUtc3VibWl0IHRoZWlyIFBhc3Nwb3J0IHRvIHlvdSB1bnRpbCB0aGUgZXJyb3JzIGFyZSBmaXhlZCAodGhlIGNvbnRlbnRzIG9mIHRoZSBmaWVsZCBmb3Igd2hpY2ggeW91IHJldHVybmVkIHRoZSBlcnJvciBtdXN0IGNoYW5nZSkuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogVXNlIHRoaXMgaWYgdGhlIGRhdGEgc3VibWl0dGVkIGJ5IHRoZSB1c2VyIGRvZXNuJ3Qgc2F0aXNmeSB0aGUgc3RhbmRhcmRzIHlvdXIgc2VydmljZSByZXF1aXJlcyBmb3IgYW55IHJlYXNvbi4gRm9yIGV4YW1wbGUsIGlmIGEgYmlydGhkYXkgZGF0ZSBzZWVtcyBpbnZhbGlkLCBhIHN1Ym1pdHRlZCBkb2N1bWVudCBpcyBibHVycnksIGEgc2NhbiBzaG93cyBldmlkZW5jZSBvZiB0YW1wZXJpbmcsIGV0Yy4gU3VwcGx5IHNvbWUgZGV0YWlscyBpbiB0aGUgZXJyb3IgbWVzc2FnZSB0byBtYWtlIHN1cmUgdGhlIHVzZXIga25vd3MgaG93IHRvIGNvcnJlY3QgdGhlIGlzc3Vlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlcnJvcnMgQW4gYXJyYXkgZGVzY3JpYmluZyB0aGUgZXJyb3JzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRwYXNzcG9ydGRhdGFlcnJvcnNcbiAgICAgKi9cbiAgICBzZXRQYXNzcG9ydERhdGFFcnJvcnMoXG4gICAgICAgIGVycm9yczogcmVhZG9ubHkgUGFzc3BvcnRFbGVtZW50RXJyb3JbXSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRQYXNzcG9ydERhdGFFcnJvcnMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuZnJvbSwgXCJzZXRQYXNzcG9ydERhdGFFcnJvcnNcIikuaWQsXG4gICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kR2FtZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGEgZ2FtZS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBnYW1lX3Nob3J0X25hbWUgU2hvcnQgbmFtZSBvZiB0aGUgZ2FtZSwgc2VydmVzIGFzIHRoZSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGdhbWUuIFNldCB1cCB5b3VyIGdhbWVzIHZpYSBCb3RGYXRoZXIuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGdhbWVcbiAgICAgKi9cbiAgICByZXBseVdpdGhHYW1lKFxuICAgICAgICBnYW1lX3Nob3J0X25hbWU6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRHYW1lXCIsIFwiY2hhdF9pZFwiIHwgXCJnYW1lX3Nob3J0X25hbWVcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZEdhbWUoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRHYW1lXCIpLFxuICAgICAgICAgICAgZ2FtZV9zaG9ydF9uYW1lLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cbn1cblxuLy8gPT09IEZpbHRlcmVkIGNvbnRleHQgdHlwZXNcbnR5cGUgSGVhcnNDb250ZXh0Q29yZSA9XG4gICAgJiBGaWx0ZXJDb3JlPFwiOnRleHRcIiB8IFwiOmNhcHRpb25cIj5cbiAgICAmIE5hcnJvd01hdGNoQ29yZTxzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5Pjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QuaGVhcnNgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGBib3QuaGVhcnNgIGRvZXMgaXQuIFRoaXMgYWxsb3dzIHlvdSB0byBhbm5vdGF0ZSBjb250ZXh0IG9iamVjdHMgaW5cbiAqIG1pZGRsZXdhcmUgdGhhdCBpcyBub3QgZGlyZWN0bHkgcGFzc2VkIHRvIGBib3QuaGVhcnNgLCBoZW5jZSBub3QgaW5mZXJyaW5nXG4gKiB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZCBpbiBzZXBhcmF0ZVxuICogZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIEhlYXJzQ29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8XG4gICAgTmFycm93TWF0Y2g8Qywgc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheT4sXG4gICAgXCI6dGV4dFwiIHwgXCI6Y2FwdGlvblwiXG4+O1xuXG50eXBlIENvbW1hbmRDb250ZXh0Q29yZSA9XG4gICAgJiBGaWx0ZXJDb3JlPFwiOmVudGl0aWVzOmJvdF9jb21tYW5kXCI+XG4gICAgJiBOYXJyb3dNYXRjaENvcmU8c3RyaW5nPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QuY29tbWFuZGAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYGJvdC5jb21tYW5kYCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gYW5ub3RhdGUgY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmNvbW1hbmRgLCBoZW5jZSBub3QgaW5mZXJyaW5nXG4gKiB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZCBpbiBzZXBhcmF0ZVxuICogZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIENvbW1hbmRDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmc+LFxuICAgIFwiOmVudGl0aWVzOmJvdF9jb21tYW5kXCJcbj47XG50eXBlIE5hcnJvd01hdGNoQ29yZTxUIGV4dGVuZHMgQ29udGV4dFtcIm1hdGNoXCJdPiA9IHsgbWF0Y2g6IFQgfTtcbnR5cGUgTmFycm93TWF0Y2g8QyBleHRlbmRzIENvbnRleHQsIFQgZXh0ZW5kcyBDW1wibWF0Y2hcIl0+ID0ge1xuICAgIFtLIGluIGtleW9mIENdOiBLIGV4dGVuZHMgXCJtYXRjaFwiID8gKFQgZXh0ZW5kcyBDW0tdID8gVCA6IG5ldmVyKSA6IENbS107XG59O1xuXG50eXBlIENhbGxiYWNrUXVlcnlDb250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJjYWxsYmFja19xdWVyeTpkYXRhXCI+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBjb250ZXh0IG9iamVjdCB0aGF0IGlzIGF2YWlsYWJsZSBpbnNpZGUgdGhlIGhhbmRsZXJzIGZvclxuICogYGJvdC5jYWxsYmFja1F1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG5hcnJvdyBkb3duIGNvbnRleHQgb2JqZWN0cyB0aGUgc2FtZVxuICogd2F5IGBib3QuY2FsbGJhY2tRdWVyeWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGhvdyBjb250ZXh0IG9iamVjdHMgaW5cbiAqIG1pZGRsZXdhcmUgdGhhdCBpcyBub3QgZGlyZWN0bHkgcGFzc2VkIHRvIGBib3QuY2FsbGJhY2tRdWVyeWAsIGhlbmNlIG5vdFxuICogaW5mZXJyaW5nIHRoZSBjb3JyZWN0IHR5cGUgYXV0b21hdGljYWxseS4gVGhhdCB3YXksIGhhbmRsZXJzIGNhbiBiZSBkZWZpbmVkXG4gKiBpbiBzZXBhcmF0ZSBmaWxlcyBhbmQgc3RpbGwgaGF2ZSB0aGUgY29ycmVjdCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2FsbGJhY2tRdWVyeUNvbnRleHQ8QyBleHRlbmRzIENvbnRleHQ+ID0gRmlsdGVyPFxuICAgIE5hcnJvd01hdGNoPEMsIHN0cmluZyB8IFJlZ0V4cE1hdGNoQXJyYXk+LFxuICAgIFwiY2FsbGJhY2tfcXVlcnk6ZGF0YVwiXG4+O1xuXG50eXBlIEdhbWVRdWVyeUNvbnRleHRDb3JlID0gRmlsdGVyQ29yZTxcImNhbGxiYWNrX3F1ZXJ5OmdhbWVfc2hvcnRfbmFtZVwiPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QuZ2FtZVF1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIG5hcnJvdyBkb3duIGNvbnRleHQgb2JqZWN0cyB0aGUgc2FtZSB3YXkgaG93XG4gKiBgYm90LmdhbWVRdWVyeWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGFubm90YXRlIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5nYW1lUXVlcnlgLCBoZW5jZSBub3RcbiAqIGluZmVycmluZyB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZFxuICogaW4gc2VwYXJhdGUgZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIEdhbWVRdWVyeUNvbnRleHQ8QyBleHRlbmRzIENvbnRleHQ+ID0gRmlsdGVyPFxuICAgIE5hcnJvd01hdGNoPEMsIHN0cmluZyB8IFJlZ0V4cE1hdGNoQXJyYXk+LFxuICAgIFwiY2FsbGJhY2tfcXVlcnk6Z2FtZV9zaG9ydF9uYW1lXCJcbj47XG5cbnR5cGUgSW5saW5lUXVlcnlDb250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJpbmxpbmVfcXVlcnlcIj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmlubGluZVF1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIG5hcnJvdyBkb3duIGNvbnRleHQgb2JqZWN0cyB0aGUgc2FtZSB3YXkgaG93XG4gKiBhbm5vdGF0ZSBgYm90LmlubGluZVF1ZXJ5YCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmlubGluZVF1ZXJ5YCwgaGVuY2Ugbm90XG4gKiBpbmZlcnJpbmcgdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWRcbiAqIGluIHNlcGFyYXRlIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBJbmxpbmVRdWVyeUNvbnRleHQ8QyBleHRlbmRzIENvbnRleHQ+ID0gRmlsdGVyPFxuICAgIE5hcnJvd01hdGNoPEMsIHN0cmluZyB8IFJlZ0V4cE1hdGNoQXJyYXk+LFxuICAgIFwiaW5saW5lX3F1ZXJ5XCJcbj47XG5cbnR5cGUgUmVhY3Rpb25Db250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJtZXNzYWdlX3JlYWN0aW9uXCI+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBjb250ZXh0IG9iamVjdCB0aGF0IGlzIGF2YWlsYWJsZSBpbnNpZGUgdGhlIGhhbmRsZXJzIGZvclxuICogYGJvdC5yZWFjdGlvbmAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYW5ub3RhdGUgYGJvdC5yZWFjdGlvbmAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5yZWFjdGlvbmAsIGhlbmNlIG5vdCBpbmZlcnJpbmdcbiAqIHRoZSBjb3JyZWN0IHR5cGUgYXV0b21hdGljYWxseS4gVGhhdCB3YXksIGhhbmRsZXJzIGNhbiBiZSBkZWZpbmVkIGluIHNlcGFyYXRlXG4gKiBmaWxlcyBhbmQgc3RpbGwgaGF2ZSB0aGUgY29ycmVjdCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgUmVhY3Rpb25Db250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxDLCBcIm1lc3NhZ2VfcmVhY3Rpb25cIj47XG5cbnR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dENvcmUgPSBGaWx0ZXJDb3JlPFwiY2hvc2VuX2lubGluZV9yZXN1bHRcIj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmNob3NlbklubGluZVJlc3VsdGAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYW5ub3RhdGUgYGJvdC5jaG9zZW5JbmxpbmVSZXN1bHRgIGRvZXMgaXQuIFRoaXMgYWxsb3dzIHlvdSB0byBjb250ZXh0IG9iamVjdHMgaW5cbiAqIG1pZGRsZXdhcmUgdGhhdCBpcyBub3QgZGlyZWN0bHkgcGFzc2VkIHRvIGBib3QuY2hvc2VuSW5saW5lUmVzdWx0YCwgaGVuY2Ugbm90XG4gKiBpbmZlcnJpbmcgdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWRcbiAqIGluIHNlcGFyYXRlIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBDaG9zZW5JbmxpbmVSZXN1bHRDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCJcbj47XG5cbnR5cGUgUHJlQ2hlY2tvdXRRdWVyeUNvbnRleHRDb3JlID0gRmlsdGVyQ29yZTxcInByZV9jaGVja291dF9xdWVyeVwiPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYW5ub3RhdGUgYGJvdC5wcmVDaGVja291dFF1ZXJ5YCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LnByZUNoZWNrb3V0UXVlcnlgLCBoZW5jZSBub3RcbiAqIGluZmVycmluZyB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZFxuICogaW4gc2VwYXJhdGUgZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFByZUNoZWNrb3V0UXVlcnlDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcInByZV9jaGVja291dF9xdWVyeVwiXG4+O1xuXG50eXBlIFNoaXBwaW5nUXVlcnlDb250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJzaGlwcGluZ19xdWVyeVwiPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3Quc2hpcHBpbmdRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYW5ub3RhdGUgYGJvdC5zaGlwcGluZ1F1ZXJ5YCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LnNoaXBwaW5nUXVlcnlgLCBoZW5jZSBub3RcbiAqIGluZmVycmluZyB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZFxuICogaW4gc2VwYXJhdGUgZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFNoaXBwaW5nUXVlcnlDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcInNoaXBwaW5nX3F1ZXJ5XCJcbj47XG5cbnR5cGUgQ2hhdFR5cGVDb250ZXh0Q29yZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+ID1cbiAgICAmIFJlY29yZDxcInVwZGF0ZVwiLCBDaGF0VHlwZVVwZGF0ZTxUPj4gLy8gY3R4LnVwZGF0ZVxuICAgICYgQ2hhdFR5cGU8VD4gLy8gY3R4LmNoYXRcbiAgICAmIFJlY29yZDxcImNoYXRJZFwiLCBudW1iZXI+IC8vIGN0eC5jaGF0SWRcbiAgICAmIENoYXRGcm9tPFQ+IC8vIGN0eC5mcm9tXG4gICAgJiBDaGF0VHlwZVJlY29yZDxcIm1zZ1wiLCBUPiAvLyBjdHgubXNnXG4gICAgJiBBbGlhc1Byb3BzPENoYXRUeXBlVXBkYXRlPFQ+PjsgLy8gY3R4Lm1lc3NhZ2UgZXRjXG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmNoYXRUeXBlYC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIG5hcnJvdyBkb3duIGNvbnRleHQgb2JqZWN0cyB0aGUgc2FtZSB3YXkgaG93XG4gKiBgYm90LmNoYXRUeXBlYCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gYW5ub3RhdGUgY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmNoYXRUeXBlYCwgaGVuY2Ugbm90IGluZmVycmluZ1xuICogdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWQgaW4gc2VwYXJhdGVcbiAqIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBDaGF0VHlwZUNvbnRleHQ8QyBleHRlbmRzIENvbnRleHQsIFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4gPVxuICAgIFQgZXh0ZW5kcyB1bmtub3duID8gQyAmIENoYXRUeXBlQ29udGV4dENvcmU8VD4gOiBuZXZlcjtcbnR5cGUgQ2hhdFR5cGVVcGRhdGU8VCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiA9XG4gICAgJiBDaGF0VHlwZVJlY29yZDxcbiAgICAgICAgfCBcIm1lc3NhZ2VcIlxuICAgICAgICB8IFwiZWRpdGVkX21lc3NhZ2VcIlxuICAgICAgICB8IFwiY2hhbm5lbF9wb3N0XCJcbiAgICAgICAgfCBcImVkaXRlZF9jaGFubmVsX3Bvc3RcIlxuICAgICAgICB8IFwibXlfY2hhdF9tZW1iZXJcIlxuICAgICAgICB8IFwiY2hhdF9tZW1iZXJcIlxuICAgICAgICB8IFwiY2hhdF9qb2luX3JlcXVlc3RcIixcbiAgICAgICAgVFxuICAgID5cbiAgICAmIFBhcnRpYWw8UmVjb3JkPFwiY2FsbGJhY2tfcXVlcnlcIiwgQ2hhdFR5cGVSZWNvcmQ8XCJtZXNzYWdlXCIsIFQ+Pj5cbiAgICAmIENvbnN0cmFpblVwZGF0ZXNCeUNoYXRUeXBlPFQ+O1xudHlwZSBDb25zdHJhaW5VcGRhdGVzQnlDaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+ID0gUmVjb3JkPFxuICAgIFtUXSBleHRlbmRzIFtcImNoYW5uZWxcIl0gPyBcIm1lc3NhZ2VcIiB8IFwiZWRpdGVkX21lc3NhZ2VcIlxuICAgICAgICA6IFwiY2hhbm5lbF9wb3N0XCIgfCBcImVkaXRlZF9jaGFubmVsX3Bvc3RcIixcbiAgICB1bmRlZmluZWRcbj47XG5cbnR5cGUgQ2hhdFR5cGVSZWNvcmQ8SyBleHRlbmRzIHN0cmluZywgVCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiA9IFBhcnRpYWw8XG4gICAgUmVjb3JkPEssIENoYXRUeXBlPFQ+PlxuPjtcbmludGVyZmFjZSBDaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+IHtcbiAgICBjaGF0OiB7IHR5cGU6IFQgfTtcbn1cbmludGVyZmFjZSBDaGF0RnJvbTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+IHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuICAgIGZyb206IFtUXSBleHRlbmRzIFtcInByaXZhdGVcIl0gPyB7fSA6IHVua25vd247XG59XG5cbi8vID09PSBVdGlsIGZ1bmN0aW9uc1xuZnVuY3Rpb24gb3JUaHJvdzxUPih2YWx1ZTogVCB8IHVuZGVmaW5lZCwgbWV0aG9kOiBzdHJpbmcpOiBUIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgaW5mb3JtYXRpb24gZm9yIEFQSSBjYWxsIHRvICR7bWV0aG9kfWApO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRyaWdnZXJGbih0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4pIHtcbiAgICByZXR1cm4gdG9BcnJheSh0cmlnZ2VyKS5tYXAoKHQpID0+XG4gICAgICAgIHR5cGVvZiB0ID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICA/ICh0eHQ6IHN0cmluZykgPT4gKHR4dCA9PT0gdCA/IHQgOiBudWxsKVxuICAgICAgICAgICAgOiAodHh0OiBzdHJpbmcpID0+IHR4dC5tYXRjaCh0KVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIG1hdGNoPEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBjdHg6IEMsXG4gICAgY29udGVudDogc3RyaW5nLFxuICAgIHRyaWdnZXJzOiBBcnJheTwoY29udGVudDogc3RyaW5nKSA9PiBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5IHwgbnVsbD4sXG4pOiBib29sZWFuIHtcbiAgICBmb3IgKGNvbnN0IHQgb2YgdHJpZ2dlcnMpIHtcbiAgICAgICAgY29uc3QgcmVzID0gdChjb250ZW50KTtcbiAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgY3R4Lm1hdGNoID0gcmVzO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gdG9BcnJheTxFPihlOiBNYXliZUFycmF5PEU+KTogRVtdIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShlKSA/IGUgOiBbZV07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBR2xDLFNBSUksV0FBVyxRQUNSLGNBQWM7QUFrS3JCLE1BQU0sVUFBcUI7RUFDdkIsYUFBbUMsTUFBZTtJQUM5QyxNQUFNLE9BQU8sWUFBWTtJQUN6QixPQUFPLENBQW9CLE1BQWdDLEtBQUs7RUFDcEU7RUFDQSxNQUFLLE9BQU87SUFDUixNQUFNLFVBQVUsUUFBUSxXQUFXLENBQUM7TUFBQztNQUFTO0tBQVc7SUFDekQsTUFBTSxNQUFNLFVBQVU7SUFDdEIsT0FBTyxDQUFvQjtNQUN2QixJQUFJLENBQUMsUUFBUSxNQUFNLE9BQU87TUFDMUIsTUFBTSxNQUFNLElBQUksT0FBTyxJQUFJLElBQUksV0FBVztNQUMxQyxNQUFNLE1BQU0sSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPO01BQ25DLE9BQU8sTUFBTSxLQUFLLEtBQUs7SUFDM0I7RUFDSjtFQUNBLFNBQVEsT0FBTztJQUNYLE1BQU0sY0FBYyxRQUFRLFdBQVcsQ0FBQztJQUN4QyxNQUFNLGFBQWEsSUFBSTtJQUN2QixNQUFNLGVBQWUsSUFBSTtJQUN6QixRQUFRLFNBQVMsT0FBTyxDQUFDLENBQUM7TUFDdEIsSUFBSSxJQUFJLFVBQVUsQ0FBQyxNQUFNO1FBQ3JCLE1BQU0sSUFBSSxNQUNOLENBQUMsMkRBQTJELEVBQ3hELElBQUksU0FBUyxDQUFDLEdBQ2pCLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztN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