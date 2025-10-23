// ==========================================
// SERVIDOR EMULATORJS MULTIPLAYER
// Screen Sharing + Remote Input
// ==========================================
// npm install express socket.io

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Mude para seu domínio em produção
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Estrutura de salas
const salas = new Map();

// Servir arquivos estáticos
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>EmulatorJS Multiplayer</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    padding: 50px;
                }
                h1 { font-size: 3em; margin-bottom: 30px; }
                .btn {
                    display: inline-block;
                    padding: 20px 40px;
                    margin: 20px;
                    background: #4CAF50;
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-size: 1.5em;
                    transition: all 0.3s;
                }
                .btn:hover { background: #45a049; transform: scale(1.05); }
                .info {
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    border-radius: 10px;
                    margin-top: 30px;
                    max-width: 600px;
                    margin-left: auto;
                    margin-right: auto;
                }
            </style>
        </head>
        <body>
            <h1>🎮 EmulatorJS Multiplayer</h1>
            <a href="/host.html" class="btn">🖥️ Criar Sala (HOST)</a>
            <a href="/player.html" class="btn">🎮 Entrar como Jogador</a>
            <div class="info">
                <h3>Como Funciona:</h3>
                <p><strong>HOST:</strong> Abre o emulador e compartilha a tela</p>
                <p><strong>PLAYERS:</strong> Veem a tela e controlam seus jogadores</p>
                <p>Suporta até 4 jogadores simultâneos!</p>
            </div>
        </body>
        </html>
    `);
});

// Quando um cliente conecta
io.on('connection', (socket) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔌 CLIENTE CONECTADO');
    console.log('   ID:', socket.id);
    console.log('   Horário:', new Date().toLocaleTimeString());
    console.log('   Clientes conectados:', io.engine.clientsCount);
    console.log('='.repeat(60) + '\n');

    // HOST cria uma sala
    socket.on('criar-sala', (nomeSala) => {
        if (salas.has(nomeSala)) {
            console.log(`⚠️  ERRO: Sala "${nomeSala}" já existe!`);
            socket.emit('erro', 'Sala já existe!');
            return;
        }

        salas.set(nomeSala, {
            host: socket.id,
            players: [],
            gameState: {
                streaming: false
            }
        });

        socket.join(nomeSala);
        socket.currentRoom = nomeSala;
        socket.isHost = true;

        console.log('\n' + '='.repeat(60));
        console.log('🏠 SALA CRIADA - HOST INICIADO');
        console.log('   Nome da Sala:', nomeSala);
        console.log('   Host ID:', socket.id);
        console.log('   Horário:', new Date().toLocaleTimeString());
        console.log('   Salas ativas:', salas.size);
        console.log('='.repeat(60) + '\n');
        
        socket.emit('sala-criada', { 
            nomeSala,
            codigo: nomeSala 
        });
    });

    // PLAYER entra em uma sala
    socket.on('entrar-sala', (nomeSala) => {
        const sala = salas.get(nomeSala);

        if (!sala) {
            console.log(`⚠️  ERRO: Sala "${nomeSala}" não encontrada!`);
            console.log(`   Salas disponíveis:`, Array.from(salas.keys()));
            socket.emit('erro', 'Sala não encontrada!');
            return;
        }

        if (sala.players.length >= 4) {
            console.log(`⚠️  ERRO: Sala "${nomeSala}" cheia! (${sala.players.length}/4 jogadores)`);
            socket.emit('erro', 'Sala cheia! Máximo 4 jogadores.');
            return;
        }

        // Adicionar player à sala
        const playerIndex = sala.players.length + 1;
        sala.players.push({
            id: socket.id,
            index: playerIndex,
            nome: `Jogador ${playerIndex}`
        });

        socket.join(nomeSala);
        socket.currentRoom = nomeSala;
        socket.playerIndex = playerIndex;

        console.log('\n' + '='.repeat(60));
        console.log('👤 NOVO JOGADOR ENTROU NA SALA');
        console.log('   Sala:', nomeSala);
        console.log('   Jogador:', `#${playerIndex}`);
        console.log('   ID do Jogador:', socket.id);
        console.log('   Horário:', new Date().toLocaleTimeString());
        console.log('   Total de Jogadores:', sala.players.length + '/4');
        console.log('   Host ID:', sala.host);
        console.log('   Status da Sala:');
        sala.players.forEach((p, i) => {
            console.log(`     - Jogador #${p.index}: ${p.id.substring(0, 8)}...`);
        });
        console.log('='.repeat(60) + '\n');

        // Notificar player
        socket.emit('entrou-sala', {
            playerIndex,
            totalPlayers: sala.players.length
        });

        // Notificar HOST sobre novo player
        io.to(sala.host).emit('novo-player', {
            playerIndex,
            playerId: socket.id,
            totalPlayers: sala.players.length
        });

        // Notificar todos os players da sala
        io.to(nomeSala).emit('atualizar-players', {
            total: sala.players.length,
            players: sala.players
        });
    });

    // WebRTC Signaling para Screen Sharing
    socket.on('offer', (data) => {
        console.log('📡 Offer recebido do HOST');
        socket.to(data.to).emit('offer', {
            from: socket.id,
            offer: data.offer
        });
    });

    socket.on('answer', (data) => {
        console.log('📡 Answer recebido do PLAYER');
        socket.to(data.to).emit('answer', {
            from: socket.id,
            answer: data.answer
        });
    });

    socket.on('ice-candidate', (data) => {
        socket.to(data.to).emit('ice-candidate', {
            from: socket.id,
            candidate: data.candidate
        });
    });

    // Comandos do emulador (PLAYER -> HOST)
    socket.on('input-command', (data) => {
        if (!socket.currentRoom) return;

        const sala = salas.get(socket.currentRoom);
        if (!sala) return;

        // Enviar comando para o HOST
        io.to(sala.host).emit('player-input', {
            playerIndex: socket.playerIndex,
            key: data.key,
            action: data.action // 'keydown' ou 'keyup'
        });
    });

    // HOST inicia streaming
    socket.on('iniciar-streaming', () => {
        if (!socket.currentRoom || !socket.isHost) return;

        const sala = salas.get(socket.currentRoom);
        if (sala) {
            sala.gameState.streaming = true;
            console.log('\n' + '='.repeat(60));
            console.log('📺 STREAMING INICIADO');
            console.log('   Sala:', socket.currentRoom);
            console.log('   Host ID:', socket.id);
            console.log('   Horário:', new Date().toLocaleTimeString());
            console.log('   Jogadores conectados:', sala.players.length);
            console.log('='.repeat(60) + '\n');
        }
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log('\n' + '='.repeat(60));
        console.log('❌ CLIENTE DESCONECTADO');
        console.log('   ID:', socket.id);
        console.log('   Horário:', new Date().toLocaleTimeString());
        console.log('   Clientes conectados restantes:', io.engine.clientsCount);

        if (!socket.currentRoom) {
            console.log('   (Não estava em nenhuma sala)');
            console.log('='.repeat(60) + '\n');
            return;
        }

        const sala = salas.get(socket.currentRoom);
        if (!sala) {
            console.log('   (Sala não encontrada)');
            console.log('='.repeat(60) + '\n');
            return;
        }

        // Se HOST desconectou, fechar sala
        if (socket.isHost) {
            console.log('🏠 HOST SAIU - FECHANDO SALA');
            console.log('   Sala:', socket.currentRoom);
            console.log('   Jogadores que perderão conexão:', sala.players.length);
            console.log('='.repeat(60) + '\n');
            
            io.to(socket.currentRoom).emit('host-desconectou');
            salas.delete(socket.currentRoom);
        } else {
            // Player desconectou
            const playerIndex = socket.playerIndex;
            sala.players = sala.players.filter(p => p.id !== socket.id);
            
            console.log('👤 JOGADOR SAIU');
            console.log('   Sala:', socket.currentRoom);
            console.log('   Jogador:', `#${playerIndex}`);
            console.log('   ID:', socket.id);
            console.log('   Jogadores restantes:', sala.players.length + '/4');
            console.log('='.repeat(60) + '\n');

            // Notificar HOST
            io.to(sala.host).emit('player-saiu', {
                playerId: socket.id,
                totalPlayers: sala.players.length
            });

            // Notificar outros players
            io.to(socket.currentRoom).emit('atualizar-players', {
                total: sala.players.length,
                players: sala.players
            });
        }
    });

    // Chat (opcional)
    socket.on('mensagem', (msg) => {
        if (!socket.currentRoom) return;
        
        const sala = salas.get(socket.currentRoom);
        const nome = socket.isHost ? 'HOST' : `Jogador ${socket.playerIndex}`;
        
        io.to(socket.currentRoom).emit('nova-mensagem', {
            nome,
            mensagem: msg,
            timestamp: Date.now()
        });
    });

    // Listar salas ativas
    socket.on('listar-salas', () => {
        const salasAtivas = Array.from(salas.entries()).map(([nome, sala]) => ({
            nome,
            players: sala.players.length,
            streaming: sala.gameState.streaming
        }));
        socket.emit('salas-disponiveis', salasAtivas);
    });
});

// API para debug
app.get('/api/salas', (req, res) => {
    const salasInfo = Array.from(salas.entries()).map(([nome, sala]) => ({
        nome,
        host: sala.host,
        players: sala.players.length,
        streaming: sala.gameState.streaming
    }));
    res.json(salasInfo);
});

// Iniciar servidor
http.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║  🎮 EMULATORJS MULTIPLAYER SERVER         ║
    ║  📡 Porta: ${PORT}                            ║
    ║  🌐 http://localhost:${PORT}                 ║
    ║                                            ║
    ║  📺 Screen Sharing + Remote Input         ║
    ║  👥 Até 4 jogadores por sala              ║
    ╚════════════════════════════════════════════╝
    `);
});
