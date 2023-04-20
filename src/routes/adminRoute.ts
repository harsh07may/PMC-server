import { Router, Response, Request } from "express";
export const router = Router();
import { authMiddleware } from "../authMiddleware";
import { pool } from "../utils/db";
import { AccessDeniedError } from "../models/errors";
import { hash, compare } from "bcryptjs";

router.post(
  "/update-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userRole = req.User.userRoles;
      const performedBy = req.User.userName;
      const err = new AccessDeniedError("You need to be an Admin");
      if (userRole != "admin") {
        return res.status(err.statusCode).send({ error: err });
      }
      const { username, fullname, designation, password, roles } = req.body;
      const hashedpassword = await hash(password, 10);

      const user = await pool.query("SELECT * from users WHERE username = $1", [
        username,
      ]);
      if (user.rows.length === 0) {
        return res.status(404).send("User not found");
      }

      const Action = "update";
      const description = `Updated user %${username}`;

      const updatedUser = await pool.query(
        "UPDATE users SET fullname = $1,designation=$2,password=$3,roles=$4 WHERE username = $5",
        [fullname, designation, hashedpassword, roles, username]
      );
      const auditContent = await pool.query(
        "INSERT INTO admin_auditlogs(timestamp,action,description,performedby) VALUES ((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp),$1,$2,$3) RETURNING *",
        [Action, description, performedBy]
      );
      return res.send({
        message: "User Modified",
      });
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
      const userRole = req.User.userRoles;
      const err = new AccessDeniedError("You need to be an Admin");
      if (userRole != "admin") {
        return res.status(err.statusCode).send({ error: err });
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

      if (users.rowCount === 0) throw new Error("Audit not found");
      res.json({
        rows: users.rows,
        total: count.rows[0].count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);

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

      if (document.rowCount === 0) throw new Error("Audit not found");
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

      if (document.rowCount === 0) throw new Error("Audit not found");
      res.json({
        rows: document.rows,
        total: count.rows[0].count,
      });
    } catch (error: any) {
      res.send({ error: `${error.message}` });
    }
  }
);
