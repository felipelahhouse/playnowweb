// 🔄 VERSION CONTROL - Atualiza automaticamente quando há nova versão
// Gera timestamp no build para forçar refresh apenas quando necessário

export const APP_VERSION = '__BUILD_TIME__';
export const APP_NAME = 'PlayNow Emulator';

// Verifica se há nova versão disponível e recarrega automaticamente
export async function checkForUpdates(): Promise<boolean> {
  try {
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    const currentVersion = localStorage.getItem('app_version');
    
    if (currentVersion && currentVersion !== data.version) {
      console.log('🔄 Nova versão detectada! Atualizando...');
      // Salva nova versão
      localStorage.setItem('app_version', data.version);
      // Recarrega automaticamente após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return true;
    }
    
    // Salva versão atual se ainda não existe
    if (!currentVersion) {
      localStorage.setItem('app_version', data.version);
    }
    
    return false;
  } catch (error) {
    console.warn('[VERSION] Não foi possível verificar atualizações:', error);
    return false;
  }
}

// Mostra notificação amigável quando há atualização
export function showUpdateNotification(): void {
  // Cria notificação elegante
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 z-[9999] bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-6 py-4 rounded-xl shadow-2xl shadow-cyan-500/50 flex items-center gap-4 animate-slide-up';
  notification.innerHTML = `
    <div>
      <p class="font-bold">🎉 Nova Versão Disponível!</p>
      <p class="text-sm opacity-90">Clique para atualizar e ver as novidades</p>
    </div>
    <button class="bg-white text-cyan-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-all">
      Atualizar
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // Ao clicar, recarrega a página APENAS UMA VEZ
  notification.querySelector('button')?.addEventListener('click', () => {
    localStorage.setItem('force_reload', 'true');
    window.location.reload();
  });
  
  // Auto-remove após 30 segundos se usuário não clicar
  setTimeout(() => {
    notification.remove();
  }, 30000);
}

// Inicializa verificação automática a cada 30 segundos
export function initVersionCheck(): void {
  // Verifica imediatamente ao carregar
  checkForUpdates();
  
  // Verifica a cada 30 segundos
  setInterval(() => {
    checkForUpdates();
  }, 30000);
}