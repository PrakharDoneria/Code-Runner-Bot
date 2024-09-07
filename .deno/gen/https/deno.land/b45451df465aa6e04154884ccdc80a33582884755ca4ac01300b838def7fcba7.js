function inputMessage(queryTemplate) {
  return {
    ...queryTemplate,
    ...inputMessageMethods(queryTemplate)
  };
}
function inputMessageMethods(queryTemplate) {
  return {
    text (message_text, options = {}) {
      const content = {
        message_text,
        ...options
      };
      return {
        ...queryTemplate,
        input_message_content: content
      };
    },
    location (latitude, longitude, options = {}) {
      const content = {
        latitude,
        longitude,
        ...options
      };
      return {
        ...queryTemplate,
        input_message_content: content
      };
    },
    venue (title, latitude, longitude, address, options) {
      const content = {
        title,
        latitude,
        longitude,
        address,
        ...options
      };
      return {
        ...queryTemplate,
        input_message_content: content
      };
    },
    contact (first_name, phone_number, options = {}) {
      const content = {
        first_name,
        phone_number,
        ...options
      };
      return {
        ...queryTemplate,
        input_message_content: content
      };
    },
    invoice (title, description, payload, provider_token, currency, prices, options = {}) {
      const content = {
        title,
        description,
        payload,
        provider_token,
        currency,
        prices,
        ...options
      };
      return {
        ...queryTemplate,
        input_message_content: content
      };
    }
  };
}
/**
 * Holds a number of helper methods for building `InlineQueryResult*` objects.
 *
 * For example, letting the user pick one out of three photos can be done like
 * this.
 *
 * ```ts
 * const results = [
 *     InlineQueryResultBuilder.photo('id0', 'https://grammy.dev/images/Y.png'),
 *     InlineQueryResultBuilder.photo('id1', 'https://grammy.dev/images/Y.png'),
 *     InlineQueryResultBuilder.photo('id2', 'https://grammy.dev/images/Y.png'),
 * ];
 * await ctx.answerInlineQuery(results)
 * ```
 *
 * If you want the message content to be different from the content in the
 * inline query result, you can perform another method call on the resulting
 * objects.
 *
 * ```ts
 * const results = [
 *     InlineQueryResultBuilder.photo("id0", "https://grammy.dev/images/Y.png")
 *         .text("Picked photo 0!"),
 *     InlineQueryResultBuilder.photo("id1", "https://grammy.dev/images/Y.png")
 *         .text("Picked photo 1!"),
 *     InlineQueryResultBuilder.photo("id2", "https://grammy.dev/images/Y.png")
 *         .text("Picked photo 2!"),
 * ];
 * await ctx.answerInlineQuery(results)
 * ```
 *
 * Be sure to check the
 * [documentation](https://core.telegram.org/bots/api#inline-mode) on inline
 * mode.
 */ export const InlineQueryResultBuilder = {
  /**
     * Builds an InlineQueryResultArticle object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultarticle. Requires you
     * to specify the actual message content by calling another function on the
     * object returned from this method.
     *
     * @param id Unique identifier for this result, 1-64 Bytes
     * @param title Title of the result
     * @param options Remaining options
     */ article (id, title, options = {}) {
    return inputMessageMethods({
      type: "article",
      id,
      title,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultAudio object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultaudio.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title
     * @param audio_url A valid URL for the audio file
     * @param options Remaining options
     */ audio (id, title, audio_url, options = {}) {
    return inputMessage({
      type: "audio",
      id,
      title,
      audio_url: typeof audio_url === "string" ? audio_url : audio_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedAudio object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedaudio.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param audio_file_id A valid file identifier for the audio file
     * @param options Remaining options
     */ audioCached (id, audio_file_id, options = {}) {
    return inputMessage({
      type: "audio",
      id,
      audio_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultContact object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcontact.
     *
     * @param id Unique identifier for this result, 1-64 Bytes
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param options Remaining options
     */ contact (id, phone_number, first_name, options = {}) {
    return inputMessage({
      type: "contact",
      id,
      phone_number,
      first_name,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultDocument object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultdocument with
     * mime_type set to "application/pdf".
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param document_url A valid URL for the file
     * @param options Remaining options
     */ documentPdf (id, title, document_url, options = {}) {
    return inputMessage({
      type: "document",
      mime_type: "application/pdf",
      id,
      title,
      document_url: typeof document_url === "string" ? document_url : document_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultDocument object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultdocument with
     * mime_type set to "application/zip".
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param document_url A valid URL for the file
     * @param options Remaining options
     */ documentZip (id, title, document_url, options = {}) {
    return inputMessage({
      type: "document",
      mime_type: "application/zip",
      id,
      title,
      document_url: typeof document_url === "string" ? document_url : document_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedDocument object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcacheddocument.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param document_file_id A valid file identifier for the file
     * @param options Remaining options
     */ documentCached (id, title, document_file_id, options = {}) {
    return inputMessage({
      type: "document",
      id,
      title,
      document_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultGame object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultgame.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param game_short_name Short name of the game
     * @param options Remaining options
     */ game (id, game_short_name, options = {}) {
    return {
      type: "game",
      id,
      game_short_name,
      ...options
    };
  },
  /**
     * Builds an InlineQueryResultGif object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultgif.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param gif_url A valid URL for the GIF file. File size must not exceed 1MB
     * @param thumbnail_url URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result
     * @param options Remaining options
     */ gif (id, gif_url, thumbnail_url, options = {}) {
    return inputMessage({
      type: "gif",
      id,
      gif_url: typeof gif_url === "string" ? gif_url : gif_url.href,
      thumbnail_url: typeof thumbnail_url === "string" ? thumbnail_url : thumbnail_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedGif object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedgif.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param gif_file_id A valid file identifier for the GIF file
     * @param options Remaining options
     */ gifCached (id, gif_file_id, options = {}) {
    return inputMessage({
      type: "gif",
      id,
      gif_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultLocation object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultlocation.
     *
     * @param id Unique identifier for this result, 1-64 Bytes
     * @param title Location title
     * @param latitude Location latitude in degrees
     * @param longitude Location longitude in degrees
     * @param options Remaining options
     */ location (id, title, latitude, longitude, options = {}) {
    return inputMessage({
      type: "location",
      id,
      title,
      latitude,
      longitude,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultMpeg4Gif object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultmpeg4gif.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param mpeg4_url A valid URL for the MPEG4 file. File size must not exceed 1MB
     * @param thumbnail_url URL of the static (JPEG or GIF) or animated (MPEG4) thumbnail for the result
     * @param options Remaining options
     */ mpeg4gif (id, mpeg4_url, thumbnail_url, options = {}) {
    return inputMessage({
      type: "mpeg4_gif",
      id,
      mpeg4_url: typeof mpeg4_url === "string" ? mpeg4_url : mpeg4_url.href,
      thumbnail_url: typeof thumbnail_url === "string" ? thumbnail_url : thumbnail_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedMpeg4Gif object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param mpeg4_file_id A valid file identifier for the MPEG4 file
     * @param options Remaining options
     */ mpeg4gifCached (id, mpeg4_file_id, options = {}) {
    return inputMessage({
      type: "mpeg4_gif",
      id,
      mpeg4_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultPhoto object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultphoto with the
     * thumbnail defaulting to the photo itself.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param photo_url A valid URL of the photo. Photo must be in JPEG format. Photo size must not exceed 5MB
     * @param options Remaining options
     */ photo (id, photo_url, options = {
    thumbnail_url: typeof photo_url === "string" ? photo_url : photo_url.href
  }) {
    return inputMessage({
      type: "photo",
      id,
      photo_url: typeof photo_url === "string" ? photo_url : photo_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedPhoto object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedphoto.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param photo_file_id A valid file identifier of the photo
     * @param options Remaining options
     */ photoCached (id, photo_file_id, options = {}) {
    return inputMessage({
      type: "photo",
      id,
      photo_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedSticker object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedsticker.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param sticker_file_id A valid file identifier of the sticker
     * @param options Remaining options
     */ stickerCached (id, sticker_file_id, options = {}) {
    return inputMessage({
      type: "sticker",
      id,
      sticker_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultVenue object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultvenue.
     *
     * @param id Unique identifier for this result, 1-64 Bytes
     * @param title Title of the venue
     * @param latitude Latitude of the venue location in degrees
     * @param longitude Longitude of the venue location in degrees
     * @param address Address of the venue
     * @param options Remaining options
     */ venue (id, title, latitude, longitude, address, options = {}) {
    return inputMessage({
      type: "venue",
      id,
      title,
      latitude,
      longitude,
      address,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultVideo object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultvideo with mime_type
     * set to "text/html". This will send an embedded video player. Requires you
     * to specify the actual message content by calling another function on the
     * object returned from this method.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param video_url A valid URL for the embedded video player
     * @param thumbnail_url URL of the thumbnail (JPEG only) for the video
     * @param options Remaining options
     */ videoHtml (id, title, video_url, thumbnail_url, options = {}) {
    // require input message content by only returning methods
    return inputMessageMethods({
      type: "video",
      mime_type: "text/html",
      id,
      title,
      video_url: typeof video_url === "string" ? video_url : video_url.href,
      thumbnail_url: typeof thumbnail_url === "string" ? thumbnail_url : thumbnail_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultVideo object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultvideo with mime_type
     * set to "video/mp4".
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param video_url A valid URL for the video file
     * @param thumbnail_url URL of the thumbnail (JPEG only) for the video
     * @param options Remaining options
     */ videoMp4 (id, title, video_url, thumbnail_url, options = {}) {
    return inputMessage({
      type: "video",
      mime_type: "video/mp4",
      id,
      title,
      video_url: typeof video_url === "string" ? video_url : video_url.href,
      thumbnail_url: typeof thumbnail_url === "string" ? thumbnail_url : thumbnail_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedVideo object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedvideo.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Title for the result
     * @param video_file_id A valid file identifier for the video file
     * @param options Remaining options
     */ videoCached (id, title, video_file_id, options = {}) {
    return inputMessage({
      type: "video",
      id,
      title,
      video_file_id,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultVoice object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultvoice.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Voice message title
     * @param voice_url A valid URL for the voice recording
     * @param options Remaining options
     */ voice (id, title, voice_url, options = {}) {
    return inputMessage({
      type: "voice",
      id,
      title,
      voice_url: typeof voice_url === "string" ? voice_url : voice_url.href,
      ...options
    });
  },
  /**
     * Builds an InlineQueryResultCachedVoice object as specified by
     * https://core.telegram.org/bots/api#inlinequeryresultcachedvoice.
     *
     * @param id Unique identifier for this result, 1-64 bytes
     * @param title Voice message title
     * @param voice_file_id A valid file identifier for the voice message
     * @param options Remaining options
     */ voiceCached (id, title, voice_file_id, options = {}) {
    return inputMessage({
      type: "voice",
      id,
      title,
      voice_file_id,
      ...options
    });
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29udmVuaWVuY2UvaW5saW5lX3F1ZXJ5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdCxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0QXJ0aWNsZSxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0QXVkaW8sXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZEF1ZGlvLFxuICAgIHR5cGUgSW5saW5lUXVlcnlSZXN1bHRDYWNoZWREb2N1bWVudCxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkR2lmLFxuICAgIHR5cGUgSW5saW5lUXVlcnlSZXN1bHRDYWNoZWRNcGVnNEdpZixcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkUGhvdG8sXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFN0aWNrZXIsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFZpZGVvLFxuICAgIHR5cGUgSW5saW5lUXVlcnlSZXN1bHRDYWNoZWRWb2ljZSxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0Q29udGFjdCxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0RG9jdW1lbnQsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdEdhbWUsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdEdpZixcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0TG9jYXRpb24sXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdE1wZWc0R2lmLFxuICAgIHR5cGUgSW5saW5lUXVlcnlSZXN1bHRQaG90byxcbiAgICB0eXBlIElubGluZVF1ZXJ5UmVzdWx0VmVudWUsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdFZpZGVvLFxuICAgIHR5cGUgSW5saW5lUXVlcnlSZXN1bHRWb2ljZSxcbiAgICB0eXBlIElucHV0Q29udGFjdE1lc3NhZ2VDb250ZW50LFxuICAgIHR5cGUgSW5wdXRJbnZvaWNlTWVzc2FnZUNvbnRlbnQsXG4gICAgdHlwZSBJbnB1dExvY2F0aW9uTWVzc2FnZUNvbnRlbnQsXG4gICAgdHlwZSBJbnB1dFRleHRNZXNzYWdlQ29udGVudCxcbiAgICB0eXBlIElucHV0VmVudWVNZXNzYWdlQ29udGVudCxcbiAgICB0eXBlIExhYmVsZWRQcmljZSxcbn0gZnJvbSBcIi4uL3R5cGVzLnRzXCI7XG5cbnR5cGUgSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFQsIEsgZXh0ZW5kcyBrZXlvZiBUPiA9IE9taXQ8XG4gICAgVCxcbiAgICBcInR5cGVcIiB8IFwiaWRcIiB8IFwiaW5wdXRfbWVzc2FnZV9jb250ZW50XCIgfCBLXG4+O1xuXG50eXBlIE9wdGlvbmFsS2V5czxUPiA9IHsgW0sgaW4ga2V5b2YgVF0tPzogdW5kZWZpbmVkIGV4dGVuZHMgVFtLXSA/IEsgOiBuZXZlciB9O1xudHlwZSBPcHRpb25hbEZpZWxkczxUPiA9IFBpY2s8VCwgT3B0aW9uYWxLZXlzPFQ+W2tleW9mIFRdPjtcblxuZnVuY3Rpb24gaW5wdXRNZXNzYWdlPFIgZXh0ZW5kcyBJbmxpbmVRdWVyeVJlc3VsdD4ocXVlcnlUZW1wbGF0ZTogUikge1xuICAgIHJldHVybiB7XG4gICAgICAgIC4uLnF1ZXJ5VGVtcGxhdGUsXG4gICAgICAgIC4uLmlucHV0TWVzc2FnZU1ldGhvZHM8Uj4ocXVlcnlUZW1wbGF0ZSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlucHV0TWVzc2FnZU1ldGhvZHM8UiBleHRlbmRzIElubGluZVF1ZXJ5UmVzdWx0PihcbiAgICBxdWVyeVRlbXBsYXRlOiBPbWl0PFIsIFwiaW5wdXRfbWVzc2FnZV9jb250ZW50XCI+LFxuKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGV4dChcbiAgICAgICAgICAgIG1lc3NhZ2VfdGV4dDogc3RyaW5nLFxuICAgICAgICAgICAgb3B0aW9uczogT3B0aW9uYWxGaWVsZHM8SW5wdXRUZXh0TWVzc2FnZUNvbnRlbnQ+ID0ge30sXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudDogSW5wdXRUZXh0TWVzc2FnZUNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZV90ZXh0LFxuICAgICAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4ucXVlcnlUZW1wbGF0ZSwgaW5wdXRfbWVzc2FnZV9jb250ZW50OiBjb250ZW50IH0gYXMgUjtcbiAgICAgICAgfSxcbiAgICAgICAgbG9jYXRpb24oXG4gICAgICAgICAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgICAgICAgICAgbG9uZ2l0dWRlOiBudW1iZXIsXG4gICAgICAgICAgICBvcHRpb25zOiBPcHRpb25hbEZpZWxkczxJbnB1dExvY2F0aW9uTWVzc2FnZUNvbnRlbnQ+ID0ge30sXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudDogSW5wdXRMb2NhdGlvbk1lc3NhZ2VDb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLnF1ZXJ5VGVtcGxhdGUsIGlucHV0X21lc3NhZ2VfY29udGVudDogY29udGVudCB9IGFzIFI7XG4gICAgICAgIH0sXG4gICAgICAgIHZlbnVlKFxuICAgICAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgICAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICAgICAgICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICAgICAgICAgIG9wdGlvbnM6IE9wdGlvbmFsRmllbGRzPElucHV0VmVudWVNZXNzYWdlQ29udGVudD4sXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudDogSW5wdXRWZW51ZU1lc3NhZ2VDb250ZW50ID0ge1xuICAgICAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgICAgICBhZGRyZXNzLFxuICAgICAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIHsgLi4ucXVlcnlUZW1wbGF0ZSwgaW5wdXRfbWVzc2FnZV9jb250ZW50OiBjb250ZW50IH0gYXMgUjtcbiAgICAgICAgfSxcbiAgICAgICAgY29udGFjdChcbiAgICAgICAgICAgIGZpcnN0X25hbWU6IHN0cmluZyxcbiAgICAgICAgICAgIHBob25lX251bWJlcjogc3RyaW5nLFxuICAgICAgICAgICAgb3B0aW9uczogT3B0aW9uYWxGaWVsZHM8SW5wdXRDb250YWN0TWVzc2FnZUNvbnRlbnQ+ID0ge30sXG4gICAgICAgICkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudDogSW5wdXRDb250YWN0TWVzc2FnZUNvbnRlbnQgPSB7XG4gICAgICAgICAgICAgICAgZmlyc3RfbmFtZSxcbiAgICAgICAgICAgICAgICBwaG9uZV9udW1iZXIsXG4gICAgICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4geyAuLi5xdWVyeVRlbXBsYXRlLCBpbnB1dF9tZXNzYWdlX2NvbnRlbnQ6IGNvbnRlbnQgfSBhcyBSO1xuICAgICAgICB9LFxuICAgICAgICBpbnZvaWNlKFxuICAgICAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBzdHJpbmcsXG4gICAgICAgICAgICBwYXlsb2FkOiBzdHJpbmcsXG4gICAgICAgICAgICBwcm92aWRlcl90b2tlbjogc3RyaW5nLFxuICAgICAgICAgICAgY3VycmVuY3k6IHN0cmluZyxcbiAgICAgICAgICAgIHByaWNlczogTGFiZWxlZFByaWNlW10sXG4gICAgICAgICAgICBvcHRpb25zOiBPcHRpb25hbEZpZWxkczxJbnB1dEludm9pY2VNZXNzYWdlQ29udGVudD4gPSB7fSxcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50OiBJbnB1dEludm9pY2VNZXNzYWdlQ29udGVudCA9IHtcbiAgICAgICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgICAgICAgIHByb3ZpZGVyX3Rva2VuLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5LFxuICAgICAgICAgICAgICAgIHByaWNlcyxcbiAgICAgICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLnF1ZXJ5VGVtcGxhdGUsIGlucHV0X21lc3NhZ2VfY29udGVudDogY29udGVudCB9IGFzIFI7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuLyoqXG4gKiBIb2xkcyBhIG51bWJlciBvZiBoZWxwZXIgbWV0aG9kcyBmb3IgYnVpbGRpbmcgYElubGluZVF1ZXJ5UmVzdWx0KmAgb2JqZWN0cy5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgbGV0dGluZyB0aGUgdXNlciBwaWNrIG9uZSBvdXQgb2YgdGhyZWUgcGhvdG9zIGNhbiBiZSBkb25lIGxpa2VcbiAqIHRoaXMuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IHJlc3VsdHMgPSBbXG4gKiAgICAgSW5saW5lUXVlcnlSZXN1bHRCdWlsZGVyLnBob3RvKCdpZDAnLCAnaHR0cHM6Ly9ncmFtbXkuZGV2L2ltYWdlcy9ZLnBuZycpLFxuICogICAgIElubGluZVF1ZXJ5UmVzdWx0QnVpbGRlci5waG90bygnaWQxJywgJ2h0dHBzOi8vZ3JhbW15LmRldi9pbWFnZXMvWS5wbmcnKSxcbiAqICAgICBJbmxpbmVRdWVyeVJlc3VsdEJ1aWxkZXIucGhvdG8oJ2lkMicsICdodHRwczovL2dyYW1teS5kZXYvaW1hZ2VzL1kucG5nJyksXG4gKiBdO1xuICogYXdhaXQgY3R4LmFuc3dlcklubGluZVF1ZXJ5KHJlc3VsdHMpXG4gKiBgYGBcbiAqXG4gKiBJZiB5b3Ugd2FudCB0aGUgbWVzc2FnZSBjb250ZW50IHRvIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBjb250ZW50IGluIHRoZVxuICogaW5saW5lIHF1ZXJ5IHJlc3VsdCwgeW91IGNhbiBwZXJmb3JtIGFub3RoZXIgbWV0aG9kIGNhbGwgb24gdGhlIHJlc3VsdGluZ1xuICogb2JqZWN0cy5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgcmVzdWx0cyA9IFtcbiAqICAgICBJbmxpbmVRdWVyeVJlc3VsdEJ1aWxkZXIucGhvdG8oXCJpZDBcIiwgXCJodHRwczovL2dyYW1teS5kZXYvaW1hZ2VzL1kucG5nXCIpXG4gKiAgICAgICAgIC50ZXh0KFwiUGlja2VkIHBob3RvIDAhXCIpLFxuICogICAgIElubGluZVF1ZXJ5UmVzdWx0QnVpbGRlci5waG90byhcImlkMVwiLCBcImh0dHBzOi8vZ3JhbW15LmRldi9pbWFnZXMvWS5wbmdcIilcbiAqICAgICAgICAgLnRleHQoXCJQaWNrZWQgcGhvdG8gMSFcIiksXG4gKiAgICAgSW5saW5lUXVlcnlSZXN1bHRCdWlsZGVyLnBob3RvKFwiaWQyXCIsIFwiaHR0cHM6Ly9ncmFtbXkuZGV2L2ltYWdlcy9ZLnBuZ1wiKVxuICogICAgICAgICAudGV4dChcIlBpY2tlZCBwaG90byAyIVwiKSxcbiAqIF07XG4gKiBhd2FpdCBjdHguYW5zd2VySW5saW5lUXVlcnkocmVzdWx0cylcbiAqIGBgYFxuICpcbiAqIEJlIHN1cmUgdG8gY2hlY2sgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbmxpbmUtbW9kZSkgb24gaW5saW5lXG4gKiBtb2RlLlxuICovXG5leHBvcnQgY29uc3QgSW5saW5lUXVlcnlSZXN1bHRCdWlsZGVyID0ge1xuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdEFydGljbGUgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRhcnRpY2xlLiBSZXF1aXJlcyB5b3VcbiAgICAgKiB0byBzcGVjaWZ5IHRoZSBhY3R1YWwgbWVzc2FnZSBjb250ZW50IGJ5IGNhbGxpbmcgYW5vdGhlciBmdW5jdGlvbiBvbiB0aGVcbiAgICAgKiBvYmplY3QgcmV0dXJuZWQgZnJvbSB0aGlzIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgQnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVGl0bGUgb2YgdGhlIHJlc3VsdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgYXJ0aWNsZShcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRBcnRpY2xlLFxuICAgICAgICAgICAgXCJ0aXRsZVwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZU1ldGhvZHM8SW5saW5lUXVlcnlSZXN1bHRBcnRpY2xlPihcbiAgICAgICAgICAgIHsgdHlwZTogXCJhcnRpY2xlXCIsIGlkLCB0aXRsZSwgLi4ub3B0aW9ucyB9LFxuICAgICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0QXVkaW8gb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRhdWRpby5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVGl0bGVcbiAgICAgKiBAcGFyYW0gYXVkaW9fdXJsIEEgdmFsaWQgVVJMIGZvciB0aGUgYXVkaW8gZmlsZVxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgYXVkaW8oXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIGF1ZGlvX3VybDogc3RyaW5nIHwgVVJMLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdEF1ZGlvLFxuICAgICAgICAgICAgXCJ0aXRsZVwiIHwgXCJhdWRpb191cmxcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRBdWRpbz4oe1xuICAgICAgICAgICAgdHlwZTogXCJhdWRpb1wiLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGF1ZGlvX3VybDogdHlwZW9mIGF1ZGlvX3VybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8gYXVkaW9fdXJsXG4gICAgICAgICAgICAgICAgOiBhdWRpb191cmwuaHJlZixcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkQXVkaW8gb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRjYWNoZWRhdWRpby5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gYXVkaW9fZmlsZV9pZCBBIHZhbGlkIGZpbGUgaWRlbnRpZmllciBmb3IgdGhlIGF1ZGlvIGZpbGVcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIGF1ZGlvQ2FjaGVkKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBhdWRpb19maWxlX2lkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkQXVkaW8sXG4gICAgICAgICAgICBcImF1ZGlvX2ZpbGVfaWRcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRDYWNoZWRBdWRpbz4oXG4gICAgICAgICAgICB7IHR5cGU6IFwiYXVkaW9cIiwgaWQsIGF1ZGlvX2ZpbGVfaWQsIC4uLm9wdGlvbnMgfSxcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdENvbnRhY3Qgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRjb250YWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBCeXRlc1xuICAgICAqIEBwYXJhbSBwaG9uZV9udW1iZXIgQ29udGFjdCdzIHBob25lIG51bWJlclxuICAgICAqIEBwYXJhbSBmaXJzdF9uYW1lIENvbnRhY3QncyBmaXJzdCBuYW1lXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbnNcbiAgICAgKi9cbiAgICBjb250YWN0KFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBwaG9uZV9udW1iZXI6IHN0cmluZyxcbiAgICAgICAgZmlyc3RfbmFtZTogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdENvbnRhY3QsXG4gICAgICAgICAgICBcInBob25lX251bWJlclwiIHwgXCJmaXJzdF9uYW1lXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gaW5wdXRNZXNzYWdlPElubGluZVF1ZXJ5UmVzdWx0Q29udGFjdD4oXG4gICAgICAgICAgICB7IHR5cGU6IFwiY29udGFjdFwiLCBpZCwgcGhvbmVfbnVtYmVyLCBmaXJzdF9uYW1lLCAuLi5vcHRpb25zIH0sXG4gICAgICAgICk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYW4gSW5saW5lUXVlcnlSZXN1bHREb2N1bWVudCBvYmplY3QgYXMgc3BlY2lmaWVkIGJ5XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbmxpbmVxdWVyeXJlc3VsdGRvY3VtZW50IHdpdGhcbiAgICAgKiBtaW1lX3R5cGUgc2V0IHRvIFwiYXBwbGljYXRpb24vcGRmXCIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVzdWx0LCAxLTY0IGJ5dGVzXG4gICAgICogQHBhcmFtIHRpdGxlIFRpdGxlIGZvciB0aGUgcmVzdWx0XG4gICAgICogQHBhcmFtIGRvY3VtZW50X3VybCBBIHZhbGlkIFVSTCBmb3IgdGhlIGZpbGVcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIGRvY3VtZW50UGRmKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBkb2N1bWVudF91cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHREb2N1bWVudCxcbiAgICAgICAgICAgIFwibWltZV90eXBlXCIgfCBcInRpdGxlXCIgfCBcImRvY3VtZW50X3VybFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdERvY3VtZW50Pih7XG4gICAgICAgICAgICB0eXBlOiBcImRvY3VtZW50XCIsXG4gICAgICAgICAgICBtaW1lX3R5cGU6IFwiYXBwbGljYXRpb24vcGRmXCIsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgZG9jdW1lbnRfdXJsOiB0eXBlb2YgZG9jdW1lbnRfdXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyBkb2N1bWVudF91cmxcbiAgICAgICAgICAgICAgICA6IGRvY3VtZW50X3VybC5ocmVmLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYW4gSW5saW5lUXVlcnlSZXN1bHREb2N1bWVudCBvYmplY3QgYXMgc3BlY2lmaWVkIGJ5XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbmxpbmVxdWVyeXJlc3VsdGRvY3VtZW50IHdpdGhcbiAgICAgKiBtaW1lX3R5cGUgc2V0IHRvIFwiYXBwbGljYXRpb24vemlwXCIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVzdWx0LCAxLTY0IGJ5dGVzXG4gICAgICogQHBhcmFtIHRpdGxlIFRpdGxlIGZvciB0aGUgcmVzdWx0XG4gICAgICogQHBhcmFtIGRvY3VtZW50X3VybCBBIHZhbGlkIFVSTCBmb3IgdGhlIGZpbGVcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIGRvY3VtZW50WmlwKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBkb2N1bWVudF91cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHREb2N1bWVudCxcbiAgICAgICAgICAgIFwibWltZV90eXBlXCIgfCBcInRpdGxlXCIgfCBcImRvY3VtZW50X3VybFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdERvY3VtZW50Pih7XG4gICAgICAgICAgICB0eXBlOiBcImRvY3VtZW50XCIsXG4gICAgICAgICAgICBtaW1lX3R5cGU6IFwiYXBwbGljYXRpb24vemlwXCIsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgZG9jdW1lbnRfdXJsOiB0eXBlb2YgZG9jdW1lbnRfdXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyBkb2N1bWVudF91cmxcbiAgICAgICAgICAgICAgICA6IGRvY3VtZW50X3VybC5ocmVmLFxuICAgICAgICAgICAgLi4ub3B0aW9ucyxcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYW4gSW5saW5lUXVlcnlSZXN1bHRDYWNoZWREb2N1bWVudCBvYmplY3QgYXMgc3BlY2lmaWVkIGJ5XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbmxpbmVxdWVyeXJlc3VsdGNhY2hlZGRvY3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBieXRlc1xuICAgICAqIEBwYXJhbSB0aXRsZSBUaXRsZSBmb3IgdGhlIHJlc3VsdFxuICAgICAqIEBwYXJhbSBkb2N1bWVudF9maWxlX2lkIEEgdmFsaWQgZmlsZSBpZGVudGlmaWVyIGZvciB0aGUgZmlsZVxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgZG9jdW1lbnRDYWNoZWQoXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIGRvY3VtZW50X2ZpbGVfaWQ6IHN0cmluZyxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRDYWNoZWREb2N1bWVudCxcbiAgICAgICAgICAgIFwidGl0bGVcIiB8IFwiZG9jdW1lbnRfZmlsZV9pZFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdENhY2hlZERvY3VtZW50PihcbiAgICAgICAgICAgIHsgdHlwZTogXCJkb2N1bWVudFwiLCBpZCwgdGl0bGUsIGRvY3VtZW50X2ZpbGVfaWQsIC4uLm9wdGlvbnMgfSxcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdEdhbWUgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRnYW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBieXRlc1xuICAgICAqIEBwYXJhbSBnYW1lX3Nob3J0X25hbWUgU2hvcnQgbmFtZSBvZiB0aGUgZ2FtZVxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgZ2FtZShcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgZ2FtZV9zaG9ydF9uYW1lOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0R2FtZSxcbiAgICAgICAgICAgIFwiZ2FtZV9zaG9ydF9uYW1lXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImdhbWVcIiwgaWQsIGdhbWVfc2hvcnRfbmFtZSwgLi4ub3B0aW9ucyB9O1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0R2lmIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0Z2lmLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBieXRlc1xuICAgICAqIEBwYXJhbSBnaWZfdXJsIEEgdmFsaWQgVVJMIGZvciB0aGUgR0lGIGZpbGUuIEZpbGUgc2l6ZSBtdXN0IG5vdCBleGNlZWQgMU1CXG4gICAgICogQHBhcmFtIHRodW1ibmFpbF91cmwgVVJMIG9mIHRoZSBzdGF0aWMgKEpQRUcgb3IgR0lGKSBvciBhbmltYXRlZCAoTVBFRzQpIHRodW1ibmFpbCBmb3IgdGhlIHJlc3VsdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgZ2lmKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBnaWZfdXJsOiBzdHJpbmcgfCBVUkwsXG4gICAgICAgIHRodW1ibmFpbF91cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRHaWYsXG4gICAgICAgICAgICBcImdpZl91cmxcIiB8IFwidGh1bWJuYWlsX3VybFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdEdpZj4oe1xuICAgICAgICAgICAgdHlwZTogXCJnaWZcIixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgZ2lmX3VybDogdHlwZW9mIGdpZl91cmwgPT09IFwic3RyaW5nXCIgPyBnaWZfdXJsIDogZ2lmX3VybC5ocmVmLFxuICAgICAgICAgICAgdGh1bWJuYWlsX3VybDogdHlwZW9mIHRodW1ibmFpbF91cmwgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IHRodW1ibmFpbF91cmxcbiAgICAgICAgICAgICAgICA6IHRodW1ibmFpbF91cmwuaHJlZixcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkR2lmIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0Y2FjaGVkZ2lmLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBieXRlc1xuICAgICAqIEBwYXJhbSBnaWZfZmlsZV9pZCBBIHZhbGlkIGZpbGUgaWRlbnRpZmllciBmb3IgdGhlIEdJRiBmaWxlXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbnNcbiAgICAgKi9cbiAgICBnaWZDYWNoZWQoXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIGdpZl9maWxlX2lkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkR2lmLFxuICAgICAgICAgICAgXCJnaWZfZmlsZV9pZFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdENhY2hlZEdpZj4oXG4gICAgICAgICAgICB7IHR5cGU6IFwiZ2lmXCIsIGlkLCBnaWZfZmlsZV9pZCwgLi4ub3B0aW9ucyB9LFxuICAgICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0TG9jYXRpb24gb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRsb2NhdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgQnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgTG9jYXRpb24gdGl0bGVcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTG9jYXRpb24gbGF0aXR1ZGUgaW4gZGVncmVlc1xuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9jYXRpb24gbG9uZ2l0dWRlIGluIGRlZ3JlZXNcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIGxvY2F0aW9uKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgICAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRMb2NhdGlvbixcbiAgICAgICAgICAgIFwidGl0bGVcIiB8IFwibGF0aXR1ZGVcIiB8IFwibG9uZ2l0dWRlXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gaW5wdXRNZXNzYWdlPElubGluZVF1ZXJ5UmVzdWx0TG9jYXRpb24+KFxuICAgICAgICAgICAgeyB0eXBlOiBcImxvY2F0aW9uXCIsIGlkLCB0aXRsZSwgbGF0aXR1ZGUsIGxvbmdpdHVkZSwgLi4ub3B0aW9ucyB9LFxuICAgICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0TXBlZzRHaWYgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRtcGVnNGdpZi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gbXBlZzRfdXJsIEEgdmFsaWQgVVJMIGZvciB0aGUgTVBFRzQgZmlsZS4gRmlsZSBzaXplIG11c3Qgbm90IGV4Y2VlZCAxTUJcbiAgICAgKiBAcGFyYW0gdGh1bWJuYWlsX3VybCBVUkwgb2YgdGhlIHN0YXRpYyAoSlBFRyBvciBHSUYpIG9yIGFuaW1hdGVkIChNUEVHNCkgdGh1bWJuYWlsIGZvciB0aGUgcmVzdWx0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbnNcbiAgICAgKi9cbiAgICBtcGVnNGdpZihcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgbXBlZzRfdXJsOiBzdHJpbmcgfCBVUkwsXG4gICAgICAgIHRodW1ibmFpbF91cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRNcGVnNEdpZixcbiAgICAgICAgICAgIFwibXBlZzRfdXJsXCIgfCBcInRodW1ibmFpbF91cmxcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRNcGVnNEdpZj4oe1xuICAgICAgICAgICAgdHlwZTogXCJtcGVnNF9naWZcIixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgbXBlZzRfdXJsOiB0eXBlb2YgbXBlZzRfdXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyBtcGVnNF91cmxcbiAgICAgICAgICAgICAgICA6IG1wZWc0X3VybC5ocmVmLFxuICAgICAgICAgICAgdGh1bWJuYWlsX3VybDogdHlwZW9mIHRodW1ibmFpbF91cmwgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IHRodW1ibmFpbF91cmxcbiAgICAgICAgICAgICAgICA6IHRodW1ibmFpbF91cmwuaHJlZixcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkTXBlZzRHaWYgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRjYWNoZWRtcGVnNGdpZi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gbXBlZzRfZmlsZV9pZCBBIHZhbGlkIGZpbGUgaWRlbnRpZmllciBmb3IgdGhlIE1QRUc0IGZpbGVcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIG1wZWc0Z2lmQ2FjaGVkKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBtcGVnNF9maWxlX2lkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkTXBlZzRHaWYsXG4gICAgICAgICAgICBcIm1wZWc0X2ZpbGVfaWRcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRDYWNoZWRNcGVnNEdpZj4oXG4gICAgICAgICAgICB7IHR5cGU6IFwibXBlZzRfZ2lmXCIsIGlkLCBtcGVnNF9maWxlX2lkLCAuLi5vcHRpb25zIH0sXG4gICAgICAgICk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYW4gSW5saW5lUXVlcnlSZXN1bHRQaG90byBvYmplY3QgYXMgc3BlY2lmaWVkIGJ5XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbmxpbmVxdWVyeXJlc3VsdHBob3RvIHdpdGggdGhlXG4gICAgICogdGh1bWJuYWlsIGRlZmF1bHRpbmcgdG8gdGhlIHBob3RvIGl0c2VsZi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gcGhvdG9fdXJsIEEgdmFsaWQgVVJMIG9mIHRoZSBwaG90by4gUGhvdG8gbXVzdCBiZSBpbiBKUEVHIGZvcm1hdC4gUGhvdG8gc2l6ZSBtdXN0IG5vdCBleGNlZWQgNU1CXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbnNcbiAgICAgKi9cbiAgICBwaG90byhcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgcGhvdG9fdXJsOiBzdHJpbmcgfCBVUkwsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxJbmxpbmVRdWVyeVJlc3VsdFBob3RvLCBcInBob3RvX3VybFwiPiA9XG4gICAgICAgICAgICB7IC8vIGRvIG5vdCByZXF1aXJlIHRodW1ibmFpbCwgZGVmYXVsdCB0byB0aGUgcGhvdG8gaXRzZWxmXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsX3VybDogdHlwZW9mIHBob3RvX3VybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgICAgICA/IHBob3RvX3VybFxuICAgICAgICAgICAgICAgICAgICA6IHBob3RvX3VybC5ocmVmLFxuICAgICAgICAgICAgfSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdFBob3RvPih7XG4gICAgICAgICAgICB0eXBlOiBcInBob3RvXCIsXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIHBob3RvX3VybDogdHlwZW9mIHBob3RvX3VybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8gcGhvdG9fdXJsXG4gICAgICAgICAgICAgICAgOiBwaG90b191cmwuaHJlZixcbiAgICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkUGhvdG8gb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRjYWNoZWRwaG90by5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gcGhvdG9fZmlsZV9pZCBBIHZhbGlkIGZpbGUgaWRlbnRpZmllciBvZiB0aGUgcGhvdG9cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIHBob3RvQ2FjaGVkKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICBwaG90b19maWxlX2lkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkUGhvdG8sXG4gICAgICAgICAgICBcInBob3RvX2ZpbGVfaWRcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRDYWNoZWRQaG90bz4oXG4gICAgICAgICAgICB7IHR5cGU6IFwicGhvdG9cIiwgaWQsIHBob3RvX2ZpbGVfaWQsIC4uLm9wdGlvbnMgfSxcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFN0aWNrZXIgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHRjYWNoZWRzdGlja2VyLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGlzIHJlc3VsdCwgMS02NCBieXRlc1xuICAgICAqIEBwYXJhbSBzdGlja2VyX2ZpbGVfaWQgQSB2YWxpZCBmaWxlIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIHN0aWNrZXJDYWNoZWQoXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIHN0aWNrZXJfZmlsZV9pZDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFN0aWNrZXIsXG4gICAgICAgICAgICBcInN0aWNrZXJfZmlsZV9pZFwiXG4gICAgICAgID4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZTxJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFN0aWNrZXI+KFxuICAgICAgICAgICAgeyB0eXBlOiBcInN0aWNrZXJcIiwgaWQsIHN0aWNrZXJfZmlsZV9pZCwgLi4ub3B0aW9ucyB9LFxuICAgICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0VmVudWUgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHR2ZW51ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgQnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVGl0bGUgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIHRoZSB2ZW51ZSBsb2NhdGlvbiBpbiBkZWdyZWVzXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgdGhlIHZlbnVlIGxvY2F0aW9uIGluIGRlZ3JlZXNcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBBZGRyZXNzIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgdmVudWUoXG4gICAgICAgIGlkOiBzdHJpbmcsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0VmVudWUsXG4gICAgICAgICAgICBcInRpdGxlXCIgfCBcImxhdGl0dWRlXCIgfCBcImxvbmdpdHVkZVwiIHwgXCJhZGRyZXNzXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gaW5wdXRNZXNzYWdlPElubGluZVF1ZXJ5UmVzdWx0VmVudWU+KHtcbiAgICAgICAgICAgIHR5cGU6IFwidmVudWVcIixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBsYXRpdHVkZSxcbiAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgIGFkZHJlc3MsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdFZpZGVvIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0dmlkZW8gd2l0aCBtaW1lX3R5cGVcbiAgICAgKiBzZXQgdG8gXCJ0ZXh0L2h0bWxcIi4gVGhpcyB3aWxsIHNlbmQgYW4gZW1iZWRkZWQgdmlkZW8gcGxheWVyLiBSZXF1aXJlcyB5b3VcbiAgICAgKiB0byBzcGVjaWZ5IHRoZSBhY3R1YWwgbWVzc2FnZSBjb250ZW50IGJ5IGNhbGxpbmcgYW5vdGhlciBmdW5jdGlvbiBvbiB0aGVcbiAgICAgKiBvYmplY3QgcmV0dXJuZWQgZnJvbSB0aGlzIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVGl0bGUgZm9yIHRoZSByZXN1bHRcbiAgICAgKiBAcGFyYW0gdmlkZW9fdXJsIEEgdmFsaWQgVVJMIGZvciB0aGUgZW1iZWRkZWQgdmlkZW8gcGxheWVyXG4gICAgICogQHBhcmFtIHRodW1ibmFpbF91cmwgVVJMIG9mIHRoZSB0aHVtYm5haWwgKEpQRUcgb25seSkgZm9yIHRoZSB2aWRlb1xuICAgICAqIEBwYXJhbSBvcHRpb25zIFJlbWFpbmluZyBvcHRpb25zXG4gICAgICovXG4gICAgdmlkZW9IdG1sKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICB2aWRlb191cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgdGh1bWJuYWlsX3VybDogc3RyaW5nIHwgVVJMLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdFZpZGVvLFxuICAgICAgICAgICAgXCJtaW1lX3R5cGVcIiB8IFwidGl0bGVcIiB8IFwidmlkZW9fdXJsXCIgfCBcInRodW1ibmFpbF91cmxcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIC8vIHJlcXVpcmUgaW5wdXQgbWVzc2FnZSBjb250ZW50IGJ5IG9ubHkgcmV0dXJuaW5nIG1ldGhvZHNcbiAgICAgICAgcmV0dXJuIGlucHV0TWVzc2FnZU1ldGhvZHM8SW5saW5lUXVlcnlSZXN1bHRWaWRlbz4oe1xuICAgICAgICAgICAgdHlwZTogXCJ2aWRlb1wiLFxuICAgICAgICAgICAgbWltZV90eXBlOiBcInRleHQvaHRtbFwiLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIHZpZGVvX3VybDogdHlwZW9mIHZpZGVvX3VybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8gdmlkZW9fdXJsXG4gICAgICAgICAgICAgICAgOiB2aWRlb191cmwuaHJlZixcbiAgICAgICAgICAgIHRodW1ibmFpbF91cmw6IHR5cGVvZiB0aHVtYm5haWxfdXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyB0aHVtYm5haWxfdXJsXG4gICAgICAgICAgICAgICAgOiB0aHVtYm5haWxfdXJsLmhyZWYsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdFZpZGVvIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0dmlkZW8gd2l0aCBtaW1lX3R5cGVcbiAgICAgKiBzZXQgdG8gXCJ2aWRlby9tcDRcIi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVGl0bGUgZm9yIHRoZSByZXN1bHRcbiAgICAgKiBAcGFyYW0gdmlkZW9fdXJsIEEgdmFsaWQgVVJMIGZvciB0aGUgdmlkZW8gZmlsZVxuICAgICAqIEBwYXJhbSB0aHVtYm5haWxfdXJsIFVSTCBvZiB0aGUgdGh1bWJuYWlsIChKUEVHIG9ubHkpIGZvciB0aGUgdmlkZW9cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIHZpZGVvTXA0KFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICB2aWRlb191cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgdGh1bWJuYWlsX3VybDogc3RyaW5nIHwgVVJMLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdFZpZGVvLFxuICAgICAgICAgICAgXCJtaW1lX3R5cGVcIiB8IFwidGl0bGVcIiB8IFwidmlkZW9fdXJsXCIgfCBcInRodW1ibmFpbF91cmxcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRWaWRlbz4oe1xuICAgICAgICAgICAgdHlwZTogXCJ2aWRlb1wiLFxuICAgICAgICAgICAgbWltZV90eXBlOiBcInZpZGVvL21wNFwiLFxuICAgICAgICAgICAgaWQsXG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIHZpZGVvX3VybDogdHlwZW9mIHZpZGVvX3VybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8gdmlkZW9fdXJsXG4gICAgICAgICAgICAgICAgOiB2aWRlb191cmwuaHJlZixcbiAgICAgICAgICAgIHRodW1ibmFpbF91cmw6IHR5cGVvZiB0aHVtYm5haWxfdXJsID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgPyB0aHVtYm5haWxfdXJsXG4gICAgICAgICAgICAgICAgOiB0aHVtYm5haWxfdXJsLmhyZWYsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFZpZGVvIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0Y2FjaGVkdmlkZW8uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVzdWx0LCAxLTY0IGJ5dGVzXG4gICAgICogQHBhcmFtIHRpdGxlIFRpdGxlIGZvciB0aGUgcmVzdWx0XG4gICAgICogQHBhcmFtIHZpZGVvX2ZpbGVfaWQgQSB2YWxpZCBmaWxlIGlkZW50aWZpZXIgZm9yIHRoZSB2aWRlbyBmaWxlXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbnNcbiAgICAgKi9cbiAgICB2aWRlb0NhY2hlZChcbiAgICAgICAgaWQ6IHN0cmluZyxcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgdmlkZW9fZmlsZV9pZDogc3RyaW5nLFxuICAgICAgICBvcHRpb25zOiBJbmxpbmVRdWVyeVJlc3VsdE9wdGlvbnM8XG4gICAgICAgICAgICBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFZpZGVvLFxuICAgICAgICAgICAgXCJ0aXRsZVwiIHwgXCJ2aWRlb19maWxlX2lkXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gaW5wdXRNZXNzYWdlPElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkVmlkZW8+KFxuICAgICAgICAgICAgeyB0eXBlOiBcInZpZGVvXCIsIGlkLCB0aXRsZSwgdmlkZW9fZmlsZV9pZCwgLi4ub3B0aW9ucyB9LFxuICAgICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQnVpbGRzIGFuIElubGluZVF1ZXJ5UmVzdWx0Vm9pY2Ugb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5saW5lcXVlcnlyZXN1bHR2b2ljZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhpcyByZXN1bHQsIDEtNjQgYnl0ZXNcbiAgICAgKiBAcGFyYW0gdGl0bGUgVm9pY2UgbWVzc2FnZSB0aXRsZVxuICAgICAqIEBwYXJhbSB2b2ljZV91cmwgQSB2YWxpZCBVUkwgZm9yIHRoZSB2b2ljZSByZWNvcmRpbmdcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIHZvaWNlKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICB2b2ljZV91cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgICAgb3B0aW9uczogSW5saW5lUXVlcnlSZXN1bHRPcHRpb25zPFxuICAgICAgICAgICAgSW5saW5lUXVlcnlSZXN1bHRWb2ljZSxcbiAgICAgICAgICAgIFwidGl0bGVcIiB8IFwidm9pY2VfdXJsXCJcbiAgICAgICAgPiA9IHt9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gaW5wdXRNZXNzYWdlPElubGluZVF1ZXJ5UmVzdWx0Vm9pY2U+KHtcbiAgICAgICAgICAgIHR5cGU6IFwidm9pY2VcIixcbiAgICAgICAgICAgIGlkLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICB2b2ljZV91cmw6IHR5cGVvZiB2b2ljZV91cmwgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IHZvaWNlX3VybFxuICAgICAgICAgICAgICAgIDogdm9pY2VfdXJsLmhyZWYsXG4gICAgICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEJ1aWxkcyBhbiBJbmxpbmVRdWVyeVJlc3VsdENhY2hlZFZvaWNlIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lubGluZXF1ZXJ5cmVzdWx0Y2FjaGVkdm9pY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoaXMgcmVzdWx0LCAxLTY0IGJ5dGVzXG4gICAgICogQHBhcmFtIHRpdGxlIFZvaWNlIG1lc3NhZ2UgdGl0bGVcbiAgICAgKiBAcGFyYW0gdm9pY2VfZmlsZV9pZCBBIHZhbGlkIGZpbGUgaWRlbnRpZmllciBmb3IgdGhlIHZvaWNlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uc1xuICAgICAqL1xuICAgIHZvaWNlQ2FjaGVkKFxuICAgICAgICBpZDogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICB2b2ljZV9maWxlX2lkOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElubGluZVF1ZXJ5UmVzdWx0T3B0aW9uczxcbiAgICAgICAgICAgIElubGluZVF1ZXJ5UmVzdWx0Q2FjaGVkVm9pY2UsXG4gICAgICAgICAgICBcInRpdGxlXCIgfCBcInZvaWNlX2ZpbGVfaWRcIlxuICAgICAgICA+ID0ge30sXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBpbnB1dE1lc3NhZ2U8SW5saW5lUXVlcnlSZXN1bHRDYWNoZWRWb2ljZT4oXG4gICAgICAgICAgICB7IHR5cGU6IFwidm9pY2VcIiwgaWQsIHRpdGxlLCB2b2ljZV9maWxlX2lkLCAuLi5vcHRpb25zIH0sXG4gICAgICAgICk7XG4gICAgfSxcbn07XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBc0NBLFNBQVMsYUFBMEMsYUFBZ0I7RUFDL0QsT0FBTztJQUNILEdBQUcsYUFBYTtJQUNoQixHQUFHLG9CQUF1QixjQUFjO0VBQzVDO0FBQ0o7QUFDQSxTQUFTLG9CQUNMLGFBQStDO0VBRS9DLE9BQU87SUFDSCxNQUNJLFlBQW9CLEVBQ3BCLFVBQW1ELENBQUMsQ0FBQztNQUVyRCxNQUFNLFVBQW1DO1FBQ3JDO1FBQ0EsR0FBRyxPQUFPO01BQ2Q7TUFDQSxPQUFPO1FBQUUsR0FBRyxhQUFhO1FBQUUsdUJBQXVCO01BQVE7SUFDOUQ7SUFDQSxVQUNJLFFBQWdCLEVBQ2hCLFNBQWlCLEVBQ2pCLFVBQXVELENBQUMsQ0FBQztNQUV6RCxNQUFNLFVBQXVDO1FBQ3pDO1FBQ0E7UUFDQSxHQUFHLE9BQU87TUFDZDtNQUNBLE9BQU87UUFBRSxHQUFHLGFBQWE7UUFBRSx1QkFBdUI7TUFBUTtJQUM5RDtJQUNBLE9BQ0ksS0FBYSxFQUNiLFFBQWdCLEVBQ2hCLFNBQWlCLEVBQ2pCLE9BQWUsRUFDZixPQUFpRDtNQUVqRCxNQUFNLFVBQW9DO1FBQ3RDO1FBQ0E7UUFDQTtRQUNBO1FBQ0EsR0FBRyxPQUFPO01BQ2Q7TUFDQSxPQUFPO1FBQUUsR0FBRyxhQUFhO1FBQUUsdUJBQXVCO01BQVE7SUFDOUQ7SUFDQSxTQUNJLFVBQWtCLEVBQ2xCLFlBQW9CLEVBQ3BCLFVBQXNELENBQUMsQ0FBQztNQUV4RCxNQUFNLFVBQXNDO1FBQ3hDO1FBQ0E7UUFDQSxHQUFHLE9BQU87TUFDZDtNQUNBLE9BQU87UUFBRSxHQUFHLGFBQWE7UUFBRSx1QkFBdUI7TUFBUTtJQUM5RDtJQUNBLFNBQ0ksS0FBYSxFQUNiLFdBQW1CLEVBQ25CLE9BQWUsRUFDZixjQUFzQixFQUN0QixRQUFnQixFQUNoQixNQUFzQixFQUN0QixVQUFzRCxDQUFDLENBQUM7TUFFeEQsTUFBTSxVQUFzQztRQUN4QztR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