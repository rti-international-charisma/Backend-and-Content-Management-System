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
exports.translateDatabaseError = void 0;
const database_1 = __importDefault(require("../../database"));
const postgres_1 = require("./dialects/postgres");
const mysql_1 = require("./dialects/mysql");
const mssql_1 = require("./dialects/mssql");
const sqlite_1 = require("./dialects/sqlite");
const oracle_1 = require("./dialects/oracle");
function translateDatabaseError(error) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (database_1.default.client.constructor.name) {
            case 'Client_MySQL':
                return yield mysql_1.extractError(error);
            case 'Client_PG':
                return yield postgres_1.extractError(error);
            case 'Client_SQLite3':
                return yield sqlite_1.extractError(error);
            case 'Client_Oracledb':
            case 'Client_Oracle':
                return yield oracle_1.extractError(error);
            case 'Client_MSSQL':
                return yield mssql_1.extractError(error);
            default:
                return error;
        }
    });
}
exports.translateDatabaseError = translateDatabaseError;
