import win32api
import win32con
import win32gui
import tkinter as tk
from tkinter import ttk, messagebox
import numpy as np
import ultralytics
import threading
import math
import time
import cv2
import mss
import sys
import os
import torch
import colorsys
import hashlib
import subprocess
import requests
from datetime import datetime, timedelta
import tempfile
import shutil
import zipfile

# 🔄 SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
CURRENT_VERSION = "1.0.0"
GITHUB_REPO = "felipelahhouse/larscript"  # Repositório do Lars Aim
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
UPDATE_CHECK_FILE = "last_update_check.txt"

# KEYAUTH IMPORTS E SETUP
try:
    from keyauth import api

    def getchecksum():
        try:
            return hashlib.md5(open(sys.executable, 'rb').read()).hexdigest()
        except Exception:
            return "debug_mode"

    # Inicializar KeyAuth com suas credenciais reais
    keyauthapp = api.Keyauth(
        name = "Lars Macro", # App name 
        owner_id = "MJybaINWSR", # Account ID
        secret = "633bd926e661b6167426af61c08fe7a6a8b399d09fab0fcca559d46d4f8db723", # App secret
        version = "1.0", # Application version
        file_hash = getchecksum()
    )
    
    KEYAUTH_ENABLED = True
    print("✅ KeyAuth carregado com sucesso!")
except ImportError as e:
    print("⚠️ KeyAuth não encontrado - modo desenvolvimento")
    print(f"Erro: {e}")
    KEYAUTH_ENABLED = False
    keyauthapp = None
except Exception as e:
    print("⚠️ KeyAuth em modo desenvolvimento (credenciais inválidas)")
    print(f"Detalhes: {e}")
    # Continuar em modo desenvolvimento
    KEYAUTH_ENABLED = False
    keyauthapp = None

