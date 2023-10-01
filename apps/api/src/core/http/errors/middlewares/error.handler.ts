import {Request, Response, NextFunction} from "express";
import {HttpError} from "http-errors";
import {IApp} from "../../../app";

export const errorHandler = ({app}: IApp) => {
    app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
        console.log(err)
        res.status(err.status).json({
            message: err.message,
            errors: err.errors
        })
    })
}
