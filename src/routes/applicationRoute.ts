import { Router, Response, Request } from "express";
export const router = Router();
import { fetchApplication } from "../services/applicationService";

import { ResourceNotFoundError } from "../models/errors";
import { logger } from "../utils/logger";

router.get("/getall", async (req: Request, res: Response) => {
  try {
    const allContent = await fetchApplication();
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
  } catch (err: any) {
    // Handle error here
  }
});

router.post("/transferApplication", async (req: Request, res: Response) => {
  try {
  } catch (err: any) {
    // Handle error here
  }
});
