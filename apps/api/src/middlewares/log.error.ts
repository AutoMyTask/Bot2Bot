import {NextFunction, Request, Response} from "express";

export const logError = (err: any, req: Request, res: Response, next:NextFunction) => {
    // Envoie d'un mail en cas d'erreur 500 par exemple
    // console.log(err)
    next(err)
}
