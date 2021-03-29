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
const env_1 = __importDefault(require("../../../env"));
const logger_1 = __importDefault(require("../../../logger"));
const run_1 = __importDefault(require("../../../database/seeds/run"));
const run_2 = __importDefault(require("../../../database/migrations/run"));
const get_schema_1 = require("../../../utils/get-schema");
const nanoid_1 = require("nanoid");
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.default.info('Initializing bootstrap...');
        if ((yield isDatabaseAvailable()) === false) {
            logger_1.default.error(`Can't connect to the database`);
            process.exit(1);
        }
        const { isInstalled, default: database } = require('../../../database');
        const { RolesService } = require('../../../services/roles');
        const { UsersService } = require('../../../services/users');
        const { SettingsService } = require('../../../services/settings');
        if ((yield isInstalled()) === false) {
            logger_1.default.info('Installing Directus system tables...');
            yield run_1.default(database);
            const schema = yield get_schema_1.getSchema();
            logger_1.default.info('Setting up first admin role...');
            const rolesService = new RolesService({ schema });
            const role = yield rolesService.create({ name: 'Admin', admin_access: true });
            logger_1.default.info('Adding first admin user...');
            const usersService = new UsersService({ schema });
            let adminEmail = env_1.default.ADMIN_EMAIL;
            if (!adminEmail) {
                logger_1.default.info('No admin email provided. Defaulting to "admin@example.com"');
                adminEmail = 'admin@example.com';
            }
            let adminPassword = env_1.default.ADMIN_PASSWORD;
            if (!adminPassword) {
                adminPassword = nanoid_1.nanoid(12);
                logger_1.default.info(`No admin password provided. Defaulting to "${adminPassword}"`);
            }
            yield usersService.create({ email: adminEmail, password: adminPassword, role });
            if (env_1.default.PROJECT_NAME && typeof env_1.default.PROJECT_NAME === 'string' && env_1.default.PROJECT_NAME.length > 0) {
                const settingsService = new SettingsService({ schema });
                yield settingsService.upsertSingleton({ project_name: env_1.default.PROJECT_NAME });
            }
        }
        else {
            logger_1.default.info('Database already initialized, skipping install');
        }
        logger_1.default.info('Running migrations...');
        yield run_2.default(database, 'latest');
        logger_1.default.info('Done');
        process.exit(0);
    });
}
exports.default = bootstrap;
function isDatabaseAvailable() {
    return __awaiter(this, void 0, void 0, function* () {
        const { hasDatabaseConnection } = require('../../../database');
        const tries = 5;
        const secondsBetweenTries = 5;
        for (var i = 0; i < tries; i++) {
            if (yield hasDatabaseConnection()) {
                return true;
            }
            yield new Promise((resolve) => setTimeout(resolve, secondsBetweenTries * 1000));
        }
        return false;
    });
}
