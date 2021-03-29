"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
const logger_1 = __importDefault(require("../logger"));
const env_1 = __importDefault(require("../env"));
const to_array_1 = require("../utils/to-array");
const emitter_1 = require("../emitter");
const errorHandler = (err, req, res, next) => {
    var _a;
    let payload = {
        errors: [],
    };
    const errors = to_array_1.toArray(err);
    if (errors.some((err) => err instanceof exceptions_1.BaseException === false)) {
        res.status(500);
    }
    else {
        let status = errors[0].status;
        for (const err of errors) {
            if (status !== err.status) {
                // If there's multiple different status codes in the errors, use 500
                status = 500;
                break;
            }
        }
        res.status(status);
    }
    for (const err of errors) {
        if (env_1.default.NODE_ENV === 'development') {
            err.extensions = Object.assign(Object.assign({}, (err.extensions || {})), { stack: err.stack });
        }
        if (err instanceof exceptions_1.BaseException) {
            logger_1.default.debug(err);
            res.status(err.status);
            payload.errors.push({
                message: err.message,
                extensions: Object.assign({ code: err.code }, err.extensions),
            });
        }
        else {
            logger_1.default.error(err);
            res.status(500);
            if (((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.admin) === true) {
                payload = {
                    errors: [
                        {
                            message: err.message,
                            extensions: Object.assign({ code: 'INTERNAL_SERVER_ERROR' }, err.extensions),
                        },
                    ],
                };
            }
            else {
                payload = {
                    errors: [
                        {
                            message: 'An unexpected error occurred.',
                            extensions: {
                                code: 'INTERNAL_SERVER_ERROR',
                            },
                        },
                    ],
                };
            }
        }
    }
    emitter_1.emitAsyncSafe('error', payload.errors).then(() => {
        return res.json(payload);
    });
};
exports.default = errorHandler;
