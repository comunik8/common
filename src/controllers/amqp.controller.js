import logger from '../logger/logger';
import AmqpError from '../errors/amqp.error';
import validate from '../validation/validation';

function getMethodFromPath(path) {
  return (path.split('/')[1] || 'index').replace(/-/g, '_');
}

function getControllerFromPath(path) {
  return `amqp.${path.split('/')[0].replace(/-/g, '.')}.controller`;
}

export default class Controller {

  constructor(dir) {
    this.dir = dir;
  }

  handle = (data, info) => {
    const regex = /^(.*)\.(.*)$/,
        controller = `amqp.${info.key.replace(regex, '$1')}.controller.js`,
        validator = `amqp.${info.key.replace(regex, '$1')}.validator.js`,
        fn = info.key.replace(regex, '$2');

    try {
      let schema;
      try {
        schema = require(this.dir + '/' + validator)[fn];
      } catch (e) {
        //schema not defined or doesn't exists at all
      }

      if (schema) return validate(schema, data).then(() => require(this.dir + '/' + controller)[fn](data));
      return require(this.dir + '/' + controller)[fn](data);

    } catch (e) {
      logger.error({message: 'Failed to process amqp action,', controller, function: fn, e});
      return Promise.reject(new AmqpError('Internal Error'));
    }
  };
}
