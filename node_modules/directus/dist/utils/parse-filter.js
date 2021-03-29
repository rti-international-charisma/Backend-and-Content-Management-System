"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilter = void 0;
const deep_map_1 = require("./deep-map");
const to_array_1 = require("../utils/to-array");
function parseFilter(filter, accountability) {
    return deep_map_1.deepMap(filter, (val, key) => {
        if (val === 'true')
            return true;
        if (val === 'false')
            return false;
        if (val === 'null' || val === 'NULL')
            return null;
        if (['_in', '_nin', '_between', '_nbetween'].includes(String(key))) {
            if (typeof val === 'string' && val.includes(','))
                return val.split(',');
            else
                return to_array_1.toArray(val);
        }
        if (val === '$NOW')
            return new Date();
        if (val === '$CURRENT_USER')
            return (accountability === null || accountability === void 0 ? void 0 : accountability.user) || null;
        if (val === '$CURRENT_ROLE')
            return (accountability === null || accountability === void 0 ? void 0 : accountability.role) || null;
        return val;
    });
}
exports.parseFilter = parseFilter;
