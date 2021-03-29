"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const pinoOptions = { level: process.env.LOG_LEVEL || 'info' };
if (process.env.LOG_STYLE !== 'raw') {
    pinoOptions.prettyPrint = true;
    pinoOptions.prettifier = require('pino-colada');
}
const logger = pino_1.default(pinoOptions);
exports.default = logger;
