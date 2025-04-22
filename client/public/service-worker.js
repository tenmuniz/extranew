// Service Worker para o sistema de escalas 20ª CIPM
const CACHE_NAME = 'escalas-20cipm-v1';

// Lista de recursos a serem armazenados em cache para uso offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/favicon.ico'
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar o Service Worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache de dados da API
const DATA_CACHE_NAME = 'escalas-20cipm-data-v1';

// Interceptar requisições e servir de cache quando offline
self.addEventListener('fetch', (event) => {
  // Verificar se a solicitação é para a API
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME)
        .then(async (cache) => {
          // Tentar fazer a solicitação de rede
          try {
            const response = await fetch(event.request);
            
            // Se a resposta for boa, cloná-la e armazená-la no cache
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            
            return response;
          } catch (error) {
            // Se não conseguir conectar, tentar obter do cache
            console.log('Falha na rede, buscando do cache:', error);
            const cachedResponse = await cache.match(event.request);
            
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Se não estiver no cache, retornar uma resposta vazia
            return new Response(JSON.stringify({ offline: true, message: "Você está offline. Os dados exibidos podem estar desatualizados." }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        })
    );
  } else {
    // Para outros recursos, usar estratégia "cache primeiro, depois rede"
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Retornar do cache se disponível
          if (response) {
            return response;
          }
          
          // Caso contrário, buscar da rede
          return fetch(event.request)
            .then((response) => {
              // Verificar se recebemos uma resposta válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clonar a resposta (porque será consumida pelo cache e pelo navegador)
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Se falhar e for uma página HTML, retornar página offline
              if (event.request.headers.get('Accept').includes('text/html')) {
                return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Armazenar dados em IndexedDB quando estiver offline
const DB_NAME = 'escalas-20cipm-db';
const DB_VERSION = 1;
const STORE_PERSONNEL = 'personnel';
const STORE_ASSIGNMENTS = 'assignments';
const STORE_PENDING_ACTIONS = 'pending-actions';

// Abrir banco de dados IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Criar stores para dados se não existirem
      if (!db.objectStoreNames.contains(STORE_PERSONNEL)) {
        db.createObjectStore(STORE_PERSONNEL, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_ASSIGNMENTS)) {
        db.createObjectStore(STORE_ASSIGNMENTS, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORE_PENDING_ACTIONS)) {
        db.createObjectStore(STORE_PENDING_ACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
    };
  });
}

// Processar mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_DATA') {
    // Armazenar dados no IndexedDB
    const { personnel, assignments } = event.data.payload;
    
    openDB().then(db => {
      const tx = db.transaction([STORE_PERSONNEL, STORE_ASSIGNMENTS], 'readwrite');
      
      // Limpar e armazenar dados de pessoal
      const personnelStore = tx.objectStore(STORE_PERSONNEL);
      personnelStore.clear();
      personnel.forEach(person => personnelStore.put(person));
      
      // Limpar e armazenar dados de atribuições
      const assignmentsStore = tx.objectStore(STORE_ASSIGNMENTS);
      assignmentsStore.clear();
      assignments.forEach(assignment => assignmentsStore.put(assignment));
      
      tx.oncomplete = () => {
        console.log('Dados sincronizados para uso offline');
      };
      
      tx.onerror = (error) => {
        console.error('Erro ao sincronizar dados:', error);
      };
    });
  }
});

// Sincronizar pendências quando voltar online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges());
  }
});

// Função para sincronizar alterações pendentes
async function syncPendingChanges() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
    const store = tx.objectStore(STORE_PENDING_ACTIONS);
    
    const allPendingActions = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Processar cada ação pendente
    for (const action of allPendingActions) {
      try {
        const { url, method, data, id } = action;
        
        // Enviar solicitação para o servidor
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: method !== 'GET' ? JSON.stringify(data) : undefined
        });
        
        if (response.ok) {
          // Se bem-sucedido, remover ação pendente
          await new Promise((resolve, reject) => {
            const deleteRequest = store.delete(id);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        }
      } catch (error) {
        console.error('Erro ao sincronizar ação pendente:', error);
        // Manter a ação pendente para tentar novamente mais tarde
      }
    }
  } catch (error) {
    console.error('Erro ao sincronizar mudanças pendentes:', error);
  }
}