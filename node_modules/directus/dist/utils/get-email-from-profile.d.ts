/**
 * Extract the email address from a given user profile coming from a providers API
 *
 * Falls back to OAUTH_<PROVIDER>_PROFILE_EMAIL if we don't have it preconfigured yet, and defaults
 * to `email` if nothing is set
 *
 * This is used in the SSO flow to extract the users
 */
export default function getEmailFromProfile(provider: string, profile: Record<string, any>): any;
