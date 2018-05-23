import Service from '../service/service';
import {UnauthorizedHttpError} from '../errors/http.error';
import jsonwebtoken from 'jsonwebtoken';

const authenticate = (jwt, role = 'user', section = null) => {
  if (!jwt) return next(new UnauthorizedHttpError('Only JWT Auth is supported'));

  const {email} = jsonwebtoken.decode(jwt);
  return Service.User.request('user.canAccess', {email, role, section});
};

export default authenticate;
