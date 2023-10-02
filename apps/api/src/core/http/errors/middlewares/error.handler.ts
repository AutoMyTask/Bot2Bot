import {Request, Response, NextFunction} from "express";
import {HttpError} from "http-errors";
import {AppCore} from "api-common";

export const errorHandler = ({app}: AppCore.IApp) => {
    app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
        console.log(err)
        res.status(err.status).json({
            message: err.message,
            errors: err.errors
        })
    })
}
