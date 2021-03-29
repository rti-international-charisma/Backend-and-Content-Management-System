"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemRelationRows = void 0;
const require_yaml_1 = require("../../../utils/require-yaml");
const lodash_1 = require("lodash");
const systemData = require_yaml_1.requireYAML(require.resolve('./relations.yaml'));
exports.systemRelationRows = systemData.data.map((row) => {
    return lodash_1.merge({ system: true }, systemData.defaults, row);
});
