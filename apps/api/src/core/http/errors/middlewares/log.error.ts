import {NextFunction, Request, Response} from "express";
import {HttpError} from "http-errors";
import {IApp} from "../../../app";

export const logError = ({app}: IApp) => {
    app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
            // Envoie d'un mail en cas d'erreur 500 par exemple
            console.log(err)
            next(err)
        }
    )
}
