import passport from 'passport';

const authenticate = (req, res, next) => {
  return passport.authenticate('email.password', (err, u) => {
    if (err) return next(err);
    req.user = u;

    return next();
  })(req, res, next);
};

export default authenticate;
