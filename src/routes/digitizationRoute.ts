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
    //   const userRole = req.User?.userRole;
    console.log(req.body);
      if (userId !== null) {
        const { doc_name, doc_location,doc_type} = req.body;
        const newContent = await pool.query(
          "INSERT INTO document (doc_name,doc_location,doc_type) VALUES($1,$2,$3) RETURNING *",
          [doc_name,doc_location,doc_type]
        );
        res.json(newContent.rows[0]);
      }
    } catch (err: any) {
      res.send({ error: `${err.message}` });
    }
  });


  router.get("/",authMiddleware, async (req: Request, res: Response)=>{
    res.send("This is a protected endpoint")

  })