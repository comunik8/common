import Joi from 'joi';
import _ from 'lodash';

const getRandomPort = () => Math.round(Math.random() * 10000) + 1000;

const schema = (keys = ['DEFAULT']) =>
    _.reduce(_.pick({
      DEFAULT: {
        APP: Joi.string().required(),
        NODE_ENV: Joi.string().valid(['development', 'production', 'test']).default('development'),
        PORT: Joi.number().default(getRandomPort()),
        TZ: Joi.string().default('UTC'),
      },

      MONGO: {
        MONGO_USERNAME: Joi.string(),
        MONGO_PASSWORD: Joi.string(),
        MONGO_DB: Joi.string().required(),
        MONGO_RS: Joi.string().default('rs0'),
        MONGO_CERT: Joi.string(),
        MONGO_KEY: Joi.string(),
        MONGO_SERVERS: Joi.string().required(),
      },

      AMQP: {
        AMQP_USERNAME: Joi.string().required(),
        AMQP_PASSWORD: Joi.string().required(),
        AMQP_SERVER: Joi.string().required(),
      },

    }, keys), (obj, val, key) => {
      if (typeof val === 'object') {
        if (val.isJoi) {
          obj[key] = val;
        } else {
          obj = {...obj, ...val};
        }
        return obj;
      }
    }, {});

const regex = /^(\w+)_(\w+)$/;
const config = (schema, vars = {}) => {
  const out = {};

  _.forEach(schema, (v, k) => {
    if (k === 'NODE_ENV') {
      out['env'] = vars[k];

    } else if (!k.match(regex)) {
      out[k.toLowerCase()] = vars[k];

    } else {
      const group = k.replace(regex, '$1').toLowerCase(), key = k.replace(regex, '$2');

      if (!_.isObject(out[group])) out[group] = {};

      out[group][key.toLowerCase()] = vars[k];
    }
  });

  return out;
};

const validate = (envVarsSchema) => {
  const {error, value: envVars} = Joi.validate(process.env, Joi.object(envVarsSchema).unknown());
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return envVars;
};

export {schema, validate};
export default config;
