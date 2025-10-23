// 🎮 EXEMPLO DE USO - Sistema de Live Stream Melhorado
// Este arquivo mostra como usar as novas funcionalidades implementadas

import React, { useState } from 'react';
import StreamSetupModal, { StreamConfig } from './src/components/Streaming/StreamSetupModal';

// ============================================
// EXEMPLO 1: Uso Básico do Modal
// ============================================

function ExemploBasico() {
  const [showModal, setShowModal] = useState(false);

  const handleStartStream = (config: StreamConfig) => {
    console.log('Stream iniciada com configurações:', config);
    // Aqui você implementaria a lógica para iniciar a stream
    setShowModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Iniciar Live Stream
      </button>

      {showModal && (
        <StreamSetupModal
          gameTitle="Super Mario World"
          onStartStream={handleStartStream}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 2: Configuração Pré-definida
// ============================================

function ExemploComPreset() {
  const [showModal, setShowModal] = useState(false);

  const handleStartStream = (config: StreamConfig) => {
    // Verificar qual modo de stream foi escolhido
    switch (config.streamMode) {
      case 'direct':
        console.log('Stream direta iniciada');
        console.log('FPS:', config.fps);
        console.log('Qualidade:', config.quality);
        break;

      case 'obs':
        console.log('Stream via OBS configurada');
        console.log('Servidor:', config.obsServerUrl);
        console.log('Stream Key:', config.obsStreamKey);
        // Aqui você enviaria essas informações para o backend
        break;

      case 'twitch':
        console.log('Stream na Twitch configurada');
        console.log('Canal:', config.twitchChannel);
        console.log('Stream Key:', config.twitchStreamKey);
        // Aqui você iniciaria a integração com Twitch
        break;
    }

    // Configurações avançadas
    console.log('Bitrate:', config.bitrate);
    console.log('Bitrate de Áudio:', config.audioBitrate);
    console.log('Baixa Latência:', config.enableLowLatency);
    console.log('Bitrate Adaptativo:', config.enableAdaptiveBitrate);

    // Configurações de privacidade
    console.log('Chat Habilitado:', config.chatEnabled);
    console.log('Moderação:', config.chatModeration);
    console.log('Máx. Viewers:', config.maxViewers);
    console.log('Restrição de Idade:', config.ageRestriction);

    setShowModal(false);
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Configurar Stream Avançada
      </button>

      {showModal && (
        <StreamSetupModal
          gameTitle="The Legend of Zelda"
          onStartStream={handleStartStream}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 3: Integração com Backend (OBS)
// ============================================

async function iniciarStreamOBS(config: StreamConfig) {
  try {
    // 1. Criar registro da stream no Firebase
    const streamData = {
      title: config.title,
      streamMode: 'obs',
      obsServerUrl: config.obsServerUrl,
      obsStreamKey: config.obsStreamKey,
      bitrate: config.bitrate,
      fps: config.fps,
      quality: config.quality,
      startedAt: new Date(),
      isLive: true
    };

    // 2. Salvar no Firestore
    // const streamRef = await addDoc(collection(db, 'live_streams'), streamData);

    // 3. Configurar servidor RTMP para receber stream do OBS
    // Isso seria feito no backend (Node.js/Firebase Functions)
    /*
    const rtmpServer = {
      url: config.obsServerUrl,
      key: config.obsStreamKey,
      streamId: streamRef.id
    };
    */

    // 4. Retornar informações para o usuário
    return {
      success: true,
      message: 'Configure o OBS com as informações fornecidas',
      serverUrl: config.obsServerUrl,
      streamKey: config.obsStreamKey
    };

  } catch (error) {
    console.error('Erro ao iniciar stream OBS:', error);
    return {
      success: false,
      message: 'Erro ao configurar stream'
    };
  }
}

// ============================================
// EXEMPLO 4: Integração com Twitch
// ============================================

async function iniciarStreamTwitch(config: StreamConfig) {
  try {
    // 1. Validar Stream Key da Twitch
    if (!config.twitchStreamKey || !config.twitchChannel) {
      throw new Error('Stream Key ou Canal da Twitch não fornecidos');
    }

    // 2. Configurar stream para Twitch
    const twitchConfig = {
      channel: config.twitchChannel,
      streamKey: config.twitchStreamKey,
      title: config.title,
      // Servidor Twitch baseado na região
      ingestServer: 'rtmp://live.twitch.tv/app/',
      // Configurações de vídeo
      videoSettings: {
        bitrate: config.bitrate,
        fps: config.fps,
        resolution: config.quality === 'high' ? '1920x1080' : 
                   config.quality === 'medium' ? '1280x720' : '854x480'
      },
      // Configurações de áudio
      audioSettings: {
        bitrate: config.audioBitrate,
        sampleRate: config.audioSampleRate
      }
    };

    // 3. Iniciar transmissão para Twitch
    // Isso seria feito através de uma API ou serviço de streaming
    /*
    const response = await fetch('/api/twitch/start-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(twitchConfig)
    });
    */

    // 4. Retornar sucesso
    return {
      success: true,
      message: 'Stream iniciada na Twitch!',
      channelUrl: `https://twitch.tv/${config.twitchChannel}`
    };

  } catch (error) {
    console.error('Erro ao iniciar stream Twitch:', error);
    return {
      success: false,
      message: 'Erro ao conectar com Twitch'
    };
  }
}

// ============================================
// EXEMPLO 5: Aplicar Presets de Qualidade
// ============================================

function aplicarPresetQualidade(preset: 'low' | 'medium' | 'high'): Partial<StreamConfig> {
  const presets = {
    low: {
      bitrate: 1500,
      fps: 10,
      quality: 'low' as const,
      audioBitrate: 96,
      enableAdaptiveBitrate: true,
      enableLowLatency: false
    },
    medium: {
      bitrate: 2500,
      fps: 15,
      quality: 'medium' as const,
      audioBitrate: 128,
      enableAdaptiveBitrate: true,
      enableLowLatency: false
    },
    high: {
      bitrate: 6000,
      fps: 30,
      quality: 'high' as const,
      audioBitrate: 192,
      enableAdaptiveBitrate: false,
      enableLowLatency: true
    }
  };

  return presets[preset];
}

// ============================================
// EXEMPLO 6: Validação de Configurações
// ============================================

function validarConfiguracao(config: StreamConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar título
  if (!config.title || config.title.trim().length === 0) {
    errors.push('Título da stream é obrigatório');
  }

  // Validar bitrate
  if (config.bitrate < 500 || config.bitrate > 10000) {
    errors.push('Bitrate deve estar entre 500 e 10000 kbps');
  }

  // Validar FPS
  if (config.fps < 5 || config.fps > 60) {
    errors.push('FPS deve estar entre 5 e 60');
  }

  // Validar configurações OBS
  if (config.streamMode === 'obs') {
    if (!config.obsServerUrl) {
      errors.push('URL do servidor OBS é obrigatória');
    }
    if (!config.obsStreamKey) {
      errors.push('Stream Key do OBS é obrigatória');
    }
  }

  // Validar configurações Twitch
  if (config.streamMode === 'twitch') {
    if (!config.twitchChannel) {
      errors.push('Canal da Twitch é obrigatório');
    }
    if (!config.twitchStreamKey) {
      errors.push('Stream Key da Twitch é obrigatória');
    }
  }

  // Validar áudio
  if (config.audioBitrate < 64 || config.audioBitrate > 320) {
    errors.push('Bitrate de áudio deve estar entre 64 e 320 kbps');
  }

  // Validar viewers
  if (config.maxViewers < 1 || config.maxViewers > 10000) {
    errors.push('Máximo de viewers deve estar entre 1 e 10000');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// EXEMPLO 7: Uso Completo com Validação
// ============================================

function ExemploCompleto() {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStartStream = async (config: StreamConfig) => {
    // 1. Validar configuração
    const validation = validarConfiguracao(config);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    // 2. Iniciar stream baseado no modo
    let result;
    switch (config.streamMode) {
      case 'obs':
        result = await iniciarStreamOBS(config);
        break;
      case 'twitch':
        result = await iniciarStreamTwitch(config);
        break;
      default:
        // Stream direta
        result = { success: true, message: 'Stream iniciada!' };
    }

    // 3. Mostrar resultado
    if (result.success) {
      setSuccess(result.message);
      setShowModal(false);
    } else {
      setError(result.message);
    }
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Iniciar Live Stream
      </button>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {success}
          <button onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      {showModal && (
        <StreamSetupModal
          gameTitle="Chrono Trigger"
          onStartStream={handleStartStream}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ============================================
// EXEMPLO 8: Monitoramento de Stream
// ============================================

interface StreamStats {
  viewers: number;
  likes: number;
  bitrate: number;
  fps: number;
  duration: number;
}

function monitorarStream(streamId: string): void {
  // Monitorar estatísticas em tempo real
  /*
  const unsubscribe = onSnapshot(
    doc(db, 'live_streams', streamId),
    (doc) => {
      const stats: StreamStats = {
        viewers: doc.data()?.viewerCount || 0,
        likes: doc.data()?.likeCount || 0,
        bitrate: doc.data()?.currentBitrate || 0,
        fps: doc.data()?.currentFps || 0,
        duration: Date.now() - doc.data()?.startedAt?.toMillis() || 0
      };
      
      console.log('Stream Stats:', stats);
      
      // Atualizar UI com estatísticas
      // updateStreamStatsUI(stats);
    }
  );
  */
}

// ============================================
// EXPORTAÇÕES
// ============================================

export {
  ExemploBasico,
  ExemploComPreset,
  ExemploCompleto,
  iniciarStreamOBS,
  iniciarStreamTwitch,
  aplicarPresetQualidade,
  validarConfiguracao,
  monitorarStream
};

// ============================================
// NOTAS DE IMPLEMENTAÇÃO
// ============================================

/*
BACKEND NECESSÁRIO:

1. Servidor RTMP para OBS:
   - Usar nginx-rtmp-module ou Node-Media-Server
   - Configurar endpoints para receber streams
   - Validar Stream Keys

2. API de Integração Twitch:
   - Usar Twitch API v5 ou Helix
   - Implementar OAuth para autenticação
   - Gerenciar tokens de acesso

3. Firebase Functions:
   - Criar stream record no Firestore
   - Validar permissões
   - Gerenciar viewers e chat
   - Implementar moderação automática

4. Storage:
   - Salvar VODs (se permitido)
   - Armazenar thumbnails
   - Gerenciar clips

SEGURANÇA:

1. Nunca expor Stream Keys no frontend
2. Validar todas as entradas no backend
3. Implementar rate limiting
4. Usar HTTPS/WSS para todas as conexões
5. Criptografar dados sensíveis

PERFORMANCE:

1. Usar CDN para distribuição
2. Implementar adaptive bitrate
3. Otimizar encoding settings
4. Monitorar latência
5. Implementar fallback servers
*/