"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                (0, response_1.sendResponse)(res, 400, false, 'Validation Error', errors);
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
