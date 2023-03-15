import { Router,Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import {pool} from "../utils/db";
import multer = require("multer");
import * as fs from 'fs';
const upload = multer({ dest: 'uploads/' });
import { AccessDeniedError } from "../models/errors";


router.post("/upload",upload.single('file'), (req, res) => {
    console.log(req.file);
    if (req.file == null) {
        return res.status(400).json({ 'message': 'Please choose one file' })
    }
    else {
        const file = req.file;
        console.log(file.originalname);

        const fileStream = fs.createReadStream(file.path);
        const path = `D:/PMC Document Digitization/${file.originalname}`
        console.log(path);
        const wStream = fs.createWriteStream(path);

        fileStream.on('data', (data) => {
            wStream.write(data);
        })

        res.send({fileLink : `${path}`});
    }
})

// 4. Protected Routes
router.post("/insert", async (req: Request, res: Response) => {
    try {
    //   const userId = req.User?.userId;
    console.log("in insert");
    console.log(req.body);
    const { wardno,subdivno,title,filelink} = req.body;
    console.log(filelink);
        const newContent = await pool.query(
          "INSERT INTO Municipal_Records (wardno,subdivno,title,filelink) VALUES($1,$2,$3,$4) RETURNING *",
          [wardno,subdivno,title,filelink]
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

  router.get("/file-download", authMiddleware,async (req, res) => {
   try {
    const path = req.query.doc_name;
    console.log(path);
    const document = await pool.query("SELECT * from document WHERE doc_name = $1", [path]);
    if(document.rowCount===0) throw new Error("File not found");
    res.sendFile(document.rows[0].doc_location);
   } catch (error:any) {
    res.send({ error: `${error.message}` });
   }
  });


