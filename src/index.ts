import express, { Request, Response } from "express";
import * as https from 'https';
import * as fs from 'fs';
import cookieParser from "cookie-parser";
import cors from "cors";
import { pool } from "./utils/db";
import { router as AuthRoute } from "./routes/authRoute";
import { router as DigitizationRoute } from "./routes/digitizationRoute";
import { router as AdminRoute } from "./routes/adminRoute";

const app = express();
const options = {
  key: fs.readFileSync(`./key.pem`),
  cert: fs.readFileSync(`./cert.pem`),
};

//MIDDLEWARE
//test
app.use(cookieParser());
app.use(
  cors({
    origin: `http://${process.env.HOST}:5173`,
    credentials: true,
    exposedHeaders: "content-disposition",
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

app.use("/api/v1/user", AuthRoute);
app.use("/api/v1/digitization", DigitizationRoute);
app.use("/api/v1/admin", AdminRoute);

// app.use("/api/v1/user", LeaveRoute);
// app.use("/api/v1/user", TrackingRoute);

//LISTENER
// app.listen(Number(process.env.PORT), `${process.env.HOST}`, () => {
//   console.log(`Server started on host ${process.env.HOST} and port ${process.env.PORT}`);
// });

https.createServer(options, app).listen(Number(process.env.PORT), process.env.HOST, () => {
  console.log('Server listening on host ' + process.env.HOST + ' and on port ' + process.env.PORT);
});