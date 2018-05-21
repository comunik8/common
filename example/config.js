import {config as commonConfig, configSchema as commonConfigSchema, validateConfig} from 'comunik8-common';

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

// define validation for all the env vars
const envVarsSchema = {
  ...commonConfigSchema([
    'DEFAULT',
    'MONGO',
  ]),
};

const vars = validateConfig(envVarsSchema);

const config = {
  ...commonConfig(envVarsSchema, vars),
};

export default config;
