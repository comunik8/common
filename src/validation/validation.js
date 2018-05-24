import Joi from 'joi';
import _ from 'lodash';
import flat from 'flat';
import moment from 'moment';
import BaseError from '../errors/base.error';
import {BadRequestHttpError} from '../errors/http.error';

const
    // see more @ https://github.com/hapijs/joi/blob/v13.0.2/lib/language.js
    language = {
      any: {
        unknown: 'Not allowed',
        invalid: 'Contains an invalid value',
        empty: 'Not allowed to be empty',
        required: 'Required',
        allowOnly: 'Invalid value',
        default: 'Threw an error when running default method',
      },
      array: {
        at_least_one: 'You need to have one main driver',
        at_most_one: 'You can have only one main driver',
      },
      string: {
        base: 'Must be a string',
        min: 'Must be at least {{limit}} characters long',
        max: 'Must be less than or equal to {{limit}} characters long',
        length: 'Must be {{limit}} characters long',
        alphanum: 'Must only contain alpha-numeric characters',
        token: 'Must only contain alpha-numeric and underscore characters',
        regex: {
          base: 'Invalid format',
          name: 'Invalid format',
          invert: {
            base: 'Invalid format',
            name: 'Invalid format',
          },
        },
        email: 'Must be a valid email',
        uri: 'Must be a valid uri',
        isoDate: 'Must be a valid ISO 8601 date',
        guid: 'Must be a valid GUID',
        hex: 'Must only contain hexadecimal characters',
        base64: 'Must be a valid base64 string',
        hostname: 'Must be a valid hostname',
        lowercase: 'Must only contain lowercase characters',
        uppercase: 'Must only contain uppercase characters',
      },
      number: {
        base: 'Must be a number',
        min: 'Must be larger than or equal to {{limit}}',
        max: 'Must be less than or equal to {{limit}}',
        less: 'Must be less than {{limit}}',
        greater: 'Must be greater than {{limit}}',
        float: 'Must be a float or double',
        integer: 'Must be an integer',
        negative: 'Must be a negative number',
        positive: 'Must be a positive number',
        precision: 'Must have no more than {{limit}} decimal places',
        multiple: 'Must be a multiple of {{multiple}}',
      },
      date: {
        min: 'Must be after {{limit}}',
        max: 'Must be before {{limit}}',
      },
      object: {
        legal_age: 'Date is before 18th birthday',
      },
    },
    flatLanguage = flat(language);

const parseMessage = (msg, type, label) => {
  // remove label the beginning of custom messages
  if (flatLanguage[type] && msg.match(new RegExp(`^"${label}" `))) {
    return msg.replace(new RegExp(`^"${label}" `), '');
  }

  // remove label from the end ( //label }
  return msg.replace(new RegExp(` //${label}$`), '');
};

const validation = (errObj, request, schema, location = false, allowUnknown = false) => {
  if (!request || !schema) return;

  const joiOptions = {
    context: request,
    allowUnknown,
    abortEarly: false,
    language,
  };

  Joi.validate(request, schema, joiOptions, function(errors) {
    if (!errors || !errors.details || !errors.details.length) return;
    errors.details.forEach(e => {
      const path = _.isArray(e.path) ? e.path.join('.') : e.path;

      if (errObj[path]) return;

      errObj[path] = parseMessage(e.message, e.type, e.context.label);
      if (e.type === 'object.missing') {
        _.each(e.context.peers, p => {
          errObj[p] = `At least one of [${e.context.peers.join(', ')}] is required.`;
        });
      }
      if (e.type === 'date.min' || e.type === 'date.max') {
        errObj[path] = errObj[path].replace(
            e.context.limit,
            moment(e.context.limit).format('DD.MM.YYYY'),
        );
      }
    });
  });
};

export default (schema, data) =>
    new Promise((resolve, reject) => {
      if (!schema) reject(new BaseError('Please provide a validation schema'));
      const errors = {};
      validation(errors, data, schema);
      if (_.isEmpty(errors)) {
        resolve(data);
      } else {
        reject(new BadRequestHttpError('Validation Failed', true, errors));
      }
    });
