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
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const nanoid_1 = require("nanoid");
const exceptions_1 = require("../exceptions");
const argon2_1 = __importDefault(require("argon2"));
const collection_exists_1 = __importDefault(require("../middleware/collection-exists"));
const services_1 = require("../services");
const joi_1 = __importDefault(require("joi"));
const respond_1 = require("../middleware/respond");
const router = express_1.Router();
router.get('/random/string', async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (req.query && req.query.length && Number(req.query.length) > 500)
        throw new exceptions_1.InvalidQueryException(`"length" can't be more than 500 characters`);
    const string = nanoid_1.nanoid(((_a = req.query) === null || _a === void 0 ? void 0 : _a.length) ? Number(req.query.length) : 32);
    return res.json({ data: string });
})));
router.post('/hash/generate', async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if (!((_b = req.body) === null || _b === void 0 ? void 0 : _b.string)) {
        throw new exceptions_1.InvalidPayloadException(`"string" is required`);
    }
    const hash = yield argon2_1.default.hash(req.body.string);
    return res.json({ data: hash });
})));
router.post('/hash/verify', async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    if (!((_c = req.body) === null || _c === void 0 ? void 0 : _c.string)) {
        throw new exceptions_1.InvalidPayloadException(`"string" is required`);
    }
    if (!((_d = req.body) === null || _d === void 0 ? void 0 : _d.hash)) {
        throw new exceptions_1.InvalidPayloadException(`"hash" is required`);
    }
    const result = yield argon2_1.default.verify(req.body.hash, req.body.string);
    return res.json({ data: result });
})));
const SortSchema = joi_1.default.object({
    item: joi_1.default.alternatives(joi_1.default.string(), joi_1.default.number()).required(),
    to: joi_1.default.alternatives(joi_1.default.string(), joi_1.default.number()).required(),
});
router.post('/sort/:collection', collection_exists_1.default, async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = SortSchema.validate(req.body);
    if (error)
        throw new exceptions_1.InvalidPayloadException(error.message);
    const service = new services_1.UtilsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.sort(req.collection, req.body);
    return res.status(200).end();
})));
router.post('/revert/:revision', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.RevisionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.revert(req.params.revision);
    next();
})), respond_1.respond);
exports.default = router;
