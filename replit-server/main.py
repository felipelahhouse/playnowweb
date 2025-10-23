"""
PlayNow Emulator - Multiplayer Server
Otimizado para Replit Reserved VM
Versão: 2.0.0
Data: 17/10/2025
"""

from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'playnow-multiplayer-secret-2024')

# Configuração CORS - PERMITIR TODOS OS DOMÍNIOS (necessário para Replit)
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Permite qualquer origem
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": False
    }
})

# Configurar Socket.IO com CORS aberto
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # Permite qualquer origem
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=False,  # Reduzir logs no Replit
    transports=['websocket', 'polling']
)

# Armazenamento em memória
rooms = {}
players = {}
sessions = {}  # Mapeia session_id -> room_code

def generate_room_code():
    """Gera código de sala único de 6 dígitos"""
    import random
    import string
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if code not in rooms:
            return code

# ========== ROTAS HTTP ==========

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "status": "online",
        "service": "PlayNow Multiplayer Server (Replit)",
        "version": "2.0.0",
        "deployment": "Replit Reserved VM",
        "timestamp": datetime.now().isoformat(),
        "stats": {
            "rooms": len(rooms),
            "players": len(players),
            "sessions": len(sessions)
        }
    }), 200

@app.route('/health')
def health():
    """Health check para monitoramento"""
    return jsonify({
        "status": "healthy",
        "uptime": "running",
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/stats')
def stats():
    """Estatísticas detalhadas do servidor"""
    room_stats = []
    for room_code, room in rooms.items():
        room_stats.append({
            "room_code": room_code,
            "host_id": room.get("host"),
            "players_count": len(room.get("players", [])),
            "game": room.get("game", {}),
            "created_at": room.get("created_at"),
            "session_name": room.get("session_name")
        })
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "rooms": len(rooms),
        "players": len(players),
        "sessions": len(sessions),
        "active_rooms": room_stats
    }), 200

# ========== SOCKET.IO EVENTS ==========

