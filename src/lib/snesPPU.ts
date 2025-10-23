import { SNESMemoryMap } from './snes65816';

export class SNESPPU {
  private memory: SNESMemoryMap;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;
  private pixels: Uint32Array;
  
  // PPU registers
  private vramAddress: number = 0;
  
  // Background data
  private bgMode: number = 0;
  private bg1TileBase: number = 0;
  private bg1MapBase: number = 0;
  private bg1ScrollX: number = 0;
  private bg1ScrollY: number = 0;
  
  // Color palette (15-bit to 32-bit RGBA)
  private palette: Uint32Array = new Uint32Array(256);
  
  constructor(canvas: HTMLCanvasElement, memory: SNESMemoryMap) {
    this.canvas = canvas;
    this.memory = memory;
    
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = context;
    
    this.canvas.width = 256;
    this.canvas.height = 224;
    
    this.imageData = this.ctx.createImageData(256, 224);
    this.pixels = new Uint32Array(this.imageData.data.buffer);
    
    this.initializePalette();
  }
  
  private initializePalette() {
    // Initialize with some basic colors for demonstration
    for (let i = 0; i < 256; i++) {
      const r = (i & 0x1F) << 3;
      const g = ((i >> 5) & 0x1F) << 3;
      const b = ((i >> 10) & 0x1F) << 3;
      this.palette[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
    }
    
    // Ensure background is black
    this.palette[0] = 0xFF000000;
  }
  
  renderFrame() {
    // Clear screen
    this.pixels.fill(0xFF000000);
    
    switch (this.bgMode) {
      case 0:
        this.renderMode0();
        break;
      case 1:
        this.renderMode1();
        break;
      default:
        this.renderTestPattern();
        break;
    }
    
    // Render sprites
    this.renderSprites();
    
    // Update canvas
    this.ctx.putImageData(this.imageData, 0, 0);
  }
  
  private renderMode0() {
    // Mode 0: 4 layers, 2bpp each
    this.renderBackground(0, 2); // BG1
  }
  
  private renderMode1() {
    // Mode 1: BG1&2 are 4bpp, BG3 is 2bpp
    this.renderBackground(0, 4); // BG1
    this.renderBackground(1, 4); // BG2
    this.renderBackground(2, 2); // BG3
  }
  
  private renderBackground(bgNum: number, bpp: number) {
    const tilemapBase = this.getBackgroundTilemapBase(bgNum);
    const tileBase = this.getBackgroundTileBase(bgNum);
    const scrollX = this.getBackgroundScrollX(bgNum);
    const scrollY = this.getBackgroundScrollY(bgNum);
    
    const tilesPerRow = 32;
    
    for (let screenY = 0; screenY < 224; screenY++) {
      for (let screenX = 0; screenX < 256; screenX++) {
        const mapX = (screenX + scrollX) >> 3;
        const mapY = (screenY + scrollY) >> 3;
        const tileX = (screenX + scrollX) & 7;
        const tileY = (screenY + scrollY) & 7;
        
        if (mapX >= tilesPerRow || mapY >= tilesPerRow) continue;
        
        const tilemapAddr = tilemapBase + (mapY * tilesPerRow + mapX) * 2;
        if (tilemapAddr >= this.memory.vram.length) continue;
        
        const tileInfo = this.memory.vram[tilemapAddr] | (this.memory.vram[tilemapAddr + 1] << 8);
        const tileIndex = tileInfo & 0x3FF;
        const palette = (tileInfo >> 10) & 0x7;
        const flipX = (tileInfo & 0x4000) !== 0;
        const flipY = (tileInfo & 0x8000) !== 0;
        
        const finalTileX = flipX ? (7 - tileX) : tileX;
        const finalTileY = flipY ? (7 - tileY) : tileY;
        
        const colorIndex = this.getTilePixel(tileBase, tileIndex, finalTileX, finalTileY, bpp);
        
        if (colorIndex > 0) {
          const paletteIndex = (palette << (bpp === 2 ? 2 : 4)) + colorIndex;
          const pixelIndex = screenY * 256 + screenX;
          this.pixels[pixelIndex] = this.palette[paletteIndex];
        }
      }
    }
  }
  
  private getTilePixel(tileBase: number, tileIndex: number, x: number, y: number, bpp: number): number {
    const bytesPerTile = (bpp === 2) ? 16 : 32;
    const tileAddr = tileBase + tileIndex * bytesPerTile;
    
    if (tileAddr >= this.memory.vram.length) return 0;
    
    let colorIndex = 0;
    
    if (bpp === 2) {
      // 2bpp mode
      const plane0Addr = tileAddr + y * 2;
      const plane1Addr = tileAddr + y * 2 + 1;
      
      if (plane1Addr < this.memory.vram.length) {
        const plane0 = this.memory.vram[plane0Addr];
        const plane1 = this.memory.vram[plane1Addr];
        
        const bit = 7 - x;
        colorIndex = ((plane0 >> bit) & 1) | (((plane1 >> bit) & 1) << 1);
      }
    } else {
      // 4bpp mode
      const plane0Addr = tileAddr + y * 2;
      const plane1Addr = tileAddr + y * 2 + 1;
      const plane2Addr = tileAddr + y * 2 + 16;
      const plane3Addr = tileAddr + y * 2 + 17;
      
      if (plane3Addr < this.memory.vram.length) {
        const plane0 = this.memory.vram[plane0Addr];
        const plane1 = this.memory.vram[plane1Addr];
        const plane2 = this.memory.vram[plane2Addr];
        const plane3 = this.memory.vram[plane3Addr];
        
        const bit = 7 - x;
        colorIndex = ((plane0 >> bit) & 1) | 
                    (((plane1 >> bit) & 1) << 1) |
                    (((plane2 >> bit) & 1) << 2) |
                    (((plane3 >> bit) & 1) << 3);
      }
    }
    
    return colorIndex;
  }
  
  private renderSprites() {
    // Simple sprite rendering
    for (let sprite = 0; sprite < 128; sprite++) {
      const spriteAddr = sprite * 4;
      if (spriteAddr + 3 >= this.memory.oam.length) break;
      
      const x = this.memory.oam[spriteAddr];
      const y = this.memory.oam[spriteAddr + 1];
      const tile = this.memory.oam[spriteAddr + 2];
      const attr = this.memory.oam[spriteAddr + 3];
      
      if (x === 0 && y === 0) continue; // Skip empty sprites
      
      const palette = (attr & 0x0E) >> 1;
      
      // Render 8x8 sprite
      for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
          const screenX = (x + sx) & 0xFF;
          const screenY = (y + sy) & 0xFF;
          
          if (screenX >= 256 || screenY >= 224) continue;
          
          const colorIndex = this.getTilePixel(0x6000, tile, sx, sy, 4);
          if (colorIndex > 0) {
            const paletteIndex = 128 + (palette << 4) + colorIndex;
            const pixelIndex = screenY * 256 + screenX;
            this.pixels[pixelIndex] = this.palette[paletteIndex];
          }
        }
      }
    }
  }
  
  private renderTestPattern() {
    // Render a test pattern when no valid graphics are available
    for (let y = 0; y < 224; y++) {
      for (let x = 0; x < 256; x++) {
        const pixelIndex = y * 256 + x;
        
        // Create a checkerboard pattern with some color variation
        const checkSize = 16;
        const checkX = Math.floor(x / checkSize);
        const checkY = Math.floor(y / checkSize);
        const isCheck = (checkX + checkY) % 2 === 0;
        
        let color = 0xFF000000; // Black
        if (isCheck) {
          const r = (x * 2) & 0xFF;
          const g = (y * 2) & 0xFF;
          const b = ((x + y) * 2) & 0xFF;
          color = 0xFF000000 | (b << 16) | (g << 8) | r;
        }
        
        this.pixels[pixelIndex] = color;
      }
    }
  }
  
  private getBackgroundTilemapBase(bgNum: number): number {
    // Return tilemap base addresses
    switch (bgNum) {
      case 0: return this.bg1MapBase;
      case 1: return 0x0800;
      case 2: return 0x1000;
      case 3: return 0x1800;
      default: return 0;
    }
  }
  
  private getBackgroundTileBase(bgNum: number): number {
    // Return tile base addresses
    switch (bgNum) {
      case 0: return this.bg1TileBase;
      case 1: return 0x1000;
      case 2: return 0x2000;
      case 3: return 0x3000;
      default: return 0;
    }
  }
  
  private getBackgroundScrollX(bgNum: number): number {
    switch (bgNum) {
      case 0: return this.bg1ScrollX;
      default: return 0;
    }
  }
  
  private getBackgroundScrollY(bgNum: number): number {
    switch (bgNum) {
      case 0: return this.bg1ScrollY;
      default: return 0;
    }
  }
  
  writeRegister(address: number, value: number) {
    switch (address) {
      case 0x2105: // BGMODE
        this.bgMode = value & 0x07;
        break;
      case 0x2107: // BG1SC
        this.bg1MapBase = (value & 0xFC) << 8;
        break;
      case 0x210B: // BG12NBA
        this.bg1TileBase = (value & 0x0F) << 12;
        break;
      case 0x210D: // BG1HOFS
        this.bg1ScrollX = value;
        break;
      case 0x210E: // BG1VOFS
        this.bg1ScrollY = value;
        break;
      case 0x2116: // VMADDL
        this.vramAddress = (this.vramAddress & 0xFF00) | value;
        break;
      case 0x2117: // VMADDH
        this.vramAddress = (this.vramAddress & 0x00FF) | (value << 8);
        break;
      case 0x2118: // VMDATAL
        if (this.vramAddress < this.memory.vram.length) {
          this.memory.vram[this.vramAddress] = value;
        }
        break;
      case 0x2119: // VMDATAH
        if (this.vramAddress + 1 < this.memory.vram.length) {
          this.memory.vram[this.vramAddress + 1] = value;
        }
        break;
    }
  }
  
  readRegister(address: number): number {
    switch (address) {
      case 0x2139: // VMDATALREAD
        return this.vramAddress < this.memory.vram.length ? this.memory.vram[this.vramAddress] : 0;
      case 0x213A: // VMDATAHREAD
        return this.vramAddress + 1 < this.memory.vram.length ? this.memory.vram[this.vramAddress + 1] : 0;
      default:
        return 0;
    }
  }
  
  updatePalette(index: number, color: number) {
    if (index < this.palette.length) {
      // Convert 15-bit color to 32-bit RGBA
      const r = (color & 0x1F) << 3;
      const g = ((color >> 5) & 0x1F) << 3;
      const b = ((color >> 10) & 0x1F) << 3;
      this.palette[index] = 0xFF000000 | (b << 16) | (g << 8) | r;
    }
  }
}