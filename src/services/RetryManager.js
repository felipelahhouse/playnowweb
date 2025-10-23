/**
 * Retry Manager Service
 * Centraliza a lógica de retry com exponential backoff
 */

import Logger from './Logger';

class RetryManager {
  /**
   * Executar uma função com retry e backoff exponencial
   * @param {Function} fn - Função a executar
   * @param {Object} options - Opções de retry
   * @returns {Promise} Resultado da função ou erro
   */
  async executeWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelayMs = 1000,
      maxDelayMs = 30000,
      backoffMultiplier = 2,
      onRetry = null,
      name = 'Operation'
    } = options;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.debug('RetryManager', `Executing: ${name}`, { 
          attempt,
          maxRetries 
        });

        const result = await fn(attempt);
        
        if (attempt > 1) {
          Logger.log('RetryManager', `${name} succeeded on retry`, {
            attempt,
            totalAttempts: maxRetries
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        Logger.warn('RetryManager', `${name} failed on attempt ${attempt}/${maxRetries}`, {
          attempt,
          error: error?.message
        });

        if (attempt < maxRetries) {
          const delayMs = Math.min(
            initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
            maxDelayMs
          );

          Logger.debug('RetryManager', `Waiting ${delayMs}ms before retry...`, {
            attempt,
            nextAttempt: attempt + 1,
            delayMs
          });

          if (onRetry) {
            try {
              onRetry(attempt, maxRetries, delayMs);
            } catch (error) {
              Logger.error('RetryManager', 'Error in onRetry callback', error);
            }
          }

          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    const finalError = new Error(
      `${name} failed after ${maxRetries} attempts: ${lastError?.message}`
    );
    Logger.error('RetryManager', `${name} exhausted all retries`, lastError, {
      maxRetries,
      lastError: lastError?.message
    });

    throw finalError;
  }

  /**
   * Retry com timeout
   */
  async executeWithTimeout(fn, timeoutMs, options = {}) {
    return Promise.race([
      this.executeWithRetry(fn, options),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ]);
  }

  /**
   * Executar com circuit breaker (pula retries se falhar muito)
   */
  async executeWithCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeoutMs = 60000,
      name = 'Operation'
    } = options;

    const breaker = this.getCircuitBreaker(name);

    if (breaker.isOpen) {
      if (Date.now() - breaker.openedAt > resetTimeoutMs) {
        Logger.log('RetryManager', `Circuit breaker reset for: ${name}`);
        breaker.isOpen = false;
        breaker.failures = 0;
      } else {
        throw new Error(`Circuit breaker OPEN for ${name} - too many failures`);
      }
    }

    try {
      const result = await fn();
      breaker.failures = 0;
      return result;
    } catch (error) {
      breaker.failures++;

      if (breaker.failures >= failureThreshold) {
        breaker.isOpen = true;
        breaker.openedAt = Date.now();
        Logger.error('RetryManager', `Circuit breaker OPENED for: ${name}`, error, {
          failures: breaker.failures,
          threshold: failureThreshold
        });
      }

      throw error;
    }
  }

  /**
   * Obter ou criar circuit breaker
   */
  getCircuitBreaker(name) {
    if (!this.circuitBreakers) {
      this.circuitBreakers = {};
    }

    if (!this.circuitBreakers[name]) {
      this.circuitBreakers[name] = {
        isOpen: false,
        failures: 0,
        openedAt: null
      };
    }

    return this.circuitBreakers[name];
  }

  /**
   * Resetar circuit breaker
   */
  resetCircuitBreaker(name) {
    if (this.circuitBreakers && this.circuitBreakers[name]) {
      this.circuitBreakers[name] = {
        isOpen: false,
        failures: 0,
        openedAt: null
      };
      Logger.log('RetryManager', `Circuit breaker reset: ${name}`);
    }
  }
}

export default new RetryManager();