# 🔄 SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA
class AutoUpdater:
    def __init__(self):
        self.current_version = CURRENT_VERSION
        self.github_repo = GITHUB_REPO
        self.api_url = GITHUB_API_URL
        self.update_available = False
        self.latest_version = None
        self.download_url = None
        self.release_notes = None
        self.checking = False
        
    def check_for_updates(self, silent=False):
        """Verifica se há atualizações disponíveis no GitHub."""
        if self.checking:
            return False
            
        self.checking = True
        try:
            print(f"🔍 Verificando atualizações... (Versão atual: {self.current_version})")
            
            # Fazer requisição à API do GitHub
            headers = {'User-Agent': 'LarsAimbot-Updater'}
            response = requests.get(self.api_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                release_data = response.json()
                
                # Extrair informações da release
                self.latest_version = release_data.get('tag_name', '').replace('v', '')
                self.release_notes = release_data.get('body', 'Sem notas de atualização.')
                
                # Procurar asset .exe ou .zip
                assets = release_data.get('assets', [])
                for asset in assets:
                    name = asset.get('name', '').lower()
                    if name.endswith('.exe') or name.endswith('.zip'):
                        self.download_url = asset.get('browser_download_url')
                        break
                
                # Comparar versões
                if self._compare_versions(self.latest_version, self.current_version):
                    self.update_available = True
                    print(f"✅ Nova versão disponível: {self.latest_version}")
                    if not silent:
                        self._show_update_notification()
                    return True
                else:
                    self.update_available = False
                    print(f"✅ Você está na versão mais recente!")
                    if not silent:
                        messagebox.showinfo(
                            "Atualização",
                            f"✅ Você já está usando a versão mais recente!\n\nVersão atual: {self.current_version}"
                        )
                    return False
            else:
                print(f"⚠️ Erro ao verificar atualizações: HTTP {response.status_code}")
                if not silent:
                    messagebox.showwarning(
                        "Erro de Atualização",
                        "Não foi possível verificar atualizações.\nVerifique sua conexão com a internet."
                    )
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Erro de conexão ao verificar atualizações: {e}")
            if not silent:
                messagebox.showerror(
                    "Erro de Conexão",
                    "Não foi possível conectar ao servidor de atualizações.\nVerifique sua internet."
                )
            return False
        except Exception as e:
            print(f"❌ Erro inesperado ao verificar atualizações: {e}")
            if not silent:
                messagebox.showerror(
                    "Erro",
                    f"Erro inesperado ao verificar atualizações:\n{str(e)}"
                )
            return False
        finally:
            self.checking = False
    
    def _compare_versions(self, latest, current):
        """Compara duas versões (formato: x.y.z)."""
        try:
            latest_parts = [int(x) for x in latest.split('.')]
            current_parts = [int(x) for x in current.split('.')]
            
            # Preencher com zeros se necessário
            while len(latest_parts) < 3:
                latest_parts.append(0)
            while len(current_parts) < 3:
                current_parts.append(0)
            
            return latest_parts > current_parts
        except:
            return False
    
    def _show_update_notification(self):
        """Mostra notificação de atualização disponível."""
        message = f"🎉 Nova versão disponível!\n\n"
        message += f"Versão atual: {self.current_version}\n"
        message += f"Nova versão: {self.latest_version}\n\n"
        message += f"📝 Novidades:\n{self.release_notes[:200]}..."
        
        result = messagebox.askyesno(
            "Atualização Disponível",
            message + "\n\nDeseja atualizar agora?",
            icon='info'
        )
        
        if result:
            self.download_and_install_update()
    
    def download_and_install_update(self):
        """Baixa e instala a atualização."""
        if not self.download_url:
            messagebox.showerror(
                "Erro",
                "URL de download não encontrada."
            )
            return
        
        try:
            # Criar janela de progresso
            progress_window = tk.Toplevel()
            progress_window.title("Baixando Atualização")
            progress_window.geometry("400x150")
            progress_window.configure(bg=ModernTheme.BG_DARK)
            progress_window.resizable(False, False)
            
            # Centralizar janela
            progress_window.update_idletasks()
            x = (progress_window.winfo_screenwidth() // 2) - (400 // 2)
            y = (progress_window.winfo_screenheight() // 2) - (150 // 2)
            progress_window.geometry(f"+{x}+{y}")
            
            status_label = tk.Label(
                progress_window,
                text="Baixando atualização...",
                font=("Segoe UI", 10),
                fg=ModernTheme.TEXT_WHITE,
                bg=ModernTheme.BG_DARK
            )
            status_label.pack(pady=20)
            
            progress_bar = ttk.Progressbar(
                progress_window,
                mode='indeterminate',
                length=350
            )
            progress_bar.pack(pady=10)
            progress_bar.start(10)
            
            def download_thread():
                try:
                    # Baixar arquivo
                    response = requests.get(self.download_url, stream=True, timeout=30)
                    response.raise_for_status()
                    
                    # Salvar em arquivo temporário
                    temp_dir = tempfile.gettempdir()
                    file_ext = '.exe' if self.download_url.endswith('.exe') else '.zip'
                    temp_file = os.path.join(temp_dir, f'lars_update{file_ext}')
                    
                    with open(temp_file, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                    
                    progress_window.destroy()
                    
                    # Perguntar se quer instalar agora
                    result = messagebox.askyesno(
                        "Download Completo",
                        f"✅ Atualização baixada com sucesso!\n\n"
                        f"O programa será fechado e a atualização será instalada.\n\n"
                        f"Deseja continuar?",
                        icon='info'
                    )
                    
                    if result:
                        # Executar instalador e fechar programa
                        if file_ext == '.exe':
                            subprocess.Popen([temp_file])
                        else:
                            # Extrair ZIP e executar
                            extract_dir = os.path.join(temp_dir, 'lars_update_extracted')
                            with zipfile.ZipFile(temp_file, 'r') as zip_ref:
                                zip_ref.extractall(extract_dir)
                            
                            # Procurar .exe no diretório extraído
                            for file in os.listdir(extract_dir):
                                if file.endswith('.exe'):
                                    subprocess.Popen([os.path.join(extract_dir, file)])
                                    break
                        
                        # Fechar aplicação atual
                        sys.exit(0)
                    
                except Exception as e:
                    progress_window.destroy()
                    messagebox.showerror(
                        "Erro de Download",
                        f"Erro ao baixar atualização:\n{str(e)}"
                    )
            
            threading.Thread(target=download_thread, daemon=True).start()
            
        except Exception as e:
            messagebox.showerror(
                "Erro",
                f"Erro ao preparar download:\n{str(e)}"
            )
    
    def check_on_startup(self):
        """Verifica atualizações no startup (máximo 1x por dia)."""
        try:
            # Verificar última verificação
            if os.path.exists(UPDATE_CHECK_FILE):
                with open(UPDATE_CHECK_FILE, 'r') as f:
                    last_check = f.read().strip()
                    last_check_date = datetime.fromisoformat(last_check)
                    
                    # Se já verificou hoje, não verificar novamente
                    if (datetime.now() - last_check_date).days < 1:
                        return
            
            # Verificar atualizações silenciosamente
            threading.Thread(target=lambda: self.check_for_updates(silent=True), daemon=True).start()
            
            # Salvar data da verificação
            with open(UPDATE_CHECK_FILE, 'w') as f:
                f.write(datetime.now().isoformat())
                
        except Exception as e:
            print(f"⚠️ Erro ao verificar atualizações no startup: {e}")

# Instância global do updater
auto_updater = AutoUpdater()

# 🌈 CLASSE PARA EFEITOS RGB MODERNOS (disponível sempre)
class RGBEffects:
    def __init__(self):
        self.hue = 0
        self.rgb_active = True

    def get_rgb_color(self):
        if not self.rgb_active:
            return "#9333ea"
        r, g, b = colorsys.hsv_to_rgb(self.hue / 360.0, 1.0, 1.0)
        return f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"

    def update_hue(self):
        self.hue = (self.hue + 2) % 360

    def toggle_rgb(self):
        self.rgb_active = not self.rgb_active

# 🎨 TEMA PROFISSIONAL ROXO ESCURO E DOURADO
class ModernTheme:
    """Única definição do tema (remoção de duplicata)."""
    BG_DARK = "#1a0d2e"
    BG_MEDIUM = "#2d1b47"
    BG_LIGHT = "#3d2a5c"
    GOLD = "#ffd700"
    GOLD_DARK = "#cc9900"
    GOLD_LIGHT = "#ffeb99"
    TEXT_WHITE = "#ffffff"
    TEXT_GRAY = "#cccccc"
    TEXT_DARK = "#888888"
    SUCCESS = "#00ff88"
    ERROR = "#ff4444"
    WARNING = "#ffaa00"
    RGB_BORDER = "#9333ea"
    def __init__(self):
        self.hue = 0
        self.rgb_active = True
    def update_hue(self):
        self.hue = (self.hue + 2) % 360
    def toggle_rgb(self):
        self.rgb_active = not self.rgb_active
# from pubg_version.logic.config_watcher_pubg import cfg  # REMOVIDO
# from pubg_version.logic.pubg_hotkeys_watcher import pubgHotkeysWatcher  # REMOVIDO  
# from logic.checks import run_checks  # REMOVIDO

# 🔥 CONFIGURAÇÃO SIMPLES INTEGRADA
class SimpleConfig:
    def __init__(self):
        self.headshot_mode = True
        self.body_shot_mode = False
        self.activation_key = "Left Click"
        
cfg = SimpleConfig()  # Substituição simples

class PerfectAimbotConfig:
    def __init__(self):
        
        # CONFIGURAÇÕES PERFEITAS baseadas no YoloAimbot-main
        self.width = 1920
        self.height = 1080
        
        self.center_x = self.width // 2
        self.center_y = self.height // 2
        
        # 🔥 ÁREA DE CAPTURA REDUZIDA PARA MÁXIMA VELOCIDADE
        self.capture_width = 320  # Área menor = processamento mais rápido
        self.capture_height = 320  # Área menor = processamento mais rápido
        self.capture_left = self.center_x - self.capture_width // 2
        self.capture_top = self.center_y - self.capture_height // 2
        self.crosshairX = self.capture_width // 2  # Centro da captura
        self.crosshairY = self.capture_height // 2
        
        # 🔥 SISTEMA DE ARMAS E BOTÕES G4/G5
        self.current_weapon = "AR"  # AR ou DMR
        self.activation_button = "LEFT"  # LEFT ou RIGHT
        
        # CONFIGURAÇÕES ULTRA AGRESSIVAS PARA TRACKING PERFEITO
        self.ar_config = {
            "sensitivity": 8.0,  # Sensibilidade EXTREMA para tracking colado
            "MovementCoefficientX": 6.5,  # Movimento horizontal EXTREMO
            "MovementCoefficientY": 6.2,  # Movimento vertical EXTREMO
            "movementSteps": 1,  # MOVIMENTO ÚNICO = VELOCIDADE MÁXIMA
            "delay": 0.0,  # SEM DELAY = SEM LAG
            "radius": 480,  # FOV máximo
            "confidence_threshold": 0.10,  # Detecção ULTRA sensível
            "head_offset_factor": 0.08,  # Offset para cabeça
            "recoil_control": True,
            "recoil_strength": 6.5,  # RECOIL CONTROL EXTREMO
            "smooth_factor": 0.99  # QUASE ZERO SMOOTH = COLADO TOTAL
        }
        
        self.dmr_config = {
            "sensitivity": 5.5,  # Sensibilidade ALTA para tracking instantâneo
            "MovementCoefficientX": 5.0,  # Movimento RÁPIDO horizontal
            "MovementCoefficientY": 4.8,  # Movimento RÁPIDO vertical
            "movementSteps": 1,  # MOVIMENTO ÚNICO = SEM LAG
            "delay": 0.0,  # SEM DELAY = VELOCIDADE MÁXIMA
            "radius": 420,  # FOV bem aumentado
            "confidence_threshold": 0.13,  # Detecção MUITO sensível
            "head_offset_factor": 0.35,  # Offset para centro superior (peito)
            "target_body_part": "auto",  # MODO AUTO - GRUDA CENTRO/PEITO
            "recoil_control": True,
            "recoil_strength": 3.2,  # Recoil control forte
            "smooth_factor": 0.95  # Menos smooth para tracking colado
        }
        
        # CONFIGURAÇÕES DE PARTES DO CORPO (DMR) - OFFSETS ANATÔMICOS CORRETOS
        # Offsets ajustados para melhor precisão na cabeça e pescoço
        self.body_parts = {
            "auto": {"offset": 0.35, "name": "🎯 AUTO (Gruda Centro/Peito)"},  # Centro superior - peito
            "head": {"offset": 0.05, "name": "🎯 Head (Instant Kill)"},  # Topo da caixa
            "neck": {"offset": 0.12, "name": "🔴 Neck (Critical)"},  # Logo abaixo da cabeça
            "upper_chest": {"offset": 0.25, "name": "💥 Upper Chest (High Damage)"},  # Peito superior
            "chest": {"offset": 0.40, "name": "🎮 Chest (Good Damage)"},  # Centro do peito
            "stomach": {"offset": 0.60, "name": "🟡 Stomach (Medium Damage)"},  # Estômago
            "pelvis": {"offset": 0.75, "name": "🟠 Pelvis (Low Damage)"},  # Quadril
            "legs": {"offset": 0.85, "name": "🦵 Legs (Safe Target)"}  # Pernas
        }
        
        # REGIÃO DE CAPTURA MSS (muito mais rápido)
        self.region = {
            "top": self.capture_top,
            "left": self.capture_left,
            "width": self.capture_width,
            "height": self.capture_height
        }

        # CONFIGURAÇÕES DE AIMBOT ULTRA RÁPIDAS
        self.Running = True
        self.AimToggle = True
        self.aimbot_enabled = True  # Atributo que estava faltando
        
        # OFFSETS DA MIRA (inicializados aqui)
        self.offset_x = 0
        self.offset_y = 0
        
        # CONFIGURAÇÕES DINÂMICAS (serão atualizadas baseado na arma)
        self.update_weapon_settings()
        
        # AUTO-LOAD DAS CONFIGURAÇÕES
        self.auto_load_on_startup()
        
        # CONFIGURAÇÕES ESPECÍFICAS PUBG OTIMIZADAS
        self.max_detections = 15
        
        # ESTADO DOS BOTÕES G4/G5, Arrow Keys e G6 (para debounce)
        self.g4_pressed = False
        self.g5_pressed = False
        self.g6_pressed = False  # Para trocar body part
        self.up_pressed = False
        self.down_pressed = False
        self.left_pressed = False
        self.right_pressed = False
        
        # 🎯 SISTEMA DE TRACKING AVANÇADO
        self.last_target_pos = None
        self.target_velocity = {'x': 0, 'y': 0}
        self.tracking_history = []
        self.max_history = 5  # Últimas 5 posições para calcular velocidade
        self.prediction_factor = 0.8  # Fator de predição de movimento
        # Métrica de desempenho
        self.last_fps = 0.0
        
    def get_current_config(self):
        """Retorna configuração da arma atual"""
        return self.ar_config if self.current_weapon == "AR" else self.dmr_config
    
    def update_tracking(self, target_x, target_y):
        """Atualiza sistema de tracking com predição de movimento"""
        current_pos = {'x': target_x, 'y': target_y, 'time': time.time()}
        
        # Adicionar à história
        self.tracking_history.append(current_pos)
        if len(self.tracking_history) > self.max_history:
            self.tracking_history.pop(0)
        
        # Calcular velocidade se temos histórico suficiente
        if len(self.tracking_history) >= 2:
            latest = self.tracking_history[-1]
            previous = self.tracking_history[-2]
            
            time_diff = latest['time'] - previous['time']
            if time_diff > 0:
                self.target_velocity['x'] = (latest['x'] - previous['x']) / time_diff
                self.target_velocity['y'] = (latest['y'] - previous['y']) / time_diff
        
        self.last_target_pos = current_pos
    
    def predict_target_position(self, current_x, current_y):
        """Prediz próxima posição do alvo baseado na velocidade"""
        if len(self.tracking_history) < 2:
            return current_x, current_y
        
        # Prever posição baseado na velocidade
        predicted_x = current_x + (self.target_velocity['x'] * self.prediction_factor)
        predicted_y = current_y + (self.target_velocity['y'] * self.prediction_factor)
        
        return int(predicted_x), int(predicted_y)
    
    def update_weapon_settings(self):
        """Atualiza configurações baseado na arma atual"""
        current_config = self.get_current_config()
        
        self.Sensitivity = current_config["sensitivity"]
        self.MovementCoefficientX = current_config["MovementCoefficientX"]
        self.MovementCoefficientY = current_config["MovementCoefficientY"]
        self.movementSteps = current_config["movementSteps"]
        self.delay = current_config["delay"]
        self.radius = current_config["radius"]
        self.confidence_threshold = current_config["confidence_threshold"]
        self.head_offset_factor = current_config["head_offset_factor"]
        
        # Notifica overlay para atualização instantânea
        self._notify_overlay_update()
        
    def _notify_overlay_update(self):
        """Força atualização imediata do overlay (se existir)."""
        try:
            # Será preenchido pela GUI quando overlay for criado
            if hasattr(self, '_overlay_update_callback') and self._overlay_update_callback:
                self._overlay_update_callback()
        except:
            pass
    
    def toggle_weapon(self):
        """G4: Alternar entre AR e DMR"""
        self.current_weapon = "DMR" if self.current_weapon == "AR" else "AR"
        self.update_weapon_settings()
        
        # ✅ ATUALIZA OVERLAY EM TEMPO REAL
        self._notify_overlay_update()
        
        # Auto-save após mudança
        self.auto_save_settings()
        
        # Mostrar informação detalhada
        if self.current_weapon == "DMR":
            current_part = self.dmr_config["target_body_part"]
            part_info = self.body_parts[current_part]["name"]
            offset_value = self.body_parts[current_part]["offset"]
            print(f"🔫 Arma alterada para: {self.current_weapon} - {part_info} (offset: {offset_value:.2f})")
        else:
            ar_offset = self.ar_config["head_offset_factor"]
            print(f"🔫 Arma alterada para: {self.current_weapon} - Head targeting (offset: {ar_offset:.2f})")
        
        print(f"💾 Configurações salvas automaticamente!")
        # Atualização imediata do overlay
        self._notify_overlay_update()
        
    def toggle_activation_button(self):
        """G5: Alternar entre botão esquerdo e direito"""
        self.activation_button = "RIGHT" if self.activation_button == "LEFT" else "LEFT"
        print(f"🖱️ Botão de ativação alterado para: {self.activation_button}")
        self._notify_overlay_update()
    
    def adjust_crosshair_offset(self, direction, amount=2):
        """Ajustar offset do crosshair com arrow keys"""
        if direction == "up":
            self.offset_y -= amount
        elif direction == "down":
            self.offset_y += amount
        elif direction == "left":
            self.offset_x -= amount
        elif direction == "right":
            self.offset_x += amount
        
        # Limitar offset para valores razoáveis
        self.offset_x = max(-50, min(50, self.offset_x))
        self.offset_y = max(-50, min(50, self.offset_y))
        
        print(f"🎯 Crosshair Offset: X={self.offset_x}, Y={self.offset_y}")
    
    def reset_crosshair_offset(self):
        """Resetar offset do crosshair"""
        self.offset_x = 0
        self.offset_y = 0
        print("🎯 Crosshair Offset resetado para (0, 0)")
    
    def change_dmr_target(self):
        """Trocar parte do corpo para DMR"""
        parts = list(self.body_parts.keys())
        current_index = parts.index(self.dmr_config["target_body_part"])
        next_index = (current_index + 1) % len(parts)
        self.dmr_config["target_body_part"] = parts[next_index]
        
        # NÃO atualizar head_offset_factor - deixar o algoritmo usar body_parts diretamente
        # self.dmr_config["head_offset_factor"] = self.body_parts[new_part]["offset"]  # REMOVIDO
        
        # FORÇAR ATUALIZAÇÃO E SALVAR
        self.save_settings()
        
        # FORÇAR ATUALIZAÇÃO DAS CONFIGURAÇÕES
        if self.current_weapon == "DMR":
            self.update_weapon_settings()
        
        new_part = self.dmr_config["target_body_part"]
        part_name = self.body_parts[new_part]["name"]
        offset_value = self.body_parts[new_part]["offset"]
        print(f"🎯 DMR Target ALTERADO para: {part_name} (offset: {offset_value:.2f})")
        print(f"🔄 Configuração salva e aplicada!")
        
        return True
        
        # Auto-save
        self.auto_save_settings()
        
    def is_activation_pressed(self):
        """Verifica se botão de ativação está pressionado - DETECÇÃO SIMPLIFICADA"""
        try:
            if self.activation_button == "LEFT":
                # DETECÇÃO SIMPLES PARA BOTÃO ESQUERDO
                return win32api.GetAsyncKeyState(win32con.VK_LBUTTON) & 0x8000
            else:
                # BOTÃO DIREITO
                return win32api.GetAsyncKeyState(win32con.VK_RBUTTON) & 0x8000
        except:
            return False

    def save_settings(self, filename="lars_settings.json"):
        """Salva todas as configurações em arquivo JSON"""
        import json
        try:
            settings = {
                "current_weapon": self.current_weapon,
                "activation_button": self.activation_button,
                "ar_config": self.ar_config,
                "dmr_config": self.dmr_config,
                "offset_x": self.offset_x,
                "offset_y": self.offset_y,
                "aimbot_enabled": self.AimToggle  # Usar AimToggle em vez de aimbot_enabled
            }
            with open(filename, 'w') as f:
                json.dump(settings, f, indent=4)
            print(f"💾 Configurações salvas em: {filename}")
            return True
        except Exception as e:
            print(f"❌ Erro ao salvar configurações: {e}")
            return False

    def auto_save_settings(self):
        """Auto-save das configurações (silencioso)"""
        try:
            success = self.save_settings()
            if success:
                print("💾 AUTO-SAVE: Configurações salvas automaticamente!")
            return success
        except:
            return False

    def load_settings(self, filename="lars_settings.json"):
        """Carrega configurações do arquivo JSON"""
        import json
        import os
        try:
            if not os.path.exists(filename):
                print(f"⚠️ Arquivo {filename} não encontrado")
                return False
                
            with open(filename, 'r') as f:
                settings = json.load(f)
            
            # Restaurar configurações
            self.current_weapon = settings.get("current_weapon", "AR")
            self.activation_button = settings.get("activation_button", "LEFT")
            self.ar_config.update(settings.get("ar_config", {}))
            self.dmr_config.update(settings.get("dmr_config", {}))
            self.offset_x = settings.get("offset_x", 0)
            self.offset_y = settings.get("offset_y", 0)
            self.aimbot_enabled = settings.get("aimbot_enabled", True)
            self.AimToggle = settings.get("aimbot_enabled", True)  # Sincronizar com AimToggle
            
            # Atualizar configurações atuais
            self.update_weapon_settings()  # Corrigido: usar função que existe
            print(f"✅ Configurações carregadas de: {filename}")
            return True
        except Exception as e:
            print(f"❌ Erro ao carregar configurações: {e}")
            return False

    def auto_load_on_startup(self):
        """Carrega automaticamente as configurações na inicialização"""
        import os
        if os.path.exists("lars_settings.json"):
            success = self.load_settings()
            if success:
                print("🚀 AUTO-LOAD: Configurações carregadas automaticamente!")
            else:
                print("⚠️ AUTO-LOAD: Falha ao carregar - usando configurações padrão")
        else:
            print("💡 AUTO-LOAD: Nenhum arquivo encontrado - usando configurações padrão")

config = PerfectAimbotConfig()

# ===========================================
# SISTEMA DE AUTENTICAÇÃO KEYAUTH
# ===========================================

class LoginInterface:
    def __init__(self):
        self.authenticated = False
        self.user_data = None
        self.login_window = None
        self.hue_offset = 0
        
    def calculate_expiry_info(self, user_info):
        """Calcula informações detalhadas sobre expiração da licença"""
        try:
            username = user_info.get('username', 'User')
            
            # Tentar obter timestamp de expiração de diferentes formas
            expiry_timestamp = None
            
            # Método 1: subscriptions array
            if 'subscriptions' in user_info and user_info['subscriptions']:
                sub = user_info['subscriptions'][0] if isinstance(user_info['subscriptions'], list) else user_info['subscriptions']
                expiry_timestamp = sub.get('expiry', 0)
            
            # Método 2: campo direto expiry
            if not expiry_timestamp and 'expiry' in user_info:
                expiry_timestamp = user_info.get('expiry', 0)
                
            # Método 3: subscription_expiry
            if not expiry_timestamp and 'subscription_expiry' in user_info:
                expiry_timestamp = user_info.get('subscription_expiry', 0)
            
            print(f"🔍 Debug - Expiry timestamp: {expiry_timestamp}")
            print(f"🔍 Debug - User info keys: {list(user_info.keys())}")
            
            if expiry_timestamp and str(expiry_timestamp) != "0":
                try:
                    # Converter para int se for string
                    if isinstance(expiry_timestamp, str):
                        expiry_timestamp = int(expiry_timestamp)
                    
                    # Criar datetime a partir do timestamp
                    expiry_date = datetime.fromtimestamp(expiry_timestamp)
                    current_date = datetime.now()
                    
                    # Calcular diferença
                    time_diff = expiry_date - current_date
                    days_left = time_diff.days
                    hours_left = time_diff.seconds // 3600
                    
                    # Verificar se expirou
                    if days_left < 0:
                        raise Exception("License has expired")
                    
                    # Determinar status da licença
                    if days_left > 30:
                        status = "🟢 ACTIVE"
                        status_color = "#4CAF50"
                    elif days_left > 7:
                        status = "🟡 EXPIRING SOON"
                        status_color = "#FF9800"
                    else:
                        status = "🔴 EXPIRES VERY SOON"
                        status_color = "#f44336"
                    
                    # Formato de expiração mais detalhado
                    expiry_str = expiry_date.strftime('%d/%m/%Y at %H:%M')
                    
                    return {
                        'username': username,
                        'expiry_date': expiry_str,
                        'expiry_timestamp': expiry_timestamp,
                        'days_left': days_left,
                        'hours_left': hours_left,
                        'status': status,
                        'status_color': status_color,
                        'is_lifetime': False
                    }
                    
                except Exception as e:
                    print(f"❌ Erro ao processar timestamp: {e}")
                    # Fallback para lifetime se erro
                    pass
            
            # Se chegou aqui, é lifetime ou não tem data de expiração
            return {
                'username': username,
                'expiry_date': 'Lifetime',
                'expiry_timestamp': 0,
                'days_left': 999999,
                'hours_left': 0,
                'status': '♾️ LIFETIME',
                'status_color': '#9C27B0',
                'is_lifetime': True
            }
            
        except Exception as e:
            print(f"❌ Erro em calculate_expiry_info: {e}")
            # Retorno de emergência
            return {
                'username': 'User',
                'expiry_date': 'Unknown',
                'expiry_timestamp': 0,
                'days_left': 0,
                'hours_left': 0,
                'status': '❓ UNKNOWN',
                'status_color': '#757575',
                'is_lifetime': False
            }
        
    def create_login_window(self):
        """Cria interface de login animada com RGB"""
        self.login_window = tk.Tk()
        self.login_window.title("🔐 LARS SERVICE AIM - Authentication")
        self.login_window.geometry("500x700")
        self.login_window.configure(bg='#0a0a0a')
        self.login_window.resizable(False, False)
        
        # Centralizar janela
        self.login_window.eval('tk::PlaceWindow . center')
        
        # Remover barra de título (opcional)
        # self.login_window.overrideredirect(True)
        
        # HEADER COM RGB ANIMADO
        header_frame = tk.Frame(self.login_window, bg='#1a1a2e', height=80)
        header_frame.pack(fill='x')
        header_frame.pack_propagate(False)
        
        # BORDAS RGB ANIMADAS
        rgb_border_top = tk.Frame(self.login_window, bg='#9333ea', height=4)
        rgb_border_top.pack(fill='x')
        
        # LOGO E TÍTULO
        logo_frame = tk.Frame(header_frame, bg='#1a1a2e')
        logo_frame.pack(expand=True, fill='both')
        
        title_label = tk.Label(logo_frame, text="🎯 LARS SERVICE AIM", 
                              font=("Segoe UI", 18, "bold"), 
                              fg='#ffd700', bg='#1a1a2e')
        title_label.pack(pady=10)
        
        subtitle_label = tk.Label(logo_frame, text="Professional Targeting System", 
                                 font=("Segoe UI", 10), 
                                 fg='#cccccc', bg='#1a1a2e')
        subtitle_label.pack()
        
        # CONTAINER PRINCIPAL
        main_frame = tk.Frame(self.login_window, bg='#0a0a0a')
        main_frame.pack(fill='both', expand=True, padx=30, pady=20)
        
        # STATUS DE CONEXÃO
        connection_frame = tk.Frame(main_frame, bg='#1a1a2e', relief='solid', bd=1)
        connection_frame.pack(fill='x', pady=(0, 20))
        
        tk.Label(connection_frame, text="🌐 CONNECTION STATUS", 
                font=("Segoe UI", 9, "bold"), fg='#ffd700', bg='#1a1a2e').pack(pady=5)
        
        self.connection_label = tk.Label(connection_frame, text="🔄 Connecting to KeyAuth servers...", 
                                        font=("Segoe UI", 8), fg='#ffaa00', bg='#1a1a2e')
        self.connection_label.pack(pady=5)
        
        # CAMPO DE LICENSE KEY
        key_frame = tk.Frame(main_frame, bg='#0a0a0a')
        key_frame.pack(fill='x', pady=10)
        
        tk.Label(key_frame, text="🔑 LICENSE KEY", 
                font=("Segoe UI", 12, "bold"), fg='#ffd700', bg='#0a0a0a').pack(anchor='w', pady=(0, 5))
        
        # Entry com estilo moderno
        entry_frame = tk.Frame(key_frame, bg='#2d2d4a', relief='solid', bd=1)
        entry_frame.pack(fill='x', pady=5)
        
        self.key_entry = tk.Entry(entry_frame, font=("Consolas", 11), 
                                 bg='#2d2d4a', fg='white', bd=0, 
                                 insertbackground='#ffd700')
        self.key_entry.pack(fill='x', padx=10, pady=8)
        self.key_entry.bind('<Return>', lambda e: self.authenticate())
        
        # INFORMAÇÕES DA KEY
        info_frame = tk.Frame(main_frame, bg='#1a1a2e', relief='solid', bd=1)
        info_frame.pack(fill='x', pady=10)
        
        tk.Label(info_frame, text="📊 KEY INFORMATION", 
                font=("Segoe UI", 9, "bold"), fg='#ffd700', bg='#1a1a2e').pack(pady=5)
        
        self.key_info_label = tk.Label(info_frame, text="Enter your license key to view information", 
                                      font=("Segoe UI", 8), fg='#cccccc', bg='#1a1a2e')
        self.key_info_label.pack(pady=5)
        
        self.expiry_label = tk.Label(info_frame, text="", 
                                    font=("Segoe UI", 8), fg='#cccccc', bg='#1a1a2e')
        self.expiry_label.pack(pady=2)
        
        # BOTÕES
        button_frame = tk.Frame(main_frame, bg='#0a0a0a')
        button_frame.pack(fill='x', pady=20)
        
        # Botão Authenticate
        self.auth_button = tk.Button(button_frame, text="🔐 AUTHENTICATE", 
                                    command=self.authenticate,
                                    bg='#4CAF50', fg='white', 
                                    font=("Segoe UI", 12, "bold"),
                                    relief='flat', bd=0, pady=12,
                                    activebackground='#45a049')
        self.auth_button.pack(fill='x', pady=5)
        
        # Botão Exit
        exit_button = tk.Button(button_frame, text="❌ EXIT", 
                               command=self.exit_application,
                               bg='#f44336', fg='white', 
                               font=("Segoe UI", 10, "bold"),
                               relief='flat', bd=0, pady=8,
                               activebackground='#d32f2f')
        exit_button.pack(fill='x', pady=5)
        
        # FOOTER
        footer_frame = tk.Frame(self.login_window, bg='#1a1a2e', height=50)
        footer_frame.pack(fill='x', side='bottom')
        footer_frame.pack_propagate(False)
        
        footer_text = tk.Label(footer_frame, text="Protected by KeyAuth™ | Lars Service Aim v1.0", 
                              font=("Segoe UI", 8), fg='#666666', bg='#1a1a2e')
        footer_text.pack(expand=True)
        
        # BORDA RGB INFERIOR
        rgb_border_bottom = tk.Frame(self.login_window, bg='#9333ea', height=4)
        rgb_border_bottom.pack(fill='x', side='bottom')
        
        # Armazenar referências para animação RGB
        self.rgb_borders = [rgb_border_top, rgb_border_bottom]
        
        # Inicializar conexão com KeyAuth
        self.check_keyauth_connection()
        
        # Iniciar animação RGB
        self.animate_rgb_login()
        
        # Focar no campo de entrada
        self.key_entry.focus()
        
        return self.login_window
    
    def animate_rgb_login(self):
        """Animação RGB para interface de login"""
        self.hue_offset += 0.01
        if self.hue_offset > 1:
            self.hue_offset = 0
            
        # Converter HSV para RGB
        r, g, b = colorsys.hsv_to_rgb(self.hue_offset, 0.8, 0.9)
        color = f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
        
        # Atualizar bordas RGB
        for border in self.rgb_borders:
            try:
                border.config(bg=color)
            except:
                return  # Janela foi fechada
                
        # Continuar animação se janela ainda existe
        if self.login_window and self.login_window.winfo_exists():
            self.login_window.after(50, self.animate_rgb_login)
    
    def check_keyauth_connection(self):
        """Verifica conexão com KeyAuth"""
        def check():
            try:
                if KEYAUTH_ENABLED and keyauthapp:
                    # Verificar se já foi inicializado
                    if not hasattr(keyauthapp, '_initialized') or not keyauthapp._initialized:
                        keyauthapp.init()
                        keyauthapp._initialized = True
                    self.connection_label.config(text="✅ Connected to KeyAuth servers", fg='#4CAF50')
                else:
                    self.connection_label.config(text="⚠️ Development mode - KeyAuth disabled", fg='#ffaa00')
            except Exception as e:
                error_msg = str(e)
                if "already initialized" in error_msg.lower():
                    self.connection_label.config(text="✅ Connected to KeyAuth servers", fg='#4CAF50')
                else:
                    self.connection_label.config(text=f"❌ Connection failed: {str(e)[:30]}...", fg='#f44336')
        
        # Executar verificação em thread separada
        threading.Thread(target=check, daemon=True).start()
    
    def authenticate(self):
        """Realiza autenticação com KeyAuth"""
        license_key = self.key_entry.get().strip()
        
        if not license_key:
            messagebox.showerror("Error", "Please enter your license key!")
            return
        
        # Desabilitar botão durante autenticação
        self.auth_button.config(state='disabled', text='🔄 AUTHENTICATING...')
        
        def auth_thread():
            try:
                # MODO BYPASS TEMPORÁRIO - ACEITA QUALQUER KEY
                # TODO: Configurar KeyAuth corretamente
                if len(license_key) > 5:  # Qualquer key com mais de 5 caracteres
                    self.user_data = {
                        'username': 'Licensed User',
                        'expiry_date': 'Lifetime',
                        'expiry_timestamp': 0,
                        'days_left': 999999,
                        'hours_left': 0,
                        'status': '✅ ACTIVE',
                        'status_color': '#00ff88',
                        'is_lifetime': True
                    }
                    self.authenticated = True
                    
                    # Atualizar interface com sucesso
                    self.login_window.after(0, self.authentication_success)
                    return
                
                if KEYAUTH_ENABLED and keyauthapp:
                    # Tentar autenticar com KeyAuth
                    keyauthapp.license(license_key)
                    
                    # Se chegou aqui, autenticação foi bem-sucedida
                    # Criar dados do usuário a partir do KeyAuth
                    user_info = {
                        'username': getattr(keyauthapp, 'username', 'User'),
                        'subscription': getattr(keyauthapp, 'subscription', 'Unknown'),
                        'expiry': getattr(keyauthapp, 'expiry', '2099-12-31')
                    }
                    
                    # SISTEMA DE EXPIRAÇÃO MELHORADO
                    self.user_data = self.calculate_expiry_info(user_info)
                    
                    self.authenticated = True
                    
                    # Atualizar interface com sucesso
                    self.login_window.after(0, self.authentication_success)
                    
                else:
                    # Modo desenvolvimento - sempre permitir
                    if license_key.lower() in ['dev', 'debug', 'test']:
                        self.user_data = {
                            'username': 'Developer',
                            'expiry_date': 'Development Mode',
                            'expiry_timestamp': 0,
                            'days_left': 999999,
                            'hours_left': 0,
                            'status': '🚀 DEV MODE',
                            'status_color': '#00BCD4',
                            'is_lifetime': True
                        }
                        self.authenticated = True
                        self.login_window.after(0, self.authentication_success)
                    else:
                        raise Exception("KeyAuth not available - use 'dev' for testing")
                    
            except Exception as e:
                error_msg = str(e)
                if "KeyAuth" in error_msg:
                    error_msg = "Invalid license key or expired subscription"
                
                # Atualizar interface com erro
                self.login_window.after(0, lambda: self.authentication_failed(error_msg))
        
        # Executar autenticação em thread separada
        threading.Thread(target=auth_thread, daemon=True).start()
    
    def authentication_success(self):
        """Chamado quando autenticação é bem-sucedida"""
        user_data = self.user_data
        
        # Atualizar informações do usuário
        welcome_text = f"✅ Welcome, {user_data['username']}! {user_data['status']}"
        self.key_info_label.config(text=welcome_text, fg=user_data['status_color'])
        
        # Mostrar informações de expiração detalhadas
        if user_data['is_lifetime']:
            expiry_text = "♾️ Lifetime License - Never Expires!"
        else:
            if user_data['days_left'] > 0:
                if user_data['days_left'] == 1:
                    expiry_text = f"⚠️ Expires: {user_data['expiry_date']} (TOMORROW - {user_data['hours_left']}h left!)"
                else:
                    expiry_text = f"⏰ Expires: {user_data['expiry_date']} ({user_data['days_left']} days left)"
            else:
                expiry_text = f"🔴 EXPIRED: {user_data['expiry_date']}"
        
        self.expiry_label.config(text=expiry_text, fg='#cccccc')
        
        # Atualizar botão baseado no status
        if user_data['days_left'] < 3 and not user_data['is_lifetime']:
            button_text = '⚠️ AUTHENTICATED - EXPIRES SOON!'
            button_color = '#FF9800'
        else:
            button_text = '✅ AUTHENTICATED - STARTING...'
            button_color = '#4CAF50'
            
        self.auth_button.config(state='normal', text=button_text, bg=button_color)
        
        # Aguardar um pouco e fechar janela
        self.login_window.after(2000, self.close_login)
    
    def authentication_failed(self, error_msg):
        """Chamado quando autenticação falha"""
        self.auth_button.config(state='normal', text='🔐 AUTHENTICATE', bg='#4CAF50')
        messagebox.showerror("Authentication Failed", f"❌ {error_msg}\n\nPlease check your license key and try again.")
        self.key_entry.delete(0, tk.END)
        self.key_entry.focus()
    
    def close_login(self):
        """Fecha janela de login"""
        if self.login_window:
            self.login_window.destroy()
    
    def exit_application(self):
        """Sai da aplicação"""
        self.authenticated = False
        if self.login_window:
            self.login_window.destroy()
        sys.exit(0)
    
    def show_login(self):
        """Mostra interface de login e aguarda autenticação"""
        self.create_login_window()
        self.login_window.mainloop()
        return self.authenticated, self.user_data

def CreateOverlay(user_info=None, on_close_callback=None):
    """Cria a interface principal SEM ser executada em thread secundária.
    user_info: dict com dados do usuário autenticado
    on_close_callback: função chamada ao fechar janela para encerrar loops
    """
    rgb_effects = RGBEffects()
    theme = ModernTheme()
    root = tk.Tk()
    root.title("🎯 LARS SERVICE AIM - Professional Targeting")
    root.geometry('900x600')  # Tamanho compacto
    root.configure(bg=theme.BG_DARK)  # Fundo roxo escuro
    root.minsize(850, 550)  # Tamanho mínimo menor
    root.resizable(True, True)
    
    # 🌈 FRAME RGB ANIMADO NA BORDA SUPERIOR
    rgb_border_top = tk.Frame(root, bg=theme.RGB_BORDER, height=4)
    rgb_border_top.pack(fill='x', side='top')
    
    # HEADER ULTRA MODERNO
    header_frame = tk.Frame(root, bg=theme.BG_MEDIUM, height=65)
    header_frame.pack(fill='x', padx=8, pady=4)
    header_frame.pack_propagate(False)
    
    # CONTAINER HORIZONTAL PARA TÍTULO E INFORMAÇÕES DO USUÁRIO
    header_content = tk.Frame(header_frame, bg=theme.BG_MEDIUM)
    header_content.pack(fill='both', expand=True, pady=5)
    
    # TÍTULO À ESQUERDA
    title_frame = tk.Frame(header_content, bg=theme.BG_MEDIUM)
    title_frame.pack(side='left', fill='y')
    
    title_label = tk.Label(title_frame, 
                          text="🎯 LARS SERVICE AIM", 
                          font=("Segoe UI", 16, "bold"), 
                          fg=theme.GOLD, 
                          bg=theme.BG_MEDIUM)
    title_label.pack(anchor='w', pady=2)
    
    version_label = tk.Label(title_frame, 
                            text=f"Professional Targeting System v{CURRENT_VERSION}", 
                            font=("Segoe UI", 8), 
                            fg='#888888', 
                            bg=theme.BG_MEDIUM)
    version_label.pack(anchor='w')
    
    # INFORMAÇÕES DO USUÁRIO À DIREITA
    # user_info já recebido como argumento (evita acessar main.user_data em outros threads)
    if user_info:
        # FRAME DO USUÁRIO À DIREITA
        user_frame = tk.Frame(header_content, bg=theme.BG_MEDIUM)
        user_frame.pack(side='right', fill='y', padx=(10, 0))
        
        # INFORMAÇÕES DO USUÁRIO (linha 1 - usuário e status)
        user_top_frame = tk.Frame(user_frame, bg=theme.BG_MEDIUM)
        user_top_frame.pack(anchor='e', pady=1)
        
        username_label = tk.Label(user_top_frame, 
                                 text=f"👤 {user_info['username']} | {user_info['status']}", 
                                 font=("Segoe UI", 10, "bold"), 
                                 fg=user_info.get('status_color', '#cccccc'), 
                                 bg=theme.BG_MEDIUM)
        username_label.pack(anchor='e')
        
        # INFORMAÇÕES DE EXPIRAÇÃO (linha 2 - mais detalhada)
        user_bottom_frame = tk.Frame(user_frame, bg=theme.BG_MEDIUM)
        user_bottom_frame.pack(anchor='e', pady=1)
        
        if user_info['is_lifetime']:
            expiry_text = "♾️ Lifetime License"
            expiry_color = '#9C27B0'
        else:
            if user_info['days_left'] > 0:
                if user_info['days_left'] == 1:
                    expiry_text = f"⚠️ EXPIRES TOMORROW ({user_info['hours_left']}h left)"
                    expiry_color = '#f44336'
                elif user_info['days_left'] <= 7:
                    expiry_text = f" {user_info['days_left']} days left"
                    expiry_color = '#f44336'
                elif user_info['days_left'] <= 30:
                    expiry_text = f"� {user_info['days_left']} days left"
                    expiry_color = '#FF9800'
                else:
                    expiry_text = f"📅 {user_info['days_left']} days left"
                    expiry_color = '#4CAF50'
            else:
                expiry_text = f"🔴 EXPIRED"
                expiry_color = '#f44336'
        
        expiry_label = tk.Label(user_bottom_frame, 
                               text=expiry_text, 
                               font=("Segoe UI", 9), 
                               fg=expiry_color, 
                               bg=theme.BG_MEDIUM)
        expiry_label.pack(anchor='e')
    
    # FRAME PRINCIPAL COM SISTEMA DE ABAS
    main_frame = tk.Frame(root, bg=theme.BG_DARK)
    main_frame.pack(fill='both', expand=True, padx=8, pady=4)
    
    # CRIANDO NOTEBOOK (SISTEMA DE ABAS)
    style = ttk.Style()
    style.theme_use('clam')
    style.configure('TNotebook', background=theme.BG_DARK, borderwidth=0)
    style.configure('TNotebook.Tab', background=theme.BG_MEDIUM, foreground=theme.GOLD, 
                   padding=[20, 10], focuscolor='none')
    style.map('TNotebook.Tab', background=[('selected', theme.GOLD)], 
              foreground=[('selected', theme.BG_DARK)])
    
    notebook = ttk.Notebook(main_frame, style='TNotebook')
    notebook.pack(fill='both', expand=True, padx=5, pady=5)
    
    # ABA 1: ULTRA CONTROLS (AR)
    ar_tab = tk.Frame(notebook, bg=theme.BG_LIGHT)
    notebook.add(ar_tab, text='🔫 ULTRA CONTROLS (AR)')
    
    # ABA 2: DMR SETTINGS 
    dmr_tab = tk.Frame(notebook, bg=theme.BG_LIGHT)
    notebook.add(dmr_tab, text='🎯 DMR SETTINGS')
    
    # ABA 3: SYSTEM STATUS
    status_tab = tk.Frame(notebook, bg=theme.BG_LIGHT)
    notebook.add(status_tab, text='📊 SYSTEM STATUS')
    
    # ABA 4: SETTINGS MANAGER
    settings_tab = tk.Frame(notebook, bg=theme.BG_LIGHT)
    notebook.add(settings_tab, text='⚙️ SETTINGS')
    
    # ===========================================
    # CONFIGURANDO ABA AR (ULTRA CONTROLS)
    # ===========================================
    
    # Header AR
    ar_header = tk.Frame(ar_tab, bg=theme.GOLD, height=40)
    ar_header.pack(fill='x', padx=5, pady=5)
    ar_header.pack_propagate(False)
    
    ar_title = tk.Label(ar_header, text="🔫 ASSAULT RIFLE ULTRA CONTROLS - 700M OPTIMIZED", 
                       font=("Segoe UI", 12, "bold"), fg=theme.BG_DARK, bg=theme.GOLD)
    ar_title.pack(pady=10)
    
    # Canvas e Scrollbar para AR
    ar_canvas = tk.Canvas(ar_tab, bg=theme.BG_LIGHT, highlightthickness=0)
    ar_scrollbar = ttk.Scrollbar(ar_tab, orient="vertical", command=ar_canvas.yview)
    ar_frame = tk.Frame(ar_canvas, bg=theme.BG_LIGHT)
    
    ar_frame.bind(
        "<Configure>",
        lambda e: ar_canvas.configure(scrollregion=ar_canvas.bbox("all"))
    )
    
    ar_canvas.create_window((0, 0), window=ar_frame, anchor="nw")
    ar_canvas.configure(yscrollcommand=ar_scrollbar.set)
    
    ar_canvas.pack(side="left", fill="both", expand=True, padx=3, pady=3)
    ar_scrollbar.pack(side="right", fill="y", pady=3)
    
    # ===========================================
    # CONFIGURANDO ABA DMR SETTINGS
    # ===========================================
    
    # Header DMR
    dmr_header = tk.Frame(dmr_tab, bg=theme.GOLD, height=40)
    dmr_header.pack(fill='x', padx=5, pady=5)
    dmr_header.pack_propagate(False)
    
    dmr_title = tk.Label(dmr_header, text="🎯 DMR SNIPER SETTINGS - BODY TARGET SYSTEM", 
                        font=("Segoe UI", 12, "bold"), fg=theme.BG_DARK, bg=theme.GOLD)
    dmr_title.pack(pady=10)
    
    # Canvas e Scrollbar para DMR
    dmr_canvas = tk.Canvas(dmr_tab, bg=theme.BG_LIGHT, highlightthickness=0)
    dmr_scrollbar = ttk.Scrollbar(dmr_tab, orient="vertical", command=dmr_canvas.yview)
    dmr_frame = tk.Frame(dmr_canvas, bg=theme.BG_LIGHT)
    
    dmr_frame.bind(
        "<Configure>",
        lambda e: dmr_canvas.configure(scrollregion=dmr_canvas.bbox("all"))
    )
    
    dmr_canvas.create_window((0, 0), window=dmr_frame, anchor="nw")
    dmr_canvas.configure(yscrollcommand=dmr_scrollbar.set)
    
    dmr_canvas.pack(side="left", fill="both", expand=True, padx=3, pady=3)
    dmr_scrollbar.pack(side="right", fill="y", pady=3)
    
    # ===========================================
    # CONFIGURANDO ABA SYSTEM STATUS
    # ===========================================
    
    # Header Status
    status_header = tk.Frame(status_tab, bg=theme.GOLD, height=40)
    status_header.pack(fill='x', padx=5, pady=5)
    status_header.pack_propagate(False)
    
    status_title = tk.Label(status_header, text="📊 SYSTEM STATUS & CONTROLS", 
                           font=("Segoe UI", 12, "bold"), fg=theme.BG_DARK, bg=theme.GOLD)
    status_title.pack(pady=10)
    
    # Canvas e Scrollbar para Status
    control_canvas = tk.Canvas(status_tab, bg=theme.BG_LIGHT, highlightthickness=0)
    control_scrollbar = ttk.Scrollbar(status_tab, orient="vertical", command=control_canvas.yview)
    control_frame = tk.Frame(control_canvas, bg=theme.BG_LIGHT)
    
    control_frame.bind(
        "<Configure>",
        lambda e: control_canvas.configure(scrollregion=control_canvas.bbox("all"))
    )
    
    control_canvas.create_window((0, 0), window=control_frame, anchor="nw")
    control_canvas.configure(yscrollcommand=control_scrollbar.set)
    
    control_canvas.pack(side="left", fill="both", expand=True, padx=3, pady=3)
    control_scrollbar.pack(side="right", fill="y", pady=3)
    
    # FUNÇÃO PARA SCROLL COM MOUSE WHEEL
    def _on_mousewheel(event, canvas):
        """Função para scroll com roda do mouse"""
        scroll_amount = int(round(-1 * (event.delta / 120)))
        canvas.yview_scroll(scroll_amount, "units")
    
    def bind_mousewheel(canvas, frame):
        """Bind mouse wheel para canvas e frame"""
        def on_enter(event):
            canvas.bind_all("<MouseWheel>", lambda e: _on_mousewheel(e, canvas))
        def on_leave(event):
            canvas.unbind_all("<MouseWheel>")
        
        canvas.bind('<Enter>', on_enter)
        canvas.bind('<Leave>', on_leave)
        frame.bind('<Enter>', on_enter)
        frame.bind('<Leave>', on_leave)
    
    # Aplicar mouse wheel scroll em todas as seções
    bind_mousewheel(ar_canvas, ar_frame)
    bind_mousewheel(dmr_canvas, dmr_frame)
    bind_mousewheel(control_canvas, control_frame)
    
    # FUNÇÕES AUXILIARES ULTRA MODERNAS
    def create_weapon_slider(parent, label_text, from_val, to_val, resolution, weapon_type, config_key, current_value):
        """Criar slider moderno específico para arma"""
        frame = tk.Frame(parent, bg=parent['bg'])
        frame.pack(fill='x', padx=6, pady=2)
        
        # Label moderno com cor dourada
        label = tk.Label(frame, text=label_text, font=("Segoe UI", 9, "bold"), 
                        fg=theme.GOLD, bg=parent['bg'])
        label.pack()
        
        def update_config(value):
            if weapon_type == "AR":
                config.ar_config[config_key] = float(value)
            else:
                config.dmr_config[config_key] = float(value)
            
            # Atualizar configurações se arma atual
            if config.current_weapon == weapon_type:
                config.update_weapon_settings()
            
            # Força atualização imediata do overlay
            try:
                update_mini_overlay_now()
            except:
                pass
        
        # Slider moderno com estilo dourado
        slider = tk.Scale(frame, from_=from_val, to=to_val, resolution=resolution,
                         orient='horizontal', command=update_config, 
                         bg=theme.BG_MEDIUM, fg=theme.TEXT_WHITE, 
                         highlightbackground=theme.GOLD, 
                         activebackground=theme.GOLD_DARK,
                         troughcolor=theme.BG_DARK,
                         length=200, font=("Segoe UI", 8, "bold"))
        slider.pack(fill='x', pady=2)
        slider.set(current_value)
        
        return slider
    
    def create_general_slider(parent, label_text, from_val, to_val, resolution, command, current_value):
        """Criar slider moderno para controles gerais"""
        frame = tk.Frame(parent, bg=parent['bg'])
        frame.pack(fill='x', padx=6, pady=2)
        
        # Label moderno com cor dourada
        label = tk.Label(frame, text=label_text, font=("Segoe UI", 9, "bold"), 
                        fg=theme.GOLD, bg=parent['bg'])
        label.pack()
        
        # Wrapper para comando que atualiza overlay
        def wrapped_command(value):
            command(value)
            try:
                update_mini_overlay_now()
            except:
                pass
        
        # Slider moderno com estilo dourado
        slider = tk.Scale(frame, from_=from_val, to=to_val, resolution=resolution,
                         orient='horizontal', command=wrapped_command, 
                         bg=theme.BG_MEDIUM, fg=theme.TEXT_WHITE,
                         highlightbackground=theme.GOLD,
                         activebackground=theme.GOLD_DARK,
                         troughcolor=theme.BG_DARK,
                         length=200, font=("Segoe UI", 8, "bold"))
        slider.pack(fill='x', pady=2)
        slider.set(current_value)
        
        return slider
    
    # 🔫 CONTROLES AR (ORGANIZADOS LOGICAMENTE)
    create_weapon_slider(ar_frame, "🎯 Sensitivity", 0.1, 3.0, 0.1, "AR", "sensitivity", config.ar_config["sensitivity"])
    create_weapon_slider(ar_frame, "🔵 FOV Radius", 50, 200, 10, "AR", "radius", config.ar_config["radius"])
    create_weapon_slider(ar_frame, "📊 Confidence", 0.1, 0.8, 0.05, "AR", "confidence_threshold", config.ar_config["confidence_threshold"])
    create_weapon_slider(ar_frame, "🎪 Head Offset", 0.0, 0.5, 0.01, "AR", "head_offset_factor", config.ar_config["head_offset_factor"])
    create_weapon_slider(ar_frame, "↔️ Speed X", 0.5, 3.0, 0.1, "AR", "MovementCoefficientX", config.ar_config["MovementCoefficientX"])
    create_weapon_slider(ar_frame, "↕️ Speed Y", 0.5, 3.0, 0.1, "AR", "MovementCoefficientY", config.ar_config["MovementCoefficientY"])
    create_weapon_slider(ar_frame, "👣 Steps", 1, 5, 1, "AR", "movementSteps", config.ar_config["movementSteps"])
    create_weapon_slider(ar_frame, "⏱️ Delay", 0.001, 0.01, 0.001, "AR", "delay", config.ar_config["delay"])
    create_weapon_slider(ar_frame, "💥 Recoil", 0.5, 5.0, 0.1, "AR", "recoil_strength", config.ar_config["recoil_strength"])
    
    # Toggle Recoil AR (compacto)
    ar_recoil_var = tk.BooleanVar(value=config.ar_config["recoil_control"])
    def toggle_ar_recoil():
        config.ar_config["recoil_control"] = ar_recoil_var.get()
        if config.current_weapon == "AR":
            config.update_weapon_settings()
        # Atualiza overlay imediatamente
        try:
            update_mini_overlay_now()
        except:
            pass
    
    ar_recoil_check = tk.Checkbutton(ar_frame, text="🎮 Recoil Control", variable=ar_recoil_var,
                                    command=toggle_ar_recoil, fg='white', bg='#2d4a2d',
                                    selectcolor='#1a1a1a', font=("Segoe UI", 8))
    ar_recoil_check.pack(pady=2)
    
    # === CONTROLES DE OFFSET EXCLUSIVOS PARA AR ===
    tk.Frame(ar_frame, height=2, bg=theme.GOLD).pack(fill='x', padx=5, pady=5)
    
    offset_frame = tk.Frame(ar_frame, bg=theme.BG_LIGHT, relief='solid', bd=1)
    offset_frame.pack(fill='x', padx=5, pady=5)
    
    tk.Label(offset_frame, text="🎯 AR CROSSHAIR OFFSET:", 
             font=("Segoe UI", 9, "bold"), fg=theme.SUCCESS, bg=theme.BG_LIGHT).pack(pady=3)
    
    # Offset X para AR
    create_general_slider(offset_frame, "↔️ Offset X", -50, 50, 1, 
                         lambda x: setattr(config, 'offset_x', int(x)), 0)
    
    # Offset Y para AR  
    create_general_slider(offset_frame, "↕️ Offset Y", -50, 50, 1, 
                         lambda y: setattr(config, 'offset_y', int(y)), 0)
    
    # 🎯 CONTROLES DMR (ORGANIZADOS LOGICAMENTE)
    
    # === SELEÇÃO DE PARTE DO CORPO ===
    body_part_frame = tk.Frame(dmr_frame, bg=theme.BG_LIGHT, relief='solid', bd=1)
    body_part_frame.pack(fill='x', padx=5, pady=5)
    
    tk.Label(body_part_frame, text="🎯 TARGET BODY PART:", 
             font=("Segoe UI", 9, "bold"), fg=theme.SUCCESS, bg=theme.BG_LIGHT).pack(pady=3)
    
    # Variável para o seletor de partes do corpo
    body_part_var = tk.StringVar(value=config.dmr_config["target_body_part"])
    
    def change_body_part():
        selected_part = body_part_var.get()
        config.dmr_config["target_body_part"] = selected_part
        config.dmr_config["head_offset_factor"] = config.body_parts[selected_part]["offset"]
        print(f"🎯 DMR Target: {config.body_parts[selected_part]['name']}")
        # Atualiza overlay imediatamente quando troca body part
        try:
            update_mini_overlay_now()
        except:
            pass
    
    # Radio buttons para cada parte do corpo
    for part_key, part_info in config.body_parts.items():
        rb = tk.Radiobutton(body_part_frame, text=part_info["name"], 
                           variable=body_part_var, value=part_key,
                           command=change_body_part, fg='white', bg=theme.BG_LIGHT,
                           selectcolor='#1a1a1a', font=("Segoe UI", 8))
        rb.pack(anchor='w', padx=10, pady=2)
    
    # Separador
    tk.Frame(dmr_frame, height=2, bg=theme.GOLD).pack(fill='x', padx=5, pady=5)
    
    # === CONTROLES TÉCNICOS ===
    create_weapon_slider(dmr_frame, "🎯 Sensitivity", 0.1, 3.0, 0.1, "DMR", "sensitivity", config.dmr_config["sensitivity"])
    create_weapon_slider(dmr_frame, "🔵 FOV Radius", 50, 400, 10, "DMR", "radius", config.dmr_config["radius"])
    create_weapon_slider(dmr_frame, "📊 Confidence", 0.1, 0.8, 0.05, "DMR", "confidence_threshold", config.dmr_config["confidence_threshold"])
    create_weapon_slider(dmr_frame, "↔️ Speed X", 0.5, 3.0, 0.1, "DMR", "MovementCoefficientX", config.dmr_config["MovementCoefficientX"])
    create_weapon_slider(dmr_frame, "↕️ Speed Y", 0.5, 3.0, 0.1, "DMR", "MovementCoefficientY", config.dmr_config["MovementCoefficientY"])
    create_weapon_slider(dmr_frame, "👣 Steps", 1, 5, 1, "DMR", "movementSteps", config.dmr_config["movementSteps"])
    create_weapon_slider(dmr_frame, "⏱️ Delay", 0.001, 0.01, 0.001, "DMR", "delay", config.dmr_config["delay"])
    create_weapon_slider(dmr_frame, "💥 Recoil", 0.5, 5.0, 0.1, "DMR", "recoil_strength", config.dmr_config["recoil_strength"])
    
    # Toggle Recoil DMR (compacto)
    dmr_recoil_var = tk.BooleanVar(value=config.dmr_config["recoil_control"])
    def toggle_dmr_recoil():
        config.dmr_config["recoil_control"] = dmr_recoil_var.get()
        if config.current_weapon == "DMR":
            config.update_weapon_settings()
        # Atualiza overlay imediatamente
        try:
            update_mini_overlay_now()
        except:
            pass
    
    dmr_recoil_check = tk.Checkbutton(dmr_frame, text="🎮 Recoil Control", variable=dmr_recoil_var,
                                     command=toggle_dmr_recoil, fg='white', bg='#4a2d2d',
                                     selectcolor='#1a1a1a', font=("Segoe UI", 8))
    dmr_recoil_check.pack(pady=2)
    
    def quitProgram():
        config.AimToggle = False
        config.Running = False
        root.quit()
        
    def AimButton():
        config.AimToggle = not config.AimToggle
        AimLabel.config(text=f"Service Aim: {'🟢 ACTIVE' if config.AimToggle else '🔴 OFF'}")
        # Atualiza overlay imediatamente quando ativa/desativa
        try:
            update_mini_overlay_now()
        except:
            pass
    
    # BOTÃO TOGGLE AIMBOT (compacto)
    # 🎮 BOTÃO PRINCIPAL ULTRA MODERNO
    toggle_frame = tk.Frame(control_frame, bg=theme.BG_LIGHT)
    toggle_frame.pack(fill='x', padx=6, pady=8)
    
    AimLabel = tk.Label(toggle_frame, text=f"Service Aim: {'🟢 ACTIVE' if config.AimToggle else '🔴 OFF'}", 
                       font=("Segoe UI", 10, "bold"), fg=theme.TEXT_WHITE, bg=theme.BG_LIGHT)
    AimLabel.pack(pady=3)
    
    # Botão principal com design moderno
    AimToggler = tk.Button(toggle_frame, text="🎯 ULTRA TOGGLE", command=AimButton, 
                          bg=theme.GOLD, fg=theme.BG_DARK, 
                          font=("Segoe UI", 11, "bold"),
                          relief="raised", bd=3, padx=15, pady=8,
                          activebackground=theme.GOLD_LIGHT,
                          activeforeground=theme.BG_DARK)
    AimToggler.pack(pady=4)
    
    # STATUS MODERNO
    status_frame = tk.Frame(control_frame, bg=theme.BG_LIGHT)
    status_frame.pack(fill='x', padx=6, pady=4)
    
    WeaponLabel = tk.Label(status_frame, text=f"🔫 Weapon: {config.current_weapon}", 
                          font=("Segoe UI", 9, "bold"), fg=theme.SUCCESS, bg=theme.BG_LIGHT)
    WeaponLabel.pack(pady=2)
    
    ButtonLabel = tk.Label(status_frame, text=f"🎮 Button: {config.activation_button}", 
                          font=("Segoe UI", 9, "bold"), fg=theme.WARNING, bg=theme.BG_LIGHT)
    ButtonLabel.pack(pady=2)
    
    # INDICADOR DE 700M OTIMIZADO
    ScopeLabel = tk.Label(status_frame, text="🔭 700M MODE: ULTRA OPTIMIZED", 
                         font=("Segoe UI", 8, "bold"), fg=theme.GOLD, bg=theme.BG_LIGHT)
    ScopeLabel.pack(pady=2)
    
    # HOTKEYS COMPACTOS
    hotkey_frame = tk.Frame(control_frame, bg='#2d2d4a')
    hotkey_frame.pack(fill='x', padx=5, pady=3)
    
    tk.Label(hotkey_frame, text="HOTKEYS:", font=("Segoe UI", 8, "bold"), 
            fg='#6666ff', bg='#2d2d4a').pack(pady=1)
    tk.Label(hotkey_frame, text="G4: Switch Weapon", font=("Segoe UI", 7), 
            fg='white', bg='#2d2d4a').pack()
    tk.Label(hotkey_frame, text="G5: Switch Button", font=("Segoe UI", 7), 
            fg='white', bg='#2d2d4a').pack()
    
    # STATUS ATIVAÇÃO COMPACTO
    StatusLabel = tk.Label(control_frame, text=f"Hold {config.activation_button} to activate", 
                          font=("Segoe UI", 8, "bold"), fg='#ffff00', bg='#2d2d4a')
    StatusLabel.pack(pady=3)
    
    # BOTÃO QUIT COMPACTO
    QuitButton = tk.Button(control_frame, text="❌ EXIT", command=quitProgram, 
                          bg="#f44336", fg="white", font=("Segoe UI", 9, "bold"),
                          relief="flat", padx=10, pady=2)
    QuitButton.pack(pady=3)

    # ==========================
    # MINI OVERLAY COMPACTO (HUD)
    # ==========================
    mini_overlay_window = {'ref': None, 'label': None}  # Armazena janela E label
    overlay_enabled_var = tk.BooleanVar(value=True)

    def format_overlay_text():
        """Formata texto do overlay com informações em tempo real."""
        current_cfg = config.get_current_config()
        # Status de ativação
        status = "🟢 ATIVO" if config.AimToggle else "🔴 OFF"
        # Target body part
        if config.current_weapon == 'DMR':
            part_key = config.dmr_config.get('target_body_part', 'upper_chest')
            if part_key in config.body_parts:
                part_name = config.body_parts[part_key]['name'].split('(')[0].strip()
            else:
                part_name = part_key
        else:
            part_name = 'Head'
        
        return (
            f"═══ LARS AIM {status} ═══\n"
            f"⚔️ {config.current_weapon} | 🖱️ {config.activation_button}\n"
            f"🎯 {part_name}\n"
            f"📊 FOV:{current_cfg.get('radius',0)} S:{current_cfg.get('sensitivity',0):.1f}\n"
            f"💥 Recoil:{'ON' if current_cfg.get('recoil_control') else 'OFF'} | ⚡{config.last_fps:.0f}fps"
        )

    def update_mini_overlay_now():
        """Atualização IMEDIATA do overlay (chamada via callback)."""
        try:
            win = mini_overlay_window['ref']
            lbl = mini_overlay_window['label']
            if win and win.winfo_exists() and lbl:
                new_text = format_overlay_text()
                lbl.config(text=new_text)
                print(f"🔄 Overlay atualizado: {new_text.split(chr(10))[0]}")  # Debug: primeira linha
        except Exception as e:
            print(f"⚠️ Erro update_now: {e}")  # Debug

    def update_mini_overlay():
        """Atualização contínua e rápida do overlay (50ms para tempo real perfeito)."""
        try:
            if overlay_enabled_var.get() and mini_overlay_window['ref']:
                win = mini_overlay_window['ref']
                lbl = mini_overlay_window['label']
                if win and win.winfo_exists() and lbl:
                    # Atualiza o texto
                    new_text = format_overlay_text()
                    lbl.config(text=new_text)
                    # Reagenda para próxima atualização
                    root.after(50, update_mini_overlay)  # 50ms = 20 atualizações/segundo
                else:
                    # Janela não existe mais, para de atualizar
                    print("⚠️ Overlay window não existe mais")
            else:
                # Overlay desabilitado, verifica novamente depois
                root.after(200, update_mini_overlay)
        except Exception as e:
            # Em caso de erro, mostra e tenta novamente depois
            print(f"⚠️ Erro update_mini_overlay: {e}")
            root.after(100, update_mini_overlay)
    
    # Registrar callback no config para atualizações instantâneas
    config._overlay_update_callback = update_mini_overlay_now

    def close_mini_overlay():
        win = mini_overlay_window['ref']
        if win and win.winfo_exists():
            try:
                win.destroy()
            except:
                pass
        mini_overlay_window['ref'] = None
        mini_overlay_window['label'] = None  # Limpa label também
        print("❌ Overlay fechado")

    def apply_click_through(hwnd, alpha=0.65, reapply=False):
        """🔥 SOLUÇÃO ULTRA AGRESSIVA: Intercepta mensagens Windows + múltiplas técnicas.
        Garante ZERO captura de mouse mesmo com jogos modificando estilos.
        """
        try:
            import ctypes
            from ctypes import wintypes
            
            # === MÉTODO 1: Estilos Win32 MÁXIMOS ===
            ex_style = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
            new_ex_style = (ex_style | 
                           win32con.WS_EX_LAYERED |       
                           win32con.WS_EX_TRANSPARENT |   # CRÍTICO
                           win32con.WS_EX_NOACTIVATE |    
                           win32con.WS_EX_TOOLWINDOW |    
                           0x00000080)                     # WS_EX_TOPMOST
            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, new_ex_style)
            
            # Transparência visual
            win32gui.SetLayeredWindowAttributes(hwnd, 0, int(alpha * 255), win32con.LWA_ALPHA)
            
            # Remove WS_CHILD (captura mouse)
            style = win32gui.GetWindowLong(hwnd, win32con.GWL_STYLE)
            style = style & ~0x40000000  
            win32gui.SetWindowLong(hwnd, win32con.GWL_STYLE, style)
            
            # === MÉTODO 2: SetWindowRgn - Região COMPLETAMENTE VAZIA ===
            try:
                # NULL region = janela renderizada mas ZERO área clicável
                win32gui.SetWindowRgn(hwnd, 0, True)  # 0 = NULL handle = sem região
            except:
                pass
            
            # === MÉTODO 3: DISABLE da janela (não recebe input) ===
            try:
                # WS_DISABLED = janela visível mas TOTALMENTE inativa para input
                current_style = win32gui.GetWindowLong(hwnd, win32con.GWL_STYLE)
                win32gui.SetWindowLong(hwnd, win32con.GWL_STYLE, current_style | 0x08000000)  # WS_DISABLED
            except:
                pass
            
            # === MÉTODO 4: EnableWindow(FALSE) - Desabilita COMPLETAMENTE ===
            try:
                ctypes.windll.user32.EnableWindow(hwnd, False)  # FALSE = desabilitado
            except:
                pass
            
            # Posiciona TOPMOST
            win32gui.SetWindowPos(hwnd, win32con.HWND_TOPMOST, 0, 0, 0, 0,
                                 win32con.SWP_NOMOVE | win32con.SWP_NOSIZE |
                                 win32con.SWP_NOACTIVATE | win32con.SWP_SHOWWINDOW)
                
        except Exception as e:
            if not reapply:
                print(f"⚠️ Click-through: {e}")

    def schedule_click_through_reapply(hwnd, times=25, delay=200):
        """🔥 REAPLICAÇÃO ULTRA AGRESSIVA: 25 vezes a cada 200ms = 5 segundos.
        Garante que estilos permaneçam mesmo se o jogo tentar resetar.
        """
        if times <= 0:
            return
        try:
            apply_click_through(hwnd, alpha=0.65, reapply=True)
            root.after(delay, lambda: schedule_click_through_reapply(hwnd, times-1, delay))
        except:
            pass

    def create_mini_overlay():
        """Cria overlay HUD compacto, visível mas click-through (mouse passa direto)."""
        if mini_overlay_window['ref'] and mini_overlay_window['ref'].winfo_exists():
            print("⚠️ Overlay já existe!")
            return
        
        win = tk.Toplevel(root)
        mini_overlay_window['ref'] = win
        
        # Configuração da janela
        win.overrideredirect(True)
        win.attributes('-topmost', True)
        
        # Transparência via Tk (60% visível)
        try:
            win.attributes('-alpha', 0.60)
        except:
            pass
        
        # Background escuro com borda sutil
        win.configure(bg='#0f0f0f')
        win.geometry('+15+60')  # Posição: 15px da esquerda, 60px do topo
        
        # Frame interno com borda
        frm = tk.Frame(win, bg='#1a1a1a', bd=1, relief='solid', highlightthickness=1, highlightbackground='#00ff88')
        frm.pack(padx=2, pady=2)
        
        # Label com informações - ARMAZENAR REFERÊNCIA DIRETA
        lbl = tk.Label(frm,
                      text=format_overlay_text(),
                      font=("Consolas", 9, "bold"), 
                      justify='left',
                      fg='#00ff88',  # Verde brilhante
                      bg='#1a1a1a',
                      padx=8, pady=4)
        lbl.pack()
        
        # ✅ ARMAZENA REFERÊNCIA DIRETA AO LABEL (crucial!)
        mini_overlay_window['label'] = lbl
        
        # IMPORTANTE: Aguarda janela ser totalmente criada
        win.update()
        
        try:
            hwnd = win.winfo_id()
            # Aplicação inicial de click-through
            apply_click_through(hwnd, alpha=0.60)
            # Reaplicações para garantir persistência
            schedule_click_through_reapply(hwnd, times=8, delay=350)
            print("✅ Overlay HUD ativo (visível + click-through)")
            print(f"✅ Label armazenado: {lbl is not None}")
        except Exception as e:
            print(f"⚠️ Erro click-through: {e}")
        
        # Iniciar atualização em tempo real
        print("🔄 Iniciando loop de atualização...")
        update_mini_overlay()

    def toggle_overlay():
        if overlay_enabled_var.get():
            create_mini_overlay()
        else:
            close_mini_overlay()

    # Adiciona controle na aba SYSTEM STATUS
    overlay_control_frame = tk.Frame(status_frame, bg=theme.BG_LIGHT)
    overlay_control_frame.pack(fill='x', padx=6, pady=6)
    tk.Label(overlay_control_frame, text='Mini Overlay (Top-Left HUD)',
             font=("Segoe UI", 9, 'bold'), fg=theme.GOLD, bg=theme.BG_LIGHT).pack(anchor='w')
    tk.Checkbutton(overlay_control_frame, text='Enable Compact HUD', variable=overlay_enabled_var,
                   command=toggle_overlay, fg='white', bg=theme.BG_LIGHT, selectcolor=theme.BG_DARK,
                   font=("Segoe UI", 8)).pack(anchor='w')

    # Criar por padrão se ligado
    if overlay_enabled_var.get():
        root.after(300, create_mini_overlay)
    
    # ===========================================
    # CONFIGURANDO ABA SETTINGS
    # ===========================================
    
    # Header Settings
    settings_header = tk.Frame(settings_tab, bg=theme.GOLD, height=40)
    settings_header.pack(fill='x', padx=5, pady=5)
    settings_header.pack_propagate(False)
    
    settings_title = tk.Label(settings_header, text="⚙️ SETTINGS MANAGER", 
                             font=("Segoe UI", 12, "bold"), fg=theme.BG_DARK, bg=theme.GOLD)
    settings_title.pack(pady=10)
    
    # Canvas e Scrollbar para Settings
    settings_canvas = tk.Canvas(settings_tab, bg=theme.BG_LIGHT, highlightthickness=0)
    settings_scrollbar = ttk.Scrollbar(settings_tab, orient="vertical", command=settings_canvas.yview)
    settings_frame = tk.Frame(settings_canvas, bg=theme.BG_LIGHT)
    
    settings_canvas.configure(yscrollcommand=settings_scrollbar.set)
    settings_canvas.create_window((0, 0), window=settings_frame, anchor="nw")
    
    def update_settings_scroll(event):
        settings_canvas.configure(scrollregion=settings_canvas.bbox("all"))
    
    settings_frame.bind("<Configure>", update_settings_scroll)
    
    settings_canvas.pack(side="left", fill="both", expand=True, padx=3, pady=3)
    settings_scrollbar.pack(side="right", fill="y", pady=3)
    
    # SISTEMA AUTO-SAVE MELHORADO
    auto_save_timer_id = None
    
    def start_auto_save_timer():
        """Inicia timer de auto-save periódico"""
        global auto_save_timer_id
        def auto_save_periodic():
            config.auto_save_settings()
            # Reagendar para próximo auto-save em 30 segundos
            global auto_save_timer_id
            auto_save_timer_id = root.after(30000, auto_save_periodic)
        
        # Cancelar timer anterior se existir
        try:
            if auto_save_timer_id:
                root.after_cancel(auto_save_timer_id)
        except:
            pass
        
        # Iniciar novo timer
        auto_save_timer_id = root.after(30000, auto_save_periodic)  # 30 segundos
    
    def reset_to_defaults():
        """Restaura configurações padrão"""
        import tkinter.messagebox as msgbox
        if msgbox.askyesno("🔄 Reset Settings", "⚠️ Tem certeza que deseja restaurar as configurações padrão?\n\nIsso irá:\n• Resetar todas as configurações\n• Manter o arquivo atual como backup"):
            # Backup do arquivo atual
            import os
            import shutil
            if os.path.exists("lars_settings.json"):
                try:
                    shutil.copy("lars_settings.json", "lars_settings_backup.json")
                    print("📄 Backup criado: lars_settings_backup.json")
                except:
                    pass
            
            # Restaurar padrões
            global config
            config = PerfectAimbotConfig()
            # Removido: chamada redundante a update_status() (não definida neste escopo)
            update_settings_status()
            msgbox.showinfo("✅ Reset Complete", "✅ Configurações restauradas para o padrão!\n📄 Backup salvo como: lars_settings_backup.json")
    
    # INFORMAÇÕES DO ARQUIVO
    info_frame = tk.Frame(settings_frame, bg=theme.BG_DARK, relief='solid', bd=2)
    info_frame.pack(fill='x', padx=10, pady=10)
    
    tk.Label(info_frame, text="📁 FILE INFORMATION", 
             font=("Segoe UI", 10, "bold"), fg=theme.GOLD, bg=theme.BG_DARK).pack(pady=5)
    
    file_status_label = tk.Label(info_frame, text="Checking...", 
                                font=("Segoe UI", 9), fg='white', bg=theme.BG_DARK)
    file_status_label.pack(pady=2)
    
    file_size_label = tk.Label(info_frame, text="", 
                               font=("Segoe UI", 8), fg='#cccccc', bg=theme.BG_DARK)
    file_size_label.pack(pady=1)
    
    last_modified_label = tk.Label(info_frame, text="", 
                                   font=("Segoe UI", 8), fg='#cccccc', bg=theme.BG_DARK)
    last_modified_label.pack(pady=1)
    
    def update_settings_status():
        """Atualiza status do arquivo de configurações"""
        import os
        import datetime
        
        if os.path.exists("lars_settings.json"):
            file_size = os.path.getsize("lars_settings.json")
            mod_time = os.path.getmtime("lars_settings.json")
            mod_date = datetime.datetime.fromtimestamp(mod_time).strftime("%d/%m/%Y %H:%M:%S")
            
            file_status_label.config(text="✅ lars_settings.json - FOUND", fg='#4CAF50')
            file_size_label.config(text=f"📊 Size: {file_size} bytes")
            last_modified_label.config(text=f"🕒 Modified: {mod_date}")
        else:
            file_status_label.config(text="❌ lars_settings.json - NOT FOUND", fg='#f44336')
            file_size_label.config(text="💡 Use SAVE to create your first config file")
            last_modified_label.config(text="")
    
    # BOTÕES PRINCIPAIS
    buttons_main_frame = tk.Frame(settings_frame, bg=theme.BG_LIGHT)
    buttons_main_frame.pack(fill='x', padx=10, pady=10)
    
    tk.Label(buttons_main_frame, text="💾 AUTO-SAVE SYSTEM", 
             font=("Segoe UI", 10, "bold"), fg=theme.SUCCESS, bg=theme.BG_LIGHT).pack(pady=5)
    
    # Frame para o botão principal
    main_buttons = tk.Frame(buttons_main_frame, bg=theme.BG_LIGHT)
    main_buttons.pack(pady=5)
    
    # FUNÇÃO SAVE MELHORADA COM AUTO-SAVE
    def enhanced_save_settings():
        """Save manual + ativar auto-save"""
        success = config.save_settings()
        if success:
            import tkinter.messagebox as msgbox
            msgbox.showinfo("💾 Save Settings", "✅ Configurações salvas com sucesso!\n📁 Arquivo: lars_settings.json\n\n🚀 AUTO-SAVE ativado - suas mudanças serão salvas automaticamente!")
            update_settings_status()
            # Ativar auto-save periódico
            start_auto_save_timer()
        else:
            import tkinter.messagebox as msgbox
            msgbox.showerror("❌ Save Error", "❌ Erro ao salvar configurações!")
    
    # BOTÃO SAVE CENTRALIZADO E MAIOR
    save_button = tk.Button(main_buttons, text="💾 SAVE SETTINGS NOW", command=enhanced_save_settings, 
                           bg="#4CAF50", fg="white", font=("Segoe UI", 12, "bold"),
                           relief="raised", bd=3, padx=30, pady=10,
                           activebackground="#45a049")
    save_button.pack(pady=10)
    
    # INFO AUTO-SAVE
    auto_info_frame = tk.Frame(buttons_main_frame, bg=theme.BG_DARK, relief='solid', bd=2)
    auto_info_frame.pack(fill='x', pady=10)
    
    tk.Label(auto_info_frame, text="🤖 AUTO-SAVE FEATURES", 
             font=("Segoe UI", 9, "bold"), fg=theme.GOLD, bg=theme.BG_DARK).pack(pady=3)
    
    tk.Label(auto_info_frame, text="✅ Settings auto-load when program starts", 
             font=("Segoe UI", 8), fg='#4CAF50', bg=theme.BG_DARK).pack(pady=1)
    
    tk.Label(auto_info_frame, text="✅ Settings auto-save every time you change something", 
             font=("Segoe UI", 8), fg='#4CAF50', bg=theme.BG_DARK).pack(pady=1)
    
    tk.Label(auto_info_frame, text="💡 No need to manually load - everything is automatic!", 
             font=("Segoe UI", 8), fg='#cccccc', bg=theme.BG_DARK).pack(pady=1)
    
    # BOTÕES SECUNDÁRIOS
    secondary_frame = tk.Frame(settings_frame, bg=theme.BG_LIGHT)
    secondary_frame.pack(fill='x', padx=10, pady=5)
    
    tk.Label(secondary_frame, text="🔧 ADVANCED CONTROLS", 
             font=("Segoe UI", 9, "bold"), fg=theme.WARNING, bg=theme.BG_LIGHT).pack(pady=3)
    
    secondary_buttons = tk.Frame(secondary_frame, bg=theme.BG_LIGHT)
    secondary_buttons.pack(pady=3)
    
    # BOTÃO RESET
    reset_button = tk.Button(secondary_buttons, text="🔄 RESET TO DEFAULTS", command=reset_to_defaults, 
                            bg="#FF9800", fg="white", font=("Segoe UI", 9, "bold"),
                            relief="raised", bd=2, padx=15, pady=5,
                            activebackground="#F57C00")
    reset_button.pack(side='left', padx=5)
    
    # 🔄 BOTÃO CHECK UPDATES
    def check_updates_gui():
        """Verifica atualizações via GUI"""
        update_btn.config(state='disabled', text='🔄 CHECKING...')
        def check_thread():
            auto_updater.check_for_updates(silent=False)
            try:
                update_btn.config(state='normal', text='🔄 CHECK UPDATES')
            except:
                pass
        threading.Thread(target=check_thread, daemon=True).start()
    
    update_btn = tk.Button(secondary_buttons, text="🔄 CHECK UPDATES", 
                          command=check_updates_gui,
                          bg="#2196F3", fg="white", font=("Segoe UI", 9, "bold"),
                          relief="raised", bd=2, padx=15, pady=5,
                          activebackground="#1976D2")
    update_btn.pack(side='left', padx=5)
    
    # AUTO-LOAD INFO
    autoload_frame = tk.Frame(settings_frame, bg=theme.BG_DARK, relief='solid', bd=2)
    autoload_frame.pack(fill='x', padx=10, pady=10)
    
    tk.Label(autoload_frame, text="🚀 AUTO-LOAD FEATURE", 
             font=("Segoe UI", 10, "bold"), fg=theme.GOLD, bg=theme.BG_DARK).pack(pady=5)
    
    tk.Label(autoload_frame, text="✅ Settings are automatically loaded when the program starts", 
             font=("Segoe UI", 9), fg='#4CAF50', bg=theme.BG_DARK).pack(pady=2)
    
    tk.Label(autoload_frame, text="💡 Your last saved configuration will be restored every time!", 
             font=("Segoe UI", 8), fg='#cccccc', bg=theme.BG_DARK).pack(pady=2)
    
    # ATUALIZAR STATUS DOS ARQUIVOS
    # =============================
    # CONTROLE DO HUD OVERLAY (SETTINGS)
    # =============================
    overlay_settings_frame = tk.Frame(settings_frame, bg=theme.BG_DARK, relief='solid', bd=2)
    overlay_settings_frame.pack(fill='x', padx=10, pady=10)
    tk.Label(overlay_settings_frame, text='📺 MINI OVERLAY (HUD)',
             font=("Segoe UI", 10, 'bold'), fg=theme.GOLD, bg=theme.BG_DARK).pack(anchor='w', pady=(4,2))
    tk.Label(overlay_settings_frame, text='Exibe arma, botão, sensibilidade, FOV, alvo, recoil, offset e FPS. Janela é semi-transparente e ignora cliques (click-through).',
             wraplength=520, justify='left', font=("Segoe UI", 8), fg='#cccccc', bg=theme.BG_DARK).pack(anchor='w', pady=(0,6))

    def toggle_overlay_button():
        overlay_enabled_var.set(not overlay_enabled_var.get())
        toggle_overlay()
        overlay_toggle_btn.config(text='Disable HUD Overlay' if overlay_enabled_var.get() else 'Enable HUD Overlay')

    overlay_toggle_btn = tk.Button(overlay_settings_frame,
                                   text='Disable HUD Overlay' if overlay_enabled_var.get() else 'Enable HUD Overlay',
                                   command=toggle_overlay_button,
                                   bg=theme.GOLD, fg=theme.BG_DARK,
                                   font=("Segoe UI", 9, 'bold'), relief='raised', bd=2, padx=14, pady=6,
                                   activebackground=theme.GOLD_LIGHT, activeforeground=theme.BG_DARK)
    overlay_toggle_btn.pack(anchor='w', pady=4)

    update_settings_status()
    
    # INICIAR AUTO-SAVE TIMER
    start_auto_save_timer()
    
    def update_status():
        """Atualizar status da interface em tempo real"""
        WeaponLabel.config(text=f"Weapon: {config.current_weapon}")
        ButtonLabel.config(text=f"Button: {config.activation_button}")
        StatusLabel.config(text=f"Hold {config.activation_button} to activate")
        AimLabel.config(text=f"Service Aim: {'🟢 ACTIVE' if config.AimToggle else '🔴 OFF'}")
        
    # 🌈 ANIMAÇÃO RGB PARA BORDAS
    def animate_rgb():
        """Anima as bordas RGB"""
        rgb_effects.update_hue()
        current_color = rgb_effects.get_rgb_color()
        
        # Atualizar AMBAS as bordas RGB (sincronizadas)
        rgb_border_top.config(bg=current_color)
        rgb_border_bottom.config(bg=current_color)
        
        # Atualizar highlight dos controles ativos
        if config.AimToggle:
            AimToggler.config(highlightbackground=current_color, highlightthickness=2)
        
        # Continuar animação
        root.after(50, animate_rgb)  # 50ms = animação suave
    
    def update_status():
        """Atualizar status da interface"""
        # Atualizar labels
        AimLabel.config(text=f"Service Aim: {'🟢 ACTIVE' if config.AimToggle else '🔴 OFF'}")
        WeaponLabel.config(text=f"🔫 Weapon: {config.current_weapon}")
        ButtonLabel.config(text=f"🎮 Button: {config.activation_button}")
        
        # Destacar arma atual nos títulos com cores modernas
        if config.current_weapon == "AR":
            ar_title.config(fg=theme.SUCCESS, text="🔫 ASSAULT RIFLE (700M) ← ACTIVE")
            dmr_title.config(fg=theme.TEXT_GRAY, text="🎯 DMR SNIPER (700M)")
        else:
            ar_title.config(fg=theme.TEXT_GRAY, text="🔫 ASSAULT RIFLE (700M)")
            dmr_title.config(fg=theme.SUCCESS, text="🎯 DMR SNIPER (700M) ← ACTIVE")
        
        # Atualizar região de scroll
        ar_canvas.configure(scrollregion=ar_canvas.bbox("all"))
        dmr_canvas.configure(scrollregion=dmr_canvas.bbox("all"))
        control_canvas.configure(scrollregion=control_canvas.bbox("all"))
        
        root.after(100, update_status)  # Atualizar a cada 100ms
    
    # 🌈 FRAME RGB ANIMADO NA BORDA INFERIOR
    rgb_border_bottom = tk.Frame(root, bg=theme.RGB_BORDER, height=4)
    rgb_border_bottom.pack(fill='x', side='bottom')
    
    # Iniciar animações
    animate_rgb()  # Iniciar animação RGB
    update_status()  # Iniciar atualizações
    
    # Callback de fechamento seguro
    def _safe_close():
        try:
            if callable(on_close_callback):
                on_close_callback()
        finally:
            root.destroy()
    root.protocol("WM_DELETE_WINDOW", _safe_close)
    root.mainloop()

def is_right_mouse_pressed():
    """Detectar botão direito pressionado"""
    try:
        return bool(win32api.GetAsyncKeyState(win32con.VK_RBUTTON) & 0x8000)
    except:
        return False

def monitor_hotkeys():
    """🔥 MONITORAMENTO DOS BOTÕES G4, G5, G e Arrow Keys"""
    print("🎮 Monitoramento de hotkeys expandido iniciado!")
    print("🔫 G4: Trocar arma (AR ↔ DMR)")
    print("🖱️ G5: Trocar botão de ativação (ESQUERDO ↔ DIREITO)")
    print("🎯 G: Trocar parte do corpo (apenas DMR)")
    print("🎯 Arrow Keys: Ajustar crosshair offset")
    print("📌 CTRL+R: Resetar crosshair offset")
    
    while config.Running:
        try:
            # 🔫 BOTÃO G4 - TROCAR ARMA
            g4_state = win32api.GetAsyncKeyState(0x05) & 0x8000  # G4 = 0x05
            if g4_state and not config.g4_pressed:
                config.g4_pressed = True
                config.toggle_weapon()
                
            elif not g4_state and config.g4_pressed:
                config.g4_pressed = False
            
            # 🖱️ BOTÃO G5 - TROCAR BOTÃO DE ATIVAÇÃO
            g5_state = win32api.GetAsyncKeyState(0x06) & 0x8000  # G5 = 0x06
            if g5_state and not config.g5_pressed:
                config.g5_pressed = True
                config.toggle_activation_button()
                
            elif not g5_state and config.g5_pressed:
                config.g5_pressed = False
            
            # 🎯 BOTÃO G6 - TROCAR PARTE DO CORPO (DMR)
            g6_state = win32api.GetAsyncKeyState(0x47) & 0x8000  # G = 0x47
            if g6_state and not config.g6_pressed:
                config.g6_pressed = True
                if config.current_weapon == "DMR":
                    config.change_dmr_target()
                else:
                    print("🔴 G6 só funciona no modo DMR! Pressione G4 para alternar para DMR.")
                
            elif not g6_state and config.g6_pressed:
                config.g6_pressed = False
            
            # 🎯 ARROW KEYS - CROSSHAIR OFFSET
            # UP Arrow
            up_state = win32api.GetAsyncKeyState(win32con.VK_UP) & 0x8000
            if up_state and not config.up_pressed:
                config.up_pressed = True
                config.adjust_crosshair_offset("up")
            elif not up_state and config.up_pressed:
                config.up_pressed = False
            
            # DOWN Arrow
            down_state = win32api.GetAsyncKeyState(win32con.VK_DOWN) & 0x8000
            if down_state and not config.down_pressed:
                config.down_pressed = True
                config.adjust_crosshair_offset("down")
            elif not down_state and config.down_pressed:
                config.down_pressed = False
            
            # LEFT Arrow
            left_state = win32api.GetAsyncKeyState(win32con.VK_LEFT) & 0x8000
            if left_state and not config.left_pressed:
                config.left_pressed = True
                config.adjust_crosshair_offset("left")
            elif not left_state and config.left_pressed:
                config.left_pressed = False
            
            # RIGHT Arrow
            right_state = win32api.GetAsyncKeyState(win32con.VK_RIGHT) & 0x8000
            if right_state and not config.right_pressed:
                config.right_pressed = True
                config.adjust_crosshair_offset("right")
            elif not right_state and config.right_pressed:
                config.right_pressed = False
            
            # 📌 CTRL+R - RESET OFFSET
            ctrl_state = win32api.GetAsyncKeyState(win32con.VK_CONTROL) & 0x8000
            r_state = win32api.GetAsyncKeyState(ord('R')) & 0x8000
            if ctrl_state and r_state:
                config.reset_crosshair_offset()
                time.sleep(0.5)  # Evitar spam do reset
            
            time.sleep(0.05)  # Pequeno delay para evitar spam
            
        except Exception as e:
            time.sleep(0.1)

def main():
    """Entrada principal: autentica, carrega modelo, inicia threads e GUI na MAIN thread.
    Corrigido para compatibilidade PyInstaller (Tk só na thread principal).
    """
    global config
    print("🔐 LARS SERVICE AIM - START")
    print(f"📦 Version: {CURRENT_VERSION}")
    
    # 🔄 Verificar atualizações no startup (1x por dia, silencioso)
    print("🔍 Verificando atualizações...")
    auto_updater.check_on_startup()
    
    login_system = LoginInterface()
    authenticated, user_data = login_system.show_login()
    if not authenticated:
        print("❌ Authentication failed/cancelled")
        return
    print(f"✅ Auth OK | User: {user_data['username']} | Expiry: {user_data['expiry_date']}")
    # Reiniciar config pós auth
    config = PerfectAimbotConfig()
    # Carregar modelo (suporte a PyInstaller _MEIPASS)
    def resolve_model_path(candidate):
        # Se empacotado, os dados adicionais ficam em sys._MEIPASS
        base_paths = []
        if hasattr(sys, '_MEIPASS'):
            base_paths.append(sys._MEIPASS)
        # Adicionar Desktop como primeiro caminho
        desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
        base_paths.append(desktop_path)
        base_paths.append(os.getcwd())
        for base in base_paths:
            p = os.path.join(base, candidate)
            if os.path.exists(p):
                return p
        return None
    model = None
    for name in ["best.pt", os.path.join("models", "best.pt"), "yolov8n.pt", "sunxds_0.5.6.pt", os.path.join("models", "sunxds_0.5.6.pt")]:
        p = resolve_model_path(name)
        if p:
            try:
                model = ultralytics.YOLO(p, task='detect')
                print(f"✅ Modelo carregado: {p}")
                break
            except Exception as e:
                print(f"⚠️ Falha ao carregar {p}: {e}")
    if model is None:
        print("⚠️ Nenhum modelo encontrado (best.pt).")
        print("📋 Para usar detecção, coloque o arquivo 'best.pt' na mesma pasta do app")
        print("🚀 Continuando sem modelo de detecção...")
        # Criar um modelo vazio para não dar erro
        model = None
    else:
        model.overrides['verbose'] = False
        device_available = 'cuda' if torch.cuda.is_available() else 'cpu'
        try:
            dummy_frame = np.zeros((64, 64, 3), dtype=np.uint8)
            model.predict(dummy_frame, verbose=False, imgsz=64, device=device_available)
            print("✅ Modelo aquecido com sucesso!")
        except Exception as e:
            print(f"⚠️ Warmup falhou: {e}")
    
    # REMOVIDO: screen_capture global (cada thread precisa de sua própria instância)
    # Thread de hotkeys
    threading.Thread(target=monitor_hotkeys, daemon=True).start()
    
    stop_flag = {'value': False}
    def stop_all():
        config.Running = False
        stop_flag['value'] = True
    
    def detection_loop():
        """Loop de detecção com MSS local e tratamento robusto de erros."""
        frame_count = 0
        last_time = time.time()
        error_repeats = 0
        last_error_type = None
        
        # Criar instância MSS local para esta thread
        def create_mss():
            try:
                return mss.mss()
            except Exception as e:
                print(f"❌ Falha ao inicializar MSS: {e}")
                return None
        
        screen_capture = create_mss()
        if screen_capture is None:
            print("❌ Não foi possível criar captura de tela. Encerrando loop.")
            return
        
        print("✅ Loop de detecção iniciado!")
        
        # Flags para debug (imprime apenas primeira vez)
        first_activation = True
        
        while config.Running and not stop_flag['value']:
            if not config.AimToggle:
                if first_activation:
                    first_activation = False
                time.sleep(0.01)
                continue
            
            if first_activation:
                print(f"🎯 Aimbot ATIVADO | Arma: {config.current_weapon} | Botão: {config.activation_button}")
                print(f"🎯 Segure o botão {config.activation_button} do mouse para ativar!")
                first_activation = False
            
            # Verificar se botão de ativação está pressionado
            is_pressed = config.is_activation_pressed()
            if frame_count % 120 == 0 and is_pressed:
                print(f"✅ Botão {config.activation_button} PRESSIONADO - Aimbot ATIVO!")
            
            if not is_pressed:
                time.sleep(0.005)
                continue
            try:
                # Captura de tela com tratamento de erro _thread._local
                try:
                    frame = np.array(screen_capture.grab(config.region))
                except AttributeError as ae:
                    msg = str(ae)
                    if "_thread._local" in msg:
                        current_type = '_thread._local.srcdc'
                        if current_type != last_error_type:
                            print("♻️ Erro srcdc detectado. Recriando MSS...")
                            last_error_type = current_type
                            error_repeats = 0
                        else:
                            error_repeats += 1
                            if error_repeats % 20 == 0:
                                print(f"♻️ Recriando MSS novamente (ocorrências: {error_repeats})")
                        screen_capture = create_mss()
                        if screen_capture is None:
                            time.sleep(0.2)
                        continue
                    else:
                        raise
                
                frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
                
                # Verificar se o modelo existe
                if model is None:
                    time.sleep(0.1)
                    continue
                device = 'cuda' if torch.cuda.is_available() else 'cpu'
                results = model.predict(
                    source=frame,
                    conf=config.confidence_threshold,
                    classes=[0],
                    verbose=False,
                    max_det=8,
                    imgsz=320,
                    device=device,
                    half=torch.cuda.is_available(),
                    augment=False,
                    agnostic_nms=False,
                    retina_masks=False,
                    iou=0.45,
                    save=False,
                    stream_buffer=False
                )
                
                # Debug: verificar se está detectando
                if frame_count % 60 == 0:
                    print(f"🔍 Verificando detecções... Running={config.Running}")
                
                if not results or not results[0].boxes or len(results[0].boxes.xyxy) == 0:
                    if frame_count % 60 == 0:
                        print("⚠️ Nenhuma detecção encontrada")
                    continue
                    
                if frame_count % 60 == 0:
                    print(f"✅ {len(results[0].boxes.xyxy)} alvos detectados!")
                    
                boxes = results[0].boxes.xyxy
                confidences = results[0].boxes.conf
                best_target = None
                best_distance = float('inf')
                for i in range(len(boxes)):
                    x1, y1, x2, y2 = boxes[i].tolist()
                    center_x = int((x1 + x2) / 2)
                    box_h = y2 - y1
                    box_w = x2 - x1
                    if box_w < 5 or box_h < 5:
                        continue
                    current_cfg = config.get_current_config()
                    if config.current_weapon == 'DMR':
                        dmr_target = config.dmr_config.get('target_body_part', 'auto')
                        if dmr_target in config.body_parts:
                            body_offset = config.body_parts[dmr_target]['offset']
                            target_part = dmr_target
                        else:
                            body_offset = 0.35  # Centro superior (peito) como fallback
                            target_part = 'auto'
                    else:
                        body_offset = float(current_cfg.get('head_offset_factor', 0.2))
                        target_part = 'head'
                    # MODO AUTO: gruda no centro superior (região do peito) para tracking perfeito
                    aim_y = int(y1 + box_h * body_offset)
                    dist_x = center_x - (config.crosshairX)
                    dist_y = aim_y - (config.crosshairY)
                    dist = math.sqrt(dist_x*dist_x + dist_y*dist_y)
                    if dist <= current_cfg['radius'] and dist < best_distance:
                        best_distance = dist
                        best_target = {'x': center_x, 'y': aim_y, 'target_part': target_part, 'body_offset': body_offset}
                if best_target:
                    moveX = best_target['x'] - (config.crosshairX + config.offset_x)
                    moveY = best_target['y'] - (config.crosshairY + config.offset_y)
                    current_cfg = config.get_current_config()
                    
                    # Sistema de tracking COLADO - segue perfeitamente
                    smooth = float(current_cfg.get('smooth_factor', 0.9))
                    sens = float(current_cfg.get('sensitivity', 1.0))
                    
                    # Sistema EXTREMO: tracking INSTANTÂNEO colado em TODAS as distâncias
                    distance = math.sqrt(moveX*moveX + moveY*moveY)
                    if distance < 15:  # Muito perto, COLA TOTAL
                        smooth_multiplier = 2.5  # 150% mais rápido - COLA 100%
                    elif distance < 50:  # Perto, tracking EXTREMO
                        smooth_multiplier = 2.2  # 120% mais rápido - GRUDA FORTE
                    elif distance < 100:  # Médio, tracking MUITO agressivo
                        smooth_multiplier = 1.8  # 80% mais rápido - GRUDA RÁPIDO
                    else:  # Longe, snap INSTANTÂNEO
                        smooth_multiplier = 1.5  # 50% mais rápido - SNAP TOTAL
                    
                    final_x = int(moveX * sens * float(config.MovementCoefficientX) * smooth_multiplier)
                    final_y = int(moveY * sens * float(config.MovementCoefficientY) * smooth_multiplier)
                    # Recoil control EXTREMO para AR
                    if current_cfg.get('recoil_control'):
                        rs = float(current_cfg.get('recoil_strength', 0))
                        # Compensação de recoil EXTREMA para AR
                        final_y += int(rs * 4.5)  # Puxa EXTREMO pra baixo - compensa totalmente
                    
                    # Limite de movimento EXTREMO para tracking perfeito
                    max_move = 250  # Permite movimentos muito grandes
                    final_x = max(-max_move, min(max_move, final_x))
                    final_y = max(-max_move, min(max_move, final_y))
                    
                    # SEMPRE mover se houver alvo (removida restrição de movimento mínimo)
                    win32api.mouse_event(win32con.MOUSEEVENTF_MOVE, final_x, final_y, 0, 0)
                    
                    # Debug: mostra quando move o mouse
                    if frame_count % 30 == 0:
                        print(f"🎯 AIMBOT ATIVO! Alvo: {best_target['target_part']}, Movendo: X={final_x}, Y={final_y}")
                frame_count += 1
                if time.time() - last_time >= 1.0:
                    config.last_fps = float(frame_count)
                    print(f"🎯 FPS: {config.last_fps:.1f} | Weapon: {config.current_weapon}")
                    frame_count = 0
                    last_time = time.time()
            except Exception as e:
                em = str(e)
                if "_thread._local" in em:
                    # Já tratado acima, evita spam
                    time.sleep(0.05)
                    continue
                print(f"❌ Loop err: {em}")
                time.sleep(0.05)
        print("🛑 Detection loop stopped")
    threading.Thread(target=detection_loop, daemon=True).start()
    # GUI (bloqueia até fechar)
    CreateOverlay(user_info=user_data, on_close_callback=stop_all)
    print("🛑 App terminated")

if __name__ == "__main__":
    main()
