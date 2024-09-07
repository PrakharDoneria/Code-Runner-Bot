/**
 * Use this class to simplify building a custom keyboard (something like this:
 * https://core.telegram.org/bots/features#keyboards).
 *
 * ```ts
 * // Build a custom keyboard:
 * const keyboard = new Keyboard()
 *   .text('A').text('B').row()
 *   .text('C').text('D')
 *
 * // Now you can send it like so:
 * await ctx.reply('Here is your custom keyboard!', {
 *   reply_markup: keyboard
 * })
 * ```
 *
 * If you already have some source data which you would like to turn into a
 * keyboard button object, you can use the static equivalents which every button
 * has. You can use them to create a two-dimensional keyboard button array. The
 * resulting array can be turned into a keyboard instance.
 *
 * ```ts
 * const button = Keyboard.text('push my buttons')
 * const array = [[button]]
 * const keyboard = Keyboard.from(array)
 * ```
 *
 * If you want to create text buttons only, you can directly use a
 * two-dimensional string array and turn it into a keyboard.
 *
 * ```ts
 * const data = [['A', 'B'], ['C', 'D']]
 * const keyboard = Keyboard.from(data)
 * ```
 *
 * Be sure to check out the
 * [documentation](https://grammy.dev/plugins/keyboard#custom-keyboards) on
 * custom keyboards in grammY.
 */ export class Keyboard {
  keyboard;
  /**
     * Requests clients to always show the keyboard when the regular keyboard is
     * hidden. Defaults to false, in which case the custom keyboard can be
     * hidden and opened with a keyboard icon.
     */ is_persistent;
  /**
     * Show the current keyboard only to those users that are mentioned in the
     * text of the message object.
     */ selective;
  /**
     * Hide the keyboard after a button is pressed.
     */ one_time_keyboard;
  /**
     * Resize the current keyboard according to its buttons. Usually, this will
     * make the keyboard smaller.
     */ resize_keyboard;
  /**
     * Placeholder to be shown in the input field when the keyboard is active.
     */ input_field_placeholder;
  /**
     * Initialize a new `Keyboard` with an optional two-dimensional array of
     * `KeyboardButton` objects. This is the nested array that holds the custom
     * keyboard. It will be extended every time you call one of the provided
     * methods.
     *
     * @param keyboard An optional initial two-dimensional button array
     */ constructor(keyboard = [
    []
  ]){
    this.keyboard = keyboard;
  }
  /**
     * Allows you to add your own `KeyboardButton` objects if you already have
     * them for some reason. You most likely want to call one of the other
     * methods.
     *
     * @param buttons The buttons to add
     */ add(...buttons) {
    this.keyboard[this.keyboard.length - 1]?.push(...buttons);
    return this;
  }
  /**
     * Adds a 'line break'. Call this method to make sure that the next added
     * buttons will be on a new row.
     *
     * You may pass a number of `KeyboardButton` objects if you already have the
     * instances for some reason. You most likely don't want to pass any
     * arguments to `row`.
     *
     * @param buttons A number of buttons to add to the next row
     */ row(...buttons) {
    this.keyboard.push(buttons);
    return this;
  }
  /**
     * Adds a new text button. This button will simply send the given text as a
     * text message back to your bot if a user clicks on it.
     *
     * @param text The text to display
     */ text(text) {
    return this.add(Keyboard.text(text));
  }
  /**
     * Creates a new text button. This button will simply send the given text as
     * a text message back to your bot if a user clicks on it.
     *
     * @param text The text to display
     */ static text(text) {
    return {
      text
    };
  }
  /**
     * Adds a new request users button. When the user presses the button, a list
     * of suitable users will be opened. Tapping on any number of users will
     * send their identifiers to the bot in a “users_shared” service message.
     * Available in private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ requestUsers(text, requestId, options = {}) {
    return this.add(Keyboard.requestUsers(text, requestId, options));
  }
  /**
     * Creates a new request users button. When the user presses the button, a
     * list of suitable users will be opened. Tapping on any number of users
     * will send their identifiers to the bot in a “users_shared” service
     * message. Available in private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ static requestUsers(text, requestId, options = {}) {
    return {
      text,
      request_users: {
        request_id: requestId,
        ...options
      }
    };
  }
  /**
     * Adds a new request chat button. When the user presses the button, a list
     * of suitable users will be opened. Tapping on a chat will send its
     * identifier to the bot in a “chat_shared” service message. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ requestChat(text, requestId, options = {
    chat_is_channel: false
  }) {
    return this.add(Keyboard.requestChat(text, requestId, options));
  }
  /**
     * Creates a new request chat button. When the user presses the button, a
     * list of suitable users will be opened. Tapping on a chat will send its
     * identifier to the bot in a “chat_shared” service message. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ static requestChat(text, requestId, options = {
    chat_is_channel: false
  }) {
    return {
      text,
      request_chat: {
        request_id: requestId,
        ...options
      }
    };
  }
  /**
     * Adds a new contact request button. The user's phone number will be sent
     * as a contact when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ requestContact(text) {
    return this.add(Keyboard.requestContact(text));
  }
  /**
     * Creates a new contact request button. The user's phone number will be
     * sent as a contact when the button is pressed. Available in private chats
     * only.
     *
     * @param text The text to display
     */ static requestContact(text) {
    return {
      text,
      request_contact: true
    };
  }
  /**
     * Adds a new location request button. The user's current location will be
     * sent when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ requestLocation(text) {
    return this.add(Keyboard.requestLocation(text));
  }
  /**
     * Creates a new location request button. The user's current location will
     * be sent when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ static requestLocation(text) {
    return {
      text,
      request_location: true
    };
  }
  /**
     * Adds a new poll request button. The user will be asked to create a poll
     * and send it to the bot when the button is pressed. Available in private
     * chats only.
     *
     * @param text The text to display
     * @param type The type of permitted polls to create, omit if the user may
     * send a poll of any type
     */ requestPoll(text, type) {
    return this.add(Keyboard.requestPoll(text, type));
  }
  /**
     * Creates a new poll request button. The user will be asked to create a
     * poll and send it to the bot when the button is pressed. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param type The type of permitted polls to create, omit if the user may
     * send a poll of any type
     */ static requestPoll(text, type) {
    return {
      text,
      request_poll: {
        type
      }
    };
  }
  /**
     * Adds a new web app button. The Web App that will be launched when the
     * user presses the button. The Web App will be able to send a
     * “web_app_data” service message. Available in private chats only.
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ webApp(text, url) {
    return this.add(Keyboard.webApp(text, url));
  }
  /**
     * Creates a new web app button. The Web App that will be launched when the
     * user presses the button. The Web App will be able to send a
     * “web_app_data” service message. Available in private chats only.
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ static webApp(text, url) {
    return {
      text,
      web_app: {
        url
      }
    };
  }
  /**
     * Make the current keyboard persistent. See
     * https://grammy.dev/plugins/keyboard#persistent-keyboards for more
     * details.
     *
     * Keyboards are not persistent by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to not persist.
     *
     * @param isEnabled `true` if the keyboard should persist, and `false` otherwise
     */ persistent(isEnabled = true) {
    this.is_persistent = isEnabled;
    return this;
  }
  /**
     * Make the current keyboard selective. See
     * https://grammy.dev/plugins/keyboard#selectively-send-custom-keyboards
     * for more details.
     *
     * Keyboards are non-selective by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-selective.
     *
     * @param isEnabled `true` if the keyboard should be selective, and `false` otherwise
     */ selected(isEnabled = true) {
    this.selective = isEnabled;
    return this;
  }
  /**
     * Make the current keyboard one-time. See
     * https://grammy.dev/plugins/keyboard#one-time-custom-keyboards for
     * more details.
     *
     * Keyboards are non-one-time by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-one-time.
     *
     * @param isEnabled `true` if the keyboard should be one-time, and `false` otherwise
     */ oneTime(isEnabled = true) {
    this.one_time_keyboard = isEnabled;
    return this;
  }
  /**
     * Make the current keyboard resized. See
     * https://grammy.dev/plugins/keyboard#resize-custom-keyboard for more
     * details.
     *
     * Keyboards are non-resized by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-resized.
     *
     * @param isEnabled `true` if the keyboard should be resized, and `false` otherwise
     */ resized(isEnabled = true) {
    this.resize_keyboard = isEnabled;
    return this;
  }
  /**
     * Set the current keyboard's input field placeholder. See
     * https://grammy.dev/plugins/keyboard#input-field-placeholder for more
     * details.
     *
     * @param value The placeholder text
     */ placeholder(value) {
    this.input_field_placeholder = value;
    return this;
  }
  /**
     * Creates a new keyboard that contains the transposed grid of buttons of
     * this keyboard. This means that the resulting keyboard has the rows and
     * columns flipped.
     *
     * Note that buttons can only span multiple columns, but never multiple
     * rows. This means that if the given arrays have different lengths, some
     * buttons might flow up in the layout. In these cases, transposing a
     * keyboard a second time will not undo the first transposition.
     *
     * Here are some examples.
     *
     * ```
     * original    transposed
     * [  a  ]  ~> [  a  ]
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]
     *             [  c  ]
     *
     * [ a b ]     [a c e]
     * [ c d ]  ~> [ b d ]
     * [  e  ]
     *
     * [ a b ]     [a c d]
     * [  c  ]  ~> [ b e ]
     * [d e f]     [  f  ]
     * ```
     */ toTransposed() {
    const original = this.keyboard;
    const transposed = transpose(original);
    return this.clone(transposed);
  }
  /**
     * Creates a new keyboard with the same buttons but reflowed into a given
     * number of columns as if the buttons were text elements. Optionally, you
     * can specify if the flow should make sure to fill up the last row.
     *
     * This method is idempotent, so calling it a second time will effectively
     * clone this keyboard without reordering the buttons.
     *
     * Here are some examples.
     *
     * ```
     * original    flowed
     * [  a  ]  ~> [  a  ]    (4 columns)
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]    (1 column)
     *             [  c  ]
     *
     * [ a b ]     [a b c]
     * [ c d ]  ~> [ d e ]    (3 columns)
     * [  e  ]
     *
     * [ a b ]     [abcde]
     * [  c  ]  ~> [  f  ]    (5 columns)
     * [d e f]
     *
     * [a b c]     [  a  ]
     * [d e f]  ~> [b c d]    (3 colums, { fillLastRow: true })
     * [g h i]     [e f g]
     * [  j  ]     [h i j]
     * ```
     *
     * @param columns Maximum number of buttons per row
     * @param options Optional flowing behavior
     */ toFlowed(columns, options = {}) {
    const original = this.keyboard;
    const flowed = reflow(original, columns, options);
    return this.clone(flowed);
  }
  /**
     * Creates and returns a deep copy of this keyboard.
     *
     * Optionally takes a new grid of buttons to replace the current buttons. If
     * specified, only the options will be cloned, and the given buttons will be
     * used instead.
     */ clone(keyboard = this.keyboard) {
    const clone = new Keyboard(keyboard.map((row)=>row.slice()));
    clone.is_persistent = this.is_persistent;
    clone.selective = this.selective;
    clone.one_time_keyboard = this.one_time_keyboard;
    clone.resize_keyboard = this.resize_keyboard;
    clone.input_field_placeholder = this.input_field_placeholder;
    return clone;
  }
  /**
     * Appends the buttons of the given keyboards to this keyboard. If other
     * options are specified in these keyboards, they will be ignored.
     *
     * @param sources A number of keyboards to append
     */ append(...sources) {
    for (const source of sources){
      const keyboard = Keyboard.from(source);
      this.keyboard.push(...keyboard.keyboard.map((row)=>row.slice()));
    }
    return this;
  }
  /**
     * Returns the keyboard that was build. Note that it doesn't return
     * `resize_keyboard` or other options that may be set. You don't usually
     * need to call this method. It is no longer useful.
     */ build() {
    return this.keyboard;
  }
  /**
     * Turns a two-dimensional keyboard button array into a keyboard instance.
     * You can use the static button builder methods to create keyboard button
     * objects.
     *
     * @param source A two-dimensional button array
     */ static from(source) {
    if (source instanceof Keyboard) return source.clone();
    function toButton(btn) {
      return typeof btn === "string" ? Keyboard.text(btn) : btn;
    }
    return new Keyboard(source.map((row)=>row.map(toButton)));
  }
}
/**
 * Use this class to simplify building an inline keyboard (something like this:
 * https://core.telegram.org/bots/features#inline-keyboards).
 *
 * ```ts
 * // Build an inline keyboard:
 * const keyboard = new InlineKeyboard()
 *   .text('A').text('B', 'callback-data').row()
 *   .text('C').text('D').row()
 *   .url('Telegram', 'telegram.org')
 *
 * // Send the keyboard:
 * await ctx.reply('Here is your inline keyboard!', {
 *   reply_markup: keyboard
 * })
 * ```
 *
 * If you already have some source data which you would like to turn into an
 * inline button object, you can use the static equivalents which every inline
 * button has. You can use them to create a two-dimensional inline button array.
 * The resulting array can be turned into a keyboard instance.
 *
 * ```ts
 * const button = InlineKeyboard.text('GO', 'go')
 * const array = [[button]]
 * const keyboard = InlineKeyboard.from(array)
 * ```
 *
 * Be sure to to check the
 * [documentation](https://grammy.dev/plugins/keyboard#inline-keyboards) on
 * inline keyboards in grammY.
 */ export class InlineKeyboard {
  inline_keyboard;
  /**
     * Initialize a new `InlineKeyboard` with an optional two-dimensional array
     * of `InlineKeyboardButton` objects. This is the nested array that holds
     * the inline keyboard. It will be extended every time you call one of the
     * provided methods.
     *
     * @param inline_keyboard An optional initial two-dimensional button array
     */ constructor(inline_keyboard = [
    []
  ]){
    this.inline_keyboard = inline_keyboard;
  }
  /**
     * Allows you to add your own `InlineKeyboardButton` objects if you already
     * have them for some reason. You most likely want to call one of the other
     * methods.
     *
     * @param buttons The buttons to add
     */ add(...buttons) {
    this.inline_keyboard[this.inline_keyboard.length - 1]?.push(...buttons);
    return this;
  }
  /**
     * Adds a 'line break'. Call this method to make sure that the next added
     * buttons will be on a new row.
     *
     * You may pass a number of `InlineKeyboardButton` objects if you already
     * have the instances for some reason. You most likely don't want to pass
     * any arguments to `row`.
     *
     * @param buttons A number of buttons to add to the next row
     */ row(...buttons) {
    this.inline_keyboard.push(buttons);
    return this;
  }
  /**
     * Adds a new URL button. Telegram clients will open the provided URL when
     * the button is pressed.
     *
     * @param text The text to display
     * @param url HTTP or tg:// url to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their ID without using a username, if this is allowed by their privacy settings.
     */ url(text, url) {
    return this.add(InlineKeyboard.url(text, url));
  }
  /**
     * Creates a new URL button. Telegram clients will open the provided URL
     * when the button is pressed.
     *
     * @param text The text to display
     * @param url HTTP or tg:// url to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their ID without using a username, if this is allowed by their privacy settings.
     */ static url(text, url) {
    return {
      text,
      url
    };
  }
  /**
     * Adds a new callback query button. The button contains a text and a custom
     * payload. This payload will be sent back to your bot when the button is
     * pressed. If you omit the payload, the display text will be sent back to
     * your bot.
     *
     * Your bot will receive an update every time a user presses any of the text
     * buttons. You can listen to these updates like this:
     * ```ts
     * // Specific buttons:
     * bot.callbackQuery('button-data', ctx => { ... })
     * // Any button of any inline keyboard:
     * bot.on('callback_query:data',    ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param data The callback data to send back to your bot (default = text)
     */ text(text, data = text) {
    return this.add(InlineKeyboard.text(text, data));
  }
  /**
     * Creates a new callback query button. The button contains a text and a
     * custom payload. This payload will be sent back to your bot when the
     * button is pressed. If you omit the payload, the display text will be sent
     * back to your bot.
     *
     * Your bot will receive an update every time a user presses any of the text
     * buttons. You can listen to these updates like this:
     * ```ts
     * // Specific buttons:
     * bot.callbackQuery('button-data', ctx => { ... })
     * // Any button of any inline keyboard:
     * bot.on('callback_query:data',    ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param data The callback data to send back to your bot (default = text)
     */ static text(text, data = text) {
    return {
      text,
      callback_data: data
    };
  }
  /**
     * Adds a new web app button, confer https://core.telegram.org/bots/webapps
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ webApp(text, url) {
    return this.add(InlineKeyboard.webApp(text, url));
  }
  /**
     * Creates a new web app button, confer https://core.telegram.org/bots/webapps
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ static webApp(text, url) {
    return {
      text,
      web_app: {
        url
      }
    };
  }
  /**
     * Adds a new login button. This can be used as a replacement for the
     * Telegram Login Widget. You must specify an HTTPS URL used to
     * automatically authorize the user.
     *
     * @param text The text to display
     * @param loginUrl The login URL as string or `LoginUrl` object
     */ login(text, loginUrl) {
    return this.add(InlineKeyboard.login(text, loginUrl));
  }
  /**
     * Creates a new login button. This can be used as a replacement for the
     * Telegram Login Widget. You must specify an HTTPS URL used to
     * automatically authorize the user.
     *
     * @param text The text to display
     * @param loginUrl The login URL as string or `LoginUrl` object
     */ static login(text, loginUrl) {
    return {
      text,
      login_url: typeof loginUrl === "string" ? {
        url: loginUrl
      } : loginUrl
    };
  }
  /**
     * Adds a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ switchInline(text, query = "") {
    return this.add(InlineKeyboard.switchInline(text, query));
  }
  /**
     * Creates a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ static switchInline(text, query = "") {
    return {
      text,
      switch_inline_query: query
    };
  }
  /**
     * Adds a new inline query button that acts on the current chat. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it. This will start an inline
     * query.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ switchInlineCurrent(text, query = "") {
    return this.add(InlineKeyboard.switchInlineCurrent(text, query));
  }
  /**
     * Creates a new inline query button that acts on the current chat. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it. This will start an inline
     * query.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ static switchInlineCurrent(text, query = "") {
    return {
      text,
      switch_inline_query_current_chat: query
    };
  }
  /**
     * Adds a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The query object describing which chats can be picked
     */ switchInlineChosen(text, query = {}) {
    return this.add(InlineKeyboard.switchInlineChosen(text, query));
  }
  /**
     * Creates a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The query object describing which chats can be picked
     */ static switchInlineChosen(text, query = {}) {
    return {
      text,
      switch_inline_query_chosen_chat: query
    };
  }
  /**
     * Adds a new game query button, confer
     * https://core.telegram.org/bots/api#games
     *
     * This type of button must always be the first button in the first row.
     *
     * @param text The text to display
     */ game(text) {
    return this.add(InlineKeyboard.game(text));
  }
  /**
     * Creates a new game query button, confer
     * https://core.telegram.org/bots/api#games
     *
     * This type of button must always be the first button in the first row.
     *
     * @param text The text to display
     */ static game(text) {
    return {
      text,
      callback_game: {}
    };
  }
  /**
     * Adds a new payment button, confer
     * https://core.telegram.org/bots/api#payments
     *
     * This type of button must always be the first button in the first row and
     * can only be used in invoice messages.
     *
     * @param text The text to display. Substrings “⭐” and “XTR” in the buttons's text will be replaced with a Telegram Star icon.
     */ pay(text) {
    return this.add(InlineKeyboard.pay(text));
  }
  /**
     * Create a new payment button, confer
     * https://core.telegram.org/bots/api#payments
     *
     * This type of button must always be the first button in the first row and
     * can only be used in invoice messages.
     *
     * @param text The text to display. Substrings “⭐” and “XTR” in the buttons's text will be replaced with a Telegram Star icon.
     */ static pay(text) {
    return {
      text,
      pay: true
    };
  }
  /**
     * Creates a new inline keyboard that contains the transposed grid of
     * buttons of this inline keyboard. This means that the resulting inline
     * keyboard has the rows and columns flipped.
     *
     * Note that inline buttons can only span multiple columns, but never
     * multiple rows. This means that if the given arrays have different
     * lengths, some buttons might flow up in the layout. In these cases,
     * transposing an inline keyboard a second time will not undo the first
     * transposition.
     *
     * Here are some examples.
     *
     * ```
     * original    transposed
     * [  a  ]  ~> [  a  ]
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]
     *             [  c  ]
     *
     * [ a b ]     [a c e]
     * [ c d ]  ~> [ b d ]
     * [  e  ]
     *
     * [ a b ]     [a c d]
     * [  c  ]  ~> [ b e ]
     * [d e f]     [  f  ]
     * ```
     */ toTransposed() {
    const original = this.inline_keyboard;
    const transposed = transpose(original);
    return new InlineKeyboard(transposed);
  }
  /**
     * Creates a new inline keyboard with the same buttons but reflowed into a
     * given number of columns as if the buttons were text elements. Optionally,
     * you can specify if the flow should make sure to fill up the last row.
     *
     * This method is idempotent, so calling it a second time will effectively
     * clone this inline keyboard without reordering the buttons.
     *
     * Here are some examples.
     *
     * ```
     * original    flowed
     * [  a  ]  ~> [  a  ]    (4 columns)
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]    (1 column)
     *             [  c  ]
     *
     * [ a b ]     [a b c]
     * [ c d ]  ~> [ d e ]    (3 columns)
     * [  e  ]
     *
     * [ a b ]     [abcde]
     * [  c  ]  ~> [  f  ]    (5 columns)
     * [d e f]
     *
     * [a b c]     [  a  ]
     * [d e f]  ~> [b c d]    (3 colums, { fillLastRow: true })
     * [g h i]     [e f g]
     * [  j  ]     [h i j]
     * ```
     *
     * @param columns Maximum number of buttons per row
     * @param options Optional flowing behavior
     */ toFlowed(columns, options = {}) {
    const original = this.inline_keyboard;
    const flowed = reflow(original, columns, options);
    return new InlineKeyboard(flowed);
  }
  /**
     * Creates and returns a deep copy of this inline keyboard.
     */ clone() {
    return new InlineKeyboard(this.inline_keyboard.map((row)=>row.slice()));
  }
  /**
     * Appends the buttons of the given inline keyboards to this keyboard.
     *
     * @param sources A number of inline keyboards to append
     */ append(...sources) {
    for (const source of sources){
      const keyboard = InlineKeyboard.from(source);
      this.inline_keyboard.push(...keyboard.inline_keyboard.map((row)=>row.slice()));
    }
    return this;
  }
  /**
     * Turns a two-dimensional inline button array into an inline keyboard
     * instance. You can use the static button builder methods to create inline
     * button objects.
     *
     * @param source A two-dimensional inline button array
     */ static from(source) {
    if (source instanceof InlineKeyboard) return source.clone();
    return new InlineKeyboard(source.map((row)=>row.slice()));
  }
}
function transpose(grid) {
  const transposed = [];
  for(let i = 0; i < grid.length; i++){
    const row = grid[i];
    for(let j = 0; j < row.length; j++){
      const button = row[j];
      (transposed[j] ??= []).push(button);
    }
  }
  return transposed;
}
function reflow(grid, columns, { fillLastRow = false }) {
  let first = columns;
  if (fillLastRow) {
    const buttonCount = grid.map((row)=>row.length).reduce((a, b)=>a + b, 0);
    first = buttonCount % columns;
  }
  const reflowed = [];
  for (const row of grid){
    for (const button of row){
      const at = Math.max(0, reflowed.length - 1);
      const max = at === 0 ? first : columns;
      let next = reflowed[at] ??= [];
      if (next.length === max) {
        next = [];
        reflowed.push(next);
      }
      next.push(button);
    }
  }
  return reflowed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29udmVuaWVuY2Uva2V5Ym9hcmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICB0eXBlIElubGluZUtleWJvYXJkQnV0dG9uLFxuICAgIHR5cGUgS2V5Ym9hcmRCdXR0b24sXG4gICAgdHlwZSBLZXlib2FyZEJ1dHRvblBvbGxUeXBlLFxuICAgIHR5cGUgS2V5Ym9hcmRCdXR0b25SZXF1ZXN0Q2hhdCxcbiAgICB0eXBlIEtleWJvYXJkQnV0dG9uUmVxdWVzdFVzZXJzLFxuICAgIHR5cGUgTG9naW5VcmwsXG4gICAgdHlwZSBTd2l0Y2hJbmxpbmVRdWVyeUNob3NlbkNoYXQsXG59IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG50eXBlIEtleWJvYXJkQnV0dG9uU291cmNlID0gc3RyaW5nIHwgS2V5Ym9hcmRCdXR0b247XG50eXBlIEtleWJvYXJkU291cmNlID0gS2V5Ym9hcmRCdXR0b25Tb3VyY2VbXVtdIHwgS2V5Ym9hcmQ7XG4vKipcbiAqIFVzZSB0aGlzIGNsYXNzIHRvIHNpbXBsaWZ5IGJ1aWxkaW5nIGEgY3VzdG9tIGtleWJvYXJkIChzb21ldGhpbmcgbGlrZSB0aGlzOlxuICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2ZlYXR1cmVzI2tleWJvYXJkcykuXG4gKlxuICogYGBgdHNcbiAqIC8vIEJ1aWxkIGEgY3VzdG9tIGtleWJvYXJkOlxuICogY29uc3Qga2V5Ym9hcmQgPSBuZXcgS2V5Ym9hcmQoKVxuICogICAudGV4dCgnQScpLnRleHQoJ0InKS5yb3coKVxuICogICAudGV4dCgnQycpLnRleHQoJ0QnKVxuICpcbiAqIC8vIE5vdyB5b3UgY2FuIHNlbmQgaXQgbGlrZSBzbzpcbiAqIGF3YWl0IGN0eC5yZXBseSgnSGVyZSBpcyB5b3VyIGN1c3RvbSBrZXlib2FyZCEnLCB7XG4gKiAgIHJlcGx5X21hcmt1cDoga2V5Ym9hcmRcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBJZiB5b3UgYWxyZWFkeSBoYXZlIHNvbWUgc291cmNlIGRhdGEgd2hpY2ggeW91IHdvdWxkIGxpa2UgdG8gdHVybiBpbnRvIGFcbiAqIGtleWJvYXJkIGJ1dHRvbiBvYmplY3QsIHlvdSBjYW4gdXNlIHRoZSBzdGF0aWMgZXF1aXZhbGVudHMgd2hpY2ggZXZlcnkgYnV0dG9uXG4gKiBoYXMuIFlvdSBjYW4gdXNlIHRoZW0gdG8gY3JlYXRlIGEgdHdvLWRpbWVuc2lvbmFsIGtleWJvYXJkIGJ1dHRvbiBhcnJheS4gVGhlXG4gKiByZXN1bHRpbmcgYXJyYXkgY2FuIGJlIHR1cm5lZCBpbnRvIGEga2V5Ym9hcmQgaW5zdGFuY2UuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IGJ1dHRvbiA9IEtleWJvYXJkLnRleHQoJ3B1c2ggbXkgYnV0dG9ucycpXG4gKiBjb25zdCBhcnJheSA9IFtbYnV0dG9uXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShhcnJheSlcbiAqIGBgYFxuICpcbiAqIElmIHlvdSB3YW50IHRvIGNyZWF0ZSB0ZXh0IGJ1dHRvbnMgb25seSwgeW91IGNhbiBkaXJlY3RseSB1c2UgYVxuICogdHdvLWRpbWVuc2lvbmFsIHN0cmluZyBhcnJheSBhbmQgdHVybiBpdCBpbnRvIGEga2V5Ym9hcmQuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IGRhdGEgPSBbWydBJywgJ0InXSwgWydDJywgJ0QnXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShkYXRhKVxuICogYGBgXG4gKlxuICogQmUgc3VyZSB0byBjaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQjY3VzdG9tLWtleWJvYXJkcykgb25cbiAqIGN1c3RvbSBrZXlib2FyZHMgaW4gZ3JhbW1ZLlxuICovXG5leHBvcnQgY2xhc3MgS2V5Ym9hcmQge1xuICAgIC8qKlxuICAgICAqIFJlcXVlc3RzIGNsaWVudHMgdG8gYWx3YXlzIHNob3cgdGhlIGtleWJvYXJkIHdoZW4gdGhlIHJlZ3VsYXIga2V5Ym9hcmQgaXNcbiAgICAgKiBoaWRkZW4uIERlZmF1bHRzIHRvIGZhbHNlLCBpbiB3aGljaCBjYXNlIHRoZSBjdXN0b20ga2V5Ym9hcmQgY2FuIGJlXG4gICAgICogaGlkZGVuIGFuZCBvcGVuZWQgd2l0aCBhIGtleWJvYXJkIGljb24uXG4gICAgICovXG4gICAgcHVibGljIGlzX3BlcnNpc3RlbnQ/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqIFNob3cgdGhlIGN1cnJlbnQga2V5Ym9hcmQgb25seSB0byB0aG9zZSB1c2VycyB0aGF0IGFyZSBtZW50aW9uZWQgaW4gdGhlXG4gICAgICogdGV4dCBvZiB0aGUgbWVzc2FnZSBvYmplY3QuXG4gICAgICovXG4gICAgcHVibGljIHNlbGVjdGl2ZT86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogSGlkZSB0aGUga2V5Ym9hcmQgYWZ0ZXIgYSBidXR0b24gaXMgcHJlc3NlZC5cbiAgICAgKi9cbiAgICBwdWJsaWMgb25lX3RpbWVfa2V5Ym9hcmQ/OiBib29sZWFuO1xuICAgIC8qKlxuICAgICAqIFJlc2l6ZSB0aGUgY3VycmVudCBrZXlib2FyZCBhY2NvcmRpbmcgdG8gaXRzIGJ1dHRvbnMuIFVzdWFsbHksIHRoaXMgd2lsbFxuICAgICAqIG1ha2UgdGhlIGtleWJvYXJkIHNtYWxsZXIuXG4gICAgICovXG4gICAgcHVibGljIHJlc2l6ZV9rZXlib2FyZD86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogUGxhY2Vob2xkZXIgdG8gYmUgc2hvd24gaW4gdGhlIGlucHV0IGZpZWxkIHdoZW4gdGhlIGtleWJvYXJkIGlzIGFjdGl2ZS5cbiAgICAgKi9cbiAgICBwdWJsaWMgaW5wdXRfZmllbGRfcGxhY2Vob2xkZXI/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplIGEgbmV3IGBLZXlib2FyZGAgd2l0aCBhbiBvcHRpb25hbCB0d28tZGltZW5zaW9uYWwgYXJyYXkgb2ZcbiAgICAgKiBgS2V5Ym9hcmRCdXR0b25gIG9iamVjdHMuIFRoaXMgaXMgdGhlIG5lc3RlZCBhcnJheSB0aGF0IGhvbGRzIHRoZSBjdXN0b21cbiAgICAgKiBrZXlib2FyZC4gSXQgd2lsbCBiZSBleHRlbmRlZCBldmVyeSB0aW1lIHlvdSBjYWxsIG9uZSBvZiB0aGUgcHJvdmlkZWRcbiAgICAgKiBtZXRob2RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGtleWJvYXJkIEFuIG9wdGlvbmFsIGluaXRpYWwgdHdvLWRpbWVuc2lvbmFsIGJ1dHRvbiBhcnJheVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBrZXlib2FyZDogS2V5Ym9hcmRCdXR0b25bXVtdID0gW1tdXSkge31cbiAgICAvKipcbiAgICAgKiBBbGxvd3MgeW91IHRvIGFkZCB5b3VyIG93biBgS2V5Ym9hcmRCdXR0b25gIG9iamVjdHMgaWYgeW91IGFscmVhZHkgaGF2ZVxuICAgICAqIHRoZW0gZm9yIHNvbWUgcmVhc29uLiBZb3UgbW9zdCBsaWtlbHkgd2FudCB0byBjYWxsIG9uZSBvZiB0aGUgb3RoZXJcbiAgICAgKiBtZXRob2RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1dHRvbnMgVGhlIGJ1dHRvbnMgdG8gYWRkXG4gICAgICovXG4gICAgYWRkKC4uLmJ1dHRvbnM6IEtleWJvYXJkQnV0dG9uW10pIHtcbiAgICAgICAgdGhpcy5rZXlib2FyZFt0aGlzLmtleWJvYXJkLmxlbmd0aCAtIDFdPy5wdXNoKC4uLmJ1dHRvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhICdsaW5lIGJyZWFrJy4gQ2FsbCB0aGlzIG1ldGhvZCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgbmV4dCBhZGRlZFxuICAgICAqIGJ1dHRvbnMgd2lsbCBiZSBvbiBhIG5ldyByb3cuXG4gICAgICpcbiAgICAgKiBZb3UgbWF5IHBhc3MgYSBudW1iZXIgb2YgYEtleWJvYXJkQnV0dG9uYCBvYmplY3RzIGlmIHlvdSBhbHJlYWR5IGhhdmUgdGhlXG4gICAgICogaW5zdGFuY2VzIGZvciBzb21lIHJlYXNvbi4gWW91IG1vc3QgbGlrZWx5IGRvbid0IHdhbnQgdG8gcGFzcyBhbnlcbiAgICAgKiBhcmd1bWVudHMgdG8gYHJvd2AuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9ucyBBIG51bWJlciBvZiBidXR0b25zIHRvIGFkZCB0byB0aGUgbmV4dCByb3dcbiAgICAgKi9cbiAgICByb3coLi4uYnV0dG9uczogS2V5Ym9hcmRCdXR0b25bXSkge1xuICAgICAgICB0aGlzLmtleWJvYXJkLnB1c2goYnV0dG9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHRleHQgYnV0dG9uLiBUaGlzIGJ1dHRvbiB3aWxsIHNpbXBseSBzZW5kIHRoZSBnaXZlbiB0ZXh0IGFzIGFcbiAgICAgKiB0ZXh0IG1lc3NhZ2UgYmFjayB0byB5b3VyIGJvdCBpZiBhIHVzZXIgY2xpY2tzIG9uIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHRleHQodGV4dDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChLZXlib2FyZC50ZXh0KHRleHQpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyB0ZXh0IGJ1dHRvbi4gVGhpcyBidXR0b24gd2lsbCBzaW1wbHkgc2VuZCB0aGUgZ2l2ZW4gdGV4dCBhc1xuICAgICAqIGEgdGV4dCBtZXNzYWdlIGJhY2sgdG8geW91ciBib3QgaWYgYSB1c2VyIGNsaWNrcyBvbiBpdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICBzdGF0aWMgdGV4dCh0ZXh0OiBzdHJpbmcpOiBLZXlib2FyZEJ1dHRvbi5Db21tb25CdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgcmVxdWVzdCB1c2VycyBidXR0b24uIFdoZW4gdGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBhIGxpc3RcbiAgICAgKiBvZiBzdWl0YWJsZSB1c2VycyB3aWxsIGJlIG9wZW5lZC4gVGFwcGluZyBvbiBhbnkgbnVtYmVyIG9mIHVzZXJzIHdpbGxcbiAgICAgKiBzZW5kIHRoZWlyIGlkZW50aWZpZXJzIHRvIHRoZSBib3QgaW4gYSDigJx1c2Vyc19zaGFyZWTigJ0gc2VydmljZSBtZXNzYWdlLlxuICAgICAqIEF2YWlsYWJsZSBpbiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHJlcXVlc3RJZCBBIHNpZ25lZCAzMi1iaXQgaWRlbnRpZmllciBvZiB0aGUgcmVxdWVzdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0IGZvciBmdXJ0aGVyIHJlcXVpcmVtZW50c1xuICAgICAqL1xuICAgIHJlcXVlc3RVc2VycyhcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0SWQ6IG51bWJlcixcbiAgICAgICAgb3B0aW9uczogT21pdDxLZXlib2FyZEJ1dHRvblJlcXVlc3RVc2VycywgXCJyZXF1ZXN0X2lkXCI+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChLZXlib2FyZC5yZXF1ZXN0VXNlcnModGV4dCwgcmVxdWVzdElkLCBvcHRpb25zKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCB1c2VycyBidXR0b24uIFdoZW4gdGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBhXG4gICAgICogbGlzdCBvZiBzdWl0YWJsZSB1c2VycyB3aWxsIGJlIG9wZW5lZC4gVGFwcGluZyBvbiBhbnkgbnVtYmVyIG9mIHVzZXJzXG4gICAgICogd2lsbCBzZW5kIHRoZWlyIGlkZW50aWZpZXJzIHRvIHRoZSBib3QgaW4gYSDigJx1c2Vyc19zaGFyZWTigJ0gc2VydmljZVxuICAgICAqIG1lc3NhZ2UuIEF2YWlsYWJsZSBpbiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHJlcXVlc3RJZCBBIHNpZ25lZCAzMi1iaXQgaWRlbnRpZmllciBvZiB0aGUgcmVxdWVzdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0IGZvciBmdXJ0aGVyIHJlcXVpcmVtZW50c1xuICAgICAqL1xuICAgIHN0YXRpYyByZXF1ZXN0VXNlcnMoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdElkOiBudW1iZXIsXG4gICAgICAgIG9wdGlvbnM6IE9taXQ8S2V5Ym9hcmRCdXR0b25SZXF1ZXN0VXNlcnMsIFwicmVxdWVzdF9pZFwiPiA9IHt9LFxuICAgICk6IEtleWJvYXJkQnV0dG9uLlJlcXVlc3RVc2Vyc0J1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHJlcXVlc3RfdXNlcnM6IHsgcmVxdWVzdF9pZDogcmVxdWVzdElkLCAuLi5vcHRpb25zIH0gfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyByZXF1ZXN0IGNoYXQgYnV0dG9uLiBXaGVuIHRoZSB1c2VyIHByZXNzZXMgdGhlIGJ1dHRvbiwgYSBsaXN0XG4gICAgICogb2Ygc3VpdGFibGUgdXNlcnMgd2lsbCBiZSBvcGVuZWQuIFRhcHBpbmcgb24gYSBjaGF0IHdpbGwgc2VuZCBpdHNcbiAgICAgKiBpZGVudGlmaWVyIHRvIHRoZSBib3QgaW4gYSDigJxjaGF0X3NoYXJlZOKAnSBzZXJ2aWNlIG1lc3NhZ2UuIEF2YWlsYWJsZSBpblxuICAgICAqIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcmVxdWVzdElkIEEgc2lnbmVkIDMyLWJpdCBpZGVudGlmaWVyIG9mIHRoZSByZXF1ZXN0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBvYmplY3QgZm9yIGZ1cnRoZXIgcmVxdWlyZW1lbnRzXG4gICAgICovXG4gICAgcmVxdWVzdENoYXQoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdElkOiBudW1iZXIsXG4gICAgICAgIG9wdGlvbnM6IE9taXQ8S2V5Ym9hcmRCdXR0b25SZXF1ZXN0Q2hhdCwgXCJyZXF1ZXN0X2lkXCI+ID0ge1xuICAgICAgICAgICAgY2hhdF9pc19jaGFubmVsOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnJlcXVlc3RDaGF0KHRleHQsIHJlcXVlc3RJZCwgb3B0aW9ucykpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHJlcXVlc3QgY2hhdCBidXR0b24uIFdoZW4gdGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBhXG4gICAgICogbGlzdCBvZiBzdWl0YWJsZSB1c2VycyB3aWxsIGJlIG9wZW5lZC4gVGFwcGluZyBvbiBhIGNoYXQgd2lsbCBzZW5kIGl0c1xuICAgICAqIGlkZW50aWZpZXIgdG8gdGhlIGJvdCBpbiBhIOKAnGNoYXRfc2hhcmVk4oCdIHNlcnZpY2UgbWVzc2FnZS4gQXZhaWxhYmxlIGluXG4gICAgICogcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSByZXF1ZXN0SWQgQSBzaWduZWQgMzItYml0IGlkZW50aWZpZXIgb2YgdGhlIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIG9iamVjdCBmb3IgZnVydGhlciByZXF1aXJlbWVudHNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxdWVzdENoYXQoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcmVxdWVzdElkOiBudW1iZXIsXG4gICAgICAgIG9wdGlvbnM6IE9taXQ8S2V5Ym9hcmRCdXR0b25SZXF1ZXN0Q2hhdCwgXCJyZXF1ZXN0X2lkXCI+ID0ge1xuICAgICAgICAgICAgY2hhdF9pc19jaGFubmVsOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICApOiBLZXlib2FyZEJ1dHRvbi5SZXF1ZXN0Q2hhdEJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHJlcXVlc3RfY2hhdDogeyByZXF1ZXN0X2lkOiByZXF1ZXN0SWQsIC4uLm9wdGlvbnMgfSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGNvbnRhY3QgcmVxdWVzdCBidXR0b24uIFRoZSB1c2VyJ3MgcGhvbmUgbnVtYmVyIHdpbGwgYmUgc2VudFxuICAgICAqIGFzIGEgY29udGFjdCB3aGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZC4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICByZXF1ZXN0Q29udGFjdCh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnJlcXVlc3RDb250YWN0KHRleHQpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBjb250YWN0IHJlcXVlc3QgYnV0dG9uLiBUaGUgdXNlcidzIHBob25lIG51bWJlciB3aWxsIGJlXG4gICAgICogc2VudCBhcyBhIGNvbnRhY3Qgd2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQuIEF2YWlsYWJsZSBpbiBwcml2YXRlIGNoYXRzXG4gICAgICogb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxdWVzdENvbnRhY3QodGV4dDogc3RyaW5nKTogS2V5Ym9hcmRCdXR0b24uUmVxdWVzdENvbnRhY3RCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCByZXF1ZXN0X2NvbnRhY3Q6IHRydWUgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBsb2NhdGlvbiByZXF1ZXN0IGJ1dHRvbi4gVGhlIHVzZXIncyBjdXJyZW50IGxvY2F0aW9uIHdpbGwgYmVcbiAgICAgKiBzZW50IHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBBdmFpbGFibGUgaW4gcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHJlcXVlc3RMb2NhdGlvbih0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnJlcXVlc3RMb2NhdGlvbih0ZXh0KSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbG9jYXRpb24gcmVxdWVzdCBidXR0b24uIFRoZSB1c2VyJ3MgY3VycmVudCBsb2NhdGlvbiB3aWxsXG4gICAgICogYmUgc2VudCB3aGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZC4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxdWVzdExvY2F0aW9uKHRleHQ6IHN0cmluZyk6IEtleWJvYXJkQnV0dG9uLlJlcXVlc3RMb2NhdGlvbkJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHJlcXVlc3RfbG9jYXRpb246IHRydWUgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBwb2xsIHJlcXVlc3QgYnV0dG9uLiBUaGUgdXNlciB3aWxsIGJlIGFza2VkIHRvIGNyZWF0ZSBhIHBvbGxcbiAgICAgKiBhbmQgc2VuZCBpdCB0byB0aGUgYm90IHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBBdmFpbGFibGUgaW4gcHJpdmF0ZVxuICAgICAqIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgcGVybWl0dGVkIHBvbGxzIHRvIGNyZWF0ZSwgb21pdCBpZiB0aGUgdXNlciBtYXlcbiAgICAgKiBzZW5kIGEgcG9sbCBvZiBhbnkgdHlwZVxuICAgICAqL1xuICAgIHJlcXVlc3RQb2xsKHRleHQ6IHN0cmluZywgdHlwZT86IEtleWJvYXJkQnV0dG9uUG9sbFR5cGVbXCJ0eXBlXCJdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChLZXlib2FyZC5yZXF1ZXN0UG9sbCh0ZXh0LCB0eXBlKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgcG9sbCByZXF1ZXN0IGJ1dHRvbi4gVGhlIHVzZXIgd2lsbCBiZSBhc2tlZCB0byBjcmVhdGUgYVxuICAgICAqIHBvbGwgYW5kIHNlbmQgaXQgdG8gdGhlIGJvdCB3aGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZC4gQXZhaWxhYmxlIGluXG4gICAgICogcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHBlcm1pdHRlZCBwb2xscyB0byBjcmVhdGUsIG9taXQgaWYgdGhlIHVzZXIgbWF5XG4gICAgICogc2VuZCBhIHBvbGwgb2YgYW55IHR5cGVcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVxdWVzdFBvbGwoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdHlwZT86IEtleWJvYXJkQnV0dG9uUG9sbFR5cGVbXCJ0eXBlXCJdLFxuICAgICk6IEtleWJvYXJkQnV0dG9uLlJlcXVlc3RQb2xsQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgcmVxdWVzdF9wb2xsOiB7IHR5cGUgfSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHdlYiBhcHAgYnV0dG9uLiBUaGUgV2ViIEFwcCB0aGF0IHdpbGwgYmUgbGF1bmNoZWQgd2hlbiB0aGVcbiAgICAgKiB1c2VyIHByZXNzZXMgdGhlIGJ1dHRvbi4gVGhlIFdlYiBBcHAgd2lsbCBiZSBhYmxlIHRvIHNlbmQgYVxuICAgICAqIOKAnHdlYl9hcHBfZGF0YeKAnSBzZXJ2aWNlIG1lc3NhZ2UuIEF2YWlsYWJsZSBpbiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHVybCBBbiBIVFRQUyBVUkwgb2YgYSBXZWIgQXBwIHRvIGJlIG9wZW5lZCB3aXRoIGFkZGl0aW9uYWwgZGF0YVxuICAgICAqL1xuICAgIHdlYkFwcCh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChLZXlib2FyZC53ZWJBcHAodGV4dCwgdXJsKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgd2ViIGFwcCBidXR0b24uIFRoZSBXZWIgQXBwIHRoYXQgd2lsbCBiZSBsYXVuY2hlZCB3aGVuIHRoZVxuICAgICAqIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLiBUaGUgV2ViIEFwcCB3aWxsIGJlIGFibGUgdG8gc2VuZCBhXG4gICAgICog4oCcd2ViX2FwcF9kYXRh4oCdIHNlcnZpY2UgbWVzc2FnZS4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gdXJsIEFuIEhUVFBTIFVSTCBvZiBhIFdlYiBBcHAgdG8gYmUgb3BlbmVkIHdpdGggYWRkaXRpb25hbCBkYXRhXG4gICAgICovXG4gICAgc3RhdGljIHdlYkFwcCh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKTogS2V5Ym9hcmRCdXR0b24uV2ViQXBwQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgd2ViX2FwcDogeyB1cmwgfSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoZSBjdXJyZW50IGtleWJvYXJkIHBlcnNpc3RlbnQuIFNlZVxuICAgICAqIGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL2tleWJvYXJkI3BlcnNpc3RlbnQta2V5Ym9hcmRzIGZvciBtb3JlXG4gICAgICogZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEtleWJvYXJkcyBhcmUgbm90IHBlcnNpc3RlbnQgYnkgZGVmYXVsdCwgdXNlIHRoaXMgZnVuY3Rpb24gdG8gZW5hYmxlIGl0XG4gICAgICogKHdpdGhvdXQgYW55IHBhcmFtZXRlcnMgb3IgcGFzcyBgdHJ1ZWApLiBQYXNzIGBmYWxzZWAgdG8gZm9yY2UgdGhlXG4gICAgICoga2V5Ym9hcmQgdG8gbm90IHBlcnNpc3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaXNFbmFibGVkIGB0cnVlYCBpZiB0aGUga2V5Ym9hcmQgc2hvdWxkIHBlcnNpc3QsIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHBlcnNpc3RlbnQoaXNFbmFibGVkID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLmlzX3BlcnNpc3RlbnQgPSBpc0VuYWJsZWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoZSBjdXJyZW50IGtleWJvYXJkIHNlbGVjdGl2ZS4gU2VlXG4gICAgICogaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQjc2VsZWN0aXZlbHktc2VuZC1jdXN0b20ta2V5Ym9hcmRzXG4gICAgICogZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEtleWJvYXJkcyBhcmUgbm9uLXNlbGVjdGl2ZSBieSBkZWZhdWx0LCB1c2UgdGhpcyBmdW5jdGlvbiB0byBlbmFibGUgaXRcbiAgICAgKiAod2l0aG91dCBhbnkgcGFyYW1ldGVycyBvciBwYXNzIGB0cnVlYCkuIFBhc3MgYGZhbHNlYCB0byBmb3JjZSB0aGVcbiAgICAgKiBrZXlib2FyZCB0byBiZSBub24tc2VsZWN0aXZlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRW5hYmxlZCBgdHJ1ZWAgaWYgdGhlIGtleWJvYXJkIHNob3VsZCBiZSBzZWxlY3RpdmUsIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHNlbGVjdGVkKGlzRW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RpdmUgPSBpc0VuYWJsZWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoZSBjdXJyZW50IGtleWJvYXJkIG9uZS10aW1lLiBTZWVcbiAgICAgKiBodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9rZXlib2FyZCNvbmUtdGltZS1jdXN0b20ta2V5Ym9hcmRzIGZvclxuICAgICAqIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEtleWJvYXJkcyBhcmUgbm9uLW9uZS10aW1lIGJ5IGRlZmF1bHQsIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGVuYWJsZSBpdFxuICAgICAqICh3aXRob3V0IGFueSBwYXJhbWV0ZXJzIG9yIHBhc3MgYHRydWVgKS4gUGFzcyBgZmFsc2VgIHRvIGZvcmNlIHRoZVxuICAgICAqIGtleWJvYXJkIHRvIGJlIG5vbi1vbmUtdGltZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpc0VuYWJsZWQgYHRydWVgIGlmIHRoZSBrZXlib2FyZCBzaG91bGQgYmUgb25lLXRpbWUsIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAqL1xuICAgIG9uZVRpbWUoaXNFbmFibGVkID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLm9uZV90aW1lX2tleWJvYXJkID0gaXNFbmFibGVkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZSB0aGUgY3VycmVudCBrZXlib2FyZCByZXNpemVkLiBTZWVcbiAgICAgKiBodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9rZXlib2FyZCNyZXNpemUtY3VzdG9tLWtleWJvYXJkIGZvciBtb3JlXG4gICAgICogZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEtleWJvYXJkcyBhcmUgbm9uLXJlc2l6ZWQgYnkgZGVmYXVsdCwgdXNlIHRoaXMgZnVuY3Rpb24gdG8gZW5hYmxlIGl0XG4gICAgICogKHdpdGhvdXQgYW55IHBhcmFtZXRlcnMgb3IgcGFzcyBgdHJ1ZWApLiBQYXNzIGBmYWxzZWAgdG8gZm9yY2UgdGhlXG4gICAgICoga2V5Ym9hcmQgdG8gYmUgbm9uLXJlc2l6ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaXNFbmFibGVkIGB0cnVlYCBpZiB0aGUga2V5Ym9hcmQgc2hvdWxkIGJlIHJlc2l6ZWQsIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHJlc2l6ZWQoaXNFbmFibGVkID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnJlc2l6ZV9rZXlib2FyZCA9IGlzRW5hYmxlZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgY3VycmVudCBrZXlib2FyZCdzIGlucHV0IGZpZWxkIHBsYWNlaG9sZGVyLiBTZWVcbiAgICAgKiBodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9rZXlib2FyZCNpbnB1dC1maWVsZC1wbGFjZWhvbGRlciBmb3IgbW9yZVxuICAgICAqIGRldGFpbHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmFsdWUgVGhlIHBsYWNlaG9sZGVyIHRleHRcbiAgICAgKi9cbiAgICBwbGFjZWhvbGRlcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuaW5wdXRfZmllbGRfcGxhY2Vob2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcga2V5Ym9hcmQgdGhhdCBjb250YWlucyB0aGUgdHJhbnNwb3NlZCBncmlkIG9mIGJ1dHRvbnMgb2ZcbiAgICAgKiB0aGlzIGtleWJvYXJkLiBUaGlzIG1lYW5zIHRoYXQgdGhlIHJlc3VsdGluZyBrZXlib2FyZCBoYXMgdGhlIHJvd3MgYW5kXG4gICAgICogY29sdW1ucyBmbGlwcGVkLlxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IGJ1dHRvbnMgY2FuIG9ubHkgc3BhbiBtdWx0aXBsZSBjb2x1bW5zLCBidXQgbmV2ZXIgbXVsdGlwbGVcbiAgICAgKiByb3dzLiBUaGlzIG1lYW5zIHRoYXQgaWYgdGhlIGdpdmVuIGFycmF5cyBoYXZlIGRpZmZlcmVudCBsZW5ndGhzLCBzb21lXG4gICAgICogYnV0dG9ucyBtaWdodCBmbG93IHVwIGluIHRoZSBsYXlvdXQuIEluIHRoZXNlIGNhc2VzLCB0cmFuc3Bvc2luZyBhXG4gICAgICoga2V5Ym9hcmQgYSBzZWNvbmQgdGltZSB3aWxsIG5vdCB1bmRvIHRoZSBmaXJzdCB0cmFuc3Bvc2l0aW9uLlxuICAgICAqXG4gICAgICogSGVyZSBhcmUgc29tZSBleGFtcGxlcy5cbiAgICAgKlxuICAgICAqIGBgYFxuICAgICAqIG9yaWdpbmFsICAgIHRyYW5zcG9zZWRcbiAgICAgKiBbICBhICBdICB+PiBbICBhICBdXG4gICAgICpcbiAgICAgKiAgICAgICAgICAgICBbICBhICBdXG4gICAgICogW2EgYiBjXSAgfj4gWyAgYiAgXVxuICAgICAqICAgICAgICAgICAgIFsgIGMgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGMgZV1cbiAgICAgKiBbIGMgZCBdICB+PiBbIGIgZCBdXG4gICAgICogWyAgZSAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2EgYyBkXVxuICAgICAqIFsgIGMgIF0gIH4+IFsgYiBlIF1cbiAgICAgKiBbZCBlIGZdICAgICBbICBmICBdXG4gICAgICogYGBgXG4gICAgICovXG4gICAgdG9UcmFuc3Bvc2VkKCkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHRoaXMua2V5Ym9hcmQ7XG4gICAgICAgIGNvbnN0IHRyYW5zcG9zZWQgPSB0cmFuc3Bvc2Uob3JpZ2luYWwpO1xuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSh0cmFuc3Bvc2VkKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBrZXlib2FyZCB3aXRoIHRoZSBzYW1lIGJ1dHRvbnMgYnV0IHJlZmxvd2VkIGludG8gYSBnaXZlblxuICAgICAqIG51bWJlciBvZiBjb2x1bW5zIGFzIGlmIHRoZSBidXR0b25zIHdlcmUgdGV4dCBlbGVtZW50cy4gT3B0aW9uYWxseSwgeW91XG4gICAgICogY2FuIHNwZWNpZnkgaWYgdGhlIGZsb3cgc2hvdWxkIG1ha2Ugc3VyZSB0byBmaWxsIHVwIHRoZSBsYXN0IHJvdy5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGlkZW1wb3RlbnQsIHNvIGNhbGxpbmcgaXQgYSBzZWNvbmQgdGltZSB3aWxsIGVmZmVjdGl2ZWx5XG4gICAgICogY2xvbmUgdGhpcyBrZXlib2FyZCB3aXRob3V0IHJlb3JkZXJpbmcgdGhlIGJ1dHRvbnMuXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzLlxuICAgICAqXG4gICAgICogYGBgXG4gICAgICogb3JpZ2luYWwgICAgZmxvd2VkXG4gICAgICogWyAgYSAgXSAgfj4gWyAgYSAgXSAgICAoNCBjb2x1bW5zKVxuICAgICAqXG4gICAgICogICAgICAgICAgICAgWyAgYSAgXVxuICAgICAqIFthIGIgY10gIH4+IFsgIGIgIF0gICAgKDEgY29sdW1uKVxuICAgICAqICAgICAgICAgICAgIFsgIGMgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGIgY11cbiAgICAgKiBbIGMgZCBdICB+PiBbIGQgZSBdICAgICgzIGNvbHVtbnMpXG4gICAgICogWyAgZSAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2FiY2RlXVxuICAgICAqIFsgIGMgIF0gIH4+IFsgIGYgIF0gICAgKDUgY29sdW1ucylcbiAgICAgKiBbZCBlIGZdXG4gICAgICpcbiAgICAgKiBbYSBiIGNdICAgICBbICBhICBdXG4gICAgICogW2QgZSBmXSAgfj4gW2IgYyBkXSAgICAoMyBjb2x1bXMsIHsgZmlsbExhc3RSb3c6IHRydWUgfSlcbiAgICAgKiBbZyBoIGldICAgICBbZSBmIGddXG4gICAgICogWyAgaiAgXSAgICAgW2ggaSBqXVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbHVtbnMgTWF4aW11bSBudW1iZXIgb2YgYnV0dG9ucyBwZXIgcm93XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgZmxvd2luZyBiZWhhdmlvclxuICAgICAqL1xuICAgIHRvRmxvd2VkKGNvbHVtbnM6IG51bWJlciwgb3B0aW9uczogRmxvd09wdGlvbnMgPSB7fSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHRoaXMua2V5Ym9hcmQ7XG4gICAgICAgIGNvbnN0IGZsb3dlZCA9IHJlZmxvdyhvcmlnaW5hbCwgY29sdW1ucywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKGZsb3dlZCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBkZWVwIGNvcHkgb2YgdGhpcyBrZXlib2FyZC5cbiAgICAgKlxuICAgICAqIE9wdGlvbmFsbHkgdGFrZXMgYSBuZXcgZ3JpZCBvZiBidXR0b25zIHRvIHJlcGxhY2UgdGhlIGN1cnJlbnQgYnV0dG9ucy4gSWZcbiAgICAgKiBzcGVjaWZpZWQsIG9ubHkgdGhlIG9wdGlvbnMgd2lsbCBiZSBjbG9uZWQsIGFuZCB0aGUgZ2l2ZW4gYnV0dG9ucyB3aWxsIGJlXG4gICAgICogdXNlZCBpbnN0ZWFkLlxuICAgICAqL1xuICAgIGNsb25lKGtleWJvYXJkOiBLZXlib2FyZEJ1dHRvbltdW10gPSB0aGlzLmtleWJvYXJkKSB7XG4gICAgICAgIGNvbnN0IGNsb25lID0gbmV3IEtleWJvYXJkKGtleWJvYXJkLm1hcCgocm93KSA9PiByb3cuc2xpY2UoKSkpO1xuICAgICAgICBjbG9uZS5pc19wZXJzaXN0ZW50ID0gdGhpcy5pc19wZXJzaXN0ZW50O1xuICAgICAgICBjbG9uZS5zZWxlY3RpdmUgPSB0aGlzLnNlbGVjdGl2ZTtcbiAgICAgICAgY2xvbmUub25lX3RpbWVfa2V5Ym9hcmQgPSB0aGlzLm9uZV90aW1lX2tleWJvYXJkO1xuICAgICAgICBjbG9uZS5yZXNpemVfa2V5Ym9hcmQgPSB0aGlzLnJlc2l6ZV9rZXlib2FyZDtcbiAgICAgICAgY2xvbmUuaW5wdXRfZmllbGRfcGxhY2Vob2xkZXIgPSB0aGlzLmlucHV0X2ZpZWxkX3BsYWNlaG9sZGVyO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgdGhlIGJ1dHRvbnMgb2YgdGhlIGdpdmVuIGtleWJvYXJkcyB0byB0aGlzIGtleWJvYXJkLiBJZiBvdGhlclxuICAgICAqIG9wdGlvbnMgYXJlIHNwZWNpZmllZCBpbiB0aGVzZSBrZXlib2FyZHMsIHRoZXkgd2lsbCBiZSBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNvdXJjZXMgQSBudW1iZXIgb2Yga2V5Ym9hcmRzIHRvIGFwcGVuZFxuICAgICAqL1xuICAgIGFwcGVuZCguLi5zb3VyY2VzOiBLZXlib2FyZFNvdXJjZVtdKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShzb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZC5wdXNoKC4uLmtleWJvYXJkLmtleWJvYXJkLm1hcCgocm93KSA9PiByb3cuc2xpY2UoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBrZXlib2FyZCB0aGF0IHdhcyBidWlsZC4gTm90ZSB0aGF0IGl0IGRvZXNuJ3QgcmV0dXJuXG4gICAgICogYHJlc2l6ZV9rZXlib2FyZGAgb3Igb3RoZXIgb3B0aW9ucyB0aGF0IG1heSBiZSBzZXQuIFlvdSBkb24ndCB1c3VhbGx5XG4gICAgICogbmVlZCB0byBjYWxsIHRoaXMgbWV0aG9kLiBJdCBpcyBubyBsb25nZXIgdXNlZnVsLlxuICAgICAqL1xuICAgIGJ1aWxkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlib2FyZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHVybnMgYSB0d28tZGltZW5zaW9uYWwga2V5Ym9hcmQgYnV0dG9uIGFycmF5IGludG8gYSBrZXlib2FyZCBpbnN0YW5jZS5cbiAgICAgKiBZb3UgY2FuIHVzZSB0aGUgc3RhdGljIGJ1dHRvbiBidWlsZGVyIG1ldGhvZHMgdG8gY3JlYXRlIGtleWJvYXJkIGJ1dHRvblxuICAgICAqIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc291cmNlIEEgdHdvLWRpbWVuc2lvbmFsIGJ1dHRvbiBhcnJheVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tKHNvdXJjZTogS2V5Ym9hcmRTb3VyY2UpOiBLZXlib2FyZCB7XG4gICAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBLZXlib2FyZCkgcmV0dXJuIHNvdXJjZS5jbG9uZSgpO1xuICAgICAgICBmdW5jdGlvbiB0b0J1dHRvbihidG46IEtleWJvYXJkQnV0dG9uU291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGJ0biA9PT0gXCJzdHJpbmdcIiA/IEtleWJvYXJkLnRleHQoYnRuKSA6IGJ0bjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEtleWJvYXJkKHNvdXJjZS5tYXAoKHJvdykgPT4gcm93Lm1hcCh0b0J1dHRvbikpKTtcbiAgICB9XG59XG5cbnR5cGUgSW5saW5lS2V5Ym9hcmRTb3VyY2UgPSBJbmxpbmVLZXlib2FyZEJ1dHRvbltdW10gfCBJbmxpbmVLZXlib2FyZDtcbi8qKlxuICogVXNlIHRoaXMgY2xhc3MgdG8gc2ltcGxpZnkgYnVpbGRpbmcgYW4gaW5saW5lIGtleWJvYXJkIChzb21ldGhpbmcgbGlrZSB0aGlzOlxuICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2ZlYXR1cmVzI2lubGluZS1rZXlib2FyZHMpLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBCdWlsZCBhbiBpbmxpbmUga2V5Ym9hcmQ6XG4gKiBjb25zdCBrZXlib2FyZCA9IG5ldyBJbmxpbmVLZXlib2FyZCgpXG4gKiAgIC50ZXh0KCdBJykudGV4dCgnQicsICdjYWxsYmFjay1kYXRhJykucm93KClcbiAqICAgLnRleHQoJ0MnKS50ZXh0KCdEJykucm93KClcbiAqICAgLnVybCgnVGVsZWdyYW0nLCAndGVsZWdyYW0ub3JnJylcbiAqXG4gKiAvLyBTZW5kIHRoZSBrZXlib2FyZDpcbiAqIGF3YWl0IGN0eC5yZXBseSgnSGVyZSBpcyB5b3VyIGlubGluZSBrZXlib2FyZCEnLCB7XG4gKiAgIHJlcGx5X21hcmt1cDoga2V5Ym9hcmRcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBJZiB5b3UgYWxyZWFkeSBoYXZlIHNvbWUgc291cmNlIGRhdGEgd2hpY2ggeW91IHdvdWxkIGxpa2UgdG8gdHVybiBpbnRvIGFuXG4gKiBpbmxpbmUgYnV0dG9uIG9iamVjdCwgeW91IGNhbiB1c2UgdGhlIHN0YXRpYyBlcXVpdmFsZW50cyB3aGljaCBldmVyeSBpbmxpbmVcbiAqIGJ1dHRvbiBoYXMuIFlvdSBjYW4gdXNlIHRoZW0gdG8gY3JlYXRlIGEgdHdvLWRpbWVuc2lvbmFsIGlubGluZSBidXR0b24gYXJyYXkuXG4gKiBUaGUgcmVzdWx0aW5nIGFycmF5IGNhbiBiZSB0dXJuZWQgaW50byBhIGtleWJvYXJkIGluc3RhbmNlLlxuICpcbiAqIGBgYHRzXG4gKiBjb25zdCBidXR0b24gPSBJbmxpbmVLZXlib2FyZC50ZXh0KCdHTycsICdnbycpXG4gKiBjb25zdCBhcnJheSA9IFtbYnV0dG9uXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gSW5saW5lS2V5Ym9hcmQuZnJvbShhcnJheSlcbiAqIGBgYFxuICpcbiAqIEJlIHN1cmUgdG8gdG8gY2hlY2sgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQjaW5saW5lLWtleWJvYXJkcykgb25cbiAqIGlubGluZSBrZXlib2FyZHMgaW4gZ3JhbW1ZLlxuICovXG5leHBvcnQgY2xhc3MgSW5saW5lS2V5Ym9hcmQge1xuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYSBuZXcgYElubGluZUtleWJvYXJkYCB3aXRoIGFuIG9wdGlvbmFsIHR3by1kaW1lbnNpb25hbCBhcnJheVxuICAgICAqIG9mIGBJbmxpbmVLZXlib2FyZEJ1dHRvbmAgb2JqZWN0cy4gVGhpcyBpcyB0aGUgbmVzdGVkIGFycmF5IHRoYXQgaG9sZHNcbiAgICAgKiB0aGUgaW5saW5lIGtleWJvYXJkLiBJdCB3aWxsIGJlIGV4dGVuZGVkIGV2ZXJ5IHRpbWUgeW91IGNhbGwgb25lIG9mIHRoZVxuICAgICAqIHByb3ZpZGVkIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5saW5lX2tleWJvYXJkIEFuIG9wdGlvbmFsIGluaXRpYWwgdHdvLWRpbWVuc2lvbmFsIGJ1dHRvbiBhcnJheVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaW5saW5lX2tleWJvYXJkOiBJbmxpbmVLZXlib2FyZEJ1dHRvbltdW10gPSBbW11dLFxuICAgICkge31cbiAgICAvKipcbiAgICAgKiBBbGxvd3MgeW91IHRvIGFkZCB5b3VyIG93biBgSW5saW5lS2V5Ym9hcmRCdXR0b25gIG9iamVjdHMgaWYgeW91IGFscmVhZHlcbiAgICAgKiBoYXZlIHRoZW0gZm9yIHNvbWUgcmVhc29uLiBZb3UgbW9zdCBsaWtlbHkgd2FudCB0byBjYWxsIG9uZSBvZiB0aGUgb3RoZXJcbiAgICAgKiBtZXRob2RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1dHRvbnMgVGhlIGJ1dHRvbnMgdG8gYWRkXG4gICAgICovXG4gICAgYWRkKC4uLmJ1dHRvbnM6IElubGluZUtleWJvYXJkQnV0dG9uW10pIHtcbiAgICAgICAgdGhpcy5pbmxpbmVfa2V5Ym9hcmRbdGhpcy5pbmxpbmVfa2V5Ym9hcmQubGVuZ3RoIC0gMV0/LnB1c2goLi4uYnV0dG9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgJ2xpbmUgYnJlYWsnLiBDYWxsIHRoaXMgbWV0aG9kIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBuZXh0IGFkZGVkXG4gICAgICogYnV0dG9ucyB3aWxsIGJlIG9uIGEgbmV3IHJvdy5cbiAgICAgKlxuICAgICAqIFlvdSBtYXkgcGFzcyBhIG51bWJlciBvZiBgSW5saW5lS2V5Ym9hcmRCdXR0b25gIG9iamVjdHMgaWYgeW91IGFscmVhZHlcbiAgICAgKiBoYXZlIHRoZSBpbnN0YW5jZXMgZm9yIHNvbWUgcmVhc29uLiBZb3UgbW9zdCBsaWtlbHkgZG9uJ3Qgd2FudCB0byBwYXNzXG4gICAgICogYW55IGFyZ3VtZW50cyB0byBgcm93YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zIEEgbnVtYmVyIG9mIGJ1dHRvbnMgdG8gYWRkIHRvIHRoZSBuZXh0IHJvd1xuICAgICAqL1xuICAgIHJvdyguLi5idXR0b25zOiBJbmxpbmVLZXlib2FyZEJ1dHRvbltdKSB7XG4gICAgICAgIHRoaXMuaW5saW5lX2tleWJvYXJkLnB1c2goYnV0dG9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IFVSTCBidXR0b24uIFRlbGVncmFtIGNsaWVudHMgd2lsbCBvcGVuIHRoZSBwcm92aWRlZCBVUkwgd2hlblxuICAgICAqIHRoZSBidXR0b24gaXMgcHJlc3NlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gdXJsIEhUVFAgb3IgdGc6Ly8gdXJsIHRvIGJlIG9wZW5lZCB3aGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZC4gTGlua3MgdGc6Ly91c2VyP2lkPTx1c2VyX2lkPiBjYW4gYmUgdXNlZCB0byBtZW50aW9uIGEgdXNlciBieSB0aGVpciBJRCB3aXRob3V0IHVzaW5nIGEgdXNlcm5hbWUsIGlmIHRoaXMgaXMgYWxsb3dlZCBieSB0aGVpciBwcml2YWN5IHNldHRpbmdzLlxuICAgICAqL1xuICAgIHVybCh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC51cmwodGV4dCwgdXJsKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgVVJMIGJ1dHRvbi4gVGVsZWdyYW0gY2xpZW50cyB3aWxsIG9wZW4gdGhlIHByb3ZpZGVkIFVSTFxuICAgICAqIHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSB1cmwgSFRUUCBvciB0ZzovLyB1cmwgdG8gYmUgb3BlbmVkIHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBMaW5rcyB0ZzovL3VzZXI/aWQ9PHVzZXJfaWQ+IGNhbiBiZSB1c2VkIHRvIG1lbnRpb24gYSB1c2VyIGJ5IHRoZWlyIElEIHdpdGhvdXQgdXNpbmcgYSB1c2VybmFtZSwgaWYgdGhpcyBpcyBhbGxvd2VkIGJ5IHRoZWlyIHByaXZhY3kgc2V0dGluZ3MuXG4gICAgICovXG4gICAgc3RhdGljIHVybCh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKTogSW5saW5lS2V5Ym9hcmRCdXR0b24uVXJsQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgdXJsIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY2FsbGJhY2sgcXVlcnkgYnV0dG9uLiBUaGUgYnV0dG9uIGNvbnRhaW5zIGEgdGV4dCBhbmQgYSBjdXN0b21cbiAgICAgKiBwYXlsb2FkLiBUaGlzIHBheWxvYWQgd2lsbCBiZSBzZW50IGJhY2sgdG8geW91ciBib3Qgd2hlbiB0aGUgYnV0dG9uIGlzXG4gICAgICogcHJlc3NlZC4gSWYgeW91IG9taXQgdGhlIHBheWxvYWQsIHRoZSBkaXNwbGF5IHRleHQgd2lsbCBiZSBzZW50IGJhY2sgdG9cbiAgICAgKiB5b3VyIGJvdC5cbiAgICAgKlxuICAgICAqIFlvdXIgYm90IHdpbGwgcmVjZWl2ZSBhbiB1cGRhdGUgZXZlcnkgdGltZSBhIHVzZXIgcHJlc3NlcyBhbnkgb2YgdGhlIHRleHRcbiAgICAgKiBidXR0b25zLiBZb3UgY2FuIGxpc3RlbiB0byB0aGVzZSB1cGRhdGVzIGxpa2UgdGhpczpcbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFNwZWNpZmljIGJ1dHRvbnM6XG4gICAgICogYm90LmNhbGxiYWNrUXVlcnkoJ2J1dHRvbi1kYXRhJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogLy8gQW55IGJ1dHRvbiBvZiBhbnkgaW5saW5lIGtleWJvYXJkOlxuICAgICAqIGJvdC5vbignY2FsbGJhY2tfcXVlcnk6ZGF0YScsICAgIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSBkYXRhIFRoZSBjYWxsYmFjayBkYXRhIHRvIHNlbmQgYmFjayB0byB5b3VyIGJvdCAoZGVmYXVsdCA9IHRleHQpXG4gICAgICovXG4gICAgdGV4dCh0ZXh0OiBzdHJpbmcsIGRhdGEgPSB0ZXh0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC50ZXh0KHRleHQsIGRhdGEpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBjYWxsYmFjayBxdWVyeSBidXR0b24uIFRoZSBidXR0b24gY29udGFpbnMgYSB0ZXh0IGFuZCBhXG4gICAgICogY3VzdG9tIHBheWxvYWQuIFRoaXMgcGF5bG9hZCB3aWxsIGJlIHNlbnQgYmFjayB0byB5b3VyIGJvdCB3aGVuIHRoZVxuICAgICAqIGJ1dHRvbiBpcyBwcmVzc2VkLiBJZiB5b3Ugb21pdCB0aGUgcGF5bG9hZCwgdGhlIGRpc3BsYXkgdGV4dCB3aWxsIGJlIHNlbnRcbiAgICAgKiBiYWNrIHRvIHlvdXIgYm90LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCByZWNlaXZlIGFuIHVwZGF0ZSBldmVyeSB0aW1lIGEgdXNlciBwcmVzc2VzIGFueSBvZiB0aGUgdGV4dFxuICAgICAqIGJ1dHRvbnMuIFlvdSBjYW4gbGlzdGVuIHRvIHRoZXNlIHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gU3BlY2lmaWMgYnV0dG9uczpcbiAgICAgKiBib3QuY2FsbGJhY2tRdWVyeSgnYnV0dG9uLWRhdGEnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiAvLyBBbnkgYnV0dG9uIG9mIGFueSBpbmxpbmUga2V5Ym9hcmQ6XG4gICAgICogYm90Lm9uKCdjYWxsYmFja19xdWVyeTpkYXRhJywgICAgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIGRhdGEgVGhlIGNhbGxiYWNrIGRhdGEgdG8gc2VuZCBiYWNrIHRvIHlvdXIgYm90IChkZWZhdWx0ID0gdGV4dClcbiAgICAgKi9cbiAgICBzdGF0aWMgdGV4dChcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBkYXRhID0gdGV4dCxcbiAgICApOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5DYWxsYmFja0J1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIGNhbGxiYWNrX2RhdGE6IGRhdGEgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyB3ZWIgYXBwIGJ1dHRvbiwgY29uZmVyIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy93ZWJhcHBzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHVybCBBbiBIVFRQUyBVUkwgb2YgYSBXZWIgQXBwIHRvIGJlIG9wZW5lZCB3aXRoIGFkZGl0aW9uYWwgZGF0YVxuICAgICAqL1xuICAgIHdlYkFwcCh0ZXh0OiBzdHJpbmcsIHVybDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC53ZWJBcHAodGV4dCwgdXJsKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgd2ViIGFwcCBidXR0b24sIGNvbmZlciBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvd2ViYXBwc1xuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSB1cmwgQW4gSFRUUFMgVVJMIG9mIGEgV2ViIEFwcCB0byBiZSBvcGVuZWQgd2l0aCBhZGRpdGlvbmFsIGRhdGFcbiAgICAgKi9cbiAgICBzdGF0aWMgd2ViQXBwKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHVybDogc3RyaW5nLFxuICAgICk6IElubGluZUtleWJvYXJkQnV0dG9uLldlYkFwcEJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHdlYl9hcHA6IHsgdXJsIH0gfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBsb2dpbiBidXR0b24uIFRoaXMgY2FuIGJlIHVzZWQgYXMgYSByZXBsYWNlbWVudCBmb3IgdGhlXG4gICAgICogVGVsZWdyYW0gTG9naW4gV2lkZ2V0LiBZb3UgbXVzdCBzcGVjaWZ5IGFuIEhUVFBTIFVSTCB1c2VkIHRvXG4gICAgICogYXV0b21hdGljYWxseSBhdXRob3JpemUgdGhlIHVzZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIGxvZ2luVXJsIFRoZSBsb2dpbiBVUkwgYXMgc3RyaW5nIG9yIGBMb2dpblVybGAgb2JqZWN0XG4gICAgICovXG4gICAgbG9naW4odGV4dDogc3RyaW5nLCBsb2dpblVybDogc3RyaW5nIHwgTG9naW5VcmwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLmxvZ2luKHRleHQsIGxvZ2luVXJsKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgbG9naW4gYnV0dG9uLiBUaGlzIGNhbiBiZSB1c2VkIGFzIGEgcmVwbGFjZW1lbnQgZm9yIHRoZVxuICAgICAqIFRlbGVncmFtIExvZ2luIFdpZGdldC4gWW91IG11c3Qgc3BlY2lmeSBhbiBIVFRQUyBVUkwgdXNlZCB0b1xuICAgICAqIGF1dG9tYXRpY2FsbHkgYXV0aG9yaXplIHRoZSB1c2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSBsb2dpblVybCBUaGUgbG9naW4gVVJMIGFzIHN0cmluZyBvciBgTG9naW5VcmxgIG9iamVjdFxuICAgICAqL1xuICAgIHN0YXRpYyBsb2dpbihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBsb2dpblVybDogc3RyaW5nIHwgTG9naW5VcmwsXG4gICAgKTogSW5saW5lS2V5Ym9hcmRCdXR0b24uTG9naW5CdXR0b24ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIGxvZ2luX3VybDogdHlwZW9mIGxvZ2luVXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyB7IHVybDogbG9naW5VcmwgfVxuICAgICAgICAgICAgICAgIDogbG9naW5VcmwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgaW5saW5lIHF1ZXJ5IGJ1dHRvbi4gVGVsZWdyYW0gY2xpZW50cyB3aWxsIGxldCB0aGUgdXNlciBwaWNrIGFcbiAgICAgKiBjaGF0IHdoZW4gdGhpcyBidXR0b24gaXMgcHJlc3NlZC4gVGhpcyB3aWxsIHN0YXJ0IGFuIGlubGluZSBxdWVyeS4gVGhlXG4gICAgICogc2VsZWN0ZWQgY2hhdCB3aWxsIGJlIHByZWZpbGxlZCB3aXRoIHRoZSBuYW1lIG9mIHlvdXIgYm90LiBZb3UgbWF5XG4gICAgICogcHJvdmlkZSBhIHRleHQgdGhhdCBpcyBzcGVjaWZpZWQgYWxvbmcgd2l0aCBpdC5cbiAgICAgKlxuICAgICAqIFlvdXIgYm90IHdpbGwgaW4gdHVybiByZWNlaXZlIHVwZGF0ZXMgZm9yIGlubGluZSBxdWVyaWVzLiBZb3UgY2FuIGxpc3RlblxuICAgICAqIHRvIGlubGluZSBxdWVyeSB1cGRhdGVzIGxpa2UgdGhpczpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignaW5saW5lX3F1ZXJ5JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHF1ZXJ5IFRoZSAob3B0aW9uYWwpIGlubGluZSBxdWVyeSBzdHJpbmcgdG8gcHJlZmlsbFxuICAgICAqL1xuICAgIHN3aXRjaElubGluZSh0ZXh0OiBzdHJpbmcsIHF1ZXJ5ID0gXCJcIikge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoSW5saW5lS2V5Ym9hcmQuc3dpdGNoSW5saW5lKHRleHQsIHF1ZXJ5KSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5saW5lIHF1ZXJ5IGJ1dHRvbi4gVGVsZWdyYW0gY2xpZW50cyB3aWxsIGxldCB0aGUgdXNlciBwaWNrIGFcbiAgICAgKiBjaGF0IHdoZW4gdGhpcyBidXR0b24gaXMgcHJlc3NlZC4gVGhpcyB3aWxsIHN0YXJ0IGFuIGlubGluZSBxdWVyeS4gVGhlXG4gICAgICogc2VsZWN0ZWQgY2hhdCB3aWxsIGJlIHByZWZpbGxlZCB3aXRoIHRoZSBuYW1lIG9mIHlvdXIgYm90LiBZb3UgbWF5XG4gICAgICogcHJvdmlkZSBhIHRleHQgdGhhdCBpcyBzcGVjaWZpZWQgYWxvbmcgd2l0aCBpdC5cbiAgICAgKlxuICAgICAqIFlvdXIgYm90IHdpbGwgaW4gdHVybiByZWNlaXZlIHVwZGF0ZXMgZm9yIGlubGluZSBxdWVyaWVzLiBZb3UgY2FuIGxpc3RlblxuICAgICAqIHRvIGlubGluZSBxdWVyeSB1cGRhdGVzIGxpa2UgdGhpczpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignaW5saW5lX3F1ZXJ5JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHF1ZXJ5IFRoZSAob3B0aW9uYWwpIGlubGluZSBxdWVyeSBzdHJpbmcgdG8gcHJlZmlsbFxuICAgICAqL1xuICAgIHN0YXRpYyBzd2l0Y2hJbmxpbmUoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcXVlcnkgPSBcIlwiLFxuICAgICk6IElubGluZUtleWJvYXJkQnV0dG9uLlN3aXRjaElubGluZUJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHN3aXRjaF9pbmxpbmVfcXVlcnk6IHF1ZXJ5IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgaW5saW5lIHF1ZXJ5IGJ1dHRvbiB0aGF0IGFjdHMgb24gdGhlIGN1cnJlbnQgY2hhdC4gVGhlXG4gICAgICogc2VsZWN0ZWQgY2hhdCB3aWxsIGJlIHByZWZpbGxlZCB3aXRoIHRoZSBuYW1lIG9mIHlvdXIgYm90LiBZb3UgbWF5XG4gICAgICogcHJvdmlkZSBhIHRleHQgdGhhdCBpcyBzcGVjaWZpZWQgYWxvbmcgd2l0aCBpdC4gVGhpcyB3aWxsIHN0YXJ0IGFuIGlubGluZVxuICAgICAqIHF1ZXJ5LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCBpbiB0dXJuIHJlY2VpdmUgdXBkYXRlcyBmb3IgaW5saW5lIHF1ZXJpZXMuIFlvdSBjYW4gbGlzdGVuXG4gICAgICogdG8gaW5saW5lIHF1ZXJ5IHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdpbmxpbmVfcXVlcnknLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcXVlcnkgVGhlIChvcHRpb25hbCkgaW5saW5lIHF1ZXJ5IHN0cmluZyB0byBwcmVmaWxsXG4gICAgICovXG4gICAgc3dpdGNoSW5saW5lQ3VycmVudCh0ZXh0OiBzdHJpbmcsIHF1ZXJ5ID0gXCJcIikge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoSW5saW5lS2V5Ym9hcmQuc3dpdGNoSW5saW5lQ3VycmVudCh0ZXh0LCBxdWVyeSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGlubGluZSBxdWVyeSBidXR0b24gdGhhdCBhY3RzIG9uIHRoZSBjdXJyZW50IGNoYXQuIFRoZVxuICAgICAqIHNlbGVjdGVkIGNoYXQgd2lsbCBiZSBwcmVmaWxsZWQgd2l0aCB0aGUgbmFtZSBvZiB5b3VyIGJvdC4gWW91IG1heVxuICAgICAqIHByb3ZpZGUgYSB0ZXh0IHRoYXQgaXMgc3BlY2lmaWVkIGFsb25nIHdpdGggaXQuIFRoaXMgd2lsbCBzdGFydCBhbiBpbmxpbmVcbiAgICAgKiBxdWVyeS5cbiAgICAgKlxuICAgICAqIFlvdXIgYm90IHdpbGwgaW4gdHVybiByZWNlaXZlIHVwZGF0ZXMgZm9yIGlubGluZSBxdWVyaWVzLiBZb3UgY2FuIGxpc3RlblxuICAgICAqIHRvIGlubGluZSBxdWVyeSB1cGRhdGVzIGxpa2UgdGhpczpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignaW5saW5lX3F1ZXJ5JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHF1ZXJ5IFRoZSAob3B0aW9uYWwpIGlubGluZSBxdWVyeSBzdHJpbmcgdG8gcHJlZmlsbFxuICAgICAqL1xuICAgIHN0YXRpYyBzd2l0Y2hJbmxpbmVDdXJyZW50KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5ID0gXCJcIixcbiAgICApOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5Td2l0Y2hJbmxpbmVDdXJyZW50Q2hhdEJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHN3aXRjaF9pbmxpbmVfcXVlcnlfY3VycmVudF9jaGF0OiBxdWVyeSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGlubGluZSBxdWVyeSBidXR0b24uIFRlbGVncmFtIGNsaWVudHMgd2lsbCBsZXQgdGhlIHVzZXIgcGljayBhXG4gICAgICogY2hhdCB3aGVuIHRoaXMgYnV0dG9uIGlzIHByZXNzZWQuIFRoaXMgd2lsbCBzdGFydCBhbiBpbmxpbmUgcXVlcnkuIFRoZVxuICAgICAqIHNlbGVjdGVkIGNoYXQgd2lsbCBiZSBwcmVmaWxsZWQgd2l0aCB0aGUgbmFtZSBvZiB5b3VyIGJvdC4gWW91IG1heVxuICAgICAqIHByb3ZpZGUgYSB0ZXh0IHRoYXQgaXMgc3BlY2lmaWVkIGFsb25nIHdpdGggaXQuXG4gICAgICpcbiAgICAgKiBZb3VyIGJvdCB3aWxsIGluIHR1cm4gcmVjZWl2ZSB1cGRhdGVzIGZvciBpbmxpbmUgcXVlcmllcy4gWW91IGNhbiBsaXN0ZW5cbiAgICAgKiB0byBpbmxpbmUgcXVlcnkgdXBkYXRlcyBsaWtlIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiBib3Qub24oJ2lubGluZV9xdWVyeScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSBxdWVyeSBUaGUgcXVlcnkgb2JqZWN0IGRlc2NyaWJpbmcgd2hpY2ggY2hhdHMgY2FuIGJlIHBpY2tlZFxuICAgICAqL1xuICAgIHN3aXRjaElubGluZUNob3NlbihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBxdWVyeTogU3dpdGNoSW5saW5lUXVlcnlDaG9zZW5DaGF0ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC5zd2l0Y2hJbmxpbmVDaG9zZW4odGV4dCwgcXVlcnkpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBpbmxpbmUgcXVlcnkgYnV0dG9uLiBUZWxlZ3JhbSBjbGllbnRzIHdpbGwgbGV0IHRoZSB1c2VyIHBpY2sgYVxuICAgICAqIGNoYXQgd2hlbiB0aGlzIGJ1dHRvbiBpcyBwcmVzc2VkLiBUaGlzIHdpbGwgc3RhcnQgYW4gaW5saW5lIHF1ZXJ5LiBUaGVcbiAgICAgKiBzZWxlY3RlZCBjaGF0IHdpbGwgYmUgcHJlZmlsbGVkIHdpdGggdGhlIG5hbWUgb2YgeW91ciBib3QuIFlvdSBtYXlcbiAgICAgKiBwcm92aWRlIGEgdGV4dCB0aGF0IGlzIHNwZWNpZmllZCBhbG9uZyB3aXRoIGl0LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCBpbiB0dXJuIHJlY2VpdmUgdXBkYXRlcyBmb3IgaW5saW5lIHF1ZXJpZXMuIFlvdSBjYW4gbGlzdGVuXG4gICAgICogdG8gaW5saW5lIHF1ZXJ5IHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdpbmxpbmVfcXVlcnknLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcXVlcnkgVGhlIHF1ZXJ5IG9iamVjdCBkZXNjcmliaW5nIHdoaWNoIGNoYXRzIGNhbiBiZSBwaWNrZWRcbiAgICAgKi9cbiAgICBzdGF0aWMgc3dpdGNoSW5saW5lQ2hvc2VuKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5OiBTd2l0Y2hJbmxpbmVRdWVyeUNob3NlbkNoYXQgPSB7fSxcbiAgICApOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5Td2l0Y2hJbmxpbmVDaG9zZW5DaGF0QnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgc3dpdGNoX2lubGluZV9xdWVyeV9jaG9zZW5fY2hhdDogcXVlcnkgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBnYW1lIHF1ZXJ5IGJ1dHRvbiwgY29uZmVyXG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnYW1lc1xuICAgICAqXG4gICAgICogVGhpcyB0eXBlIG9mIGJ1dHRvbiBtdXN0IGFsd2F5cyBiZSB0aGUgZmlyc3QgYnV0dG9uIGluIHRoZSBmaXJzdCByb3cuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICovXG4gICAgZ2FtZSh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLmdhbWUodGV4dCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGdhbWUgcXVlcnkgYnV0dG9uLCBjb25mZXJcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dhbWVzXG4gICAgICpcbiAgICAgKiBUaGlzIHR5cGUgb2YgYnV0dG9uIG11c3QgYWx3YXlzIGJlIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIGZpcnN0IHJvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2FtZSh0ZXh0OiBzdHJpbmcpOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5HYW1lQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgY2FsbGJhY2tfZ2FtZToge30gfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBwYXltZW50IGJ1dHRvbiwgY29uZmVyXG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwYXltZW50c1xuICAgICAqXG4gICAgICogVGhpcyB0eXBlIG9mIGJ1dHRvbiBtdXN0IGFsd2F5cyBiZSB0aGUgZmlyc3QgYnV0dG9uIGluIHRoZSBmaXJzdCByb3cgYW5kXG4gICAgICogY2FuIG9ubHkgYmUgdXNlZCBpbiBpbnZvaWNlIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheS4gU3Vic3RyaW5ncyDigJzirZDigJ0gYW5kIOKAnFhUUuKAnSBpbiB0aGUgYnV0dG9ucydzIHRleHQgd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgVGVsZWdyYW0gU3RhciBpY29uLlxuICAgICAqL1xuICAgIHBheSh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLnBheSh0ZXh0KSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldyBwYXltZW50IGJ1dHRvbiwgY29uZmVyXG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwYXltZW50c1xuICAgICAqXG4gICAgICogVGhpcyB0eXBlIG9mIGJ1dHRvbiBtdXN0IGFsd2F5cyBiZSB0aGUgZmlyc3QgYnV0dG9uIGluIHRoZSBmaXJzdCByb3cgYW5kXG4gICAgICogY2FuIG9ubHkgYmUgdXNlZCBpbiBpbnZvaWNlIG1lc3NhZ2VzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheS4gU3Vic3RyaW5ncyDigJzirZDigJ0gYW5kIOKAnFhUUuKAnSBpbiB0aGUgYnV0dG9ucydzIHRleHQgd2lsbCBiZSByZXBsYWNlZCB3aXRoIGEgVGVsZWdyYW0gU3RhciBpY29uLlxuICAgICAqL1xuICAgIHN0YXRpYyBwYXkodGV4dDogc3RyaW5nKTogSW5saW5lS2V5Ym9hcmRCdXR0b24uUGF5QnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgcGF5OiB0cnVlIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5saW5lIGtleWJvYXJkIHRoYXQgY29udGFpbnMgdGhlIHRyYW5zcG9zZWQgZ3JpZCBvZlxuICAgICAqIGJ1dHRvbnMgb2YgdGhpcyBpbmxpbmUga2V5Ym9hcmQuIFRoaXMgbWVhbnMgdGhhdCB0aGUgcmVzdWx0aW5nIGlubGluZVxuICAgICAqIGtleWJvYXJkIGhhcyB0aGUgcm93cyBhbmQgY29sdW1ucyBmbGlwcGVkLlxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IGlubGluZSBidXR0b25zIGNhbiBvbmx5IHNwYW4gbXVsdGlwbGUgY29sdW1ucywgYnV0IG5ldmVyXG4gICAgICogbXVsdGlwbGUgcm93cy4gVGhpcyBtZWFucyB0aGF0IGlmIHRoZSBnaXZlbiBhcnJheXMgaGF2ZSBkaWZmZXJlbnRcbiAgICAgKiBsZW5ndGhzLCBzb21lIGJ1dHRvbnMgbWlnaHQgZmxvdyB1cCBpbiB0aGUgbGF5b3V0LiBJbiB0aGVzZSBjYXNlcyxcbiAgICAgKiB0cmFuc3Bvc2luZyBhbiBpbmxpbmUga2V5Ym9hcmQgYSBzZWNvbmQgdGltZSB3aWxsIG5vdCB1bmRvIHRoZSBmaXJzdFxuICAgICAqIHRyYW5zcG9zaXRpb24uXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzLlxuICAgICAqXG4gICAgICogYGBgXG4gICAgICogb3JpZ2luYWwgICAgdHJhbnNwb3NlZFxuICAgICAqIFsgIGEgIF0gIH4+IFsgIGEgIF1cbiAgICAgKlxuICAgICAqICAgICAgICAgICAgIFsgIGEgIF1cbiAgICAgKiBbYSBiIGNdICB+PiBbICBiICBdXG4gICAgICogICAgICAgICAgICAgWyAgYyAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2EgYyBlXVxuICAgICAqIFsgYyBkIF0gIH4+IFsgYiBkIF1cbiAgICAgKiBbICBlICBdXG4gICAgICpcbiAgICAgKiBbIGEgYiBdICAgICBbYSBjIGRdXG4gICAgICogWyAgYyAgXSAgfj4gWyBiIGUgXVxuICAgICAqIFtkIGUgZl0gICAgIFsgIGYgIF1cbiAgICAgKiBgYGBcbiAgICAgKi9cbiAgICB0b1RyYW5zcG9zZWQoKSB7XG4gICAgICAgIGNvbnN0IG9yaWdpbmFsID0gdGhpcy5pbmxpbmVfa2V5Ym9hcmQ7XG4gICAgICAgIGNvbnN0IHRyYW5zcG9zZWQgPSB0cmFuc3Bvc2Uob3JpZ2luYWwpO1xuICAgICAgICByZXR1cm4gbmV3IElubGluZUtleWJvYXJkKHRyYW5zcG9zZWQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGlubGluZSBrZXlib2FyZCB3aXRoIHRoZSBzYW1lIGJ1dHRvbnMgYnV0IHJlZmxvd2VkIGludG8gYVxuICAgICAqIGdpdmVuIG51bWJlciBvZiBjb2x1bW5zIGFzIGlmIHRoZSBidXR0b25zIHdlcmUgdGV4dCBlbGVtZW50cy4gT3B0aW9uYWxseSxcbiAgICAgKiB5b3UgY2FuIHNwZWNpZnkgaWYgdGhlIGZsb3cgc2hvdWxkIG1ha2Ugc3VyZSB0byBmaWxsIHVwIHRoZSBsYXN0IHJvdy5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGlkZW1wb3RlbnQsIHNvIGNhbGxpbmcgaXQgYSBzZWNvbmQgdGltZSB3aWxsIGVmZmVjdGl2ZWx5XG4gICAgICogY2xvbmUgdGhpcyBpbmxpbmUga2V5Ym9hcmQgd2l0aG91dCByZW9yZGVyaW5nIHRoZSBidXR0b25zLlxuICAgICAqXG4gICAgICogSGVyZSBhcmUgc29tZSBleGFtcGxlcy5cbiAgICAgKlxuICAgICAqIGBgYFxuICAgICAqIG9yaWdpbmFsICAgIGZsb3dlZFxuICAgICAqIFsgIGEgIF0gIH4+IFsgIGEgIF0gICAgKDQgY29sdW1ucylcbiAgICAgKlxuICAgICAqICAgICAgICAgICAgIFsgIGEgIF1cbiAgICAgKiBbYSBiIGNdICB+PiBbICBiICBdICAgICgxIGNvbHVtbilcbiAgICAgKiAgICAgICAgICAgICBbICBjICBdXG4gICAgICpcbiAgICAgKiBbIGEgYiBdICAgICBbYSBiIGNdXG4gICAgICogWyBjIGQgXSAgfj4gWyBkIGUgXSAgICAoMyBjb2x1bW5zKVxuICAgICAqIFsgIGUgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthYmNkZV1cbiAgICAgKiBbICBjICBdICB+PiBbICBmICBdICAgICg1IGNvbHVtbnMpXG4gICAgICogW2QgZSBmXVxuICAgICAqXG4gICAgICogW2EgYiBjXSAgICAgWyAgYSAgXVxuICAgICAqIFtkIGUgZl0gIH4+IFtiIGMgZF0gICAgKDMgY29sdW1zLCB7IGZpbGxMYXN0Um93OiB0cnVlIH0pXG4gICAgICogW2cgaCBpXSAgICAgW2UgZiBnXVxuICAgICAqIFsgIGogIF0gICAgIFtoIGkgal1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb2x1bW5zIE1heGltdW0gbnVtYmVyIG9mIGJ1dHRvbnMgcGVyIHJvd1xuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbmFsIGZsb3dpbmcgYmVoYXZpb3JcbiAgICAgKi9cbiAgICB0b0Zsb3dlZChjb2x1bW5zOiBudW1iZXIsIG9wdGlvbnM6IEZsb3dPcHRpb25zID0ge30pIHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWwgPSB0aGlzLmlubGluZV9rZXlib2FyZDtcbiAgICAgICAgY29uc3QgZmxvd2VkID0gcmVmbG93KG9yaWdpbmFsLCBjb2x1bW5zLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIG5ldyBJbmxpbmVLZXlib2FyZChmbG93ZWQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgZGVlcCBjb3B5IG9mIHRoaXMgaW5saW5lIGtleWJvYXJkLlxuICAgICAqL1xuICAgIGNsb25lKCkge1xuICAgICAgICByZXR1cm4gbmV3IElubGluZUtleWJvYXJkKFxuICAgICAgICAgICAgdGhpcy5pbmxpbmVfa2V5Ym9hcmQubWFwKChyb3cpID0+IHJvdy5zbGljZSgpKSxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXBwZW5kcyB0aGUgYnV0dG9ucyBvZiB0aGUgZ2l2ZW4gaW5saW5lIGtleWJvYXJkcyB0byB0aGlzIGtleWJvYXJkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNvdXJjZXMgQSBudW1iZXIgb2YgaW5saW5lIGtleWJvYXJkcyB0byBhcHBlbmRcbiAgICAgKi9cbiAgICBhcHBlbmQoLi4uc291cmNlczogSW5saW5lS2V5Ym9hcmRTb3VyY2VbXSkge1xuICAgICAgICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBzb3VyY2VzKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlib2FyZCA9IElubGluZUtleWJvYXJkLmZyb20oc291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuaW5saW5lX2tleWJvYXJkLnB1c2goXG4gICAgICAgICAgICAgICAgLi4ua2V5Ym9hcmQuaW5saW5lX2tleWJvYXJkLm1hcCgocm93KSA9PiByb3cuc2xpY2UoKSksXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUdXJucyBhIHR3by1kaW1lbnNpb25hbCBpbmxpbmUgYnV0dG9uIGFycmF5IGludG8gYW4gaW5saW5lIGtleWJvYXJkXG4gICAgICogaW5zdGFuY2UuIFlvdSBjYW4gdXNlIHRoZSBzdGF0aWMgYnV0dG9uIGJ1aWxkZXIgbWV0aG9kcyB0byBjcmVhdGUgaW5saW5lXG4gICAgICogYnV0dG9uIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc291cmNlIEEgdHdvLWRpbWVuc2lvbmFsIGlubGluZSBidXR0b24gYXJyYXlcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbShzb3VyY2U6IElubGluZUtleWJvYXJkU291cmNlKTogSW5saW5lS2V5Ym9hcmQge1xuICAgICAgICBpZiAoc291cmNlIGluc3RhbmNlb2YgSW5saW5lS2V5Ym9hcmQpIHJldHVybiBzb3VyY2UuY2xvbmUoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBJbmxpbmVLZXlib2FyZChzb3VyY2UubWFwKChyb3cpID0+IHJvdy5zbGljZSgpKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFuc3Bvc2U8VD4oZ3JpZDogVFtdW10pOiBUW11bXSB7XG4gICAgY29uc3QgdHJhbnNwb3NlZDogVFtdW10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGdyaWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgcm93ID0gZ3JpZFtpXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCByb3cubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHJvd1tqXTtcbiAgICAgICAgICAgICh0cmFuc3Bvc2VkW2pdID8/PSBbXSkucHVzaChidXR0b24pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cmFuc3Bvc2VkO1xufVxuaW50ZXJmYWNlIEZsb3dPcHRpb25zIHtcbiAgICAvKiogU2V0IHRvIGB0cnVlYCB0byBjb21wbGV0ZWx5IGZpbGwgdXAgdGhlIGxhc3Qgcm93ICovXG4gICAgZmlsbExhc3RSb3c/OiBib29sZWFuO1xufVxuZnVuY3Rpb24gcmVmbG93PFQ+KFxuICAgIGdyaWQ6IFRbXVtdLFxuICAgIGNvbHVtbnM6IG51bWJlcixcbiAgICB7IGZpbGxMYXN0Um93ID0gZmFsc2UgfTogRmxvd09wdGlvbnMsXG4pOiBUW11bXSB7XG4gICAgbGV0IGZpcnN0ID0gY29sdW1ucztcbiAgICBpZiAoZmlsbExhc3RSb3cpIHtcbiAgICAgICAgY29uc3QgYnV0dG9uQ291bnQgPSBncmlkXG4gICAgICAgICAgICAubWFwKChyb3cpID0+IHJvdy5sZW5ndGgpXG4gICAgICAgICAgICAucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG4gICAgICAgIGZpcnN0ID0gYnV0dG9uQ291bnQgJSBjb2x1bW5zO1xuICAgIH1cbiAgICBjb25zdCByZWZsb3dlZDogVFtdW10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiBncmlkKSB7XG4gICAgICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIHJvdykge1xuICAgICAgICAgICAgY29uc3QgYXQgPSBNYXRoLm1heCgwLCByZWZsb3dlZC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIGNvbnN0IG1heCA9IGF0ID09PSAwID8gZmlyc3QgOiBjb2x1bW5zO1xuICAgICAgICAgICAgbGV0IG5leHQgPSAocmVmbG93ZWRbYXRdID8/PSBbXSk7XG4gICAgICAgICAgICBpZiAobmV4dC5sZW5ndGggPT09IG1heCkge1xuICAgICAgICAgICAgICAgIG5leHQgPSBbXTtcbiAgICAgICAgICAgICAgICByZWZsb3dlZC5wdXNoKG5leHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV4dC5wdXNoKGJ1dHRvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlZmxvd2VkO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVlBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNDQyxHQUNELE9BQU8sTUFBTTs7RUFDVDs7OztLQUlDLEdBQ0QsQUFBTyxjQUF3QjtFQUMvQjs7O0tBR0MsR0FDRCxBQUFPLFVBQW9CO0VBQzNCOztLQUVDLEdBQ0QsQUFBTyxrQkFBNEI7RUFDbkM7OztLQUdDLEdBQ0QsQUFBTyxnQkFBMEI7RUFDakM7O0tBRUMsR0FDRCxBQUFPLHdCQUFpQztFQUV4Qzs7Ozs7OztLQU9DLEdBQ0QsWUFBWSxBQUFnQixXQUErQjtJQUFDLEVBQUU7R0FBQyxDQUFFO1NBQXJDLFdBQUE7RUFBc0M7RUFDbEU7Ozs7OztL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