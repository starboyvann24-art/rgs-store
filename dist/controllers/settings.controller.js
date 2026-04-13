"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const database_1 = __importDefault(require("../config/database"));
const response_1 = require("../utils/response");
// ============================================================
// RGS STORE — Settings Controller
// Public settings endpoint and admin update
// ============================================================
/**
 * GET /api/v1/settings
 * Get all public settings (no auth required)
 */
const getSettings = async (_req, res, next) => {
    try {
        const [rows] = await database_1.default.query('SELECT setting_key, setting_value FROM settings');
        // Convert array of {setting_key, setting_value} to a flat object
        const settings = {};
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Settings berhasil dimuat.', settings);
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
/**
 * PUT /api/v1/settings
 * Update settings (admin only)
 * Body: { key: value, key2: value2, ... }
 */
const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            (0, response_1.sendResponse)(res, 400, false, 'Tidak ada data yang diubah.');
            return;
        }
        for (const [key, value] of Object.entries(updates)) {
            await database_1.default.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
        }
        // Return updated settings
        const [rows] = await database_1.default.query('SELECT setting_key, setting_value FROM settings');
        const settings = {};
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }
        (0, response_1.sendResponse)(res, 200, true, 'Settings berhasil diperbarui.', settings);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settings.controller.js.map