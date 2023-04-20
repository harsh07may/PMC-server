import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { pool } from "./utils/db";
import { router as AuthRoute } from "./routes/authRoute";
import { router as DigitizationRoute } from "./routes/digitizationRoute";
import { router as AdminRoute } from "./routes/adminRoute";

const app = express();

//MIDDLEWARE
//test
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
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
app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
