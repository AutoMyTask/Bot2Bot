import {AppCore} from "api-core-types";
import {logError} from "./middlewares/log.error";
import {errorHandler as errorHandlerMiddleware} from "./middlewares/error.handler";

export const errorHandler = (app: AppCore.IApp) => {
    app.app.use(logError, errorHandlerMiddleware)
}
