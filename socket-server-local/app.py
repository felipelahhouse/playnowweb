from flask import Flask, jsonify, send_file, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'playnow-multiplayer-secret-2024'

# Configuração CORS para permitir seu domínio
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://playnowemulator.com",
            "https://www.playnowemulator.com",
            "https://playnowemulator.web.app",
            "https://playnowemulator.firebaseapp.com",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5000"
        ],
        "supports_credentials": True
    }
})

socketio = SocketIO(
    app,
    cors_allowed_origins=[
        "https://playnowemulator.com",
        "https://www.playnowemulator.com",
        "https://playnowemulator.web.app",
        "https://playnowemulator.firebaseapp.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5000"
    ],
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    logger=True,
    engineio_logger=True
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

@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "service": "PlayNowEmulator Socket.IO Server (LOCAL)",
        "version": "2.0.0",
        "deployment": "Local Development (Flask)",
        "timestamp": datetime.now().isoformat(),
        "stats": {
            "rooms": len(rooms),
            "players": len(players)
        }
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/stats')
def stats():
    room_stats = []
    for room_code, room in rooms.items():
        room_stats.append({
            "room_code": room_code,
            "host_id": room.get("host"),
            "players_count": len(room.get("players", [])),
            "game": room.get("game", {}),
            "created_at": room.get("created_at")
        })
    
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "rooms": len(rooms),
        "players": len(players),
        "active_rooms": room_stats
    })

# ========== SOCKET.IO EVENTS ==========

@socketio.on('connect')
def handle_connect():
    print(f'✅ [CONNECT] Client connected: {request.sid}')
    players[request.sid] = {
        'id': request.sid,
        'room': None,
        'connected_at': datetime.now().isoformat()
    }
    emit('connected', {
        'player_id': request.sid,
        'message': 'Connected to PlayNow Multiplayer Server (Local)'
    })

@socketio.on('disconnect')
def handle_disconnect():
    print(f'❌ [DISCONNECT] Client disconnected: {request.sid}')
    
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
                del rooms[room_code]
                print(f'🗑️ [ROOM DELETED] Room {room_code} removed (empty)')
            else:
                # Se era host, reassign para primeiro jogador restante
                if was_host:
                    room['host'] = room['players'][0]
                    players[room['host']]['role'] = 'host'
                    emit('host-changed', {
                        'new_host': room['host']
                    }, room=room_code)
                    print(f'👑 [HOST CHANGED] Room {room_code} new host: {room["host"]}')
                
                # Notificar outros jogadores
                emit('player-left', {
                    'player_id': request.sid,
                    'players_count': len(room['players'])
                }, room=room_code)
        
        del players[request.sid]

@socketio.on('join-room')
def handle_join_room(data):
    """Jogador entra em uma sala existente"""
    room_code = data.get('roomCode', '').upper()
    username = data.get('username', f'Player_{request.sid[:6]}')
    
    print(f'🚪 [JOIN ROOM] Player {request.sid} joining room {room_code}')
    print(f'📋 [ROOMS AVAILABLE] {list(rooms.keys())}')
    
    if not room_code:
        emit('error', {'message': 'Room code required'})
        return
    
    if room_code not in rooms:
        emit('error', {
            'message': 'Room not found',
            'room_code': room_code,
            'available_rooms': list(rooms.keys()),
            'suggestion': 'The room may have been closed or the server restarted. Please create a new room.'
        })
        return
    
    room = rooms[room_code]
    
    # Adicionar jogador à sala
    join_room(room_code)
    room['players'].append(request.sid)
    
    players[request.sid]['room'] = room_code
    players[request.sid]['username'] = username
    players[request.sid]['role'] = 'spectator'
    
    # Notificar todos na sala
    emit('player-joined', {
        'player_id': request.sid,
        'username': username,
        'players_count': len(room['players']),
        'room_code': room_code
    }, room=room_code)
    
    # Confirmar para o jogador que entrou
    emit('room-joined', {
        'room_code': room_code,
        'role': 'spectator',
        'host_id': room['host'],
        'players_count': len(room['players']),
        'game': room.get('game', {})
    })
    
    print(f'✅ [JOINED] Player {request.sid} joined room {room_code}')

