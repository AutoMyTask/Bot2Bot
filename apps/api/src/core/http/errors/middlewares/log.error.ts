import {NextFunction, Request, Response} from "express";
import {HttpError} from "http-errors";
import {AppCore} from "api-common";

export const logError = ({app}: AppCore.IApp) => {
    app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
            // Envoie d'un mail en cas d'erreur 500 par exemple
            console.log(err)
            next(err)
        }
    )
}
