import BaseError from './base.error';
import httpStatus from 'http-status';

export default class AmqpError extends BaseError {
  constructor(message, details = {}, status = httpStatus.INTERNAL_SERVER_ERROR) {
    super(message);
    this.message = message;
    this.status = status;
    this.details = details;
  }
}

export class AmqpTimeoutError extends AmqpError {
  constructor(message, details = {}, status = httpStatus.REQUEST_TIMEOUT) {
    super(message, details, status);
  }
}
