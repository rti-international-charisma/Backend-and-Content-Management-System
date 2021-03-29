"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_1 = require("../services");
const services_2 = require("../services");
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const respond_1 = require("../middleware/respond");
const router = express_1.Router();
router.get('/specs/oas', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_2.SpecificationService({
        accountability: req.accountability,
        schema: req.schema,
    });
    res.locals.payload = yield service.oas.generate();
    return next();
})), respond_1.respond);
router.get('/ping', (req, res) => res.send('pong'));
router.get('/info', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ServerService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const data = yield service.serverInfo();
    res.locals.payload = { data };
    return next();
})), respond_1.respond);
router.get('/health', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.ServerService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const data = yield service.health();
    res.setHeader('Content-Type', 'application/health+json');
    if (data.status === 'error')
        res.status(503);
    res.locals.payload = data;
    res.locals.cache = false;
    return next();
})), respond_1.respond);
exports.default = router;
