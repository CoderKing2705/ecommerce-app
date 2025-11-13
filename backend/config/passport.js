import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists
            const userResult = await pool.query(
                'SELECT * FROM users WHERE google_id = $1 OR email = $2',
                [profile.id, profile.emails[0].value]
            );

            if (userResult.rows.length > 0) {
                return done(null, userResult.rows[0]);
            } else {
                // Create new user
                const newUser = await pool.query(
                    'INSERT INTO users (name, email, google_id, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
                    [profile.displayName, profile.emails[0].value, profile.id, profile.photos[0].value]
                );
                return done(null, newUser.rows[0]);
            }
        } catch (error) {
            return done(error, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, user.rows[0]);
    } catch (error) {
        done(error, null);
    }
});