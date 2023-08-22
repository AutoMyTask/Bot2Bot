import rateLimit from "express-rate-limit";

export const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 60,
    max: 100,
})



