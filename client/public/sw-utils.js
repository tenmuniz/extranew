// PWA install prompt
window.addEventListener('DOMContentLoaded', () => {
  let deferredPrompt;
  const pwaInstallPrompt = document.getElementById('pwa-install-prompt');
  const installButton = document.getElementById('install-pwa');
  const dismissButton = document.getElementById('dismiss-pwa');

  // Check if prompt exists (might not be rendered yet)
  if (!pwaInstallPrompt || !installButton || !dismissButton) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show the install prompt
    pwaInstallPrompt.classList.remove('hidden');
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, discard it
    deferredPrompt = null;
    // Hide the install prompt
    pwaInstallPrompt.classList.add('hidden');
  });

  dismissButton.addEventListener('click', () => {
    // Hide the install prompt
    pwaInstallPrompt.classList.add('hidden');
  });
});