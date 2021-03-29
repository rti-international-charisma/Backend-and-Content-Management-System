"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGraphQLType = void 0;
const graphql_1 = require("graphql");
const graphql_type_json_1 = __importDefault(require("graphql-type-json"));
function getGraphQLType(localType) {
    switch (localType) {
        case 'boolean':
            return graphql_1.GraphQLBoolean;
        case 'bigInteger':
        case 'integer':
            return graphql_1.GraphQLInt;
        case 'decimal':
        case 'float':
            return graphql_1.GraphQLFloat;
        case 'csv':
        case 'json':
            return graphql_type_json_1.default;
        default:
            return graphql_1.GraphQLString;
    }
}
exports.getGraphQLType = getGraphQLType;
