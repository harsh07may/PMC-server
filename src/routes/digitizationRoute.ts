import { Router } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import multer = require("multer");
import {
  AccessDeniedError,
  ResourceNotFoundError,
  InternalError,
} from "../models/errors";
import { logger } from "../utils/logger";
import { checkPerms } from "../services/adminService";
import { getEnv } from "../utils/constants";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, `${getEnv("FILE_DIRECTORY")}`);
  },
  filename: function (req, file, callback) {
    const uniquePreffix = new Date().toISOString().replace(/:/g, "-");
    callback(null, `${uniquePreffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (req.file == null) {
        //? Is this an Internal Error or BadReq ?
        logger.log(
          "error",
          `Failed to upload file. No file was sent in the request.`
        );
        throw new InternalError("No File Selected");
      }
      const FileLink = `${getEnv("FILE_DIRECTORY")}/${req.file.filename}`;
      var newContent;
      var auditContent;
      const { type } = req.body;
      const UserName = req.User.userName; //Performed By
      const Action = "Upload";
      if (type == "municipal_property_record") {
        if (
          !checkPerms(req.User.perms, "municipality_property_records", "editor")
        ) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { surveyNo, location, title } = req.body;

        try {
          newContent = await pool.query(
            "INSERT INTO municipal_records (surveyno,location,title,filelink, timestamp) VALUES($1,$2,$3,$4, (select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [surveyNo, location, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      } else if (type == "birth_record") {
        if (!checkPerms(req.User.perms, "birth_records", "editor")) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { Month, Year, Title } = req.body;
        try {
          newContent = await pool.query(
            "INSERT INTO birth_records (month,year,title,filelink, timestamp) VALUES($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [Month, Year, Title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, `${Month + "/" + Year + " " + Title}`, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      } else if (type === "house_tax_record") {
        if (!checkPerms(req.User.perms, "house_tax_records", "editor")) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { location, houseNo, title } = req.body;
        try {
          newContent = await pool.query(
            "INSERT INTO housetax_records (location, houseno, title, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [location, houseNo, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      } else if (type === "construction_license_record") {
        if (
          !checkPerms(req.User.perms, "construction_license_records", "editor")
        ) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { licenseNo, surveyNo, location, title } = req.body;
        try {
          newContent = await pool.query(
            "INSERT INTO constructionlicense_records(licenseno, surveyno, location, title, filelink, timestamp) VALUES ($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [licenseNo, surveyNo, location, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      } else if (type === "trade_license_record") {
        if (!checkPerms(req.User.perms, "trade_license_records", "editor")) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { location, licenseNo, title } = req.body;
        try {
          newContent = await pool.query(
            "INSERT INTO tradelicense_records (location, licenseno, title, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [location, licenseNo, title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, title, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      } else if (type == "death_record") {
        if (!checkPerms(req.User.perms, "death_records", "editor")) {
          logger.log(
            "error",
            `User ${UserName} attempted to access a resource without sufficient permissions.`
          );
          throw new AccessDeniedError("Insufficient Permissions");
        }
        const { Month, Year, Title } = req.body;
        try {
          newContent = await pool.query(
            "INSERT INTO death_records (month,year,title,filelink, timestamp) VALUES($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
            [Month, Year, Title, FileLink]
          );
          auditContent = await pool.query(
            "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
            [type, `${Month + "/" + Year + " " + Title}`, Action, UserName]
          );
        } catch (error: any) {
          logger.log(
            "error",
            `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
          );
          throw new InternalError("Internal Server Error");
        }
      }

      res.json(newContent.rows[0]);
    } catch (error: any) {
      res.status(error.statusCode).send(error.message);
    }
  }
);

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    const UserName = req.User.userName;
    var document;
    if (type === "municipal_property_record") {
      if (
        !checkPerms(req.User.perms, "municipality_property_records", "viewer")
      ) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { title, surveyno, location } = req.query;
      try {
        document = await pool.query(
          "SELECT * from municipal_records WHERE title iLIKE '%' || $1 || '%' AND surveyno iLIKE '%' || $2 || '%' AND location iLIKE '%' || $3 || '%'",
          [title, surveyno, location]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "birth_record") {
      if (!checkPerms(req.User.perms, "birth_records", "viewer")) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { month, year, title } = req.query;
      try {
        document = await pool.query(
          "SELECT * from birth_records WHERE month iLIKE '%' || $1 || '%' AND year iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
          [month, year, title]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "house_tax_record") {
      if (!checkPerms(req.User.perms, "house_tax_records", "viewer")) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { location, houseNo, title } = req.query;
      try {
        document = await pool.query(
          "SELECT * from housetax_records WHERE location iLIKE '%' || $1 || '%' AND houseno iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
          [location, houseNo, title]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "construction_license") {
      if (
        !checkPerms(req.User.perms, "construction_license_records", "viewer")
      ) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { licenseNo, surveyNo, location, title } = req.query;
      try {
        document = await pool.query(
          "SELECT * from constructionlicense_records WHERE licenseno iLIKE '%' || $1 || '%' AND surveyno iLIKE '%' || $2 || '%' AND location iLIKE '%' || $3 || '%' AND title iLIKE '%' || $4 || '%'",
          [licenseNo, surveyNo, location, title]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "trade_license_record") {
      if (!checkPerms(req.User.perms, "trade_license_records", "viewer")) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { location, licenseNo, title } = req.query;
      try {
        document = await pool.query(
          "SELECT * from tradelicense_records WHERE location iLIKE '%' || $1 || '%' AND licenseno iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
          [location, licenseNo, title]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "death_record") {
      if (!checkPerms(req.User.perms, "death_records", "viewer")) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const { month, year, title } = req.query;
      try {
        document = await pool.query(
          "SELECT * from death_records WHERE month iLIKE '%' || $1 || '%' AND year iLIKE '%' || $2 || '%' AND title iLIKE '%' || $3 || '%'",
          [month, year, title]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${UserName}`
        );
        throw new InternalError("Internal Server Error");
      }
    }
    if (document.rowCount === 0) {
      throw new ResourceNotFoundError("File Not Found");
    }
    res.send(document.rows);
  } catch (error: any) {
    res.status(error.statusCode).send(error.message);
  }
});

router.get("/file-download", authMiddleware, async (req, res) => {
  try {
    var auditContent;
    const username = req.User.userName;
    const err = new AccessDeniedError("Insufficient Permissions");
    const { recordid, type } = req.query;
    const Action = "Download";

    var document;
    if (type === "municipal_property_record") {
      if (
        !checkPerms(req.User.perms, "municipality_property_records", "viewer")
      ) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from municipal_records WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "birth_record") {
      if (!checkPerms(req.User.perms, "birth_records", "viewer")) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from birth_records WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "house_tax_record") {
      if (!checkPerms(req.User.perms, "house_tax_records", "viewer")) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from housetax_records WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "death_record") {
      if (!checkPerms(req.User.perms, "death_records", "viewer")) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from death_records WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "trade_license_record") {
      if (!checkPerms(req.User.perms, "trade_license_records", "viewer")) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from tradelicense_records WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    } else if (type === "construction_license") {
      if (
        !checkPerms(req.User.perms, "construction_license_records", "viewer")
      ) {
        logger.log(
          "error",
          `User ${username} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      try {
        document = await pool.query(
          "SELECT * from constructionlicense_records  WHERE recordid = $1",
          [recordid]
        );
      } catch (error: any) {
        logger.log(
          "error",
          `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
        );
        throw new InternalError("Internal Server Error");
      }
    }

    if (document.rowCount === 0) throw new Error("File not found");
    try {
      auditContent = await pool.query(
        "INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *",
        [type, document.rows[0].filelink, Action, username]
      );
    } catch (error: any) {
      logger.log(
        "error",
        `Failed Query. Error message: ${error.message}. Error Code ${error.code} User ID:${username}`
      );
      throw new InternalError("Internal Server Error");
    }

    const fileName = document.rows[0].filelink.substring(29);
    const filePath = document.rows[0].filelink;
    res.download(filePath);
  } catch (error: any) {
    res.send({ error: `${error.message}` });
  }
});
