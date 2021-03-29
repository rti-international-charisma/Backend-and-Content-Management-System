import { RequestHandler } from 'express';
import { RateLimiterMemory, RateLimiterRedis, RateLimiterMemcache } from 'rate-limiter-flexible';
declare let checkRateLimit: RequestHandler;
export declare let rateLimiter: RateLimiterRedis | RateLimiterMemcache | RateLimiterMemory;
export default checkRateLimit;
