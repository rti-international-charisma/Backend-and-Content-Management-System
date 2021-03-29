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
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const lodash_1 = require("lodash");
function runSeed(database) {
    return __awaiter(this, void 0, void 0, function* () {
        const exists = yield database.schema.hasTable('directus_collections');
        if (exists) {
            throw new Error('Database is already installed');
        }
        const tableSeeds = yield fs_extra_1.default.readdir(path_1.default.resolve(__dirname));
        for (const tableSeedFile of tableSeeds) {
            if (tableSeedFile.startsWith('run'))
                continue;
            const yamlRaw = yield fs_extra_1.default.readFile(path_1.default.resolve(__dirname, tableSeedFile), 'utf8');
            const seedData = js_yaml_1.default.safeLoad(yamlRaw);
            yield database.schema.createTable(seedData.table, (tableBuilder) => {
                for (const [columnName, columnInfo] of Object.entries(seedData.columns)) {
                    let column;
                    if (columnInfo.type === 'string') {
                        column = tableBuilder.string(columnName, columnInfo.length);
                    }
                    else if (columnInfo.increments) {
                        column = tableBuilder.increments();
                    }
                    else if (columnInfo.type === 'csv') {
                        column = tableBuilder.string(columnName);
                    }
                    else if (columnInfo.type === 'hash') {
                        column = tableBuilder.string(columnName, 255);
                    }
                    else {
                        column = tableBuilder[columnInfo.type](columnName);
                    }
                    if (columnInfo.primary) {
                        column.primary();
                    }
                    if (columnInfo.nullable !== undefined && columnInfo.nullable === false) {
                        column.notNullable();
                    }
                    if (columnInfo.default !== undefined) {
                        let defaultValue = columnInfo.default;
                        if (lodash_1.isObject(defaultValue) || Array.isArray(defaultValue)) {
                            defaultValue = JSON.stringify(defaultValue);
                        }
                        if (defaultValue === '$now') {
                            defaultValue = database.fn.now();
                        }
                        column.defaultTo(defaultValue);
                    }
                    if (columnInfo.unique) {
                        column.unique();
                    }
                    if (columnInfo.unsigned) {
                        column.unsigned();
                    }
                    if (columnInfo.references) {
                        column.references(columnInfo.references.column).inTable(columnInfo.references.table);
                    }
                }
            });
        }
    });
}
exports.default = runSeed;
