import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import { AccessDeniedError, ExistingUserError } from "../models/errors";
import {
  fetchUser,
  addAuditLog,
  addNewUserToDB,
  updateUser,
  getUser,
} from "../services/adminService";
import { checkPerms } from "../services/adminService";
import { logger } from "../utils/logger";
//ENDPOINTS
router.post(
  "/register",
  authMiddleware,
  async (req: Request, res: Response) => {
    const UserName = req.User.UserName;
    try {
      if (!(req.User.perms.admin)) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );
        throw new AccessDeniedError("Insufficient Permissions");
      }
      const newUser = req.body.username; //New User
      const addingUser = req.User.userName; //Performed by

      const user = await fetchUser(newUser);
      if (user.rows.length > 0) {
        logger.log(
          "error",
          `User ${UserName} attempted to register a username that already exists.`
        );
        throw new ExistingUserError("User already exists");
      }
      await addNewUserToDB(req.body);

      await addAuditLog("register", `Registered User %${newUser}`, addingUser);

      res.status(201).send(`Registered ${newUser}`);
    } catch (err: any) {
      logger.log("error", err);
      res.status(err.statusCode).send(err);
    }
  }
);

router.post(
  "/update-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    const UserName = req.User.UserName;
    try {
      if (!(req.User.perms.admin)) {
        logger.log(
          "error",
          `User ${UserName} attempted to access a resource without sufficient permissions.`
        );

        throw new AccessDeniedError("Insufficient Permissions");
      }
      const modifiedUser = req.body.username; //New User
      const addingUser = req.User.userName; //Performed by

      const user = await fetchUser(modifiedUser);
      if (user.rows.length === 0) {
        return res.status(404).send("User not Found");
      }

      await updateUser(req.body);

      await addAuditLog("update", `Updated user %${modifiedUser}`, addingUser);

      return res.status(200).send(`Updated ${modifiedUser}`);
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);

router.get(
  "/get-users",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!(req.User.perms.admin)) {
        const error = new AccessDeniedError("Insufficient Permissions");
        return res.status(error.statusCode).send(error);
      }
      let { fullname } = req.query;
      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const count = await pool.query("SELECT COUNT(*) FROM (SELECT * FROM users WHERE fullname  iLIKE '%' || $1 || '%' ) AS subquery",
        [fullname]);
      if (offset > count.rows[0].count) {
        return res.status(404).send("Records not found");
      }
      const users = await pool.query(
        "SELECT user_id,username,fullname,timestamp FROM users WHERE fullname  iLIKE '%' || $3 || '%' ORDER BY username ASC LIMIT $1 OFFSET $2",
        [limit, offset, fullname]
      );

      if (users.rowCount === 0) return res.status(404).send("User not found");
      res.json({
        rows: users.rows,
        total: count.rows[0].count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);

router.get("/get-user", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!(req.User.perms.admin)) {
      const error = new AccessDeniedError("Insufficient Permissions");
      return res.status(error.statusCode).send({ error });
    }

    const { username } = req.query;
    const user = await getUser(username?.toString() ?? "");
    if (user.rows.length === 0) {
      return res.status(404).send("User not Found");
    }

    if (user.rowCount === 0) return res.status(404).send("User not found");
    res.send(user.rows[0]);
  } catch (error: any) {
    return res.status(404).send({ error: `${error.message}` });
  }
});

router.get(
  "/get-user-audit",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!(req.User.perms.admin)) {
        const err = new AccessDeniedError("Insufficient Permissions");
        return res.status(err.statusCode).send({ error: err });
      }
      let { action, description, performedby, } = req.query;
      if (action === undefined || action === "") {
        action = ['login', 'update', 'register']
      }
      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const count = await pool.query("SELECT COUNT(*) AS total_count FROM (SELECT a.*, u.fullname FROM admin_auditlogs a INNER JOIN users u ON a.performedBy = u.username WHERE a.action = ANY($1::text[]) AND a.description iLIKE '%' || $2 || '%' AND a.performedby iLIKE '%' || $3 || '%') AS subquery",
        [action, description, performedby]);
      if (offset > count.rows[0].total_count) {
        return res.status(404).send("Records not found");
      }
      const document = await pool.query(
        "SELECT a.*, u.fullname FROM admin_auditlogs a INNER JOIN users u ON a.performedBy = u.username WHERE a.action = ANY($3::text[]) AND a.description iLIKE '%' || $4 || '%' AND a.performedby iLIKE '%' || $5 || '%' ORDER BY logid DESC LIMIT $1 OFFSET $2",
        [limit, offset, action, description, performedby]
      );

      if (document.rowCount === 0)
        return res.status(404).send("Records not found");
      res.json({
        rows: document.rows,
        total: count.rows[0].total_count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);

router.get(
  "/get-digitization-audit",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!(req.User.perms.admin)) {
        const err = new AccessDeniedError("Insufficient Permissions");
        return res.status(err.statusCode).send({ error: err });
      }
      let { action, category, title, performedby, } = req.query;
      if (category === undefined || category === "") {
        category = [
          'municipal_property_record',
          'birth_record',
          'death_record',
          'house_tax_record',
          'trade_license_record',
          'construction_license_record'
        ]
      }
      if (action === undefined || action === "") {
        action = ['Search', 'Download', 'Upload']
      }
      // console.log({ action: action, category: category, title: title, performedby: performedby, page: req.query.page });

      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const count = await pool.query(
        "SELECT COUNT(*) AS total_count FROM (SELECT a.*, u.fullname FROM searchadd_auditlogs a INNER JOIN users u ON a.performedby = u.username WHERE a.documenttype = ANY($1::text[]) AND a.action = ANY($2::text[]) AND a.resourcename iLIKE '%' || $3 || '%' AND a.performedby iLIKE '%' || $4 || '%' ORDER BY logid) AS subquery",
        [category, action, title, performedby]
      );
      if (offset > count.rows[0].count) {
        return res.status(404).send("Records not found");
      }
      // const document = await pool.query(
      //   "SELECT a.*, u.fullname FROM searchadd_auditlogs a INNER JOIN users u ON a.performedby = u.username ORDER BY logid DESC LIMIT $1 OFFSET $2",
      //   [limit, offset]
      // );
      const document = await pool.query(
        "SELECT a.*, u.fullname FROM searchadd_auditlogs a INNER JOIN users u ON a.performedby = u.username WHERE a.documenttype = ANY($3::text[]) AND a.action = ANY($4::text[]) AND a.resourcename iLIKE '%' || $5 || '%' AND a.performedby iLIKE '%' || $6 || '%' ORDER BY logid DESC LIMIT $1 OFFSET $2",
        [limit, offset, category, action, title, performedby]
      );

      if (document.rowCount === 0)
        return res.status(404).send("Records not found");
      res.json({
        rows: document.rows,
        total: count.rows[0].total_count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);
