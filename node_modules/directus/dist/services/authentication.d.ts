import { Accountability, AbstractServiceOptions, SchemaOverview } from '../types';
import { Knex } from 'knex';
import { ActivityService } from '../services/activity';
declare type AuthenticateOptions = {
    email: string;
    password?: string;
    ip?: string | null;
    userAgent?: string | null;
    otp?: string;
    [key: string]: any;
};
export declare class AuthenticationService {
    knex: Knex;
    accountability: Accountability | null;
    activityService: ActivityService;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    /**
     * Retrieve the tokens for a given user email.
     *
     * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
     * to handle password existence checks elsewhere
     */
    authenticate(options: AuthenticateOptions): Promise<{
        accessToken: string;
        refreshToken: string;
        expires: number;
        id: any;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expires: number;
        id: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    generateTFASecret(): string;
    generateOTPAuthURL(pk: string, secret: string): Promise<string>;
    verifyOTP(pk: string, otp: string): Promise<boolean>;
    verifyPassword(pk: string, password: string): Promise<boolean>;
}
export {};
