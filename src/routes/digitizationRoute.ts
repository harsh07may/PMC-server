import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import multer = require("multer");
import * as fs from "fs";
const upload = multer({ dest: "uploads/" });
import { AccessDeniedError } from "../models/errors";

router.post("/upload", authMiddleware, upload.single("file"), (req, res) => {

  if (req.file == null) {
    return res.status(400).json({ message: "Please choose one file" });
  } else {
    const file = req.file;
    const fileStream = fs.createReadStream(file.path);
    const date = new Date().toISOString().replace(/:/g, "-");
    const fileName = `${date}-${file.originalname}`;
    const path = `D:/PMC Document Digitization/${fileName}`;

    // const path = `D:/PMC Document Digitization/${file.originalname}`;
    console.log(path);
    const wStream = fs.createWriteStream(path);

    fileStream.on("data", (data) => {
      wStream.write(data);
    });

    res.send({ fileLink: `${path}` });
  }
});

// 4. Protected Routes
router.post("/insert", authMiddleware, async (req: Request, res: Response) => {
  try {
    var newContent;
    var auditContent;
    const { type } = req.body;
    const UserName = req.User.userName;
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
    } else if (type === "house_tax_record") {
      const { WardNo, HouseNo, Name, FileLink } = req.body;
      newContent = await pool.query(
        "INSERT INTO housetax_records (wardno, houseno, name, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
        [WardNo, HouseNo, Name, FileLink]
      );
    } else {
      const { LicenseNo, SubDivNo, Year, Name, FileLink } = req.body;
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
    const { type } = req.query;
    var document;
    if (type === "municipal_property_record") {
      const { title, wardNo: wardno, subDivNo: subdivno } = req.query;
      document = await pool.query(
        "SELECT * from municipal_records WHERE title LIKE '%' || $1 || '%' AND wardno LIKE '%' || $2 || '%' AND subdivno LIKE '%' || $3 || '%'",
        [title, wardno, subdivno]
      );
    } else if (type === "birth_record") {
      const { Month, Year } = req.query;
      document = await pool.query(
        "SELECT * from birth_records WHERE month LIKE '%' || $1 || '%' AND wardno LIKE '%'",
        [Month, Year]
      );
    } else if (type === "house_tax_record") {
      const { WardNo, HouseNo, Name } = req.query;
      document = await pool.query(
        "SELECT * from housetax_records WHERE wardno LIKE '%' || $1 || '%' AND houseno LIKE '%' || $2 || '%' AND name LIKE '%' || $3 || '%'",
        [WardNo, HouseNo, Name]
      );
    } else if (type === "construction_license") {
      const { LicenseNo, SubDivNo, Year, Name } = req.query;
      document = await pool.query(
        "SELECT * from constructionlicense_records WHERE licenseno LIKE '%' || $1 || '%' AND subdivno LIKE '%' || $2 || '%' AND year LIKE '%' || $3 || '%' AND name LIKE '%' || $4 || '%'",
        [LicenseNo, SubDivNo, Year, Name]
      );
    }

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

router.get("/file-download", authMiddleware, async (req, res) => {
  try {
    var auditContent;
    const username = req.User.userName;
    const { recordid, type } = req.query;
    console.log(req.query);
    const Action = "Download";

    var document;
    if (type === "municipal_property_record") {
      document = await pool.query(
        "SELECT * from municipal_records WHERE recordid = $1",
        [recordid]
      );
    } else if (type === "birth_record") {
      document = await pool.query(
        "SELECT * from birth_records WHERE recordid = $1",
        [recordid]
      );
    } else if (type === "house_tax_record") {
      document = await pool.query(
        "SELECT * from housetax_records WHERE recordid = $1",
        [recordid]
      );
    } else if (type === "construction_license") {
      document = await pool.query(
        "SELECT * from constructionlicense_records  WHERE recordid = $1",
        [recordid]
      );
    }

    if (document.rowCount === 0) throw new Error("File not found");
    console.log(document.rowCount);
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
