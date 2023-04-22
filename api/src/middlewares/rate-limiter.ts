import rateLimit from "express-rate-limit";
import app from "../app";

export const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 60,
    max: 100,
})



