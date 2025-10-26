/**
 * Серверная версия бинарного протокола
 */

import { pack, unpack } from 'msgpackr';

// Типы сообщений (1 байт)
export enum MessageType {
  YJS_SYNC_REQUEST = 1,
  YJS_SYNC = 2,
  YJS_UPDATE = 3,
  AWARENESS_UPDATE = 4,
  CURSOR_UPDATE = 5,
  CURSOR_REMOVE = 6,
  NOTE_SAVED = 7,
  JOIN_ROOM = 8,
  LEAVE_ROOM = 9,
  ERROR = 255
}

export interface BinaryMessage {
  type: MessageType;
  roomId: string;
  data?: any;
}

/**
 * Кодирование сообщения в бинарный формат
 */
export function encodeBinaryMessage(
  type: MessageType,
  roomId: string,
  data?: any,
  binaryPayload?: Uint8Array
): Buffer {
  // Метаданные (без бинарных данных - они будут в payload)
  const metadata = {
    roomId,
    ...(data && typeof data === 'object' ? data : {})
  };
  
  const metadataBytes = pack(metadata);
  const metadataLength = metadataBytes.byteLength;
  
  // Бинарный payload
  const payload = binaryPayload;
  const payloadLength = payload ? payload.byteLength : 0;
  
  // Общий размер
  const totalLength = 1 + 4 + metadataLength + payloadLength;
  const buffer = Buffer.allocUnsafe(totalLength);
  
  // Записываем тип сообщения (1 байт)
  buffer.writeUInt8(type, 0);
  
  // Записываем длину метаданных (4 байта, big-endian)
  buffer.writeUInt32BE(metadataLength, 1);
  
  // Записываем метаданные
  buffer.set(metadataBytes, 5);
  
  // Записываем payload (если есть)
  if (payload) {
    buffer.set(payload, 5 + metadataLength);
  }
  
  return buffer;
}

/**
 * Декодирование бинарного сообщения
 */
export function decodeBinaryMessage(buffer: Buffer): BinaryMessage {
  // Читаем тип сообщения (1 байт)
  const type = buffer.readUInt8(0) as MessageType;
  
  // Читаем длину метаданных (4 байта)
  const metadataLength = buffer.readUInt32BE(1);
  
  // Читаем метаданные
  const metadataBytes = buffer.slice(5, 5 + metadataLength);
  const metadata = unpack(metadataBytes);
  
  // Читаем payload (если есть)
  const payloadStart = 5 + metadataLength;
  const payload = payloadStart < buffer.length 
    ? buffer.slice(payloadStart) 
    : null;
  
  return {
    type,
    roomId: metadata.roomId,
    data: {
      ...metadata,
      // Конвертируем Buffer в массив чисел для совместимости с обработчиками
      ...(payload ? { update: Array.from(payload) } : {})
    }
  };
}

/**
 * Проверка, является ли сообщение бинарным
 * Бинарное сообщение должно:
 * 1. Быть Buffer
 * 2. Иметь минимум 5 байт (1 байт тип + 4 байта длина метаданных)
 * 3. Первый байт должен быть валидным типом сообщения (1-255)
 */
export function isBinaryMessage(data: any): boolean {
  if (!Buffer.isBuffer(data)) {
    return false;
  }
  
  // Минимальный размер бинарного сообщения: 1 (type) + 4 (metadata length)
  if (data.length < 5) {
    return false;
  }
  
  // Проверяем, что первый байт - валидный тип (не ASCII символ)
  const firstByte = data.readUInt8(0);
  
  // ASCII символы '{' и '[' (начало JSON) имеют коды 123 и 91
  // Наши типы сообщений: 1-9, 255
  // Если это JSON, первый байт будет ASCII символом (обычно 123 = '{')
  if (firstByte === 123 || firstByte === 91) {
    return false;
  }
  
  // Проверяем, что это валидный тип сообщения из нашего протокола
  const validTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 255];
  return validTypes.includes(firstByte);
}

/**
 * Конвертация JSON в бинарный формат
 */
export function convertJsonToBinary(jsonMessage: any): Buffer {
  const typeMap: Record<string, MessageType> = {
    'yjs_sync_request': MessageType.YJS_SYNC_REQUEST,
    'yjs_sync': MessageType.YJS_SYNC,
    'yjs_update': MessageType.YJS_UPDATE,
    'awareness_update': MessageType.AWARENESS_UPDATE,
    'cursor_update': MessageType.CURSOR_UPDATE,
    'cursor_remove': MessageType.CURSOR_REMOVE,
    'note_saved': MessageType.NOTE_SAVED,
    'join_room': MessageType.JOIN_ROOM,
    'leave_room': MessageType.LEAVE_ROOM,
    'error': MessageType.ERROR
  };
  
  const type = typeMap[jsonMessage.type] || MessageType.ERROR;
  const roomId = jsonMessage.room_id || '';
  
  // Конвертируем update из массива в Uint8Array (если есть)
  let binaryPayload: Uint8Array | undefined;
  let metadata = jsonMessage.data;
  
  if (jsonMessage.data?.update && Array.isArray(jsonMessage.data.update)) {
    binaryPayload = new Uint8Array(jsonMessage.data.update);
    
    // Исключаем update из метаданных (он будет в binaryPayload)
    const { update, ...restData } = jsonMessage.data;
    metadata = restData;
  }
  
  return encodeBinaryMessage(type, roomId, metadata, binaryPayload);
}

/**
 * Конвертация бинарного в JSON формат
 */
export function convertBinaryToJson(binaryMsg: BinaryMessage): any {
  const typeMap: Record<MessageType, string> = {
    [MessageType.YJS_SYNC_REQUEST]: 'yjs_sync_request',
    [MessageType.YJS_SYNC]: 'yjs_sync',
    [MessageType.YJS_UPDATE]: 'yjs_update',
    [MessageType.AWARENESS_UPDATE]: 'awareness_update',
    [MessageType.CURSOR_UPDATE]: 'cursor_update',
    [MessageType.CURSOR_REMOVE]: 'cursor_remove',
    [MessageType.NOTE_SAVED]: 'note_saved',
    [MessageType.JOIN_ROOM]: 'join_room',
    [MessageType.LEAVE_ROOM]: 'leave_room',
    [MessageType.ERROR]: 'error'
  };
  
  return {
    type: typeMap[binaryMsg.type],
    room_id: binaryMsg.roomId,
    data: binaryMsg.data
  };
}

