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
const express_1 = require("express");
const express_graphql_1 = require("express-graphql");
const services_1 = require("../services");
const respond_1 = require("../middleware/respond");
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const lodash_1 = require("lodash");
const router = express_1.Router();
router.use(async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const service = new services_1.GraphQLService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const schema = yield service.getSchema();
    /**
     * @NOTE express-graphql will attempt to respond directly on the `res` object
     * We don't want that, as that will skip our regular `respond` middleware
     * and therefore skip the cache. This custom response object overwrites
     * express' regular `json` function in order to trick express-graphql to
     * use the next middleware instead of respond with data directly
     */
    const customResponse = lodash_1.cloneDeep(res);
    customResponse.json = customResponse.end = function (payload) {
        res.locals.payload = payload;
        if (customResponse.getHeader('content-type')) {
            res.setHeader('Content-Type', customResponse.getHeader('content-type'));
        }
        if (customResponse.getHeader('content-length')) {
            res.setHeader('content-length', customResponse.getHeader('content-length'));
        }
        return next();
    };
    express_graphql_1.graphqlHTTP({ schema, graphiql: true })(req, customResponse);
})), respond_1.respond);
exports.default = router;
