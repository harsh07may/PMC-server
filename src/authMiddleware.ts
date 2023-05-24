import { JwtPayload, verify } from "jsonwebtoken";
import { AuthenticationError } from "./models/errors";
import { getEnv } from "./utils/constants";
import express, { Request, Response } from "express";
import { logger } from "./utils/logger";

export const authMiddleware = (req: Request, res: Response, next: Function) => {
  const authorization = req.header("authorization");

  if (!authorization) {
    const err = new AuthenticationError("No Token");
    logger.log(
      "error",
      `Failed to access protected route. No access token provided in header.`
    );
    return res.status(err.statusCode).send({ error: err });
  }
  const token = authorization.replace("Bearer ", "");
  try {
    const userData = verify(
      token,
      String(getEnv("ACCESS_TOKEN_SECRET"))
    ) as JwtPayload;
    req.User = userData;
  } catch (error) {
    const err = new AuthenticationError("You are not logged in");

    logger.log("error", `Failed to verify access token. ${error}`);
    return res.status(err.statusCode).send({ error: err });
  }
  next();
};
