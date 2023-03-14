import { Router,Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../isAuth";
import {pool} from "../utils/db";
import multer = require("multer");
import * as fs from 'fs';
const upload = multer({ dest: 'uploads/' });
import { AccessDeniedError } from "../models/errors";


router.post("/upload",authMiddleware,upload.single('file'), (req, res) => {
    console.log(req.file);
    if (req.file == null) {
        return res.status(400).json({ 'message': 'Please choose one file' })
    }
    else {
        const file = req.file;
        console.log(file.originalname);

        const fileStream = fs.createReadStream(file.path);
        const path = `D://PMC Document Digitization//${file.originalname}`
        console.log(path);
        const wStream = fs.createWriteStream(path);

        fileStream.on('data', (data) => {
            wStream.write(data);
        })

        res.send({fileLink : `${path}`});
    }
})

// 4. Protected Routes
router.post("/insert", authMiddleware, async (req: Request, res: Response) => {
    const {doc_name,doc_location,doc_type} = req.body;
    try {
    //   const userId = req.User?.userId;
        const { doc_name, doc_location,doc_type} = req.body;
        const newContent = await pool.query(
          "INSERT INTO document (doc_name,doc_location,doc_type) VALUES($1,$2,$3) RETURNING *",
          [doc_name,doc_location,doc_type]
        );
        res.json(newContent.rows[0]);
    } catch (err: any) {
      res.send({ error: `${err.message}` });
    }
  });


  router.get("/",authMiddleware, async (req: Request, res: Response)=>{
      const userRole = req.User.userRoles;

      const err = new AccessDeniedError("You need to be an Admin");
      if(userRole!="admin") return res.status(err.statusCode).send({ error: err });

      res.json(req.User);
  })

  
  router.post("/search", authMiddleware,async (req: Request, res: Response)=>{
    try {
        const {doc_id} = req.body;
        console.log("doc_id"+doc_id);
    
        const document = await pool.query("SELECT * from document WHERE doc_id = $1", [doc_id]);
        // console.log(document.rows[0]);
        if(document.rowCount===0) throw new Error("File not found");
        res.download(document.rows[0].doc_location);
    } catch (error:any) {

        res.send({ error: `${error.message}` });

    }
})
