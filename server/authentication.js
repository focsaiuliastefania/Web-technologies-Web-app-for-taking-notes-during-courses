const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require('./models/user');

require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,

      callbackURL: "https://web-technologies-web-app-for-taking.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        if (!email.endsWith("@stud.ase.ro")) {
          return done(null, false, {
            message: "Only @stud.ase.ro accounts are allowed.",
          });
        }
        
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: email,
            name: profile.displayName,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);