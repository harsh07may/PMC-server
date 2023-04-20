import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import multer = require("multer");
import * as fs from "fs";
const upload = multer({ dest: "uploads/" });
import { AccessDeniedError } from "../models/errors";

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const userRole = req.User.userRoles;
      const err = new AccessDeniedError("You need to be an Admin");

      if (userRole != "admin" && userRole != "editor") {
        return res.status(err.statusCode).send({ error: err });
      }
      if (req.file == null) {
        return res.status(400).json({ message: "Please choose one file" });
      } else {
        const file = req.file;
        const fileStream = fs.createReadStream(file.path);
        const date = new Date().toISOString().replace(/:/g, "-");
        const fileName = `${date}-${file.originalname}`;
        const FileLink = `D:/PMC Document Digitization/${fileName}`;

        const wStream = fs.createWriteStream(FileLink);
        fileStream.on("data", (data) => {
          wStream.write(data);
        });

        var newContent;
        var auditContent;
        const { type } = req.body;
        const UserName = req.User.userName;
        const Action = "Upload";
        if (type == "municipal_property_record") {
          const { wardNo, subDivNo, title } = req.body;
          newContent = await pool.query(
            "INSERT INTO municipal_records (wardno,subdivno,title,filelink, timestamp) VALUES($1,$2,$3,$4, (select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [wardNo, subDivNo, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } else if (type == "birth_record") {
          const { Month, Year } = req.body;
          newContent = await pool.query(
            "INSERT INTO birth_records (month,year,filelink, timestamp) VALUES($1,$2,$3,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [Month, Year, FileLink]
          );

          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, `${Month + "/" + Year}`, Action, UserName]
          );
        } else if (type === "house_tax_record") {
          const { wardNo, houseNo, name } = req.body;
          newContent = await pool.query(
            "INSERT INTO housetax_records (wardno, houseno, name, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [wardNo, houseNo, name, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, name, Action, UserName]
          );
        } else {
          const { licenseNo, subDivNo, year, name } = req.body;
          newContent = await pool.query(
            "INSERT INTO constructionlicense_records(licenseno, subdivno, year, name, filelink, timestamp) VALUES ($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [licenseNo, subDivNo, year, name, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, name, Action, UserName]
          );
        }

        res.json(newContent.rows[0]);
      }
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);

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

router.get(
  "/get-search-audit",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userRole = req.User.userRoles;
      const err = new AccessDeniedError("You need to be an Admin");
      if (userRole != "admin") {
        return res.status(err.statusCode).send({ error: err });
      }

      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const document = await pool.query(
        `SELECT * FROM searchadd_auditlogs ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`
      );

      if (document.rowCount === 0) throw new Error("Audit not found");
      res.send(document.rows);
    } catch (error) {}
  }
);

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
