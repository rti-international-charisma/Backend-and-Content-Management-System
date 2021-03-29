"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelationType = void 0;
function getRelationType(getRelationOptions) {
    const { relation, collection, field } = getRelationOptions;
    if (!relation)
        return null;
    if (relation.many_collection === collection &&
        relation.many_field === field &&
        relation.one_collection_field &&
        relation.one_allowed_collections) {
        return 'm2a';
    }
    if (relation.many_collection === collection && relation.many_field === field) {
        return 'm2o';
    }
    if (relation.one_collection === collection && relation.one_field === field) {
        return 'o2m';
    }
    return null;
}
exports.getRelationType = getRelationType;
