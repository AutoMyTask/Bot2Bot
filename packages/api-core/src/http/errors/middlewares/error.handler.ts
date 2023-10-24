import {Request, Response, NextFunction} from "express";
import {HttpError} from "http-errors";
import {AppCore} from "api-core-types";

export const errorHandler = (err: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status).json({
        message: err.message,
        errors: err.errors
    })
}
