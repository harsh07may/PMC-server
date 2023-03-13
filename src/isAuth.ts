import { JwtPayload, verify } from "jsonwebtoken";
import { AuthenticationError } from "./models/errors";
import { getEnv } from "./utils/constants";
import express, {Request, Response} from "express"
import { JwkKeyExportOptions } from "crypto";

export const isAuth = (req: Request, res: Response) => {
  // const authorization = req.header("authorization");
  const authorization = req.header("authorization");

  if (!authorization) {
    // throw new Error("You need to login");
    const err = new AuthenticationError("You are not logged in");
    return res.status(err.statusCode).send({ error: err });
  }

  const token = authorization.split(" ")[1];
  const { userId } = verify(token, String(getEnv("ACCESS_TOKEN_SECRET"))) as JwtPayload;
  return userId;
};

export const authMiddleware = (req: Request, res: Response, next: Function) => {
  const authorization = req.header("authorization");

  if (!authorization) {
    // throw new Error("You need to login");
    // return res.status(401).send("You need to login");
    const err = new AuthenticationError("You are not logged in");
    return res.status(err.statusCode).send({ error: err });
  }

  const token = authorization.replace("Bearer ", "");
  // console.log("token -->>" + token);
  const userData = verify(token, String(getEnv("ACCESS_TOKEN_SECRET"))) as JwtPayload;

  req.User = userData;

  next();
};

