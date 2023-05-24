import { Router, Response, Request } from "express";
import cookieParser from "cookie-parser";
export const router = Router();

//JWT, ENV, PW-HASH
import { compare } from "bcryptjs";
import { JwtPayload, verify } from "jsonwebtoken";
import { getEnv } from "../utils/constants";
import {
  createAccessToken,
  createRefreshToken,
  appendRefreshToken,
} from "../tokens";
import { pool } from "../utils/db";
import { fetchUser } from "../services/adminService";
//MODELS
import { AuthenticationError, InternalError } from "../models/errors";
import { logger } from "../utils/logger";
//MIDDLEWARE
router.use(cookieParser());

//2.Login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await fetchUser(username);
    if (user.rows.length === 0) {
      logger.log(
        "error",
        `Failed Login Attempt with username:${username}. User entered invalid username`
      );
      throw new AuthenticationError("Invalid username or password");
    }

    const valid = await compare(password, user.rows[0].password);
    if (!valid) {
      logger.log(
        "error",
        `Failed Login Attempt with username:${username}. User entered invalid password`
      );
      throw new AuthenticationError("Invalid username or password");
    }

    const perms = await pool.query(
      "SELECT admin,municipality_property_records,birth_records,death_records,construction_license_records,house_tax_records,trade_license_records from permissions WHERE user_id = $1",
      [user.rows[0].user_id]
    );
    if (perms.rowCount == 0) {
      logger.log(
        "error",
        `Failed Login Attempt with username:${username}. User does not have any permissions associated with their account.`
      );
      throw new AuthenticationError("Permissions do not exist");
    }
    const accesstoken = createAccessToken(
      user.rows[0].user_id,
      user.rows[0].username,
      user.rows[0].roles,
      perms.rows[0]
    );
    const refreshtoken = createRefreshToken(
      user.rows[0].user_id,
      user.rows[0].username,
      user.rows[0].roles
    );
    try {
      await pool.query(
        "INSERT INTO admin_auditlogs(timestamp,action,description,performedby) VALUES ((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp),'login','login',$1)",
        [username]
      );
      await pool.query(
        "UPDATE users SET refresh_token = $1 WHERE username = $2",
        [refreshtoken, username]
      );
    } catch (error: any) {
      logger.log(
        "error",
        `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
      );
      throw new InternalError("Internal Server Error");
    }
    appendRefreshToken(res, refreshtoken);
    res.send(accesstoken);
  } catch (error: any) {
    res.status(error.statusCode).send(error);
  }
});

// 3.Logout
router.post("/logout", (req: Request, res: Response) => {
  try {
    res.clearCookie("refreshtoken", { path: "/api/v1/user/refresh_token" });
    return res.send({
      message: "Logged Out",
    });
  } catch (error: any) {
    logger.log(
      "error",
      `Failed to clear HttpOnly cookie during logout. Error message:${error.message}`
    );
    const err = new InternalError(`Internal Server Error`);
    res.status(err.statusCode).send(err.message);
  }
});

// 5. Generate token with refresh token
router.post("/refresh_token", async (req: Request, res: Response) => {
  try {
    //Check 1
    const token = req.cookies.refreshtoken;
    if (!token) {
      logger.log(
        "error",
        `Failed to refresh access token. Refresh token cookie not found`
      );
      return res.send({ accesstoken: "" });
    }

    let payload: JwtPayload | null = null; //Check 2
    try {
      payload = verify(
        token,
        String(getEnv("REFRESH_TOKEN_SECRET"))
      ) as JwtPayload;
    } catch (error: any) {
      logger.log("error", `Failed to verify refresh token.${error.message}`);
      return res.send({ accesstoken: "" });
    }

    const user = await pool.query("SELECT * from users WHERE user_id = $1", [
      payload.userId,
    ]);
    if (user.rowCount == 0 || user.rows[0].refresh_token !== token) {
      logger.log("error", `Failed to verify refresh token.Not Found in DB`);
      return res.send({ accesstoken: "" });
    } //Check 3

    try {
      const perms = await pool.query(
        "SELECT admin,municipality_property_records,birth_records,death_records,construction_license_records,house_tax_records,trade_license_records from permissions WHERE user_id = $1",
        [user.rows[0].user_id]
      );

      const accesstoken = createAccessToken(
        user.rows[0].user_id,
        user.rows[0].username,
        user.rows[0].roles,
        perms.rows[0]
      );
      const refreshtoken = createRefreshToken(
        user.rows[0].user_id,
        user.rows[0].username,
        user.rows[0].roles
      );
      await pool.query(
        "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
        [refreshtoken, payload.userId]
      );
      appendRefreshToken(res, refreshtoken);
      return res.send(accesstoken);
    } catch (error: any) {
      logger.log(
        "error",
        `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
      );
      throw new InternalError(`Internal Server Error`);
    }
  } catch (error: any) {
    res.status(error.statusCode).send(error.message);
  }
});
