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
} from "../services/adminService";
import { checkPerms } from "../services/userService";
import { logger } from "../utils/logger";
//ENDPOINTS
router.post(
  "/register",
  authMiddleware,
  async (req: Request, res: Response) => {
    const UserName = req.User.UserName;
    try {
      if (!checkPerms(req.User.perms, "admin", "admin")) {
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
      res.status(err.statusCode).send({ err });
    }
  }
);

router.post(
  "/update-user",
  authMiddleware,
  async (req: Request, res: Response) => {
    const UserName = req.User.UserName;
    try {
      if (!checkPerms(req.User.perms, "admin", "admin")) {
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
      res.status(err.statusCode).send({ err });
    }
  }
);

router.get(
  "/get-users",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!checkPerms(req.User.perms, "admin", "admin")) {
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
      //! Remove Roles, Add perms, Order by perms, admin #1 priority
      const users = await pool.query(
        "SELECT user_id,username,fullname,timestamp FROM users ORDER BY username ASC LIMIT $1 OFFSET $2",
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
  try {
    if (!checkPerms(req.User.perms, "admin", "admin")) {
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
      if (!checkPerms(req.User.perms, "admin", "admin")) {
        const err = new AccessDeniedError("Insufficient Permissions");
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
      if (!checkPerms(req.User.perms, "admin", "admin")) {
        console.log(req.User.perms);
        const err = new AccessDeniedError("Insufficient Permissions");
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
