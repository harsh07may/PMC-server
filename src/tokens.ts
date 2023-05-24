import { sign } from "jsonwebtoken";
import { Request, Response } from "express";
import { getEnv } from "./utils/constants";
import { Perms } from "./types/user";

export const createAccessToken = (
  userId: number,
  userName: string,
  userRoles: string,
  perms: Perms
) => {
  return sign(
    { userId, userName, userRoles, perms },
    String(getEnv("ACCESS_TOKEN_SECRET")),
    {
      expiresIn: "15m",
    }
  );
};

export const createRefreshToken = (
  userId: number,
  userName: string,
  userRoles: string
) => {
  return sign(
    { userId, userName, userRoles },
    String(getEnv("REFRESH_TOKEN_SECRET")),
    {
      expiresIn: "7d",
    }
  );
};

// export const appendAccessToken = (
//   req: Request,
//   res: Response,
//   accesstoken: string
// ) => {
//   res.send({
//     accesstoken,
//     username: req.body.username,
//     userrole: req.body.userrole,
//   });
// };

export const appendRefreshToken = (res: Response, refreshtoken: string) => {
  res.cookie("refreshtoken", refreshtoken, {
    httpOnly: true,
    path: "/api/v1/user/refresh_token",
    sameSite: "none",
    secure: true,
  });
};
