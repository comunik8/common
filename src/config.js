import {config as commonConfig, configSchema as commonConfigSchema, validateConfig} from './index';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = {
  ...commonConfigSchema([
    'DEFAULT',
    'AMQP',
  ]),
  
};

const vars = validateConfig(envVarsSchema);

const config = {
  ...commonConfig(envVarsSchema, vars),
};

export default config;
