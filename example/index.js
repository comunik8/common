import express from 'express';

// config should be imported before importing any other file
import config from './config';

import amqp from '../src/app/amqp';

//import config helpers
import {configureLogger, configureAuth, configureApp, configureMongoose, authApi, mailService} from 'comunik8-common';

// init logs
configureLogger();

// init auth
configureAuth(config);

// init database
configureMongoose(config);

// configure routes
const router = express.Router();
router.get('/auth-only',
    // api authentication
    authApi, (req, res) => res.json({}));
router.post('/send-mail',
    // service usage
    (req, res, next) => mailService.send({
      sender: 'test@domain.com', from: 'Test ACC <test@domain.com>', to: 'example@domain.com',
      subject: 'sample email', html: '<div>Hello World</div>', text: 'hello world',
    }));

// init app
const app = configureApp(router);

import {Service} from '../src/index';

Service.Mail.send('email.send', {data});

amqp.addApiListener((data, info) => {

  {exchange: 'comunik8.common', key: 'email.send' , path: }
});

// module.parent check is required to support mocha watch
// src: https://github.com/mochajs/mocha/issues/1912
if (!module.parent) {
  // listen on port config.port
  app.listen(config.port, () => {
    console.info(`server started on port ${config.port} (${config.env})`);
  });
}

//configure workers

import {Worker} from 'comunik8-common';

const worker = new Worker({
  maxWorkers: 1,
  tasks: {
    runEverySecond: {
      module: `${__dirname}/task`,
      command: 'run',
      interval: 1000,
    },
  },
});

export default app;
