//app
import configureApp from './app/express';

//auth
import authApi from './auth/http.api.authenticate.middleware';
import authEmailPassword from './auth/http.email.password.authenticate.middleware';
import authJWT from './auth/http.jwt.authenticate.middleware';
import authJWTPromise from './auth/promise.jwt.authenticate.middleware';
import authUserRole from './auth/http.jwt.authenticate.middleware';
import configureAuth from './auth/passport';

//config
import config, {schema as configSchema, validate as validateConfig} from './config/config';

//errors
import BaseError from './errors/base.error';
import HttpError, {ApiHttpError, UnauthorizedHttpError, BadRequestHttpError, NotFoundHttpError} from './errors/http.error';
import AmqpError, {AmqpTimeoutError} from './errors/amqp.error';
import {SkipWorkerError} from './errors/worker.error';

//logger
import logger, {configureLogger} from './logger/logger';

//helpers
import numberHelper from './helpers/number';

//services
import Service from './service/service';

//amqp
import amqp from './app/amqp';

//controllers
import amqpController from './controllers/amqp.controller';

//db
import configureMongoose, {connect as connectMongoose, disconnect as disconnectMongoose} from './app/mongoose';

//workers
import Worker from './worker/pool';

export {
  //app
  configureApp,

  //db
  configureMongoose,
  connectMongoose,
  disconnectMongoose,

  //amqp
  amqp,
  amqpController,

  //auth
  configureAuth,
  authApi,
  authEmailPassword,
  authJWT,
  authJWTPromise,
  authUserRole,

  //config
  config,
  configSchema,
  validateConfig,

  //errors
  BaseError,
  HttpError,
  ApiHttpError,
  UnauthorizedHttpError,
  BadRequestHttpError,
  NotFoundHttpError,
  SkipWorkerError,
  AmqpError,
  AmqpTimeoutError,

  //logger
  configureLogger,
  logger,

  //helpers
  numberHelper,

  //services
  Service,

  //workers
  Worker,
};