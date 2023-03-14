import { Router,Response, Request } from "express";
export const router = Router();
import { isAuth, authMiddleware } from "../isAuth";
import {pool} from "../utils/db";


// 4. Protected Routes
router.post("/add", authMiddleware, async (req: Request, res: Response) => {
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