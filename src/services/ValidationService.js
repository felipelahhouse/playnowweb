/**
 * Validation Service
 * Valida dados recebidos do servidor para evitar erros
 */

import Logger from './Logger';

class ValidationService {
  /**
   * Validar estrutura de GameSession
   */
  validateGameSession(data) {
    const errors = [];

    if (!data) {
      errors.push('GameSession data is null/undefined');
      return { valid: false, errors };
    }

    // Validações obrigatórias
    const requiredFields = ['id', 'hostUserId', 'hostName', 'gameId', 'gameTitle', 'gamePlatform'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validações de tipo
    if (typeof data.maxPlayers !== 'number' || data.maxPlayers < 1) {
      errors.push('maxPlayers must be a positive number');
    }

    if (typeof data.currentPlayers !== 'number' || data.currentPlayers < 0) {
      errors.push('currentPlayers must be a non-negative number');
    }

    if (!Array.isArray(data.players)) {
      errors.push('players must be an array');
    }

    if (!['waiting', 'playing', 'finished'].includes(data.status)) {
      errors.push('Invalid status value');
    }

    if (data.currentPlayers > data.maxPlayers) {
      errors.push('currentPlayers cannot exceed maxPlayers');
    }

    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : null
    };
  }

  /**
   * Validar lista de sessões
   */
  validateSessionsList(data) {
    if (!Array.isArray(data)) {
      return {
        valid: false,
        errors: ['Sessions list must be an array'],
        data: null
      };
    }

    const invalidSessions = [];
    const validSessions = [];

    for (let i = 0; i < data.length; i++) {
      const validation = this.validateGameSession(data[i]);
      if (validation.valid) {
        validSessions.push(validation.data);
      } else {
        invalidSessions.push({
          index: i,
          errors: validation.errors
        });
      }
    }

    if (invalidSessions.length > 0) {
      Logger.warn('ValidationService', `Found ${invalidSessions.length} invalid sessions`, {
        invalidSessions
      });
    }

    return {
      valid: invalidSessions.length === 0,
      errors: invalidSessions,
      data: validSessions
    };
  }

  /**
   * Sanitizar string (remover scripts etc)
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return '';
    
    return str
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  /**
   * Sanitizar dados de usuário
   */
  sanitizeUserData(data) {
    return {
      ...data,
      username: this.sanitizeString(data.username),
      displayName: this.sanitizeString(data.displayName),
      email: this.sanitizeString(data.email)
    };
  }

  /**
   * Validar evento de Socket.IO
   */
  validateSocketEvent(eventName, data) {
    const validations = {
      'joined-room': (d) => typeof d === 'object' && 'success' in d && 'playerId' in d,
      'session-created': (d) => typeof d === 'object' && 'id' in d && 'hostUserId' in d,
      'player-joined': (d) => typeof d === 'object' && 'player' in d,
      'player-input': (d) => typeof d === 'object' && 'key' in d && 'playerId' in d,
      'game-state': (d) => typeof d === 'object' && 'state' in d,
      'session-error': (d) => typeof d === 'object' && 'error' in d
    };

    const validator = validations[eventName];
    if (!validator) {
      Logger.warn('ValidationService', `No validator for event: ${eventName}`);
      return true;
    }

    try {
      const isValid = validator(data);
      if (!isValid) {
        Logger.error('ValidationService', `Invalid data for event: ${eventName}`, new Error('Validation failed'), {
          eventName,
          data
        });
      }
      return isValid;
    } catch (error) {
      Logger.error('ValidationService', `Validation error for event: ${eventName}`, error, {
        eventName,
        data
      });
      return false;
    }
  }
}

export default new ValidationService();