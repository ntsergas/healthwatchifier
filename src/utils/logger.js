const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

class Logger {
  constructor(context = 'APP', level = LOG_LEVELS.INFO) {
    this.context = context;
    this.level = level;
  }

  _log(level, message, ...args) {
    if (level < this.level) return;
    
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    const prefix = `[${timestamp}] ${levelName} [${this.context}]`;
    
    if (args.length > 0) {
      console.log(`${prefix} ${message}`, ...args);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message, ...args) {
    this._log(LOG_LEVELS.DEBUG, message, ...args);
  }

  info(message, ...args) {
    this._log(LOG_LEVELS.INFO, message, ...args);
  }

  warn(message, ...args) {
    this._log(LOG_LEVELS.WARN, message, ...args);
  }

  error(message, ...args) {
    this._log(LOG_LEVELS.ERROR, message, ...args);
  }

  // Special methods for common debugging patterns
  entry(functionName, params = {}) {
    this.debug(`→ ${functionName}`, params);
  }

  exit(functionName, result = null) {
    this.debug(`← ${functionName}`, result ? { result } : undefined);
  }

  // Create a child logger with a specific context
  child(context) {
    return new Logger(`${this.context}:${context}`, this.level);
  }
}

// Export a default logger and the Logger class
export const logger = new Logger();
export { Logger, LOG_LEVELS }; 