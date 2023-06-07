import { Router, Response, Request } from "express";
export const router = Router();
import {
  addNewApplication,
  checkTrail,
  searchApplications,
  fetchApplicationById,
  fetchTrailByStatus,
  transferApplication,
  updateApplicationTrailStatus,
  updateHolder,
  checkInValidTransfer,
  fetchTrailById,
  getHoldingFiles,
} from "../services/applicationService";

import {
  AccessDeniedError,
  BadRequestError,
  ResourceNotFoundError,
} from "../models/errors";
import { logger } from "../utils/logger";
import { authMiddleware } from "../authMiddleware";

// router.get("/getall", async (req: Request, res: Response) => {
//   try {
//     const allContent = await fetchApplication("", "", "", "", "", "");
//     if (allContent.rows == 0) {
//       throw new ResourceNotFoundError("Applications Not Found");
//     }
//     res.json(allContent.rows);
//   } catch (err: any) {
//     logger.log("error", err);
//     res.status(err.statusCode).send(err);
//   }
// });

//1. Search Application with ref_id, title, holder, sender, receiver, status
router.get("/searchApplication", async (req: Request, res: Response) => {
  try {
    const { ref_id, title, holder, sender, receiver, status } = req.query;

    const Ref_id = ref_id ? String(ref_id) : "";
    const Title = title ? String(title) : "";
    const Holder = holder ? String(holder) : "";
    const Sender = sender ? String(sender) : "";
    const Receiver = receiver ? String(receiver) : "";
    const Status = status ? String(status) : "";

    const allContent = await searchApplications(
      Ref_id,
      Title,
      Holder,
      Sender,
      Receiver,
      Status
    );
    if (allContent.rows == 0) {
      throw new ResourceNotFoundError("Applications Not Found");
    }
    res.json(allContent.rows);
  } catch (err: any) {
    res.status(err.statusCode).send(err);
  }
});
//2. Create Application with ref_id, title,notes
router.post(
  "/createApplication",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (req.User.perms.application_tracking != "central") {
        throw new AccessDeniedError("Insufficient Permissions");
      }
      var { ref_id, title, notes } = req.body;
      notes = notes ? notes : "Do not delete note";
      const application = await fetchApplicationById(ref_id);
      if (application.rows.length > 0) {
        logger.log("error", `Application with reference No. already exists.`);
        throw new BadRequestError(
          `Application with reference no.  ${ref_id} already exists.`
        );
      }
      await addNewApplication(ref_id, title, notes);
      res.send(`Successfully created Application with Reference No. ${ref_id}`);
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);
//3.Transfer an application with ref_id and reciever
router.post(
  "/transferApplication",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { ref_id, receiver } = req.body;

      const application = await fetchApplicationById(ref_id);
      if (application.rows.length == 0) {
        logger.log(
          "error",
          `Application with reference No. ${ref_id} does not already exist.`
        );
        throw new BadRequestError(
          `Application with reference no. ${ref_id} does not exist.`
        );
      }
      if (req.User.perms.application_tracking != application.rows[0].holder) {
        logger.log(
          "error",
          `User ${req.User.userName} tried to transfer an Unheld Application`
        );
        throw new AccessDeniedError(
          "Insufficient perms to transfer this Application"
        );
      }
      if (
        await checkInValidTransfer(ref_id, req.User.perms.application_tracking)
      ) {
        throw new BadRequestError("Cannot transfer Application in transit");
      }

      const transfer_no = await checkTrail(ref_id);
      await transferApplication(
        ref_id,
        transfer_no,
        application.rows[0].holder,
        receiver
      );
      res.send(`Application ${ref_id} transferred to ${receiver}`);
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);
//4. Get the pending/useen applications for a dept/perm.
router.get(
  "/getPending",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const receiver = req.User.perms.application_tracking;
      const pending = await fetchTrailByStatus(receiver, "unseen");

      res.send(pending.rows);
    } catch (err: any) {
      logger.log("error", err);
      res.status(err.statusCode).send(err);
    }
  }
);

//5. ACCEPT/REJECT AN APPLICATION
router.post(
  "/updateStatus",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { trail_id, status } = req.body;

      // TODO: Check if application_trail is unseen first only then allow to change status
      const trail = await fetchTrailById(trail_id);
      if (trail.rows[0].status !== "unseen") {
        logger.log(
          "error",
          "Failed to Update Application Status.User tried accept/reject an application that was already seen."
        );
        throw new BadRequestError("Unable to Accept/Reject seen Application");
      }

      // TODO: Check if holder of file with the recieved ref_id is the one trying to update its status
      const currentApplication = await fetchApplicationById(
        trail.rows[0].ref_id
      );
      if (currentApplication.rows[0].holder != req.User.application_tracking) {
        throw new AccessDeniedError(
          "Insufficient perms to transfer this Application"
        );
      }
      if (status == "accepted") {
        const application = await updateApplicationTrailStatus(
          trail_id,
          status
        );

        const ref_id = application.rows[0].ref_id;
        const holder = application.rows[0].receiver;
        await updateHolder(ref_id, holder);
      } else if (status == "rejected") {
        await updateApplicationTrailStatus(trail_id, status);
      } else {
        logger.log("error", "Invalid Status. Expected accepted/rejected");
        throw new BadRequestError("Invalid Status. Expected accepted/rejected");
      }
      res.send("Successfully Updated");
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);
// TODO: /UpdateNotes in app table
router.post("/updateApplicationNote", async (req: Request, res: Response) => {
  try {
  } catch (err: any) {
    // Handle error here
  }
});

router.get(
  "/getHoldingFiles",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const application = await getHoldingFiles(req.User.application_tracking);
      return application;
    } catch (err: any) {
      // Handle error here
    }
  }
);
