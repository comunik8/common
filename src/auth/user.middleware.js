import Service from '../service/service';
import {UnauthorizedHttpError} from '../errors/http.error';

const authUserRole = (role = 'user', section = null) =>
    (req, res, next) => {
      let auth = req.get('Authorization');

      if (!auth) auth = req.body.jwt || req.query.jwt;

      if (!auth) return next(new UnauthorizedHttpError('Missing Authorization header'));
      if (!auth.match(/^JWT .*$/)) return next(new UnauthorizedHttpError('Only JWT Auth is supported'));

      return Service.User.request('auth.can.access', {jwt: auth.replace(/^JWT /, ''), role, section}, u => {
        req.user = u;
        next();
        return null; // bluebird doesn't like it when we return next(), we need to return null to silence this warning
      });
    };

export default authUserRole;
