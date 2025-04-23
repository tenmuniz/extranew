// This Service Worker file is designed to provide offline functionality 
// for the Escala PM application by caching critical assets.

const CACHE_NAME = 'escala-pm-cache-v1';

// Lista de arquivos para cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/pwa-icon.svg',
  '/sw-utils.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Removendo cache antigo', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim())
  );
});

// Estratégia de cache: network first, falling back to cache
self.addEventListener('fetch', (event) => {
  // Para requisições de API, sempre vamos para a rede
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.log('Falha ao buscar:', error);
          // Se estiver offline, tenta entregar um fallback para APIs
          return new Response(JSON.stringify({ 
            offline: true, 
            message: 'Você está offline. Tente novamente quando estiver conectado.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Para assets estáticos, tenta a rede primeiro, depois o cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se tiver uma resposta válida, armazena no cache e retorna
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se a rede falhar, tenta entregar do cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Se não tiver no cache e não conseguir da rede, verifica
            // se é uma requisição para uma página HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              // Retorna a página index.html para navegação offline
              return caches.match('/');
            }
            
            // Caso contrário, não temos um fallback
            return new Response('Você está offline e este conteúdo não está armazenado para uso offline.', {
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});