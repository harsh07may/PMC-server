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

//MODELS
import { FailedLoginError } from "../models/errors";

//MIDDLEWARE
router.use(cookieParser());

//2.Login
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const user = await pool.query("SELECT * from users WHERE username = $1", [
      username,
    ]);

    if (user.rows.length === 0) {
      const err = new FailedLoginError("Username or Password is incorrect");
      return res.status(err.statusCode).send({ error: err });
    }

    const valid = await compare(password, user.rows[0].password);
    if (!valid) {
      const err = new FailedLoginError("Username or Password is incorrect");
      return res.status(err.statusCode).send({ error: err });
    }

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

    const Action = "login";
    const description = "login";
    await pool.query(
      "INSERT INTO admin_auditlogs(timestamp,action,description,performedby) VALUES ((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp),$1,$2,$3) RETURNING *",
      [Action, description, username]
    );

    await pool.query(
      "UPDATE users SET refresh_token = $1 WHERE username = $2",
      [refreshtoken, username]
    );

    appendRefreshToken(res, refreshtoken);
    res.send(accesstoken);
  } catch (err: any) {
    console.log(err.message);
    res.send({ error: `${err.message}` });
  }
});

// 3.Logout
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("refreshtoken", { path: "/api/v1/user/refresh_token" });
  return res.send({
    message: "Logged Out",
  });
});

// 5. Generate token with refresh token
router.post("/refresh_token", async (req: Request, res: Response) => {
  const token = req.cookies.refreshtoken;

  if (!token) return res.send({ accesstoken: "" });
  let payload: JwtPayload | null = null;
  try {
    payload = verify(
      token,
      String(getEnv("REFRESH_TOKEN_SECRET"))
    ) as JwtPayload;
  } catch (err) {
    return res.send({ accesstoken: "" });
  }

  const user = await pool.query("SELECT * from users WHERE user_id = $1", [
    payload.userId,
  ]);

  if (user.rowCount == 0) return res.send({ accesstoken: "" });

  if (user.rows[0].refresh_token !== token)
    return res.send({ accesstoken: "" });

  // const accesstoken = createAccessToken(
  //   user.rows[0].user_id,
  //   user.rows[0].username,
  //   user.rows[0].roles
  // );
  const refreshtoken = createRefreshToken(
    user.rows[0].user_id,
    user.rows[0].username,
    user.rows[0].roles
  );
  const updatedUser = await pool.query(
    "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
    [refreshtoken, payload.userId]
  );
  appendRefreshToken(res, refreshtoken);
  return res.send("accesstoken");
});
