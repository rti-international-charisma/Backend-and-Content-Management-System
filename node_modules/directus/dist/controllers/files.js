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
const busboy_1 = __importDefault(require("busboy"));
const services_1 = require("../services");
const format_title_1 = __importDefault(require("@directus/format-title"));
const env_1 = __importDefault(require("../env"));
const axios_1 = __importDefault(require("axios"));
const joi_1 = __importDefault(require("joi"));
const exceptions_1 = require("../exceptions");
const url_1 = __importDefault(require("url"));
const path_1 = __importDefault(require("path"));
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const respond_1 = require("../middleware/respond");
const to_array_1 = require("../utils/to-array");
const logger_1 = __importDefault(require("../logger"));
const router = express_1.default.Router();
router.use(use_collection_1.default('directus_files'));
const multipartHandler = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.is('multipart/form-data') === false)
        return next();
    const busboy = new busboy_1.default({ headers: req.headers });
    const savedFiles = [];
    const service = new services_1.FilesService({ accountability: req.accountability, schema: req.schema });
    const existingPrimaryKey = req.params.pk || undefined;
    /**
     * The order of the fields in multipart/form-data is important. We require that all fields
     * are provided _before_ the files. This allows us to set the storage location, and create
     * the row in directus_files async during the upload of the actual file.
     */
    let disk = to_array_1.toArray(env_1.default.STORAGE_LOCATIONS)[0];
    let payload = {};
    let fileCount = 0;
    busboy.on('field', (fieldname, val) => {
        if (fieldname === 'storage') {
            disk = val;
        }
        payload[fieldname] = val;
    });
    busboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        fileCount++;
        if (!payload.title) {
            payload.title = format_title_1.default(path_1.default.parse(filename).name);
        }
        if ((_a = req.accountability) === null || _a === void 0 ? void 0 : _a.user) {
            payload.uploaded_by = req.accountability.user;
        }
        const payloadWithRequiredFields = Object.assign(Object.assign({}, payload), { filename_download: filename, type: mimetype, storage: payload.storage || disk });
        try {
            const primaryKey = yield service.upload(fileStream, payloadWithRequiredFields, existingPrimaryKey);
            savedFiles.push(primaryKey);
            tryDone();
        }
        catch (error) {
            busboy.emit('error', error);
        }
    }));
    busboy.on('error', (error) => {
        next(error);
    });
    busboy.on('finish', () => {
        tryDone();
    });
    req.pipe(busboy);
    function tryDone() {
        if (savedFiles.length === fileCount) {
            res.locals.savedFiles = savedFiles;
            return next();
        }
    }
}));
router.post('/', multipartHandler, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    let keys = [];
    if (req.is('multipart/form-data')) {
        keys = res.locals.savedFiles;
    }
    else {
        keys = yield service.create(req.body);
    }
    try {
        const record = yield service.readByKey(keys, req.sanitizedQuery);
        res.locals.payload = {
            data: record,
        };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
const importSchema = joi_1.default.object({
    url: joi_1.default.string().required(),
    data: joi_1.default.object(),
});
router.post('/import', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const { error } = importSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.InvalidPayloadException(error.message);
    }
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const fileCreatePermissions = req.schema.permissions.find((permission) => permission.collection === 'directus_files' && permission.action === 'create');
    if (((_b = req.accountability) === null || _b === void 0 ? void 0 : _b.admin) !== true && !fileCreatePermissions) {
        throw new exceptions_1.ForbiddenException();
    }
    let fileResponse;
    try {
        fileResponse = yield axios_1.default.get(req.body.url, {
            responseType: 'stream',
        });
    }
    catch (err) {
        logger_1.default.warn(`Couldn't fetch file from url "${req.body.url}"`);
        logger_1.default.warn(err);
        throw new exceptions_1.ServiceUnavailableException(`Couldn't fetch file from url "${req.body.url}"`, {
            service: 'external-file',
        });
    }
    const parsedURL = url_1.default.parse(fileResponse.request.res.responseUrl);
    const filename = path_1.default.basename(parsedURL.pathname);
    const payload = Object.assign({ filename_download: filename, storage: to_array_1.toArray(env_1.default.STORAGE_LOCATIONS)[0], type: fileResponse.headers['content-type'], title: format_title_1.default(filename) }, (req.body.data || {}));
    const primaryKey = yield service.upload(fileResponse.data, payload);
    try {
        const record = yield service.readByKey(primaryKey, req.sanitizedQuery);
        res.locals.payload = { data: record || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.get('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const metaService = new services_1.MetaService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const records = yield service.readByQuery(req.sanitizedQuery);
    const meta = yield metaService.getMetaForQuery('directus_files', req.sanitizedQuery);
    res.locals.payload = { data: records || null, meta };
    return next();
})), respond_1.respond);
router.get('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const record = yield service.readByKey(req.params.pk, req.sanitizedQuery);
    res.locals.payload = { data: record || null };
    return next();
})), respond_1.respond);
router.patch('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    if (Array.isArray(req.body)) {
        const primaryKeys = yield service.update(req.body);
        try {
            const result = yield service.readByKey(primaryKeys, req.sanitizedQuery);
            res.locals.payload = { data: result || null };
        }
        catch (error) {
            if (error instanceof exceptions_1.ForbiddenException) {
                return next();
            }
            throw error;
        }
        return next();
    }
    const updateSchema = joi_1.default.object({
        keys: joi_1.default.array().items(joi_1.default.alternatives(joi_1.default.string(), joi_1.default.number())).required(),
        data: joi_1.default.object().required().unknown(),
    });
    const { error } = updateSchema.validate(req.body);
    if (error) {
        throw new exceptions_1.FailedValidationException(error.details[0]);
    }
    const primaryKeys = yield service.update(req.body.data, req.body.keys);
    try {
        const result = yield service.readByKey(primaryKeys, req.sanitizedQuery);
        res.locals.payload = { data: result || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.patch('/:pk', multipartHandler, async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    let keys = [];
    if (req.is('multipart/form-data')) {
        keys = res.locals.savedFiles;
    }
    else {
        yield service.update(req.body, req.params.pk);
    }
    try {
        const record = yield service.readByKey(keys, req.sanitizedQuery);
        res.locals.payload = { data: record || null };
    }
    catch (error) {
        if (error instanceof exceptions_1.ForbiddenException) {
            return next();
        }
        throw error;
    }
    return next();
})), respond_1.respond);
router.delete('/', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body || Array.isArray(req.body) === false) {
        throw new exceptions_1.InvalidPayloadException(`Body has to be an array of primary keys`);
    }
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.body);
    return next();
})), respond_1.respond);
router.delete('/:pk', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.FilesService({
        accountability: req.accountability,
        schema: req.schema,
    });
    yield service.delete(req.params.pk);
    return next();
})), respond_1.respond);
exports.default = router;