@socketio.on('connect')
def handle_connect():
    """Cliente conectou ao servidor"""
    logger.info(f'✅ [CONNECT] Client connected: {request.sid}')
    players[request.sid] = {
        'id': request.sid,
        'room': None,
        'connected_at': datetime.now().isoformat()
    }
    emit('connected', {
        'player_id': request.sid,
        'message': 'Connected to PlayNow Multiplayer Server (Replit)'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Cliente desconectou do servidor"""
    logger.info(f'❌ [DISCONNECT] Client disconnected: {request.sid}')
    
    if request.sid in players:
        player = players[request.sid]
        room_code = player.get('room')
        
        if room_code and room_code in rooms:
            room = rooms[room_code]
            was_host = room['host'] == request.sid
            
            # Remover jogador da sala
            if request.sid in room['players']:
                room['players'].remove(request.sid)
            
            # Se sala ficou vazia, deletar
            if len(room['players']) == 0:
                # Remover sessão também
                session_id = room.get('session_id')
                if session_id and session_id in sessions:
                    del sessions[session_id]
                del rooms[room_code]
                logger.info(f'🗑️ [ROOM DELETED] Room {room_code} removed (empty)')
            else:
                # Se era host, reassign para primeiro jogador restante
                if was_host:
                    room['host'] = room['players'][0]
                    players[room['host']]['role'] = 'host'
                    emit('host-changed', {
                        'new_host': room['host']
                    }, room=room_code)
                    logger.info(f'👑 [HOST CHANGED] Room {room_code} new host: {room["host"]}')
                
                # Notificar outros jogadores
                emit('player-left', {
                    'player_id': request.sid,
                    'players_count': len(room['players'])
                }, room=room_code)
        
        del players[request.sid]

@socketio.on('get-lobby-sessions')
def handle_get_lobby_sessions():
    """Retorna lista de sessões ativas para o lobby"""
    try:
        active_sessions = []
        for session_id, room_code in sessions.items():
            if room_code in rooms:
                room = rooms[room_code]
                game_info = room.get('game', {})
                
                active_sessions.append({
                    'id': session_id,
                    'hostUserId': players.get(room['host'], {}).get('user_id', ''),
                    'hostName': players.get(room['host'], {}).get('username', 'Host'),
                    'gameId': game_info.get('id', ''),
                    'gameTitle': game_info.get('title', ''),
                    'gamePlatform': game_info.get('platform', ''),
                    'sessionName': room.get('session_name', 'Unnamed Session'),
                    'isPublic': room.get('is_public', True),
                    'maxPlayers': room.get('max_players', 4),
                    'currentPlayers': len(room.get('players', [])),
                    'players': room.get('players', []),
                    'status': 'waiting',
                    'createdAt': room.get('created_at', ''),
                    'gameCover': game_info.get('cover', '')
                })
        
        emit('lobby-sessions', {'sessions': active_sessions})
        logger.info(f'📡 [LOBBY] Sent {len(active_sessions)} active sessions to {request.sid}')
    except Exception as e:
        logger.error(f'❌ [LOBBY ERROR] {str(e)}')
        emit('lobby-sessions', {'sessions': []})

@socketio.on('create-session')
def handle_create_session(data):
    """Cria uma nova sessão/sala de jogo"""
    try:
        logger.info(f'🎮 [CREATE SESSION] Received from {request.sid}')
        logger.info(f'📦 Data: {data}')
        
        session_name = data.get('sessionName', 'Unnamed Session')
        game_info = {
            'id': data.get('gameId', ''),
            'title': data.get('gameTitle', ''),
            'platform': data.get('gamePlatform', ''),
            'cover': data.get('gameCover', '')
        }
        max_players = data.get('maxPlayers', 4)
        is_public = data.get('isPublic', True)
        host_user_id = data.get('hostUserId', '')
        host_name = data.get('hostName', 'Host')
        
        room_code = generate_room_code()
        session_id = f"session_{room_code}_{int(datetime.now().timestamp())}"
        
        rooms[room_code] = {
            'code': room_code,
            'host': request.sid,
            'players': [request.sid],
            'game': game_info,
            'session_id': session_id,
            'session_name': session_name,
            'max_players': max_players,
            'is_public': is_public,
            'created_at': datetime.now().isoformat()
        }
        
        sessions[session_id] = room_code
        join_room(room_code)
        
        players[request.sid]['room'] = room_code
        players[request.sid]['username'] = host_name
        players[request.sid]['role'] = 'host'
        players[request.sid]['session'] = session_id
        players[request.sid]['user_id'] = host_user_id
        
        logger.info(f'✅ [SESSION CREATED] {session_name} - Room: {room_code} - Session: {session_id}')
        
        # Enviar confirmação para o criador
        emit('session-created', {
            'sessionId': session_id,
            'roomCode': room_code,
            'role': 'host',
            'game': game_info
        })
        
        # Broadcast para todos no lobby sobre a nova sessão
        session_data = {
            'id': session_id,
            'hostUserId': host_user_id,
            'hostName': host_name,
            'gameId': game_info.get('id', ''),
            'gameTitle': game_info.get('title', ''),
            'gamePlatform': game_info.get('platform', ''),
            'sessionName': session_name,
            'isPublic': is_public,
            'maxPlayers': max_players,
            'currentPlayers': 1,
            'players': [request.sid],
            'status': 'waiting',
            'createdAt': rooms[room_code]['created_at'],
            'gameCover': game_info.get('cover', '')
        }
        
        socketio.emit('session-updated', session_data, broadcast=True, include_self=False)
        logger.info(f'📢 [SESSION] Broadcasted new session to all clients')
        
    except Exception as e:
        logger.error(f'❌ [CREATE SESSION ERROR] {str(e)}')
        import traceback
        traceback.print_exc()
        emit('error', {'message': f'Failed to create session: {str(e)}'})

@socketio.on('join-room')
def handle_join_room(data):
    """Jogador entra em uma sala"""
    room_code = data.get('roomCode', '').upper()
    username = data.get('username', data.get('playerName', f'Player_{request.sid[:6]}'))
    
    logger.info(f'🚪 [JOIN ROOM] Player {request.sid} joining room {room_code}')
    
    if not room_code:
        emit('error', {'message': 'Room code required'})
        return
    
    if room_code not in rooms:
        emit('error', {'message': 'Room not found'})
        return
    
    room = rooms[room_code]
    
    # Se jogador já está na sala (é o HOST), apenas confirmar
    if request.sid in room['players']:
        role = players[request.sid].get('role', 'host')
        emit('room-joined', {
            'room_code': room_code,
            'role': role,
            'host_id': room['host'],
            'players_count': len(room['players']),
            'game': room.get('game', {})
        })
        logger.info(f'✅ [JOIN] Player {request.sid} already in room {room_code}')
        return
    
    # Adicionar novo jogador
    join_room(room_code)
    room['players'].append(request.sid)
    
    players[request.sid]['room'] = room_code
    players[request.sid]['username'] = username
    players[request.sid]['role'] = 'spectator'
    
    # Notificar todos
    emit('player-joined', {
        'player_id': request.sid,
        'username': username,
        'players_count': len(room['players']),
        'room_code': room_code
    }, room=room_code)
    
    # Confirmar para o jogador
    emit('room-joined', {
        'room_code': room_code,
        'role': 'spectator',
        'host_id': room['host'],
        'players_count': len(room['players']),
        'game': room.get('game', {})
    })
    
    logger.info(f'✅ [JOINED] Player {request.sid} joined room {room_code}')

# ========== INICIALIZAÇÃO ==========

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info('=' * 50)
    logger.info('🚀 PlayNow Multiplayer Server')
    logger.info('📍 Deployment: Replit Reserved VM')
    logger.info(f'🔌 Port: {port}')
    logger.info('=' * 50)
    
    # Rodar servidor
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=False,  # Desabilitar debug em produção
        allow_unsafe_werkzeug=True
    )
