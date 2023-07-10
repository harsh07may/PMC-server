import express, { Request, Response } from "express";
import * as https from "https";
import * as fs from "fs";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pool } from "./utils/db";
import { router as AuthRoute } from "./routes/authRoute";
import { router as DigitizationRoute } from "./routes/digitizationRoute";
import { router as AdminRoute } from "./routes/adminRoute";
import { router as ApplicationRoute } from "./routes/applicationRoute";
import { router as LeaveRoute } from "./routes/leaveManagementRoute";
import { Client } from "pg";
import { addNewUserToDB } from "./services/adminService";
import { getEnv } from "./utils/constants";
import { ResourceNotFoundError } from "./models/errors";
const app = express();
// const options = {
//   key: fs.readFileSync(`./key.pem`),
//   cert: fs.readFileSync(`./cert.pem`),
// };

//MIDDLEWARE
//test
app.use(cookieParser());
app.use(
  cors({
    origin: `${getEnv("ORIGIN")}`,
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
    if (allContent.rows == 0) {
      throw new ResourceNotFoundError("Users Not Found");
    }
    res.json(allContent.rows);
  } catch (err: any) {
    console.log(err.message);
    res.status(500).send("Internal Error");
  }
});
app.get("/health", async (req: Request, res: Response) => {
  res.send(`I am alive on ${String(getEnv("HOST"))}:${Number(getEnv("PORT"))}`);
});
pool.on("connect", async (client: Client) => {
  // check if number of users is 0
  // escape if users > 0
  // console.log("connected to db");
  // else add default admin user
  try {
    const doesUserExist = await client.query(
      "SELECT EXISTS(SELECT 1 FROM users );"
    );
    // console.log(doesUserExist);
    if (!doesUserExist.rows[0].exists) {
      // console.log(doesUserExist.rows[0].exists);
      await addNewUserToDB({
        username: "admin",
        fullname: "admin",
        password: "admin",
        perms: {
          admin: true,
          municipality_property_records: "editor",
          birth_records: "editor",
          death_records: "editor",
          construction_license_records: "editor",
          house_tax_records: "editor",
          trade_license_records: "editor",
          application_tracking: "deny",
          leave_management: "viewer"
        },
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.use("/api/v1/user", AuthRoute);
app.use("/api/v1/digitization", DigitizationRoute);
app.use("/api/v1/admin", AdminRoute);
app.use("/api/v1/application", ApplicationRoute);
app.use("/api/v1/leave", LeaveRoute);

// ! DOCKER
// app.use("/v1/user", AuthRoute);
// app.use("/v1/digitization", DigitizationRoute);
// app.use("/v1/admin", AdminRoute);
// app.use("/v1/application", ApplicationRoute);
//!

//LISTENER
app.listen(Number(getEnv("PORT")), () => {
  console.log(`Server started on port ${Number(getEnv("PORT"))}`);
});

// https.createServer(options, app).listen(Number(process.env.PORT), process.env.HOST, () => {
//   console.log('Server listening on host ' + process.env.HOST + ' and on port ' + process.env.PORT);
// });
