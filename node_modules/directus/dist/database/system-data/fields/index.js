"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemFieldRows = void 0;
const require_yaml_1 = require("../../../utils/require-yaml");
const lodash_1 = require("lodash");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const defaults = require_yaml_1.requireYAML(require.resolve('./_defaults.yaml'));
const fieldData = fs_extra_1.default.readdirSync(path_1.default.resolve(__dirname));
exports.systemFieldRows = [];
for (const filepath of fieldData) {
    if (filepath.includes('_defaults') || filepath.includes('index'))
        continue;
    const systemFields = require_yaml_1.requireYAML(path_1.default.resolve(__dirname, filepath));
    systemFields.fields.forEach((field, index) => {
        exports.systemFieldRows.push(lodash_1.merge({ system: true }, defaults, field, {
            collection: systemFields.table,
            sort: index + 1,
        }));
    });
}
