import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from './database.js';

// Only configure Google Strategy if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log('Google OAuth profile received:', profile.displayName);

                // Check if user exists
                const userResult = await pool.query(
                    'SELECT * FROM users WHERE google_id = $1 OR email = $2',
                    [profile.id, profile.emails[0].value]
                );

                if (userResult.rows.length > 0) {
                    // Update existing user with Google ID if not set
                    if (!userResult.rows[0].google_id) {
                        await pool.query(
                            'UPDATE users SET google_id = $1, avatar = $2 WHERE id = $3',
                            [profile.id, profile.photos[0]?.value, userResult.rows[0].id]
                        );
                    }
                    return done(null, userResult.rows[0]);
                } else {
                    // Create new user
                    const newUser = await pool.query(
                        'INSERT INTO users (name, email, google_id, avatar) VALUES ($1, $2, $3, $4) RETURNING *',
                        [profile.displayName, profile.emails[0].value, profile.id, profile.photos[0]?.value]
                    );
                    console.log('New user created via Google OAuth:', newUser.rows[0].email);
                    return done(null, newUser.rows[0]);
                }
            } catch (error) {
                console.error('Google OAuth error:', error);
                return done(error, null);
            }
        }
    ));
} else {
    console.warn('⚠️  Google OAuth credentials not configured. Google login will not work.');
    console.warn('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
}

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

export default passport;