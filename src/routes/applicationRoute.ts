import { Router, Response, Request } from "express";
export const router = Router();
import {
  addNewApplication,
  checkTrail,
  fetchApplication,
  fetchTrailByStatus,
  transferApplication,
} from "../services/applicationService";

import { BadRequestError, ResourceNotFoundError } from "../models/errors";
import { logger } from "../utils/logger";
import { authMiddleware } from "../authMiddleware";

router.get("/getall", async (req: Request, res: Response) => {
  try {
    const allContent = await fetchApplication("");
    if (allContent.rows == 0) {
      throw new ResourceNotFoundError("Applications Not Found");
    }
    res.json(allContent.rows);
  } catch (err: any) {
    logger.log("error", err);
    res.status(500).send("Internal Error");
  }
});

router.get("/getPending", async (req: Request, res: Response) => {
  try {
    const { dept } = req.query;
    const Department = dept ? String(dept) : "";

    const pending = await fetchTrailByStatus(Department, "unseen");
    res.send(pending.rows);
  } catch (err: any) {
    logger.log("error", err);
    res.send(err);
  }
});

router.post("/createApplication", async (req: Request, res: Response) => {
  try {
    const { ref_id, title } = req.body;
    const application = await fetchApplication(ref_id);
    if (application.rows.length > 0) {
      logger.log("error", `Application with reference No. already exists.`);
      throw new BadRequestError(
        `Application with reference no.  ${ref_id} already exists.`
      );
    }
    await addNewApplication(ref_id, title);
    res.send(`Successfully created Application with Reference No. ${ref_id}`);
  } catch (err: any) {
    res.send(err);
  }
});

router.post("/transferApplication", async (req: Request, res: Response) => {
  try {
    const { ref_id, reciever } = req.body;
    const application = await fetchApplication(ref_id);
    if (application.rows.length == 0) {
      logger.log(
        "error",
        `Application with reference No. ${ref_id} does not already exist.`
      );
      throw new BadRequestError(
        `Application with reference no. ${ref_id} does not exist.`
      );
    }
    const transfer_no = await checkTrail(ref_id);
    await transferApplication(
      ref_id,
      transfer_no,
      application.rows[0].holder,
      reciever
    );
    res.send(`Application ${ref_id} transferred to ${reciever}`);
  } catch (err: any) {
    res.send(err);
  }
});

router.post("/updateStatus", async (req: Request, res: Response) => {
  try {
  } catch (err: any) {
    // Handle error here
  }
});
