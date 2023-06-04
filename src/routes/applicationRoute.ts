import { Router, Response, Request } from "express";
export const router = Router();
import {
  addNewApplication,
  fetchApplication,
} from "../services/applicationService";

import {
  BadRequestError,
  ExistingUserError,
  ResourceNotFoundError,
} from "../models/errors";
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

router.post("/createApplication", async (req: Request, res: Response) => {
  try {
    const { ref_id, title } = req.body;
    const application = await fetchApplication(ref_id);
    if (application.rows.length > 0) {
      logger.log("error", `Application with reference No. already exists.`);
      throw new BadRequestError(
        "Application with reference no. already exists."
      );
    }
    await addNewApplication(ref_id, title);
    res
      .status(200)
      .send(`Successfully created Application with Reference No. ${ref_id}`);
  } catch (err: any) {
    res.send(err);
  }
});

router.post("/transferApplication", async (req: Request, res: Response) => {
  try {
  } catch (err: any) {
    // Handle error here
  }
});
