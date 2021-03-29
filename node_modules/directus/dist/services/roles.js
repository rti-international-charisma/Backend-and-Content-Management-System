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
exports.RolesService = void 0;
const items_1 = require("./items");
const permissions_1 = require("./permissions");
const users_1 = require("./users");
const presets_1 = require("./presets");
const exceptions_1 = require("../exceptions");
const to_array_1 = require("../utils/to-array");
class RolesService extends items_1.ItemsService {
    constructor(options) {
        super('directus_roles', options);
    }
    delete(key) {
        const _super = Object.create(null, {
            delete: { get: () => super.delete }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const keys = to_array_1.toArray(key);
            // Make sure there's at least one admin role left after this deletion is done
            const otherAdminRoles = yield this.knex
                .count('*', { as: 'count' })
                .from('directus_roles')
                .whereNotIn('id', keys)
                .andWhere({ admin_access: true })
                .first();
            const otherAdminRolesCount = +((otherAdminRoles === null || otherAdminRoles === void 0 ? void 0 : otherAdminRoles.count) || 0);
            if (otherAdminRolesCount === 0)
                throw new exceptions_1.UnprocessableEntityException(`You can't delete the last admin role.`);
            // Remove all permissions associated with this role
            const permissionsService = new permissions_1.PermissionsService({
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const permissionsForRole = (yield permissionsService.readByQuery({
                fields: ['id'],
                filter: { role: { _in: keys } },
            }));
            const permissionIDs = permissionsForRole.map((permission) => permission.id);
            yield permissionsService.delete(permissionIDs);
            // Remove all presets that are attached to this role
            const presetsService = new presets_1.PresetsService({
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const presetsForRole = (yield presetsService.readByQuery({
                fields: ['id'],
                filter: { role: { _in: keys } },
            }));
            const presetIDs = presetsForRole.map((preset) => preset.id);
            yield presetsService.delete(presetIDs);
            // Nullify role for users in this role
            const usersService = new users_1.UsersService({
                knex: this.knex,
                accountability: this.accountability,
                schema: this.schema,
            });
            const usersInRole = (yield usersService.readByQuery({
                fields: ['id'],
                filter: { role: { _in: keys } },
            }));
            const userIDs = usersInRole.map((user) => user.id);
            yield usersService.update({ status: 'suspended', role: null }, userIDs);
            yield _super.delete.call(this, key);
            return key;
        });
    }
}
exports.RolesService = RolesService;
