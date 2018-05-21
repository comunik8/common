import {BadRequestHttpError} from '../errors/http.error';

const canAccess = (data) => {
  if (data.successful) return Promise.resolve(data);

  return Promise.reject(new BadRequestHttpError('Failed'));
};

export default {canAccess};