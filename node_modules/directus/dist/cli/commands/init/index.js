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
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const questions_1 = require("./questions");
const drivers_1 = require("../../utils/drivers");
const create_env_1 = __importDefault(require("../../utils/create-env"));
const uuid_1 = require("uuid");
const execa_1 = __importDefault(require("execa"));
const ora_1 = __importDefault(require("ora"));
const argon2_1 = __importDefault(require("argon2"));
const run_1 = __importDefault(require("../../../database/seeds/run"));
const run_2 = __importDefault(require("../../../database/migrations/run"));
const create_db_connection_1 = __importDefault(require("../../utils/create-db-connection"));
function init(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const rootPath = process.cwd();
        let { client } = yield inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'client',
                message: 'Choose your database client',
                choices: Object.values(drivers_1.drivers),
            },
        ]);
        const dbClient = drivers_1.getDriverForClient(client);
        const spinnerDriver = ora_1.default('Installing Database Driver...').start();
        yield execa_1.default('npm', ['install', dbClient, '--production']);
        spinnerDriver.stop();
        let attemptsRemaining = 5;
        const { credentials, db } = yield trySeed();
        function trySeed() {
            return __awaiter(this, void 0, void 0, function* () {
                const credentials = yield inquirer_1.default.prompt(questions_1.databaseQuestions[dbClient].map((question) => question({ client: dbClient, filepath: rootPath })));
                const db = create_db_connection_1.default(dbClient, credentials);
                try {
                    yield run_1.default(db);
                    yield run_2.default(db, 'latest');
                }
                catch (err) {
                    console.log();
                    console.log('Something went wrong while seeding the database:');
                    console.log();
                    console.log(`${chalk_1.default.red(`[${err.code || 'Error'}]`)} ${err.message}`);
                    console.log();
                    console.log('Please try again');
                    console.log();
                    attemptsRemaining--;
                    if (attemptsRemaining > 0) {
                        return yield trySeed();
                    }
                    else {
                        console.log(`Couldn't seed the database. Exiting.`);
                        process.exit(1);
                    }
                }
                return { credentials, db };
            });
        }
        yield create_env_1.default(dbClient, credentials, rootPath);
        console.log();
        console.log();
        console.log(`Create your first admin user:`);
        const firstUser = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'email',
                message: 'Email',
                default: 'admin@example.com',
            },
            {
                type: 'password',
                name: 'password',
                message: 'Password',
                mask: '*',
            },
        ]);
        firstUser.password = yield argon2_1.default.hash(firstUser.password);
        const userID = uuid_1.v4();
        const roleID = uuid_1.v4();
        yield db('directus_roles').insert({
            id: roleID,
            name: 'Administrator',
            icon: 'verified',
            admin_access: true,
            description: 'Initial administrative role with unrestricted App/API access',
        });
        yield db('directus_users').insert({
            id: userID,
            status: 'active',
            email: firstUser.email,
            password: firstUser.password,
            first_name: 'Admin',
            last_name: 'User',
            role: roleID,
        });
        yield db.destroy();
        console.log(`
Your project has been created at ${chalk_1.default.green(rootPath)}.

The configuration can be found in ${chalk_1.default.green(rootPath + '/.env')}

Start Directus by running:
  ${chalk_1.default.blue('cd')} ${rootPath}
  ${chalk_1.default.blue('npx directus')} start
`);
        process.exit(0);
    });
}
exports.default = init;
