/**
 * Оптимизированный бинарный протокол для WebSocket
 * Использует MessagePack для метаданных и прямую передачу Uint8Array для Yjs updates
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
 * Формат: [type:1byte][metadata_length:4bytes][metadata:msgpack][payload:binary]
 */
export function encodeBinaryMessage(
  type: MessageType,
  roomId: string,
  data?: any,
  binaryPayload?: Uint8Array
): Uint8Array {
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
  
  // Общий размер: 1 (type) + 4 (metadata length) + metadata + payload
  const totalLength = 1 + 4 + metadataLength + payloadLength;
  const buffer = new Uint8Array(totalLength);
  const view = new DataView(buffer.buffer);
  
  // Записываем тип сообщения (1 байт)
  view.setUint8(0, type);
  
  // Записываем длину метаданных (4 байта, big-endian)
  view.setUint32(1, metadataLength, false);
  
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
export function decodeBinaryMessage(buffer: ArrayBuffer | Uint8Array): BinaryMessage {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  
  // Читаем тип сообщения (1 байт)
  const type = view.getUint8(0) as MessageType;
  
  // Читаем длину метаданных (4 байта)
  const metadataLength = view.getUint32(1, false);
  
  // Читаем метаданные
  const metadataBytes = bytes.slice(5, 5 + metadataLength);
  const metadata = unpack(metadataBytes);
  
  // Читаем payload (если есть)
  const payloadStart = 5 + metadataLength;
  const payload = payloadStart < bytes.length 
    ? bytes.slice(payloadStart) 
    : null;
  
  return {
    type,
    roomId: metadata.roomId,
    data: {
      ...metadata,
      ...(payload ? { update: payload } : {})
    }
  };
}

/**
 * Проверка, является ли сообщение бинарным
 */
export function isBinaryMessage(data: any): boolean {
  return data instanceof ArrayBuffer || data instanceof Uint8Array;
}

/**
 * Конвертация старого JSON формата в новый бинарный (для совместимости)
 */
export function convertJsonToBinary(jsonMessage: any): Uint8Array {
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

