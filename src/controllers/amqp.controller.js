import logger from '../logger/logger';
import AmqpError from '../errors/amqp.error';
import validate from '../validation/validation';
import config from "../config/config";
import Service from "../service/service";

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
        logger.log({schema});
      } catch (e) {
        //schema not defined or doesn't exists at all
      }
      const ctrl = require(this.dir + '/' + controller);
      if (!data) return ctrl[fn]();
      
      logger.log({data});
      
      //validate schema
      return (schema ? validate(schema, data) : Promise.resolve())
        //check auth
        .then(() => ctrl._auth && ctrl._auth[fn]
          ? Service.User.request('user.canAccess', {jwt: data.jwt, ...ctrl._auth[fn]})
          : Promise.resolve())
        //process request
        .then(() => ctrl[fn](data))
        .catch(e => {
          logger.info(e);
          return Promise.reject(e)
        })


    } catch (e) {
      logger.error({
        message: e.message,
        controller, function: fn});
      return Promise.reject(e);
    }
  };
}
