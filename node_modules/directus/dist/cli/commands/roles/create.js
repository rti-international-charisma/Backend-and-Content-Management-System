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
Object.defineProperty(exports, "__esModule", { value: true });
const get_schema_1 = require("../../../utils/get-schema");
function rolesCreate({ name, admin }) {
    return __awaiter(this, void 0, void 0, function* () {
        const { default: database } = require('../../../database/index');
        const { RolesService } = require('../../../services/roles');
        if (!name) {
            console.error('Name is required');
            process.exit(1);
        }
        try {
            const schema = yield get_schema_1.getSchema();
            const service = new RolesService({ schema: schema, knex: database });
            const id = yield service.create({ name, admin_access: admin });
            console.log(id);
            database.destroy();
            process.exit(0);
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    });
}
exports.default = rolesCreate;
