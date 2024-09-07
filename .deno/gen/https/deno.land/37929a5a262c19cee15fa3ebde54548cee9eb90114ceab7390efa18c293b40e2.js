// deno-lint-ignore-file camelcase
import { createRawApi } from "./client.ts";
/**
 * This class provides access to the full Telegram Bot API. All methods of the
 * API have an equivalent on this class, with the most important parameters
 * pulled up into the function signature, and the other parameters captured by
 * an object.
 *
 * In addition, this class has a property `raw` that provides raw access to the
 * complete Telegram API, with the method signatures 1:1 represented as
 * documented on the website (https://core.telegram.org/bots/api).
 *
 * Every method takes an optional `AbortSignal` object that allows you to cancel
 * the request if desired.
 *
 * In advanced use cases, this class allows to install transformers that can
 * modify the method and payload on the fly before sending it to the Telegram
 * servers. Confer the `config` property for this.
 */ export class Api {
  token;
  options;
  /**
     * Provides access to all methods of the Telegram Bot API exactly as
     * documented on the website (https://core.telegram.org/bots/api). No
     * arguments are pulled up in the function signature for convenience.
     *
     * If you suppress compiler warnings, this also allows for raw api calls to
     * undocumented methods with arbitrary parameters—use only if you know what
     * you are doing.
     */ raw;
  /**
     * Configuration object for the API instance, used as a namespace to
     * separate those API operations that are related to grammY from methods of
     * the Telegram Bot API. Contains advanced options!
     */ config;
  /**
     * Constructs a new instance of `Api`. It is independent from all other
     * instances of this class. For example, this lets you install a custom set
     * if transformers.
     *
     * @param token Bot API token obtained from [@BotFather](https://t.me/BotFather)
     * @param options Optional API client options for the underlying client instance
     * @param webhookReplyEnvelope Optional envelope to handle webhook replies
     */ constructor(token, options, webhookReplyEnvelope){
    this.token = token;
    this.options = options;
    const { raw, use, installedTransformers } = createRawApi(token, options, webhookReplyEnvelope);
    this.raw = raw;
    this.config = {
      use,
      installedTransformers: ()=>installedTransformers.slice()
    };
  }
  /**
     * Use this method to receive incoming updates using long polling (wiki). Returns an Array of Update objects.
     *
     * Notes
     * 1. This method will not work if an outgoing webhook is set up.
     * 2. In order to avoid getting duplicate updates, recalculate offset after each server response.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getupdates
     */ getUpdates(other, signal) {
    return this.raw.getUpdates({
      ...other
    }, signal);
  }
  /**
     * Use this method to specify a URL and receive incoming updates via an outgoing webhook. Whenever there is an update for the bot, we will send an HTTPS POST request to the specified URL, containing a JSON-serialized Update. In case of an unsuccessful request, we will give up after a reasonable amount of attempts. Returns True on success.
     *
     * If you'd like to make sure that the webhook was set by you, you can specify secret data in the parameter secret_token. If specified, the request will contain a header “X-Telegram-Bot-Api-Secret-Token” with the secret token as content.
     *
     * Notes
     * 1. You will not be able to receive updates using getUpdates for as long as an outgoing webhook is set up.
     * 2. To use a self-signed certificate, you need to upload your public key certificate using certificate parameter. Please upload as InputFile, sending a String will not work.
     * 3. Ports currently supported for Webhooks: 443, 80, 88, 8443.
     *
     * If you're having any trouble setting up webhooks, please check out this amazing guide to webhooks.
     *
     * @param url HTTPS url to send updates to. Use an empty string to remove webhook integration
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setwebhook
     */ setWebhook(url, other, signal) {
    return this.raw.setWebhook({
      url,
      ...other
    }, signal);
  }
  /**
     * Use this method to remove webhook integration if you decide to switch back to getUpdates. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletewebhook
     */ deleteWebhook(other, signal) {
    return this.raw.deleteWebhook({
      ...other
    }, signal);
  }
  /**
     * Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getwebhookinfo
     */ getWebhookInfo(signal) {
    return this.raw.getWebhookInfo(signal);
  }
  /**
     * A simple method for testing your bot's authentication token. Requires no parameters. Returns basic information about the bot in form of a User object.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getme
     */ getMe(signal) {
    return this.raw.getMe(signal);
  }
  /**
     * Use this method to log out from the cloud Bot API server before launching the bot locally. You must log out the bot before running it locally, otherwise there is no guarantee that the bot will receive updates. After a successful call, you can immediately log in on a local server, but will not be able to log in back to the cloud Bot API server for 10 minutes. Returns True on success. Requires no parameters.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#logout
     */ logOut(signal) {
    return this.raw.logOut(signal);
  }
  /**
     * Use this method to close the bot instance before moving it from one local server to another. You need to delete the webhook before calling this method to ensure that the bot isn't launched again after server restart. The method will return error 429 in the first 10 minutes after the bot is launched. Returns True on success. Requires no parameters.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#close
     */ close(signal) {
    return this.raw.close(signal);
  }
  /**
     * Use this method to send text messages. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param text Text of the message to be sent, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmessage
     */ sendMessage(chat_id, text, other, signal) {
    return this.raw.sendMessage({
      chat_id,
      text,
      ...other
    }, signal);
  }
  /**
     * Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
     * @param message_id Message identifier in the chat specified in from_chat_id
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessage
     */ forwardMessage(chat_id, from_chat_id, message_id, other, signal) {
    return this.raw.forwardMessage({
      chat_id,
      from_chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessages
     */ forwardMessages(chat_id, from_chat_id, message_ids, other, signal) {
    return this.raw.forwardMessages({
      chat_id,
      from_chat_id,
      message_ids,
      ...other
    }, signal);
  }
  /**
     * Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
     * @param message_id Message identifier in the chat specified in from_chat_id
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessage
     */ copyMessage(chat_id, from_chat_id, message_id, other, signal) {
    return this.raw.copyMessage({
      chat_id,
      from_chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessages
     */ copyMessages(chat_id, from_chat_id, message_ids, other, signal) {
    return this.raw.copyMessages({
      chat_id,
      from_chat_id,
      message_ids,
      ...other
    }, signal);
  }
  /**
     * Use this method to send photos. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendphoto
     */ sendPhoto(chat_id, photo, other, signal) {
    return this.raw.sendPhoto({
      chat_id,
      photo,
      ...other
    }, signal);
  }
  /**
     * Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
     *
     * For sending voice messages, use the sendVoice method instead.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendaudio
     */ sendAudio(chat_id, audio, other, signal) {
    return this.raw.sendAudio({
      chat_id,
      audio,
      ...other
    }, signal);
  }
  /**
     * Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddocument
     */ sendDocument(chat_id, document, other, signal) {
    return this.raw.sendDocument({
      chat_id,
      document,
      ...other
    }, signal);
  }
  /**
     * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param video Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideo
     */ sendVideo(chat_id, video, other, signal) {
    return this.raw.sendVideo({
      chat_id,
      video,
      ...other
    }, signal);
  }
  /**
     * Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param animation Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendanimation
     */ sendAnimation(chat_id, animation, other, signal) {
    return this.raw.sendAnimation({
      chat_id,
      animation,
      ...other
    }, signal);
  }
  /**
     * Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvoice
     */ sendVoice(chat_id, voice, other, signal) {
    return this.raw.sendVoice({
      chat_id,
      voice,
      ...other
    }, signal);
  }
  /**
     * Use this method to send video messages. On success, the sent Message is returned.
     * As of v.4.0, Telegram clients support rounded square mp4 videos of up to 1 minute long.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param video_note Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideonote
     */ sendVideoNote(chat_id, video_note, other, signal) {
    return this.raw.sendVideoNote({
      chat_id,
      video_note,
      ...other
    }, signal);
  }
  /**
     * Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Messages that were sent is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param media An array describing messages to be sent, must include 2-10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmediagroup
     */ sendMediaGroup(chat_id, media, other, signal) {
    return this.raw.sendMediaGroup({
      chat_id,
      media,
      ...other
    }, signal);
  }
  /**
     * Use this method to send point on the map. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendlocation
     */ sendLocation(chat_id, latitude, longitude, other, signal) {
    return this.raw.sendLocation({
      chat_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocation(chat_id, message_id, latitude, longitude, other, signal) {
    return this.raw.editMessageLiveLocation({
      chat_id,
      message_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit live location inline messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param inline_message_id Identifier of the inline message
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocationInline(inline_message_id, latitude, longitude, other, signal) {
    return this.raw.editMessageLiveLocation({
      inline_message_id,
      latitude,
      longitude,
      ...other
    }, signal);
  }
  /**
     * Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message with live location to stop
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocation(chat_id, message_id, other, signal) {
    return this.raw.stopMessageLiveLocation({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocationInline(inline_message_id, other, signal) {
    return this.raw.stopMessageLiveLocation({
      inline_message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to send paid media. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param star_count The number of Telegram Stars that must be paid to buy access to the media
     * @param media An array describing the media to be sent; up to 10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpaidmedia
     */ sendPaidMedia(chat_id, star_count, media, other, signal) {
    return this.raw.sendPaidMedia({
      chat_id,
      star_count,
      media,
      ...other
    }, signal);
  }
  /**
     * Use this method to send information about a venue. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param latitude Latitude of the venue
     * @param longitude Longitude of the venue
     * @param title Name of the venue
     * @param address Address of the venue
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvenue
     */ sendVenue(chat_id, latitude, longitude, title, address, other, signal) {
    return this.raw.sendVenue({
      chat_id,
      latitude,
      longitude,
      title,
      address,
      ...other
    }, signal);
  }
  /**
     * Use this method to send phone contacts. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendcontact
     */ sendContact(chat_id, phone_number, first_name, other, signal) {
    return this.raw.sendContact({
      chat_id,
      phone_number,
      first_name,
      ...other
    }, signal);
  }
  /**
     * Use this method to send a native poll. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param question Poll question, 1-300 characters
     * @param options A list of answer options, 2-10 strings 1-100 characters each
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpoll
     */ sendPoll(chat_id, question, options, other, signal) {
    return this.raw.sendPoll({
      chat_id,
      question,
      options,
      ...other
    }, signal);
  }
  /**
     * Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param emoji Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, “🎳”, or “🎰”. Dice can have values 1-6 for “🎲”, “🎯” and “🎳”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲”
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */ sendDice(chat_id, emoji, other, signal) {
    return this.raw.sendDice({
      chat_id,
      emoji,
      ...other
    }, signal);
  }
  /**
     * Use this method to change the chosen reactions on a message. Service messages can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. Bots can't use paid reactions. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the target message
     * @param reaction A list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators. Paid reactions can't be used by bots.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmessagereaction
     */ setMessageReaction(chat_id, message_id, reaction, other, signal) {
    return this.raw.setMessageReaction({
      chat_id,
      message_id,
      reaction,
      ...other
    }, signal);
  }
  /**
     * Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success.
     *
     * Example: The ImageBot needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use sendChatAction with action = upload_photo. The user will see a “sending photo” status for the bot.
     *
     * We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param action Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendchataction
     */ sendChatAction(chat_id, action, other, signal) {
    return this.raw.sendChatAction({
      chat_id,
      action,
      ...other
    }, signal);
  }
  /**
     * Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserprofilephotos
     */ getUserProfilePhotos(user_id, other, signal) {
    return this.raw.getUserProfilePhotos({
      user_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
     *
     * @param chat_id Unique identifier for the chat or username of the channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserchatboosts
     */ getUserChatBoosts(chat_id, user_id, signal) {
    return this.raw.getUserChatBoosts({
      chat_id,
      user_id
    }, signal);
  }
  /**
     * Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
     *
     * @param business_connection_id Unique identifier of the business connection
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getbusinessconnection
     */ getBusinessConnection(business_connection_id, signal) {
    return this.raw.getBusinessConnection({
      business_connection_id
    }, signal);
  }
  /**
     * Use this method to get basic info about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a File object is returned. The file can then be downloaded via the link `https://api.telegram.org/file/bot<token>/<file_path>`, where `<file_path>` is taken from the response. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile again.
     *
     * Note: This function may not preserve the original file name and MIME type. You should save the file's MIME type and name (if available) when the File object is received.
     *
     * @param file_id File identifier to get info about
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getfile
     */ getFile(file_id, signal) {
    return this.raw.getFile({
      file_id
    }, signal);
  }
  /** @deprecated Use `banChatMember` instead. */ kickChatMember(...args) {
    return this.banChatMember(...args);
  }
  /**
     * Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banChatMember(chat_id, user_id, other, signal) {
    return this.raw.banChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
     *
     * @param chat_id Unique identifier for the target group or username of the target supergroup or channel (in the format @username)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatmember
     */ unbanChatMember(chat_id, user_id, other, signal) {
    return this.raw.unbanChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param user_id Unique identifier of the target user
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictChatMember(chat_id, user_id, permissions, other, signal) {
    return this.raw.restrictChatMember({
      chat_id,
      user_id,
      permissions,
      ...other
    }, signal);
  }
  /**
     * Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteChatMember(chat_id, user_id, other, signal) {
    return this.raw.promoteChatMember({
      chat_id,
      user_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param user_id Unique identifier of the target user
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorCustomTitle(chat_id, user_id, custom_title, signal) {
    return this.raw.setChatAdministratorCustomTitle({
      chat_id,
      user_id,
      custom_title
    }, signal);
  }
  /**
     * Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatsenderchat
     */ banChatSenderChat(chat_id, sender_chat_id, signal) {
    return this.raw.banChatSenderChat({
      chat_id,
      sender_chat_id
    }, signal);
  }
  /**
     * Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatsenderchat
     */ unbanChatSenderChat(chat_id, sender_chat_id, signal) {
    return this.raw.unbanChatSenderChat({
      chat_id,
      sender_chat_id
    }, signal);
  }
  /**
     * Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param permissions New default chat permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatpermissions
     */ setChatPermissions(chat_id, permissions, other, signal) {
    return this.raw.setChatPermissions({
      chat_id,
      permissions,
      ...other
    }, signal);
  }
  /**
     * Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success.
     *
     * Note: Each administrator in a chat generates their own invite links. Bots can't use invite links generated by other administrators. If you want your bot to work with invite links, it will need to generate its own link using exportChatInviteLink or by calling the getChat method. If your bot needs to generate a new primary invite link replacing its previous one, use exportChatInviteLink again.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#exportchatinvitelink
     */ exportChatInviteLink(chat_id, signal) {
    return this.raw.exportChatInviteLink({
      chat_id
    }, signal);
  }
  /**
     * Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatinvitelink
     */ createChatInviteLink(chat_id, other, signal) {
    return this.raw.createChatInviteLink({
      chat_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatinvitelink
     */ editChatInviteLink(chat_id, invite_link, other, signal) {
    return this.raw.editChatInviteLink({
      chat_id,
      invite_link,
      ...other
    }, signal);
  }
  /**
     * Use this method to create a subscription invite link for a channel chat. The bot must have the can_invite_users administrator rights. The link can be edited using the method editChatSubscriptionInviteLink or revoked using the method revokeChatInviteLink. Returns the new invite link as a ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target channel chat or username of the target channel (in the format @channelusername)
     * @param subscription_period The number of seconds the subscription will be active for before the next payment. Currently, it must always be 2592000 (30 days).
     * @param subscription_price The amount of Telegram Stars a user must pay initially and after each subsequent subscription period to be a member of the chat; 1-2500
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatsubscriptioninvitelink
     */ createChatSubscriptionInviteLink(chat_id, subscription_period, subscription_price, other, signal) {
    return this.raw.createChatSubscriptionInviteLink({
      chat_id,
      subscription_period,
      subscription_price,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit a subscription invite link created by the bot. The bot must have the can_invite_users administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatsubscriptioninvitelink
     */ editChatSubscriptionInviteLink(chat_id, invite_link, other, signal) {
    return this.raw.editChatSubscriptionInviteLink({
      chat_id,
      invite_link,
      ...other
    }, signal);
  }
  /**
     * Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object.
     *
     * @param chat_id Unique identifier of the target chat or username of the target channel (in the format @channelusername)
     * @param invite_link The invite link to revoke
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#revokechatinvitelink
     */ revokeChatInviteLink(chat_id, invite_link, signal) {
    return this.raw.revokeChatInviteLink({
      chat_id,
      invite_link
    }, signal);
  }
  /**
     * Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#approvechatjoinrequest
     */ approveChatJoinRequest(chat_id, user_id, signal) {
    return this.raw.approveChatJoinRequest({
      chat_id,
      user_id
    }, signal);
  }
  /**
     * Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#declinechatjoinrequest
     */ declineChatJoinRequest(chat_id, user_id, signal) {
    return this.raw.declineChatJoinRequest({
      chat_id,
      user_id
    }, signal);
  }
  /**
     * Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param photo New chat photo, uploaded using multipart/form-data
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatphoto
     */ setChatPhoto(chat_id, photo, signal) {
    return this.raw.setChatPhoto({
      chat_id,
      photo
    }, signal);
  }
  /**
     * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatphoto
     */ deleteChatPhoto(chat_id, signal) {
    return this.raw.deleteChatPhoto({
      chat_id
    }, signal);
  }
  /**
     * Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param title New chat title, 1-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchattitle
     */ setChatTitle(chat_id, title, signal) {
    return this.raw.setChatTitle({
      chat_id,
      title
    }, signal);
  }
  /**
     * Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param description New chat description, 0-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatdescription
     */ setChatDescription(chat_id, description, signal) {
    return this.raw.setChatDescription({
      chat_id,
      description
    }, signal);
  }
  /**
     * Use this method to add a message to the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of a message to pin
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#pinchatmessage
     */ pinChatMessage(chat_id, message_id, other, signal) {
    return this.raw.pinChatMessage({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to remove a message from the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinchatmessage
     */ unpinChatMessage(chat_id, message_id, signal) {
    return this.raw.unpinChatMessage({
      chat_id,
      message_id
    }, signal);
  }
  /**
     * Use this method to clear the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallchatmessages
     */ unpinAllChatMessages(chat_id, signal) {
    return this.raw.unpinAllChatMessages({
      chat_id
    }, signal);
  }
  /**
     * Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#leavechat
     */ leaveChat(chat_id, signal) {
    return this.raw.leaveChat({
      chat_id
    }, signal);
  }
  /**
     * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.). Returns a Chat object on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchat
     */ getChat(chat_id, signal) {
    return this.raw.getChat({
      chat_id
    }, signal);
  }
  /**
     * Use this method to get a list of administrators in a chat, which aren't bots. Returns an Array of ChatMember objects.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatadministrators
     */ getChatAdministrators(chat_id, signal) {
    return this.raw.getChatAdministrators({
      chat_id
    }, signal);
  }
  /** @deprecated Use `getChatMemberCount` instead. */ getChatMembersCount(...args) {
    return this.getChatMemberCount(...args);
  }
  /**
     * Use this method to get the number of members in a chat. Returns Int on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmembercount
     */ getChatMemberCount(chat_id, signal) {
    return this.raw.getChatMemberCount({
      chat_id
    }, signal);
  }
  /**
     * Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getChatMember(chat_id, user_id, signal) {
    return this.raw.getChatMember({
      chat_id,
      user_id
    }, signal);
  }
  /**
     * Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param sticker_set_name Name of the sticker set to be set as the group sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatstickerset
     */ setChatStickerSet(chat_id, sticker_set_name, signal) {
    return this.raw.setChatStickerSet({
      chat_id,
      sticker_set_name
    }, signal);
  }
  /**
     * Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatstickerset
     */ deleteChatStickerSet(chat_id, signal) {
    return this.raw.deleteChatStickerSet({
      chat_id
    }, signal);
  }
  /**
     * Use this method to get custom emoji stickers, which can be used as a forum topic icon by any user. Requires no parameters. Returns an Array of Sticker objects.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getforumtopiciconstickers
     */ getForumTopicIconStickers(signal) {
    return this.raw.getForumTopicIconStickers(signal);
  }
  /**
     * Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a ForumTopic object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param name Topic name, 1-128 characters
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createforumtopic
     */ createForumTopic(chat_id, name, other, signal) {
    return this.raw.createForumTopic({
      chat_id,
      name,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editforumtopic
     */ editForumTopic(chat_id, message_thread_id, other, signal) {
    return this.raw.editForumTopic({
      chat_id,
      message_thread_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closeforumtopic
     */ closeForumTopic(chat_id, message_thread_id, signal) {
    return this.raw.closeForumTopic({
      chat_id,
      message_thread_id
    }, signal);
  }
  /**
     * Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopenforumtopic
     */ reopenForumTopic(chat_id, message_thread_id, signal) {
    return this.raw.reopenForumTopic({
      chat_id,
      message_thread_id
    }, signal);
  }
  /**
     * Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deleteforumtopic
     */ deleteForumTopic(chat_id, message_thread_id, signal) {
    return this.raw.deleteForumTopic({
      chat_id,
      message_thread_id
    }, signal);
  }
  /**
     * Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallforumtopicmessages
     */ unpinAllForumTopicMessages(chat_id, message_thread_id, signal) {
    return this.raw.unpinAllForumTopicMessages({
      chat_id,
      message_thread_id
    }, signal);
  }
  /**
     * Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param name New topic name, 1-128 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editgeneralforumtopic
     */ editGeneralForumTopic(chat_id, name, signal) {
    return this.raw.editGeneralForumTopic({
      chat_id,
      name
    }, signal);
  }
  /**
     * Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closegeneralforumtopic
     */ closeGeneralForumTopic(chat_id, signal) {
    return this.raw.closeGeneralForumTopic({
      chat_id
    }, signal);
  }
  /**
     * Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success.     *
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopengeneralforumtopic
     */ reopenGeneralForumTopic(chat_id, signal) {
    return this.raw.reopenGeneralForumTopic({
      chat_id
    }, signal);
  }
  /**
     * Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#hidegeneralforumtopic
     */ hideGeneralForumTopic(chat_id, signal) {
    return this.raw.hideGeneralForumTopic({
      chat_id
    }, signal);
  }
  /**
     * Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unhidegeneralforumtopic
     */ unhideGeneralForumTopic(chat_id, signal) {
    return this.raw.unhideGeneralForumTopic({
      chat_id
    }, signal);
  }
  /**
     * Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
     */ unpinAllGeneralForumTopicMessages(chat_id, signal) {
    return this.raw.unpinAllGeneralForumTopicMessages({
      chat_id
    }, signal);
  }
  /**
     * Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
     *
     * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
     *
     * @param callback_query_id Unique identifier for the query to be answered
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
     */ answerCallbackQuery(callback_query_id, other, signal) {
    return this.raw.answerCallbackQuery({
      callback_query_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to change the bot's name. Returns True on success.
     *
     * @param name New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmyname
     */ setMyName(name, other, signal) {
    return this.raw.setMyName({
      name,
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current bot name for the given user language. Returns BotName on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmyname
     */ getMyName(other, signal) {
    return this.raw.getMyName(other ?? {}, signal);
  }
  /**
     * Use this method to change the list of the bot's commands. See https://core.telegram.org/bots/features#commands for more details about bot commands. Returns True on success.
     *
     * @param commands A list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmycommands
     */ setMyCommands(commands, other, signal) {
    return this.raw.setMyCommands({
      commands,
      ...other
    }, signal);
  }
  /**
     * Use this method to delete the list of the bot's commands for the given scope and user language. After deletion, higher level commands will be shown to affected users. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemycommands
     */ deleteMyCommands(other, signal) {
    return this.raw.deleteMyCommands({
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current list of the bot's commands for the given scope and user language. Returns an Array of BotCommand objects. If commands aren't set, an empty list is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmycommands
     */ getMyCommands(other, signal) {
    return this.raw.getMyCommands({
      ...other
    }, signal);
  }
  /**
     * Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty. Returns True on success.
     *
     * @param description New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language.
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydescription
     */ setMyDescription(description, other, signal) {
    return this.raw.setMyDescription({
      description,
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current bot description for the given user language. Returns BotDescription on success.
     *
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmydescription
     */ getMyDescription(other, signal) {
    return this.raw.getMyDescription({
      ...other
    }, signal);
  }
  /**
     * Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot. Returns True on success.
     *
     * @param short_description New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language.
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmyshortdescription
     */ setMyShortDescription(short_description, other, signal) {
    return this.raw.setMyShortDescription({
      short_description,
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current bot short description for the given user language. Returns BotShortDescription on success.
     *
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmyshortdescription
     */ getMyShortDescription(other, signal) {
    return this.raw.getMyShortDescription({
      ...other
    }, signal);
  }
  /**
     * Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatmenubutton
     */ setChatMenuButton(other, signal) {
    return this.raw.setChatMenuButton({
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmenubutton
     */ getChatMenuButton(other, signal) {
    return this.raw.getChatMenuButton({
      ...other
    }, signal);
  }
  /**
     * Use this method to the change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are are free to modify the list before adding the bot. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydefaultadministratorrights
     */ setMyDefaultAdministratorRights(other, signal) {
    return this.raw.setMyDefaultAdministratorRights({
      ...other
    }, signal);
  }
  /**
     * Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmydefaultadministratorrights
     */ getMyDefaultAdministratorRights(other, signal) {
    return this.raw.getMyDefaultAdministratorRights({
      ...other
    }, signal);
  }
  /**
     * Use this method to edit text and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param text New text of the message, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageText(chat_id, message_id, text, other, signal) {
    return this.raw.editMessageText({
      chat_id,
      message_id,
      text,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit text and game inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageTextInline(inline_message_id, text, other, signal) {
    return this.raw.editMessageText({
      inline_message_id,
      text,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaption(chat_id, message_id, other, signal) {
    return this.raw.editMessageCaption({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit captions of inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaptionInline(inline_message_id, other, signal) {
    return this.raw.editMessageCaption({
      inline_message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit animation, audio, document, photo, or video messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMedia(chat_id, message_id, media, other, signal) {
    return this.raw.editMessageMedia({
      chat_id,
      message_id,
      media,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit animation, audio, document, photo, or video inline messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMediaInline(inline_message_id, media, other, signal) {
    return this.raw.editMessageMedia({
      inline_message_id,
      media,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkup(chat_id, message_id, other, signal) {
    return this.raw.editMessageReplyMarkup({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to edit only the reply markup of inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkupInline(inline_message_id, other, signal) {
    return this.raw.editMessageReplyMarkup({
      inline_message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the original message with the poll
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stoppoll
     */ stopPoll(chat_id, message_id, other, signal) {
    return this.raw.stopPoll({
      chat_id,
      message_id,
      ...other
    }, signal);
  }
  /**
     * Use this method to delete a message, including service messages, with the following limitations:
     * - A message can only be deleted if it was sent less than 48 hours ago.
     * - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago.
     * - Bots can delete outgoing messages in private chats, groups, and supergroups.
     * - Bots can delete incoming messages in private chats.
     * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
     * - If the bot is an administrator of a group, it can delete any message there.
     * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
     * Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to delete
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessage
     */ deleteMessage(chat_id, message_id, signal) {
    return this.raw.deleteMessage({
      chat_id,
      message_id
    }, signal);
  }
  /**
     * Use this method to delete multiple messages simultaneously. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessages
     */ deleteMessages(chat_id, message_ids, signal) {
    return this.raw.deleteMessages({
      chat_id,
      message_ids
    }, signal);
  }
  /**
     * Use this method to send static .WEBP, animated .TGS, or video .WEBM stickers. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. Video and animated stickers can't be sent via an HTTP URL.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendsticker
     */ sendSticker(chat_id, sticker, other, signal) {
    return this.raw.sendSticker({
      chat_id,
      sticker,
      ...other
    }, signal);
  }
  /**
     * Use this method to get a sticker set. On success, a StickerSet object is returned.
     *
     * @param name Name of the sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getstickerset
     */ getStickerSet(name, signal) {
    return this.raw.getStickerSet({
      name
    }, signal);
  }
  /**
     * Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects.
     *
     * @param custom_emoji_ids A list of custom emoji identifiers
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getcustomemojistickers
     */ getCustomEmojiStickers(custom_emoji_ids, signal) {
    return this.raw.getCustomEmojiStickers({
      custom_emoji_ids
    }, signal);
  }
  /**
     * Use this method to upload a file with a sticker for later use in the createNewStickerSet, addStickerToSet, or replaceStickerInSet methods (the file can be used multiple times). Returns the uploaded File on success.
     *
     * @param user_id User identifier of sticker file owner
     * @param sticker_format Format of the sticker, must be one of “static”, “animated”, “video”
     * @param sticker A file with the sticker in .WEBP, .PNG, .TGS, or .WEBM format. See https://core.telegram.org/stickers for technical requirements.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#uploadstickerfile
     */ uploadStickerFile(user_id, sticker_format, sticker, signal) {
    return this.raw.uploadStickerFile({
      user_id,
      sticker_format,
      sticker
    }, signal);
  }
  /**
     * Use this method to create a new sticker set owned by a user. The bot will be able to edit the sticker set thus created. Returns True on success.
     *
     * @param user_id User identifier of created sticker set owner
     * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only English letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in `_by_<bot_username>`. `<bot_username>` is case insensitive. 1-64 characters.
     * @param title Sticker set title, 1-64 characters
     * @param stickers A list of 1-50 initial stickers to be added to the sticker set
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createnewstickerset
     */ createNewStickerSet(user_id, name, title, stickers, other, signal) {
    return this.raw.createNewStickerSet({
      user_id,
      name,
      title,
      stickers,
      ...other
    }, signal);
  }
  /**
     * Use this method to add a new sticker to a set created by the bot. The format of the added sticker must match the format of the other stickers in the set. Emoji sticker sets can have up to 200 stickers. Animated and video sticker sets can have up to 50 stickers. Static sticker sets can have up to 120 stickers. Returns True on success.
     *
     * @param user_id User identifier of sticker set owner
     * @param name Sticker set name
     * @param sticker An object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set isn't changed.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#addstickertoset
     */ addStickerToSet(user_id, name, sticker, signal) {
    return this.raw.addStickerToSet({
      user_id,
      name,
      sticker
    }, signal);
  }
  /**
     * Use this method to move a sticker in a set created by the bot to a specific position. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param position New sticker position in the set, zero-based
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickerpositioninset
     */ setStickerPositionInSet(sticker, position, signal) {
    return this.raw.setStickerPositionInSet({
      sticker,
      position
    }, signal);
  }
  /**
     * Use this method to delete a sticker from a set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletestickerfromset
     */ deleteStickerFromSet(sticker, signal) {
    return this.raw.deleteStickerFromSet({
      sticker
    }, signal);
  }
  /**
     * Use this method to replace an existing sticker in a sticker set with a new one. The method is equivalent to calling deleteStickerFromSet, then addStickerToSet, then setStickerPositionInSet. Returns True on success.
     *
     * @param user_id User identifier of the sticker set owner
     * @param name Sticker set name
     * @param old_sticker File identifier of the replaced sticker
     * @param sticker An object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set remains unchanged.:x
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#replacestickerinset
     */ replaceStickerInSet(user_id, name, old_sticker, sticker, signal) {
    return this.raw.replaceStickerInSet({
      user_id,
      name,
      old_sticker,
      sticker
    }, signal);
  }
  /**
     * Use this method to change the list of emoji assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param emoji_list A list of 1-20 emoji associated with the sticker
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickeremojilist
     */ setStickerEmojiList(sticker, emoji_list, signal) {
    return this.raw.setStickerEmojiList({
      sticker,
      emoji_list
    }, signal);
  }
  /**
     * Use this method to change search keywords assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param keywords A list of 0-20 search keywords for the sticker with total length of up to 64 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickerkeywords
     */ setStickerKeywords(sticker, keywords, signal) {
    return this.raw.setStickerKeywords({
      sticker,
      keywords
    }, signal);
  }
  /**
     * Use this method to change the mask position of a mask sticker. The sticker must belong to a sticker set that was created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param mask_position An object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickermaskposition
     */ setStickerMaskPosition(sticker, mask_position, signal) {
    return this.raw.setStickerMaskPosition({
      sticker,
      mask_position
    }, signal);
  }
  /**
     * Use this method to set the title of a created sticker set. Returns True on success.
     *
     * @param name Sticker set name
     * @param title Sticker set title, 1-64 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickersettitle
     */ setStickerSetTitle(name, title, signal) {
    return this.raw.setStickerSetTitle({
      name,
      title
    }, signal);
  }
  /**
     * Use this method to delete a sticker set that was created by the bot. Returns True on success.
     *
     * @param name Sticker set name
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletestickerset
     */ deleteStickerSet(name, signal) {
    return this.raw.deleteStickerSet({
      name
    }, signal);
  }
  /**
     * Use this method to set the thumbnail of a regular or mask sticker set. The format of the thumbnail file must match the format of the stickers in the set. Returns True on success.
     *
     * @param name Sticker set name
     * @param user_id User identifier of the sticker set owner
     * @param thumbnail A .WEBP or .PNG image with the thumbnail, must be up to 128 kilobytes in size and have a width and height of exactly 100px, or a .TGS animation with a thumbnail up to 32 kilobytes in size (see https://core.telegram.org/stickers#animated-sticker-requirements for animated sticker technical requirements), or a WEBM video with the thumbnail up to 32 kilobytes in size; see https://core.telegram.org/stickers#video-sticker-requirements for video sticker technical requirements. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files ». Animated and video sticker set thumbnails can't be uploaded via HTTP URL. If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail.
     * @param format Format of the thumbnail, must be one of “static” for a .WEBP or .PNG image, “animated” for a .TGS animation, or “video” for a WEBM video
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickersetthumbnail
     */ setStickerSetThumbnail(name, user_id, thumbnail, format, signal) {
    return this.raw.setStickerSetThumbnail({
      name,
      user_id,
      thumbnail,
      format
    }, signal);
  }
  /**
     * Use this method to set the thumbnail of a custom emoji sticker set. Returns True on success.
     *
     * @param name Sticker set name
     * @param custom_emoji_id Custom emoji identifier of a sticker from the sticker set; pass an empty string to drop the thumbnail and use the first sticker as the thumbnail.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
     */ setCustomEmojiStickerSetThumbnail(name, custom_emoji_id, signal) {
    return this.raw.setCustomEmojiStickerSetThumbnail({
      name,
      custom_emoji_id
    }, signal);
  }
  /**
     * Use this method to send answers to an inline query. On success, True is returned.
     * No more than 50 results per query are allowed.
     *
     * Example: An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an OAuth link. Once done, the bot can offer a switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities.
     *
     * @param inline_query_id Unique identifier for the answered query
     * @param results An array of results for the inline query
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerinlinequery
     */ answerInlineQuery(inline_query_id, results, other, signal) {
    return this.raw.answerInlineQuery({
      inline_query_id,
      results,
      ...other
    }, signal);
  }
  /**
     * Use this method to set the result of an interaction with a Web App and send a corresponding message on behalf of the user to the chat from which the query originated. On success, a SentWebAppMessage object is returned.
     *
     * @param web_app_query_id Unique identifier for the query to be answered
     * @param result An object describing the message to be sent
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerwebappquery
     */ answerWebAppQuery(web_app_query_id, result, signal) {
    return this.raw.answerWebAppQuery({
      web_app_query_id,
      result
    }, signal);
  }
  /**
     * Use this method to send invoices. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendinvoice
     */ sendInvoice(chat_id, title, description, payload, currency, prices, other, signal) {
    return this.raw.sendInvoice({
      chat_id,
      title,
      description,
      payload,
      currency,
      prices,
      ...other
    }, signal);
  }
  /**
     * Use this method to create a link for an invoice. Returns the created invoice link as String on success.
     *
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param provider_token Payment provider token, obtained via BotFather
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createinvoicelink
     */ createInvoiceLink(title, description, payload, provider_token, currency, prices, other, signal) {
    return this.raw.createInvoiceLink({
      title,
      description,
      payload,
      provider_token,
      currency,
      prices,
      ...other
    }, signal);
  }
  /**
     * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
     *
     * @param shipping_query_id Unique identifier for the query to be answered
     * @param ok Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answershippingquery
     */ answerShippingQuery(shipping_query_id, ok, other, signal) {
    return this.raw.answerShippingQuery({
      shipping_query_id,
      ok,
      ...other
    }, signal);
  }
  /**
     * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
     *
     * @param pre_checkout_query_id Unique identifier for the query to be answered
     * @param ok Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerprecheckoutquery
     */ answerPreCheckoutQuery(pre_checkout_query_id, ok, other, signal) {
    return this.raw.answerPreCheckoutQuery({
      pre_checkout_query_id,
      ok,
      ...other
    }, signal);
  }
  /**
     * Returns the bot's Telegram Star transactions in chronological order. On success, returns a StarTransactions object.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getstartransactions
     */ getStarTransactions(other, signal) {
    return this.raw.getStarTransactions({
      ...other
    }, signal);
  }
  /**
     * Refunds a successful payment in Telegram Stars.
     *
     * @param user_id Identifier of the user whose payment will be refunded
     * @param telegram_payment_charge_id Telegram payment identifier
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#refundstarpayment
     */ refundStarPayment(user_id, telegram_payment_charge_id, signal) {
    return this.raw.refundStarPayment({
      user_id,
      telegram_payment_charge_id
    }, signal);
  }
  /**
     * Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success.
     *
     * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
     *
     * @param user_id User identifier
     * @param errors An array describing the errors
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setpassportdataerrors
     */ setPassportDataErrors(user_id, errors, signal) {
    return this.raw.setPassportDataErrors({
      user_id,
      errors
    }, signal);
  }
  /**
     * Use this method to send a game. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat
     * @param game_short_name Short name of the game, serves as the unique identifier for the game. Set up your games via BotFather.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendgame
     */ sendGame(chat_id, game_short_name, other, signal) {
    return this.raw.sendGame({
      chat_id,
      game_short_name,
      ...other
    }, signal);
  }
  /**
     * Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
     *
     * @param chat_id Unique identifier for the target chat
     * @param message_id Identifier of the sent message
     * @param user_id User identifier
     * @param score New score, must be non-negative
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setgamescore
     */ setGameScore(chat_id, message_id, user_id, score, other, signal) {
    return this.raw.setGameScore({
      chat_id,
      message_id,
      user_id,
      score,
      ...other
    }, signal);
  }
  /**
     * Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
     *
     * @param inline_message_id Identifier of the inline message
     * @param user_id User identifier
     * @param score New score, must be non-negative
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setgamescore
     */ setGameScoreInline(inline_message_id, user_id, score, other, signal) {
    return this.raw.setGameScore({
      inline_message_id,
      user_id,
      score,
      ...other
    }, signal);
  }
  /**
     * Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in a game. Returns an Array of GameHighScore objects.
     *
     * This method will currently return scores for the target user, plus two of their closest neighbors on each side. Will also return the top three users if the user and his neighbors are not among them. Please note that this behavior is subject to change.
     *
     * @param chat_id Unique identifier for the target chat
     * @param message_id Identifier of the sent message
     * @param user_id Target user id
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getgamehighscores
     */ getGameHighScores(chat_id, message_id, user_id, signal) {
    return this.raw.getGameHighScores({
      chat_id,
      message_id,
      user_id
    }, signal);
  }
  /**
     * Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in an inline game. On success, returns an Array of GameHighScore objects.
     *
     * This method will currently return scores for the target user, plus two of their closest neighbors on each side. Will also return the top three users if the user and his neighbors are not among them. Please note that this behavior is subject to change.
     *
     * @param inline_message_id Identifier of the inline message
     * @param user_id Target user id
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getgamehighscores
     */ getGameHighScoresInline(inline_message_id, user_id, signal) {
    return this.raw.getGameHighScores({
      inline_message_id,
      user_id
    }, signal);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29yZS9hcGkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZGVuby1saW50LWlnbm9yZS1maWxlIGNhbWVsY2FzZVxuaW1wb3J0IHtcbiAgICB0eXBlIEJvdENvbW1hbmQsXG4gICAgdHlwZSBDaGF0UGVybWlzc2lvbnMsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdCxcbiAgICB0eXBlIElucHV0RmlsZSxcbiAgICB0eXBlIElucHV0TWVkaWEsXG4gICAgdHlwZSBJbnB1dE1lZGlhQXVkaW8sXG4gICAgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8sXG4gICAgdHlwZSBJbnB1dE1lZGlhVmlkZW8sXG4gICAgdHlwZSBJbnB1dFBhaWRNZWRpYSxcbiAgICB0eXBlIElucHV0UG9sbE9wdGlvbixcbiAgICB0eXBlIElucHV0U3RpY2tlcixcbiAgICB0eXBlIExhYmVsZWRQcmljZSxcbiAgICB0eXBlIE1hc2tQb3NpdGlvbixcbiAgICB0eXBlIFBhc3Nwb3J0RWxlbWVudEVycm9yLFxuICAgIHR5cGUgUmVhY3Rpb25UeXBlLFxufSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7XG4gICAgdHlwZSBBcGlDbGllbnRPcHRpb25zLFxuICAgIGNyZWF0ZVJhd0FwaSxcbiAgICB0eXBlIE1ldGhvZHMsXG4gICAgdHlwZSBQYXlsb2FkLFxuICAgIHR5cGUgUmF3QXBpLFxuICAgIHR5cGUgVHJhbnNmb3JtZXIsXG4gICAgdHlwZSBUcmFuc2Zvcm1lckNvbnN1bWVyLFxuICAgIHR5cGUgV2ViaG9va1JlcGx5RW52ZWxvcGUsXG59IGZyb20gXCIuL2NsaWVudC50c1wiO1xuXG4vKipcbiAqIEhlbHBlciB0eXBlIHRvIGRlcml2ZSByZW1haW5pbmcgcHJvcGVydGllcyBvZiBhIGdpdmVuIEFQSSBtZXRob2QgY2FsbCBNLFxuICogZ2l2ZW4gdGhhdCBzb21lIHByb3BlcnRpZXMgWCBoYXZlIGFscmVhZHkgYmVlbiBzcGVjaWZpZWQuXG4gKi9cbmV4cG9ydCB0eXBlIE90aGVyPFxuICAgIFIgZXh0ZW5kcyBSYXdBcGksXG4gICAgTSBleHRlbmRzIE1ldGhvZHM8Uj4sXG4gICAgWCBleHRlbmRzIHN0cmluZyA9IG5ldmVyLFxuPiA9IE9taXQ8UGF5bG9hZDxNLCBSPiwgWD47XG4vKipcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBmdWxsIFRlbGVncmFtIEJvdCBBUEkuIEFsbCBtZXRob2RzIG9mIHRoZVxuICogQVBJIGhhdmUgYW4gZXF1aXZhbGVudCBvbiB0aGlzIGNsYXNzLCB3aXRoIHRoZSBtb3N0IGltcG9ydGFudCBwYXJhbWV0ZXJzXG4gKiBwdWxsZWQgdXAgaW50byB0aGUgZnVuY3Rpb24gc2lnbmF0dXJlLCBhbmQgdGhlIG90aGVyIHBhcmFtZXRlcnMgY2FwdHVyZWQgYnlcbiAqIGFuIG9iamVjdC5cbiAqXG4gKiBJbiBhZGRpdGlvbiwgdGhpcyBjbGFzcyBoYXMgYSBwcm9wZXJ0eSBgcmF3YCB0aGF0IHByb3ZpZGVzIHJhdyBhY2Nlc3MgdG8gdGhlXG4gKiBjb21wbGV0ZSBUZWxlZ3JhbSBBUEksIHdpdGggdGhlIG1ldGhvZCBzaWduYXR1cmVzIDE6MSByZXByZXNlbnRlZCBhc1xuICogZG9jdW1lbnRlZCBvbiB0aGUgd2Vic2l0ZSAoaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSkuXG4gKlxuICogRXZlcnkgbWV0aG9kIHRha2VzIGFuIG9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgb2JqZWN0IHRoYXQgYWxsb3dzIHlvdSB0byBjYW5jZWxcbiAqIHRoZSByZXF1ZXN0IGlmIGRlc2lyZWQuXG4gKlxuICogSW4gYWR2YW5jZWQgdXNlIGNhc2VzLCB0aGlzIGNsYXNzIGFsbG93cyB0byBpbnN0YWxsIHRyYW5zZm9ybWVycyB0aGF0IGNhblxuICogbW9kaWZ5IHRoZSBtZXRob2QgYW5kIHBheWxvYWQgb24gdGhlIGZseSBiZWZvcmUgc2VuZGluZyBpdCB0byB0aGUgVGVsZWdyYW1cbiAqIHNlcnZlcnMuIENvbmZlciB0aGUgYGNvbmZpZ2AgcHJvcGVydHkgZm9yIHRoaXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBcGk8UiBleHRlbmRzIFJhd0FwaSA9IFJhd0FwaT4ge1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGFjY2VzcyB0byBhbGwgbWV0aG9kcyBvZiB0aGUgVGVsZWdyYW0gQm90IEFQSSBleGFjdGx5IGFzXG4gICAgICogZG9jdW1lbnRlZCBvbiB0aGUgd2Vic2l0ZSAoaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSkuIE5vXG4gICAgICogYXJndW1lbnRzIGFyZSBwdWxsZWQgdXAgaW4gdGhlIGZ1bmN0aW9uIHNpZ25hdHVyZSBmb3IgY29udmVuaWVuY2UuXG4gICAgICpcbiAgICAgKiBJZiB5b3Ugc3VwcHJlc3MgY29tcGlsZXIgd2FybmluZ3MsIHRoaXMgYWxzbyBhbGxvd3MgZm9yIHJhdyBhcGkgY2FsbHMgdG9cbiAgICAgKiB1bmRvY3VtZW50ZWQgbWV0aG9kcyB3aXRoIGFyYml0cmFyeSBwYXJhbWV0ZXJz4oCUdXNlIG9ubHkgaWYgeW91IGtub3cgd2hhdFxuICAgICAqIHlvdSBhcmUgZG9pbmcuXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IHJhdzogUjtcblxuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgQVBJIGluc3RhbmNlLCB1c2VkIGFzIGEgbmFtZXNwYWNlIHRvXG4gICAgICogc2VwYXJhdGUgdGhvc2UgQVBJIG9wZXJhdGlvbnMgdGhhdCBhcmUgcmVsYXRlZCB0byBncmFtbVkgZnJvbSBtZXRob2RzIG9mXG4gICAgICogdGhlIFRlbGVncmFtIEJvdCBBUEkuIENvbnRhaW5zIGFkdmFuY2VkIG9wdGlvbnMhXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWxsb3dzIHRvIGluc3RhbGwgYW4gQVBJIHJlcXVlc3QgdHJhbnNmb3JtZXIgZnVuY3Rpb24uIEEgdHJhbnNmb3JtZXJcbiAgICAgICAgICogZnVuY3Rpb24gaGFzIGFjY2VzcyB0byBldmVyeSBBUEkgY2FsbCBiZWZvcmUgaXQgaXMgYmVpbmcgcGVyZm9ybWVkLlxuICAgICAgICAgKiBUaGlzIGluY2x1ZGVzIHRoZSBtZXRob2QgYXMgc3RyaW5nLCB0aGUgcGF5bG9hZCBhcyBvYmplY3QgYW5kIHRoZVxuICAgICAgICAgKiB1cHN0cmVhbSB0cmFuc2Zvcm1lciBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogX05vdGUgdGhhdCB1c2luZyB0cmFuc2Zvcm1lciBmdW5jdGlvbnMgaXMgYW4gYWR2YW5jZWQgZmVhdHVyZSBvZlxuICAgICAgICAgKiBncmFtbVkgdGhhdCBtb3N0IGJvdHMgd2lsbCBub3QgbmVlZCB0byBtYWtlIHVzZSBvZi5fXG4gICAgICAgICAqL1xuICAgICAgICByZWFkb25seSB1c2U6IFRyYW5zZm9ybWVyQ29uc3VtZXI8Uj47XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm92aWRlcyByZWFkIGFjY2VzcyB0byBhbGwgY3VycmVudGx5IGluc3RhbGxlZCB0cmFuc2Zvcm1lcnMgKHRob3NlXG4gICAgICAgICAqIHRoYXQgaGF2ZSBwcmV2aW91c2x5IGJlZW4gcGFzc2VkIHRvIGBjb25maWcudXNlYCkuXG4gICAgICAgICAqXG4gICAgICAgICAqIF9Ob3RlIHRoYXQgdXNpbmcgdHJhbnNmb3JtZXIgZnVuY3Rpb25zIGlzIGFuIGFkdmFuY2VkIGZlYXR1cmUgb2ZcbiAgICAgICAgICogZ3JhbW1ZIHRoYXQgbW9zdCBib3RzIHdpbGwgbm90IG5lZWQgdG8gbWFrZSB1c2Ugb2YuX1xuICAgICAgICAgKi9cbiAgICAgICAgcmVhZG9ubHkgaW5zdGFsbGVkVHJhbnNmb3JtZXJzOiAoKSA9PiBUcmFuc2Zvcm1lcjxSPltdO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIGBBcGlgLiBJdCBpcyBpbmRlcGVuZGVudCBmcm9tIGFsbCBvdGhlclxuICAgICAqIGluc3RhbmNlcyBvZiB0aGlzIGNsYXNzLiBGb3IgZXhhbXBsZSwgdGhpcyBsZXRzIHlvdSBpbnN0YWxsIGEgY3VzdG9tIHNldFxuICAgICAqIGlmIHRyYW5zZm9ybWVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b2tlbiBCb3QgQVBJIHRva2VuIG9idGFpbmVkIGZyb20gW0BCb3RGYXRoZXJdKGh0dHBzOi8vdC5tZS9Cb3RGYXRoZXIpXG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgQVBJIGNsaWVudCBvcHRpb25zIGZvciB0aGUgdW5kZXJseWluZyBjbGllbnQgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gd2ViaG9va1JlcGx5RW52ZWxvcGUgT3B0aW9uYWwgZW52ZWxvcGUgdG8gaGFuZGxlIHdlYmhvb2sgcmVwbGllc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgdG9rZW46IHN0cmluZyxcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IG9wdGlvbnM/OiBBcGlDbGllbnRPcHRpb25zLFxuICAgICAgICB3ZWJob29rUmVwbHlFbnZlbG9wZT86IFdlYmhvb2tSZXBseUVudmVsb3BlLFxuICAgICkge1xuICAgICAgICBjb25zdCB7IHJhdywgdXNlLCBpbnN0YWxsZWRUcmFuc2Zvcm1lcnMgfSA9IGNyZWF0ZVJhd0FwaTxSPihcbiAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIHdlYmhvb2tSZXBseUVudmVsb3BlLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJhdyA9IHJhdztcbiAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICB1c2UsXG4gICAgICAgICAgICBpbnN0YWxsZWRUcmFuc2Zvcm1lcnM6ICgpID0+IGluc3RhbGxlZFRyYW5zZm9ybWVycy5zbGljZSgpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byByZWNlaXZlIGluY29taW5nIHVwZGF0ZXMgdXNpbmcgbG9uZyBwb2xsaW5nICh3aWtpKS4gUmV0dXJucyBhbiBBcnJheSBvZiBVcGRhdGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIE5vdGVzXG4gICAgICogMS4gVGhpcyBtZXRob2Qgd2lsbCBub3Qgd29yayBpZiBhbiBvdXRnb2luZyB3ZWJob29rIGlzIHNldCB1cC5cbiAgICAgKiAyLiBJbiBvcmRlciB0byBhdm9pZCBnZXR0aW5nIGR1cGxpY2F0ZSB1cGRhdGVzLCByZWNhbGN1bGF0ZSBvZmZzZXQgYWZ0ZXIgZWFjaCBzZXJ2ZXIgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR1cGRhdGVzXG4gICAgICovXG4gICAgZ2V0VXBkYXRlcyhvdGhlcj86IE90aGVyPFIsIFwiZ2V0VXBkYXRlc1wiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldFVwZGF0ZXMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzcGVjaWZ5IGEgVVJMIGFuZCByZWNlaXZlIGluY29taW5nIHVwZGF0ZXMgdmlhIGFuIG91dGdvaW5nIHdlYmhvb2suIFdoZW5ldmVyIHRoZXJlIGlzIGFuIHVwZGF0ZSBmb3IgdGhlIGJvdCwgd2Ugd2lsbCBzZW5kIGFuIEhUVFBTIFBPU1QgcmVxdWVzdCB0byB0aGUgc3BlY2lmaWVkIFVSTCwgY29udGFpbmluZyBhIEpTT04tc2VyaWFsaXplZCBVcGRhdGUuIEluIGNhc2Ugb2YgYW4gdW5zdWNjZXNzZnVsIHJlcXVlc3QsIHdlIHdpbGwgZ2l2ZSB1cCBhZnRlciBhIHJlYXNvbmFibGUgYW1vdW50IG9mIGF0dGVtcHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIElmIHlvdSdkIGxpa2UgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHdlYmhvb2sgd2FzIHNldCBieSB5b3UsIHlvdSBjYW4gc3BlY2lmeSBzZWNyZXQgZGF0YSBpbiB0aGUgcGFyYW1ldGVyIHNlY3JldF90b2tlbi4gSWYgc3BlY2lmaWVkLCB0aGUgcmVxdWVzdCB3aWxsIGNvbnRhaW4gYSBoZWFkZXIg4oCcWC1UZWxlZ3JhbS1Cb3QtQXBpLVNlY3JldC1Ub2tlbuKAnSB3aXRoIHRoZSBzZWNyZXQgdG9rZW4gYXMgY29udGVudC5cbiAgICAgKlxuICAgICAqIE5vdGVzXG4gICAgICogMS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVjZWl2ZSB1cGRhdGVzIHVzaW5nIGdldFVwZGF0ZXMgZm9yIGFzIGxvbmcgYXMgYW4gb3V0Z29pbmcgd2ViaG9vayBpcyBzZXQgdXAuXG4gICAgICogMi4gVG8gdXNlIGEgc2VsZi1zaWduZWQgY2VydGlmaWNhdGUsIHlvdSBuZWVkIHRvIHVwbG9hZCB5b3VyIHB1YmxpYyBrZXkgY2VydGlmaWNhdGUgdXNpbmcgY2VydGlmaWNhdGUgcGFyYW1ldGVyLiBQbGVhc2UgdXBsb2FkIGFzIElucHV0RmlsZSwgc2VuZGluZyBhIFN0cmluZyB3aWxsIG5vdCB3b3JrLlxuICAgICAqIDMuIFBvcnRzIGN1cnJlbnRseSBzdXBwb3J0ZWQgZm9yIFdlYmhvb2tzOiA0NDMsIDgwLCA4OCwgODQ0My5cbiAgICAgKlxuICAgICAqIElmIHlvdSdyZSBoYXZpbmcgYW55IHRyb3VibGUgc2V0dGluZyB1cCB3ZWJob29rcywgcGxlYXNlIGNoZWNrIG91dCB0aGlzIGFtYXppbmcgZ3VpZGUgdG8gd2ViaG9va3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXJsIEhUVFBTIHVybCB0byBzZW5kIHVwZGF0ZXMgdG8uIFVzZSBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIHdlYmhvb2sgaW50ZWdyYXRpb25cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXR3ZWJob29rXG4gICAgICovXG4gICAgc2V0V2ViaG9vayhcbiAgICAgICAgdXJsOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZXRXZWJob29rXCIsIFwidXJsXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFdlYmhvb2soeyB1cmwsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlbW92ZSB3ZWJob29rIGludGVncmF0aW9uIGlmIHlvdSBkZWNpZGUgdG8gc3dpdGNoIGJhY2sgdG8gZ2V0VXBkYXRlcy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGV3ZWJob29rXG4gICAgICovXG4gICAgZGVsZXRlV2ViaG9vayhvdGhlcj86IE90aGVyPFIsIFwiZGVsZXRlV2ViaG9va1wiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZVdlYmhvb2soeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgY3VycmVudCB3ZWJob29rIHN0YXR1cy4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy4gT24gc3VjY2VzcywgcmV0dXJucyBhIFdlYmhvb2tJbmZvIG9iamVjdC4gSWYgdGhlIGJvdCBpcyB1c2luZyBnZXRVcGRhdGVzLCB3aWxsIHJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgdXJsIGZpZWxkIGVtcHR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR3ZWJob29raW5mb1xuICAgICAqL1xuICAgIGdldFdlYmhvb2tJbmZvKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRXZWJob29rSW5mbyhzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgc2ltcGxlIG1ldGhvZCBmb3IgdGVzdGluZyB5b3VyIGJvdCdzIGF1dGhlbnRpY2F0aW9uIHRva2VuLiBSZXF1aXJlcyBubyBwYXJhbWV0ZXJzLiBSZXR1cm5zIGJhc2ljIGluZm9ybWF0aW9uIGFib3V0IHRoZSBib3QgaW4gZm9ybSBvZiBhIFVzZXIgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRtZVxuICAgICAqL1xuICAgIGdldE1lKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRNZShzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBsb2cgb3V0IGZyb20gdGhlIGNsb3VkIEJvdCBBUEkgc2VydmVyIGJlZm9yZSBsYXVuY2hpbmcgdGhlIGJvdCBsb2NhbGx5LiBZb3UgbXVzdCBsb2cgb3V0IHRoZSBib3QgYmVmb3JlIHJ1bm5pbmcgaXQgbG9jYWxseSwgb3RoZXJ3aXNlIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSB0aGF0IHRoZSBib3Qgd2lsbCByZWNlaXZlIHVwZGF0ZXMuIEFmdGVyIGEgc3VjY2Vzc2Z1bCBjYWxsLCB5b3UgY2FuIGltbWVkaWF0ZWx5IGxvZyBpbiBvbiBhIGxvY2FsIHNlcnZlciwgYnV0IHdpbGwgbm90IGJlIGFibGUgdG8gbG9nIGluIGJhY2sgdG8gdGhlIGNsb3VkIEJvdCBBUEkgc2VydmVyIGZvciAxMCBtaW51dGVzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbG9nb3V0XG4gICAgICovXG4gICAgbG9nT3V0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5sb2dPdXQoc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2xvc2UgdGhlIGJvdCBpbnN0YW5jZSBiZWZvcmUgbW92aW5nIGl0IGZyb20gb25lIGxvY2FsIHNlcnZlciB0byBhbm90aGVyLiBZb3UgbmVlZCB0byBkZWxldGUgdGhlIHdlYmhvb2sgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QgdG8gZW5zdXJlIHRoYXQgdGhlIGJvdCBpc24ndCBsYXVuY2hlZCBhZ2FpbiBhZnRlciBzZXJ2ZXIgcmVzdGFydC4gVGhlIG1ldGhvZCB3aWxsIHJldHVybiBlcnJvciA0MjkgaW4gdGhlIGZpcnN0IDEwIG1pbnV0ZXMgYWZ0ZXIgdGhlIGJvdCBpcyBsYXVuY2hlZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuIFJlcXVpcmVzIG5vIHBhcmFtZXRlcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Nsb3NlXG4gICAgICovXG4gICAgY2xvc2Uoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNsb3NlKHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdGV4dCBtZXNzYWdlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHRleHQgVGV4dCBvZiB0aGUgbWVzc2FnZSB0byBiZSBzZW50LCAxLTQwOTYgY2hhcmFjdGVycyBhZnRlciBlbnRpdGllcyBwYXJzaW5nXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lc3NhZ2VcbiAgICAgKi9cbiAgICBzZW5kTWVzc2FnZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kTWVzc2FnZVwiLCBcImNoYXRfaWRcIiB8IFwidGV4dFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kTWVzc2FnZSh7IGNoYXRfaWQsIHRleHQsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGZvcndhcmQgbWVzc2FnZXMgb2YgYW55IGtpbmQuIFNlcnZpY2UgbWVzc2FnZXMgYW5kIG1lc3NhZ2VzIHdpdGggcHJvdGVjdGVkIGNvbnRlbnQgY2FuJ3QgYmUgZm9yd2FyZGVkLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZSB3YXMgc2VudCAob3IgY2hhbm5lbCB1c2VybmFtZSBpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgTWVzc2FnZSBpZGVudGlmaWVyIGluIHRoZSBjaGF0IHNwZWNpZmllZCBpbiBmcm9tX2NoYXRfaWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNmb3J3YXJkbWVzc2FnZVxuICAgICAqL1xuICAgIGZvcndhcmRNZXNzYWdlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5mb3J3YXJkTWVzc2FnZShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgZnJvbV9jaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBmb3J3YXJkIG11bHRpcGxlIG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgZm9yd2FyZGVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzIGFuZCBtZXNzYWdlcyB3aXRoIHByb3RlY3RlZCBjb250ZW50IGNhbid0IGJlIGZvcndhcmRlZC4gQWxidW0gZ3JvdXBpbmcgaXMga2VwdCBmb3IgZm9yd2FyZGVkIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBhbiBhcnJheSBvZiBNZXNzYWdlSWQgb2YgdGhlIHNlbnQgbWVzc2FnZXMgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBmcm9tX2NoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBjaGF0IHdoZXJlIHRoZSBvcmlnaW5hbCBtZXNzYWdlcyB3ZXJlIHNlbnQgKG9yIGNoYW5uZWwgdXNlcm5hbWUgaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkcyBBIGxpc3Qgb2YgMS0xMDAgaWRlbnRpZmllcnMgb2YgbWVzc2FnZXMgaW4gdGhlIGNoYXQgZnJvbV9jaGF0X2lkIHRvIGZvcndhcmQuIFRoZSBpZGVudGlmaWVycyBtdXN0IGJlIHNwZWNpZmllZCBpbiBhIHN0cmljdGx5IGluY3JlYXNpbmcgb3JkZXIuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZm9yd2FyZG1lc3NhZ2VzXG4gICAgICovXG4gICAgZm9yd2FyZE1lc3NhZ2VzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkczogbnVtYmVyW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZXNcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJmcm9tX2NoYXRfaWRcIiB8IFwibWVzc2FnZV9pZHNcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmZvcndhcmRNZXNzYWdlcyh7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgZnJvbV9jaGF0X2lkLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY29weSBtZXNzYWdlcyBvZiBhbnkga2luZC4gU2VydmljZSBtZXNzYWdlcywgcGFpZCBtZWRpYSBtZXNzYWdlcywgZ2l2ZWF3YXkgbWVzc2FnZXMsIGdpdmVhd2F5IHdpbm5lcnMgbWVzc2FnZXMsIGFuZCBpbnZvaWNlIG1lc3NhZ2VzIGNhbid0IGJlIGNvcGllZC4gQSBxdWl6IHBvbGwgY2FuIGJlIGNvcGllZCBvbmx5IGlmIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgY29ycmVjdF9vcHRpb25faWQgaXMga25vd24gdG8gdGhlIGJvdC4gVGhlIG1ldGhvZCBpcyBhbmFsb2dvdXMgdG8gdGhlIG1ldGhvZCBmb3J3YXJkTWVzc2FnZSwgYnV0IHRoZSBjb3BpZWQgbWVzc2FnZSBkb2Vzbid0IGhhdmUgYSBsaW5rIHRvIHRoZSBvcmlnaW5hbCBtZXNzYWdlLiBSZXR1cm5zIHRoZSBNZXNzYWdlSWQgb2YgdGhlIHNlbnQgbWVzc2FnZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZSB3YXMgc2VudCAob3IgY2hhbm5lbCB1c2VybmFtZSBpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgTWVzc2FnZSBpZGVudGlmaWVyIGluIHRoZSBjaGF0IHNwZWNpZmllZCBpbiBmcm9tX2NoYXRfaWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjb3B5bWVzc2FnZVxuICAgICAqL1xuICAgIGNvcHlNZXNzYWdlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJjb3B5TWVzc2FnZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jb3B5TWVzc2FnZShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgZnJvbV9jaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjb3B5IG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgY29waWVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzLCBwYWlkIG1lZGlhIG1lc3NhZ2VzLCBnaXZlYXdheSBtZXNzYWdlcywgZ2l2ZWF3YXkgd2lubmVycyBtZXNzYWdlcywgYW5kIGludm9pY2UgbWVzc2FnZXMgY2FuJ3QgYmUgY29waWVkLiBBIHF1aXogcG9sbCBjYW4gYmUgY29waWVkIG9ubHkgaWYgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCBjb3JyZWN0X29wdGlvbl9pZCBpcyBrbm93biB0byB0aGUgYm90LiBUaGUgbWV0aG9kIGlzIGFuYWxvZ291cyB0byB0aGUgbWV0aG9kIGZvcndhcmRNZXNzYWdlcywgYnV0IHRoZSBjb3BpZWQgbWVzc2FnZXMgZG9uJ3QgaGF2ZSBhIGxpbmsgdG8gdGhlIG9yaWdpbmFsIG1lc3NhZ2UuIEFsYnVtIGdyb3VwaW5nIGlzIGtlcHQgZm9yIGNvcGllZCBtZXNzYWdlcy4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZUlkIG9mIHRoZSBzZW50IG1lc3NhZ2VzIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZXMgd2VyZSBzZW50IChvciBjaGFubmVsIHVzZXJuYW1lIGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZHMgQSBsaXN0IG9mIDEtMTAwIGlkZW50aWZpZXJzIG9mIG1lc3NhZ2VzIGluIHRoZSBjaGF0IGZyb21fY2hhdF9pZCB0byBjb3B5LiBUaGUgaWRlbnRpZmllcnMgbXVzdCBiZSBzcGVjaWZpZWQgaW4gYSBzdHJpY3RseSBpbmNyZWFzaW5nIG9yZGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2NvcHltZXNzYWdlc1xuICAgICAqL1xuICAgIGNvcHlNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBmcm9tX2NoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZHM6IG51bWJlcltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiY29weU1lc3NhZ2VzXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwiZnJvbV9jaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNvcHlNZXNzYWdlcyh7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgZnJvbV9jaGF0X2lkLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwaG90b3MuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBwaG90byBQaG90byB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIHBob3RvIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIHBob3RvIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgcGhvdG8gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gVGhlIHBob3RvIG11c3QgYmUgYXQgbW9zdCAxMCBNQiBpbiBzaXplLiBUaGUgcGhvdG8ncyB3aWR0aCBhbmQgaGVpZ2h0IG11c3Qgbm90IGV4Y2VlZCAxMDAwMCBpbiB0b3RhbC4gV2lkdGggYW5kIGhlaWdodCByYXRpbyBtdXN0IGJlIGF0IG1vc3QgMjAuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHBob3RvXG4gICAgICovXG4gICAgc2VuZFBob3RvKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHBob3RvOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kUGhvdG9cIiwgXCJjaGF0X2lkXCIgfCBcInBob3RvXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRQaG90byh7IGNoYXRfaWQsIHBob3RvLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGF1ZGlvIGZpbGVzLCBpZiB5b3Ugd2FudCBUZWxlZ3JhbSBjbGllbnRzIHRvIGRpc3BsYXkgdGhlbSBpbiB0aGUgbXVzaWMgcGxheWVyLiBZb3VyIGF1ZGlvIG11c3QgYmUgaW4gdGhlIC5NUDMgb3IgLk00QSBmb3JtYXQuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIGF1ZGlvIGZpbGVzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEZvciBzZW5kaW5nIHZvaWNlIG1lc3NhZ2VzLCB1c2UgdGhlIHNlbmRWb2ljZSBtZXRob2QgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIGF1ZGlvIEF1ZGlvIGZpbGUgdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYW4gYXVkaW8gZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYW4gYXVkaW8gZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhdWRpb1xuICAgICAqL1xuICAgIHNlbmRBdWRpbyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBhdWRpbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZEF1ZGlvXCIsIFwiY2hhdF9pZFwiIHwgXCJhdWRpb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kQXVkaW8oeyBjaGF0X2lkLCBhdWRpbywgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBnZW5lcmFsIGZpbGVzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBmaWxlcyBvZiBhbnkgdHlwZSBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBkb2N1bWVudCBGaWxlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGRvY3VtZW50XG4gICAgICovXG4gICAgc2VuZERvY3VtZW50KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGRvY3VtZW50OiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kRG9jdW1lbnRcIiwgXCJjaGF0X2lkXCIgfCBcImRvY3VtZW50XCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmREb2N1bWVudCh7IGNoYXRfaWQsIGRvY3VtZW50LCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIGZpbGVzLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgbXA0IHZpZGVvcyAob3RoZXIgZm9ybWF0cyBtYXkgYmUgc2VudCBhcyBEb2N1bWVudCkuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIHZpZGVvIGZpbGVzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHZpZGVvIFZpZGVvIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgdmlkZW8gZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmR2aWRlb1xuICAgICAqL1xuICAgIHNlbmRWaWRlbyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB2aWRlbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZFZpZGVvXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kVmlkZW8oeyBjaGF0X2lkLCB2aWRlbywgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbmltYXRpb24gZmlsZXMgKEdJRiBvciBILjI2NC9NUEVHLTQgQVZDIHZpZGVvIHdpdGhvdXQgc291bmQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBhbmltYXRpb24gZmlsZXMgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gYW5pbWF0aW9uIEFuaW1hdGlvbiB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhbiBhbmltYXRpb24gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGFuIGFuaW1hdGlvbiBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IGFuaW1hdGlvbiB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhbmltYXRpb25cbiAgICAgKi9cbiAgICBzZW5kQW5pbWF0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGFuaW1hdGlvbjogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZEFuaW1hdGlvblwiLCBcImNoYXRfaWRcIiB8IFwiYW5pbWF0aW9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRBbmltYXRpb24oeyBjaGF0X2lkLCBhbmltYXRpb24sIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYXVkaW8gZmlsZXMsIGlmIHlvdSB3YW50IFRlbGVncmFtIGNsaWVudHMgdG8gZGlzcGxheSB0aGUgZmlsZSBhcyBhIHBsYXlhYmxlIHZvaWNlIG1lc3NhZ2UuIEZvciB0aGlzIHRvIHdvcmssIHlvdXIgYXVkaW8gbXVzdCBiZSBpbiBhbiAuT0dHIGZpbGUgZW5jb2RlZCB3aXRoIE9QVVMgKG90aGVyIGZvcm1hdHMgbWF5IGJlIHNlbnQgYXMgQXVkaW8gb3IgRG9jdW1lbnQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCB2b2ljZSBtZXNzYWdlcyBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB2b2ljZSBBdWRpbyBmaWxlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZvaWNlXG4gICAgICovXG4gICAgc2VuZFZvaWNlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHZvaWNlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kVm9pY2VcIiwgXCJjaGF0X2lkXCIgfCBcInZvaWNlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRWb2ljZSh7IGNoYXRfaWQsIHZvaWNlLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqIEFzIG9mIHYuNC4wLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgcm91bmRlZCBzcXVhcmUgbXA0IHZpZGVvcyBvZiB1cCB0byAxIG1pbnV0ZSBsb25nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdmlkZW9fbm90ZSBWaWRlbyBub3RlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gbm90ZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLi4gU2VuZGluZyB2aWRlbyBub3RlcyBieSBhIFVSTCBpcyBjdXJyZW50bHkgdW5zdXBwb3J0ZWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kdmlkZW9ub3RlXG4gICAgICovXG4gICAgc2VuZFZpZGVvTm90ZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB2aWRlb19ub3RlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kVmlkZW9Ob3RlXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb19ub3RlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRWaWRlb05vdGUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHZpZGVvX25vdGUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYSBncm91cCBvZiBwaG90b3MsIHZpZGVvcywgZG9jdW1lbnRzIG9yIGF1ZGlvcyBhcyBhbiBhbGJ1bS4gRG9jdW1lbnRzIGFuZCBhdWRpbyBmaWxlcyBjYW4gYmUgb25seSBncm91cGVkIGluIGFuIGFsYnVtIHdpdGggbWVzc2FnZXMgb2YgdGhlIHNhbWUgdHlwZS4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZXMgdGhhdCB3ZXJlIHNlbnQgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBhcnJheSBkZXNjcmliaW5nIG1lc3NhZ2VzIHRvIGJlIHNlbnQsIG11c3QgaW5jbHVkZSAyLTEwIGl0ZW1zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lZGlhZ3JvdXBcbiAgICAgKi9cbiAgICBzZW5kTWVkaWFHcm91cChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZWRpYTogUmVhZG9ubHlBcnJheTxcbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYUF1ZGlvXG4gICAgICAgICAgICB8IElucHV0TWVkaWFEb2N1bWVudFxuICAgICAgICAgICAgfCBJbnB1dE1lZGlhUGhvdG9cbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYVZpZGVvXG4gICAgICAgID4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kTWVkaWFHcm91cFwiLCBcImNoYXRfaWRcIiB8IFwibWVkaWFcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZE1lZGlhR3JvdXAoeyBjaGF0X2lkLCBtZWRpYSwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwb2ludCBvbiB0aGUgbWFwLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTGF0aXR1ZGUgb2YgdGhlIGxvY2F0aW9uXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgdGhlIGxvY2F0aW9uXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGxvY2F0aW9uXG4gICAgICovXG4gICAgc2VuZExvY2F0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZExvY2F0aW9uXCIsIFwiY2hhdF9pZFwiIHwgXCJsYXRpdHVkZVwiIHwgXCJsb25naXR1ZGVcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZExvY2F0aW9uKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGxpdmUgbG9jYXRpb24gbWVzc2FnZXMuIEEgbG9jYXRpb24gY2FuIGJlIGVkaXRlZCB1bnRpbCBpdHMgbGl2ZV9wZXJpb2QgZXhwaXJlcyBvciBlZGl0aW5nIGlzIGV4cGxpY2l0bHkgZGlzYWJsZWQgYnkgYSBjYWxsIHRvIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTGF0aXR1ZGUgb2YgbmV3IGxvY2F0aW9uXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgbmV3IGxvY2F0aW9uXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VsaXZlbG9jYXRpb25cbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZUxpdmVMb2NhdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIHwgXCJjaGF0X2lkXCJcbiAgICAgICAgICAgIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgICAgICB8IFwibGF0aXR1ZGVcIlxuICAgICAgICAgICAgfCBcImxvbmdpdHVkZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIGxhdGl0dWRlLCBsb25naXR1ZGUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgbGl2ZSBsb2NhdGlvbiBpbmxpbmUgbWVzc2FnZXMuIEEgbG9jYXRpb24gY2FuIGJlIGVkaXRlZCB1bnRpbCBpdHMgbGl2ZV9wZXJpb2QgZXhwaXJlcyBvciBlZGl0aW5nIGlzIGV4cGxpY2l0bHkgZGlzYWJsZWQgYnkgYSBjYWxsIHRvIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlbGl2ZWxvY2F0aW9uXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25JbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIHwgXCJjaGF0X2lkXCJcbiAgICAgICAgICAgIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgICAgICB8IFwibGF0aXR1ZGVcIlxuICAgICAgICAgICAgfCBcImxvbmdpdHVkZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzdG9wIHVwZGF0aW5nIGEgbGl2ZSBsb2NhdGlvbiBtZXNzYWdlIGJlZm9yZSBsaXZlX3BlcmlvZCBleHBpcmVzLiBPbiBzdWNjZXNzLCBpZiB0aGUgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2Ugd2l0aCBsaXZlIGxvY2F0aW9uIHRvIHN0b3BcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzdG9wbWVzc2FnZWxpdmVsb2NhdGlvblxuICAgICAqL1xuICAgIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHN0b3AgdXBkYXRpbmcgYSBsaXZlIGxvY2F0aW9uIG1lc3NhZ2UgYmVmb3JlIGxpdmVfcGVyaW9kIGV4cGlyZXMuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3N0b3BtZXNzYWdlbGl2ZWxvY2F0aW9uXG4gICAgICovXG4gICAgc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25JbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzdG9wTWVzc2FnZUxpdmVMb2NhdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwYWlkIG1lZGlhLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc3Rhcl9jb3VudCBUaGUgbnVtYmVyIG9mIFRlbGVncmFtIFN0YXJzIHRoYXQgbXVzdCBiZSBwYWlkIHRvIGJ1eSBhY2Nlc3MgdG8gdGhlIG1lZGlhXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIGFycmF5IGRlc2NyaWJpbmcgdGhlIG1lZGlhIHRvIGJlIHNlbnQ7IHVwIHRvIDEwIGl0ZW1zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHBhaWRtZWRpYVxuICAgICAqL1xuICAgIHNlbmRQYWlkTWVkaWEoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgc3Rhcl9jb3VudDogbnVtYmVyLFxuICAgICAgICBtZWRpYTogSW5wdXRQYWlkTWVkaWFbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNlbmRQYWlkTWVkaWFcIiwgXCJjaGF0X2lkXCIgfCBcInN0YXJfY291bnRcIiB8IFwibWVkaWFcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZFBhaWRNZWRpYShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgc3Rhcl9jb3VudCwgbWVkaWEsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgaW5mb3JtYXRpb24gYWJvdXQgYSB2ZW51ZS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSB0aXRsZSBOYW1lIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBhZGRyZXNzIEFkZHJlc3Mgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZlbnVlXG4gICAgICovXG4gICAgc2VuZFZlbnVlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzZW5kVmVudWVcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJsYXRpdHVkZVwiIHwgXCJsb25naXR1ZGVcIiB8IFwidGl0bGVcIiB8IFwiYWRkcmVzc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZFZlbnVlKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCB0aXRsZSwgYWRkcmVzcywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwaG9uZSBjb250YWN0cy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBob25lX251bWJlciBDb250YWN0J3MgcGhvbmUgbnVtYmVyXG4gICAgICogQHBhcmFtIGZpcnN0X25hbWUgQ29udGFjdCdzIGZpcnN0IG5hbWVcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kY29udGFjdFxuICAgICAqL1xuICAgIHNlbmRDb250YWN0KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHBob25lX251bWJlcjogc3RyaW5nLFxuICAgICAgICBmaXJzdF9uYW1lOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzZW5kQ29udGFjdFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcInBob25lX251bWJlclwiIHwgXCJmaXJzdF9uYW1lXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kQ29udGFjdChcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgcGhvbmVfbnVtYmVyLCBmaXJzdF9uYW1lLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGEgbmF0aXZlIHBvbGwuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBxdWVzdGlvbiBQb2xsIHF1ZXN0aW9uLCAxLTMwMCBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIG9wdGlvbnMgQSBsaXN0IG9mIGFuc3dlciBvcHRpb25zLCAyLTEwIHN0cmluZ3MgMS0xMDAgY2hhcmFjdGVycyBlYWNoXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHBvbGxcbiAgICAgKi9cbiAgICBzZW5kUG9sbChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBxdWVzdGlvbjogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJbnB1dFBvbGxPcHRpb25bXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNlbmRQb2xsXCIsIFwiY2hhdF9pZFwiIHwgXCJxdWVzdGlvblwiIHwgXCJvcHRpb25zXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRQb2xsKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBxdWVzdGlvbiwgb3B0aW9ucywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbiBhbmltYXRlZCBlbW9qaSB0aGF0IHdpbGwgZGlzcGxheSBhIHJhbmRvbSB2YWx1ZS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIGVtb2ppIEVtb2ppIG9uIHdoaWNoIHRoZSBkaWNlIHRocm93IGFuaW1hdGlvbiBpcyBiYXNlZC4gQ3VycmVudGx5LCBtdXN0IGJlIG9uZSBvZiDigJzwn46y4oCdLCDigJzwn46v4oCdLCDigJzwn4+A4oCdLCDigJzimr3igJ0sIOKAnPCfjrPigJ0sIG9yIOKAnPCfjrDigJ0uIERpY2UgY2FuIGhhdmUgdmFsdWVzIDEtNiBmb3Ig4oCc8J+OsuKAnSwg4oCc8J+Or+KAnSBhbmQg4oCc8J+Os+KAnSwgdmFsdWVzIDEtNSBmb3Ig4oCc8J+PgOKAnSBhbmQg4oCc4pq94oCdLCBhbmQgdmFsdWVzIDEtNjQgZm9yIOKAnPCfjrDigJ0uIERlZmF1bHRzIHRvIOKAnPCfjrLigJ1cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kZGljZVxuICAgICAqL1xuICAgIHNlbmREaWNlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGVtb2ppOlxuICAgICAgICAgICAgfCAoc3RyaW5nICYgUmVjb3JkPG5ldmVyLCBuZXZlcj4pXG4gICAgICAgICAgICB8IFwi8J+OslwiXG4gICAgICAgICAgICB8IFwi8J+Or1wiXG4gICAgICAgICAgICB8IFwi8J+PgFwiXG4gICAgICAgICAgICB8IFwi4pq9XCJcbiAgICAgICAgICAgIHwgXCLwn46zXCJcbiAgICAgICAgICAgIHwgXCLwn46wXCIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kRGljZVwiLCBcImNoYXRfaWRcIiB8IFwiZW1vamlcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZERpY2UoeyBjaGF0X2lkLCBlbW9qaSwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBjaG9zZW4gcmVhY3Rpb25zIG9uIGEgbWVzc2FnZS4gU2VydmljZSBtZXNzYWdlcyBjYW4ndCBiZSByZWFjdGVkIHRvLiBBdXRvbWF0aWNhbGx5IGZvcndhcmRlZCBtZXNzYWdlcyBmcm9tIGEgY2hhbm5lbCB0byBpdHMgZGlzY3Vzc2lvbiBncm91cCBoYXZlIHRoZSBzYW1lIGF2YWlsYWJsZSByZWFjdGlvbnMgYXMgbWVzc2FnZXMgaW4gdGhlIGNoYW5uZWwuIEJvdHMgY2FuJ3QgdXNlIHBhaWQgcmVhY3Rpb25zLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gcmVhY3Rpb24gQSBsaXN0IG9mIHJlYWN0aW9uIHR5cGVzIHRvIHNldCBvbiB0aGUgbWVzc2FnZS4gQ3VycmVudGx5LCBhcyBub24tcHJlbWl1bSB1c2VycywgYm90cyBjYW4gc2V0IHVwIHRvIG9uZSByZWFjdGlvbiBwZXIgbWVzc2FnZS4gQSBjdXN0b20gZW1vamkgcmVhY3Rpb24gY2FuIGJlIHVzZWQgaWYgaXQgaXMgZWl0aGVyIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgbWVzc2FnZSBvciBleHBsaWNpdGx5IGFsbG93ZWQgYnkgY2hhdCBhZG1pbmlzdHJhdG9ycy4gUGFpZCByZWFjdGlvbnMgY2FuJ3QgYmUgdXNlZCBieSBib3RzLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldG1lc3NhZ2VyZWFjdGlvblxuICAgICAqL1xuICAgIHNldE1lc3NhZ2VSZWFjdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIHJlYWN0aW9uOiBSZWFjdGlvblR5cGVbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNldE1lc3NhZ2VSZWFjdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwicmVhY3Rpb25cIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldE1lc3NhZ2VSZWFjdGlvbih7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgICAgIHJlYWN0aW9uLFxuICAgICAgICAgICAgLi4ub3RoZXIsXG4gICAgICAgIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHdoZW4geW91IG5lZWQgdG8gdGVsbCB0aGUgdXNlciB0aGF0IHNvbWV0aGluZyBpcyBoYXBwZW5pbmcgb24gdGhlIGJvdCdzIHNpZGUuIFRoZSBzdGF0dXMgaXMgc2V0IGZvciA1IHNlY29uZHMgb3IgbGVzcyAod2hlbiBhIG1lc3NhZ2UgYXJyaXZlcyBmcm9tIHlvdXIgYm90LCBUZWxlZ3JhbSBjbGllbnRzIGNsZWFyIGl0cyB0eXBpbmcgc3RhdHVzKS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlOiBUaGUgSW1hZ2VCb3QgbmVlZHMgc29tZSB0aW1lIHRvIHByb2Nlc3MgYSByZXF1ZXN0IGFuZCB1cGxvYWQgdGhlIGltYWdlLiBJbnN0ZWFkIG9mIHNlbmRpbmcgYSB0ZXh0IG1lc3NhZ2UgYWxvbmcgdGhlIGxpbmVzIG9mIOKAnFJldHJpZXZpbmcgaW1hZ2UsIHBsZWFzZSB3YWl04oCm4oCdLCB0aGUgYm90IG1heSB1c2Ugc2VuZENoYXRBY3Rpb24gd2l0aCBhY3Rpb24gPSB1cGxvYWRfcGhvdG8uIFRoZSB1c2VyIHdpbGwgc2VlIGEg4oCcc2VuZGluZyBwaG90b+KAnSBzdGF0dXMgZm9yIHRoZSBib3QuXG4gICAgICpcbiAgICAgKiBXZSBvbmx5IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB3aGVuIGEgcmVzcG9uc2UgZnJvbSB0aGUgYm90IHdpbGwgdGFrZSBhIG5vdGljZWFibGUgYW1vdW50IG9mIHRpbWUgdG8gYXJyaXZlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gYWN0aW9uIFR5cGUgb2YgYWN0aW9uIHRvIGJyb2FkY2FzdC4gQ2hvb3NlIG9uZSwgZGVwZW5kaW5nIG9uIHdoYXQgdGhlIHVzZXIgaXMgYWJvdXQgdG8gcmVjZWl2ZTogdHlwaW5nIGZvciB0ZXh0IG1lc3NhZ2VzLCB1cGxvYWRfcGhvdG8gZm9yIHBob3RvcywgcmVjb3JkX3ZpZGVvIG9yIHVwbG9hZF92aWRlbyBmb3IgdmlkZW9zLCByZWNvcmRfdm9pY2Ugb3IgdXBsb2FkX3ZvaWNlIGZvciB2b2ljZSBub3RlcywgdXBsb2FkX2RvY3VtZW50IGZvciBnZW5lcmFsIGZpbGVzLCBjaG9vc2Vfc3RpY2tlciBmb3Igc3RpY2tlcnMsIGZpbmRfbG9jYXRpb24gZm9yIGxvY2F0aW9uIGRhdGEsIHJlY29yZF92aWRlb19ub3RlIG9yIHVwbG9hZF92aWRlb19ub3RlIGZvciB2aWRlbyBub3Rlcy5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kY2hhdGFjdGlvblxuICAgICAqL1xuICAgIHNlbmRDaGF0QWN0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGFjdGlvbjpcbiAgICAgICAgICAgIHwgXCJ0eXBpbmdcIlxuICAgICAgICAgICAgfCBcInVwbG9hZF9waG90b1wiXG4gICAgICAgICAgICB8IFwicmVjb3JkX3ZpZGVvXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdmlkZW9cIlxuICAgICAgICAgICAgfCBcInJlY29yZF92b2ljZVwiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3ZvaWNlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfZG9jdW1lbnRcIlxuICAgICAgICAgICAgfCBcImNob29zZV9zdGlja2VyXCJcbiAgICAgICAgICAgIHwgXCJmaW5kX2xvY2F0aW9uXCJcbiAgICAgICAgICAgIHwgXCJyZWNvcmRfdmlkZW9fbm90ZVwiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3ZpZGVvX25vdGVcIixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNlbmRDaGF0QWN0aW9uXCIsIFwiY2hhdF9pZFwiIHwgXCJhY3Rpb25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZENoYXRBY3Rpb24oeyBjaGF0X2lkLCBhY3Rpb24sIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBhIGxpc3Qgb2YgcHJvZmlsZSBwaWN0dXJlcyBmb3IgYSB1c2VyLiBSZXR1cm5zIGEgVXNlclByb2ZpbGVQaG90b3Mgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0dXNlcnByb2ZpbGVwaG90b3NcbiAgICAgKi9cbiAgICBnZXRVc2VyUHJvZmlsZVBob3RvcyhcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZ2V0VXNlclByb2ZpbGVQaG90b3NcIiwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldFVzZXJQcm9maWxlUGhvdG9zKHsgdXNlcl9pZCwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBsaXN0IG9mIGJvb3N0cyBhZGRlZCB0byBhIGNoYXQgYnkgYSB1c2VyLiBSZXF1aXJlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cyBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIFVzZXJDaGF0Qm9vc3RzIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0dXNlcmNoYXRib29zdHNcbiAgICAgKi9cbiAgICBnZXRVc2VyQ2hhdEJvb3N0cyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0VXNlckNoYXRCb29zdHMoeyBjaGF0X2lkLCB1c2VyX2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY29ubmVjdGlvbiBvZiB0aGUgYm90IHdpdGggYSBidXNpbmVzcyBhY2NvdW50LiBSZXR1cm5zIGEgQnVzaW5lc3NDb25uZWN0aW9uIG9iamVjdCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIGJ1c2luZXNzIGNvbm5lY3Rpb25cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGJ1c2luZXNzY29ubmVjdGlvblxuICAgICAqL1xuICAgIGdldEJ1c2luZXNzQ29ubmVjdGlvbihcbiAgICAgICAgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldEJ1c2luZXNzQ29ubmVjdGlvbihcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgYmFzaWMgaW5mbyBhYm91dCBhIGZpbGUgYW5kIHByZXBhcmUgaXQgZm9yIGRvd25sb2FkaW5nLiBGb3IgdGhlIG1vbWVudCwgYm90cyBjYW4gZG93bmxvYWQgZmlsZXMgb2YgdXAgdG8gMjBNQiBpbiBzaXplLiBPbiBzdWNjZXNzLCBhIEZpbGUgb2JqZWN0IGlzIHJldHVybmVkLiBUaGUgZmlsZSBjYW4gdGhlbiBiZSBkb3dubG9hZGVkIHZpYSB0aGUgbGluayBgaHR0cHM6Ly9hcGkudGVsZWdyYW0ub3JnL2ZpbGUvYm90PHRva2VuPi88ZmlsZV9wYXRoPmAsIHdoZXJlIGA8ZmlsZV9wYXRoPmAgaXMgdGFrZW4gZnJvbSB0aGUgcmVzcG9uc2UuIEl0IGlzIGd1YXJhbnRlZWQgdGhhdCB0aGUgbGluayB3aWxsIGJlIHZhbGlkIGZvciBhdCBsZWFzdCAxIGhvdXIuIFdoZW4gdGhlIGxpbmsgZXhwaXJlcywgYSBuZXcgb25lIGNhbiBiZSByZXF1ZXN0ZWQgYnkgY2FsbGluZyBnZXRGaWxlIGFnYWluLlxuICAgICAqXG4gICAgICogTm90ZTogVGhpcyBmdW5jdGlvbiBtYXkgbm90IHByZXNlcnZlIHRoZSBvcmlnaW5hbCBmaWxlIG5hbWUgYW5kIE1JTUUgdHlwZS4gWW91IHNob3VsZCBzYXZlIHRoZSBmaWxlJ3MgTUlNRSB0eXBlIGFuZCBuYW1lIChpZiBhdmFpbGFibGUpIHdoZW4gdGhlIEZpbGUgb2JqZWN0IGlzIHJlY2VpdmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGZpbGVfaWQgRmlsZSBpZGVudGlmaWVyIHRvIGdldCBpbmZvIGFib3V0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRmaWxlXG4gICAgICovXG4gICAgZ2V0RmlsZShmaWxlX2lkOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRGaWxlKHsgZmlsZV9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgYGJhbkNoYXRNZW1iZXJgIGluc3RlYWQuICovXG4gICAga2lja0NoYXRNZW1iZXIoLi4uYXJnczogUGFyYW1ldGVyczxBcGlbXCJiYW5DaGF0TWVtYmVyXCJdPikge1xuICAgICAgICByZXR1cm4gdGhpcy5iYW5DaGF0TWVtYmVyKC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBiYW4gYSB1c2VyIGluIGEgZ3JvdXAsIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIEluIHRoZSBjYXNlIG9mIHN1cGVyZ3JvdXBzIGFuZCBjaGFubmVscywgdGhlIHVzZXIgd2lsbCBub3QgYmUgYWJsZSB0byByZXR1cm4gdG8gdGhlIGNoYXQgb24gdGhlaXIgb3duIHVzaW5nIGludml0ZSBsaW5rcywgZXRjLiwgdW5sZXNzIHVuYmFubmVkIGZpcnN0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGdyb3VwIG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYmFuY2hhdG1lbWJlclxuICAgICAqL1xuICAgIGJhbkNoYXRNZW1iZXIoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiYmFuQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5iYW5DaGF0TWVtYmVyKHsgY2hhdF9pZCwgdXNlcl9pZCwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gdW5iYW4gYSBwcmV2aW91c2x5IGJhbm5lZCB1c2VyIGluIGEgc3VwZXJncm91cCBvciBjaGFubmVsLiBUaGUgdXNlciB3aWxsIG5vdCByZXR1cm4gdG8gdGhlIGdyb3VwIG9yIGNoYW5uZWwgYXV0b21hdGljYWxseSwgYnV0IHdpbGwgYmUgYWJsZSB0byBqb2luIHZpYSBsaW5rLCBldGMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGZvciB0aGlzIHRvIHdvcmsuIEJ5IGRlZmF1bHQsIHRoaXMgbWV0aG9kIGd1YXJhbnRlZXMgdGhhdCBhZnRlciB0aGUgY2FsbCB0aGUgdXNlciBpcyBub3QgYSBtZW1iZXIgb2YgdGhlIGNoYXQsIGJ1dCB3aWxsIGJlIGFibGUgdG8gam9pbiBpdC4gU28gaWYgdGhlIHVzZXIgaXMgYSBtZW1iZXIgb2YgdGhlIGNoYXQgdGhleSB3aWxsIGFsc28gYmUgcmVtb3ZlZCBmcm9tIHRoZSBjaGF0LiBJZiB5b3UgZG9uJ3Qgd2FudCB0aGlzLCB1c2UgdGhlIHBhcmFtZXRlciBvbmx5X2lmX2Jhbm5lZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBncm91cCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5iYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgdW5iYW5DaGF0TWVtYmVyKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInVuYmFuQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51bmJhbkNoYXRNZW1iZXIoeyBjaGF0X2lkLCB1c2VyX2lkLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byByZXN0cmljdCBhIHVzZXIgaW4gYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIFRydWUgZm9yIGFsbCBwZXJtaXNzaW9ucyB0byBsaWZ0IHJlc3RyaWN0aW9ucyBmcm9tIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBwZXJtaXNzaW9ucyBBbiBvYmplY3QgZm9yIG5ldyB1c2VyIHBlcm1pc3Npb25zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmVzdHJpY3RjaGF0bWVtYmVyXG4gICAgICovXG4gICAgcmVzdHJpY3RDaGF0TWVtYmVyKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgcGVybWlzc2lvbnM6IENoYXRQZXJtaXNzaW9ucyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInJlc3RyaWN0Q2hhdE1lbWJlclwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIiB8IFwicGVybWlzc2lvbnNcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnJlc3RyaWN0Q2hhdE1lbWJlcihcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgdXNlcl9pZCwgcGVybWlzc2lvbnMsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHByb21vdGUgb3IgZGVtb3RlIGEgdXNlciBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIEZhbHNlIGZvciBhbGwgYm9vbGVhbiBwYXJhbWV0ZXJzIHRvIGRlbW90ZSBhIHVzZXIuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwcm9tb3RlY2hhdG1lbWJlclxuICAgICAqL1xuICAgIHByb21vdGVDaGF0TWVtYmVyKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInByb21vdGVDaGF0TWVtYmVyXCIsIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnByb21vdGVDaGF0TWVtYmVyKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCB1c2VyX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBjdXN0b20gdGl0bGUgZm9yIGFuIGFkbWluaXN0cmF0b3IgaW4gYSBzdXBlcmdyb3VwIHByb21vdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gY3VzdG9tX3RpdGxlIE5ldyBjdXN0b20gdGl0bGUgZm9yIHRoZSBhZG1pbmlzdHJhdG9yOyAwLTE2IGNoYXJhY3RlcnMsIGVtb2ppIGFyZSBub3QgYWxsb3dlZFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdGFkbWluaXN0cmF0b3JjdXN0b210aXRsZVxuICAgICAqL1xuICAgIHNldENoYXRBZG1pbmlzdHJhdG9yQ3VzdG9tVGl0bGUoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBjdXN0b21fdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCB1c2VyX2lkLCBjdXN0b21fdGl0bGUgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gYmFuIGEgY2hhbm5lbCBjaGF0IGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFVudGlsIHRoZSBjaGF0IGlzIHVuYmFubmVkLCB0aGUgb3duZXIgb2YgdGhlIGJhbm5lZCBjaGF0IHdvbid0IGJlIGFibGUgdG8gc2VuZCBtZXNzYWdlcyBvbiBiZWhhbGYgb2YgYW55IG9mIHRoZWlyIGNoYW5uZWxzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgc3VwZXJncm91cCBvciBjaGFubmVsIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2VuZGVyX2NoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCBzZW5kZXIgY2hhdFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYmFuY2hhdHNlbmRlcmNoYXRcbiAgICAgKi9cbiAgICBiYW5DaGF0U2VuZGVyQ2hhdChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBzZW5kZXJfY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmJhbkNoYXRTZW5kZXJDaGF0KHsgY2hhdF9pZCwgc2VuZGVyX2NoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gdW5iYW4gYSBwcmV2aW91c2x5IGJhbm5lZCBjaGFubmVsIGNoYXQgaW4gYSBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2VuZGVyX2NoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCBzZW5kZXIgY2hhdFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5iYW5jaGF0c2VuZGVyY2hhdFxuICAgICAqL1xuICAgIHVuYmFuQ2hhdFNlbmRlckNoYXQoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgc2VuZGVyX2NoYXRfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51bmJhbkNoYXRTZW5kZXJDaGF0KFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBzZW5kZXJfY2hhdF9pZCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgZGVmYXVsdCBjaGF0IHBlcm1pc3Npb25zIGZvciBhbGwgbWVtYmVycy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGdyb3VwIG9yIGEgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9yZXN0cmljdF9tZW1iZXJzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBlcm1pc3Npb25zIE5ldyBkZWZhdWx0IGNoYXQgcGVybWlzc2lvbnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0cGVybWlzc2lvbnNcbiAgICAgKi9cbiAgICBzZXRDaGF0UGVybWlzc2lvbnMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgcGVybWlzc2lvbnM6IENoYXRQZXJtaXNzaW9ucyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNldENoYXRQZXJtaXNzaW9uc1wiLCBcImNoYXRfaWRcIiB8IFwicGVybWlzc2lvbnNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0Q2hhdFBlcm1pc3Npb25zKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBwZXJtaXNzaW9ucywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2VuZXJhdGUgYSBuZXcgcHJpbWFyeSBpbnZpdGUgbGluayBmb3IgYSBjaGF0OyBhbnkgcHJldmlvdXNseSBnZW5lcmF0ZWQgcHJpbWFyeSBsaW5rIGlzIHJldm9rZWQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgdGhlIG5ldyBpbnZpdGUgbGluayBhcyBTdHJpbmcgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIE5vdGU6IEVhY2ggYWRtaW5pc3RyYXRvciBpbiBhIGNoYXQgZ2VuZXJhdGVzIHRoZWlyIG93biBpbnZpdGUgbGlua3MuIEJvdHMgY2FuJ3QgdXNlIGludml0ZSBsaW5rcyBnZW5lcmF0ZWQgYnkgb3RoZXIgYWRtaW5pc3RyYXRvcnMuIElmIHlvdSB3YW50IHlvdXIgYm90IHRvIHdvcmsgd2l0aCBpbnZpdGUgbGlua3MsIGl0IHdpbGwgbmVlZCB0byBnZW5lcmF0ZSBpdHMgb3duIGxpbmsgdXNpbmcgZXhwb3J0Q2hhdEludml0ZUxpbmsgb3IgYnkgY2FsbGluZyB0aGUgZ2V0Q2hhdCBtZXRob2QuIElmIHlvdXIgYm90IG5lZWRzIHRvIGdlbmVyYXRlIGEgbmV3IHByaW1hcnkgaW52aXRlIGxpbmsgcmVwbGFjaW5nIGl0cyBwcmV2aW91cyBvbmUsIHVzZSBleHBvcnRDaGF0SW52aXRlTGluayBhZ2Fpbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNleHBvcnRjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGV4cG9ydENoYXRJbnZpdGVMaW5rKGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmV4cG9ydENoYXRJbnZpdGVMaW5rKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYW4gYWRkaXRpb25hbCBpbnZpdGUgbGluayBmb3IgYSBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgbGluayBjYW4gYmUgcmV2b2tlZCB1c2luZyB0aGUgbWV0aG9kIHJldm9rZUNoYXRJbnZpdGVMaW5rLiBSZXR1cm5zIHRoZSBuZXcgaW52aXRlIGxpbmsgYXMgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGNyZWF0ZUNoYXRJbnZpdGVMaW5rKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJjcmVhdGVDaGF0SW52aXRlTGlua1wiLCBcImNoYXRfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuY3JlYXRlQ2hhdEludml0ZUxpbmsoeyBjaGF0X2lkLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGEgbm9uLXByaW1hcnkgaW52aXRlIGxpbmsgY3JlYXRlZCBieSB0aGUgYm90LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSBlZGl0ZWQgaW52aXRlIGxpbmsgYXMgYSBDaGF0SW52aXRlTGluayBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBpbnZpdGVfbGluayBUaGUgaW52aXRlIGxpbmsgdG8gZWRpdFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGVkaXRDaGF0SW52aXRlTGluayhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZWRpdENoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiIHwgXCJpbnZpdGVfbGlua1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0Q2hhdEludml0ZUxpbmsoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIGludml0ZV9saW5rLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYSBzdWJzY3JpcHRpb24gaW52aXRlIGxpbmsgZm9yIGEgY2hhbm5lbCBjaGF0LiBUaGUgYm90IG11c3QgaGF2ZSB0aGUgY2FuX2ludml0ZV91c2VycyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gVGhlIGxpbmsgY2FuIGJlIGVkaXRlZCB1c2luZyB0aGUgbWV0aG9kIGVkaXRDaGF0U3Vic2NyaXB0aW9uSW52aXRlTGluayBvciByZXZva2VkIHVzaW5nIHRoZSBtZXRob2QgcmV2b2tlQ2hhdEludml0ZUxpbmsuIFJldHVybnMgdGhlIG5ldyBpbnZpdGUgbGluayBhcyBhIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYW5uZWwgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc3Vic2NyaXB0aW9uX3BlcmlvZCBUaGUgbnVtYmVyIG9mIHNlY29uZHMgdGhlIHN1YnNjcmlwdGlvbiB3aWxsIGJlIGFjdGl2ZSBmb3IgYmVmb3JlIHRoZSBuZXh0IHBheW1lbnQuIEN1cnJlbnRseSwgaXQgbXVzdCBhbHdheXMgYmUgMjU5MjAwMCAoMzAgZGF5cykuXG4gICAgICogQHBhcmFtIHN1YnNjcmlwdGlvbl9wcmljZSBUaGUgYW1vdW50IG9mIFRlbGVncmFtIFN0YXJzIGEgdXNlciBtdXN0IHBheSBpbml0aWFsbHkgYW5kIGFmdGVyIGVhY2ggc3Vic2VxdWVudCBzdWJzY3JpcHRpb24gcGVyaW9kIHRvIGJlIGEgbWVtYmVyIG9mIHRoZSBjaGF0OyAxLTI1MDBcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVjaGF0c3Vic2NyaXB0aW9uaW52aXRlbGlua1xuICAgICAqL1xuICAgIGNyZWF0ZUNoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHN1YnNjcmlwdGlvbl9wZXJpb2Q6IG51bWJlcixcbiAgICAgICAgc3Vic2NyaXB0aW9uX3ByaWNlOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJjcmVhdGVDaGF0U3Vic2NyaXB0aW9uSW52aXRlTGlua1wiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcInN1YnNjcmlwdGlvbl9wZXJpb2RcIiB8IFwic3Vic2NyaXB0aW9uX3ByaWNlXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jcmVhdGVDaGF0U3Vic2NyaXB0aW9uSW52aXRlTGluayhcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgc3Vic2NyaXB0aW9uX3BlcmlvZCwgc3Vic2NyaXB0aW9uX3ByaWNlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGEgc3Vic2NyaXB0aW9uIGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gVGhlIGJvdCBtdXN0IGhhdmUgdGhlIGNhbl9pbnZpdGVfdXNlcnMgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgdGhlIGVkaXRlZCBpbnZpdGUgbGluayBhcyBhIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIGludml0ZV9saW5rIFRoZSBpbnZpdGUgbGluayB0byBlZGl0XG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGNoYXRzdWJzY3JpcHRpb25pbnZpdGVsaW5rXG4gICAgICovXG4gICAgZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGludml0ZV9saW5rOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0Q2hhdFN1YnNjcmlwdGlvbkludml0ZUxpbmtcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJpbnZpdGVfbGlua1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdENoYXRTdWJzY3JpcHRpb25JbnZpdGVMaW5rKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBpbnZpdGVfbGluaywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gcmV2b2tlIGFuIGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gSWYgdGhlIHByaW1hcnkgbGluayBpcyByZXZva2VkLCBhIG5ldyBsaW5rIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSByZXZva2VkIGludml0ZSBsaW5rIGFzIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gaW52aXRlX2xpbmsgVGhlIGludml0ZSBsaW5rIHRvIHJldm9rZVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmV2b2tlY2hhdGludml0ZWxpbmtcbiAgICAgKi9cbiAgICByZXZva2VDaGF0SW52aXRlTGluayhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnJldm9rZUNoYXRJbnZpdGVMaW5rKHsgY2hhdF9pZCwgaW52aXRlX2xpbmsgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gYXBwcm92ZSBhIGNoYXQgam9pbiByZXF1ZXN0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9pbnZpdGVfdXNlcnMgYWRtaW5pc3RyYXRvciByaWdodC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYXBwcm92ZWNoYXRqb2lucmVxdWVzdFxuICAgICAqL1xuICAgIGFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoeyBjaGF0X2lkLCB1c2VyX2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlY2xpbmUgYSBjaGF0IGpvaW4gcmVxdWVzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5faW52aXRlX3VzZXJzIGFkbWluaXN0cmF0b3IgcmlnaHQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlY2xpbmVjaGF0am9pbnJlcXVlc3RcbiAgICAgKi9cbiAgICBkZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5kZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KHsgY2hhdF9pZCwgdXNlcl9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBuZXcgcHJvZmlsZSBwaG90byBmb3IgdGhlIGNoYXQuIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBob3RvIE5ldyBjaGF0IHBob3RvLCB1cGxvYWRlZCB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0cGhvdG9cbiAgICAgKi9cbiAgICBzZXRDaGF0UGhvdG8oXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgcGhvdG86IElucHV0RmlsZSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0UGhvdG8oeyBjaGF0X2lkLCBwaG90byB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBjaGF0IHBob3RvLiBQaG90b3MgY2FuJ3QgYmUgY2hhbmdlZCBmb3IgcHJpdmF0ZSBjaGF0cy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlY2hhdHBob3RvXG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFBob3RvKGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZUNoYXRQaG90byh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSB0aXRsZSBvZiBhIGNoYXQuIFRpdGxlcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHRpdGxlIE5ldyBjaGF0IHRpdGxlLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0dGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0VGl0bGUoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0VGl0bGUoeyBjaGF0X2lkLCB0aXRsZSB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGRlc2NyaXB0aW9uIG9mIGEgZ3JvdXAsIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gTmV3IGNoYXQgZGVzY3JpcHRpb24sIDAtMjU1IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIHNldENoYXREZXNjcmlwdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbj86IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0RGVzY3JpcHRpb24oeyBjaGF0X2lkLCBkZXNjcmlwdGlvbiB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBhZGQgYSBtZXNzYWdlIHRvIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIGNoYXQuIElmIHRoZSBjaGF0IGlzIG5vdCBhIHByaXZhdGUgY2hhdCwgdGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSAnY2FuX3Bpbl9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIHN1cGVyZ3JvdXAgb3IgJ2Nhbl9lZGl0X21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgY2hhbm5lbC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgYSBtZXNzYWdlIHRvIHBpblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3BpbmNoYXRtZXNzYWdlXG4gICAgICovXG4gICAgcGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwicGluQ2hhdE1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlbW92ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIGEgbWVzc2FnZSB0byB1bnBpbi4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1vc3QgcmVjZW50IHBpbm5lZCBtZXNzYWdlIChieSBzZW5kaW5nIGRhdGUpIHdpbGwgYmUgdW5waW5uZWQuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5waW5jaGF0bWVzc2FnZVxuICAgICAqL1xuICAgIHVucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZD86IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51bnBpbkNoYXRNZXNzYWdlKHsgY2hhdF9pZCwgbWVzc2FnZV9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsY2hhdG1lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxDaGF0TWVzc2FnZXMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcudW5waW5BbGxDaGF0TWVzc2FnZXMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIGZvciB5b3VyIGJvdCB0byBsZWF2ZSBhIGdyb3VwLCBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbGVhdmVjaGF0XG4gICAgICovXG4gICAgbGVhdmVDaGF0KGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmxlYXZlQ2hhdCh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHVwIHRvIGRhdGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNoYXQgKGN1cnJlbnQgbmFtZSBvZiB0aGUgdXNlciBmb3Igb25lLW9uLW9uZSBjb252ZXJzYXRpb25zLCBjdXJyZW50IHVzZXJuYW1lIG9mIGEgdXNlciwgZ3JvdXAgb3IgY2hhbm5lbCwgZXRjLikuIFJldHVybnMgYSBDaGF0IG9iamVjdCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdFxuICAgICAqL1xuICAgIGdldENoYXQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdCh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGEgbGlzdCBvZiBhZG1pbmlzdHJhdG9ycyBpbiBhIGNoYXQsIHdoaWNoIGFyZW4ndCBib3RzLiBSZXR1cm5zIGFuIEFycmF5IG9mIENoYXRNZW1iZXIgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIG9yIGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRhZG1pbmlzdHJhdG9yc1xuICAgICAqL1xuICAgIGdldENoYXRBZG1pbmlzdHJhdG9ycyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRDaGF0QWRtaW5pc3RyYXRvcnMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqIEBkZXByZWNhdGVkIFVzZSBgZ2V0Q2hhdE1lbWJlckNvdW50YCBpbnN0ZWFkLiAqL1xuICAgIGdldENoYXRNZW1iZXJzQ291bnQoLi4uYXJnczogUGFyYW1ldGVyczxBcGlbXCJnZXRDaGF0TWVtYmVyQ291bnRcIl0+KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENoYXRNZW1iZXJDb3VudCguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBudW1iZXIgb2YgbWVtYmVycyBpbiBhIGNoYXQuIFJldHVybnMgSW50IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyY291bnRcbiAgICAgKi9cbiAgICBnZXRDaGF0TWVtYmVyQ291bnQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdE1lbWJlckNvdW50KHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBtZW1iZXIgb2YgYSBjaGF0LiBUaGUgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8gd29yayBvbmx5IGlmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIENoYXRNZW1iZXIgb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyXG4gICAgICovXG4gICAgZ2V0Q2hhdE1lbWJlcihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdE1lbWJlcih7IGNoYXRfaWQsIHVzZXJfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IGEgbmV3IGdyb3VwIHN0aWNrZXIgc2V0IGZvciBhIHN1cGVyZ3JvdXAuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFVzZSB0aGUgZmllbGQgY2FuX3NldF9zdGlja2VyX3NldCBseSByZXR1cm5lZCBpbiBnZXRDaGF0IHJlcXVlc3RzIHRvIGNoZWNrIGlmIHRoZSBib3QgY2FuIHVzZSB0aGlzIG1ldGhvZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzdGlja2VyX3NldF9uYW1lIE5hbWUgb2YgdGhlIHN0aWNrZXIgc2V0IHRvIGJlIHNldCBhcyB0aGUgZ3JvdXAgc3RpY2tlciBzZXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgc2V0Q2hhdFN0aWNrZXJTZXQoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgc3RpY2tlcl9zZXRfbmFtZTogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldENoYXRTdGlja2VyU2V0KFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBzdGlja2VyX3NldF9uYW1lIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIGdyb3VwIHN0aWNrZXIgc2V0IGZyb20gYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBVc2UgdGhlIGZpZWxkIGNhbl9zZXRfc3RpY2tlcl9zZXQgbHkgcmV0dXJuZWQgaW4gZ2V0Q2hhdCByZXF1ZXN0cyB0byBjaGVjayBpZiB0aGUgYm90IGNhbiB1c2UgdGhpcyBtZXRob2QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFN0aWNrZXJTZXQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlQ2hhdFN0aWNrZXJTZXQoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBjdXN0b20gZW1vamkgc3RpY2tlcnMsIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgZm9ydW0gdG9waWMgaWNvbiBieSBhbnkgdXNlci4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy4gUmV0dXJucyBhbiBBcnJheSBvZiBTdGlja2VyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGZvcnVtdG9waWNpY29uc3RpY2tlcnNcbiAgICAgKi9cbiAgICBnZXRGb3J1bVRvcGljSWNvblN0aWNrZXJzKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRGb3J1bVRvcGljSWNvblN0aWNrZXJzKHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjcmVhdGVkIHRvcGljIGFzIGEgRm9ydW1Ub3BpYyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBuYW1lIFRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVmb3J1bXRvcGljXG4gICAgICovXG4gICAgY3JlYXRlRm9ydW1Ub3BpYyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJjcmVhdGVGb3J1bVRvcGljXCIsIFwiY2hhdF9pZFwiIHwgXCJuYW1lXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNyZWF0ZUZvcnVtVG9waWMoeyBjaGF0X2lkLCBuYW1lLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IG5hbWUgYW5kIGljb24gb2YgYSB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cywgdW5sZXNzIGl0IGlzIHRoZSBjcmVhdG9yIG9mIHRoZSB0b3BpYy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX3RocmVhZF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBtZXNzYWdlIHRocmVhZCBvZiB0aGUgZm9ydW0gdG9waWNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0Zm9ydW10b3BpY1xuICAgICAqL1xuICAgIGVkaXRGb3J1bVRvcGljKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfdGhyZWFkX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJlZGl0Rm9ydW1Ub3BpY1wiLCBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV90aHJlYWRfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdEZvcnVtVG9waWMoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfdGhyZWFkX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbG9zZSBhbiBvcGVuIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLCB1bmxlc3MgaXQgaXMgdGhlIGNyZWF0b3Igb2YgdGhlIHRvcGljLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfdGhyZWFkX2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IG1lc3NhZ2UgdGhyZWFkIG9mIHRoZSBmb3J1bSB0b3BpY1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY2xvc2Vmb3J1bXRvcGljXG4gICAgICovXG4gICAgY2xvc2VGb3J1bVRvcGljKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfdGhyZWFkX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuY2xvc2VGb3J1bVRvcGljKHsgY2hhdF9pZCwgbWVzc2FnZV90aHJlYWRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gcmVvcGVuIGEgY2xvc2VkIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLCB1bmxlc3MgaXQgaXMgdGhlIGNyZWF0b3Igb2YgdGhlIHRvcGljLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfdGhyZWFkX2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IG1lc3NhZ2UgdGhyZWFkIG9mIHRoZSBmb3J1bSB0b3BpY1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmVvcGVuZm9ydW10b3BpY1xuICAgICAqL1xuICAgIHJlb3BlbkZvcnVtVG9waWMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV90aHJlYWRfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5yZW9wZW5Gb3J1bVRvcGljKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX3RocmVhZF9pZCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBmb3J1bSB0b3BpYyBhbG9uZyB3aXRoIGFsbCBpdHMgbWVzc2FnZXMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX2RlbGV0ZV9tZXNzYWdlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX3RocmVhZF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBtZXNzYWdlIHRocmVhZCBvZiB0aGUgZm9ydW0gdG9waWNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWZvcnVtdG9waWNcbiAgICAgKi9cbiAgICBkZWxldGVGb3J1bVRvcGljKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfdGhyZWFkX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlRm9ydW1Ub3BpYyhcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgbWVzc2FnZV90aHJlYWRfaWQgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2xlYXIgdGhlIGxpc3Qgb2YgcGlubmVkIG1lc3NhZ2VzIGluIGEgZm9ydW0gdG9waWMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX3Bpbl9tZXNzYWdlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIHRoZSBzdXBlcmdyb3VwLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfdGhyZWFkX2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IG1lc3NhZ2UgdGhyZWFkIG9mIHRoZSBmb3J1bSB0b3BpY1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5waW5hbGxmb3J1bXRvcGljbWVzc2FnZXNcbiAgICAgKi9cbiAgICB1bnBpbkFsbEZvcnVtVG9waWNNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX3RocmVhZF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX3RocmVhZF9pZCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IHRoZSBuYW1lIG9mIHRoZSAnR2VuZXJhbCcgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbmFtZSBOZXcgdG9waWMgbmFtZSwgMS0xMjggY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgZWRpdEdlbmVyYWxGb3J1bVRvcGljKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0R2VuZXJhbEZvcnVtVG9waWMoeyBjaGF0X2lkLCBuYW1lIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNsb3NlIGFuIG9wZW4gJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjbG9zZWdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgY2xvc2VHZW5lcmFsRm9ydW1Ub3BpYyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jbG9zZUdlbmVyYWxGb3J1bVRvcGljKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byByZW9wZW4gYSBjbG9zZWQgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgdG9waWMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHVuaGlkZGVuIGlmIGl0IHdhcyBoaWRkZW4uIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLiAgICAgKlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Jlb3BlbmdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgcmVvcGVuR2VuZXJhbEZvcnVtVG9waWMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucmVvcGVuR2VuZXJhbEZvcnVtVG9waWMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGhpZGUgdGhlICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gVGhlIHRvcGljIHdpbGwgYmUgYXV0b21hdGljYWxseSBjbG9zZWQgaWYgaXQgd2FzIG9wZW4uIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2hpZGVnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGhpZGVHZW5lcmFsRm9ydW1Ub3BpYyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5oaWRlR2VuZXJhbEZvcnVtVG9waWMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHVuaGlkZSB0aGUgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1bmhpZGVnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIHVuaGlkZUdlbmVyYWxGb3J1bVRvcGljKGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVuaGlkZUdlbmVyYWxGb3J1bVRvcGljKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBHZW5lcmFsIGZvcnVtIHRvcGljLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9waW5fbWVzc2FnZXMgYWRtaW5pc3RyYXRvciByaWdodCBpbiB0aGUgc3VwZXJncm91cC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5waW5hbGxnZW5lcmFsZm9ydW10b3BpY21lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxHZW5lcmFsRm9ydW1Ub3BpY01lc3NhZ2VzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcudW5waW5BbGxHZW5lcmFsRm9ydW1Ub3BpY01lc3NhZ2VzKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGFuc3dlcnMgdG8gY2FsbGJhY2sgcXVlcmllcyBzZW50IGZyb20gaW5saW5lIGtleWJvYXJkcy4gVGhlIGFuc3dlciB3aWxsIGJlIGRpc3BsYXllZCB0byB0aGUgdXNlciBhcyBhIG5vdGlmaWNhdGlvbiBhdCB0aGUgdG9wIG9mIHRoZSBjaGF0IHNjcmVlbiBvciBhcyBhbiBhbGVydC4gT24gc3VjY2VzcywgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEFsdGVybmF0aXZlbHksIHRoZSB1c2VyIGNhbiBiZSByZWRpcmVjdGVkIHRvIHRoZSBzcGVjaWZpZWQgR2FtZSBVUkwuIEZvciB0aGlzIG9wdGlvbiB0byB3b3JrLCB5b3UgbXVzdCBmaXJzdCBjcmVhdGUgYSBnYW1lIGZvciB5b3VyIGJvdCB2aWEgQEJvdEZhdGhlciBhbmQgYWNjZXB0IHRoZSB0ZXJtcy4gT3RoZXJ3aXNlLCB5b3UgbWF5IHVzZSBsaW5rcyBsaWtlIHQubWUveW91cl9ib3Q/c3RhcnQ9WFhYWCB0aGF0IG9wZW4geW91ciBib3Qgd2l0aCBhIHBhcmFtZXRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjYWxsYmFja19xdWVyeV9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHF1ZXJ5IHRvIGJlIGFuc3dlcmVkXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2VyY2FsbGJhY2txdWVyeVxuICAgICAqL1xuICAgIGFuc3dlckNhbGxiYWNrUXVlcnkoXG4gICAgICAgIGNhbGxiYWNrX3F1ZXJ5X2lkOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJhbnN3ZXJDYWxsYmFja1F1ZXJ5XCIsIFwiY2FsbGJhY2tfcXVlcnlfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYW5zd2VyQ2FsbGJhY2tRdWVyeShcbiAgICAgICAgICAgIHsgY2FsbGJhY2tfcXVlcnlfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSB0aGUgYm90J3MgbmFtZS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBOZXcgYm90IG5hbWU7IDAtNjQgY2hhcmFjdGVycy4gUGFzcyBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIHRoZSBkZWRpY2F0ZWQgbmFtZSBmb3IgdGhlIGdpdmVuIGxhbmd1YWdlLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldG15bmFtZVxuICAgICAqL1xuICAgIHNldE15TmFtZShcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0TXlOYW1lXCIsIFwibmFtZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRNeU5hbWUoeyBuYW1lLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGN1cnJlbnQgYm90IG5hbWUgZm9yIHRoZSBnaXZlbiB1c2VyIGxhbmd1YWdlLiBSZXR1cm5zIEJvdE5hbWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldG15bmFtZVxuICAgICAqL1xuICAgIGdldE15TmFtZShvdGhlcj86IE90aGVyPFIsIFwiZ2V0TXlOYW1lXCI+LCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0TXlOYW1lKG90aGVyID8/IHt9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGxpc3Qgb2YgdGhlIGJvdCdzIGNvbW1hbmRzLiBTZWUgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2ZlYXR1cmVzI2NvbW1hbmRzIGZvciBtb3JlIGRldGFpbHMgYWJvdXQgYm90IGNvbW1hbmRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjb21tYW5kcyBBIGxpc3Qgb2YgYm90IGNvbW1hbmRzIHRvIGJlIHNldCBhcyB0aGUgbGlzdCBvZiB0aGUgYm90J3MgY29tbWFuZHMuIEF0IG1vc3QgMTAwIGNvbW1hbmRzIGNhbiBiZSBzcGVjaWZpZWQuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0bXljb21tYW5kc1xuICAgICAqL1xuICAgIHNldE15Q29tbWFuZHMoXG4gICAgICAgIGNvbW1hbmRzOiByZWFkb25seSBCb3RDb21tYW5kW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZXRNeUNvbW1hbmRzXCIsIFwiY29tbWFuZHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0TXlDb21tYW5kcyh7IGNvbW1hbmRzLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgdGhlIGxpc3Qgb2YgdGhlIGJvdCdzIGNvbW1hbmRzIGZvciB0aGUgZ2l2ZW4gc2NvcGUgYW5kIHVzZXIgbGFuZ3VhZ2UuIEFmdGVyIGRlbGV0aW9uLCBoaWdoZXIgbGV2ZWwgY29tbWFuZHMgd2lsbCBiZSBzaG93biB0byBhZmZlY3RlZCB1c2Vycy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVteWNvbW1hbmRzXG4gICAgICovXG4gICAgZGVsZXRlTXlDb21tYW5kcyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImRlbGV0ZU15Q29tbWFuZHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlTXlDb21tYW5kcyh7IC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgY3VycmVudCBsaXN0IG9mIHRoZSBib3QncyBjb21tYW5kcyBmb3IgdGhlIGdpdmVuIHNjb3BlIGFuZCB1c2VyIGxhbmd1YWdlLiBSZXR1cm5zIGFuIEFycmF5IG9mIEJvdENvbW1hbmQgb2JqZWN0cy4gSWYgY29tbWFuZHMgYXJlbid0IHNldCwgYW4gZW1wdHkgbGlzdCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldG15Y29tbWFuZHNcbiAgICAgKi9cbiAgICBnZXRNeUNvbW1hbmRzKG90aGVyPzogT3RoZXI8UiwgXCJnZXRNeUNvbW1hbmRzXCI+LCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0TXlDb21tYW5kcyh7IC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSB0aGUgYm90J3MgZGVzY3JpcHRpb24sIHdoaWNoIGlzIHNob3duIGluIHRoZSBjaGF0IHdpdGggdGhlIGJvdCBpZiB0aGUgY2hhdCBpcyBlbXB0eS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gTmV3IGJvdCBkZXNjcmlwdGlvbjsgMC01MTIgY2hhcmFjdGVycy4gUGFzcyBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIHRoZSBkZWRpY2F0ZWQgZGVzY3JpcHRpb24gZm9yIHRoZSBnaXZlbiBsYW5ndWFnZS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtdGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldG15ZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBzZXRNeURlc2NyaXB0aW9uKFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0TXlEZXNjcmlwdGlvblwiLCBcImRlc2NyaXB0aW9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldE15RGVzY3JpcHRpb24oeyBkZXNjcmlwdGlvbiwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IGJvdCBkZXNjcmlwdGlvbiBmb3IgdGhlIGdpdmVuIHVzZXIgbGFuZ3VhZ2UuIFJldHVybnMgQm90RGVzY3JpcHRpb24gb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW10ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0bXlkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIGdldE15RGVzY3JpcHRpb24oXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJnZXRNeURlc2NyaXB0aW9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldE15RGVzY3JpcHRpb24oeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGJvdCdzIHNob3J0IGRlc2NyaXB0aW9uLCB3aGljaCBpcyBzaG93biBvbiB0aGUgYm90J3MgcHJvZmlsZSBwYWdlIGFuZCBpcyBzZW50IHRvZ2V0aGVyIHdpdGggdGhlIGxpbmsgd2hlbiB1c2VycyBzaGFyZSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaG9ydF9kZXNjcmlwdGlvbiBOZXcgc2hvcnQgZGVzY3JpcHRpb24gZm9yIHRoZSBib3Q7IDAtMTIwIGNoYXJhY3RlcnMuIFBhc3MgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSB0aGUgZGVkaWNhdGVkIHNob3J0IGRlc2NyaXB0aW9uIGZvciB0aGUgZ2l2ZW4gbGFuZ3VhZ2UuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRteXNob3J0ZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBzZXRNeVNob3J0RGVzY3JpcHRpb24oXG4gICAgICAgIHNob3J0X2Rlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZXRNeVNob3J0RGVzY3JpcHRpb25cIiwgXCJzaG9ydF9kZXNjcmlwdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRNeVNob3J0RGVzY3JpcHRpb24oXG4gICAgICAgICAgICB7IHNob3J0X2Rlc2NyaXB0aW9uLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGN1cnJlbnQgYm90IHNob3J0IGRlc2NyaXB0aW9uIGZvciB0aGUgZ2l2ZW4gdXNlciBsYW5ndWFnZS4gUmV0dXJucyBCb3RTaG9ydERlc2NyaXB0aW9uIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtdGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldG15c2hvcnRkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIGdldE15U2hvcnREZXNjcmlwdGlvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImdldE15U2hvcnREZXNjcmlwdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRNeVNob3J0RGVzY3JpcHRpb24oeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGJvdCdzIG1lbnUgYnV0dG9uIGluIGEgcHJpdmF0ZSBjaGF0LCBvciB0aGUgZGVmYXVsdCBtZW51IGJ1dHRvbi4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0bWVudWJ1dHRvblxuICAgICAqL1xuICAgIHNldENoYXRNZW51QnV0dG9uKFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0Q2hhdE1lbnVCdXR0b25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0Q2hhdE1lbnVCdXR0b24oeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGN1cnJlbnQgdmFsdWUgb2YgdGhlIGJvdCdzIG1lbnUgYnV0dG9uIGluIGEgcHJpdmF0ZSBjaGF0LCBvciB0aGUgZGVmYXVsdCBtZW51IGJ1dHRvbi4gUmV0dXJucyBNZW51QnV0dG9uIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVudWJ1dHRvblxuICAgICAqL1xuICAgIGdldENoYXRNZW51QnV0dG9uKFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZ2V0Q2hhdE1lbnVCdXR0b25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdE1lbnVCdXR0b24oeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byB0aGUgY2hhbmdlIHRoZSBkZWZhdWx0IGFkbWluaXN0cmF0b3IgcmlnaHRzIHJlcXVlc3RlZCBieSB0aGUgYm90IHdoZW4gaXQncyBhZGRlZCBhcyBhbiBhZG1pbmlzdHJhdG9yIHRvIGdyb3VwcyBvciBjaGFubmVscy4gVGhlc2UgcmlnaHRzIHdpbGwgYmUgc3VnZ2VzdGVkIHRvIHVzZXJzLCBidXQgdGhleSBhcmUgYXJlIGZyZWUgdG8gbW9kaWZ5IHRoZSBsaXN0IGJlZm9yZSBhZGRpbmcgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRteWRlZmF1bHRhZG1pbmlzdHJhdG9ycmlnaHRzXG4gICAgICovXG4gICAgc2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyh7IC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgY3VycmVudCBkZWZhdWx0IGFkbWluaXN0cmF0b3IgcmlnaHRzIG9mIHRoZSBib3QuIFJldHVybnMgQ2hhdEFkbWluaXN0cmF0b3JSaWdodHMgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldG15ZGVmYXVsdGFkbWluaXN0cmF0b3JyaWdodHNcbiAgICAgKi9cbiAgICBnZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzKFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0c1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCB0ZXh0IGFuZCBnYW1lIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UgdG8gZWRpdFxuICAgICAqIEBwYXJhbSB0ZXh0IE5ldyB0ZXh0IG9mIHRoZSBtZXNzYWdlLCAxLTQwOTYgY2hhcmFjdGVycyBhZnRlciBlbnRpdGllcyBwYXJzaW5nXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2V0ZXh0XG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VUZXh0KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VUZXh0XCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJ0ZXh0XCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0TWVzc2FnZVRleHQoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIHRleHQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgdGV4dCBhbmQgZ2FtZSBpbmxpbmUgbWVzc2FnZXMuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBlZGl0ZWQgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIE5vdGUgdGhhdCBidXNpbmVzcyBtZXNzYWdlcyB0aGF0IHdlcmUgbm90IHNlbnQgYnkgdGhlIGJvdCBhbmQgZG8gbm90IGNvbnRhaW4gYW4gaW5saW5lIGtleWJvYXJkIGNhbiBvbmx5IGJlIGVkaXRlZCB3aXRoaW4gNDggaG91cnMgZnJvbSB0aGUgdGltZSB0aGV5IHdlcmUgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdldGV4dFxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlVGV4dElubGluZShcbiAgICAgICAgaW5saW5lX21lc3NhZ2VfaWQ6IHN0cmluZyxcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VUZXh0XCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJ0ZXh0XCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0TWVzc2FnZVRleHQoXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCB0ZXh0LCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGNhcHRpb25zIG9mIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UgdG8gZWRpdFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlY2FwdGlvblxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlQ2FwdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZUNhcHRpb25cIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0TWVzc2FnZUNhcHRpb24oXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgY2FwdGlvbnMgb2YgaW5saW5lIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5saW5lX21lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgaW5saW5lIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZWNhcHRpb25cbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZUNhcHRpb25JbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZUNhcHRpb25cIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0TWVzc2FnZUNhcHRpb24oXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGFuaW1hdGlvbiwgYXVkaW8sIGRvY3VtZW50LCBwaG90bywgb3IgdmlkZW8gbWVzc2FnZXMuIElmIGEgbWVzc2FnZSBpcyBwYXJ0IG9mIGEgbWVzc2FnZSBhbGJ1bSwgdGhlbiBpdCBjYW4gYmUgZWRpdGVkIG9ubHkgdG8gYW4gYXVkaW8gZm9yIGF1ZGlvIGFsYnVtcywgb25seSB0byBhIGRvY3VtZW50IGZvciBkb2N1bWVudCBhbGJ1bXMgYW5kIHRvIGEgcGhvdG8gb3IgYSB2aWRlbyBvdGhlcndpc2UuIFdoZW4gYW4gaW5saW5lIG1lc3NhZ2UgaXMgZWRpdGVkLCBhIG5ldyBmaWxlIGNhbid0IGJlIHVwbG9hZGVkOyB1c2UgYSBwcmV2aW91c2x5IHVwbG9hZGVkIGZpbGUgdmlhIGl0cyBmaWxlX2lkIG9yIHNwZWNpZnkgYSBVUkwuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBlZGl0ZWQgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIE5vdGUgdGhhdCBidXNpbmVzcyBtZXNzYWdlcyB0aGF0IHdlcmUgbm90IHNlbnQgYnkgdGhlIGJvdCBhbmQgZG8gbm90IGNvbnRhaW4gYW4gaW5saW5lIGtleWJvYXJkIGNhbiBvbmx5IGJlIGVkaXRlZCB3aXRoaW4gNDggaG91cnMgZnJvbSB0aGUgdGltZSB0aGV5IHdlcmUgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgbWVzc2FnZSB0byBlZGl0XG4gICAgICogQHBhcmFtIG1lZGlhIEFuIG9iamVjdCBmb3IgYSBuZXcgbWVkaWEgY29udGVudCBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlbWVkaWFcbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZU1lZGlhKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgbWVkaWE6IElucHV0TWVkaWEsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZU1lZGlhXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJtZWRpYVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VNZWRpYShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgbWVzc2FnZV9pZCwgbWVkaWEsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgYW5pbWF0aW9uLCBhdWRpbywgZG9jdW1lbnQsIHBob3RvLCBvciB2aWRlbyBpbmxpbmUgbWVzc2FnZXMuIElmIGEgbWVzc2FnZSBpcyBwYXJ0IG9mIGEgbWVzc2FnZSBhbGJ1bSwgdGhlbiBpdCBjYW4gYmUgZWRpdGVkIG9ubHkgdG8gYW4gYXVkaW8gZm9yIGF1ZGlvIGFsYnVtcywgb25seSB0byBhIGRvY3VtZW50IGZvciBkb2N1bWVudCBhbGJ1bXMgYW5kIHRvIGEgcGhvdG8gb3IgYSB2aWRlbyBvdGhlcndpc2UuIFdoZW4gYW4gaW5saW5lIG1lc3NhZ2UgaXMgZWRpdGVkLCBhIG5ldyBmaWxlIGNhbid0IGJlIHVwbG9hZGVkOyB1c2UgYSBwcmV2aW91c2x5IHVwbG9hZGVkIGZpbGUgdmlhIGl0cyBmaWxlX2lkIG9yIHNwZWNpZnkgYSBVUkwuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBlZGl0ZWQgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIE5vdGUgdGhhdCBidXNpbmVzcyBtZXNzYWdlcyB0aGF0IHdlcmUgbm90IHNlbnQgYnkgdGhlIGJvdCBhbmQgZG8gbm90IGNvbnRhaW4gYW4gaW5saW5lIGtleWJvYXJkIGNhbiBvbmx5IGJlIGVkaXRlZCB3aXRoaW4gNDggaG91cnMgZnJvbSB0aGUgdGltZSB0aGV5IHdlcmUgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBvYmplY3QgZm9yIGEgbmV3IG1lZGlhIGNvbnRlbnQgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZW1lZGlhXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VNZWRpYUlubGluZShcbiAgICAgICAgaW5saW5lX21lc3NhZ2VfaWQ6IHN0cmluZyxcbiAgICAgICAgbWVkaWE6IElucHV0TWVkaWEsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZU1lZGlhXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJtZWRpYVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VNZWRpYShcbiAgICAgICAgICAgIHsgaW5saW5lX21lc3NhZ2VfaWQsIG1lZGlhLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IG9ubHkgdGhlIHJlcGx5IG1hcmt1cCBvZiBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZXJlcGx5bWFya3VwXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VSZXBseU1hcmt1cChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZVJlcGx5TWFya3VwXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VSZXBseU1hcmt1cChcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgbWVzc2FnZV9pZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBvbmx5IHRoZSByZXBseSBtYXJrdXAgb2YgaW5saW5lIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5saW5lX21lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgaW5saW5lIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZXJlcGx5bWFya3VwXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VSZXBseU1hcmt1cElubGluZShcbiAgICAgICAgaW5saW5lX21lc3NhZ2VfaWQ6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlUmVwbHlNYXJrdXBcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0TWVzc2FnZVJlcGx5TWFya3VwKFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc3RvcCBhIHBvbGwgd2hpY2ggd2FzIHNlbnQgYnkgdGhlIGJvdC4gT24gc3VjY2VzcywgdGhlIHN0b3BwZWQgUG9sbCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgb3JpZ2luYWwgbWVzc2FnZSB3aXRoIHRoZSBwb2xsXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc3RvcHBvbGxcbiAgICAgKi9cbiAgICBzdG9wUG9sbChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzdG9wUG9sbFwiLCBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zdG9wUG9sbCh7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIG1lc3NhZ2UsIGluY2x1ZGluZyBzZXJ2aWNlIG1lc3NhZ2VzLCB3aXRoIHRoZSBmb2xsb3dpbmcgbGltaXRhdGlvbnM6XG4gICAgICogLSBBIG1lc3NhZ2UgY2FuIG9ubHkgYmUgZGVsZXRlZCBpZiBpdCB3YXMgc2VudCBsZXNzIHRoYW4gNDggaG91cnMgYWdvLlxuICAgICAqIC0gQSBkaWNlIG1lc3NhZ2UgaW4gYSBwcml2YXRlIGNoYXQgY2FuIG9ubHkgYmUgZGVsZXRlZCBpZiBpdCB3YXMgc2VudCBtb3JlIHRoYW4gMjQgaG91cnMgYWdvLlxuICAgICAqIC0gQm90cyBjYW4gZGVsZXRlIG91dGdvaW5nIG1lc3NhZ2VzIGluIHByaXZhdGUgY2hhdHMsIGdyb3VwcywgYW5kIHN1cGVyZ3JvdXBzLlxuICAgICAqIC0gQm90cyBjYW4gZGVsZXRlIGluY29taW5nIG1lc3NhZ2VzIGluIHByaXZhdGUgY2hhdHMuXG4gICAgICogLSBCb3RzIGdyYW50ZWQgY2FuX3Bvc3RfbWVzc2FnZXMgcGVybWlzc2lvbnMgY2FuIGRlbGV0ZSBvdXRnb2luZyBtZXNzYWdlcyBpbiBjaGFubmVscy5cbiAgICAgKiAtIElmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBvZiBhIGdyb3VwLCBpdCBjYW4gZGVsZXRlIGFueSBtZXNzYWdlIHRoZXJlLlxuICAgICAqIC0gSWYgdGhlIGJvdCBoYXMgY2FuX2RlbGV0ZV9tZXNzYWdlcyBwZXJtaXNzaW9uIGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwsIGl0IGNhbiBkZWxldGUgYW55IG1lc3NhZ2UgdGhlcmUuXG4gICAgICogUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UgdG8gZGVsZXRlXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVtZXNzYWdlXG4gICAgICovXG4gICAgZGVsZXRlTWVzc2FnZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlTWVzc2FnZSh7IGNoYXRfaWQsIG1lc3NhZ2VfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIG11bHRpcGxlIG1lc3NhZ2VzIHNpbXVsdGFuZW91c2x5LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWRzIEEgbGlzdCBvZiAxLTEwMCBpZGVudGlmaWVycyBvZiBtZXNzYWdlcyB0byBkZWxldGUuIFNlZSBkZWxldGVNZXNzYWdlIGZvciBsaW1pdGF0aW9ucyBvbiB3aGljaCBtZXNzYWdlcyBjYW4gYmUgZGVsZXRlZFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlbWVzc2FnZXNcbiAgICAgKi9cbiAgICBkZWxldGVNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkczogbnVtYmVyW10sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlTWVzc2FnZXMoeyBjaGF0X2lkLCBtZXNzYWdlX2lkcyB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHN0YXRpYyAuV0VCUCwgYW5pbWF0ZWQgLlRHUywgb3IgdmlkZW8gLldFQk0gc3RpY2tlcnMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzdGlja2VyIFN0aWNrZXIgdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYSBmaWxlIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIC5XRUJQIHN0aWNrZXIgZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyAuV0VCUCwgLlRHUywgb3IgLldFQk0gc3RpY2tlciB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLiBWaWRlbyBhbmQgYW5pbWF0ZWQgc3RpY2tlcnMgY2FuJ3QgYmUgc2VudCB2aWEgYW4gSFRUUCBVUkwuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHN0aWNrZXJcbiAgICAgKi9cbiAgICBzZW5kU3RpY2tlcihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBzdGlja2VyOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kU3RpY2tlclwiLCBcImNoYXRfaWRcIiB8IFwic3RpY2tlclwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kU3RpY2tlcih7IGNoYXRfaWQsIHN0aWNrZXIsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBhIHN0aWNrZXIgc2V0LiBPbiBzdWNjZXNzLCBhIFN0aWNrZXJTZXQgb2JqZWN0IGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgc3RpY2tlciBzZXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldHN0aWNrZXJzZXRcbiAgICAgKi9cbiAgICBnZXRTdGlja2VyU2V0KG5hbWU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldFN0aWNrZXJTZXQoeyBuYW1lIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBpbmZvcm1hdGlvbiBhYm91dCBjdXN0b20gZW1vamkgc3RpY2tlcnMgYnkgdGhlaXIgaWRlbnRpZmllcnMuIFJldHVybnMgYW4gQXJyYXkgb2YgU3RpY2tlciBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGN1c3RvbV9lbW9qaV9pZHMgQSBsaXN0IG9mIGN1c3RvbSBlbW9qaSBpZGVudGlmaWVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y3VzdG9tZW1vamlzdGlja2Vyc1xuICAgICAqL1xuICAgIGdldEN1c3RvbUVtb2ppU3RpY2tlcnMoY3VzdG9tX2Vtb2ppX2lkczogc3RyaW5nW10sIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRDdXN0b21FbW9qaVN0aWNrZXJzKHsgY3VzdG9tX2Vtb2ppX2lkcyB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byB1cGxvYWQgYSBmaWxlIHdpdGggYSBzdGlja2VyIGZvciBsYXRlciB1c2UgaW4gdGhlIGNyZWF0ZU5ld1N0aWNrZXJTZXQsIGFkZFN0aWNrZXJUb1NldCwgb3IgcmVwbGFjZVN0aWNrZXJJblNldCBtZXRob2RzICh0aGUgZmlsZSBjYW4gYmUgdXNlZCBtdWx0aXBsZSB0aW1lcykuIFJldHVybnMgdGhlIHVwbG9hZGVkIEZpbGUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllciBvZiBzdGlja2VyIGZpbGUgb3duZXJcbiAgICAgKiBAcGFyYW0gc3RpY2tlcl9mb3JtYXQgRm9ybWF0IG9mIHRoZSBzdGlja2VyLCBtdXN0IGJlIG9uZSBvZiDigJxzdGF0aWPigJ0sIOKAnGFuaW1hdGVk4oCdLCDigJx2aWRlb+KAnVxuICAgICAqIEBwYXJhbSBzdGlja2VyIEEgZmlsZSB3aXRoIHRoZSBzdGlja2VyIGluIC5XRUJQLCAuUE5HLCAuVEdTLCBvciAuV0VCTSBmb3JtYXQuIFNlZSBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL3N0aWNrZXJzIGZvciB0ZWNobmljYWwgcmVxdWlyZW1lbnRzLlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdXBsb2Fkc3RpY2tlcmZpbGVcbiAgICAgKi9cbiAgICB1cGxvYWRTdGlja2VyRmlsZShcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzdGlja2VyX2Zvcm1hdDogXCJzdGF0aWNcIiB8IFwiYW5pbWF0ZWRcIiB8IFwidmlkZW9cIixcbiAgICAgICAgc3RpY2tlcjogSW5wdXRGaWxlLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVwbG9hZFN0aWNrZXJGaWxlKFxuICAgICAgICAgICAgeyB1c2VyX2lkLCBzdGlja2VyX2Zvcm1hdCwgc3RpY2tlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYSBuZXcgc3RpY2tlciBzZXQgb3duZWQgYnkgYSB1c2VyLiBUaGUgYm90IHdpbGwgYmUgYWJsZSB0byBlZGl0IHRoZSBzdGlja2VyIHNldCB0aHVzIGNyZWF0ZWQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVXNlciBpZGVudGlmaWVyIG9mIGNyZWF0ZWQgc3RpY2tlciBzZXQgb3duZXJcbiAgICAgKiBAcGFyYW0gbmFtZSBTaG9ydCBuYW1lIG9mIHN0aWNrZXIgc2V0LCB0byBiZSB1c2VkIGluIHQubWUvYWRkc3RpY2tlcnMvIFVSTHMgKGUuZy4sIGFuaW1hbHMpLiBDYW4gY29udGFpbiBvbmx5IEVuZ2xpc2ggbGV0dGVycywgZGlnaXRzIGFuZCB1bmRlcnNjb3Jlcy4gTXVzdCBiZWdpbiB3aXRoIGEgbGV0dGVyLCBjYW4ndCBjb250YWluIGNvbnNlY3V0aXZlIHVuZGVyc2NvcmVzIGFuZCBtdXN0IGVuZCBpbiBgX2J5Xzxib3RfdXNlcm5hbWU+YC4gYDxib3RfdXNlcm5hbWU+YCBpcyBjYXNlIGluc2Vuc2l0aXZlLiAxLTY0IGNoYXJhY3RlcnMuXG4gICAgICogQHBhcmFtIHRpdGxlIFN0aWNrZXIgc2V0IHRpdGxlLCAxLTY0IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gc3RpY2tlcnMgQSBsaXN0IG9mIDEtNTAgaW5pdGlhbCBzdGlja2VycyB0byBiZSBhZGRlZCB0byB0aGUgc3RpY2tlciBzZXRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVuZXdzdGlja2Vyc2V0XG4gICAgICovXG4gICAgY3JlYXRlTmV3U3RpY2tlclNldChcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIHN0aWNrZXJzOiBJbnB1dFN0aWNrZXJbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcImNyZWF0ZU5ld1N0aWNrZXJTZXRcIixcbiAgICAgICAgICAgIHwgXCJ1c2VyX2lkXCJcbiAgICAgICAgICAgIHwgXCJuYW1lXCJcbiAgICAgICAgICAgIHwgXCJ0aXRsZVwiXG4gICAgICAgICAgICB8IFwic3RpY2tlcl9mb3JtYXRcIlxuICAgICAgICAgICAgfCBcInN0aWNrZXJzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jcmVhdGVOZXdTdGlja2VyU2V0KFxuICAgICAgICAgICAgeyB1c2VyX2lkLCBuYW1lLCB0aXRsZSwgc3RpY2tlcnMsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGFkZCBhIG5ldyBzdGlja2VyIHRvIGEgc2V0IGNyZWF0ZWQgYnkgdGhlIGJvdC4gVGhlIGZvcm1hdCBvZiB0aGUgYWRkZWQgc3RpY2tlciBtdXN0IG1hdGNoIHRoZSBmb3JtYXQgb2YgdGhlIG90aGVyIHN0aWNrZXJzIGluIHRoZSBzZXQuIEVtb2ppIHN0aWNrZXIgc2V0cyBjYW4gaGF2ZSB1cCB0byAyMDAgc3RpY2tlcnMuIEFuaW1hdGVkIGFuZCB2aWRlbyBzdGlja2VyIHNldHMgY2FuIGhhdmUgdXAgdG8gNTAgc3RpY2tlcnMuIFN0YXRpYyBzdGlja2VyIHNldHMgY2FuIGhhdmUgdXAgdG8gMTIwIHN0aWNrZXJzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllciBvZiBzdGlja2VyIHNldCBvd25lclxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBBbiBvYmplY3Qgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWRkZWQgc3RpY2tlci4gSWYgZXhhY3RseSB0aGUgc2FtZSBzdGlja2VyIGhhZCBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIHNldCwgdGhlbiB0aGUgc2V0IGlzbid0IGNoYW5nZWQuXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhZGRzdGlja2VydG9zZXRcbiAgICAgKi9cbiAgICBhZGRTdGlja2VyVG9TZXQoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBzdGlja2VyOiBJbnB1dFN0aWNrZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYWRkU3RpY2tlclRvU2V0KFxuICAgICAgICAgICAgeyB1c2VyX2lkLCBuYW1lLCBzdGlja2VyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIG1vdmUgYSBzdGlja2VyIGluIGEgc2V0IGNyZWF0ZWQgYnkgdGhlIGJvdCB0byBhIHNwZWNpZmljIHBvc2l0aW9uLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGlja2VyIEZpbGUgaWRlbnRpZmllciBvZiB0aGUgc3RpY2tlclxuICAgICAqIEBwYXJhbSBwb3NpdGlvbiBOZXcgc3RpY2tlciBwb3NpdGlvbiBpbiB0aGUgc2V0LCB6ZXJvLWJhc2VkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRzdGlja2VycG9zaXRpb25pbnNldFxuICAgICAqL1xuICAgIHNldFN0aWNrZXJQb3NpdGlvbkluU2V0KFxuICAgICAgICBzdGlja2VyOiBzdHJpbmcsXG4gICAgICAgIHBvc2l0aW9uOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0U3RpY2tlclBvc2l0aW9uSW5TZXQoeyBzdGlja2VyLCBwb3NpdGlvbiB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBzdGlja2VyIGZyb20gYSBzZXQgY3JlYXRlZCBieSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGlja2VyIEZpbGUgaWRlbnRpZmllciBvZiB0aGUgc3RpY2tlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlc3RpY2tlcmZyb21zZXRcbiAgICAgKi9cbiAgICBkZWxldGVTdGlja2VyRnJvbVNldChzdGlja2VyOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5kZWxldGVTdGlja2VyRnJvbVNldCh7IHN0aWNrZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gcmVwbGFjZSBhbiBleGlzdGluZyBzdGlja2VyIGluIGEgc3RpY2tlciBzZXQgd2l0aCBhIG5ldyBvbmUuIFRoZSBtZXRob2QgaXMgZXF1aXZhbGVudCB0byBjYWxsaW5nIGRlbGV0ZVN0aWNrZXJGcm9tU2V0LCB0aGVuIGFkZFN0aWNrZXJUb1NldCwgdGhlbiBzZXRTdGlja2VyUG9zaXRpb25JblNldC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXIgc2V0IG93bmVyXG4gICAgICogQHBhcmFtIG5hbWUgU3RpY2tlciBzZXQgbmFtZVxuICAgICAqIEBwYXJhbSBvbGRfc3RpY2tlciBGaWxlIGlkZW50aWZpZXIgb2YgdGhlIHJlcGxhY2VkIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBBbiBvYmplY3Qgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYWRkZWQgc3RpY2tlci4gSWYgZXhhY3RseSB0aGUgc2FtZSBzdGlja2VyIGhhZCBhbHJlYWR5IGJlZW4gYWRkZWQgdG8gdGhlIHNldCwgdGhlbiB0aGUgc2V0IHJlbWFpbnMgdW5jaGFuZ2VkLjp4XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXBsYWNlc3RpY2tlcmluc2V0XG4gICAgICovXG4gICAgcmVwbGFjZVN0aWNrZXJJblNldChcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIG9sZF9zdGlja2VyOiBzdHJpbmcsXG4gICAgICAgIHN0aWNrZXI6IElucHV0U3RpY2tlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5yZXBsYWNlU3RpY2tlckluU2V0KFxuICAgICAgICAgICAgeyB1c2VyX2lkLCBuYW1lLCBvbGRfc3RpY2tlciwgc3RpY2tlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGxpc3Qgb2YgZW1vamkgYXNzaWduZWQgdG8gYSByZWd1bGFyIG9yIGN1c3RvbSBlbW9qaSBzdGlja2VyLiBUaGUgc3RpY2tlciBtdXN0IGJlbG9uZyB0byBhIHN0aWNrZXIgc2V0IGNyZWF0ZWQgYnkgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBGaWxlIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gZW1vamlfbGlzdCBBIGxpc3Qgb2YgMS0yMCBlbW9qaSBhc3NvY2lhdGVkIHdpdGggdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldHN0aWNrZXJlbW9qaWxpc3RcbiAgICAgKi9cbiAgICBzZXRTdGlja2VyRW1vamlMaXN0KFxuICAgICAgICBzdGlja2VyOiBzdHJpbmcsXG4gICAgICAgIGVtb2ppX2xpc3Q6IHN0cmluZ1tdLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJFbW9qaUxpc3QoeyBzdGlja2VyLCBlbW9qaV9saXN0IH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSBzZWFyY2gga2V5d29yZHMgYXNzaWduZWQgdG8gYSByZWd1bGFyIG9yIGN1c3RvbSBlbW9qaSBzdGlja2VyLiBUaGUgc3RpY2tlciBtdXN0IGJlbG9uZyB0byBhIHN0aWNrZXIgc2V0IGNyZWF0ZWQgYnkgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBGaWxlIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0ga2V5d29yZHMgQSBsaXN0IG9mIDAtMjAgc2VhcmNoIGtleXdvcmRzIGZvciB0aGUgc3RpY2tlciB3aXRoIHRvdGFsIGxlbmd0aCBvZiB1cCB0byA2NCBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRzdGlja2Vya2V5d29yZHNcbiAgICAgKi9cbiAgICBzZXRTdGlja2VyS2V5d29yZHMoXG4gICAgICAgIHN0aWNrZXI6IHN0cmluZyxcbiAgICAgICAga2V5d29yZHM6IHN0cmluZ1tdLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJLZXl3b3Jkcyh7IHN0aWNrZXIsIGtleXdvcmRzIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSB0aGUgbWFzayBwb3NpdGlvbiBvZiBhIG1hc2sgc3RpY2tlci4gVGhlIHN0aWNrZXIgbXVzdCBiZWxvbmcgdG8gYSBzdGlja2VyIHNldCB0aGF0IHdhcyBjcmVhdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXIgRmlsZSBpZGVudGlmaWVyIG9mIHRoZSBzdGlja2VyXG4gICAgICogQHBhcmFtIG1hc2tfcG9zaXRpb24gQW4gb2JqZWN0IHdpdGggdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBtYXNrIHNob3VsZCBiZSBwbGFjZWQgb24gZmFjZXMuIE9taXQgdGhlIHBhcmFtZXRlciB0byByZW1vdmUgdGhlIG1hc2sgcG9zaXRpb24uXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRzdGlja2VybWFza3Bvc2l0aW9uXG4gICAgICovXG4gICAgc2V0U3RpY2tlck1hc2tQb3NpdGlvbihcbiAgICAgICAgc3RpY2tlcjogc3RyaW5nLFxuICAgICAgICBtYXNrX3Bvc2l0aW9uPzogTWFza1Bvc2l0aW9uLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJNYXNrUG9zaXRpb24oXG4gICAgICAgICAgICB7IHN0aWNrZXIsIG1hc2tfcG9zaXRpb24gfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IHRoZSB0aXRsZSBvZiBhIGNyZWF0ZWQgc3RpY2tlciBzZXQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgU3RpY2tlciBzZXQgbmFtZVxuICAgICAqIEBwYXJhbSB0aXRsZSBTdGlja2VyIHNldCB0aXRsZSwgMS02NCBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRzdGlja2Vyc2V0dGl0bGVcbiAgICAgKi9cbiAgICBzZXRTdGlja2VyU2V0VGl0bGUobmFtZTogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0U3RpY2tlclNldFRpdGxlKHsgbmFtZSwgdGl0bGUgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIGEgc3RpY2tlciBzZXQgdGhhdCB3YXMgY3JlYXRlZCBieSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZXN0aWNrZXJzZXRcbiAgICAgKi9cbiAgICBkZWxldGVTdGlja2VyU2V0KG5hbWU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZVN0aWNrZXJTZXQoeyBuYW1lIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNldCB0aGUgdGh1bWJuYWlsIG9mIGEgcmVndWxhciBvciBtYXNrIHN0aWNrZXIgc2V0LiBUaGUgZm9ybWF0IG9mIHRoZSB0aHVtYm5haWwgZmlsZSBtdXN0IG1hdGNoIHRoZSBmb3JtYXQgb2YgdGhlIHN0aWNrZXJzIGluIHRoZSBzZXQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgU3RpY2tlciBzZXQgbmFtZVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllciBvZiB0aGUgc3RpY2tlciBzZXQgb3duZXJcbiAgICAgKiBAcGFyYW0gdGh1bWJuYWlsIEEgLldFQlAgb3IgLlBORyBpbWFnZSB3aXRoIHRoZSB0aHVtYm5haWwsIG11c3QgYmUgdXAgdG8gMTI4IGtpbG9ieXRlcyBpbiBzaXplIGFuZCBoYXZlIGEgd2lkdGggYW5kIGhlaWdodCBvZiBleGFjdGx5IDEwMHB4LCBvciBhIC5UR1MgYW5pbWF0aW9uIHdpdGggYSB0aHVtYm5haWwgdXAgdG8gMzIga2lsb2J5dGVzIGluIHNpemUgKHNlZSBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL3N0aWNrZXJzI2FuaW1hdGVkLXN0aWNrZXItcmVxdWlyZW1lbnRzIGZvciBhbmltYXRlZCBzdGlja2VyIHRlY2huaWNhbCByZXF1aXJlbWVudHMpLCBvciBhIFdFQk0gdmlkZW8gd2l0aCB0aGUgdGh1bWJuYWlsIHVwIHRvIDMyIGtpbG9ieXRlcyBpbiBzaXplOyBzZWUgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9zdGlja2VycyN2aWRlby1zdGlja2VyLXJlcXVpcmVtZW50cyBmb3IgdmlkZW8gc3RpY2tlciB0ZWNobmljYWwgcmVxdWlyZW1lbnRzLiBQYXNzIGEgZmlsZV9pZCBhcyBhIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGFscmVhZHkgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuIE1vcmUgaW5mb3JtYXRpb24gb24gU2VuZGluZyBGaWxlcyDCuy4gQW5pbWF0ZWQgYW5kIHZpZGVvIHN0aWNrZXIgc2V0IHRodW1ibmFpbHMgY2FuJ3QgYmUgdXBsb2FkZWQgdmlhIEhUVFAgVVJMLiBJZiBvbWl0dGVkLCB0aGVuIHRoZSB0aHVtYm5haWwgaXMgZHJvcHBlZCBhbmQgdGhlIGZpcnN0IHN0aWNrZXIgaXMgdXNlZCBhcyB0aGUgdGh1bWJuYWlsLlxuICAgICAqIEBwYXJhbSBmb3JtYXQgRm9ybWF0IG9mIHRoZSB0aHVtYm5haWwsIG11c3QgYmUgb25lIG9mIOKAnHN0YXRpY+KAnSBmb3IgYSAuV0VCUCBvciAuUE5HIGltYWdlLCDigJxhbmltYXRlZOKAnSBmb3IgYSAuVEdTIGFuaW1hdGlvbiwgb3Ig4oCcdmlkZW/igJ0gZm9yIGEgV0VCTSB2aWRlb1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0c3RpY2tlcnNldHRodW1ibmFpbFxuICAgICAqL1xuICAgIHNldFN0aWNrZXJTZXRUaHVtYm5haWwoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICB0aHVtYm5haWw6IElucHV0RmlsZSB8IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgZm9ybWF0OiBcInN0YXRpY1wiIHwgXCJhbmltYXRlZFwiIHwgXCJ2aWRlb1wiLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJTZXRUaHVtYm5haWwoXG4gICAgICAgICAgICB7IG5hbWUsIHVzZXJfaWQsIHRodW1ibmFpbCwgZm9ybWF0IH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNldCB0aGUgdGh1bWJuYWlsIG9mIGEgY3VzdG9tIGVtb2ppIHN0aWNrZXIgc2V0LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gY3VzdG9tX2Vtb2ppX2lkIEN1c3RvbSBlbW9qaSBpZGVudGlmaWVyIG9mIGEgc3RpY2tlciBmcm9tIHRoZSBzdGlja2VyIHNldDsgcGFzcyBhbiBlbXB0eSBzdHJpbmcgdG8gZHJvcCB0aGUgdGh1bWJuYWlsIGFuZCB1c2UgdGhlIGZpcnN0IHN0aWNrZXIgYXMgdGhlIHRodW1ibmFpbC5cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGN1c3RvbWVtb2ppc3RpY2tlcnNldHRodW1ibmFpbFxuICAgICAqL1xuICAgIHNldEN1c3RvbUVtb2ppU3RpY2tlclNldFRodW1ibmFpbChcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBjdXN0b21fZW1vamlfaWQ6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDdXN0b21FbW9qaVN0aWNrZXJTZXRUaHVtYm5haWwoe1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGN1c3RvbV9lbW9qaV9pZCxcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbnN3ZXJzIHRvIGFuIGlubGluZSBxdWVyeS4gT24gc3VjY2VzcywgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKiBObyBtb3JlIHRoYW4gNTAgcmVzdWx0cyBwZXIgcXVlcnkgYXJlIGFsbG93ZWQuXG4gICAgICpcbiAgICAgKiBFeGFtcGxlOiBBbiBpbmxpbmUgYm90IHRoYXQgc2VuZHMgWW91VHViZSB2aWRlb3MgY2FuIGFzayB0aGUgdXNlciB0byBjb25uZWN0IHRoZSBib3QgdG8gdGhlaXIgWW91VHViZSBhY2NvdW50IHRvIGFkYXB0IHNlYXJjaCByZXN1bHRzIGFjY29yZGluZ2x5LiBUbyBkbyB0aGlzLCBpdCBkaXNwbGF5cyBhICdDb25uZWN0IHlvdXIgWW91VHViZSBhY2NvdW50JyBidXR0b24gYWJvdmUgdGhlIHJlc3VsdHMsIG9yIGV2ZW4gYmVmb3JlIHNob3dpbmcgYW55LiBUaGUgdXNlciBwcmVzc2VzIHRoZSBidXR0b24sIHN3aXRjaGVzIHRvIGEgcHJpdmF0ZSBjaGF0IHdpdGggdGhlIGJvdCBhbmQsIGluIGRvaW5nIHNvLCBwYXNzZXMgYSBzdGFydCBwYXJhbWV0ZXIgdGhhdCBpbnN0cnVjdHMgdGhlIGJvdCB0byByZXR1cm4gYW4gT0F1dGggbGluay4gT25jZSBkb25lLCB0aGUgYm90IGNhbiBvZmZlciBhIHN3aXRjaF9pbmxpbmUgYnV0dG9uIHNvIHRoYXQgdGhlIHVzZXIgY2FuIGVhc2lseSByZXR1cm4gdG8gdGhlIGNoYXQgd2hlcmUgdGhleSB3YW50ZWQgdG8gdXNlIHRoZSBib3QncyBpbmxpbmUgY2FwYWJpbGl0aWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9xdWVyeV9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGFuc3dlcmVkIHF1ZXJ5XG4gICAgICogQHBhcmFtIHJlc3VsdHMgQW4gYXJyYXkgb2YgcmVzdWx0cyBmb3IgdGhlIGlubGluZSBxdWVyeVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcmlubGluZXF1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VySW5saW5lUXVlcnkoXG4gICAgICAgIGlubGluZV9xdWVyeV9pZDogc3RyaW5nLFxuICAgICAgICByZXN1bHRzOiByZWFkb25seSBJbmxpbmVRdWVyeVJlc3VsdFtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiYW5zd2VySW5saW5lUXVlcnlcIiwgXCJpbmxpbmVfcXVlcnlfaWRcIiB8IFwicmVzdWx0c1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5hbnN3ZXJJbmxpbmVRdWVyeShcbiAgICAgICAgICAgIHsgaW5saW5lX3F1ZXJ5X2lkLCByZXN1bHRzLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHJlc3VsdCBvZiBhbiBpbnRlcmFjdGlvbiB3aXRoIGEgV2ViIEFwcCBhbmQgc2VuZCBhIGNvcnJlc3BvbmRpbmcgbWVzc2FnZSBvbiBiZWhhbGYgb2YgdGhlIHVzZXIgdG8gdGhlIGNoYXQgZnJvbSB3aGljaCB0aGUgcXVlcnkgb3JpZ2luYXRlZC4gT24gc3VjY2VzcywgYSBTZW50V2ViQXBwTWVzc2FnZSBvYmplY3QgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gd2ViX2FwcF9xdWVyeV9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHF1ZXJ5IHRvIGJlIGFuc3dlcmVkXG4gICAgICogQHBhcmFtIHJlc3VsdCBBbiBvYmplY3QgZGVzY3JpYmluZyB0aGUgbWVzc2FnZSB0byBiZSBzZW50XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJ3ZWJhcHBxdWVyeVxuICAgICAqL1xuICAgIGFuc3dlcldlYkFwcFF1ZXJ5KFxuICAgICAgICB3ZWJfYXBwX3F1ZXJ5X2lkOiBzdHJpbmcsXG4gICAgICAgIHJlc3VsdDogSW5saW5lUXVlcnlSZXN1bHQsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYW5zd2VyV2ViQXBwUXVlcnkoeyB3ZWJfYXBwX3F1ZXJ5X2lkLCByZXN1bHQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBpbnZvaWNlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHRpdGxlIFByb2R1Y3QgbmFtZSwgMS0zMiBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIGRlc2NyaXB0aW9uIFByb2R1Y3QgZGVzY3JpcHRpb24sIDEtMjU1IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gcGF5bG9hZCBCb3QtZGVmaW5lZCBpbnZvaWNlIHBheWxvYWQsIDEtMTI4IGJ5dGVzLiBUaGlzIHdpbGwgbm90IGJlIGRpc3BsYXllZCB0byB0aGUgdXNlciwgdXNlIGZvciB5b3VyIGludGVybmFsIHByb2Nlc3Nlcy5cbiAgICAgKiBAcGFyYW0gY3VycmVuY3kgVGhyZWUtbGV0dGVyIElTTyA0MjE3IGN1cnJlbmN5IGNvZGUsIHNlZSBtb3JlIG9uIGN1cnJlbmNpZXNcbiAgICAgKiBAcGFyYW0gcHJpY2VzIFByaWNlIGJyZWFrZG93biwgYSBsaXN0IG9mIGNvbXBvbmVudHMgKGUuZy4gcHJvZHVjdCBwcmljZSwgdGF4LCBkaXNjb3VudCwgZGVsaXZlcnkgY29zdCwgZGVsaXZlcnkgdGF4LCBib251cywgZXRjLilcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kaW52b2ljZVxuICAgICAqL1xuICAgIHNlbmRJbnZvaWNlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICAgIHBheWxvYWQ6IHN0cmluZyxcbiAgICAgICAgY3VycmVuY3k6IHN0cmluZyxcbiAgICAgICAgcHJpY2VzOiByZWFkb25seSBMYWJlbGVkUHJpY2VbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNlbmRJbnZvaWNlXCIsXG4gICAgICAgICAgICB8IFwiY2hhdF9pZFwiXG4gICAgICAgICAgICB8IFwidGl0bGVcIlxuICAgICAgICAgICAgfCBcImRlc2NyaXB0aW9uXCJcbiAgICAgICAgICAgIHwgXCJwYXlsb2FkXCJcbiAgICAgICAgICAgIHwgXCJjdXJyZW5jeVwiXG4gICAgICAgICAgICB8IFwicHJpY2VzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kSW52b2ljZSh7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgICAgIHByaWNlcyxcbiAgICAgICAgICAgIC4uLm90aGVyLFxuICAgICAgICB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYSBsaW5rIGZvciBhbiBpbnZvaWNlLiBSZXR1cm5zIHRoZSBjcmVhdGVkIGludm9pY2UgbGluayBhcyBTdHJpbmcgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0aXRsZSBQcm9kdWN0IG5hbWUsIDEtMzIgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBQcm9kdWN0IGRlc2NyaXB0aW9uLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHBheWxvYWQgQm90LWRlZmluZWQgaW52b2ljZSBwYXlsb2FkLCAxLTEyOCBieXRlcy4gVGhpcyB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIsIHVzZSBmb3IgeW91ciBpbnRlcm5hbCBwcm9jZXNzZXMuXG4gICAgICogQHBhcmFtIHByb3ZpZGVyX3Rva2VuIFBheW1lbnQgcHJvdmlkZXIgdG9rZW4sIG9idGFpbmVkIHZpYSBCb3RGYXRoZXJcbiAgICAgKiBAcGFyYW0gY3VycmVuY3kgVGhyZWUtbGV0dGVyIElTTyA0MjE3IGN1cnJlbmN5IGNvZGUsIHNlZSBtb3JlIG9uIGN1cnJlbmNpZXNcbiAgICAgKiBAcGFyYW0gcHJpY2VzIFByaWNlIGJyZWFrZG93biwgYSBsaXN0IG9mIGNvbXBvbmVudHMgKGUuZy4gcHJvZHVjdCBwcmljZSwgdGF4LCBkaXNjb3VudCwgZGVsaXZlcnkgY29zdCwgZGVsaXZlcnkgdGF4LCBib251cywgZXRjLilcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVpbnZvaWNlbGlua1xuICAgICAqL1xuICAgIGNyZWF0ZUludm9pY2VMaW5rKFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgICAgICBwYXlsb2FkOiBzdHJpbmcsXG4gICAgICAgIHByb3ZpZGVyX3Rva2VuOiBzdHJpbmcsXG4gICAgICAgIGN1cnJlbmN5OiBzdHJpbmcsXG4gICAgICAgIHByaWNlczogTGFiZWxlZFByaWNlW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJjcmVhdGVJbnZvaWNlTGlua1wiLFxuICAgICAgICAgICAgfCBcInRpdGxlXCJcbiAgICAgICAgICAgIHwgXCJkZXNjcmlwdGlvblwiXG4gICAgICAgICAgICB8IFwicGF5bG9hZFwiXG4gICAgICAgICAgICB8IFwicHJvdmlkZXJfdG9rZW5cIlxuICAgICAgICAgICAgfCBcImN1cnJlbmN5XCJcbiAgICAgICAgICAgIHwgXCJwcmljZXNcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNyZWF0ZUludm9pY2VMaW5rKHtcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgICAgcHJvdmlkZXJfdG9rZW4sXG4gICAgICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgICAgIHByaWNlcyxcbiAgICAgICAgICAgIC4uLm90aGVyLFxuICAgICAgICB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHlvdSBzZW50IGFuIGludm9pY2UgcmVxdWVzdGluZyBhIHNoaXBwaW5nIGFkZHJlc3MgYW5kIHRoZSBwYXJhbWV0ZXIgaXNfZmxleGlibGUgd2FzIHNwZWNpZmllZCwgdGhlIEJvdCBBUEkgd2lsbCBzZW5kIGFuIFVwZGF0ZSB3aXRoIGEgc2hpcHBpbmdfcXVlcnkgZmllbGQgdG8gdGhlIGJvdC4gVXNlIHRoaXMgbWV0aG9kIHRvIHJlcGx5IHRvIHNoaXBwaW5nIHF1ZXJpZXMuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2hpcHBpbmdfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBxdWVyeSB0byBiZSBhbnN3ZXJlZFxuICAgICAqIEBwYXJhbSBvayBQYXNzIFRydWUgaWYgZGVsaXZlcnkgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGlzIHBvc3NpYmxlIGFuZCBGYWxzZSBpZiB0aGVyZSBhcmUgYW55IHByb2JsZW1zIChmb3IgZXhhbXBsZSwgaWYgZGVsaXZlcnkgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGlzIG5vdCBwb3NzaWJsZSlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJzaGlwcGluZ3F1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VyU2hpcHBpbmdRdWVyeShcbiAgICAgICAgc2hpcHBpbmdfcXVlcnlfaWQ6IHN0cmluZyxcbiAgICAgICAgb2s6IGJvb2xlYW4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJhbnN3ZXJTaGlwcGluZ1F1ZXJ5XCIsIFwic2hpcHBpbmdfcXVlcnlfaWRcIiB8IFwib2tcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYW5zd2VyU2hpcHBpbmdRdWVyeShcbiAgICAgICAgICAgIHsgc2hpcHBpbmdfcXVlcnlfaWQsIG9rLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uY2UgdGhlIHVzZXIgaGFzIGNvbmZpcm1lZCB0aGVpciBwYXltZW50IGFuZCBzaGlwcGluZyBkZXRhaWxzLCB0aGUgQm90IEFQSSBzZW5kcyB0aGUgZmluYWwgY29uZmlybWF0aW9uIGluIHRoZSBmb3JtIG9mIGFuIFVwZGF0ZSB3aXRoIHRoZSBmaWVsZCBwcmVfY2hlY2tvdXRfcXVlcnkuIFVzZSB0aGlzIG1ldGhvZCB0byByZXNwb25kIHRvIHN1Y2ggcHJlLWNoZWNrb3V0IHF1ZXJpZXMuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuIE5vdGU6IFRoZSBCb3QgQVBJIG11c3QgcmVjZWl2ZSBhbiBhbnN3ZXIgd2l0aGluIDEwIHNlY29uZHMgYWZ0ZXIgdGhlIHByZS1jaGVja291dCBxdWVyeSB3YXMgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwcmVfY2hlY2tvdXRfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBxdWVyeSB0byBiZSBhbnN3ZXJlZFxuICAgICAqIEBwYXJhbSBvayBTcGVjaWZ5IFRydWUgaWYgZXZlcnl0aGluZyBpcyBhbHJpZ2h0IChnb29kcyBhcmUgYXZhaWxhYmxlLCBldGMuKSBhbmQgdGhlIGJvdCBpcyByZWFkeSB0byBwcm9jZWVkIHdpdGggdGhlIG9yZGVyLiBVc2UgRmFsc2UgaWYgdGhlcmUgYXJlIGFueSBwcm9ibGVtcy5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJwcmVjaGVja291dHF1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeShcbiAgICAgICAgcHJlX2NoZWNrb3V0X3F1ZXJ5X2lkOiBzdHJpbmcsXG4gICAgICAgIG9rOiBib29sZWFuLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeVwiLFxuICAgICAgICAgICAgXCJwcmVfY2hlY2tvdXRfcXVlcnlfaWRcIiB8IFwib2tcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFuc3dlclByZUNoZWNrb3V0UXVlcnkoXG4gICAgICAgICAgICB7IHByZV9jaGVja291dF9xdWVyeV9pZCwgb2ssIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgYm90J3MgVGVsZWdyYW0gU3RhciB0cmFuc2FjdGlvbnMgaW4gY2hyb25vbG9naWNhbCBvcmRlci4gT24gc3VjY2VzcywgcmV0dXJucyBhIFN0YXJUcmFuc2FjdGlvbnMgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0c3RhcnRyYW5zYWN0aW9uc1xuICAgICAqL1xuICAgIGdldFN0YXJUcmFuc2FjdGlvbnMoXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJnZXRTdGFyVHJhbnNhY3Rpb25zXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldFN0YXJUcmFuc2FjdGlvbnMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZnVuZHMgYSBzdWNjZXNzZnVsIHBheW1lbnQgaW4gVGVsZWdyYW0gU3RhcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBJZGVudGlmaWVyIG9mIHRoZSB1c2VyIHdob3NlIHBheW1lbnQgd2lsbCBiZSByZWZ1bmRlZFxuICAgICAqIEBwYXJhbSB0ZWxlZ3JhbV9wYXltZW50X2NoYXJnZV9pZCBUZWxlZ3JhbSBwYXltZW50IGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3JlZnVuZHN0YXJwYXltZW50XG4gICAgICovXG4gICAgcmVmdW5kU3RhclBheW1lbnQoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgdGVsZWdyYW1fcGF5bWVudF9jaGFyZ2VfaWQ6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5yZWZ1bmRTdGFyUGF5bWVudChcbiAgICAgICAgICAgIHsgdXNlcl9pZCwgdGVsZWdyYW1fcGF5bWVudF9jaGFyZ2VfaWQgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbmZvcm1zIGEgdXNlciB0aGF0IHNvbWUgb2YgdGhlIFRlbGVncmFtIFBhc3Nwb3J0IGVsZW1lbnRzIHRoZXkgcHJvdmlkZWQgY29udGFpbnMgZXJyb3JzLiBUaGUgdXNlciB3aWxsIG5vdCBiZSBhYmxlIHRvIHJlLXN1Ym1pdCB0aGVpciBQYXNzcG9ydCB0byB5b3UgdW50aWwgdGhlIGVycm9ycyBhcmUgZml4ZWQgKHRoZSBjb250ZW50cyBvZiB0aGUgZmllbGQgZm9yIHdoaWNoIHlvdSByZXR1cm5lZCB0aGUgZXJyb3IgbXVzdCBjaGFuZ2UpLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGlzIGlmIHRoZSBkYXRhIHN1Ym1pdHRlZCBieSB0aGUgdXNlciBkb2Vzbid0IHNhdGlzZnkgdGhlIHN0YW5kYXJkcyB5b3VyIHNlcnZpY2UgcmVxdWlyZXMgZm9yIGFueSByZWFzb24uIEZvciBleGFtcGxlLCBpZiBhIGJpcnRoZGF5IGRhdGUgc2VlbXMgaW52YWxpZCwgYSBzdWJtaXR0ZWQgZG9jdW1lbnQgaXMgYmx1cnJ5LCBhIHNjYW4gc2hvd3MgZXZpZGVuY2Ugb2YgdGFtcGVyaW5nLCBldGMuIFN1cHBseSBzb21lIGRldGFpbHMgaW4gdGhlIGVycm9yIG1lc3NhZ2UgdG8gbWFrZSBzdXJlIHRoZSB1c2VyIGtub3dzIGhvdyB0byBjb3JyZWN0IHRoZSBpc3N1ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gZXJyb3JzIEFuIGFycmF5IGRlc2NyaWJpbmcgdGhlIGVycm9yc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0cGFzc3BvcnRkYXRhZXJyb3JzXG4gICAgICovXG4gICAgc2V0UGFzc3BvcnREYXRhRXJyb3JzKFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIGVycm9yczogcmVhZG9ubHkgUGFzc3BvcnRFbGVtZW50RXJyb3JbXSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRQYXNzcG9ydERhdGFFcnJvcnMoeyB1c2VyX2lkLCBlcnJvcnMgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhIGdhbWUuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0XG4gICAgICogQHBhcmFtIGdhbWVfc2hvcnRfbmFtZSBTaG9ydCBuYW1lIG9mIHRoZSBnYW1lLCBzZXJ2ZXMgYXMgdGhlIHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgZ2FtZS4gU2V0IHVwIHlvdXIgZ2FtZXMgdmlhIEJvdEZhdGhlci5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kZ2FtZVxuICAgICAqL1xuICAgIHNlbmRHYW1lKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIsXG4gICAgICAgIGdhbWVfc2hvcnRfbmFtZTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZEdhbWVcIiwgXCJjaGF0X2lkXCIgfCBcImdhbWVfc2hvcnRfbmFtZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kR2FtZShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgZ2FtZV9zaG9ydF9uYW1lLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHNjb3JlIG9mIHRoZSBzcGVjaWZpZWQgdXNlciBpbiBhIGdhbWUgbWVzc2FnZS4gT24gc3VjY2VzcywgaWYgdGhlIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIFJldHVybnMgYW4gZXJyb3IsIGlmIHRoZSBuZXcgc2NvcmUgaXMgbm90IGdyZWF0ZXIgdGhhbiB0aGUgdXNlcidzIGN1cnJlbnQgc2NvcmUgaW4gdGhlIGNoYXQgYW5kIGZvcmNlIGlzIEZhbHNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdFxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIHNlbnQgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSBzY29yZSBOZXcgc2NvcmUsIG11c3QgYmUgbm9uLW5lZ2F0aXZlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Z2FtZXNjb3JlXG4gICAgICovXG4gICAgc2V0R2FtZVNjb3JlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzY29yZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwic2V0R2FtZVNjb3JlXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiIHwgXCJ1c2VyX2lkXCIgfCBcInNjb3JlXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRHYW1lU2NvcmUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIHVzZXJfaWQsIHNjb3JlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHNjb3JlIG9mIHRoZSBzcGVjaWZpZWQgdXNlciBpbiBhIGdhbWUgbWVzc2FnZS4gT24gc3VjY2VzcywgaWYgdGhlIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIFJldHVybnMgYW4gZXJyb3IsIGlmIHRoZSBuZXcgc2NvcmUgaXMgbm90IGdyZWF0ZXIgdGhhbiB0aGUgdXNlcidzIGN1cnJlbnQgc2NvcmUgaW4gdGhlIGNoYXQgYW5kIGZvcmNlIGlzIEZhbHNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVXNlciBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIHNjb3JlIE5ldyBzY29yZSwgbXVzdCBiZSBub24tbmVnYXRpdmVcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRnYW1lc2NvcmVcbiAgICAgKi9cbiAgICBzZXRHYW1lU2NvcmVJbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2NvcmU6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNldEdhbWVTY29yZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwidXNlcl9pZFwiIHwgXCJzY29yZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0R2FtZVNjb3JlKFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgdXNlcl9pZCwgc2NvcmUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBkYXRhIGZvciBoaWdoIHNjb3JlIHRhYmxlcy4gV2lsbCByZXR1cm4gdGhlIHNjb3JlIG9mIHRoZSBzcGVjaWZpZWQgdXNlciBhbmQgc2V2ZXJhbCBvZiB0aGVpciBuZWlnaGJvcnMgaW4gYSBnYW1lLiBSZXR1cm5zIGFuIEFycmF5IG9mIEdhbWVIaWdoU2NvcmUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIHdpbGwgY3VycmVudGx5IHJldHVybiBzY29yZXMgZm9yIHRoZSB0YXJnZXQgdXNlciwgcGx1cyB0d28gb2YgdGhlaXIgY2xvc2VzdCBuZWlnaGJvcnMgb24gZWFjaCBzaWRlLiBXaWxsIGFsc28gcmV0dXJuIHRoZSB0b3AgdGhyZWUgdXNlcnMgaWYgdGhlIHVzZXIgYW5kIGhpcyBuZWlnaGJvcnMgYXJlIG5vdCBhbW9uZyB0aGVtLiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgYmVoYXZpb3IgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0XG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgc2VudCBtZXNzYWdlXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVGFyZ2V0IHVzZXIgaWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGdhbWVoaWdoc2NvcmVzXG4gICAgICovXG4gICAgZ2V0R2FtZUhpZ2hTY29yZXMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlcixcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0R2FtZUhpZ2hTY29yZXMoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIHVzZXJfaWQgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGRhdGEgZm9yIGhpZ2ggc2NvcmUgdGFibGVzLiBXaWxsIHJldHVybiB0aGUgc2NvcmUgb2YgdGhlIHNwZWNpZmllZCB1c2VyIGFuZCBzZXZlcmFsIG9mIHRoZWlyIG5laWdoYm9ycyBpbiBhbiBpbmxpbmUgZ2FtZS4gT24gc3VjY2VzcywgcmV0dXJucyBhbiBBcnJheSBvZiBHYW1lSGlnaFNjb3JlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGN1cnJlbnRseSByZXR1cm4gc2NvcmVzIGZvciB0aGUgdGFyZ2V0IHVzZXIsIHBsdXMgdHdvIG9mIHRoZWlyIGNsb3Nlc3QgbmVpZ2hib3JzIG9uIGVhY2ggc2lkZS4gV2lsbCBhbHNvIHJldHVybiB0aGUgdG9wIHRocmVlIHVzZXJzIGlmIHRoZSB1c2VyIGFuZCBoaXMgbmVpZ2hib3JzIGFyZSBub3QgYW1vbmcgdGhlbS4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGJlaGF2aW9yIGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVGFyZ2V0IHVzZXIgaWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGdhbWVoaWdoc2NvcmVzXG4gICAgICovXG4gICAgZ2V0R2FtZUhpZ2hTY29yZXNJbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRHYW1lSGlnaFNjb3JlcyhcbiAgICAgICAgICAgIHsgaW5saW5lX21lc3NhZ2VfaWQsIHVzZXJfaWQgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBbUJsQyxTQUVJLFlBQVksUUFPVCxjQUFjO0FBV3JCOzs7Ozs7Ozs7Ozs7Ozs7O0NBZ0JDLEdBQ0QsT0FBTyxNQUFNOzs7RUFDVDs7Ozs7Ozs7S0FRQyxHQUNELEFBQWdCLElBQU87RUFFdkI7Ozs7S0FJQyxHQUNELEFBQWdCLE9BbUJkO0VBRUY7Ozs7Ozs7O0tBUUMsR0FDRCxZQUNJLEFBQWdCLEtBQWEsRUFDN0IsQUFBZ0IsT0FBMEIsRUFDMUMsb0JBQTJDLENBQzdDO1NBSGtCLFFBQUE7U0FDQSxVQUFBO0lBR2hCLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixFQUFFLEdBQUcsYUFDeEMsT0FDQSxTQUNBO0lBRUosSUFBSSxDQUFDLEdBQUcsR0FBRztJQUNYLElBQUksQ0FBQyxNQUFNLEdBQUc7TUFDVjtNQUNBLHVCQUF1QixJQUFNLHNCQUFzQixLQUFLO0lBQzVEO0VBQ0o7RUFFQTs7Ozs7Ozs7Ozs7S0FXQyxHQUNELFdBQVcsS0FBOEIsRUFBRSxNQUFvQixFQUFFO0lBQzdELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7TUFBRSxHQUFHLEtBQUs7SUFBQyxHQUFHO0VBQzdDO0VBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBaUJDLEdBQ0QsV0FDSSxHQUFXLEVBQ1gsS0FBcUMsRUFDckMsTUFBb0IsRUFDdEI7SUFDRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO01BQUU7TUFBSyxHQUFHLEtBQUs7SUFBQyxHQUFHO0VBQ2xEO0VBRUE7Ozs7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