@socketio.on('create-room')
def handle_create_room(data):
    """Host cria uma nova sala"""
    game_info = data.get('game', {})
    username = data.get('username', f'Host_{request.sid[:6]}')
    
    room_code = generate_room_code()
    
    rooms[room_code] = {
        'code': room_code,
        'host': request.sid,
        'players': [request.sid],
        'game': game_info,
        'created_at': datetime.now().isoformat()
    }
    
    join_room(room_code)
    
    players[request.sid]['room'] = room_code
    players[request.sid]['username'] = username
    players[request.sid]['role'] = 'host'
    
    print(f'🎮 [ROOM CREATED] Room {room_code} by {request.sid}')
    
    emit('room-created', {
        'room_code': room_code,
        'role': 'host',
        'game': game_info
    })

@socketio.on('leave-room')
def handle_leave_room():
    """Jogador sai da sala"""
    if request.sid not in players:
        return
    
    player = players[request.sid]
    room_code = player.get('room')
    
    if not room_code or room_code not in rooms:
        return
    
    room = rooms[room_code]
    was_host = room['host'] == request.sid
    
    leave_room(room_code)
    
    if request.sid in room['players']:
        room['players'].remove(request.sid)
    
    player['room'] = None
    
    # Se sala ficou vazia, deletar
    if len(room['players']) == 0:
        del rooms[room_code]
        print(f'🗑️ [ROOM DELETED] Room {room_code} removed')
    else:
        # Se era host, reassign para primeiro jogador restante
        if was_host:
            room['host'] = room['players'][0]
            players[room['host']]['role'] = 'host'
            emit('host-changed', {
                'new_host': room['host']
            }, room=room_code)
            print(f'👑 [HOST CHANGED] Room {room_code} new host: {room["host"]}')
        
        # Notificar outros jogadores
        emit('player-left', {
            'player_id': request.sid,
            'players_count': len(room['players'])
        }, room=room_code)

@socketio.on('input')
def handle_input(data):
    """Host envia inputs do jogo"""
    if request.sid not in players:
        return
    
    player = players[request.sid]
    room_code = player.get('room')
    
    if not room_code:
        return
    
    # Broadcast inputs para todos na sala (exceto host)
    emit('input', data, room=room_code, include_self=False)

@socketio.on('guest-input')
def handle_guest_input(data):
    """Guest (Player 2) envia inputs do jogo"""
    if request.sid not in players:
        return
    
    player = players[request.sid]
    room_code = player.get('room')
    
    if not room_code or room_code not in rooms:
        return
    
    room = rooms[room_code]
    host_id = room['host']
    
    # Enviar inputs do GUEST apenas para o HOST
    emit('player2-input', data, room=host_id)

@socketio.on('sync-state')
def handle_sync_state(data):
    """Host sincroniza estado do jogo"""
    if request.sid not in players:
        return
    
    player = players[request.sid]
    room_code = player.get('room')
    
    if not room_code:
        return
    
    # Broadcast estado para todos na sala
    emit('state-update', data, room=room_code, include_self=False)

@socketio.on('chat-message')
def handle_chat_message(data):
    """Mensagem de chat"""
    if request.sid not in players:
        return
    
    player = players[request.sid]
    room_code = player.get('room')
    username = player.get('username', 'Anonymous')
    
    if not room_code:
        return
    
    message = {
        'player_id': request.sid,
        'username': username,
        'message': data.get('message', ''),
        'timestamp': datetime.now().isoformat()
    }
    
    emit('chat-message', message, room=room_code)
    print(f'💬 [CHAT] {username}: {message["message"]}')

