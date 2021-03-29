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
const express_1 = __importDefault(require("express"));
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const services_1 = require("../services");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const router = express_1.default.Router();
router.use(use_collection_1.default('directus_revisions'));
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.RevisionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const records = yield service.readByQuery(req.sanitizedQuery);
    const meta = yield metaService.getMetaForQuery('directus_revisions', req.sanitizedQuery);
    res.locals.payload = { data: records || null, meta };
    return next();
})), respond_1.respond);
router.get('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.RevisionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const record = yield service.readByKey(req.params.pk, req.sanitizedQuery);
    res.locals.payload = { data: record || null };
    return next();
})), respond_1.respond);
exports.default = router;
