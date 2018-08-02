import util from 'util';
import winston from 'winston';
import Service from '../service/service';
import amqp from '../app/amqp'

const logger = winston.transports.logs = function(options = {}) {
  this.name = 'logs.service';
  this.level = options.level || 'info';
};

util.inherits(logger, winston.Transport);

logger.prototype.log = function(level, msg, meta, callback) {
  //exclude api 404
  if (JSON.stringify(meta).match(/Error: API not found/i)) return callback(null, true);

  Service.Logs.request('error.all', {msg, level, meta, app: amqp.app})
      .then(() => callback(null, true))
      .catch(e => callback(e, false));
};

export default logger;

