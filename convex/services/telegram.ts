// Telegram Bot API — вторая дверь той же очереди публикации. Чистый сервис
// без Convex ctx: собрать тело запроса, разобрать ответ, сложить ссылку на
// пост. Ролик уходит методом sendVideo, картинка — sendPhoto; файл Telegram
// выкачивает сам по публичному адресу из хранилища Convex.
// Канон зоны — docs/publish.md.

const API = "https://api.telegram.org";
const TIMEOUT_MS = 30_000;

/** Подпись под медиа у Telegram ограничена 1024 символами. */
export const CAPTION_LIMIT = 1024;

/** Что публикуем: вертикальный ролик или одиночная картинка. */
export type TelegramKind = "REELS" | "IMAGE";

export type TelegramInput = {
  /** Куда: @username публичного канала или числовой id чата. */
  chatId: string;
  /** Публичный адрес файла: Telegram выкачивает его сам. */
  fileUrl: string;
  /** По умолчанию ролик. */
  mediaType?: TelegramKind;
  caption?: string;
};

export type TelegramRequest = {
  method: "sendVideo" | "sendPhoto";
  fields: Record<string, string>;
};

/** Подпись длиннее лимита Telegram обрезается, а не роняет публикацию. */
export function trimCaption(caption: string): string {
  if (caption.length <= CAPTION_LIMIT) return caption;
  return `${caption.slice(0, CAPTION_LIMIT - 1)}…`;
}

/**
 * Метод и поля запроса. Ролик едет как sendVideo с supports_streaming, чтобы
 * канал показывал его встроенным плеером; картинка — как sendPhoto.
 */
export function sendFields(input: TelegramInput): TelegramRequest {
  const fields: Record<string, string> = { chat_id: input.chatId };
  const method = input.mediaType === "IMAGE" ? "sendPhoto" : "sendVideo";
  if (method === "sendPhoto") {
    fields.photo = input.fileUrl;
  } else {
    fields.video = input.fileUrl;
    fields.supports_streaming = "true";
  }
  if (input.caption) fields.caption = trimCaption(input.caption);
  return { method, fields };
}

/** Человекочитаемая ошибка Bot API: описание с кодом, иначе голый HTTP. */
export function telegramError(json: Record<string, unknown>, status: number): string {
  const description = json?.description;
  if (typeof description === "string" && description) {
    const code = typeof json?.error_code === "number" ? json.error_code : status;
    return `Telegram API ${code}: ${description}`;
  }
  return `Telegram API HTTP ${status}`;
}

/**
 * Ссылка на пост. У публичного канала она складывается из имени и номера
 * сообщения; у приватного чата публичной ссылки нет вовсе.
 */
export function permalinkOf(
  chat: { username?: string | null } | undefined,
  messageId: number,
): string | null {
  const username = chat?.username?.replace(/^@/, "").trim();
  if (!username) return null;
  return `https://t.me/${username}/${messageId}`;
}

export type TelegramPosted = { messageId: string; permalink: string | null };

/** Разбор ответа Bot API: номер сообщения и ссылка на него. */
export function parseSendResult(json: Record<string, unknown>): TelegramPosted {
  if (json?.ok !== true) throw new Error(telegramError(json, 200));
  const result = json.result as
    { message_id?: number; chat?: { username?: string | null } } | undefined;
  const messageId = result?.message_id;
  if (typeof messageId !== "number") throw new Error("Telegram: ответ без message_id");
  return { messageId: String(messageId), permalink: permalinkOf(result?.chat, messageId) };
}

/** Токен не должен попасть ни в текст ошибки, ни в строку очереди. */
export function withoutToken(message: string, token: string): string {
  if (!token) return message;
  return message.split(token).join("<токен>");
}

/**
 * Опубликовать материал в канал. Один запрос: Telegram сам скачивает файл по
 * адресу и отвечает номером сообщения. Вызывается крон-воркером.
 */
export async function sendMedia(token: string, input: TelegramInput): Promise<TelegramPosted> {
  const { method, fields } = sendFields(input);
  try {
    const response = await fetch(`${API}/bot${token}/${method}`, {
      method: "POST",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error(telegramError(json, response.status));
    return parseSendResult(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(withoutToken(message, token));
  }
}
