import amqplib from 'amqplib/callback_api';
import AmqpError, {AmqpTimeoutError} from '../errors/amqp.error';
import logger from '../logger/logger';
import {v4 as uuid} from 'uuid';

const amqp = {
  uuid: uuid().toString(),

  _connection: null,
  _channel: null,

  // api listener
  _api: null,
  // listeners
  _handlers: {},

  // rpc
  _response_queue: null,
  _responses: {},
};

// add config.env prefix for non-production environments
amqp.getPath = (...args) => (amqp.env === 'production' ? '' : `${amqp.env}.`) + args.join('.');

amqp.checkIsConnected = () => {
  if (!amqp._connection) return Promise.reject(new AmqpError('no open connection'));
  if (!amqp._channel) return Promise.reject(new AmqpError('no open channel'));

  return Promise.resolve();
};

amqp.checkExchangeExists = (name, type = 'topic', options = {durable: true}) =>
  new Promise((resolve, reject) =>
    amqp._channel.assertExchange(name, type, options, (err, e) => (err ? reject(e) : resolve(e))))

amqp.checkQueueExists = (name, options = {durable: true, exclusive: false}) =>
  new Promise((resolve, reject) =>
    amqp._channel.assertQueue(name, options, (err, q) => (err ? reject(err) : resolve(q))))

// RPC

amqp.request = (service, key, data, execution_timeout = null) => {
  const request_queue = amqp.getPath('api', service),
      response_queue = amqp.getPath(amqp.uuid),
      message_uuid = uuid().toString();

  return new Promise((request_resolve, request_reject) => {

    let timeout;

    if (execution_timeout) {
      timeout = setTimeout(() => {
        if (amqp._responses[message_uuid]) delete amqp._responses[message_uuid];
        return request_reject(new AmqpTimeoutError(`Execution time limit of ${execution_timeout}s reached.`, {service, key, data}));
      }, execution_timeout * 1000);
    }

    amqp.checkIsConnected()
        .then(() => Promise.all([
          amqp.checkQueueExists(request_queue),
          amqp.checkQueueExists(response_queue, {durable: true, exclusive: true}),
        ]))
        .then(() => {
          amqp._responses[message_uuid] = {fn: (error, data) => error ? request_reject(error) : request_resolve(data), timeout};

          if (!amqp._response_queue) {
            amqp._response_queue = response_queue;

            return new Promise((resolve, reject) => {
              amqp._channel.consume(response_queue, (msg) => {
                    const id = msg.properties.correlationId,
                        message = JSON.parse(msg.content.toString()),
                        response = amqp._responses[id];

                    // ignore non-recognised messages
                    if (!response) return;

                    // clear timeouts
                    if (amqp._responses[id].timeout) clearTimeout(amqp._responses[id].timeout);
                    if (response.timeout) clearTimeout(response.timeout);

                    // delete response reference
                    delete amqp._responses[id];

                    // process response
                    if (message.error || message.data) {
                      return response.fn(message.error, message.data, message.info);
                    }
                  },
                  {noAck: true},
                  (err, ok) => {
                    if (err) reject(err);
                    resolve(ok);
                  });
            });
          }
        })
        .then(() => amqp._channel.sendToQueue(
            request_queue,
            Buffer.from(JSON.stringify({data, info: {key, exchange: request_queue, path: `${request_queue}.${key}`}})),
            {correlationId: message_uuid, replyTo: response_queue}),
        );
  });
};

amqp.addApiListener = (handler) => {
  const api_queue = amqp.getPath('api', amqp.app);
  return amqp.checkIsConnected()
      .then(() => amqp.checkQueueExists(api_queue, {durable: true, exclusive: false}))
      .then(() => {
        if (amqp._api) return Promise.reject(new AmqpError('api listener already defined'));

        // prefetch to load balance
        amqp._channel.prefetch(100);

        // response
        const reply = (response, info, msg) => {
          if (msg.properties.replyTo) {
            let data, error = null;

            if (response instanceof Error) {
              error = response;
            } else {
              data = response;
            }

            amqp._channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify({data, error, info})),
                {correlationId: msg.properties.correlationId},
            );
          }

          amqp._channel.ack(msg);
          return Promise.resolve();
        };

        // add handler
        amqp._api = (data, info, msg) => {
          try {
            return handler(data, info)
                .then(response => reply(response, info, msg))
                .catch(e => reply(e instanceof Error ? e : new Error(e), info, msg));
          } catch (e) {
            logger.error(e);
            amqp._channel.ack(msg);
          }
        };

        return new Promise((resolve, reject) => {
          amqp._channel.consume(
              api_queue, msg => amqp._api(
                  JSON.parse(msg.content.toString()).data,
                  JSON.parse(msg.content.toString()).info,
                  msg),
              {noAck: false},
              (err, ok) => {
                if (err) return reject(err);
                resolve(ok);
              });
        });
      });
};

// PUB - SUB

amqp.send = (exchange, key, data, options = {}) => amqp.checkIsConnected()
  .then(() => amqp.checkExchangeExists(amqp.getPath(exchange)))
  .then(() => amqp._channel.publish(amqp.getPath(exchange), key, Buffer.from(JSON.stringify(data)), {persistent: true, content_type: 'application/json', ...options})
    ? Promise.resolve({}) //todo return data ?
    : Promise.reject(new AmqpError('failed to send')))

amqp.addListener = (exchange, key, handler, force = false) => amqp.checkIsConnected()
  .then(() => amqp.checkExchangeExists(amqp.getPath(exchange)))
  .then(() => amqp.checkQueueExists('', {exclusive: true, durable: true}))
  .then((q) => {
    const path = amqp.getPath(exchange, key);
    if (amqp._handlers[path] && !force) return Promise.reject(new AmqpError(`another listener already exists for ${path}, use force=true to override`));

    if (!amqp._handlers[path]) amqp._channel.bindQueue(q.queue, amqp.getPath(exchange), key);
    //todo handle failures (Promise.reject)
    amqp._handlers[path] = (data, info) => handler(data, info);

    return new Promise((resolve, reject) => amqp._channel.consume(
      q.queue,
      msg => amqp._handlers[path](JSON.parse(msg.content.toString()), {exchange: amqp.getPath(exchange), key, path}) ,
      {noAck: true},
      (err, ok) => {
        if (err) return reject(err);
        resolve(ok);
      }));
  })

// CONFIG

amqp.configure = (config) => {
  amqp.app = config.app;
  amqp.env = config.env;

  const uri = `${config.amqp.protocol}://${config.amqp.username}:${config.amqp.password}@${config.amqp.server}`,
      options = {
        noDelay: true,
        ...(config.amqp.options || {}),
      };

  return new Promise((resolve, reject) => {
    amqplib.connect(uri, options, function(err, conn) {
      if (err) return reject(err);

      amqp._connection = conn;
      conn.createChannel((err, ch) => {
        if (err) return reject(err);

        amqp._channel = ch;
        resolve(amqp);
      });
    });
  });
};

export default amqp;
