// 🔄 AUTO-RELOAD - Versão simplificada SEM Service Worker
// Apenas verificação de versão via polling

(function() {
  'use strict';

  console.log('[AUTO-RELOAD] ✅ Sistema de verificação de versão ativo (sem SW)');

  let currentVersion = null;
  let checking = false;

  async function checkVersion() {
    if (checking) return;
    checking = true;

    try {
      const response = await fetch('/version.json?t=' + Date.now());
      const data = await response.json();
      
      if (currentVersion === null) {
        currentVersion = data.version;
        console.log('[AUTO-RELOAD] 📌 Versão atual:', currentVersion);
      } else if (data.version !== currentVersion) {
        console.log('[AUTO-RELOAD] 🆕 Nova versão detectada!', data.version);
        showUpdateBanner(data.version);
        currentVersion = data.version;
      }
    } catch (error) {
      console.error('[AUTO-RELOAD] ❌ Erro ao verificar versão:', error);
    } finally {
      checking = false;
    }
  }

  function showUpdateBanner(newVersion) {
    // Remove banner antigo se existir
    const oldBanner = document.getElementById('update-banner');
    if (oldBanner) oldBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      text-align: center;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
          <div style="text-align: left;">
            <div style="font-weight: 600; font-size: 15px;">Nova versão disponível! 🎉</div>
            <div style="font-size: 13px; opacity: 0.9;">Atualizando em <span id="countdown">5</span> segundos...</div>
          </div>
        </div>
        <button id="update-btn" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          Atualizar Agora
        </button>
        <button id="close-banner" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Cancelar
        </button>
      </div>
    `;

    // Adiciona animação
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
      #update-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      #close-banner:hover {
        background: rgba(255,255,255,0.1);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);

    // Countdown automático para reload
    let countdown = 5;
    let autoReloadTimer = null;
    const countdownEl = document.getElementById('countdown');
    
    const startCountdown = () => {
      autoReloadTimer = setInterval(() => {
        countdown--;
        if (countdownEl) countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(autoReloadTimer);
          console.log('[AUTO-RELOAD] 🔄 Recarregando automaticamente...');
          // Limpa cache e recarrega
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => caches.delete(name));
            });
          }
          window.location.reload(true);
        }
      }, 1000);
    };

    // Inicia countdown após 1 segundo
    setTimeout(startCountdown, 1000);

    // Botão Atualizar Agora
    document.getElementById('update-btn').onclick = () => {
      if (autoReloadTimer) clearInterval(autoReloadTimer);
      console.log('[AUTO-RELOAD] 🔄 Recarregando página...');
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      window.location.reload(true);
    };

    // Botão Cancelar
    document.getElementById('close-banner').onclick = () => {
      if (autoReloadTimer) clearInterval(autoReloadTimer);
      banner.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => banner.remove(), 300);
      console.log('[AUTO-RELOAD] ⏸️ Atualização automática cancelada pelo usuário');
    };
  }

  // Verificar versão a cada 30 segundos
  checkVersion(); // Primeira verificação
  setInterval(checkVersion, 30000);

  console.log('[AUTO-RELOAD] 🔍 Verificando atualizações a cada 30 segundos');

})();
