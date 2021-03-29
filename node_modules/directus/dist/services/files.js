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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const items_1 = require("./items");
const storage_1 = __importDefault(require("../storage"));
const sharp_1 = __importDefault(require("sharp"));
const icc_1 = require("icc");
const exif_reader_1 = __importDefault(require("exif-reader"));
const parse_iptc_1 = __importDefault(require("../utils/parse-iptc"));
const lodash_1 = require("lodash");
const cache_1 = __importDefault(require("../cache"));
const exceptions_1 = require("../exceptions");
const to_array_1 = require("../utils/to-array");
const mime_types_1 = require("mime-types");
const path_1 = __importDefault(require("path"));
const env_1 = __importDefault(require("../env"));
const logger_1 = __importDefault(require("../logger"));
class FilesService extends items_1.ItemsService {
    constructor(options) {
        super('directus_files', options);
    }
    upload(stream, data, primaryKey) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const payload = lodash_1.clone(data);
            if (primaryKey !== undefined) {
                yield this.update(payload, primaryKey);
                // If the file you're uploading already exists, we'll consider this upload a replace. In that case, we'll
                // delete the previously saved file and thumbnails to ensure they're generated fresh
                const disk = storage_1.default.disk(payload.storage);
                try {
                    for (var _b = __asyncValues(disk.flatList(String(primaryKey))), _c; _c = yield _b.next(), !_c.done;) {
                        const file = _c.value;
                        yield disk.delete(file.path);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                primaryKey = yield this.create(payload);
            }
            const fileExtension = (payload.type && mime_types_1.extension(payload.type)) || path_1.default.extname(payload.filename_download);
            payload.filename_disk = primaryKey + '.' + fileExtension;
            if (!payload.type) {
                payload.type = 'application/octet-stream';
            }
            try {
                yield storage_1.default.disk(data.storage).put(payload.filename_disk, stream);
            }
            catch (err) {
                logger_1.default.warn(`Couldn't save file ${payload.filename_disk}`);
                logger_1.default.warn(err);
            }
            const { size } = yield storage_1.default.disk(data.storage).getStat(payload.filename_disk);
            payload.filesize = size;
            if (['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff'].includes(payload.type)) {
                const buffer = yield storage_1.default.disk(data.storage).getBuffer(payload.filename_disk);
                const meta = yield sharp_1.default(buffer.content, {}).metadata();
                if (meta.orientation && meta.orientation >= 5) {
                    payload.height = meta.width;
                    payload.width = meta.height;
                }
                else {
                    payload.width = meta.width;
                    payload.height = meta.height;
                }
                payload.filesize = meta.size;
                payload.metadata = {};
                if (meta.icc) {
                    try {
                        payload.metadata.icc = icc_1.parse(meta.icc);
                    }
                    catch (err) {
                        logger_1.default.warn(`Couldn't extract ICC information from file`);
                        logger_1.default.warn(err);
                    }
                }
                if (meta.exif) {
                    try {
                        payload.metadata.exif = exif_reader_1.default(meta.exif);
                    }
                    catch (err) {
                        logger_1.default.warn(`Couldn't extract EXIF information from file`);
                        logger_1.default.warn(err);
                    }
                }
                if (meta.iptc) {
                    try {
                        payload.metadata.iptc = parse_iptc_1.default(meta.iptc);
                        payload.title = payload.title || payload.metadata.iptc.headline;
                        payload.description = payload.description || payload.metadata.iptc.caption;
                    }
                    catch (err) {
                        logger_1.default.warn(`Couldn't extract IPTC information from file`);
                        logger_1.default.warn(err);
                    }
                }
            }
            // We do this in a service without accountability. Even if you don't have update permissions to the file,
            // we still want to be able to set the extracted values from the file on create
            const sudoService = new items_1.ItemsService('directus_files', {
                knex: this.knex,
                schema: this.schema,
            });
            yield sudoService.update(payload, primaryKey);
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return primaryKey;
        });
    }
    delete(key) {
        const _super = Object.create(null, {
            readByKey: { get: () => super.readByKey },
            delete: { get: () => super.delete }
        });
        var e_2, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const keys = to_array_1.toArray(key);
            let files = yield _super.readByKey.call(this, keys, { fields: ['id', 'storage'] });
            if (!files) {
                throw new exceptions_1.ForbiddenException();
            }
            yield _super.delete.call(this, keys);
            files = to_array_1.toArray(files);
            for (const file of files) {
                const disk = storage_1.default.disk(file.storage);
                try {
                    // Delete file + thumbnails
                    for (var _b = (e_2 = void 0, __asyncValues(disk.flatList(file.id))), _c; _c = yield _b.next(), !_c.done;) {
                        const { path } = _c.value;
                        yield disk.delete(path);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (cache_1.default && env_1.default.CACHE_AUTO_PURGE) {
                yield cache_1.default.clear();
            }
            return key;
        });
    }
}
exports.FilesService = FilesService;
