import {auth} from "express-oauth2-jwt-bearer";
import dotenv from "dotenv";

dotenv.config()

export const jwtCheck = auth({
  issuerBaseURL: process.env.ISSUER,
  audience: process.env.AUDIENCE,
});
