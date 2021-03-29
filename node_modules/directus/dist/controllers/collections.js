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
const services_1 = require("../services");
const exceptions_1 = require("../exceptions");
const respond_1 = require("../middleware/respond");
const router = express_1.Router();
router.post('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionsService = new services_1.CollectionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const collectionKey = yield collectionsService.create(req.body);
    const record = yield collectionsService.readByKey(collectionKey);
    res.locals.payload = { data: record || null };
    return next();
})), respond_1.respond);
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionsService = new services_1.CollectionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const collections = yield collectionsService.readByQuery();
    const meta = yield metaService.getMetaForQuery('directus_collections', {});
    res.locals.payload = { data: collections || null, meta };
    return next();
})), respond_1.respond);
router.get('/:collection', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionsService = new services_1.CollectionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const collectionKey = req.params.collection.includes(',')
        ? req.params.collection.split(',')
        : req.params.collection;
    const collection = yield collectionsService.readByKey(collectionKey);
    res.locals.payload = { data: collection || null };
    return next();
})), respond_1.respond);
router.patch('/:collection', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionsService = new services_1.CollectionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const collectionKey = req.params.collection.includes(',')
        ? req.params.collection.split(',')
        : req.params.collection;
    yield collectionsService.update(req.body, collectionKey);
    try {
        const collection = yield collectionsService.readByKey(collectionKey);
        res.locals.payload = { data: collection || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.delete('/:collection', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const collectionsService = new services_1.CollectionsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const collectionKey = req.params.collection.includes(',')
        ? req.params.collection.split(',')
        : req.params.collection;
    yield collectionsService.delete(collectionKey);
    return next();
})), respond_1.respond);
exports.default = router;
