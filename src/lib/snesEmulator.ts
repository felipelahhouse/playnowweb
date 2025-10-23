import { SNES65816CPU, SNESMemoryMap } from './snes65816';
import { SNESPPU } from './snesPPU';

export type ButtonState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  l: boolean;
  r: boolean;
  start: boolean;
  select: boolean;
};

export class SNESEmulator {
  private canvas: HTMLCanvasElement;
  private memory: SNESMemoryMap;
  private cpu: SNES65816CPU;
  private ppu: SNESPPU;
  private romData: Uint8Array | null = null;
  private romUrl: string = '';
  private isRunning = false;
  private frameCount = 0;
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  private currentFPS = 0;
  private frameStartTime = 0;

  private buttons: ButtonState = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    x: false,
    y: false,
    l: false,
    r: false,
    start: false,
    select: false
  };

  private joypad1: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize memory
    this.memory = {
      rom: new Uint8Array(0x400000), // 4MB ROM space
      wram: new Uint8Array(0x20000),  // 128KB WRAM
      vram: new Uint8Array(0x10000),  // 64KB VRAM
      oam: new Uint8Array(0x220),     // OAM
      cgram: new Uint8Array(0x200)    // CGRAM (palette)
    };

    // Initialize CPU and PPU
    this.cpu = new SNES65816CPU(this.memory);
    this.ppu = new SNESPPU(canvas, this.memory);
    
    this.canvas.width = 256;
    this.canvas.height = 224;
  }

  async loadROM(romData: Uint8Array, romUrl: string): Promise<void> {
    this.romUrl = romUrl;
    
    // Remove header if present
    let actualRomData = romData;
    const hasHeader = romData.length % 1024 === 512;
    if (hasHeader) {
      actualRomData = romData.slice(512);
    }

    this.romData = actualRomData;
    
    // Copy ROM to memory
    const copyLength = Math.min(actualRomData.length, this.memory.rom.length);
    this.memory.rom.set(actualRomData.slice(0, copyLength));
    
    // Initialize WRAM with some test data
    this.initializeTestGraphics();
    
    console.log(`ROM loaded: ${actualRomData.length} bytes from ${romUrl}`);
    console.log(`ROM copied to memory: ${copyLength} bytes`);
    
    // Reset CPU
    this.cpu.reset();
  }

  private initializeTestGraphics() {
    // Initialize VRAM with test tile data
    const testTileData = [
      // Tile 1: Solid color block
      0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      
      // Tile 2: Checkerboard
      0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55,
      0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA, 0x55, 0xAA,
      
      // Tile 3: Border
      0xFF, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xFF,
      0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF
    ];
    
    // Copy test tiles to VRAM
    for (let i = 0; i < testTileData.length && i < this.memory.vram.length; i++) {
      this.memory.vram[i] = testTileData[i];
    }
    
    // Initialize test tilemap
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const tilemapAddr = y * 32 + x;
        if (tilemapAddr * 2 + 1 < this.memory.vram.length) {
          // Create a pattern with different tiles
          let tileIndex = 0;
          if (x < 2 || x >= 30 || y < 2 || y >= 30) {
            tileIndex = 2; // Border
          } else if ((x + y) % 4 === 0) {
            tileIndex = 1; // Checkerboard
          }
          
          this.memory.vram[0x800 + tilemapAddr * 2] = tileIndex & 0xFF;
          this.memory.vram[0x800 + tilemapAddr * 2 + 1] = (tileIndex >> 8) & 0xFF;
        }
      }
    }
    
    // Initialize palette
    this.initializePalette();
  }

  private initializePalette() {
    // Set up basic palette colors
    const colors = [
      0x0000, // Black
      0x7FFF, // White
      0x001F, // Blue
      0x03E0, // Green
      0x7C00, // Red
      0x7FE0, // Yellow
      0x7C1F, // Magenta
      0x03FF, // Cyan
    ];
    
    for (let i = 0; i < colors.length; i++) {
      this.ppu.updatePalette(i, colors[i]);
    }
  }

  start(): void {
    if (!this.romData) {
      throw new Error('No ROM loaded');
    }

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameStartTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  async reset(): Promise<void> {
    this.stop();
    this.frameCount = 0;
    this.cpu.reset();
    this.initializeTestGraphics();
    this.start();
  }

  setButtonState(button: keyof ButtonState, pressed: boolean): void {
    this.buttons[button] = pressed;
    this.updateJoypadState();
  }

  private updateJoypadState(): void {
    this.joypad1 = 0;
    if (this.buttons.b) this.joypad1 |= 0x8000;
    if (this.buttons.y) this.joypad1 |= 0x4000;
    if (this.buttons.select) this.joypad1 |= 0x2000;
    if (this.buttons.start) this.joypad1 |= 0x1000;
    if (this.buttons.up) this.joypad1 |= 0x0800;
    if (this.buttons.down) this.joypad1 |= 0x0400;
    if (this.buttons.left) this.joypad1 |= 0x0200;
    if (this.buttons.right) this.joypad1 |= 0x0100;
    if (this.buttons.a) this.joypad1 |= 0x0080;
    if (this.buttons.x) this.joypad1 |= 0x0040;
    if (this.buttons.l) this.joypad1 |= 0x0020;
    if (this.buttons.r) this.joypad1 |= 0x0010;
  }

  async saveState(slot: number = 0): Promise<void> {
    const state = {
      frameCount: this.frameCount,
      romUrl: this.romUrl,
      timestamp: Date.now(),
      cpu: {
        A: this.cpu.A,
        X: this.cpu.X,
        Y: this.cpu.Y,
        SP: this.cpu.SP,
        PC: this.cpu.PC,
        P: this.cpu.P
      },
      wram: Array.from(this.memory.wram.slice(0, 1000)), // Save partial WRAM
      buttons: { ...this.buttons }
    };
    
    const key = `snes_savestate_${this.romUrl}_${slot}`;
    localStorage.setItem(key, JSON.stringify(state));
    console.log('State saved to slot', slot);
  }

  async loadState(slot: number = 0): Promise<void> {
    const key = `snes_savestate_${this.romUrl}_${slot}`;
    const saved = localStorage.getItem(key);
    if (!saved) {
      throw new Error('No saved state found');
    }
    
    const state = JSON.parse(saved);
    
    // Restore CPU state
    this.cpu.A = state.cpu.A;
    this.cpu.X = state.cpu.X;
    this.cpu.Y = state.cpu.Y;
    this.cpu.SP = state.cpu.SP;
    this.cpu.PC = state.cpu.PC;
    this.cpu.P = state.cpu.P;
    
    // Restore WRAM
    if (state.wram) {
      for (let i = 0; i < state.wram.length; i++) {
        this.memory.wram[i] = state.wram[i];
      }
    }
    
    // Restore buttons
    this.buttons = { ...state.buttons };
    this.updateJoypadState();
    
    this.frameCount = state.frameCount;
    console.log('State loaded from slot', slot);
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;

    // Target 60 FPS (16.67ms per frame)
    if (deltaTime >= 16.67) {
      this.runFrame();
      this.frameCount++;
      
      // Calculate FPS
      const frameDuration = currentTime - this.frameStartTime;
      this.currentFPS = frameDuration > 0 ? Math.round(1000 / frameDuration) : 60;
      this.frameStartTime = currentTime;
      this.lastFrameTime = currentTime;
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private runFrame(): void {
    if (!this.cpu || !this.ppu) return;

    // Run CPU for approximately one frame worth of cycles
    // SNES runs at about 3.58 MHz, so roughly 59,650 cycles per frame at 60fps
    const targetCycles = 59650;
    let cyclesRun = 0;
    
    while (cyclesRun < targetCycles) {
      const cycles = this.cpu.step();
      cyclesRun += cycles;
      
      // Limit to prevent infinite loops
      if (cyclesRun > targetCycles * 2) break;
    }
    
    // Render frame
    this.ppu.renderFrame();
  }

  getStats() {
    return {
      frameCount: this.frameCount,
      fps: this.currentFPS,
      romSize: this.romData?.length || 0,
      isRunning: this.isRunning,
      cpuCycles: this.cpu?.getCycles() || 0
    };
  }

  async destroy(): Promise<void> {
    this.stop();
    this.romData = null;
  }
}
