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
const database_1 = __importDefault(require("../database"));
const constants_1 = require("../constants");
const exceptions_1 = require("../exceptions");
const uuid_validate_1 = __importDefault(require("uuid-validate"));
const lodash_1 = require("lodash");
const storage_1 = __importDefault(require("../storage"));
const services_1 = require("../services");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const env_1 = __importDefault(require("../env"));
const ms_1 = __importDefault(require("ms"));
const router = express_1.Router();
router.use(use_collection_1.default('directus_files'));
router.get('/:pk', 
// Check if file exists and if you have permission to read it
async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.pk;
    /**
     * This is a little annoying. Postgres will error out if you're trying to search in `where`
     * with a wrong type. In case of directus_files where id is a uuid, we'll have to verify the
     * validity of the uuid ahead of time.
     * @todo move this to a validation middleware function
     */
    const isValidUUID = uuid_validate_1.default(id, 4);
    if (isValidUUID === false)
        throw new exceptions_1.ForbiddenException();
    const file = yield database_1.default.select('id', 'storage', 'filename_disk').from('directus_files').where({ id }).first();
    if (!file)
        throw new exceptions_1.ForbiddenException();
    const { exists } = yield storage_1.default.disk(file.storage).exists(file.filename_disk);
    if (!exists)
        throw new exceptions_1.ForbiddenException();
    return next();
})), 
// Validate query params
async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const payloadService = new services_1.PayloadService('directus_settings', { schema: req.schema });
    const defaults = { storage_asset_presets: [], storage_asset_transform: 'all' };
    let savedAssetSettings = yield database_1.default
        .select('storage_asset_presets', 'storage_asset_transform')
        .from('directus_settings')
        .first();
    if (savedAssetSettings) {
        yield payloadService.processValues('read', savedAssetSettings);
    }
    const assetSettings = savedAssetSettings || defaults;
    const transformation = lodash_1.pick(req.query, constants_1.ASSET_TRANSFORM_QUERY_KEYS);
    if (transformation.hasOwnProperty('key') && Object.keys(transformation).length > 1) {
        throw new exceptions_1.InvalidQueryException(`You can't combine the "key" query parameter with any other transformation.`);
    }
    const systemKeys = constants_1.SYSTEM_ASSET_ALLOW_LIST.map((transformation) => transformation.key);
    const allKeys = [
        ...systemKeys,
        ...(assetSettings.storage_asset_presets || []).map((transformation) => transformation.key),
    ];
    // For use in the next request handler
    res.locals.shortcuts = [...constants_1.SYSTEM_ASSET_ALLOW_LIST, ...(assetSettings.storage_asset_presets || [])];
    res.locals.transformation = transformation;
    if (Object.keys(transformation).length === 0) {
        return next();
    }
    if (assetSettings.storage_asset_transform === 'all') {
        if (transformation.key && allKeys.includes(transformation.key) === false)
            throw new exceptions_1.InvalidQueryException(`Key "${transformation.key}" isn't configured.`);
        return next();
    }
    else if (assetSettings.storage_asset_transform === 'presets') {
        if (allKeys.includes(transformation.key))
            return next();
        throw new exceptions_1.InvalidQueryException(`Only configured presets can be used in asset generation.`);
    }
    else {
        if (transformation.key && systemKeys.includes(transformation.key))
            return next();
        throw new exceptions_1.InvalidQueryException(`Dynamic asset generation has been disabled for this project.`);
    }
})), 
// Return file
async_handler_1.default((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const service = new services_1.AssetsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const transformation = res.locals.transformation.key
        ? res.locals.shortcuts.find((transformation) => transformation.key === res.locals.transformation.key)
        : res.locals.transformation;
    let range = undefined;
    if (req.headers.range) {
        // substring 6 = "bytes="
        const rangeParts = req.headers.range.substring(6).split('-');
        range = {
            start: rangeParts[0] ? Number(rangeParts[0]) : 0,
            end: rangeParts[1] ? Number(rangeParts[1]) : undefined,
        };
        if (Number.isNaN(range.start) || Number.isNaN(range.end)) {
            throw new exceptions_1.RangeNotSatisfiableException(range);
        }
    }
    const { stream, file, stat } = yield service.getAsset(req.params.pk, transformation, range);
    if (req.method.toLowerCase() === 'head') {
        res.status(200);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', stat.size);
        return res.end();
    }
    const access = !!((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.role) ? 'private' : 'public';
    res.attachment(file.filename_download);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', `${access}, max-age=${ms_1.default(env_1.default.ASSETS_CACHE_TTL)}`);
    if (range) {
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end || stat.size - 1}/${stat.size}`);
        res.status(206);
        res.setHeader('Content-Length', (range.end ? range.end + 1 : stat.size) - range.start);
    }
    else {
        res.setHeader('Content-Length', stat.size);
    }
    if (req.query.hasOwnProperty('download') === false) {
        res.removeHeader('Content-Disposition');
    }
    stream.pipe(res);
})));
exports.default = router;
