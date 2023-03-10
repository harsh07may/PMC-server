import express, {Request, Response} from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import { JwtPayload, verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { getEnv } from "./utils/constants";

import { createAccessToken, createRefreshToken, appendAccessToken, appendRefreshToken } from "./tokens";

// dotenv.config();

import {pool} from "./utils/db";

import { isAuth, authMiddleware } from "./isAuth";
import { FailedLoginError, ExistingUserError } from "./models/errors";

const app = express();

//MIDDLEWARE
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); //support JSON bodies
app.use(express.urlencoded({ extended: true })); //support url encoded bodies

//ROUTES

app.get("/getall", async (req: Request, res: Response) => {
  try {
    const allContent = await pool.query("SELECT * from users");

    res.json(allContent.rows);
  } catch (err: any) {
    console.log(err.message);
  }
});

//1.Register an user
app.post("/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;
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
      "INSERT INTO users (username,password) VALUES($1,$2) RETURNING *",
      [username, hashedpassword]
    );
    res.json(newUser.rows[0]);
  } catch (err: any) {
    res.send({ error: `${err.message}` });
  }
});

//2.Login

app.post("/login", async (req: Request, res: Response) => {
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

    const accessToken = createAccessToken(user.rows[0].user_id);
    const refreshToken = createRefreshToken(user.rows[0].user_id);

    const updatedUser = await pool.query(
      "UPDATE users SET refresh_token = $1 WHERE username = $2",
      [refreshToken, username]
    );

    appendRefreshToken(res, refreshToken);
    appendAccessToken(res, req, accessToken);
  } catch (err: any) {
    res.send({ error: `${err.message}` });
  }
});

// 3.Logout
app.post("/logout", (req, res) => {
  res.clearCookie("refreshtoken", { path: "/refresh_token" });
  return res.send({
    message: "Logged Out",
  });
});

// 4. Protected Routes
app.post("/add", authMiddleware, async (req: Request, res: Response) => {
  try {
    // const userId = isAuth(req);
    // console.log("user data ->>", JSON.stringify(req.User, null, 2));
    const userId = req.User?.userId;
    if (userId !== null) {
      const { content_desc } = req.body;
      const newContent = await pool.query(
        "INSERT INTO content (content_desc) VALUES($1) RETURNING *",
        [content_desc]
      );
      res.json(newContent.rows[0]);
    }
  } catch (err: any) {
    res.send({ error: `${err.message}` });
  }
});

// 5. Generate token with refresh token
app.post("/refresh_token", async (req: Request, res: Response) => {
  const token = req.cookies.refreshtoken;

  if (!token) return res.send({ accesstoken: "" });

  let payload: JwtPayload | null = null;
  try {
    payload = verify(token, String(getEnv("REFRESH_TOKEN_SECRET"))) as JwtPayload;
  } catch (err) {
    return res.send({ accesstoken: "" });
  }
  console.log(payload);
  const user = await pool.query("SELECT * from users WHERE user_id = $1", [
    payload.userId,
  ]);
  if (user.rowCount == 0) return res.send({ accesstoken: "" });

  if (user.rows[0].refresh_token !== token)
    return res.send({ accesstoken: "" });

  const accesstoken = createAccessToken(user.user_id);
  const refreshtoken = createRefreshToken(user.user_id);
  const updatedUser = await pool.query(
    "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
    [refreshtoken, payload.userId]
  );
  appendRefreshToken(res, refreshtoken);
  return res.send({ accesstoken });
});

//LISTENER
app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
