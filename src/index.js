//app
import configureApp from './app/express';

//auth
import authApi from './auth/api.middleware';
import authEmailPassword from './auth/email.password.middleware';
import authJWT from './auth/jwt.middleware';
import authUserRole from './auth/user.middleware';
import configureAuth from './auth/passport';

//config
import config, {schema as configSchema, validate as validateConfig} from './config/config';

//errors
import BaseError from './errors/base.error';
import HttpError, {ApiHttpError, UnauthorizedHttpError, BadRequestHttpError, NotFoundHttpError} from './errors/http.error';
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