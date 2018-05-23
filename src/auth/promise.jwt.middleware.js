import Service from '../service/service';
import {UnauthorizedHttpError} from '../errors/http.error';

const authenticate = (jwt, role = 'user', section = null) => {
  if (!jwt) return next(new UnauthorizedHttpError('Only JWT Auth is supported'));
  return Service.User.request('auth.can.access', {jwt, role, section});
};

export default authenticate;
