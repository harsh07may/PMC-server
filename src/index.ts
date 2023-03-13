import express, {Request, Response} from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import {router as Authroute } from "./routes/authRoute"
import {pool} from "./utils/db";
import { isAuth, authMiddleware } from "./isAuth";
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


//LISTENER
app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
