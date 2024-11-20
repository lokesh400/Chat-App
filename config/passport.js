const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async function(id, done) {
    try {
      // Using async/await instead of callback
      const user = await User.findById(id);
      if (!user) {
        return done(new Error('User not found'));
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, (email, password, done) => {
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          return done(null, false, { message: 'Incorrect email.' });
        }

        user.matchPassword(password).then(isMatch => {
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password.' });
          }
          return done(null, user);
        });
      })
      .catch(err => done(err));
  }));
};
