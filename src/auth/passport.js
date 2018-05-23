import passport from 'passport';
import LocalStrategy from 'passport-local';
import BearerStrategy from 'passport-http-bearer';
import Service from '../service/service';

const strategies = [
  {
    name: 'api',
    fn: (config) => new BearerStrategy((key, callback) => {
      if (!key || !key.length) return callback('Empty Access Key');
      if (key !== config.api.key) return callback('Invalid Access Key');

      return callback(null, true);
    }),
  },
  {
    name: 'email.password',
    fn: () => new LocalStrategy({usernameField: 'email', session: false}, (email, password, callback) => {
      return Service.User.request('auth.authenticateWithPassword', {email: email.toLowerCase(), password: password.replace(' ', '')}, u => callback(null, u).catch(e => callback(e)));
    }),
  },
];

const configure = (config, use_strategies = ['api']) => {
  use_strategies.forEach(name => {
    const strategy = strategies.find(s => s.name === name);
    if (strategy) passport.use(name, strategy.fn(config));
  });
};

export default configure;