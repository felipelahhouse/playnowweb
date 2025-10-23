from flask import Flask, jsonify, send_file, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SESSION_SECRET', 'playnow-multiplayer-secret-2024')

# Configuração CORS para permitir seu domínio e Replit
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://playnowemulator.com",
            "https://www.playnowemulator.com",
            "https://playnowemulator.web.app",
            "https://playnowemulator.firebaseapp.com",
            "https://play-now-emulator-felipelars.replit.app",
            "http://localhost:5173",
            "http://localhost:3000"
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
        "https://play-now-emulator-felipelars.replit.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    async_mode='threading',
    ping_timeout=30,
    ping_interval=10,
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
    return {"status": "ok"}, 200

@app.route('/multiplayer-emulator.html')
def multiplayer_emulator():
    return send_file('multiplayer-emulator.html')

@app.route('/test')
def test():
    return jsonify({
        "message": "Socket.IO server is running!",
        "rooms": len(rooms),
        "players": len(players),
        "active_rooms": list(rooms.keys())
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

# ========== SOCKET.IO EVENTS ==========

@socketio.on('connect')
def handle_connect():
    print(f'[CONNECT] Client connected: {request.sid}')
    players[request.sid] = {
        'id': request.sid,
        'room': None,
        'connected_at': datetime.now().isoformat()
    }
    emit('connected', {
        'player_id': request.sid,
        'message': 'Connected to PlayNow Multiplayer Server'
    })

@socketio.on('disconnect')
def handle_disconnect():
    print(f'[DISCONNECT] Client disconnected: {request.sid}')
    
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
                print(f'[ROOM DELETED] Room {room_code} removed (empty)')
            else:
                # Se era host, reassign para primeiro jogador restante
                if was_host:
                    room['host'] = room['players'][0]
                    players[room['host']]['role'] = 'host'
                    emit('host-changed', {
                        'new_host': room['host']
                    }, room=room_code)
                    print(f'[HOST CHANGED] Room {room_code} new host: {room["host"]}')
                
                # Notificar outros jogadores
                emit('player-left', {
                    'player_id': request.sid,
                    'players_count': len(room['players'])
                }, room=room_code)
        
        del players[request.sid]

@socketio.on('join-room')
def handle_join_room(data):
    """Jogador entra em uma sala existente ou confirma entrada na própria sala"""
    room_code = data.get('roomCode', '').upper()
    username = data.get('username', data.get('playerName', f'Player_{request.sid[:6]}'))
    
    # Se não tem roomCode, verificar se player já tem sala (criou recente)
    if not room_code and request.sid in players:
        player = players[request.sid]
        room_code = player.get('room')
        print(f'[JOIN ROOM] Player {request.sid} using existing room {room_code}')
    
    print(f'[JOIN ROOM] Player {request.sid} joining room {room_code}')
    print(f'[ROOMS AVAILABLE] {list(rooms.keys())}')
    
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
        print(f'[JOIN ROOM] Player {request.sid} already in room {room_code} as {role}')
        return
    
    # Adicionar novo jogador à sala
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

@socketio.on('join-session')
def handle_join_session(data):
    """Jogador entra em uma sessão existente (lobby integration)"""
    try:
        session_id = data.get('sessionId', '')
        user_id = data.get('userId', '')
        username = data.get('userName', f'Player_{request.sid[:6]}')
        game_id = data.get('gameId', '')
        
        print(f'[JOIN SESSION] Player {request.sid} joining session {session_id}')
        print(f'[SESSION] Current sessions: {list(sessions.keys())}')
        
        if not session_id:
            emit('error', {'message': 'Session ID required'})
            return
        
        # Verificar se a sessão existe
        if session_id not in sessions:
            emit('error', {
                'message': 'Session not found',
                'session_id': session_id
            })
            return
        
        room_code = sessions[session_id]
        
        # Verificar se a sala ainda existe
        if room_code not in rooms:
            print(f'[JOIN SESSION] Room {room_code} was deleted, cleaning up session')
            del sessions[session_id]
            emit('error', {'message': 'Session room was deleted'})
            return
        
        room = rooms[room_code]
        
        # Se jogador já está na sala, apenas confirmar
        if request.sid in room['players']:
            role = players[request.sid].get('role', 'spectator')
            emit('joined-session', {
                'success': True,
                'joined': True,
                'session_id': session_id,
                'room_code': room_code,
                'role': role,
                'players': len(room['players']),
                'game': room.get('game', {})
            })
            print(f'[JOIN SESSION] Player {request.sid} already in session {session_id}')
            return
        
        # Adicionar novo jogador à sala
        join_room(room_code)
        room['players'].append(request.sid)
        
        players[request.sid]['room'] = room_code
        players[request.sid]['username'] = username
        players[request.sid]['role'] = 'spectator'
        players[request.sid]['user_id'] = user_id
        
        print(f'[JOIN SESSION] Player {request.sid} joined session {session_id} as spectator')
        
        # Notificar todos na sala
        emit('player-joined', {
            'player_id': request.sid,
            'username': username,
            'players_count': len(room['players']),
            'session_id': session_id
        }, room=room_code)
        
        # Confirmar para o jogador que entrou
        emit('joined-session', {
            'success': True,
            'joined': True,
            'session_id': session_id,
            'room_code': room_code,
            'role': 'spectator',
            'players': len(room['players']),
            'game': room.get('game', {}),
            'host_id': room['host']
        })
        
        # Broadcast session update para todos (para atualizar a contagem de players no lobby)
        session_data = {
            'id': session_id,
            'currentPlayers': len(room['players']),
            'playersCount': len(room['players']),
            'players': room['players'],
            'status': 'playing' if len(room['players']) > 1 else 'waiting'
        }
        socketio.emit('session-updated', session_data, broadcast=True, include_self=True)
        
    except Exception as e:
        print(f'[JOIN SESSION ERROR] {str(e)}')
        import traceback
        traceback.print_exc()
        emit('error', {'message': f'Failed to join session: {str(e)}'})

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
    
    print(f'[ROOM CREATED] Room {room_code} by {request.sid}')
    
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
        print(f'[ROOM DELETED] Room {room_code} removed')
    else:
        # Se era host, reassign para primeiro jogador restante
        if was_host:
            room['host'] = room['players'][0]
            players[room['host']]['role'] = 'host'
            emit('host-changed', {
                'new_host': room['host']
            }, room=room_code)
            print(f'[HOST CHANGED] Room {room_code} new host: {room["host"]}')
        
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

@socketio.on('heartbeat')
def handle_heartbeat():
    """Keepalive para manter conexão ativa"""
    emit('heartbeat-ack', {'timestamp': datetime.now().isoformat()})

@socketio.on('check-room')
def handle_check_room(data):
    """Verifica se uma sala existe e se tem host"""
    room_code = data.get('roomCode', '').upper()
    
    print(f'[CHECK ROOM] Checking room {room_code}')
    
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
        print(f'[SESSION DEBUG] Received data: {data}')
        
        # Manter case original do sessionId (não fazer upper)
        session_id = data.get('sessionId', '')
        game_info = data.get('game', {})
        username = data.get('username', f'Player_{request.sid[:6]}')
        
        print(f'[SESSION] Player {request.sid} with session {session_id}')
        print(f'[SESSION] Current sessions: {list(sessions.keys())}')
        
        if not session_id:
            print('[SESSION ERROR] No session ID provided')
            emit('error', {'message': 'Session ID required'})
            return
        
        # Verificar se já existe uma sala para essa sessão
        if session_id in sessions:
            room_code = sessions[session_id]
            print(f'[SESSION] Found existing session mapping: {session_id} -> {room_code}')
            
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
                
                print(f'[SESSION] Player joined existing room {room_code} as SPECTATOR')
                
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
                print(f'[SESSION] Room {room_code} was deleted, cleaning up session')
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
        
        print(f'[SESSION] Created room {room_code} for session {session_id} as HOST')
        print(f'[SESSION] Sessions now: {list(sessions.keys())}')
        
        emit('room-created', {
            'room_code': room_code,
            'role': 'host',
            'game': game_info,
            'session_id': session_id
        })
        
    except Exception as e:
        print(f'[SESSION ERROR] Exception: {str(e)}')
        import traceback
        traceback.print_exc()
        emit('error', {'message': f'Session error: {str(e)}'})

@socketio.on('get-lobby-sessions')
def handle_get_lobby_sessions():
    """Retorna lista de sessões ativas para o lobby"""
    try:
        active_sessions = []
        for session_id, room_code in sessions.items():
            if room_code in rooms:
                room = rooms[room_code]
                active_sessions.append({
                    'sessionId': session_id,
                    'roomCode': room_code,
                    'playersCount': len(room.get('players', [])),
                    'game': room.get('game', {}),
                    'createdAt': room.get('created_at', '')
                })
        
        emit('lobby-sessions', {'sessions': active_sessions})
        print(f'[LOBBY] Sent {len(active_sessions)} active sessions')
    except Exception as e:
        print(f'[LOBBY ERROR] {str(e)}')
        emit('lobby-sessions', {'sessions': []})

@socketio.on('create-session')
def handle_create_session(data):
    """Cria uma nova sessão/sala de jogo"""
    try:
        print(f'\n🎮 [CREATE SESSION] Received request from {request.sid}')
        print(f'📦 [CREATE SESSION] Data: {data}')
        
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
        
        print(f'👤 [CREATE SESSION] Host: {host_name} (ID: {host_user_id})')
        print(f'🎯 [CREATE SESSION] Game: {game_info["title"]} ({game_info["platform"]})')
        
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
        
        print(f'[SESSION CREATED] {session_name} - Room {room_code} - Session ID: {session_id}')
        
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
        
        # Notificar todos sobre a nova sessão (broadcast)
        socketio.emit('session-updated', session_data, broadcast=True, include_self=False)
        
        print(f'[SESSION] Broadcasted new session to all clients')
        
    except Exception as e:
        print(f'[CREATE SESSION ERROR] {str(e)}')
        import traceback
        traceback.print_exc()
        emit('error', {'message': f'Failed to create session: {str(e)}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'🚀 Starting PlayNow Multiplayer Server on port {port}')
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
