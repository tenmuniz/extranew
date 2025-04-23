import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Cria uma instância do QueryClient
const qClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Atualiza ao focar na janela
      staleTime: 5000, // Diminuir o tempo para considerar os dados desatualizados
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Função para atualizar o estado entre abas usando localStorage
function synchronizeTabs() {
  // Quando o usuário altera uma atribuição, marca para outras abas que devem atualizar
  localStorage.setItem('lastUpdate', Date.now().toString());
}

// Event listener para o storage event (detecta mudanças entre abas)
window.addEventListener('storage', (event) => {
  if (event.key === 'lastUpdate') {
    // Sempre que outra aba modificar o sistema, invalidar queries
    qClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    qClient.invalidateQueries({ queryKey: ['/api/personnel'] });
  }
});

// Quando modificamos algo, notifica as outras abas
const originalInvalidateQueries = qClient.invalidateQueries.bind(qClient);
qClient.invalidateQueries = function(...args: any[]) {
  const result = originalInvalidateQueries(...args);
  // Notifica outras abas sobre a alteração
  synchronizeTabs();
  return result;
};

export const queryClient = qClient;
