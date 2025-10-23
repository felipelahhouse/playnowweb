const elements = {
  status: document.getElementById("status"),
  playerName: document.getElementById("playerName"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  roomIdInput: document.getElementById("roomIdInput"),
  roomShare: document.getElementById("roomShare"),
  log: document.getElementById("eventLog"),
  canvas: document.getElementById("gameCanvas"),
  peerHost: document.getElementById("peerHost"),
  peerPort: document.getElementById("peerPort"),
  peerSecure: document.getElementById("peerSecure"),
  peerPath: document.getElementById("peerPath"),
};

const ctx = elements.canvas.getContext("2d");

const SPEED = 180;
const BROADCAST_HZ = 30;
const DEFAULT_PEER_PATH = "/peerjs";
const GAMEPAD_THRESHOLD = 0.3;
const GAMEPAD_POLL_INTERVAL = 16;
const CANVAS_BOUNDS = {
  width: elements.canvas.width,
  height: elements.canvas.height,
  padding: 24,
};

const KEY_BINDINGS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

const GAMEPAD_MAPPING = {
  axes: {
    0: { pos: "right", neg: "left" },
    1: { pos: "down", neg: "up" },
  },
  buttons: {
    12: "up",
    13: "down",
    14: "left",
    15: "right",
  },
};

const defaultPlayer = (color, xFactor = 0.25) => ({
  x: CANVAS_BOUNDS.width * xFactor,
  y: CANVAS_BOUNDS.height * 0.5,
  color,
  name: "",
  size: 24,
});

const createInputState = () => ({ up: false, down: false, left: false, right: false });

const state = {
  role: "idle",
  peer: null,
  connection: null,
  localName: "",
  remoteName: "",
  lastRoomId: "",
  localInput: createInputState(),
  remoteInput: createInputState(),
  peerConfig: null,
  gamepads: {
    enabled: false,
    lastPoll: 0,
    player1Index: null,
    player2Index: null,
  },
  game: {
    players: {
      host: defaultPlayer("#38bdf8", 0.25),
      guest: defaultPlayer("#22d3ee", 0.75),
    },
    running: false,
    lastFrame: performance.now(),
    broadcastTimer: 0,
    rafId: 0,
  },
};

const MessageType = {
  STATE: "state",
  INPUT: "input",
  WELCOME: "welcome",
  INTRO: "intro",
  CHAT: "chat",
};

const MAX_LOG_ITEMS = 80;

const ensureName = () => {
  const fallback = `Player-${Math.floor(Math.random() * 900 + 100)}`;
  const value = elements.playerName.value.trim() || fallback;
  elements.playerName.value = value;
  return value;
};

const setStatus = (text) => {
  elements.status.textContent = text;
};

const logEvent = (message) => {
  const entry = document.createElement("li");
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  elements.log.appendChild(entry);
  while (elements.log.children.length > MAX_LOG_ITEMS) {
    elements.log.removeChild(elements.log.firstChild);
  }
  elements.log.scrollTo({ top: elements.log.scrollHeight, behavior: "smooth" });
};

const resetLog = () => {
  elements.log.innerHTML = "";
};

const setShareId = (id) => {
  elements.roomShare.value = id || "";
  elements.roomShare.classList.toggle("empty", !id);
};

const updateUiState = () => {
  elements.createRoomBtn.disabled = state.role !== "idle";
  elements.joinRoomBtn.disabled = state.role !== "idle";
  elements.roomIdInput.disabled = state.role !== "idle";
  elements.roomShare.disabled = true;
  elements.peerHost.disabled = state.role !== "idle";
  elements.peerPort.disabled = state.role !== "idle";
  elements.peerSecure.disabled = state.role !== "idle";
  elements.peerPath.disabled = state.role !== "idle";
};

const resolvePeerConfig = () => {
  const host = elements.peerHost.value.trim();
  const pathInput = elements.peerPath.value.trim();
  const secure = elements.peerSecure.checked;
  const portInput = elements.peerPort.value.trim();

  const options = { debug: 2 };
  const meta = {
    description: "PeerJS cloud (default)",
    host: "",
    port: null,
    path: "",
    secure: null,
  };

  if (!host) {
    return { options, meta };
  }

  const normalizedPath = pathInput
    ? pathInput.startsWith("/")
      ? pathInput
      : `/${pathInput}`
    : DEFAULT_PEER_PATH;

  let port = Number.parseInt(portInput, 10);
  if (!Number.isFinite(port) || port <= 0) {
    port = secure ? 443 : 80;
  }

  options.host = host;
  options.port = port;
  options.path = normalizedPath;
  options.secure = secure;

  meta.host = host;
  meta.port = port;
  meta.path = normalizedPath;
  meta.secure = secure;
  meta.description = `${secure ? "https" : "http"}://${host}:${port}${normalizedPath}`;

  return { options, meta };
};

const resetGamePositions = () => {
  state.game.players.host = defaultPlayer("#38bdf8", 0.25);
  state.game.players.guest = defaultPlayer("#22d3ee", 0.75);
};

const stopGameLoop = () => {
  state.game.running = false;
  if (state.game.rafId) {
    cancelAnimationFrame(state.game.rafId);
    state.game.rafId = 0;
  }
};

const startGameLoop = () => {
  if (state.game.running) {
    return;
  }
  state.game.running = true;
  state.game.lastFrame = performance.now();
  state.gamepads.lastPoll = performance.now();
  const step = (timestamp) => {
    if (!state.game.running) {
      return;
    }
    const dt = Math.min((timestamp - state.game.lastFrame) / 1000, 0.1);
    state.game.lastFrame = timestamp;

    if (timestamp - state.gamepads.lastPoll >= GAMEPAD_POLL_INTERVAL) {
      pollGamepads();
      state.gamepads.lastPoll = timestamp;
    }

    if (state.role === "host") {
      updateHostSimulation(dt);
      broadcastState(dt);
    }

    renderScene();
    state.game.rafId = requestAnimationFrame(step);
  };
  state.game.rafId = requestAnimationFrame(step);
};

const updateHostSimulation = (dt) => {
  applyInput(state.game.players.host, state.localInput, dt);
  applyInput(state.game.players.guest, state.remoteInput, dt);
};

const applyInput = (player, input, dt) => {
  const horizontal = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vertical = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (!horizontal && !vertical) {
    return;
  }
  const length = Math.hypot(horizontal, vertical) || 1;
  player.x += (horizontal / length) * SPEED * dt;
  player.y += (vertical / length) * SPEED * dt;
  clampToArena(player);
};

const clampToArena = (player) => {
  const { padding, width, height } = CANVAS_BOUNDS;
  player.x = Math.min(Math.max(player.x, padding), width - padding);
  player.y = Math.min(Math.max(player.y, padding), height - padding);
};

const broadcastState = (dt) => {
  if (!state.connection || state.connection.open !== true) {
    return;
  }
  state.game.broadcastTimer += dt;
  if (state.game.broadcastTimer < 1 / BROADCAST_HZ) {
    return;
  }
  state.game.broadcastTimer = 0;
  const snapshot = {
    players: {
      host: { ...state.game.players.host },
      guest: { ...state.game.players.guest },
    },
    timestamp: Date.now(),
  };
  try {
    state.connection.send({ type: MessageType.STATE, payload: snapshot });
  } catch (error) {
    logEvent(`Erro ao enviar estado: ${error.message}`);
  }
};

const renderScene = () => {
  const { width, height } = CANVAS_BOUNDS;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#111827");
  gradient.addColorStop(1, "#1f2937");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 16);
  ctx.lineTo(width / 2, height - 16);
  ctx.stroke();
  ctx.setLineDash([]);

  const hostLabel =
    state.role === "guest" ? state.remoteName || "Host" : state.localName || "Host";
  const guestLabel =
    state.role === "guest" ? state.localName || "Você" : state.remoteName || "Convidado";

  drawPlayer(state.game.players.host, hostLabel);
  drawPlayer(state.game.players.guest, guestLabel);

  ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Modo: ${state.role === "idle" ? "offline" : state.role}`, width / 2, height - 10);
};

const drawPlayer = (player, name) => {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "14px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, player.x, player.y - player.size - 12);
};

const shutdownAll = (reason = "") => {
  if (reason) {
    logEvent(reason);
    setStatus(reason);
  }
  if (state.connection) {
    try {
      state.connection.close();
    } catch (error) {
      logEvent(`Erro ao encerrar conexão: ${error.message}`);
    }
    state.connection = null;
  }
  if (state.peer) {
    try {
      state.peer.destroy();
    } catch (error) {
      logEvent(`Erro ao encerrar peer: ${error.message}`);
    }
    state.peer = null;
  }
  state.role = "idle";
  state.remoteName = "";
  state.lastRoomId = "";
  state.localInput = createInputState();
  state.remoteInput = createInputState();
  state.peerConfig = null;
  stopGameLoop();
  resetGamePositions();
  updateUiState();
  setShareId("");
  renderScene();
};

const handleGuestLeft = (reason = "") => {
  if (reason) {
    logEvent(reason);
  }
  if (state.connection) {
    state.connection = null;
  }
  state.remoteName = "";
  state.remoteInput = createInputState();
  state.game.players.guest = defaultPlayer("#22d3ee", 0.75);
  const awaiting = state.lastRoomId
    ? `Sala ativa (${state.lastRoomId}). Aguardando convidado...`
    : "Aguardando convidado...";
  setStatus(awaiting);
  updateUiState();
  renderScene();
};

const onPeerError = (error) => {
  logEvent(`PeerJS: ${error.type ?? "erro"}`);
  if (error.message) {
    setStatus(`Erro PeerJS: ${error.message}`);
  }
};

const createPeerInstance = (role) => {
  if (!window.Peer) {
    setStatus("PeerJS não foi carregado. Verifique sua conexão.");
    throw new Error("PeerJS indisponível");
  }

  if (state.peer) {
    shutdownAll("Reiniciando sessão anterior...");
  }

  state.role = role;
  updateUiState();

  const { options, meta } = resolvePeerConfig();
  state.peerConfig = meta;
  const peer = new window.Peer(undefined, options);
  if (meta.host) {
    setStatus(`Conectando ao PeerJS em ${meta.description}...`);
  } else {
    setStatus("Conectando ao servidor PeerJS padrão...");
  }
  logEvent(`Config PeerJS: ${meta.description}`);
  peer.on("error", onPeerError);
  peer.on("disconnected", () => {
    shutdownAll("Desconectado do servidor PeerJS.");
  });
  state.peer = peer;

  return peer;
};

const handleCreateRoom = () => {
  resetLog();
  const name = ensureName();
  state.localName = name;
  setStatus("Criando sala P2P...");
  logEvent("Inicializando peer host...");

  try {
    const peer = createPeerInstance("host");
    peer.on("open", (id) => {
      state.lastRoomId = id;
      setShareId(id);
      setStatus(`Sala criada! Compartilhe o ID: ${id}`);
      logEvent(`Peer host pronto. Sala ID: ${id}`);
      startGameLoop();
    });

    peer.on("connection", (conn) => {
      if (state.connection) {
        logEvent("Convidado adicional tentou entrar. Conexão recusada.");
        conn.close();
        return;
      }

      state.connection = conn;
      state.remoteName = conn.metadata?.name || "Convidado";
      logEvent(`Convidado conectado (${state.remoteName}).`);
      updateUiState();
      registerConnectionHandlers(conn);
      conn.on("open", () => {
        setStatus(`Convidado conectado: ${state.remoteName}`);
        logEvent(`Canal P2P pronto com ${state.remoteName}.`);
        sendWelcome();
      });
    });
  } catch (error) {
    logEvent(`Falha ao criar sala: ${error.message}`);
    setStatus("Erro ao criar sala");
  }
};

const handleJoinRoom = () => {
  resetLog();
  const roomId = elements.roomIdInput.value.trim();
  if (!roomId) {
    setStatus("Informe um ID de sala válido.");
    return;
  }

  const name = ensureName();
  state.localName = name;
  setStatus("Conectando ao host...");
  logEvent(`Tentando conectar na sala ${roomId}...`);

  try {
    const peer = createPeerInstance("guest");
    state.lastRoomId = roomId;
    setShareId(roomId);
    peer.on("open", (id) => {
      logEvent(`Peer convidado pronto (${id}).`);
      const conn = peer.connect(roomId, {
        reliable: true,
        metadata: { name },
      });

      conn.on("error", (error) => {
        logEvent(`Erro na conexão: ${error.message}`);
        setStatus("Erro de conexão com host");
      });

      conn.on("open", () => {
        state.connection = conn;
        setStatus("Conectado ao host! Aguarde sincronização...");
        logEvent("Conexão estabelecida com o host.");
        updateUiState();
        registerConnectionHandlers(conn);
        sendIntroduction();
        startGameLoop();
      });
    });
  } catch (error) {
    logEvent(`Falha ao conectar: ${error.message}`);
    setStatus("Erro ao conectar na sala");
  }
};

const sendWelcome = () => {
  if (!state.connection || state.connection.open !== true) {
    return;
  }
  state.connection.send({
    type: MessageType.WELCOME,
    payload: {
      hostName: state.localName,
      roomId: state.lastRoomId,
    },
  });
};

const sendIntroduction = () => {
  if (!state.connection || state.connection.open !== true) {
    return;
  }
  state.connection.send({
    type: MessageType.INTRO,
    payload: {
      guestName: state.localName,
    },
  });
};

const registerConnectionHandlers = (conn) => {
  conn.on("data", handleConnectionData);
  conn.on("error", (error) => {
    logEvent(`Erro no canal P2P: ${error.message}`);
    if (state.role === "guest") {
      shutdownAll("Erro na conexão com o host.");
    } else {
      handleGuestLeft("Convidado desconectado por erro.");
    }
  });
  conn.on("close", () => {
    if (state.role === "host") {
      handleGuestLeft("Convidado saiu da sala.");
    } else {
      shutdownAll("Conexão com o host encerrada.");
    }
  });
};

const handleConnectionData = (packet) => {
  if (!packet || typeof packet !== "object") {
    return;
  }
  const { type, payload } = packet;
  switch (type) {
    case MessageType.STATE: {
      if (state.role === "guest" && payload?.players) {
        state.game.players.host = { ...payload.players.host };
        state.game.players.guest = { ...payload.players.guest };
        renderScene();
      }
      break;
    }
    case MessageType.INPUT: {
      if (state.role === "host" && payload?.state) {
        state.remoteInput = { ...payload.state };
      }
      break;
    }
    case MessageType.WELCOME: {
      if (payload?.hostName) {
        state.remoteName = payload.hostName;
        logEvent(`Host identificado como ${state.remoteName}.`);
        setStatus(`Conectado a ${state.remoteName}. Aguarde o estado.`);
      }
      if (payload?.roomId) {
        setShareId(payload.roomId);
      }
      break;
    }
    case MessageType.INTRO: {
      if (payload?.guestName) {
        state.remoteName = payload.guestName;
        logEvent(`Convidado é ${state.remoteName}.`);
        setStatus(`Jogador conectado: ${state.remoteName}`);
      }
      break;
    }
    case MessageType.CHAT: {
      if (payload?.message) {
        logEvent(`${payload.author || "Remoto"}: ${payload.message}`);
      }
      break;
    }
    default: {
      logEvent(`Mensagem não identificada: ${type}`);
    }
  }
};

const handleKeyChange = (code, isPressed) => {
  const mapped = KEY_BINDINGS[code];
  if (!mapped) {
    return;
  }
  if (state.localInput[mapped] === isPressed) {
    return;
  }
  state.localInput[mapped] = isPressed;

  if (state.role === "guest" && state.connection && state.connection.open) {
    try {
      state.connection.send({
        type: MessageType.INPUT,
        payload: { state: { ...state.localInput } },
      });
    } catch (error) {
      logEvent(`Erro ao enviar input: ${error.message}`);
    }
  }
};

const pollGamepads = () => {
  if (!state.gamepads.enabled) {
    return;
  }

  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

  for (let i = 0; i < gamepads.length; i++) {
    const gp = gamepads[i];
    if (!gp || !gp.connected) {
      continue;
    }

    let targetInput = null;
    let targetRole = null;

    if (state.gamepads.player1Index === i) {
      targetInput = state.localInput;
      targetRole = "local";
    } else if (state.gamepads.player2Index === i) {
      targetInput = state.remoteInput;
      targetRole = "remote";
    } else {
      if (state.gamepads.player1Index === null) {
        state.gamepads.player1Index = i;
        targetInput = state.localInput;
        targetRole = "local";
        logEvent(`Gamepad ${i} atribuído ao Player 1 (local)`);
      } else if (state.gamepads.player2Index === null && state.role === "host") {
        state.gamepads.player2Index = i;
        targetInput = state.remoteInput;
        targetRole = "remote";
        logEvent(`Gamepad ${i} atribuído ao Player 2 (remoto no mesmo PC)`);
      } else {
        continue;
      }
    }

    if (!targetInput) {
      continue;
    }

    const newState = createInputState();

    for (const [axisIndex, mapping] of Object.entries(GAMEPAD_MAPPING.axes)) {
      const value = gp.axes[axisIndex];
      if (value > GAMEPAD_THRESHOLD) {
        newState[mapping.pos] = true;
      } else if (value < -GAMEPAD_THRESHOLD) {
        newState[mapping.neg] = true;
      }
    }

    for (const [buttonIndex, direction] of Object.entries(GAMEPAD_MAPPING.buttons)) {
      if (gp.buttons[buttonIndex]?.pressed) {
        newState[direction] = true;
      }
    }

    const changed =
      targetInput.up !== newState.up ||
      targetInput.down !== newState.down ||
      targetInput.left !== newState.left ||
      targetInput.right !== newState.right;

    if (changed) {
      Object.assign(targetInput, newState);

      if (targetRole === "local" && state.role === "guest" && state.connection?.open) {
        try {
          state.connection.send({
            type: MessageType.INPUT,
            payload: { state: { ...newState } },
          });
        } catch (error) {
          logEvent(`Erro ao enviar input do gamepad: ${error.message}`);
        }
      }
    }
  }
};

const enableGamepads = () => {
  if (!navigator.getGamepads) {
    logEvent("Gamepad API não disponível neste navegador.");
    return;
  }
  state.gamepads.enabled = true;
  logEvent("Suporte a Gamepad ativado. Conecte até 2 controles.");
};

window.addEventListener("gamepadconnected", (event) => {
  logEvent(`Gamepad conectado: ${event.gamepad.id} (índice ${event.gamepad.index})`);
  if (!state.gamepads.enabled) {
    enableGamepads();
  }
});

window.addEventListener("gamepaddisconnected", (event) => {
  logEvent(`Gamepad desconectado: ${event.gamepad.id} (índice ${event.gamepad.index})`);
  if (state.gamepads.player1Index === event.gamepad.index) {
    state.gamepads.player1Index = null;
  }
  if (state.gamepads.player2Index === event.gamepad.index) {
    state.gamepads.player2Index = null;
  }
});

window.addEventListener("keydown", (event) => {
  handleKeyChange(event.code, true);
  if (KEY_BINDINGS[event.code]) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  handleKeyChange(event.code, false);
  if (KEY_BINDINGS[event.code]) {
    event.preventDefault();
  }
});

elements.createRoomBtn.addEventListener("click", handleCreateRoom);

elements.joinRoomBtn.addEventListener("click", handleJoinRoom);

// Render inicial para mostrar a arena antes da conexão.
resetGamePositions();
renderScene();
setStatus("Aguardando configuração...");
updateUiState();

// Auto-detecta gamepads ao carregar
if (navigator.getGamepads) {
  const initialGamepads = navigator.getGamepads();
  for (let i = 0; i < initialGamepads.length; i++) {
    if (initialGamepads[i]?.connected) {
      enableGamepads();
      logEvent(`Gamepad detectado ao iniciar: ${initialGamepads[i].id}`);
      break;
    }
  }
}
