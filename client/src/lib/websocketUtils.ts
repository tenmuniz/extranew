/**
 * Utilitários para trabalhar com WebSockets
 */

/**
 * Obtém a URL base da API
 */
export function getApiBaseUrl(): string {
  return window.location.origin;
}

/**
 * Constrói uma URL completa da API
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
}

/**
 * Constrói a URL do WebSocket com base no ambiente atual
 */
export function getWebSocketUrl(path: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
}

/**
 * Cria uma nova conexão WebSocket
 */
export function createWebSocket(path: string): WebSocket {
  const wsUrl = getWebSocketUrl(path);
  return new WebSocket(wsUrl);
}