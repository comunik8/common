import passport from 'passport';
import {UnauthorizedHttpError} from '../errors/http.error';

const authenticate = (req, res, next) => {
  return passport.authenticate('api', {session: false},
    (err, ok) => {
      if (err || !ok) return next(new UnauthorizedHttpError(err || 'Invalid Key'));

      return next();
    })(req, res, next);
}

export default authenticate;
