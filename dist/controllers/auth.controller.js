"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const register = async (req, res, next) => {
    try {
        const { name, email, password, whatsapp, role } = req.body;
        const [existingUsers] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            (0, response_1.sendResponse)(res, 400, false, 'Email is already registered');
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const id = crypto.randomUUID();
        await db_1.default.query('INSERT INTO users (id, name, email, password, whatsapp, role) VALUES (?, ?, ?, ?, ?, ?)', [id, name, email, hashedPassword, whatsapp, role || 'user']);
        const newUser = { id, name, email, role: role || 'user' };
        const token = (0, jwt_1.generateToken)({ id: newUser.id, role: newUser.role });
        (0, response_1.sendResponse)(res, 201, true, 'User registered successfully', {
            user: newUser,
            token,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const [rows] = await db_1.default.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];
        if (!user) {
            (0, response_1.sendResponse)(res, 401, false, 'Invalid credentials');
            return;
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            (0, response_1.sendResponse)(res, 401, false, 'Invalid credentials');
            return;
        }
        const token = (0, jwt_1.generateToken)({ id: user.id, role: user.role });
        (0, response_1.sendResponse)(res, 200, true, 'Login successful', {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
