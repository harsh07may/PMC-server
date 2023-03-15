import { Express,Router,Response, Request } from "express";
import cookieParser from "cookie-parser";
export const router = Router();
import { hash, compare } from "bcryptjs";
import { JwtPayload, verify } from "jsonwebtoken";
import { getEnv } from "../utils/constants";
import { createAccessToken, createRefreshToken, appendAccessToken, appendRefreshToken } from "../tokens";
import {pool} from "../utils/db";
import { FailedLoginError, ExistingUserError } from "../models/errors";

router.use(cookieParser());

//1.Register an user
router.post("/register", async (req: Request, res: Response) => {
    const { username,fullname,designation, password, roles } = req.body;
    try {
      const user = await pool.query("SELECT * from users WHERE username = $1", [
        username,
      ]);
      if (user.rows.length > 0) {
        // throw new Error("User already exists");
        const err = new ExistingUserError("User already exists");
        return res.status(err.statusCode).send({ error: err });
      }
      const hashedpassword = await hash(password, 10);
  
      const newUser = await pool.query(
        "INSERT INTO users (username,fullname,designation,password,roles) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [username,fullname,designation,hashedpassword,roles]
      );
      res.json(newUser.rows[0]);
    } catch (err: any) {
      res.send({ error: `${err.message}` });
    }
  });
  
  //2.Login
  
  router.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
      const user = await pool.query("SELECT * from users WHERE username = $1", [
        username,
      ]);

      if (user.rows.length === 0) {
        // throw new Error("Username or Password is incorrect ");
        const err = new FailedLoginError("Username or Password is incorrect");
        return res.status(err.statusCode).send({ error: err });
      }
      
      const valid = await compare(password, user.rows[0].password);
      if (!valid) {
        // throw new Error("Username or Password is incorrect ");
        const err = new FailedLoginError("Username or Password is incorrect");
        return res.status(err.statusCode).send({ error: err });
      }
  
      const accessToken = createAccessToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
      const refreshToken = createRefreshToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
  
      const updatedUser = await pool.query(
        "UPDATE users SET refresh_token = $1 WHERE username = $2",
        [refreshToken, username]
      );
  
      appendRefreshToken(res, refreshToken);
      appendAccessToken(req, res, accessToken);


    } catch (err: any) {
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
    payload = verify(token, String(getEnv("REFRESH_TOKEN_SECRET"))) as JwtPayload;
  } catch (err) {
    return res.send({ accesstoken: "" });
  }
  const user = await pool.query("SELECT * from users WHERE user_id = $1", [
    payload.userId,
  ]);
  if (user.rowCount == 0) return res.send({ accesstoken: "" });

  if (user.rows[0].refresh_token !== token)
    return res.send({ accesstoken: "" });

  const accesstoken = createAccessToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
  const refreshtoken = createRefreshToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
  const updatedUser = await pool.query(
    "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
    [refreshtoken, payload.userId]
  );
  appendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});
