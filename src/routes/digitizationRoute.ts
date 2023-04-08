import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import multer = require("multer");
import * as fs from "fs";
const upload = multer({ dest: "uploads/" });
import { AccessDeniedError } from "../models/errors";

router.post("/upload", upload.single("file"), (req, res) => {
  console.log(req.file);
  if (req.file == null) {
    return res.status(400).json({ message: "Please choose one file" });
  } else {
    const file = req.file;
    console.log(file.originalname);

    const fileStream = fs.createReadStream(file.path);
    const path = `D:/PMC Document Digitization/${file.originalname}`;
    console.log(path);
    const wStream = fs.createWriteStream(path);

    fileStream.on("data", (data) => {
      wStream.write(data);
    });

    res.send({ fileLink: `${path}` });
  }
});

// 4. Protected Routes
router.post("/insert", async (req: Request, res: Response) => {
  try {
    var newContent;
    var auditContent;
    const { type } = req.body;
    const {UserName} = req.body;
    const Action = "Upload"; 
    if (type == "municipal_property_record") {
      const { WardNo, SubDivNo, Title, FileLink } = req.body;
      newContent = await pool.query(
        "INSERT INTO municipal_records (wardno,subdivno,title,filelink, timestamp) VALUES($1,$2,$3,$4, (select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
        [WardNo, SubDivNo, Title, FileLink]
      );

      auditContent = await pool.query(
        "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
        [type, FileLink, Action, UserName]
      );
      
    } else if (type == "birth_record") {
      const { Month, Year, FileLink } = req.body;
      newContent = await pool.query(
        "INSERT INTO birth_records (month,year,filelink, timestamp) VALUES($1,$2,$3,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
        [Month, Year, FileLink]
      );
    }
    else if(type === "house_tax_record"){
      const {WardNo, HouseNo, Name, FileLink} = req.body;
      newContent = await pool.query(
        "INSERT INTO housetax_records (wardno, houseno, name, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
        [WardNo, HouseNo, Name, FileLink]
      );
    }
    else{
      const {LicenseNo, SubDivNo, Year, Name, FileLink} = req.body;
      newContent = await pool.query(
        "INSERT INTO constructionlicense_records(licenseno, subdivno, year, name, filelink, timestamp) VALUES ($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
        [LicenseNo, SubDivNo, Year, Name, FileLink]
      );
    }
    res.json(newContent.rows[0]);
  } catch (err: any) {
    res.send({ error: `${err.message}` });
  }
});
//TODO router.get("/search", authMiddleware, async (req, res) => {
router.get("/search", async (req, res) => {
  try {
    const { name, type } = req.query;
    console.log({ name: name, type: type });
    var document;
    if (type === "municipal_property_record") {
      document = await pool.query(
        "SELECT * from municipal_records WHERE title LIKE '%' || $1 || '%'",
        [name]
      );
    } else if (type === "house_tax") {
      document = await pool.query(
        "SELECT * from house_tax WHERE doc_type = $1 or doc_name = $2",
        [name]
      );
    }

    // document = await pool.query(
    //   "SELECT * from document WHERE doc_type = $1 or doc_name = $2",
    //   [type, name]
    // );

    if (document.rowCount === 0) throw new Error("File not found");
    res.send(document.rows);
  } catch (error: any) {
    res.send({ error: `${error.message}` });
  }
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const userRole = req.User.userRoles;

  const err = new AccessDeniedError("You need to be an Admin");
  if (userRole != "admin")
    return res.status(err.statusCode).send({ error: err });

  res.json(req.User);
});

router.get("/file-download", async (req, res) => {
  try {
    var auditContent;
    const { doc_name, type, username} = req.query;
    const Action = "Search";
    
    const document = await pool.query(
      "SELECT * from housetax_records WHERE name = $1",
      [doc_name]
    );
    if (document.rowCount === 0) throw new Error("File not found");

    auditContent = await pool.query(
      "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
      [type, document.rows[0].filelink, Action, username]
    );

    const fileName = document.rows[0].filelink.substring(29);
    const filePath = document.rows[0].filelink;
    console.log(filePath);
    res.download(filePath);
  } catch (error: any) {
    res.send({ error: `${error.message}` });
  }
});
