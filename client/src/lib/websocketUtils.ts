/**
 * Utilitários para conexões HTTP/API que funcionam tanto em desenvolvimento quanto em produção.
 * 
 * Nota: Substituímos os WebSockets por conexões HTTP diretas 
 * para simplificar a arquitetura e evitar problemas de compatibilidade.
 */

// Função para determinar a URL base da API
export function getApiBaseUrl(): string {
  // Em produção, a URL base é relativa ao host atual
  // Em desenvolvimento, a API está servida pelo mesmo servidor Vite
  return '';
}

// Função para obter URL completa para um endpoint da API
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Garantir que o endpoint comece com / caso não esteja já formatado
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
}

// Funções legadas para manter compatibilidade com código existente
// Remover em versões futuras
export function getWebSocketUrl(path: string): string {
  console.warn('WebSockets não estão mais sendo utilizados. Considere atualizar o código.');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

export function createWebSocket(path: string): WebSocket {
  console.warn('WebSockets não estão mais sendo utilizados. Considere atualizar o código.');
  const url = getWebSocketUrl(path);
  return new WebSocket(url);
}