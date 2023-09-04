import {Request, Response, NextFunction} from "express";

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(res)
    res.status(500).json({message: "Une erreur s'est produite"})
}
