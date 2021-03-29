"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const items_1 = require("./items");
/**
 * @TODO only return activity of the collections you have access to
 */
class ActivityService extends items_1.ItemsService {
    constructor(options) {
        super('directus_activity', options);
    }
}
exports.ActivityService = ActivityService;
