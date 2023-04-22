import {auth} from "express-oauth2-jwt-bearer";

export const jwtCheck = auth({
  issuerBaseURL: `https://dev-6s6s0f4wpurx7gmw.eu.auth0.com`,
  audience: 'https://automytask/api',
});
