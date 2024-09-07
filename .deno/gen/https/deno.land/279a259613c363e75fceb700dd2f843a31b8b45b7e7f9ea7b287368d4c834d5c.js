/**
 * Holds a number of helper methods for building `InputMedia*` objects. They are
 * useful when sending media groups and when editing media messages.
 *
 * For example, media groups can be sent like this.
 *
 * ```ts
 * const paths = [
 *     '/tmp/pic0.jpg',
 *     '/tmp/pic1.jpg',
 *     '/tmp/pic2.jpg',
 * ]
 * const files = paths.map((path) => new InputFile(path))
 * const media = files.map((file) => InputMediaBuilder.photo(file))
 * await bot.api.sendMediaGroup(chatId, media)
 * ```
 *
 * Media can be edited like this.
 *
 * ```ts
 * const file = new InputFile('/tmp/pic0.jpg')
 * const media = InputMediaBuilder.photo(file, {
 *     caption: 'new caption'
 * })
 * await bot.api.editMessageMedia(chatId, messageId, media)
 * ```
 */ export const InputMediaBuilder = {
  /**
     * Creates a new `InputMediaPhoto` object as specified by
     * https://core.telegram.org/bots/api#inputmediaphoto.
     *
     * @param media An `InputFile` instance or a file identifier
     * @param options Remaining optional options
     */ photo (media, options = {}) {
    return {
      type: "photo",
      media,
      ...options
    };
  },
  /**
     * Creates a new `InputMediaVideo` object as specified by
     * https://core.telegram.org/bots/api#inputmediavideo.
     *
     * @param media An `InputFile` instance or a file identifier
     * @param options Remaining optional options
     */ video (media, options = {}) {
    return {
      type: "video",
      media,
      ...options
    };
  },
  /**
     * Creates a new `InputMediaAnimation` object as specified by
     * https://core.telegram.org/bots/api#inputmediaanimation.
     *
     * @param media An `InputFile` instance or a file identifier
     * @param options Remaining optional options
     */ animation (media, options = {}) {
    return {
      type: "animation",
      media,
      ...options
    };
  },
  /**
     * Creates a new `InputMediaAudio` object as specified by
     * https://core.telegram.org/bots/api#inputmediaaudio.
     *
     * @param media An `InputFile` instance or a file identifier
     * @param options Remaining optional options
     */ audio (media, options = {}) {
    return {
      type: "audio",
      media,
      ...options
    };
  },
  /**
     * Creates a new `InputMediaDocument` object as specified by
     * https://core.telegram.org/bots/api#inputmediadocument.
     *
     * @param media An `InputFile` instance or a file identifier
     * @param options Remaining optional options
     */ document (media, options = {}) {
    return {
      type: "document",
      media,
      ...options
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjMwLjAvY29udmVuaWVuY2UvaW5wdXRfbWVkaWEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICB0eXBlIElucHV0RmlsZSxcbiAgICB0eXBlIElucHV0TWVkaWFBbmltYXRpb24sXG4gICAgdHlwZSBJbnB1dE1lZGlhQXVkaW8sXG4gICAgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8sXG4gICAgdHlwZSBJbnB1dE1lZGlhVmlkZW8sXG59IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG50eXBlIElucHV0TWVkaWFPcHRpb25zPFQ+ID0gT21pdDxULCBcInR5cGVcIiB8IFwibWVkaWFcIj47XG5cbi8qKlxuICogSG9sZHMgYSBudW1iZXIgb2YgaGVscGVyIG1ldGhvZHMgZm9yIGJ1aWxkaW5nIGBJbnB1dE1lZGlhKmAgb2JqZWN0cy4gVGhleSBhcmVcbiAqIHVzZWZ1bCB3aGVuIHNlbmRpbmcgbWVkaWEgZ3JvdXBzIGFuZCB3aGVuIGVkaXRpbmcgbWVkaWEgbWVzc2FnZXMuXG4gKlxuICogRm9yIGV4YW1wbGUsIG1lZGlhIGdyb3VwcyBjYW4gYmUgc2VudCBsaWtlIHRoaXMuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IHBhdGhzID0gW1xuICogICAgICcvdG1wL3BpYzAuanBnJyxcbiAqICAgICAnL3RtcC9waWMxLmpwZycsXG4gKiAgICAgJy90bXAvcGljMi5qcGcnLFxuICogXVxuICogY29uc3QgZmlsZXMgPSBwYXRocy5tYXAoKHBhdGgpID0+IG5ldyBJbnB1dEZpbGUocGF0aCkpXG4gKiBjb25zdCBtZWRpYSA9IGZpbGVzLm1hcCgoZmlsZSkgPT4gSW5wdXRNZWRpYUJ1aWxkZXIucGhvdG8oZmlsZSkpXG4gKiBhd2FpdCBib3QuYXBpLnNlbmRNZWRpYUdyb3VwKGNoYXRJZCwgbWVkaWEpXG4gKiBgYGBcbiAqXG4gKiBNZWRpYSBjYW4gYmUgZWRpdGVkIGxpa2UgdGhpcy5cbiAqXG4gKiBgYGB0c1xuICogY29uc3QgZmlsZSA9IG5ldyBJbnB1dEZpbGUoJy90bXAvcGljMC5qcGcnKVxuICogY29uc3QgbWVkaWEgPSBJbnB1dE1lZGlhQnVpbGRlci5waG90byhmaWxlLCB7XG4gKiAgICAgY2FwdGlvbjogJ25ldyBjYXB0aW9uJ1xuICogfSlcbiAqIGF3YWl0IGJvdC5hcGkuZWRpdE1lc3NhZ2VNZWRpYShjaGF0SWQsIG1lc3NhZ2VJZCwgbWVkaWEpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNvbnN0IElucHV0TWVkaWFCdWlsZGVyID0ge1xuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgYElucHV0TWVkaWFQaG90b2Agb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5wdXRtZWRpYXBob3RvLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIGBJbnB1dEZpbGVgIGluc3RhbmNlIG9yIGEgZmlsZSBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbmFsIG9wdGlvbnNcbiAgICAgKi9cbiAgICBwaG90byhcbiAgICAgICAgbWVkaWE6IHN0cmluZyB8IElucHV0RmlsZSxcbiAgICAgICAgb3B0aW9uczogSW5wdXRNZWRpYU9wdGlvbnM8SW5wdXRNZWRpYVBob3RvPiA9IHt9LFxuICAgICk6IElucHV0TWVkaWFQaG90byB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwicGhvdG9cIiwgbWVkaWEsIC4uLm9wdGlvbnMgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgYElucHV0TWVkaWFWaWRlb2Agb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5wdXRtZWRpYXZpZGVvLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIGBJbnB1dEZpbGVgIGluc3RhbmNlIG9yIGEgZmlsZSBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbmFsIG9wdGlvbnNcbiAgICAgKi9cbiAgICB2aWRlbyhcbiAgICAgICAgbWVkaWE6IHN0cmluZyB8IElucHV0RmlsZSxcbiAgICAgICAgb3B0aW9uczogSW5wdXRNZWRpYU9wdGlvbnM8SW5wdXRNZWRpYVZpZGVvPiA9IHt9LFxuICAgICk6IElucHV0TWVkaWFWaWRlbyB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwidmlkZW9cIiwgbWVkaWEsIC4uLm9wdGlvbnMgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgYElucHV0TWVkaWFBbmltYXRpb25gIG9iamVjdCBhcyBzcGVjaWZpZWQgYnlcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2lucHV0bWVkaWFhbmltYXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gYElucHV0RmlsZWAgaW5zdGFuY2Ugb3IgYSBmaWxlIGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBSZW1haW5pbmcgb3B0aW9uYWwgb3B0aW9uc1xuICAgICAqL1xuICAgIGFuaW1hdGlvbihcbiAgICAgICAgbWVkaWE6IHN0cmluZyB8IElucHV0RmlsZSxcbiAgICAgICAgb3B0aW9uczogSW5wdXRNZWRpYU9wdGlvbnM8SW5wdXRNZWRpYUFuaW1hdGlvbj4gPSB7fSxcbiAgICApOiBJbnB1dE1lZGlhQW5pbWF0aW9uIHtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJhbmltYXRpb25cIiwgbWVkaWEsIC4uLm9wdGlvbnMgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgYElucHV0TWVkaWFBdWRpb2Agb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5wdXRtZWRpYWF1ZGlvLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIGBJbnB1dEZpbGVgIGluc3RhbmNlIG9yIGEgZmlsZSBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbmFsIG9wdGlvbnNcbiAgICAgKi9cbiAgICBhdWRpbyhcbiAgICAgICAgbWVkaWE6IHN0cmluZyB8IElucHV0RmlsZSxcbiAgICAgICAgb3B0aW9uczogSW5wdXRNZWRpYU9wdGlvbnM8SW5wdXRNZWRpYUF1ZGlvPiA9IHt9LFxuICAgICk6IElucHV0TWVkaWFBdWRpbyB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiYXVkaW9cIiwgbWVkaWEsIC4uLm9wdGlvbnMgfTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgYElucHV0TWVkaWFEb2N1bWVudGAgb2JqZWN0IGFzIHNwZWNpZmllZCBieVxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjaW5wdXRtZWRpYWRvY3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIGBJbnB1dEZpbGVgIGluc3RhbmNlIG9yIGEgZmlsZSBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUmVtYWluaW5nIG9wdGlvbmFsIG9wdGlvbnNcbiAgICAgKi9cbiAgICBkb2N1bWVudChcbiAgICAgICAgbWVkaWE6IHN0cmluZyB8IElucHV0RmlsZSxcbiAgICAgICAgb3B0aW9uczogSW5wdXRNZWRpYU9wdGlvbnM8SW5wdXRNZWRpYURvY3VtZW50PiA9IHt9LFxuICAgICk6IElucHV0TWVkaWFEb2N1bWVudCB7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZG9jdW1lbnRcIiwgbWVkaWEsIC4uLm9wdGlvbnMgfTtcbiAgICB9LFxufTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFXQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQkMsR0FDRCxPQUFPLE1BQU0sb0JBQW9CO0VBQzdCOzs7Ozs7S0FNQyxHQUNELE9BQ0ksS0FBeUIsRUFDekIsVUFBOEMsQ0FBQyxDQUFDO0lBRWhELE9BQU87TUFBRSxNQUFNO01BQVM7TUFBTyxHQUFHLE9BQU87SUFBQztFQUM5QztFQUNBOzs7Ozs7S0FNQyxHQUNELE9BQ0ksS0FBeUIsRUFDekIsVUFBOEMsQ0FBQyxDQUFDO0lBRWhELE9BQU87TUFBRSxNQUFNO01BQVM7TUFBTyxHQUFHLE9BQU87SUFBQztFQUM5QztFQUNBOzs7Ozs7S0FNQyxHQUNELFdBQ0ksS0FBeUIsRUFDekIsVUFBa0QsQ0FBQyxDQUFDO0lBRXBELE9BQU87TUFBRSxNQUFNO01BQWE7TUFBTyxHQUFHLE9BQU87SUFBQztFQUNsRDtFQUNBOzs7Ozs7S0FNQyxHQUNELE9BQ0ksS0FBeUIsRUFDekIsVUFBOEMsQ0FBQyxDQUFDO0lBRWhELE9BQU87TUFBRSxNQUFNO01BQVM7TUFBTyxHQUFHLE9BQU87SUFBQztFQUM5QztFQUNBOzs7Ozs7S0FNQyxHQUNELFVBQ0ksS0FBeUIsRUFDekIsVUFBaUQsQ0FBQyxDQUFDO0lBRW5ELE9BQU87TUFBRSxNQUFNO01BQVk7TUFBTyxHQUFHLE9BQU87SUFBQztFQUNqRDtBQUNKLEVBQUUifQ==