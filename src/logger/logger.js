import winston from 'winston';
import AMQPLogger from './logger.amqp.service';

const transports = [
  {
    'name': 'console',
    'fn': new (winston.transports.Console)({
      json: true,
      colorize: true,
      timestamp: true,
      humanReadableUnhandledException: true,
      handleExceptions: true,
    }),
  },
  {
    'name': 'amqp.logger',
    'fn': new AMQPLogger,
  },
];

let _logger = console;

export const configureLogger = () => {
  const use_transports = ['console', 'amqp.logger'];
  _logger = new (winston.Logger)({transports: use_transports.map(t => (transports.find(f => f.name === t) || {}).fn).filter(f => f)});
};

const logger = {
  info: (...args) => _logger.info(...args),
  log: (...args) => _logger.log(...args),
  warn: (...args) => _logger.warn(...args),
  error: (...args) => _logger.error(...args),
};

export default logger;