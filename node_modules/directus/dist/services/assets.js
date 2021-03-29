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
exports.AssetsService = void 0;
const storage_1 = __importDefault(require("../storage"));
const sharp_1 = __importDefault(require("sharp"));
const database_1 = __importDefault(require("../database"));
const path_1 = __importDefault(require("path"));
const authorization_1 = require("./authorization");
const exceptions_1 = require("../exceptions");
class AssetsService {
    constructor(options) {
        this.knex = options.knex || database_1.default;
        this.accountability = options.accountability || null;
        this.authorizationService = new authorization_1.AuthorizationService(options);
    }
    getAsset(id, transformation, range) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const publicSettings = yield this.knex
                .select('project_logo', 'public_background', 'public_foreground')
                .from('directus_settings')
                .first();
            const systemPublicKeys = Object.values(publicSettings || {});
            if (systemPublicKeys.includes(id) === false && ((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) !== true) {
                yield this.authorizationService.checkAccess('read', 'directus_files', id);
            }
            const file = yield database_1.default.select('*').from('directus_files').where({ id }).first();
            if (range) {
                if (range.start >= file.filesize || (range.end && range.end >= file.filesize)) {
                    throw new exceptions_1.RangeNotSatisfiableException(range);
                }
            }
            const type = file.type;
            // We can only transform JPEG, PNG, and WebP
            if (Object.keys(transformation).length > 0 && ['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
                const resizeOptions = this.parseTransformation(transformation);
                const assetFilename = path_1.default.basename(file.filename_disk, path_1.default.extname(file.filename_disk)) +
                    this.getAssetSuffix(resizeOptions) +
                    path_1.default.extname(file.filename_disk);
                const { exists } = yield storage_1.default.disk(file.storage).exists(assetFilename);
                if (exists) {
                    return {
                        stream: storage_1.default.disk(file.storage).getStream(assetFilename, range),
                        file,
                        stat: yield storage_1.default.disk(file.storage).getStat(assetFilename),
                    };
                }
                const readStream = storage_1.default.disk(file.storage).getStream(file.filename_disk, range);
                const transformer = sharp_1.default().rotate().resize(resizeOptions);
                yield storage_1.default.disk(file.storage).put(assetFilename, readStream.pipe(transformer));
                return {
                    stream: storage_1.default.disk(file.storage).getStream(assetFilename, range),
                    stat: yield storage_1.default.disk(file.storage).getStat(assetFilename),
                    file,
                };
            }
            else {
                const readStream = storage_1.default.disk(file.storage).getStream(file.filename_disk, range);
                const stat = yield storage_1.default.disk(file.storage).getStat(file.filename_disk);
                return { stream: readStream, file, stat };
            }
        });
    }
    parseTransformation(transformation) {
        const resizeOptions = {};
        if (transformation.width)
            resizeOptions.width = Number(transformation.width);
        if (transformation.height)
            resizeOptions.height = Number(transformation.height);
        if (transformation.fit)
            resizeOptions.fit = transformation.fit;
        if (transformation.withoutEnlargement)
            resizeOptions.withoutEnlargement = Boolean(transformation.withoutEnlargement);
        return resizeOptions;
    }
    getAssetSuffix(resizeOptions) {
        if (Object.keys(resizeOptions).length === 0)
            return '';
        return ('__' +
            Object.entries(resizeOptions)
                .sort((a, b) => (a[0] > b[0] ? 1 : -1))
                .map((e) => e.join('_'))
                .join(','));
    }
}
exports.AssetsService = AssetsService;
