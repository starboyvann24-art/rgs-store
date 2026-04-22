import { Router } from 'express';
import passport from 'passport';
import { getMe, updateProfile, logout } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import db, { generateUUID } from '../config/database';
import { generateToken } from '../utils/jwt';

const DiscordStrategy = require('passport-discord').Strategy;

// ============================================================
// RGS STORE — Auth Routes (Manual + Discord OAuth)
// ============================================================

const router: Router = Router();

// ─── Passport Serialize / Deserialize ────────────────────────
// Used by Discord OAuth session flow.
passport.serializeUser((user: any, done: any) => {
  if (user && user.id) {
    done(null, user.id);
  } else {
    done(null, user);
  }
});

passport.deserializeUser(async (id: any, done: any) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, avatar_url, discord_id FROM users WHERE id = ?',
      [id]
    );
    const user = (rows as any[])[0];
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, null);
  }
});

// ─── Discord OAuth Strategy ──────────────────────────────────
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email', 'guilds']
}, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
        const email = profile.email;
        const discordId = profile.id;
        const avatarUrl = profile.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordId}/${profile.avatar}.png`
            : null;

        if (!email) {
            return done(new Error('Discord account must have an email.'), null);
        }

        // 1. Cari user berdasarkan Email (Primary Match)
        const [rows] = await db.query<any>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        const users = rows as any[];

        if (users.length > 0) {
            const user = users[0];
            // Force role = admin for user email: starboyvann24@gmail.com
            let role = user.role;
            if (email.toLowerCase() === 'starboyvann24@gmail.com') role = 'admin';

            // Sync discord_id and avatar
            await db.query(
                'UPDATE users SET discord_id = ?, avatar_url = ?, role = ?, password = NULL WHERE id = ?',
                [discordId, avatarUrl, role, user.id]
            );
            
            user.discord_id = discordId;
            user.avatar_url = avatarUrl;
            user.role = role;
            return done(null, user);
        } else {
            // 2. Jika user baru, buat akun
            const newId = generateUUID();
            let role = 'user';
            if (email.toLowerCase() === 'starboyvann24@gmail.com') role = 'admin';

            await db.query(
                'INSERT INTO users (id, name, email, discord_id, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)',
                [newId, profile.username, email, discordId, avatarUrl, role]
            );

            const [newUserRows] = await db.query<any>('SELECT * FROM users WHERE id = ?', [newId]);
            return done(null, newUserRows[0]);
        }
    } catch (err) {
        console.error('Discord Auth Error:', err);
        return done(err, null);
    }
}));

// ─── Discord Routes ──────────────────────────────────────────
// Redirect to Discord Login
router.get('/discord', (req: any, res, next) => {
    passport.authenticate('discord')(req, res, next);
});

// Discord Callback Handler
router.get('/discord/callback', (req: any, res, next) => {
    passport.authenticate('discord', { 
        failureRedirect: '/?error=auth_failed' 
    }, (err, user) => {
        if (err || !user) return res.redirect('/?error=' + (err?.message || 'auth_failed'));

        req.logIn(user, (loginErr: any) => {
            if (loginErr) return next(loginErr);

            // Save session explicitly to avoid race conditions on cPanel
            req.session.save((saveErr: any) => {
                if (saveErr) return next(saveErr);

                // Generate JWT for the frontend (app.js uses this)
                const token = generateToken({
                    id: user.id,
                    role: user.role,
                    email: user.email,
                    name: user.name
                });

                // Redirect to frontend with token and role
                res.redirect(`/?discord_token=${token}&role=${user.role}`);
            });
        });
    })(req, res, next);
});

// ─── Standard Auth Routes ─────────────────────────────────────
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.post('/logout', logout);

export default router;
