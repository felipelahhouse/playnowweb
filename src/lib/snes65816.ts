export interface SNESMemoryMap {
  rom: Uint8Array;
  wram: Uint8Array;
  vram: Uint8Array;
  oam: Uint8Array;
  cgram: Uint8Array;
}

export class SNES65816CPU {
  // Registradores principais
  public A: number = 0;    // Accumulator
  public X: number = 0;    // Index X
  public Y: number = 0;    // Index Y
  public SP: number = 0x1FF; // Stack Pointer
  public PC: number = 0;   // Program Counter
  public PBR: number = 0;  // Program Bank Register
  public DBR: number = 0;  // Data Bank Register
  public D: number = 0;    // Direct Page Register

  // Status flags
  public P: number = 0x34; // Processor Status
  
  private memory: SNESMemoryMap;
  private cycles: number = 0;

  constructor(memory: SNESMemoryMap) {
    this.memory = memory;
  }

  reset() {
    this.A = 0;
    this.X = 0;
    this.Y = 0;
    this.SP = 0x1FF;
    this.PBR = 0;
    this.DBR = 0;
    this.D = 0;
    this.P = 0x34;
    
    // Read reset vector
    const resetVector = this.readWord(0xFFFC);
    this.PC = resetVector;
    this.cycles = 0;
  }

  readByte(address: number): number {
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;
    
    if (bank >= 0x80) {
      // ROM area
      const romAddress = ((bank - 0x80) << 16) | offset;
      if (romAddress < this.memory.rom.length) {
        return this.memory.rom[romAddress];
      }
    } else if (bank < 0x40) {
      // Various memory regions
      if (offset < 0x2000) {
        // WRAM mirror
        return this.memory.wram[offset];
      } else if (offset >= 0x8000) {
        // ROM mirror
        const romAddress = (bank << 16) | offset;
        if (romAddress < this.memory.rom.length) {
          return this.memory.rom[romAddress];
        }
      }
    } else if (bank >= 0x7E && bank <= 0x7F) {
      // WRAM
      const wramAddress = ((bank - 0x7E) << 16) | offset;
      if (wramAddress < this.memory.wram.length) {
        return this.memory.wram[wramAddress];
      }
    }
    
    return 0;
  }

  readWord(address: number): number {
    return this.readByte(address) | (this.readByte(address + 1) << 8);
  }

  writeByte(address: number, value: number) {
    const bank = (address >> 16) & 0xFF;
    const offset = address & 0xFFFF;
    
    if (bank >= 0x7E && bank <= 0x7F) {
      // WRAM
      const wramAddress = ((bank - 0x7E) << 16) | offset;
      if (wramAddress < this.memory.wram.length) {
        this.memory.wram[wramAddress] = value & 0xFF;
      }
    } else if (offset < 0x2000) {
      // WRAM mirror
      this.memory.wram[offset] = value & 0xFF;
    }
  }

  step(): number {
    const opcode = this.readByte((this.PBR << 16) | this.PC);
    this.PC = (this.PC + 1) & 0xFFFF;
    
    const oldCycles = this.cycles;
    this.executeInstruction(opcode);
    return this.cycles - oldCycles;
  }

  private executeInstruction(opcode: number) {
    switch (opcode) {
      case 0xEA: // NOP
        this.cycles += 2;
        break;
        
      case 0xA9: // LDA immediate
        this.A = this.readByte((this.PBR << 16) | this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setNZ(this.A);
        this.cycles += 2;
        break;
        
      case 0xA2: // LDX immediate
        this.X = this.readByte((this.PBR << 16) | this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setNZ(this.X);
        this.cycles += 2;
        break;
        
      case 0xA0: // LDY immediate
        this.Y = this.readByte((this.PBR << 16) | this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        this.setNZ(this.Y);
        this.cycles += 2;
        break;
        
      case 0x8D: // STA absolute
        const addr = this.readWord((this.PBR << 16) | this.PC);
        this.PC = (this.PC + 2) & 0xFFFF;
        this.writeByte((this.DBR << 16) | addr, this.A);
        this.cycles += 4;
        break;
        
      case 0x4C: // JMP absolute
        this.PC = this.readWord((this.PBR << 16) | this.PC);
        this.cycles += 3;
        break;
        
      case 0x80: // BRA (branch always)
        const offset = this.readByte((this.PBR << 16) | this.PC);
        this.PC = (this.PC + 1) & 0xFFFF;
        this.PC = (this.PC + (offset < 128 ? offset : offset - 256)) & 0xFFFF;
        this.cycles += 3;
        break;
        
      default:
        // Unknown opcode - just advance
        this.cycles += 2;
        break;
    }
  }

  private setNZ(value: number) {
    this.P = (this.P & ~0x82) | (value === 0 ? 0x02 : 0) | (value & 0x80);
  }

  getCycles(): number {
    return this.cycles;
  }
}