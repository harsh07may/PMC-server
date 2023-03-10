import { sign } from "jsonwebtoken";
import express, {Request, Response} from "express"
import { getEnv } from "./utils/constants";

export const createAccessToken = (userId: number) => {
  return sign({ userId }, String(getEnv("ACCESS_TOKEN_SECRET")), {
    expiresIn: "15m",
  });
}

export const createRefreshToken = (userId: number) => {
  return sign({ userId }, String(getEnv("REFRESH_TOKEN_SECRET")), {
    expiresIn: "7d",
  });
};

export const appendAccessToken = (req: Request, res: Response, accesstoken: string) => {
  res.send({
    accesstoken,
    username: req.body.username,
  });
};

export const appendRefreshToken = (res: Response, refreshtoken: string) => {
  res.cookie("refreshtoken", refreshtoken, {
    httpOnly: true,
    path: "/refresh_token",
  });
};

// module.exports = {
//   createAccessToken,
//   createRefreshToken,
//   sendAccessToken,
//   sendRefreshToken,
// };
