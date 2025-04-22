// Service Worker para aplicação offline e PWA - Sistema de Escalas 20ª CIPM

// Nome e versão do cache
const CACHE_NAME = 'escalas-20cipm-v1';

// Arquivos para armazenar em cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png'
];

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Forçar a ativação imediata sem esperar o recarregamento da página
  self.skipWaiting();
  
  // Pre-cachear os arquivos estáticos
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Armazenando arquivos em cache');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  
  // Definir este service worker como o ativo para todos os clientes
  event.waitUntil(clients.claim());
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições para o API
  if (event.request.url.includes('/api/')) {
    // Para requisições à API, deixar o cliente lidar (usando IndexedDB)
    return;
  }
  
  // Para recursos estáticos, usar estratégia "Cache First, Network Fallback"
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Recurso encontrado no cache
          return cachedResponse;
        }
        
        // Recurso não encontrado no cache, buscar da rede
        return fetch(event.request)
          .then((networkResponse) => {
            // Verificar se a resposta é válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clonar a resposta para armazenar no cache
            const responseToCache = networkResponse.clone();
            
            // Armazenar em cache para uso futuro
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Erro de fetch:', error);
            
            // Se não conseguir buscar da rede e for a página principal,
            // retornar a página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Caso contrário, propagar o erro
            throw error;
          });
      })
  );
});

// Sincronizar dados quando ficar online novamente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    console.log('[Service Worker] Sincronizando alterações pendentes');
    // A sincronização real é feita pelo cliente via IndexedDB
  }
});

// Receber mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});