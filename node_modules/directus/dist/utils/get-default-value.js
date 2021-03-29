"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_local_type_1 = __importDefault(require("./get-local-type"));
function getDefaultValue(column) {
    const type = get_local_type_1.default(column);
    let defaultValue = column.default_value || null;
    if (defaultValue === null)
        return null;
    if (defaultValue === 'null')
        return null;
    if (defaultValue === 'NULL')
        return null;
    // Check if the default is wrapped in an extra pair of quotes, this happens in SQLite
    if (typeof defaultValue === 'string' &&
        ((defaultValue.startsWith(`'`) && defaultValue.endsWith(`'`)) ||
            (defaultValue.startsWith(`"`) && defaultValue.endsWith(`"`)))) {
        defaultValue = defaultValue.slice(1, -1);
    }
    switch (type) {
        case 'bigInteger':
        case 'integer':
        case 'decimal':
        case 'float':
            return Number(defaultValue);
        case 'boolean':
            return castToBoolean(defaultValue);
        default:
            return defaultValue;
    }
}
exports.default = getDefaultValue;
function castToBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (value === 0 || value === '0')
        return false;
    if (value === 1 || value === '1')
        return true;
    if (value === 'false' || value === false)
        return false;
    if (value === 'true' || value === true)
        return true;
    return Boolean(value);
}
