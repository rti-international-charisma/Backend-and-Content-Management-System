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
exports.sendPasswordResetMail = exports.sendInviteMail = exports.transporter = void 0;
const database_1 = __importDefault(require("../database"));
const logger_1 = __importDefault(require("../logger"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const liquidjs_1 = require("liquidjs");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const env_1 = __importDefault(require("../env"));
const readFile = util_1.promisify(fs_1.default.readFile);
const liquidEngine = new liquidjs_1.Liquid({
    root: path_1.default.resolve(__dirname, 'templates'),
    extname: '.liquid',
});
exports.transporter = null;
if (env_1.default.EMAIL_TRANSPORT === 'sendmail') {
    exports.transporter = nodemailer_1.default.createTransport({
        sendmail: true,
        newline: env_1.default.EMAIL_SENDMAIL_NEW_LINE || 'unix',
        path: env_1.default.EMAIL_SENDMAIL_PATH || '/usr/sbin/sendmail',
    });
}
else if (env_1.default.EMAIL_TRANSPORT.toLowerCase() === 'smtp') {
    exports.transporter = nodemailer_1.default.createTransport({
        pool: env_1.default.EMAIL_SMTP_POOL,
        host: env_1.default.EMAIL_SMTP_HOST,
        port: env_1.default.EMAIL_SMTP_PORT,
        secure: env_1.default.EMAIL_SMTP_SECURE,
        auth: {
            user: env_1.default.EMAIL_SMTP_USER,
            pass: env_1.default.EMAIL_SMTP_PASSWORD,
        },
    });
}
else {
    logger_1.default.warn('Illegal transport given for email. Check the EMAIL_TRANSPORT env var.');
}
if (exports.transporter) {
    exports.transporter.verify((error) => {
        if (error) {
            logger_1.default.warn(`Couldn't connect to email server.`);
            logger_1.default.warn(`Email verification error: ${error}`);
        }
        else {
            logger_1.default.info(`Email connection established`);
        }
    });
}
/**
 * Get an object with default template options to pass to the email templates.
 */
function getDefaultTemplateOptions() {
    return __awaiter(this, void 0, void 0, function* () {
        const projectInfo = yield database_1.default
            .select(['project_name', 'project_logo', 'project_color'])
            .from('directus_settings')
            .first();
        return {
            projectName: (projectInfo === null || projectInfo === void 0 ? void 0 : projectInfo.project_name) || 'Directus',
            projectColor: (projectInfo === null || projectInfo === void 0 ? void 0 : projectInfo.project_color) || '#546e7a',
            projectLogo: getProjectLogoURL(projectInfo === null || projectInfo === void 0 ? void 0 : projectInfo.project_logo),
        };
        function getProjectLogoURL(logoID) {
            let projectLogoURL = env_1.default.PUBLIC_URL;
            if (projectLogoURL.endsWith('/') === false) {
                projectLogoURL += '/';
            }
            if (logoID) {
                projectLogoURL += `assets/${logoID}`;
            }
            else {
                projectLogoURL += `admin/img/directus-white.png`;
            }
            return projectLogoURL;
        }
    });
}
function sendMail(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!exports.transporter)
            return;
        const templateString = yield readFile(path_1.default.join(__dirname, 'templates/base.liquid'), 'utf8');
        const html = yield liquidEngine.parseAndRender(templateString, { html: options.html });
        options.from = options.from || env_1.default.EMAIL_FROM;
        try {
            yield exports.transporter.sendMail(Object.assign(Object.assign({}, options), { html: html }));
        }
        catch (error) {
            logger_1.default.warn('[Email] Unexpected error while sending an email:');
            logger_1.default.warn(error);
        }
    });
}
exports.default = sendMail;
function sendInviteMail(email, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!exports.transporter)
            return;
        const defaultOptions = yield getDefaultTemplateOptions();
        const html = yield liquidEngine.renderFile('user-invitation', Object.assign(Object.assign({}, defaultOptions), { email,
            url }));
        yield exports.transporter.sendMail({
            from: env_1.default.EMAIL_FROM,
            to: email,
            html: html,
            subject: `[${defaultOptions.projectName}] You've been invited`,
        });
    });
}
exports.sendInviteMail = sendInviteMail;
function sendPasswordResetMail(email, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!exports.transporter)
            return;
        const defaultOptions = yield getDefaultTemplateOptions();
        const html = yield liquidEngine.renderFile('password-reset', Object.assign(Object.assign({}, defaultOptions), { email,
            url }));
        yield exports.transporter.sendMail({
            from: env_1.default.EMAIL_FROM,
            to: email,
            html: html,
            subject: `[${defaultOptions.projectName}] Password Reset Request`,
        });
    });
}
exports.sendPasswordResetMail = sendPasswordResetMail;
