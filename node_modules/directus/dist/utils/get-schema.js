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
exports.getSchema = void 0;
const app_access_permissions_1 = require("../database/system-data/app-access-permissions");
const logger_1 = __importDefault(require("../logger"));
const merge_permissions_1 = require("./merge-permissions");
const schema_1 = __importDefault(require("@directus/schema"));
function getSchema(options) {
    return __awaiter(this, void 0, void 0, function* () {
        // Allows for use in the CLI
        const database = (options === null || options === void 0 ? void 0 : options.database) || require('../database').default;
        const schemaInspector = schema_1.default(database);
        const schemaOverview = yield schemaInspector.overview();
        for (const [collection, info] of Object.entries(schemaOverview)) {
            if (!info.primary) {
                logger_1.default.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
                delete schemaOverview[collection];
            }
        }
        const relations = yield database.select('*').from('directus_relations');
        const fields = yield database
            .select('id', 'collection', 'field', 'special')
            .from('directus_fields');
        let permissions = [];
        if ((options === null || options === void 0 ? void 0 : options.accountability) && options.accountability.admin !== true) {
            const permissionsForRole = yield database
                .select('*')
                .from('directus_permissions')
                .where({ role: options.accountability.role });
            permissions = permissionsForRole.map((permissionRaw) => {
                if (permissionRaw.permissions && typeof permissionRaw.permissions === 'string') {
                    permissionRaw.permissions = JSON.parse(permissionRaw.permissions);
                }
                if (permissionRaw.validation && typeof permissionRaw.validation === 'string') {
                    permissionRaw.validation = JSON.parse(permissionRaw.validation);
                }
                if (permissionRaw.presets && typeof permissionRaw.presets === 'string') {
                    permissionRaw.presets = JSON.parse(permissionRaw.presets);
                }
                if (permissionRaw.fields && typeof permissionRaw.fields === 'string') {
                    permissionRaw.fields = permissionRaw.fields.split(',');
                }
                return permissionRaw;
            });
            if (options.accountability.app === true) {
                permissions = merge_permissions_1.mergePermissions(permissions, app_access_permissions_1.appAccessMinimalPermissions.map((perm) => (Object.assign(Object.assign({}, perm), { role: options.accountability.role }))));
            }
        }
        return {
            tables: schemaOverview,
            relations: relations,
            fields: fields.map((transform) => {
                var _a;
                return (Object.assign(Object.assign({}, transform), { special: (_a = transform.special) === null || _a === void 0 ? void 0 : _a.split(',') }));
            }),
            permissions: permissions,
        };
    });
}
exports.getSchema = getSchema;
