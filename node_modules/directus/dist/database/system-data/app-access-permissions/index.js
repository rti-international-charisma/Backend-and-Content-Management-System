"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appAccessMinimalPermissions = void 0;
const require_yaml_1 = require("../../../utils/require-yaml");
const lodash_1 = require("lodash");
const defaults = {
    role: null,
    permissions: {},
    validation: null,
    presets: null,
    fields: ['*'],
    limit: null,
    system: true,
};
const permissions = require_yaml_1.requireYAML(require.resolve('./app-access-permissions.yaml'));
exports.appAccessMinimalPermissions = permissions.map((row) => lodash_1.merge({}, defaults, row));
