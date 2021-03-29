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
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const format_title_1 = __importDefault(require("@directus/format-title"));
const env_1 = __importDefault(require("../../env"));
function run(database, direction) {
    return __awaiter(this, void 0, void 0, function* () {
        let migrationFiles = yield fs_extra_1.default.readdir(__dirname);
        const customMigrationsPath = path_1.default.resolve(env_1.default.EXTENSIONS_PATH, 'migrations');
        let customMigrationFiles = ((yield fs_extra_1.default.pathExists(customMigrationsPath)) && (yield fs_extra_1.default.readdir(customMigrationsPath))) || [];
        migrationFiles = migrationFiles.filter((file) => file.startsWith('run') === false && file.endsWith('.d.ts') === false);
        customMigrationFiles = customMigrationFiles.filter((file) => file.endsWith('.js'));
        const completedMigrations = yield database.select('*').from('directus_migrations').orderBy('version');
        const migrations = [
            ...migrationFiles.map((path) => parseFilePath(path)),
            ...customMigrationFiles.map((path) => parseFilePath(path, true)),
        ];
        function parseFilePath(filePath, custom = false) {
            const version = filePath.split('-')[0];
            const name = format_title_1.default(filePath.split('-').slice(1).join('_').split('.')[0]);
            const completed = !!completedMigrations.find((migration) => migration.version === version);
            return {
                file: custom ? path_1.default.join(customMigrationsPath, filePath) : path_1.default.join(__dirname, filePath),
                version,
                name,
                completed,
            };
        }
        if (direction === 'up')
            yield up();
        if (direction === 'down')
            yield down();
        if (direction === 'latest')
            yield latest();
        function up() {
            return __awaiter(this, void 0, void 0, function* () {
                const currentVersion = completedMigrations[completedMigrations.length - 1];
                let nextVersion;
                if (!currentVersion) {
                    nextVersion = migrations[0];
                }
                else {
                    nextVersion = migrations.find((migration) => {
                        return migration.version > currentVersion.version && migration.completed === false;
                    });
                }
                if (!nextVersion) {
                    throw Error('Nothing to upgrade');
                }
                const { up } = require(nextVersion.file);
                yield up(database);
                yield database.insert({ version: nextVersion.version, name: nextVersion.name }).into('directus_migrations');
            });
        }
        function down() {
            return __awaiter(this, void 0, void 0, function* () {
                const currentVersion = completedMigrations[completedMigrations.length - 1];
                if (!currentVersion) {
                    throw Error('Nothing to downgrade');
                }
                const migration = migrations.find((migration) => migration.version === currentVersion.version);
                if (!migration) {
                    throw new Error('Couldnt find migration');
                }
                const { down } = require(migration.file);
                yield down(database);
                yield database('directus_migrations').delete().where({ version: migration.version });
            });
        }
        function latest() {
            return __awaiter(this, void 0, void 0, function* () {
                for (const migration of migrations) {
                    if (migration.completed === false) {
                        const { up } = require(migration.file);
                        yield up(database);
                        yield database.insert({ version: migration.version, name: migration.name }).into('directus_migrations');
                    }
                }
            });
        }
    });
}
exports.default = run;
