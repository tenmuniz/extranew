/**
 * Utilitários para criar conexões WebSocket que funcionam tanto em desenvolvimento quanto em produção
 */

// Função para determinar o URL correto do WebSocket baseado no ambiente
export function getWebSocketUrl(path: string): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Em produção, usar o hostname atual para construir a URL relativa
  if (isProduction) {
    return `${protocol}//${window.location.host}${path}`;
  }
  
  // Em desenvolvimento, usar localhost
  return `ws://localhost${path}`;
}

// Função para criar um WebSocket que funcione em todos os ambientes
export function createWebSocket(path: string): WebSocket {
  const url = getWebSocketUrl(path);
  console.log(`Criando WebSocket com URL: ${url}`);
  return new WebSocket(url);
}