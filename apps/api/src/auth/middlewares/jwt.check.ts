import {auth} from "express-oauth2-jwt-bearer";

export const jwtCheck = auth({
  issuerBaseURL: process.env.ISSUER,
  audience: process.env.AUDIENCE,
});
