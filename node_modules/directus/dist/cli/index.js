#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const pkg = require('../../package.json');
const start_1 = __importDefault(require("../start"));
const init_1 = __importDefault(require("./commands/init"));
const install_1 = __importDefault(require("./commands/database/install"));
const migrate_1 = __importDefault(require("./commands/database/migrate"));
const create_1 = __importDefault(require("./commands/users/create"));
const create_2 = __importDefault(require("./commands/roles/create"));
const count_1 = __importDefault(require("./commands/count"));
const bootstrap_1 = __importDefault(require("./commands/bootstrap"));
commander_1.default.name('directus').usage('[command] [options]');
commander_1.default.version(pkg.version, '-v, --version');
commander_1.default.command('start').description('Start the Directus API').action(start_1.default);
commander_1.default.command('init').description('Create a new Directus Project').action(init_1.default);
const dbCommand = commander_1.default.command('database');
dbCommand.command('install').description('Install the database').action(install_1.default);
dbCommand
    .command('migrate:latest')
    .description('Upgrade the database')
    .action(() => migrate_1.default('latest'));
dbCommand
    .command('migrate:up')
    .description('Upgrade the database')
    .action(() => migrate_1.default('up'));
dbCommand
    .command('migrate:down')
    .description('Downgrade the database')
    .action(() => migrate_1.default('down'));
const usersCommand = commander_1.default.command('users');
usersCommand
    .command('create')
    .description('Create a new user')
    .option('--email <value>', `user's email`)
    .option('--password <value>', `user's password`)
    .option('--role <value>', `user's role`)
    .action(create_1.default);
const rolesCommand = commander_1.default.command('roles');
rolesCommand
    .command('create')
    .storeOptionsAsProperties(false)
    .passCommandToAction(false)
    .description('Create a new role')
    .option('--name <value>', `name for the role`)
    .option('--admin', `whether or not the role has admin access`)
    .action(create_2.default);
commander_1.default.command('count <collection>').description('Count the amount of items in a given collection').action(count_1.default);
commander_1.default.command('bootstrap').description('Initialize or update the database').action(bootstrap_1.default);
commander_1.default.parseAsync(process.argv).catch((err) => {
    console.error(err);
    process.exit(1);
});
