// Script para detectar e prompt de instalação PWA

// Variáveis para controlar o estado da instalação PWA
let deferredPrompt;
let installPromptShown = false;

// Detectar quando o browser pode instalar o PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // Previne que o navegador mostre automaticamente o prompt
  e.preventDefault();
  // Armazena o evento para uso posterior
  deferredPrompt = e;
  
  // Após carregar o aplicativo completamente, mostrar nosso próprio prompt
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!installPromptShown) {
        showInstallPrompt();
      }
    }, 3000); // Delay de 3 segundos para mostrar o prompt
  });
});

// Função para mostrar nosso próprio prompt de instalação PWA
function showInstallPrompt() {
  if (!deferredPrompt) return;
  
  const promptElement = document.getElementById('pwa-install-prompt');
  if (!promptElement) return;
  
  // Mostrar nosso elemento de prompt personalizado
  promptElement.classList.remove('hidden');
  installPromptShown = true;
  
  // Configurar o botão de instalação
  const installButton = document.getElementById('install-pwa');
  if (installButton) {
    installButton.addEventListener('click', async () => {
      // Esconder nosso prompt
      promptElement.classList.add('hidden');
      
      // Mostrar o prompt nativo de instalação
      deferredPrompt.prompt();
      
      // Esperar pela resposta do usuário
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Usuário ${outcome === 'accepted' ? 'aceitou' : 'recusou'} a instalação`);
      
      // Limpar a referência
      deferredPrompt = null;
    });
  }
  
  // Configurar o botão de "Não agora"
  const dismissButton = document.getElementById('dismiss-pwa');
  if (dismissButton) {
    dismissButton.addEventListener('click', () => {
      promptElement.classList.add('hidden');
    });
  }
}

// Ouvir o evento appinstalled para registrar instalações bem-sucedidas
window.addEventListener('appinstalled', () => {
  console.log('PWA instalado com sucesso!');
  
  // Esconder o prompt se estiver visível
  const promptElement = document.getElementById('pwa-install-prompt');
  if (promptElement) {
    promptElement.classList.add('hidden');
  }
  
  // Limpar a referência
  deferredPrompt = null;
});