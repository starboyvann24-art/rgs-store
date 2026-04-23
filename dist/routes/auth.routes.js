"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = __importStar(require("../config/database"));
const jwt_1 = require("../utils/jwt");
const DiscordStrategy = require('passport-discord').Strategy;
// ============================================================
// RGS STORE — Auth Routes (Manual + Discord OAuth)
// ============================================================
const router = (0, express_1.Router)();
// ─── Passport Serialize / Deserialize ────────────────────────
// Used by Discord OAuth session flow.
passport_1.default.serializeUser((user, done) => {
    if (user && user.id) {
        done(null, user.id);
    }
    else {
        done(null, user);
    }
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const [rows] = await database_1.default.query('SELECT id, name, email, role, avatar_url, discord_id FROM users WHERE id = ?', [id]);
        const user = rows[0];
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (err) {
        return done(err, null);
    }
});
// ─── Discord OAuth Strategy ──────────────────────────────────
passport_1.default.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
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
        const [rows] = await database_1.default.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        const users = rows;
        if (users.length > 0) {
            const user = users[0];
            // Force role = admin for user email: starboyvann24@gmail.com
            let role = user.role;
            if (email.toLowerCase() === 'starboyvann24@gmail.com')
                role = 'admin';
            // Sync discord_id and avatar
            await database_1.default.query('UPDATE users SET discord_id = ?, avatar_url = ?, role = ?, password = NULL WHERE id = ?', [discordId, avatarUrl, role, user.id]);
            user.discord_id = discordId;
            user.avatar_url = avatarUrl;
            user.role = role;
            return done(null, user);
        }
        else {
            // 2. Jika user baru, buat akun
            const newId = (0, database_1.generateUUID)();
            let role = 'user';
            if (email.toLowerCase() === 'starboyvann24@gmail.com')
                role = 'admin';
            await database_1.default.query('INSERT INTO users (id, name, email, discord_id, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)', [newId, profile.username, email, discordId, avatarUrl, role]);
            const [newUserRows] = await database_1.default.query('SELECT * FROM users WHERE id = ?', [newId]);
            return done(null, newUserRows[0]);
        }
    }
    catch (err) {
        console.error('Discord Auth Error:', err);
        return done(err, null);
    }
}));
// ─── Discord Routes ──────────────────────────────────────────
// Redirect to Discord Login
router.get('/discord', (req, res, next) => {
    passport_1.default.authenticate('discord')(req, res, next);
});
// Discord Callback Handler
router.get('/discord/callback', (req, res, next) => {
    passport_1.default.authenticate('discord', {
        failureRedirect: '/?error=auth_failed'
    }, (err, user) => {
        if (err || !user)
            return res.redirect('/?error=' + (err?.message || 'auth_failed'));
        req.logIn(user, (loginErr) => {
            if (loginErr)
                return next(loginErr);
            // Save session explicitly to avoid race conditions on cPanel
            req.session.save((saveErr) => {
                if (saveErr)
                    return next(saveErr);
                try {
                    // Generate JWT for the frontend (app.js uses this)
                    const token = (0, jwt_1.generateToken)({
                        id: user.id,
                        role: user.role,
                        email: user.email,
                        name: user.name
                    });
                    // ADMIN AUTO-REDIRECT: starboyvann24@gmail.com -> /admin.html
                    if (user.email && user.email.toLowerCase() === 'starboyvann24@gmail.com') {
                        return res.redirect(`/admin.html?discord_token=${token}&role=admin`);
                    }
                    // Regular user redirect
                    res.redirect(`/?discord_token=${token}&role=${user.role}`);
                }
                catch (tokenErr) {
                    console.error('Token generation error:', tokenErr);
                    return res.redirect('/?error=token_failed');
                }
            });
        });
    })(req, res, next);
});
// ─── Standard Auth Routes ─────────────────────────────────────
router.get('/me', auth_middleware_1.verifyToken, auth_controller_1.getMe);
router.put('/profile', auth_middleware_1.verifyToken, auth_controller_1.updateProfile);
router.post('/logout', auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map