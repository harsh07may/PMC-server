import express, {Request, Response} from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import {pool} from "./utils/db";
import { JwtPayload, verify } from "jsonwebtoken";
import { getEnv } from "./utils/constants";
import {router as Authroute } from "./routes/authRoute"
import {router as DigitizationRoute} from "./routes/digitizationRoute"
import { createAccessToken, createRefreshToken, appendAccessToken, appendRefreshToken } from "./tokens";

import multer from "multer";

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
app.use(express.urlencoded({extended:true})); //support url encoded bodies

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
app.use("/api/v1/digitization", DigitizationRoute);

// app.post("/refresh_token", async (req: Request, res: Response) => {
//   const token = req.cookies.refreshtoken;

//   console.log(token);
//   if (!token) return res.send({ accesstoken: "" });
//   let payload: JwtPayload | null = null;
//   try {
//     payload = verify(token, String(getEnv("REFRESH_TOKEN_SECRET"))) as JwtPayload;
//   } catch (err) {
//     return res.send({ accesstoken: "" });
//   }
//   const user = await pool.query("SELECT * from users WHERE user_id = $1", [
//     payload.userId,
//   ]);
//   if (user.rowCount == 0) return res.send({ accesstoken: "" });

//   if (user.rows[0].refresh_token !== token)
//     return res.send({ accesstoken: "" });

//   const accesstoken = createAccessToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
//   const refreshtoken = createRefreshToken(user.rows[0].user_id,user.rows[0].username,user.rows[0].roles);
//   const updatedUser = await pool.query(
//     "UPDATE users SET refresh_token = $1 WHERE user_id = $2",
//     [refreshtoken, payload.userId]
//   );
//   appendRefreshToken(res, refreshtoken);
//   return res.send({ accesstoken });
// });

// app.use("/api/v1/user", LeaveRoute);
// app.use("/api/v1/user", TrackingRoute);

//LISTENER
app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
