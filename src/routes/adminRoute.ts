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
  checkPermissions,
  ROLES,
} from "../services/admnService";

//ENDPOINTS
router.post(
  "/register",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!checkPermissions(req, [ROLES.ADMIN])) {
        const error = new AccessDeniedError("Insufficient Permissions");
        return res.status(error.statusCode).send({ error });
      }

      const { username } = req.body; //New User
      const { userName } = req.User; //Performed by

      const user = await fetchUser(username);
      if (user.rows.length > 0) {
        const err = new ExistingUserError("User already exists");
        return res.status(err.statusCode).send({ error: err });
      }

      await addNewUserToDB(req.body);

      await addAuditLog("register", `Registered User %${username}`, userName);

      res.status(201).send(`Registered ${username}`);
    } catch (err: any) {
      res.send({ error: `${err.message}` });
    }
  }
);

router.post(
  "/update-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!checkPermissions(req, [ROLES.ADMIN])) {
        const error = new AccessDeniedError("Insufficient Permissions");
        return res.status(error.statusCode).send({ error });
      }

      const { username } = req.body; //New User
      const { userName } = req.User; //Performed by

      const user = await fetchUser(username);
      if (user.rows.length === 0) {
        return res.status(404).send("User not Found");
      }

      await updateUser(req.body);

      await addAuditLog("update", `Updated user %${username}`, userName);

      return res.send(`Updated ${username}`);
    } catch (err: any) {
      res.send({ error: `${err.message}` });
    }
  }
);

router.get(
  "/get-users",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!checkPermissions(req, [ROLES.ADMIN])) {
        const error = new AccessDeniedError("Insufficient Permissions");
        return res.status(error.statusCode).send({ error });
      }
      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const count = await pool.query("SELECT count(*) from users");
      if (offset > count.rows[0].count) {
        return res.status(404).send("Records not found");
      }
      const users = await pool.query(
        "SELECT user_id,username,fullname,designation,roles,timestamp FROM users ORDER BY roles ASC LIMIT $1 OFFSET $2",
        [limit, offset]
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
  // console.log(req.query);
  try {
    if (!checkPermissions(req, [ROLES.ADMIN])) {
      const error = new AccessDeniedError("Insufficient Permissions");
      return res.status(error.statusCode).send({ error });
    }

    const { username } = req.query;
    const user = await fetchUser(username?.toString() ?? "");
    if (user.rows.length === 0) {
      return res.status(404).send("User not Found");
    }

    if (user.rowCount === 0) return res.status(404).send("User not found");
    res.json({
      rows: user.rows,
    });
  } catch (error: any) {
    return res.status(404).send({ error: `${error.message}` });
  }
});

router.get(
  "/get-user-audit",
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
      const count = await pool.query("SELECT count(*) from admin_auditlogs");
      if (offset > count.rows[0].count) {
        return res.status(404).send("Records not found");
      }
      const document = await pool.query(
        "SELECT a.*, u.fullname FROM admin_auditlogs a INNER JOIN users u ON a.performedBy = u.username ORDER BY logid DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );

      if (document.rowCount === 0)
        return res.status(404).send("Records not found");
      res.json({
        rows: document.rows,
        total: count.rows[0].count,
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
      const userRole = req.User.userRoles;
      const err = new AccessDeniedError("You need to be an Admin");
      if (userRole != "admin") {
        return res.status(err.statusCode).send({ error: err });
      }
      const page = Number(req.query.page) || 1;
      const limit = 10;
      const offset = (page - 1) * limit;
      const count = await pool.query(
        "SELECT count(*) from searchadd_auditlogs"
      );
      if (offset > count.rows[0].count) {
        return res.status(404).send("Records not found");
      }
      const document = await pool.query(
        "SELECT a.*, u.fullname FROM searchadd_auditlogs a INNER JOIN users u ON a.performedby = u.username ORDER BY logid DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      );

      if (document.rowCount === 0)
        return res.status(404).send("Records not found");
      res.json({
        rows: document.rows,
        total: count.rows[0].count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);
