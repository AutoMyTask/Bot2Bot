import { NextFunction, Request, Response } from "express";
import { HttpError } from "http-errors";

export const logError = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Envoie d'un mail en cas d'erreur 500 par exemple
  console.log(err);
  next(err);
};
