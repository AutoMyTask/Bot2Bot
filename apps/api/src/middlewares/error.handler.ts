import {Request, Response, NextFunction} from "express";
import {HttpError} from "http-errors";
import {IApp} from "../core/app";

export const errorHandler = (app: IApp) => {
    app.app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
        res.status(err.status).json({
            message: err.message,
            errors: err.errors
        })
    })
}
