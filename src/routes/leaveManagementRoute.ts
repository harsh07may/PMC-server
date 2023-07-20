import { Router, Response, Request } from "express";
export const router = Router();

import { addLeave, deleteLeaveById, getLeavesInDateRange } from "../services/leaveManagementService";
import { checkPerms } from "../services/adminService";
import {
  AccessDeniedError,
  BadRequestError,
  ResourceNotFoundError,
} from "../models/errors";
import { logger } from "../utils/logger";
import { authMiddleware } from "../authMiddleware";


//1. Add a leave record
router.post(
  "/addLeave", authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (req.User.perms.leave_management != "editor") {
        logger.log(
          "error",
          `User ${req.User.userName} tried to create an Application while not being an editor`
        );
        throw new AccessDeniedError(
          "Insufficient Permissions to create an Application"
        );
      }

      var { name, designation, department, type, dates } = req.body;

      //call func
      await addLeave(name, designation, department, type, dates[0], dates[1]);

      // const leaves = await getAllLeaves();
      // console.log(leaves);
      // res.send(leaves);
      res.send(`Successfully added Leave Record`);
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);

//2. Search for a Leave in a date range
router.post("/getLeavesInRange", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (
      !checkPerms(req.User.perms, "leave_management", "viewer")
    ) {
      logger.log(
        "error",
        `User ${req.User.userName} attempted to access a resource without sufficient permissions.`
      );
      throw new AccessDeniedError("Insufficient Permissions");
    }
    const { start_date, end_date } = req.body;
    const leaves = await getLeavesInDateRange(start_date, end_date);

    res.json(leaves.rows);
  } catch (err: any) {
    res.status(err.statusCode).send(err);
  }
});

router.delete("/deleteLeave", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.User.perms.leave_management != "editor") {
      logger.log(
        "error",
        `User ${req.User.userName} tried to delete an Application while not being an editor`
      );
      throw new AccessDeniedError(
        "Insufficient Permissions to delete an Application"
      );
    }
    var { id } = req.query;
    await deleteLeaveById(Number(id));

    // Response
    res.send(`Successfully deleted Leave Record`);
  } catch (err: any) {
    res.status(err.statusCode).send(err);
  }
});
