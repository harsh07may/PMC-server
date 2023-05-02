import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import multer = require("multer");
import * as fs from "fs";
const upload = multer({ dest: "uploads/" });
import { AccessDeniedError, ResourceNotFoundError } from "../models/errors";

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
          const { surveyNo, location, title } = req.body;
          newContent = await pool.query(
            "INSERT INTO municipal_records (surveyno,location,title,filelink, timestamp) VALUES($1,$2,$3,$4, (select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [surveyNo, location, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } else if (type == "birth_record") {
          const { Month, Year, Title } = req.body;
          newContent = await pool.query(
            "INSERT INTO birth_records (month,year,title,filelink, timestamp) VALUES($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [Month, Year, Title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, `${Month + "/" + Year + " " + Title}`, Action, UserName]
          );
        } else if (type === "house_tax_record") {
          const { location, houseNo, title } = req.body;
          newContent = await pool.query(
            "INSERT INTO housetax_records (location, houseno, title, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [location, houseNo, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } else if (type === "construction_license_record") {
          const { licenseNo, surveyNo, location, title } = req.body;
          newContent = await pool.query(
            "INSERT INTO constructionlicense_records(licenseno, surveyno, location, title, filelink, timestamp) VALUES ($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [licenseNo, surveyNo, location, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } else if (type === "trade_license_record") {
          const { location, licenseNo, title } = req.body;
          newContent = await pool.query(
            "INSERT INTO tradelicense_records (location, licenseno, title, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [location, licenseNo, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } else if (type == "death_record") {
          const { Month, Year, Title } = req.body;
          newContent = await pool.query(
            "INSERT INTO death_records (month,year,title,filelink, timestamp) VALUES($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [Month, Year, Title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, `${Month + "/" + Year + " " + Title}`, Action, UserName]
          );
        }

        res.json(newContent.rows[0]);
      }
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    var document;
    if (type === "municipal_property_record") {
      const { title, surveyno, location } = req.query;
      document = await pool.query(
        "SELECT * from municipal_records WHERE title iLIKE '%' || $1 || '%' AND surveyno iLIKE '%' || $2 || '%' AND location iLIKE '%' || $3 || '%'",
        [title, surveyno, location]
      );
    } else if (type === "birth_record") {
      const { month, year, title } = req.query;
      document = await pool.query(
        "SELECT * from birth_records WHERE month iLIKE '%' || $1 || '%' AND year iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
        [month, year, title]
      );
    } else if (type === "house_tax_record") {
      const { location, houseNo, title } = req.query;
      document = await pool.query(
        "SELECT * from housetax_records WHERE location iLIKE '%' || $1 || '%' AND houseno iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
        [location, houseNo, title]
      );
    } else if (type === "construction_license") {
      const { licenseNo, surveyNo, location, title } = req.query;
      // console.log(req.query);
      document = await pool.query(
        "SELECT * from constructionlicense_records WHERE licenseno iLIKE '%' || $1 || '%' AND surveyno iLIKE '%' || $2 || '%' AND location iLIKE '%' || $3 || '%' AND title iLIKE '%' || $4 || '%'",
        [licenseNo, surveyNo, location, title]
      );
    } else if (type === "trade_license_record") {
      const { location, licenseNo, title } = req.query;
      document = await pool.query(
        "SELECT * from tradelicense_records WHERE location iLIKE '%' || $1 || '%' AND licenseno iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
        [location, licenseNo, title]
      );
    } else if (type === "death_record") {
      const { month, year, title } = req.query;
      document = await pool.query(
        "SELECT * from death_records WHERE month iLIKE '%' || $1 || '%' AND year iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
        [month, year, title]
      );
    }

    if (document.rowCount === 0) throw new Error("File not found");
    res.send(document.rows);
  } catch (error: any) {
    res.status(404).send(`${error.message}`);
    // res.status(error.statusCode).send({ error: error });
  }
});

router.get("/file-download", authMiddleware, async (req, res) => {
  try {
    var auditContent;
    const username = req.User.userName;
    const { recordid, type } = req.query;
    // console.log(req.query);
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
    } else if (type === "death_record") {
      document = await pool.query(
        "SELECT * from death_records WHERE recordid = $1",
        [recordid]
      );
    } else if (type === "trade_license_record") {
      document = await pool.query(
        "SELECT * from tradelicense_records WHERE recordid = $1",
        [recordid]
      );
    } else if (type === "construction_license") {
      document = await pool.query(
        "SELECT * from constructionlicense_records  WHERE recordid = $1",
        [recordid]
      );
    }

    if (document.rowCount === 0) throw new Error("File not found");
    // console.log(document.rowCount);
    auditContent = await pool.query(
      "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
      [type, document.rows[0].filelink, Action, username]
    );

    const fileName = document.rows[0].filelink.substring(29);
    const filePath = document.rows[0].filelink;
    // console.log(filePath);
    res.download(filePath);
  } catch (error: any) {
    res.send({ error: `${error.message}` });
  }
});