@socketio.on('heartbeat')
def handle_heartbeat():
    """Keepalive para manter conexão ativa"""
    emit('heartbeat-ack', {'timestamp': datetime.now().isoformat()})

@socketio.on('check-room')
def handle_check_room(data):
    """Verifica se uma sala existe e se tem host"""
    room_code = data.get('roomCode', '').upper()
    
    print(f'🔍 [CHECK ROOM] Checking room {room_code}')
    
    if room_code not in rooms:
        emit('room-status', {
            'exists': False,
            'hasHost': False,
            'room_code': room_code
        })
        return
    
    room = rooms[room_code]
    has_host = room.get('host') is not None
    
    emit('room-status', {
        'exists': True,
        'hasHost': has_host,
        'room_code': room_code,
        'players_count': len(room.get('players', []))
    })

@socketio.on('join-or-create-session')
def handle_join_or_create_session(data):
    """Cria sala ou entra em sala existente baseado no session_id"""
    try:
        print(f'🔗 [SESSION DEBUG] Received data: {data}')
        
        session_id = data.get('sessionId', '')
        game_info = data.get('game', {})
        username = data.get('username', f'Player_{request.sid[:6]}')
        
        print(f'🔗 [SESSION] Player {request.sid} with session {session_id}')
        print(f'🔗 [SESSION] Current sessions: {list(sessions.keys())}')
        
        if not session_id:
            print('[SESSION ERROR] No session ID provided')
            emit('error', {'message': 'Session ID required'})
            return
        
        # Verificar se já existe uma sala para essa sessão
        if session_id in sessions:
            room_code = sessions[session_id]
            print(f'🔗 [SESSION] Found existing session mapping: {session_id} -> {room_code}')
            
            # Verificar se a sala ainda existe
            if room_code in rooms:
                room = rooms[room_code]
                
                # Entrar como SPECTATOR
                join_room(room_code)
                room['players'].append(request.sid)
                
                players[request.sid]['room'] = room_code
                players[request.sid]['username'] = username
                players[request.sid]['role'] = 'spectator'
                players[request.sid]['session'] = session_id
                
                print(f'🔗 [SESSION] Player joined existing room {room_code} as SPECTATOR')
                
                # Notificar todos na sala
                emit('player-joined', {
                    'player_id': request.sid,
                    'username': username,
                    'players_count': len(room['players']),
                    'room_code': room_code
                }, room=room_code)
                
                # Confirmar para o jogador que entrou
                emit('room-joined', {
                    'room_code': room_code,
                    'role': 'spectator',
                    'host_id': room['host'],
                    'players_count': len(room['players']),
                    'game': room.get('game', {}),
                    'session_id': session_id
                })
                return
            else:
                # Sala foi deletada - limpar sessão antiga
                print(f'🔗 [SESSION] Room {room_code} was deleted, cleaning up session')
                del sessions[session_id]
        
        # Não existe sala para essa sessão - CRIAR como HOST
        room_code = generate_room_code()
        
        rooms[room_code] = {
            'code': room_code,
            'host': request.sid,
            'players': [request.sid],
            'game': game_info,
            'session_id': session_id,
            'created_at': datetime.now().isoformat()
        }
        
        sessions[session_id] = room_code
        
        join_room(room_code)
        
        players[request.sid]['room'] = room_code
        players[request.sid]['username'] = username
        players[request.sid]['role'] = 'host'
        players[request.sid]['session'] = session_id
        
        print(f'🔗 [SESSION] Created new room {room_code} for session {session_id}')
        
        emit('room-created', {
            'room_code': room_code,
            'role': 'host',
            'game': game_info,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f'❌ [SESSION ERROR] {str(e)}')
        emit('error', {'message': f'Session error: {str(e)}'})

if __name__ == '__main__':
    print('🚀 Starting PlayNow Multiplayer Server (Local Flask)...')
    print('📍 Server running on http://localhost:5000')
    print('🔌 Socket.IO path: /socket.io/')
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)