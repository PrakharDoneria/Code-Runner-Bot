// deno-lint-ignore-file camelcase no-explicit-any
const filterQueryCache = new Map();
// === Obtain O(1) filter function from query
/**
 * > This is an advanced function of grammY.
 *
 * Takes a filter query and turns it into a predicate function that can check in
 * constant time whether a given context object satisfies the query. The created
 * predicate can be passed to `bot.filter` and will narrow down the context
 * accordingly.
 *
 * This function is used internally by `bot.on` but exposed for advanced usage
 * like the following.
 * ```ts
 * // Listens for updates except forwards of messages or channel posts
 * bot.drop(matchFilter(':forward_origin'), ctx => { ... })
 * ```
 *
 * Check out the
 * [documentation](https://grammy.dev/ref/core/composer#on)
 * of `bot.on` for examples. In addition, the
 * [website](https://grammy.dev/guide/filter-queries) contains more
 * information about how filter queries work in grammY.
 *
 * @param filter A filter query or an array of filter queries
 */ export function matchFilter(filter) {
  const queries = Array.isArray(filter) ? filter : [
    filter
  ];
  const key = queries.join(",");
  const predicate = filterQueryCache.get(key) ?? (()=>{
    const parsed = parse(queries);
    const pred = compile(parsed);
    filterQueryCache.set(key, pred);
    return pred;
  })();
  return (ctx)=>predicate(ctx);
}
export function parse(filter) {
  return Array.isArray(filter) ? filter.map((q)=>q.split(":")) : [
    filter.split(":")
  ];
}
function compile(parsed) {
  const preprocessed = parsed.flatMap((q)=>check(q, preprocess(q)));
  const ltree = treeify(preprocessed);
  const predicate = arborist(ltree); // arborists check trees
  return (ctx)=>!!predicate(ctx.update, ctx);
}
export function preprocess(filter) {
  const valid = UPDATE_KEYS;
  const expanded = [
    filter
  ]// expand L1
  .flatMap((q)=>{
    const [l1, l2, l3] = q;
    // only expand if shortcut is given
    if (!(l1 in L1_SHORTCUTS)) return [
      q
    ];
    // only expand for at least one non-empty part
    if (!l1 && !l2 && !l3) return [
      q
    ];
    // perform actual expansion
    const targets = L1_SHORTCUTS[l1];
    const expanded = targets.map((s)=>[
        s,
        l2,
        l3
      ]);
    // assume that bare L1 expansions are always correct
    if (l2 === undefined) return expanded;
    // only filter out invalid expansions if we don't do this later
    if (l2 in L2_SHORTCUTS && (l2 || l3)) return expanded;
    // filter out invalid expansions, e.g. `channel_post:new_chat_member` for empty L1
    return expanded.filter(([s])=>!!valid[s]?.[l2]);
  })// expand L2
  .flatMap((q)=>{
    const [l1, l2, l3] = q;
    // only expand if shortcut is given
    if (!(l2 in L2_SHORTCUTS)) return [
      q
    ];
    // only expand for at least one non-empty part
    if (!l2 && !l3) return [
      q
    ];
    // perform actual expansion
    const targets = L2_SHORTCUTS[l2];
    const expanded = targets.map((s)=>[
        l1,
        s,
        l3
      ]);
    // assume that bare L2 expansions are always correct
    if (l3 === undefined) return expanded;
    // filter out invalid expansions
    return expanded.filter(([, s])=>!!valid[l1]?.[s]?.[l3]);
  });
  if (expanded.length === 0) {
    throw new Error(`Shortcuts in '${filter.join(":")}' do not expand to any valid filter query`);
  }
  return expanded;
}
function check(original, preprocessed) {
  if (preprocessed.length === 0) throw new Error("Empty filter query given");
  const errors = preprocessed.map(checkOne).filter((r)=>r !== true);
  if (errors.length === 0) return preprocessed;
  else if (errors.length === 1) throw new Error(errors[0]);
  else {
    throw new Error(`Invalid filter query '${original.join(":")}'. There are ${errors.length} errors after expanding the contained shortcuts: ${errors.join("; ")}`);
  }
}
function checkOne(filter) {
  const [l1, l2, l3, ...n] = filter;
  if (l1 === undefined) return "Empty filter query given";
  if (!(l1 in UPDATE_KEYS)) {
    const permitted = Object.keys(UPDATE_KEYS);
    return `Invalid L1 filter '${l1}' given in '${filter.join(":")}'. \
Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`;
  }
  if (l2 === undefined) return true;
  const l1Obj = UPDATE_KEYS[l1];
  if (!(l2 in l1Obj)) {
    const permitted = Object.keys(l1Obj);
    return `Invalid L2 filter '${l2}' given in '${filter.join(":")}'. \
Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`;
  }
  if (l3 === undefined) return true;
  const l2Obj = l1Obj[l2];
  if (!(l3 in l2Obj)) {
    const permitted = Object.keys(l2Obj);
    return `Invalid L3 filter '${l3}' given in '${filter.join(":")}'. ${permitted.length === 0 ? `No further filtering is possible after '${l1}:${l2}'.` : `Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`}`;
  }
  if (n.length === 0) return true;
  return `Cannot filter further than three levels, ':${n.join(":")}' is invalid!`;
}
function treeify(paths) {
  const tree = {};
  for (const [l1, l2, l3] of paths){
    const subtree = tree[l1] ??= {};
    if (l2 !== undefined) {
      const set = subtree[l2] ??= new Set();
      if (l3 !== undefined) set.add(l3);
    }
  }
  return tree;
}
function or(left, right) {
  return (obj, ctx)=>left(obj, ctx) || right(obj, ctx);
}
function concat(get, test) {
  return (obj, ctx)=>{
    const nextObj = get(obj, ctx);
    return nextObj && test(nextObj, ctx);
  };
}
function leaf(pred) {
  return (obj, ctx)=>pred(obj, ctx) != null;
}
function arborist(tree) {
  const l1Predicates = Object.entries(tree).map(([l1, subtree])=>{
    const l1Pred = (obj)=>obj[l1];
    const l2Predicates = Object.entries(subtree).map(([l2, set])=>{
      const l2Pred = (obj)=>obj[l2];
      const l3Predicates = Array.from(set).map((l3)=>{
        const l3Pred = l3 === "me" // special handling for `me` shortcut
         ? (obj, ctx)=>{
          const me = ctx.me.id;
          return testMaybeArray(obj, (u)=>u.id === me);
        } : (obj)=>testMaybeArray(obj, (e)=>e[l3] || e.type === l3);
        return l3Pred;
      });
      return l3Predicates.length === 0 ? leaf(l2Pred) : concat(l2Pred, l3Predicates.reduce(or));
    });
    return l2Predicates.length === 0 ? leaf(l1Pred) : concat(l1Pred, l2Predicates.reduce(or));
  });
  if (l1Predicates.length === 0) {
    throw new Error("Cannot create filter function for empty query");
  }
  return l1Predicates.reduce(or);
}
function testMaybeArray(t, pred) {
  const p = (x)=>x != null && pred(x);
  return Array.isArray(t) ? t.some(p) : p(t);
}
// === Define a structure to validate the queries
// L3
const ENTITY_KEYS = {
  mention: {},
  hashtag: {},
  cashtag: {},
  bot_command: {},
  url: {},
  email: {},
  phone_number: {},
  bold: {},
  italic: {},
  underline: {},
  strikethrough: {},
  spoiler: {},
  blockquote: {},
  expandable_blockquote: {},
  code: {},
  pre: {},
  text_link: {},
  text_mention: {},
  custom_emoji: {}
};
const USER_KEYS = {
  me: {},
  is_bot: {},
  is_premium: {},
  added_to_attachment_menu: {}
};
const FORWARD_ORIGIN_KEYS = {
  user: {},
  hidden_user: {},
  chat: {},
  channel: {}
};
const STICKER_KEYS = {
  is_video: {},
  is_animated: {},
  premium_animation: {}
};
const REACTION_KEYS = {
  emoji: {},
  custom_emoji: {},
  paid: {}
};
// L2
const COMMON_MESSAGE_KEYS = {
  forward_origin: FORWARD_ORIGIN_KEYS,
  is_topic_message: {},
  is_automatic_forward: {},
  business_connection_id: {},
  text: {},
  animation: {},
  audio: {},
  document: {},
  paid_media: {},
  photo: {},
  sticker: STICKER_KEYS,
  story: {},
  video: {},
  video_note: {},
  voice: {},
  contact: {},
  dice: {},
  game: {},
  poll: {},
  venue: {},
  location: {},
  entities: ENTITY_KEYS,
  caption_entities: ENTITY_KEYS,
  caption: {},
  effect_id: {},
  has_media_spoiler: {},
  new_chat_title: {},
  new_chat_photo: {},
  delete_chat_photo: {},
  message_auto_delete_timer_changed: {},
  pinned_message: {},
  invoice: {},
  proximity_alert_triggered: {},
  chat_background_set: {},
  giveaway_created: {},
  giveaway: {
    only_new_members: {},
    has_public_winners: {}
  },
  giveaway_winners: {
    only_new_members: {},
    was_refunded: {}
  },
  giveaway_completed: {},
  video_chat_scheduled: {},
  video_chat_started: {},
  video_chat_ended: {},
  video_chat_participants_invited: {},
  web_app_data: {}
};
const MESSAGE_KEYS = {
  ...COMMON_MESSAGE_KEYS,
  new_chat_members: USER_KEYS,
  left_chat_member: USER_KEYS,
  group_chat_created: {},
  supergroup_chat_created: {},
  migrate_to_chat_id: {},
  migrate_from_chat_id: {},
  successful_payment: {},
  refunded_payment: {},
  users_shared: {},
  chat_shared: {},
  connected_website: {},
  write_access_allowed: {},
  passport_data: {},
  boost_added: {},
  forum_topic_created: {},
  forum_topic_edited: {
    name: {},
    icon_custom_emoji_id: {}
  },
  forum_topic_closed: {},
  forum_topic_reopened: {},
  general_forum_topic_hidden: {},
  general_forum_topic_unhidden: {},
  sender_boost_count: {}
};
const CHANNEL_POST_KEYS = {
  ...COMMON_MESSAGE_KEYS,
  channel_chat_created: {}
};
const BUSINESS_CONNECTION_KEYS = {
  can_reply: {},
  is_enabled: {}
};
const MESSAGE_REACTION_KEYS = {
  old_reaction: REACTION_KEYS,
  new_reaction: REACTION_KEYS
};
const MESSAGE_REACTION_COUNT_UPDATED_KEYS = {
  reactions: REACTION_KEYS
};
const CALLBACK_QUERY_KEYS = {
  data: {},
  game_short_name: {}
};
const CHAT_MEMBER_UPDATED_KEYS = {
  from: USER_KEYS
};
// L1
const UPDATE_KEYS = {
  message: MESSAGE_KEYS,
  edited_message: MESSAGE_KEYS,
  channel_post: CHANNEL_POST_KEYS,
  edited_channel_post: CHANNEL_POST_KEYS,
  business_connection: BUSINESS_CONNECTION_KEYS,
  business_message: MESSAGE_KEYS,
  edited_business_message: MESSAGE_KEYS,
  deleted_business_messages: {},
  inline_query: {},
  chosen_inline_result: {},
  callback_query: CALLBACK_QUERY_KEYS,
  shipping_query: {},
  pre_checkout_query: {},
  poll: {},
  poll_answer: {},
  my_chat_member: CHAT_MEMBER_UPDATED_KEYS,
  chat_member: CHAT_MEMBER_UPDATED_KEYS,
  chat_join_request: {},
  message_reaction: MESSAGE_REACTION_KEYS,
  message_reaction_count: MESSAGE_REACTION_COUNT_UPDATED_KEYS,
  chat_boost: {},
  removed_chat_boost: {},
  purchased_paid_media: {}
};
// === Define some helpers for handling shortcuts, e.g. in 'edit:photo'
const L1_SHORTCUTS = {
  "": [
    "message",
    "channel_post"
  ],
  msg: [
    "message",
    "channel_post"
  ],
  edit: [
    "edited_message",
    "edited_channel_post"
  ]
};
const L2_SHORTCUTS = {
  "": [
    "entities",
    "caption_entities"
  ],
  media: [
    "photo",
    "video"
  ],
  file: [
    "photo",
    "animation",
    "audio",
    "document",
    "video",
    "video_note",
    "voice",
    "sticker"
  ]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvZmlsdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBjYW1lbGNhc2Ugbm8tZXhwbGljaXQtYW55XG5pbXBvcnQgeyB0eXBlIENvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyB0eXBlIFVwZGF0ZSB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbnR5cGUgRmlsdGVyRnVuY3Rpb248QyBleHRlbmRzIENvbnRleHQsIEQgZXh0ZW5kcyBDPiA9IChjdHg6IEMpID0+IGN0eCBpcyBEO1xuXG5jb25zdCBmaWx0ZXJRdWVyeUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIChjdHg6IENvbnRleHQpID0+IGJvb2xlYW4+KCk7XG5cbi8vID09PSBPYnRhaW4gTygxKSBmaWx0ZXIgZnVuY3Rpb24gZnJvbSBxdWVyeVxuLyoqXG4gKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgZnVuY3Rpb24gb2YgZ3JhbW1ZLlxuICpcbiAqIFRha2VzIGEgZmlsdGVyIHF1ZXJ5IGFuZCB0dXJucyBpdCBpbnRvIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIGNoZWNrIGluXG4gKiBjb25zdGFudCB0aW1lIHdoZXRoZXIgYSBnaXZlbiBjb250ZXh0IG9iamVjdCBzYXRpc2ZpZXMgdGhlIHF1ZXJ5LiBUaGUgY3JlYXRlZFxuICogcHJlZGljYXRlIGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5maWx0ZXJgIGFuZCB3aWxsIG5hcnJvdyBkb3duIHRoZSBjb250ZXh0XG4gKiBhY2NvcmRpbmdseS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW50ZXJuYWxseSBieSBgYm90Lm9uYCBidXQgZXhwb3NlZCBmb3IgYWR2YW5jZWQgdXNhZ2VcbiAqIGxpa2UgdGhlIGZvbGxvd2luZy5cbiAqIGBgYHRzXG4gKiAvLyBMaXN0ZW5zIGZvciB1cGRhdGVzIGV4Y2VwdCBmb3J3YXJkcyBvZiBtZXNzYWdlcyBvciBjaGFubmVsIHBvc3RzXG4gKiBib3QuZHJvcChtYXRjaEZpbHRlcignOmZvcndhcmRfb3JpZ2luJyksIGN0eCA9PiB7IC4uLiB9KVxuICogYGBgXG4gKlxuICogQ2hlY2sgb3V0IHRoZVxuICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9yZWYvY29yZS9jb21wb3NlciNvbilcbiAqIG9mIGBib3Qub25gIGZvciBleGFtcGxlcy4gSW4gYWRkaXRpb24sIHRoZVxuICogW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9maWx0ZXItcXVlcmllcykgY29udGFpbnMgbW9yZVxuICogaW5mb3JtYXRpb24gYWJvdXQgaG93IGZpbHRlciBxdWVyaWVzIHdvcmsgaW4gZ3JhbW1ZLlxuICpcbiAqIEBwYXJhbSBmaWx0ZXIgQSBmaWx0ZXIgcXVlcnkgb3IgYW4gYXJyYXkgb2YgZmlsdGVyIHF1ZXJpZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoRmlsdGVyPEMgZXh0ZW5kcyBDb250ZXh0LCBRIGV4dGVuZHMgRmlsdGVyUXVlcnk+KFxuICAgIGZpbHRlcjogUSB8IFFbXSxcbik6IEZpbHRlckZ1bmN0aW9uPEMsIEZpbHRlcjxDLCBRPj4ge1xuICAgIGNvbnN0IHF1ZXJpZXMgPSBBcnJheS5pc0FycmF5KGZpbHRlcikgPyBmaWx0ZXIgOiBbZmlsdGVyXTtcbiAgICBjb25zdCBrZXkgPSBxdWVyaWVzLmpvaW4oXCIsXCIpO1xuICAgIGNvbnN0IHByZWRpY2F0ZSA9IGZpbHRlclF1ZXJ5Q2FjaGUuZ2V0KGtleSkgPz8gKCgpID0+IHtcbiAgICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2UocXVlcmllcyk7XG4gICAgICAgIGNvbnN0IHByZWQgPSBjb21waWxlKHBhcnNlZCk7XG4gICAgICAgIGZpbHRlclF1ZXJ5Q2FjaGUuc2V0KGtleSwgcHJlZCk7XG4gICAgICAgIHJldHVybiBwcmVkO1xuICAgIH0pKCk7XG4gICAgcmV0dXJuIChjdHg6IEMpOiBjdHggaXMgRmlsdGVyPEMsIFE+ID0+IHByZWRpY2F0ZShjdHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UoZmlsdGVyOiBGaWx0ZXJRdWVyeSB8IEZpbHRlclF1ZXJ5W10pOiBzdHJpbmdbXVtdIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheShmaWx0ZXIpXG4gICAgICAgID8gZmlsdGVyLm1hcCgocSkgPT4gcS5zcGxpdChcIjpcIikpXG4gICAgICAgIDogW2ZpbHRlci5zcGxpdChcIjpcIildO1xufVxuXG5mdW5jdGlvbiBjb21waWxlKHBhcnNlZDogc3RyaW5nW11bXSk6IChjdHg6IENvbnRleHQpID0+IGJvb2xlYW4ge1xuICAgIGNvbnN0IHByZXByb2Nlc3NlZCA9IHBhcnNlZC5mbGF0TWFwKChxKSA9PiBjaGVjayhxLCBwcmVwcm9jZXNzKHEpKSk7XG4gICAgY29uc3QgbHRyZWUgPSB0cmVlaWZ5KHByZXByb2Nlc3NlZCk7XG4gICAgY29uc3QgcHJlZGljYXRlID0gYXJib3Jpc3QobHRyZWUpOyAvLyBhcmJvcmlzdHMgY2hlY2sgdHJlZXNcbiAgICByZXR1cm4gKGN0eCkgPT4gISFwcmVkaWNhdGUoY3R4LnVwZGF0ZSwgY3R4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByZXByb2Nlc3MoZmlsdGVyOiBzdHJpbmdbXSk6IHN0cmluZ1tdW10ge1xuICAgIGNvbnN0IHZhbGlkOiBhbnkgPSBVUERBVEVfS0VZUztcbiAgICBjb25zdCBleHBhbmRlZCA9IFtmaWx0ZXJdXG4gICAgICAgIC8vIGV4cGFuZCBMMVxuICAgICAgICAuZmxhdE1hcCgocSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgW2wxLCBsMiwgbDNdID0gcTtcbiAgICAgICAgICAgIC8vIG9ubHkgZXhwYW5kIGlmIHNob3J0Y3V0IGlzIGdpdmVuXG4gICAgICAgICAgICBpZiAoIShsMSBpbiBMMV9TSE9SVENVVFMpKSByZXR1cm4gW3FdO1xuICAgICAgICAgICAgLy8gb25seSBleHBhbmQgZm9yIGF0IGxlYXN0IG9uZSBub24tZW1wdHkgcGFydFxuICAgICAgICAgICAgaWYgKCFsMSAmJiAhbDIgJiYgIWwzKSByZXR1cm4gW3FdO1xuICAgICAgICAgICAgLy8gcGVyZm9ybSBhY3R1YWwgZXhwYW5zaW9uXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRzID0gTDFfU0hPUlRDVVRTW2wxIGFzIEwxU2hvcnRjdXRzXTtcbiAgICAgICAgICAgIGNvbnN0IGV4cGFuZGVkID0gdGFyZ2V0cy5tYXAoKHMpID0+IFtzLCBsMiwgbDNdKTtcbiAgICAgICAgICAgIC8vIGFzc3VtZSB0aGF0IGJhcmUgTDEgZXhwYW5zaW9ucyBhcmUgYWx3YXlzIGNvcnJlY3RcbiAgICAgICAgICAgIGlmIChsMiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZXhwYW5kZWQ7XG4gICAgICAgICAgICAvLyBvbmx5IGZpbHRlciBvdXQgaW52YWxpZCBleHBhbnNpb25zIGlmIHdlIGRvbid0IGRvIHRoaXMgbGF0ZXJcbiAgICAgICAgICAgIGlmIChsMiBpbiBMMl9TSE9SVENVVFMgJiYgKGwyIHx8IGwzKSkgcmV0dXJuIGV4cGFuZGVkO1xuICAgICAgICAgICAgLy8gZmlsdGVyIG91dCBpbnZhbGlkIGV4cGFuc2lvbnMsIGUuZy4gYGNoYW5uZWxfcG9zdDpuZXdfY2hhdF9tZW1iZXJgIGZvciBlbXB0eSBMMVxuICAgICAgICAgICAgcmV0dXJuIGV4cGFuZGVkLmZpbHRlcigoW3NdKSA9PiAhIXZhbGlkW3NdPy5bbDJdKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gZXhwYW5kIEwyXG4gICAgICAgIC5mbGF0TWFwKChxKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbbDEsIGwyLCBsM10gPSBxO1xuICAgICAgICAgICAgLy8gb25seSBleHBhbmQgaWYgc2hvcnRjdXQgaXMgZ2l2ZW5cbiAgICAgICAgICAgIGlmICghKGwyIGluIEwyX1NIT1JUQ1VUUykpIHJldHVybiBbcV07XG4gICAgICAgICAgICAvLyBvbmx5IGV4cGFuZCBmb3IgYXQgbGVhc3Qgb25lIG5vbi1lbXB0eSBwYXJ0XG4gICAgICAgICAgICBpZiAoIWwyICYmICFsMykgcmV0dXJuIFtxXTtcbiAgICAgICAgICAgIC8vIHBlcmZvcm0gYWN0dWFsIGV4cGFuc2lvblxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0cyA9IEwyX1NIT1JUQ1VUU1tsMiBhcyBMMlNob3J0Y3V0c107XG4gICAgICAgICAgICBjb25zdCBleHBhbmRlZCA9IHRhcmdldHMubWFwKChzKSA9PiBbbDEsIHMsIGwzXSk7XG4gICAgICAgICAgICAvLyBhc3N1bWUgdGhhdCBiYXJlIEwyIGV4cGFuc2lvbnMgYXJlIGFsd2F5cyBjb3JyZWN0XG4gICAgICAgICAgICBpZiAobDMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGV4cGFuZGVkO1xuICAgICAgICAgICAgLy8gZmlsdGVyIG91dCBpbnZhbGlkIGV4cGFuc2lvbnNcbiAgICAgICAgICAgIHJldHVybiBleHBhbmRlZC5maWx0ZXIoKFssIHNdKSA9PiAhIXZhbGlkW2wxXT8uW3NdPy5bbDNdKTtcbiAgICAgICAgfSk7XG4gICAgaWYgKGV4cGFuZGVkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgU2hvcnRjdXRzIGluICcke1xuICAgICAgICAgICAgICAgIGZpbHRlci5qb2luKFwiOlwiKVxuICAgICAgICAgICAgfScgZG8gbm90IGV4cGFuZCB0byBhbnkgdmFsaWQgZmlsdGVyIHF1ZXJ5YCxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGV4cGFuZGVkO1xufVxuXG5mdW5jdGlvbiBjaGVjayhvcmlnaW5hbDogc3RyaW5nW10sIHByZXByb2Nlc3NlZDogc3RyaW5nW11bXSk6IHN0cmluZ1tdW10ge1xuICAgIGlmIChwcmVwcm9jZXNzZWQubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJFbXB0eSBmaWx0ZXIgcXVlcnkgZ2l2ZW5cIik7XG4gICAgY29uc3QgZXJyb3JzID0gcHJlcHJvY2Vzc2VkXG4gICAgICAgIC5tYXAoY2hlY2tPbmUpXG4gICAgICAgIC5maWx0ZXIoKHIpOiByIGlzIHN0cmluZyA9PiByICE9PSB0cnVlKTtcbiAgICBpZiAoZXJyb3JzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHByZXByb2Nlc3NlZDtcbiAgICBlbHNlIGlmIChlcnJvcnMubGVuZ3RoID09PSAxKSB0aHJvdyBuZXcgRXJyb3IoZXJyb3JzWzBdKTtcbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEludmFsaWQgZmlsdGVyIHF1ZXJ5ICcke1xuICAgICAgICAgICAgICAgIG9yaWdpbmFsLmpvaW4oXCI6XCIpXG4gICAgICAgICAgICB9Jy4gVGhlcmUgYXJlICR7ZXJyb3JzLmxlbmd0aH0gZXJyb3JzIGFmdGVyIGV4cGFuZGluZyB0aGUgY29udGFpbmVkIHNob3J0Y3V0czogJHtcbiAgICAgICAgICAgICAgICBlcnJvcnMuam9pbihcIjsgXCIpXG4gICAgICAgICAgICB9YCxcbiAgICAgICAgKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja09uZShmaWx0ZXI6IHN0cmluZ1tdKTogc3RyaW5nIHwgdHJ1ZSB7XG4gICAgY29uc3QgW2wxLCBsMiwgbDMsIC4uLm5dID0gZmlsdGVyO1xuICAgIGlmIChsMSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCJFbXB0eSBmaWx0ZXIgcXVlcnkgZ2l2ZW5cIjtcbiAgICBpZiAoIShsMSBpbiBVUERBVEVfS0VZUykpIHtcbiAgICAgICAgY29uc3QgcGVybWl0dGVkID0gT2JqZWN0LmtleXMoVVBEQVRFX0tFWVMpO1xuICAgICAgICByZXR1cm4gYEludmFsaWQgTDEgZmlsdGVyICcke2wxfScgZ2l2ZW4gaW4gJyR7ZmlsdGVyLmpvaW4oXCI6XCIpfScuIFxcXG5QZXJtaXR0ZWQgdmFsdWVzIGFyZTogJHtwZXJtaXR0ZWQubWFwKChrKSA9PiBgJyR7a30nYCkuam9pbihcIiwgXCIpfS5gO1xuICAgIH1cbiAgICBpZiAobDIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgbDFPYmo6IGFueSA9IFVQREFURV9LRVlTW2wxIGFzIGtleW9mIFNdO1xuICAgIGlmICghKGwyIGluIGwxT2JqKSkge1xuICAgICAgICBjb25zdCBwZXJtaXR0ZWQgPSBPYmplY3Qua2V5cyhsMU9iaik7XG4gICAgICAgIHJldHVybiBgSW52YWxpZCBMMiBmaWx0ZXIgJyR7bDJ9JyBnaXZlbiBpbiAnJHtmaWx0ZXIuam9pbihcIjpcIil9Jy4gXFxcblBlcm1pdHRlZCB2YWx1ZXMgYXJlOiAke3Blcm1pdHRlZC5tYXAoKGspID0+IGAnJHtrfSdgKS5qb2luKFwiLCBcIil9LmA7XG4gICAgfVxuICAgIGlmIChsMyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBsMk9iaiA9IGwxT2JqW2wyXTtcbiAgICBpZiAoIShsMyBpbiBsMk9iaikpIHtcbiAgICAgICAgY29uc3QgcGVybWl0dGVkID0gT2JqZWN0LmtleXMobDJPYmopO1xuICAgICAgICByZXR1cm4gYEludmFsaWQgTDMgZmlsdGVyICcke2wzfScgZ2l2ZW4gaW4gJyR7ZmlsdGVyLmpvaW4oXCI6XCIpfScuICR7XG4gICAgICAgICAgICBwZXJtaXR0ZWQubGVuZ3RoID09PSAwXG4gICAgICAgICAgICAgICAgPyBgTm8gZnVydGhlciBmaWx0ZXJpbmcgaXMgcG9zc2libGUgYWZ0ZXIgJyR7bDF9OiR7bDJ9Jy5gXG4gICAgICAgICAgICAgICAgOiBgUGVybWl0dGVkIHZhbHVlcyBhcmU6ICR7XG4gICAgICAgICAgICAgICAgICAgIHBlcm1pdHRlZC5tYXAoKGspID0+IGAnJHtrfSdgKS5qb2luKFwiLCBcIilcbiAgICAgICAgICAgICAgICB9LmBcbiAgICAgICAgfWA7XG4gICAgfVxuICAgIGlmIChuLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGBDYW5ub3QgZmlsdGVyIGZ1cnRoZXIgdGhhbiB0aHJlZSBsZXZlbHMsICc6JHtcbiAgICAgICAgbi5qb2luKFwiOlwiKVxuICAgIH0nIGlzIGludmFsaWQhYDtcbn1cbmludGVyZmFjZSBMVHJlZSB7XG4gICAgW2wxOiBzdHJpbmddOiB7IFtsMjogc3RyaW5nXTogU2V0PHN0cmluZz4gfTtcbn1cbmZ1bmN0aW9uIHRyZWVpZnkocGF0aHM6IHN0cmluZ1tdW10pOiBMVHJlZSB7XG4gICAgY29uc3QgdHJlZTogTFRyZWUgPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtsMSwgbDIsIGwzXSBvZiBwYXRocykge1xuICAgICAgICBjb25zdCBzdWJ0cmVlID0gKHRyZWVbbDFdID8/PSB7fSk7XG4gICAgICAgIGlmIChsMiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBzZXQgPSAoc3VidHJlZVtsMl0gPz89IG5ldyBTZXQoKSk7XG4gICAgICAgICAgICBpZiAobDMgIT09IHVuZGVmaW5lZCkgc2V0LmFkZChsMyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRyZWU7XG59XG5cbnR5cGUgUHJlZCA9IChvYmo6IGFueSwgY3R4OiBDb250ZXh0KSA9PiBib29sZWFuO1xuZnVuY3Rpb24gb3IobGVmdDogUHJlZCwgcmlnaHQ6IFByZWQpOiBQcmVkIHtcbiAgICByZXR1cm4gKG9iaiwgY3R4KSA9PiBsZWZ0KG9iaiwgY3R4KSB8fCByaWdodChvYmosIGN0eCk7XG59XG5mdW5jdGlvbiBjb25jYXQoZ2V0OiBQcmVkLCB0ZXN0OiBQcmVkKTogUHJlZCB7XG4gICAgcmV0dXJuIChvYmosIGN0eCkgPT4ge1xuICAgICAgICBjb25zdCBuZXh0T2JqID0gZ2V0KG9iaiwgY3R4KTtcbiAgICAgICAgcmV0dXJuIG5leHRPYmogJiYgdGVzdChuZXh0T2JqLCBjdHgpO1xuICAgIH07XG59XG5mdW5jdGlvbiBsZWFmKHByZWQ6IFByZWQpOiBQcmVkIHtcbiAgICByZXR1cm4gKG9iaiwgY3R4KSA9PiBwcmVkKG9iaiwgY3R4KSAhPSBudWxsO1xufVxuZnVuY3Rpb24gYXJib3Jpc3QodHJlZTogTFRyZWUpOiBQcmVkIHtcbiAgICBjb25zdCBsMVByZWRpY2F0ZXMgPSBPYmplY3QuZW50cmllcyh0cmVlKS5tYXAoKFtsMSwgc3VidHJlZV0pID0+IHtcbiAgICAgICAgY29uc3QgbDFQcmVkOiBQcmVkID0gKG9iaikgPT4gb2JqW2wxXTtcbiAgICAgICAgY29uc3QgbDJQcmVkaWNhdGVzID0gT2JqZWN0LmVudHJpZXMoc3VidHJlZSkubWFwKChbbDIsIHNldF0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGwyUHJlZDogUHJlZCA9IChvYmopID0+IG9ialtsMl07XG4gICAgICAgICAgICBjb25zdCBsM1ByZWRpY2F0ZXMgPSBBcnJheS5mcm9tKHNldCkubWFwKChsMykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGwzUHJlZDogUHJlZCA9IGwzID09PSBcIm1lXCIgLy8gc3BlY2lhbCBoYW5kbGluZyBmb3IgYG1lYCBzaG9ydGN1dFxuICAgICAgICAgICAgICAgICAgICA/IChvYmosIGN0eCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWUgPSBjdHgubWUuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVzdE1heWJlQXJyYXkob2JqLCAodSkgPT4gdS5pZCA9PT0gbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDogKG9iaikgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3RNYXliZUFycmF5KG9iaiwgKGUpID0+IGVbbDNdIHx8IGUudHlwZSA9PT0gbDMpO1xuICAgICAgICAgICAgICAgIHJldHVybiBsM1ByZWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBsM1ByZWRpY2F0ZXMubGVuZ3RoID09PSAwXG4gICAgICAgICAgICAgICAgPyBsZWFmKGwyUHJlZClcbiAgICAgICAgICAgICAgICA6IGNvbmNhdChsMlByZWQsIGwzUHJlZGljYXRlcy5yZWR1Y2Uob3IpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsMlByZWRpY2F0ZXMubGVuZ3RoID09PSAwXG4gICAgICAgICAgICA/IGxlYWYobDFQcmVkKVxuICAgICAgICAgICAgOiBjb25jYXQobDFQcmVkLCBsMlByZWRpY2F0ZXMucmVkdWNlKG9yKSk7XG4gICAgfSk7XG4gICAgaWYgKGwxUHJlZGljYXRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGNyZWF0ZSBmaWx0ZXIgZnVuY3Rpb24gZm9yIGVtcHR5IHF1ZXJ5XCIpO1xuICAgIH1cbiAgICByZXR1cm4gbDFQcmVkaWNhdGVzLnJlZHVjZShvcik7XG59XG5cbmZ1bmN0aW9uIHRlc3RNYXliZUFycmF5PFQ+KHQ6IFQgfCBUW10sIHByZWQ6ICh0OiBUKSA9PiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcCA9ICh4OiBUKSA9PiB4ICE9IG51bGwgJiYgcHJlZCh4KTtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh0KSA/IHQuc29tZShwKSA6IHAodCk7XG59XG5cbi8vID09PSBEZWZpbmUgYSBzdHJ1Y3R1cmUgdG8gdmFsaWRhdGUgdGhlIHF1ZXJpZXNcbi8vIEwzXG5jb25zdCBFTlRJVFlfS0VZUyA9IHtcbiAgICBtZW50aW9uOiB7fSxcbiAgICBoYXNodGFnOiB7fSxcbiAgICBjYXNodGFnOiB7fSxcbiAgICBib3RfY29tbWFuZDoge30sXG4gICAgdXJsOiB7fSxcbiAgICBlbWFpbDoge30sXG4gICAgcGhvbmVfbnVtYmVyOiB7fSxcbiAgICBib2xkOiB7fSxcbiAgICBpdGFsaWM6IHt9LFxuICAgIHVuZGVybGluZToge30sXG4gICAgc3RyaWtldGhyb3VnaDoge30sXG4gICAgc3BvaWxlcjoge30sXG4gICAgYmxvY2txdW90ZToge30sXG4gICAgZXhwYW5kYWJsZV9ibG9ja3F1b3RlOiB7fSxcbiAgICBjb2RlOiB7fSxcbiAgICBwcmU6IHt9LFxuICAgIHRleHRfbGluazoge30sXG4gICAgdGV4dF9tZW50aW9uOiB7fSxcbiAgICBjdXN0b21fZW1vamk6IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IFVTRVJfS0VZUyA9IHtcbiAgICBtZToge30sXG4gICAgaXNfYm90OiB7fSxcbiAgICBpc19wcmVtaXVtOiB7fSxcbiAgICBhZGRlZF90b19hdHRhY2htZW50X21lbnU6IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IEZPUldBUkRfT1JJR0lOX0tFWVMgPSB7XG4gICAgdXNlcjoge30sXG4gICAgaGlkZGVuX3VzZXI6IHt9LFxuICAgIGNoYXQ6IHt9LFxuICAgIGNoYW5uZWw6IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IFNUSUNLRVJfS0VZUyA9IHtcbiAgICBpc192aWRlbzoge30sXG4gICAgaXNfYW5pbWF0ZWQ6IHt9LFxuICAgIHByZW1pdW1fYW5pbWF0aW9uOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBSRUFDVElPTl9LRVlTID0ge1xuICAgIGVtb2ppOiB7fSxcbiAgICBjdXN0b21fZW1vamk6IHt9LFxuICAgIHBhaWQ6IHt9LFxufSBhcyBjb25zdDtcblxuLy8gTDJcbmNvbnN0IENPTU1PTl9NRVNTQUdFX0tFWVMgPSB7XG4gICAgZm9yd2FyZF9vcmlnaW46IEZPUldBUkRfT1JJR0lOX0tFWVMsXG4gICAgaXNfdG9waWNfbWVzc2FnZToge30sXG4gICAgaXNfYXV0b21hdGljX2ZvcndhcmQ6IHt9LFxuICAgIGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHt9LFxuXG4gICAgdGV4dDoge30sXG4gICAgYW5pbWF0aW9uOiB7fSxcbiAgICBhdWRpbzoge30sXG4gICAgZG9jdW1lbnQ6IHt9LFxuICAgIHBhaWRfbWVkaWE6IHt9LFxuICAgIHBob3RvOiB7fSxcbiAgICBzdGlja2VyOiBTVElDS0VSX0tFWVMsXG4gICAgc3Rvcnk6IHt9LFxuICAgIHZpZGVvOiB7fSxcbiAgICB2aWRlb19ub3RlOiB7fSxcbiAgICB2b2ljZToge30sXG4gICAgY29udGFjdDoge30sXG4gICAgZGljZToge30sXG4gICAgZ2FtZToge30sXG4gICAgcG9sbDoge30sXG4gICAgdmVudWU6IHt9LFxuICAgIGxvY2F0aW9uOiB7fSxcblxuICAgIGVudGl0aWVzOiBFTlRJVFlfS0VZUyxcbiAgICBjYXB0aW9uX2VudGl0aWVzOiBFTlRJVFlfS0VZUyxcbiAgICBjYXB0aW9uOiB7fSxcblxuICAgIGVmZmVjdF9pZDoge30sXG4gICAgaGFzX21lZGlhX3Nwb2lsZXI6IHt9LFxuXG4gICAgbmV3X2NoYXRfdGl0bGU6IHt9LFxuICAgIG5ld19jaGF0X3Bob3RvOiB7fSxcbiAgICBkZWxldGVfY2hhdF9waG90bzoge30sXG4gICAgbWVzc2FnZV9hdXRvX2RlbGV0ZV90aW1lcl9jaGFuZ2VkOiB7fSxcbiAgICBwaW5uZWRfbWVzc2FnZToge30sXG4gICAgaW52b2ljZToge30sXG4gICAgcHJveGltaXR5X2FsZXJ0X3RyaWdnZXJlZDoge30sXG4gICAgY2hhdF9iYWNrZ3JvdW5kX3NldDoge30sXG4gICAgZ2l2ZWF3YXlfY3JlYXRlZDoge30sXG4gICAgZ2l2ZWF3YXk6IHsgb25seV9uZXdfbWVtYmVyczoge30sIGhhc19wdWJsaWNfd2lubmVyczoge30gfSxcbiAgICBnaXZlYXdheV93aW5uZXJzOiB7IG9ubHlfbmV3X21lbWJlcnM6IHt9LCB3YXNfcmVmdW5kZWQ6IHt9IH0sXG4gICAgZ2l2ZWF3YXlfY29tcGxldGVkOiB7fSxcbiAgICB2aWRlb19jaGF0X3NjaGVkdWxlZDoge30sXG4gICAgdmlkZW9fY2hhdF9zdGFydGVkOiB7fSxcbiAgICB2aWRlb19jaGF0X2VuZGVkOiB7fSxcbiAgICB2aWRlb19jaGF0X3BhcnRpY2lwYW50c19pbnZpdGVkOiB7fSxcbiAgICB3ZWJfYXBwX2RhdGE6IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IE1FU1NBR0VfS0VZUyA9IHtcbiAgICAuLi5DT01NT05fTUVTU0FHRV9LRVlTLFxuXG4gICAgbmV3X2NoYXRfbWVtYmVyczogVVNFUl9LRVlTLFxuICAgIGxlZnRfY2hhdF9tZW1iZXI6IFVTRVJfS0VZUyxcbiAgICBncm91cF9jaGF0X2NyZWF0ZWQ6IHt9LFxuICAgIHN1cGVyZ3JvdXBfY2hhdF9jcmVhdGVkOiB7fSxcbiAgICBtaWdyYXRlX3RvX2NoYXRfaWQ6IHt9LFxuICAgIG1pZ3JhdGVfZnJvbV9jaGF0X2lkOiB7fSxcbiAgICBzdWNjZXNzZnVsX3BheW1lbnQ6IHt9LFxuICAgIHJlZnVuZGVkX3BheW1lbnQ6IHt9LFxuICAgIHVzZXJzX3NoYXJlZDoge30sXG4gICAgY2hhdF9zaGFyZWQ6IHt9LFxuICAgIGNvbm5lY3RlZF93ZWJzaXRlOiB7fSxcbiAgICB3cml0ZV9hY2Nlc3NfYWxsb3dlZDoge30sXG4gICAgcGFzc3BvcnRfZGF0YToge30sXG4gICAgYm9vc3RfYWRkZWQ6IHt9LFxuICAgIGZvcnVtX3RvcGljX2NyZWF0ZWQ6IHt9LFxuICAgIGZvcnVtX3RvcGljX2VkaXRlZDogeyBuYW1lOiB7fSwgaWNvbl9jdXN0b21fZW1vamlfaWQ6IHt9IH0sXG4gICAgZm9ydW1fdG9waWNfY2xvc2VkOiB7fSxcbiAgICBmb3J1bV90b3BpY19yZW9wZW5lZDoge30sXG4gICAgZ2VuZXJhbF9mb3J1bV90b3BpY19oaWRkZW46IHt9LFxuICAgIGdlbmVyYWxfZm9ydW1fdG9waWNfdW5oaWRkZW46IHt9LFxuXG4gICAgc2VuZGVyX2Jvb3N0X2NvdW50OiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBDSEFOTkVMX1BPU1RfS0VZUyA9IHtcbiAgICAuLi5DT01NT05fTUVTU0FHRV9LRVlTLFxuICAgIGNoYW5uZWxfY2hhdF9jcmVhdGVkOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBCVVNJTkVTU19DT05ORUNUSU9OX0tFWVMgPSB7XG4gICAgY2FuX3JlcGx5OiB7fSxcbiAgICBpc19lbmFibGVkOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBNRVNTQUdFX1JFQUNUSU9OX0tFWVMgPSB7XG4gICAgb2xkX3JlYWN0aW9uOiBSRUFDVElPTl9LRVlTLFxuICAgIG5ld19yZWFjdGlvbjogUkVBQ1RJT05fS0VZUyxcbn0gYXMgY29uc3Q7XG5jb25zdCBNRVNTQUdFX1JFQUNUSU9OX0NPVU5UX1VQREFURURfS0VZUyA9IHtcbiAgICByZWFjdGlvbnM6IFJFQUNUSU9OX0tFWVMsXG59IGFzIGNvbnN0O1xuY29uc3QgQ0FMTEJBQ0tfUVVFUllfS0VZUyA9IHsgZGF0YToge30sIGdhbWVfc2hvcnRfbmFtZToge30gfSBhcyBjb25zdDtcbmNvbnN0IENIQVRfTUVNQkVSX1VQREFURURfS0VZUyA9IHsgZnJvbTogVVNFUl9LRVlTIH0gYXMgY29uc3Q7XG5cbi8vIEwxXG5jb25zdCBVUERBVEVfS0VZUyA9IHtcbiAgICBtZXNzYWdlOiBNRVNTQUdFX0tFWVMsXG4gICAgZWRpdGVkX21lc3NhZ2U6IE1FU1NBR0VfS0VZUyxcbiAgICBjaGFubmVsX3Bvc3Q6IENIQU5ORUxfUE9TVF9LRVlTLFxuICAgIGVkaXRlZF9jaGFubmVsX3Bvc3Q6IENIQU5ORUxfUE9TVF9LRVlTLFxuICAgIGJ1c2luZXNzX2Nvbm5lY3Rpb246IEJVU0lORVNTX0NPTk5FQ1RJT05fS0VZUyxcbiAgICBidXNpbmVzc19tZXNzYWdlOiBNRVNTQUdFX0tFWVMsXG4gICAgZWRpdGVkX2J1c2luZXNzX21lc3NhZ2U6IE1FU1NBR0VfS0VZUyxcbiAgICBkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzOiB7fSxcbiAgICBpbmxpbmVfcXVlcnk6IHt9LFxuICAgIGNob3Nlbl9pbmxpbmVfcmVzdWx0OiB7fSxcbiAgICBjYWxsYmFja19xdWVyeTogQ0FMTEJBQ0tfUVVFUllfS0VZUyxcbiAgICBzaGlwcGluZ19xdWVyeToge30sXG4gICAgcHJlX2NoZWNrb3V0X3F1ZXJ5OiB7fSxcbiAgICBwb2xsOiB7fSxcbiAgICBwb2xsX2Fuc3dlcjoge30sXG4gICAgbXlfY2hhdF9tZW1iZXI6IENIQVRfTUVNQkVSX1VQREFURURfS0VZUyxcbiAgICBjaGF0X21lbWJlcjogQ0hBVF9NRU1CRVJfVVBEQVRFRF9LRVlTLFxuICAgIGNoYXRfam9pbl9yZXF1ZXN0OiB7fSxcbiAgICBtZXNzYWdlX3JlYWN0aW9uOiBNRVNTQUdFX1JFQUNUSU9OX0tFWVMsXG4gICAgbWVzc2FnZV9yZWFjdGlvbl9jb3VudDogTUVTU0FHRV9SRUFDVElPTl9DT1VOVF9VUERBVEVEX0tFWVMsXG4gICAgY2hhdF9ib29zdDoge30sXG4gICAgcmVtb3ZlZF9jaGF0X2Jvb3N0OiB7fSxcbiAgICBwdXJjaGFzZWRfcGFpZF9tZWRpYToge30sXG59IGFzIGNvbnN0O1xuXG4vLyA9PT0gQnVpbGQgdXAgYWxsIHBvc3NpYmxlIGZpbHRlciBxdWVyaWVzIGZyb20gdGhlIGFib3ZlIHZhbGlkYXRpb24gc3RydWN0dXJlXG50eXBlIEtleU9mPFQ+ID0gc3RyaW5nICYga2V5b2YgVDsgLy8gRW11bGF0ZSBga2V5b2ZTdHJpbmdzT25seWBcblxuLy8gU3VnZ2VzdGlvbiBidWlsZGluZyBiYXNlIHN0cnVjdHVyZVxudHlwZSBTID0gdHlwZW9mIFVQREFURV9LRVlTO1xuXG4vLyBFLmcuICdtZXNzYWdlJyBzdWdnZXN0aW9uc1xudHlwZSBMMVMgPSBLZXlPZjxTPjtcbi8vIEUuZy4gJ21lc3NhZ2U6ZW50aXRpZXMnIHN1Z2dlc3Rpb25zXG50eXBlIEwyUzxMMSBleHRlbmRzIEwxUyA9IEwxUz4gPSBMMSBleHRlbmRzIHVua25vd24gPyBgJHtMMX06JHtLZXlPZjxTW0wxXT59YFxuICAgIDogbmV2ZXI7XG4vLyBFLmcuICdtZXNzYWdlOmVudGl0aWVzOnVybCcgc3VnZ2VzdGlvbnNcbnR5cGUgTDNTPEwxIGV4dGVuZHMgTDFTID0gTDFTPiA9IEwxIGV4dGVuZHMgdW5rbm93biA/IEwzU188TDE+IDogbmV2ZXI7XG50eXBlIEwzU188XG4gICAgTDEgZXh0ZW5kcyBMMVMsXG4gICAgTDIgZXh0ZW5kcyBLZXlPZjxTW0wxXT4gPSBLZXlPZjxTW0wxXT4sXG4+ID0gTDIgZXh0ZW5kcyB1bmtub3duID8gYCR7TDF9OiR7TDJ9OiR7S2V5T2Y8U1tMMV1bTDJdPn1gIDogbmV2ZXI7XG4vLyBTdWdnZXN0aW9ucyBmb3IgYWxsIHRocmVlIGNvbWJpbmVkXG50eXBlIEwxMjMgPSBMMVMgfCBMMlMgfCBMM1M7XG4vLyBFLmcuICdtZXNzYWdlOjp1cmwnIGdlbmVyYXRpb25cbnR5cGUgSW5qZWN0U2hvcnRjdXRzPFEgZXh0ZW5kcyBMMTIzID0gTDEyMz4gPSBRIGV4dGVuZHNcbiAgICBgJHtpbmZlciBMMX06JHtpbmZlciBMMn06JHtpbmZlciBMM31gXG4gICAgPyBgJHtDb2xsYXBzZUwxPEwxLCBMMVNob3J0Y3V0cz59OiR7Q29sbGFwc2VMMjxMMiwgTDJTaG9ydGN1dHM+fToke0wzfWBcbiAgICA6IFEgZXh0ZW5kcyBgJHtpbmZlciBMMX06JHtpbmZlciBMMn1gXG4gICAgICAgID8gYCR7Q29sbGFwc2VMMTxMMSwgTDFTaG9ydGN1dHM+fToke0NvbGxhcHNlTDI8TDI+fWBcbiAgICA6IENvbGxhcHNlTDE8UT47XG4vLyBBZGQgTDEgc2hvcnRjdXRzXG50eXBlIENvbGxhcHNlTDE8XG4gICAgUSBleHRlbmRzIHN0cmluZyxcbiAgICBMIGV4dGVuZHMgTDFTaG9ydGN1dHMgPSBFeGNsdWRlPEwxU2hvcnRjdXRzLCBcIlwiPixcbj4gPVxuICAgIHwgUVxuICAgIHwgKEwgZXh0ZW5kcyBzdHJpbmcgPyBRIGV4dGVuZHMgdHlwZW9mIEwxX1NIT1JUQ1VUU1tMXVtudW1iZXJdID8gTFxuICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXIpO1xuLy8gQWRkIEwyIHNob3J0Y3V0c1xudHlwZSBDb2xsYXBzZUwyPFxuICAgIFEgZXh0ZW5kcyBzdHJpbmcsXG4gICAgTCBleHRlbmRzIEwyU2hvcnRjdXRzID0gRXhjbHVkZTxMMlNob3J0Y3V0cywgXCJcIj4sXG4+ID1cbiAgICB8IFFcbiAgICB8IChMIGV4dGVuZHMgc3RyaW5nID8gUSBleHRlbmRzIHR5cGVvZiBMMl9TSE9SVENVVFNbTF1bbnVtYmVyXSA/IExcbiAgICAgICAgOiBuZXZlclxuICAgICAgICA6IG5ldmVyKTtcbi8vIEFsbCBxdWVyaWVzXG50eXBlIENvbXB1dGVGaWx0ZXJRdWVyeUxpc3QgPSBJbmplY3RTaG9ydGN1dHM7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGZpbHRlciBxdWVyeSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5vbmAuIFRoZXJlIGFyZSB0aHJlZVxuICogZGlmZmVyZW50IGtpbmRzIG9mIGZpbHRlciBxdWVyaWVzOiBMZXZlbCAxLCBMZXZlbCAyLCBhbmQgTGV2ZWwgMy4gQ2hlY2sgb3V0XG4gKiB0aGUgW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9maWx0ZXItcXVlcmllcykgdG8gcmVhZCBhYm91dCBob3dcbiAqIGZpbHRlciBxdWVyaWVzIHdvcmsgaW4gZ3JhbW1ZLCBhbmQgaG93IHRvIHVzZSB0aGVtLlxuICpcbiAqIEhlcmUgYXJlIHRocmVlIGJyaWVmIGV4YW1wbGVzOlxuICogYGBgdHNcbiAqIC8vIExpc3RlbiBmb3IgbWVzc2FnZXMgb2YgYW55IHR5cGUgKExldmVsIDEpXG4gKiBib3Qub24oJ21lc3NhZ2UnLCBjdHggPT4geyAuLi4gfSlcbiAqIC8vIExpc3RlbiBmb3IgYXVkaW8gbWVzc2FnZXMgb25seSAoTGV2ZWwgMilcbiAqIGJvdC5vbignbWVzc2FnZTphdWRpbycsIGN0eCA9PiB7IC4uLiB9KVxuICogLy8gTGlzdGVuIGZvciB0ZXh0IG1lc3NhZ2VzIHRoYXQgaGF2ZSBhIFVSTCBlbnRpdHkgKExldmVsIDMpXG4gKiBib3Qub24oJ21lc3NhZ2U6ZW50aXRpZXM6dXJsJywgY3R4ID0+IHsgLi4uIH0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IHR5cGUgRmlsdGVyUXVlcnkgPSBDb21wdXRlRmlsdGVyUXVlcnlMaXN0O1xuXG4vLyA9PT0gSW5mZXIgdGhlIHByZXNlbnQvYWJzZW50IHByb3BlcnRpZXMgb24gYSBjb250ZXh0IG9iamVjdCBiYXNlZCBvbiBhIHF1ZXJ5XG4vLyBOb3RlOiBMMyBmaWx0ZXJzIGFyZSBub3QgcmVwcmVzZW50ZWQgaW4gdHlwZXNcblxuLyoqXG4gKiBBbnkga2luZCBvZiB2YWx1ZSB0aGF0IGFwcGVhcnMgaW4gdGhlIFRlbGVncmFtIEJvdCBBUEkuIFdoZW4gaW50ZXJzZWN0ZWQgd2l0aFxuICogYW4gb3B0aW9uYWwgZmllbGQsIGl0IGVmZmVjdGl2ZWx5IHJlbW92ZXMgYHwgdW5kZWZpbmVkYC5cbiAqL1xudHlwZSBOb3RVbmRlZmluZWQgPSBzdHJpbmcgfCBudW1iZXIgfCBib29sZWFuIHwgb2JqZWN0O1xuXG4vKipcbiAqIEdpdmVuIGEgRmlsdGVyUXVlcnksIHJldHVybnMgYW4gb2JqZWN0IHRoYXQsIHdoZW4gaW50ZXJzZWN0ZWQgd2l0aCBhbiBVcGRhdGUsXG4gKiBtYXJrcyB0aG9zZSBwcm9wZXJ0aWVzIGFzIHJlcXVpcmVkIHRoYXQgYXJlIGd1YXJhbnRlZWQgdG8gZXhpc3QuXG4gKi9cbnR5cGUgUnVuUXVlcnk8USBleHRlbmRzIHN0cmluZz4gPSBMMURpc2NyaW1pbmF0b3I8USwgTDFQYXJ0czxRPj47XG5cbi8vIGdldHMgYWxsIEwxIHF1ZXJ5IHNuaXBwZXRzXG50eXBlIEwxUGFydHM8USBleHRlbmRzIHN0cmluZz4gPSBRIGV4dGVuZHMgYCR7aW5mZXIgTDF9OiR7c3RyaW5nfWAgPyBMMSA6IFE7XG4vLyBnZXRzIGFsbCBMMiBxdWVyeSBzbmlwcGV0cyBmb3IgdGhlIGdpdmVuIEwxIHBhcnQsIG9yIGBuZXZlcmBcbnR5cGUgTDJQYXJ0czxcbiAgICBRIGV4dGVuZHMgc3RyaW5nLFxuICAgIEwxIGV4dGVuZHMgc3RyaW5nLFxuPiA9IFEgZXh0ZW5kcyBgJHtMMX06JHtpbmZlciBMMn06JHtzdHJpbmd9YCA/IEwyXG4gICAgOiBRIGV4dGVuZHMgYCR7TDF9OiR7aW5mZXIgTDJ9YCA/IEwyXG4gICAgOiBuZXZlcjtcblxuLy8gYnVpbGQgdXAgYWxsIGNvbWJpbmF0aW9ucyBvZiBhbGwgTDEgZmllbGRzXG50eXBlIEwxRGlzY3JpbWluYXRvcjxRIGV4dGVuZHMgc3RyaW5nLCBMMSBleHRlbmRzIHN0cmluZz4gPSBDb21iaW5lPFxuICAgIEwxRnJhZ21lbnQ8USwgTDE+LFxuICAgIEwxXG4+O1xuLy8gbWFwcyBlYWNoIEwxIHBhcnQgb2YgdGhlIGZpbHRlciBxdWVyeSB0byBhbiBvYmplY3RcbnR5cGUgTDFGcmFnbWVudDxRIGV4dGVuZHMgc3RyaW5nLCBMMSBleHRlbmRzIHN0cmluZz4gPSBMMSBleHRlbmRzIHVua25vd25cbiAgICA/IFJlY29yZDxMMSwgTDJEaXNjcmltaW5hdG9yPEwxLCBMMlBhcnRzPFEsIEwxPj4+XG4gICAgOiBuZXZlcjtcblxuLy8gYnVpbGQgdXAgYWxsIGNvbWJpbmF0aW9ucyBvZiBhbGwgTDIgZmllbGRzXG50eXBlIEwyRGlzY3JpbWluYXRvcjxMMSBleHRlbmRzIHN0cmluZywgTDIgZXh0ZW5kcyBzdHJpbmc+ID0gW0wyXSBleHRlbmRzXG4gICAgW25ldmVyXSA/IEwyU2hhbGxvd0ZyYWdtZW50PEwxPiAvLyBzaG9ydC1jaXJjdWl0IEwxIHF1ZXJpZXMgKEwyIGlzIG5ldmVyKSwgb25seSBhZGQgdHdpbnNcbiAgICA6IENvbWJpbmU8TDJGcmFnbWVudDxMMSwgTDI+LCBMMj47XG4vLyBtYXBzIGVhY2ggTDIgcGFydCBvZiB0aGUgZmlsdGVyIHF1ZXJ5IHRvIGFuIG9iamVjdCBhbmQgaGFuZGxlcyBzaWJsaW5nc1xudHlwZSBMMkZyYWdtZW50PEwxIGV4dGVuZHMgc3RyaW5nLCBMMiBleHRlbmRzIHN0cmluZz4gPSBMMiBleHRlbmRzIHVua25vd25cbiAgICA/IFJlY29yZDxMMiB8IEFkZFR3aW5zPEwxLCBMMj4sIE5vdFVuZGVmaW5lZD5cbiAgICA6IG5ldmVyO1xuLy8gZG9lcyB0aGUgc2FtZSBhcyBMMUZyYWdtZW50IGJ1dCB3aXRob3V0IGNvbWJpbmluZyBMMiBwcm9wZXJ0aWVzXG50eXBlIEwyU2hhbGxvd0ZyYWdtZW50PEwxIGV4dGVuZHMgc3RyaW5nPiA9IFJlY29yZDxcbiAgICBBZGRUd2luczxMMSwgbmV2ZXI+LFxuICAgIE5vdFVuZGVmaW5lZFxuPjtcblxuLy8gZGVmaW5lIGFkZGl0aW9uYWwgZmllbGRzIG9uIFUgd2l0aCB2YWx1ZSBgdW5kZWZpbmVkYFxudHlwZSBDb21iaW5lPFUsIEsgZXh0ZW5kcyBzdHJpbmc+ID0gVSBleHRlbmRzIHVua25vd25cbiAgICA/IFUgJiBQYXJ0aWFsPFJlY29yZDxFeGNsdWRlPEssIGtleW9mIFU+LCB1bmRlZmluZWQ+PlxuICAgIDogbmV2ZXI7XG5cbi8qKlxuICogVGhpcyB0eXBlIGluZmVycyB3aGljaCBwcm9wZXJ0aWVzIHdpbGwgYmUgcHJlc2VudCBvbiB0aGUgZ2l2ZW4gY29udGV4dCBvYmplY3RcbiAqIHByb3ZpZGVkIGl0IG1hdGNoZXMgdGhlIGdpdmVuIGZpbHRlciBxdWVyeS4gSWYgdGhlIGZpbHRlciBxdWVyeSBpcyBhIHVuaW9uXG4gKiB0eXBlLCB0aGUgcHJvZHVjZWQgY29udGV4dCBvYmplY3Qgd2lsbCBiZSBhIHVuaW9uIG9mIHBvc3NpYmxlIGNvbWJpbmF0aW9ucyxcbiAqIGhlbmNlIGFsbG93aW5nIHlvdSB0byBuYXJyb3cgZG93biBtYW51YWxseSB3aGljaCBvZiB0aGUgcHJvcGVydGllcyBhcmVcbiAqIHByZXNlbnQuXG4gKlxuICogSW4gc29tZSBzZW5zZSwgdGhpcyB0eXBlIGNvbXB1dGVzIGBtYXRjaEZpbHRlcmAgb24gdGhlIHR5cGUgbGV2ZWwuXG4gKi9cbmV4cG9ydCB0eXBlIEZpbHRlcjxDIGV4dGVuZHMgQ29udGV4dCwgUSBleHRlbmRzIEZpbHRlclF1ZXJ5PiA9IFBlcmZvcm1RdWVyeTxcbiAgICBDLFxuICAgIFJ1blF1ZXJ5PEV4cGFuZFNob3J0Y3V0czxRPj5cbj47XG4vLyBzYW1lIGFzIEZpbHRlciBidXQgc3RvcCBiZWZvcmUgaW50ZXJzZWN0aW5nIHdpdGggQ29udGV4dFxuZXhwb3J0IHR5cGUgRmlsdGVyQ29yZTxRIGV4dGVuZHMgRmlsdGVyUXVlcnk+ID0gUGVyZm9ybVF1ZXJ5Q29yZTxcbiAgICBSdW5RdWVyeTxFeHBhbmRTaG9ydGN1dHM8UT4+XG4+O1xuXG4vLyBhcHBseSBhIHF1ZXJ5IHJlc3VsdCBieSBpbnRlcnNlY3RpbmcgaXQgd2l0aCBVcGRhdGUsIGFuZCB0aGVuIGluamVjdGluZyBpbnRvIENcbnR5cGUgUGVyZm9ybVF1ZXJ5PEMgZXh0ZW5kcyBDb250ZXh0LCBVIGV4dGVuZHMgb2JqZWN0PiA9IFUgZXh0ZW5kcyB1bmtub3duXG4gICAgPyBGaWx0ZXJlZENvbnRleHQ8QywgVXBkYXRlICYgVT5cbiAgICA6IG5ldmVyO1xudHlwZSBQZXJmb3JtUXVlcnlDb3JlPFUgZXh0ZW5kcyBvYmplY3Q+ID0gVSBleHRlbmRzIHVua25vd25cbiAgICA/IEZpbHRlcmVkQ29udGV4dENvcmU8VXBkYXRlICYgVT5cbiAgICA6IG5ldmVyO1xuXG4vLyBzZXQgdGhlIGdpdmVuIHVwZGF0ZSBpbnRvIGEgZ2l2ZW4gY29udGV4dCBvYmplY3QsIGFuZCBhZGp1c3QgdGhlIGFsaWFzZXNcbnR5cGUgRmlsdGVyZWRDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0LCBVIGV4dGVuZHMgVXBkYXRlPiA9XG4gICAgJiBDXG4gICAgJiBGaWx0ZXJlZENvbnRleHRDb3JlPFU+O1xuXG4vLyBnZW5lcmF0ZSBhIHN0cnVjdHVyZSB3aXRoIGFsbCBhbGlhc2VzIGZvciBhIG5hcnJvd2VkIHVwZGF0ZVxudHlwZSBGaWx0ZXJlZENvbnRleHRDb3JlPFUgZXh0ZW5kcyBVcGRhdGU+ID1cbiAgICAmIFJlY29yZDxcInVwZGF0ZVwiLCBVPlxuICAgICYgU2hvcnRjdXRzPFU+O1xuXG4vLyBoZWxwZXIgdHlwZSB0byBpbmZlciBzaG9ydGN1dHMgb24gY29udGV4dCBvYmplY3QgYmFzZWQgb24gcHJlc2VudCBwcm9wZXJ0aWVzLFxuLy8gbXVzdCBiZSBpbiBzeW5jIHdpdGggc2hvcnRjdXQgaW1wbCFcbmludGVyZmFjZSBTaG9ydGN1dHM8VSBleHRlbmRzIFVwZGF0ZT4ge1xuICAgIG1lc3NhZ2U6IFtVW1wibWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJtZXNzYWdlXCJdIDogdW5kZWZpbmVkO1xuICAgIGVkaXRlZE1lc3NhZ2U6IFtVW1wiZWRpdGVkX21lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiZWRpdGVkX21lc3NhZ2VcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hhbm5lbFBvc3Q6IFtVW1wiY2hhbm5lbF9wb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNoYW5uZWxfcG9zdFwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBlZGl0ZWRDaGFubmVsUG9zdDogW1VbXCJlZGl0ZWRfY2hhbm5lbF9wb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcImVkaXRlZF9jaGFubmVsX3Bvc3RcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgYnVzaW5lc3NDb25uZWN0aW9uOiBbVVtcImJ1c2luZXNzX2Nvbm5lY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBidXNpbmVzc01lc3NhZ2U6IFtVW1wiYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJidXNpbmVzc19tZXNzYWdlXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGVkaXRlZEJ1c2luZXNzTWVzc2FnZTogW1VbXCJlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBkZWxldGVkQnVzaW5lc3NNZXNzYWdlczogW1VbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcImRlbGV0ZWRfYnVzaW5lc3NfbWVzc2FnZXNcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbWVzc2FnZVJlYWN0aW9uOiBbVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wibWVzc2FnZV9yZWFjdGlvblwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBtZXNzYWdlUmVhY3Rpb25Db3VudDogW1VbXCJtZXNzYWdlX3JlYWN0aW9uX2NvdW50XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25fY291bnRcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgaW5saW5lUXVlcnk6IFtVW1wiaW5saW5lX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImlubGluZV9xdWVyeVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaG9zZW5JbmxpbmVSZXN1bHQ6IFtVW1wiY2hvc2VuX2lubGluZV9yZXN1bHRcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiY2hvc2VuX2lubGluZV9yZXN1bHRcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2FsbGJhY2tRdWVyeTogW1VbXCJjYWxsYmFja19xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjYWxsYmFja19xdWVyeVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBzaGlwcGluZ1F1ZXJ5OiBbVVtcInNoaXBwaW5nX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcInNoaXBwaW5nX3F1ZXJ5XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHByZUNoZWNrb3V0UXVlcnk6IFtVW1wicHJlX2NoZWNrb3V0X3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcInByZV9jaGVja291dF9xdWVyeVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBwb2xsOiBbVVtcInBvbGxcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wicG9sbFwiXSA6IHVuZGVmaW5lZDtcbiAgICBwb2xsQW5zd2VyOiBbVVtcInBvbGxfYW5zd2VyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcInBvbGxfYW5zd2VyXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG15Q2hhdE1lbWJlcjogW1VbXCJteV9jaGF0X21lbWJlclwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJteV9jaGF0X21lbWJlclwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaGF0TWVtYmVyOiBbVVtcImNoYXRfbWVtYmVyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNoYXRfbWVtYmVyXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNoYXRKb2luUmVxdWVzdDogW1VbXCJjaGF0X2pvaW5fcmVxdWVzdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJjaGF0X2pvaW5fcmVxdWVzdFwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaGF0Qm9vc3Q6IFtVW1wiY2hhdF9ib29zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGF0X2Jvb3N0XCJdIDogdW5kZWZpbmVkO1xuICAgIHJlbW92ZWRDaGF0Qm9vc3Q6IFtVW1wicmVtb3ZlZF9jaGF0X2Jvb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcInJlbW92ZWRfY2hhdF9ib29zdFwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBwdXJjaGFzZWRQYWlkTWVkaWE6IFtVW1wicHVyY2hhc2VkX3BhaWRfbWVkaWFcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wicHVyY2hhc2VkX3BhaWRfbWVkaWFcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbXNnOiBbVVtcIm1lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wibWVzc2FnZVwiXVxuICAgICAgICA6IFtVW1wiZWRpdGVkX21lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiZWRpdGVkX21lc3NhZ2VcIl1cbiAgICAgICAgOiBbVVtcImNoYW5uZWxfcG9zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGFubmVsX3Bvc3RcIl1cbiAgICAgICAgOiBbVVtcImVkaXRlZF9jaGFubmVsX3Bvc3RcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiZWRpdGVkX2NoYW5uZWxfcG9zdFwiXVxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJidXNpbmVzc19tZXNzYWdlXCJdXG4gICAgICAgIDogW1VbXCJlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIl1cbiAgICAgICAgOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJjYWxsYmFja19xdWVyeVwiXVtcIm1lc3NhZ2VcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hhdDogW1VbXCJjYWxsYmFja19xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IE5vbk51bGxhYmxlPFVbXCJjYWxsYmFja19xdWVyeVwiXVtcIm1lc3NhZ2VcIl0+W1wiY2hhdFwiXSB8IHVuZGVmaW5lZFxuICAgICAgICA6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogW1VbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wibWVzc2FnZV9yZWFjdGlvblwiXVtcImNoYXRcIl1cbiAgICAgICAgOiBbVVtcIm1lc3NhZ2VfcmVhY3Rpb25fY291bnRcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25fY291bnRcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogW1VbXCJteV9jaGF0X21lbWJlclwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJteV9jaGF0X21lbWJlclwiXVtcImNoYXRcIl1cbiAgICAgICAgOiBbVVtcImNoYXRfbWVtYmVyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNoYXRfbWVtYmVyXCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcImNoYXRfam9pbl9yZXF1ZXN0XCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9ib29zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGF0X2Jvb3N0XCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wicmVtb3ZlZF9jaGF0X2Jvb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJyZW1vdmVkX2NoYXRfYm9vc3RcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHNlbmRlckNoYXQ6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJzZW5kZXJfY2hhdFwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBmcm9tOiBbVVtcImJ1c2luZXNzX2Nvbm5lY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXVtcInVzZXJcIl1cbiAgICAgICAgOiBbVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1bXCJ1c2VyXCJdXG4gICAgICAgIDogW1VbXCJjaGF0X2Jvb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJjaGF0X2Jvb3N0XCJdW1wiYm9vc3RcIl1bXCJzb3VyY2VcIl1bXCJ1c2VyXCJdXG4gICAgICAgIDogW1VbXCJyZW1vdmVkX2NoYXRfYm9vc3RcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcInJlbW92ZWRfY2hhdF9ib29zdFwiXVtcInNvdXJjZVwiXVtcInVzZXJcIl1cbiAgICAgICAgOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNhbGxiYWNrX3F1ZXJ5XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJpbmxpbmVfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiaW5saW5lX3F1ZXJ5XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wiY2hvc2VuX2lubGluZV9yZXN1bHRcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wic2hpcHBpbmdfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wic2hpcHBpbmdfcXVlcnlcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJwcmVfY2hlY2tvdXRfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcInByZV9jaGVja291dF9xdWVyeVwiXVtcImZyb21cIl1cbiAgICAgICAgOiBbVVtcIm15X2NoYXRfbWVtYmVyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcIm15X2NoYXRfbWVtYmVyXCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9tZW1iZXJcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiY2hhdF9tZW1iZXJcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJjaGF0X2pvaW5fcmVxdWVzdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1zZ0lkOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICAgIDogW1Nob3J0Y3V0czxVPltcIm1zZ1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvbl9jb3VudFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaGF0SWQ6IFtVW1wiY2FsbGJhY2tfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICAgICAgOiBbU2hvcnRjdXRzPFU+W1wiY2hhdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAvLyBpbmxpbmVNZXNzYWdlSWQ6IGRpc3JlZ2FyZGVkIGhlcmUgYmVjYXVzZSBhbHdheXMgb3B0aW9uYWwgb24gYm90aCB0eXBlc1xuICAgIGJ1c2luZXNzQ29ubmVjdGlvbklkOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgICAgIDogW1Nob3J0Y3V0czxVPltcIm1zZ1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZ1xuICAgICAgICA6IFtVW1wiZGVsZXRlZF9idXNpbmVzc19tZXNzYWdlc1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZ1xuICAgICAgICA6IHVuZGVmaW5lZDtcbn1cblxuLy8gPT09IERlZmluZSBzb21lIGhlbHBlcnMgZm9yIGhhbmRsaW5nIHNob3J0Y3V0cywgZS5nLiBpbiAnZWRpdDpwaG90bydcbmNvbnN0IEwxX1NIT1JUQ1VUUyA9IHtcbiAgICBcIlwiOiBbXCJtZXNzYWdlXCIsIFwiY2hhbm5lbF9wb3N0XCJdLFxuICAgIG1zZzogW1wibWVzc2FnZVwiLCBcImNoYW5uZWxfcG9zdFwiXSxcbiAgICBlZGl0OiBbXCJlZGl0ZWRfbWVzc2FnZVwiLCBcImVkaXRlZF9jaGFubmVsX3Bvc3RcIl0sXG59IGFzIGNvbnN0O1xuY29uc3QgTDJfU0hPUlRDVVRTID0ge1xuICAgIFwiXCI6IFtcImVudGl0aWVzXCIsIFwiY2FwdGlvbl9lbnRpdGllc1wiXSxcbiAgICBtZWRpYTogW1wicGhvdG9cIiwgXCJ2aWRlb1wiXSxcbiAgICBmaWxlOiBbXG4gICAgICAgIFwicGhvdG9cIixcbiAgICAgICAgXCJhbmltYXRpb25cIixcbiAgICAgICAgXCJhdWRpb1wiLFxuICAgICAgICBcImRvY3VtZW50XCIsXG4gICAgICAgIFwidmlkZW9cIixcbiAgICAgICAgXCJ2aWRlb19ub3RlXCIsXG4gICAgICAgIFwidm9pY2VcIixcbiAgICAgICAgXCJzdGlja2VyXCIsXG4gICAgXSxcbn0gYXMgY29uc3Q7XG50eXBlIEwxU2hvcnRjdXRzID0gS2V5T2Y8dHlwZW9mIEwxX1NIT1JUQ1VUUz47XG50eXBlIEwyU2hvcnRjdXRzID0gS2V5T2Y8dHlwZW9mIEwyX1NIT1JUQ1VUUz47XG5cbnR5cGUgRXhwYW5kU2hvcnRjdXRzPFEgZXh0ZW5kcyBzdHJpbmc+ID0gUSBleHRlbmRzXG4gICAgYCR7aW5mZXIgTDF9OiR7aW5mZXIgTDJ9OiR7aW5mZXIgTDN9YFxuICAgID8gYCR7RXhwYW5kTDE8TDE+fToke0V4cGFuZEwyPEwyPn06JHtMM31gXG4gICAgOiBRIGV4dGVuZHMgYCR7aW5mZXIgTDF9OiR7aW5mZXIgTDJ9YCA/IGAke0V4cGFuZEwxPEwxPn06JHtFeHBhbmRMMjxMMj59YFxuICAgIDogRXhwYW5kTDE8UT47XG50eXBlIEV4cGFuZEwxPFMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIEwxU2hvcnRjdXRzXG4gICAgPyB0eXBlb2YgTDFfU0hPUlRDVVRTW1NdW251bWJlcl1cbiAgICA6IFM7XG50eXBlIEV4cGFuZEwyPFMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIEwyU2hvcnRjdXRzXG4gICAgPyB0eXBlb2YgTDJfU0hPUlRDVVRTW1NdW251bWJlcl1cbiAgICA6IFM7XG5cbi8vID09PSBEZWZpbmUgc29tZSBoZWxwZXJzIGZvciB3aGVuIG9uZSBwcm9wZXJ0eSBpbXBsaWVzIHRoZSBleGlzdGVuY2Ugb2Ygb3RoZXJzXG5cbi8vIG1lcmdlcyB0d2lucyBiYXNlZCBvbiBMMSB3aXRoIHRob3NlIGJhc2VkIG9uIEwxIGFuZCBMMlxudHlwZSBBZGRUd2luczxMMSBleHRlbmRzIHN0cmluZywgTDIgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgICB8IFR3aW5zRnJvbUwxPEwxLCBMMj5cbiAgICB8IFR3aW5zRnJvbUwyPEwxLCBMMj47XG5cbi8vIHlpZWxkcyB0d2lucyBiYXNlZCBvbiBhIGdpdmVuIEwxIHByb3BlcnR5XG50eXBlIFR3aW5zRnJvbUwxPEwxIGV4dGVuZHMgc3RyaW5nLCBMMiBleHRlbmRzIHN0cmluZz4gPSBMMSBleHRlbmRzXG4gICAgS2V5T2Y8TDFFcXVpdmFsZW50cz4gPyBMMUVxdWl2YWxlbnRzW0wxXVxuICAgIDogTDI7XG50eXBlIEwxRXF1aXZhbGVudHMgPSB7XG4gICAgbWVzc2FnZTogXCJmcm9tXCI7XG4gICAgZWRpdGVkX21lc3NhZ2U6IFwiZnJvbVwiIHwgXCJlZGl0X2RhdGVcIjtcbiAgICBjaGFubmVsX3Bvc3Q6IFwic2VuZGVyX2NoYXRcIjtcbiAgICBlZGl0ZWRfY2hhbm5lbF9wb3N0OiBcInNlbmRlcl9jaGF0XCIgfCBcImVkaXRfZGF0ZVwiO1xuICAgIGJ1c2luZXNzX21lc3NhZ2U6IFwiZnJvbVwiO1xuICAgIGVkaXRlZF9idXNpbmVzc19tZXNzYWdlOiBcImZyb21cIiB8IFwiZWRpdF9kYXRlXCI7XG59O1xuXG4vLyB5aWVsZHMgdHdpbnMgYmFzZWQgb24gZ2l2ZW4gTDEgYW5kIEwyIHByb3BlcnRpZXNcbnR5cGUgVHdpbnNGcm9tTDI8TDEgZXh0ZW5kcyBzdHJpbmcsIEwyIGV4dGVuZHMgc3RyaW5nPiA9IEwxIGV4dGVuZHNcbiAgICBLZXlPZjxMMkVxdWl2YWxlbnRzPlxuICAgID8gTDIgZXh0ZW5kcyBLZXlPZjxMMkVxdWl2YWxlbnRzW0wxXT4gPyBMMkVxdWl2YWxlbnRzW0wxXVtMMl0gOiBMMlxuICAgIDogTDI7XG50eXBlIEwyRXF1aXZhbGVudHMgPSB7XG4gICAgbWVzc2FnZTogTWVzc2FnZUVxdWl2YWxlbnRzO1xuICAgIGVkaXRlZF9tZXNzYWdlOiBNZXNzYWdlRXF1aXZhbGVudHM7XG4gICAgY2hhbm5lbF9wb3N0OiBNZXNzYWdlRXF1aXZhbGVudHM7XG4gICAgZWRpdGVkX2NoYW5uZWxfcG9zdDogTWVzc2FnZUVxdWl2YWxlbnRzO1xuICAgIGJ1c2luZXNzX21lc3NhZ2U6IE1lc3NhZ2VFcXVpdmFsZW50cztcbiAgICBlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZTogTWVzc2FnZUVxdWl2YWxlbnRzO1xufTtcbnR5cGUgTWVzc2FnZUVxdWl2YWxlbnRzID0ge1xuICAgIGFuaW1hdGlvbjogXCJkb2N1bWVudFwiO1xuICAgIGVudGl0aWVzOiBcInRleHRcIjtcbiAgICBjYXB0aW9uX2VudGl0aWVzOiBcImNhcHRpb25cIjtcbiAgICBpc190b3BpY19tZXNzYWdlOiBcIm1lc3NhZ2VfdGhyZWFkX2lk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