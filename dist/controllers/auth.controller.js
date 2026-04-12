"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
const register = async (req, res, next) => {
    try {
        const { name, email, password, whatsapp, role } = req.body;
        const existingUser = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        if (existingUser.length > 0) {
            (0, response_1.sendResponse)(res, 400, false, 'Email is already registered');
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const [newUser] = await db_1.db.insert(schema_1.users).values({
            name,
            email,
            password: hashedPassword,
            whatsapp,
            role: role || 'user',
        }).returning({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            role: schema_1.users.role,
        });
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
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
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
