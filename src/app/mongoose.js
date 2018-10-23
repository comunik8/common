import fs from 'fs';

let mongoUri, mongoOptions;

const notConfigured = () => new Error('Not Configured');
let connect = notConfigured,
    disconnect = notConfigured;

const configure = (config, mongoose = null, connect_automatically = true) => {
  mongoose = mongoose || require('mongoose');

  connect = () => {
    return mongoose.connect(mongoUri, mongoOptions);
  };

  disconnect = () => mongoose.disconnect();

  // make bluebird default Promise
  Promise = require('bluebird');

  // plugin bluebird promise in mongoose
  mongoose.Promise = Promise;

  // connect to mongo db
  mongoOptions = {authSource: config.mongo.db, useNewUrlParser: true};
  if (config.mongo.servers.indexOf(',') >= 0) mongoOptions.replicaSet = config.mongo.rs;
  if (config.mongo.ssl) {
    mongoOptions = {
      ...mongoOptions,
      ssl: true,
    };
  }
  if (config.mongo.cert) {
    mongoOptions = {
      ...mongoOptions,
      ssl: true,
      sslCert: fs.readFileSync(config.mongo.cert),
      sslKey: fs.readFileSync(config.mongo.key),
    };
  }
  let credentials = '';
  if (config.mongo.username) credentials += config.mongo.username;
  if (config.mongo.password) credentials += `:${config.mongo.password}`;
  if (credentials.length) credentials += '@';

  mongoUri = `mongodb://${credentials}${config.mongo.servers}/${config.mongo.db}`;

  if (connect_automatically) {
    mongoose.connection.on('error', (e) => {
      throw new Error(`unable to connect to database: ${mongoUri} ${e}`);
    });
    connect();
  }
};

export default configure;
export {connect, disconnect};