"use strict";
/**
 * Check if requested collection exists, and save it to req.collection
 */
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
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
const collections_1 = require("../database/system-data/collections");
const collectionExists = async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.params.collection)
        return next();
    if (req.params.collection in req.schema.tables === false) {
        throw new exceptions_1.ForbiddenException();
    }
    req.collection = req.params.collection;
    if (req.collection.startsWith('directus_')) {
        const systemRow = collections_1.systemCollectionRows.find((collection) => {
            return (collection === null || collection === void 0 ? void 0 : collection.collection) === req.collection;
        });
        req.singleton = !!(systemRow === null || systemRow === void 0 ? void 0 : systemRow.singleton);
    }
    else {
        const collectionInfo = yield database_1.default
            .select('singleton')
            .from('directus_collections')
            .where({ collection: req.collection })
            .first();
        req.singleton = (collectionInfo === null || collectionInfo === void 0 ? void 0 : collectionInfo.singleton) === true || (collectionInfo === null || collectionInfo === void 0 ? void 0 : collectionInfo.singleton) === 1;
    }
    return next();
}));
exports.default = collectionExists;
