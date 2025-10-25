// Singleton для WebSocket Manager
// Используется для доступа к WebSocket из API endpoints
import type { WebSocketManager } from '../../server/websocket/index.js';

let wsManagerInstance: WebSocketManager | null = null;

export function setWebSocketManager(manager: WebSocketManager): void {
  wsManagerInstance = manager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManagerInstance;
}

export function hasWebSocketManager(): boolean {
  return wsManagerInstance !== null;
}

