"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const db = promise_1.default.createPool({
    host: 'localhost',
    user: 'tgevicsg_rgs_user',
    password: 'Dumai124.#',
    database: 'tgevicsg_rgs_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
exports.default = db;
