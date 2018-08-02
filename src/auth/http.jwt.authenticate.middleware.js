import Service from '../service/service';
import {UnauthorizedHttpError} from '../errors/http.error';
import jsonwebtoken from 'jsonwebtoken';

const authenticate = (role = 'user', section = null) => {
  return (req, res, next) => {
    let auth = req.get('Authorization');

    if (!auth) auth = req.body.jwt;

    if (!auth) return next(new UnauthorizedHttpError('Missing Authorization header'));
    if (!auth.match(/^JWT .*$/)) return next(new UnauthorizedHttpError('Only JWT Auth is supported'));

    const jwt = auth.replace(/^JWT /, '');
    const {email} = jsonwebtoken.decode(jwt);

    return Service.User.request('user.canAccess', {jwt, role, section}).then(u => {
      req.user = {
        ...u,
        jwt
      };
      next();
      return null; // bluebird doesn't like it when we return next(), we need to return null to silence this warning
    }).catch(e => next(e));
  };
};

export default authenticate;
