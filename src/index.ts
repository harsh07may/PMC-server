import express, {Request, Response} from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import { JwtPayload, verify } from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { getEnv } from "./utils/constants";
import {router as Authroute } from "./routes/authRoute"
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

app.use("/api/v1/user", Authroute);

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
