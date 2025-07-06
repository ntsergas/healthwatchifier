class Logger {
  constructor(name = 'RSS Worker') {
    this.name = name;
  }

  child(childName) {
    return new Logger(`${this.name}:${childName}`);
  }

  _log(level, message, data = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      ...data
    }));
  }

  debug(message, data) {
    this._log('debug', message, data);
  }

  info(message, data) {
    this._log('info', message, data);
  }

  warn(message, data) {
    this._log('warn', message, data);
  }

  error(message, data) {
    this._log('error', message, data);
  }

  entry(functionName, data = {}) {
    this._log('debug', `Entering ${functionName}`, data);
  }
}

export const logger = new Logger(); 