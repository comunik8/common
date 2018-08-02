import amqp from '../app/amqp';

export const SERVICE_MAIL = 'mail';
export const SERVICE_TEXT = 'text';
export const SERVICE_USER = 'user';
export const SERVICE_URL = 'url';
export const SERVICE_SESSION = 'session';
export const SERVICE_LEVEL_UP = 'levelup';
export const SERVICE_CALL_SCRIPT = 'callscript';
export const SERVICE_ADDRESS = 'address';
export const SERVICE_TASK = 'task';
export const SERVICE_LOGS = 'logs';

export default class Service {

  constructor(service) {
    this.service = service;
    return this;
  }

  //proxy to amqp
  request(key, data, execution_timeout) {
    return amqp.request(this.service, key, data, execution_timeout);
  }

  send(key, data, options = {}) {
    return amqp.send(this.service, key, data, options);
  }

  addListener(key, handler, force = false) {
    return amqp.addListener(this.service, key, handler, force);
  }

  // shortcuts for common services
  static get Mail() {
    return new Service(SERVICE_MAIL);
  }

  static get Text() {
    return new Service(SERVICE_TEXT);
  }

  static get User() {
    return new Service(SERVICE_USER);
  }

  static get Session() {
    return new Service(SERVICE_SESSION);
  }

  static get LevelUp() {
    return new Service(SERVICE_LEVEL_UP);
  }

  static get Url() {
    return new Service(SERVICE_URL);
  }

  static get CallScript() {
    return new Service(SERVICE_CALL_SCRIPT);
  }

  static get Address() {
    return new Service(SERVICE_ADDRESS);
  }

  static get Task() {
    return new Service(SERVICE_TASK);
  }

  static get Logs() {
    return new Service(SERVICE_LOGS);
  }
}