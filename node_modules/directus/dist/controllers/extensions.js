"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_1 = __importStar(require("express"));
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const exceptions_1 = require("../exceptions");
const extensions_1 = require("../extensions");
const env_1 = __importDefault(require("../env"));
const respond_1 = require("../middleware/respond");
const router = express_1.Router();
const extensionsPath = env_1.default.EXTENSIONS_PATH;
router.use(express_1.default.static(extensionsPath));
router.get('/:type', async_handler_1.default((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const typeAllowList = ['interfaces', 'layouts', 'displays', 'modules'];
    if (typeAllowList.includes(req.params.type) === false) {
        throw new exceptions_1.RouteNotFoundException(req.path);
    }
    const extensions = yield extensions_1.listExtensions(req.params.type);
    res.locals.payload = {
        data: extensions,
    };
    return next();
})), respond_1.respond);
exports.default = router;
