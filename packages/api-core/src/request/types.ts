import {NextFunction, Request, Response} from "express";

export type CreateRequestHandler = (req: Request, res: Response, next: NextFunction) => void | Response | Promise<void | Response>
