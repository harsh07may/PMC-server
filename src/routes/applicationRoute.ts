import { Router, Response, Request } from "express";
export const router = Router();
import {
  addNewApplication,
  checkTrail,
  searchApplications,
  fetchApplicationByRefId,
  fetchTrailByStatus,
  transferApplication,
  updateApplicationTrailStatus,
  updateHolder,
  fetchTrailByRefId,
  getHoldingFiles,
  fetchTrailByTrailId,
  UpdateNote,
  DeleteApplication,
  transferNewApplication,
  OutwardApplication,
  appendNoteByRefId,
  checkIfValidTransfer,
} from "../services/applicationService";

import {
  AccessDeniedError,
  BadRequestError,
  ResourceNotFoundError,
} from "../models/errors";
import { logger } from "../utils/logger";
import { authMiddleware } from "../authMiddleware";

//1. Search Application with ref_id, title, holder, sender, receiver, status
router.get("/searchApplication", async (req: Request, res: Response) => {
  try {
    const { refNo, title, holder, sender, receiver, outwarded, applicantName, outwardNo, inwardNo } = req.query;
    // console.log(req.query);
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const Ref_id = refNo ? String(refNo) : "";
    const Title = title ? String(title) : "";
    const Holder = holder ? String(holder) : "";
    const Sender = sender ? String(sender) : "";
    const Receiver = receiver ? String(receiver) : "";
    const Outwarded = outwarded ? String(outwarded) : "";
    const ApplicantName = applicantName ? String(applicantName) : "";
    const OutwardNo = outwardNo ? String(outwardNo) : "";
    const InwardNo = inwardNo ? String(inwardNo) : "";
    const applications = await searchApplications(
      Ref_id,
      Title,
      Holder,
      Receiver,
      Sender,
      Outwarded,
      ApplicantName,
      OutwardNo,
      InwardNo,
      page
    );
    if (applications.result.rows == 0) {
      throw new ResourceNotFoundError("Applications Not Found");
    }
    const applicationsWithTrails = [];
    for (const application of applications.result.rows) {
      const trail = await fetchTrailByRefId(application.ref_id);
      applicationsWithTrails.push({ ...application, trail: trail.rows });
    }
    res.json({
      data: applicationsWithTrails, total: Number(applications.count.rows[0].total_count)
    });
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
      //check for perms
      if (req.User.perms.application_tracking != "central") {
        logger.log(
          "error",
          `User ${req.User.userName} tried to create an Application while not being a central`
        );
        throw new AccessDeniedError(
          "Insufficient Permissions to create an Application"
        );
      }

      var { ref_id, title, applicant, inward_no } = req.body;

      //check if app already exists
      const application = await fetchApplicationByRefId(ref_id);
      if (application.rows.length > 0) {
        logger.log("error", `Application with reference No. already exists.`);
        throw new BadRequestError(
          `Application with reference no. ${ref_id} already exists.`
        );
      }
      await addNewApplication(ref_id, title, applicant, inward_no);
      const transfer_no = await checkTrail(ref_id);
      await transferNewApplication(ref_id, transfer_no, "none", "central");
      await appendNoteByRefId(
        ref_id,
        String(req.User.perms.application_tracking + ">> ")
      );
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
      //check if app exists
      const application = await fetchApplicationByRefId(ref_id);
      if (application.rows.length == 0) {
        logger.log(
          "error",
          `Application with reference No. ${ref_id} does not already exist.`
        );
        throw new BadRequestError(
          `Application with reference no. ${ref_id} does not exist.`
        );
      }
      //check if app outwarded
      if (application.rows[0].outwarded) {
        logger.log(
          "error",
          `Application with reference No. ${ref_id} already outwarded.`
        );
        throw new BadRequestError(`Cannot transfer outwarded Application.`);
      }
      //check if user is holder
      if (req.User.perms.application_tracking != application.rows[0].holder) {
        logger.log(
          "error",
          `User ${req.User.userName} tried to transfer an Unheld Application`
        );
        throw new AccessDeniedError(
          "Insufficient Permissions to transfer this Application"
        );
      }
      //check if user is receiver
      if (req.User.perms.application_tracking == receiver) {
        logger.log(
          "error",
          `User ${req.User.userName} tried to transfer an Application to themselves`
        );
        throw new AccessDeniedError(
          "Insufficient Permissions to transfer this Application"
        );
      }
      if (
        !(await checkIfValidTransfer(
          ref_id,
          req.User.perms.application_tracking
        ))
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

//5. ACCEPT/REJECT/RECALL AN APPLICATION
router.post(
  "/updateStatus",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { trail_id, status } = req.body;

      //Check if application_trail is unseen only then allow change status
      const trail = await fetchTrailByTrailId(trail_id);
      if (trail.rows[0].status !== "unseen") {
        logger.log(
          "error",
          "Failed to Update Application Status. User tried accept/reject an application that was already seen."
        );
        throw new BadRequestError("Unable to Accept/Reject a seen application");
      }

      //Check if sender/receiver of file is the one trying to update its status
      // check if trail.sender == perms or if trail.receiver == perms
      // req.User.application_tracking
      //trail.rows[0].receiver == req.User.perms.application_tracking

      if (status == "accepted") {
        if (!(trail.rows[0].receiver == req.User.perms.application_tracking)) {
          throw new AccessDeniedError(
            "Insufficient Permissions to transfer this Application"
          );
        }

        const application = await updateApplicationTrailStatus(
          trail_id,
          status
        );

        const ref_id = application.rows[0].ref_id;
        const holder = application.rows[0].receiver;
        await updateHolder(ref_id, holder);
        await appendNoteByRefId(ref_id, String(holder + ">> "));
      } else if (status == "rejected") {
        if (!(trail.rows[0].receiver == req.User.perms.application_tracking)) {
          throw new AccessDeniedError(
            "Insufficient Permissions to transfer this Application"
          );
        }

        const application = await updateApplicationTrailStatus(
          trail_id,
          status
        );
      } else if (status == "recall") {
        if (trail.rows[0].sender != req.User.perms.application_tracking) {
          throw new AccessDeniedError(
            "Insufficient Permissions to transfer this Application"
          );
        }
        await updateApplicationTrailStatus(trail_id, "rejected");
      } else {
        logger.log("error", "Invalid Status. Expected accepted/rejected/recall");
        throw new BadRequestError("Invalid Status. Expected accepted/rejected/recall");
      }
      res.status(200).send("Successfully Updated");
    } catch (err: any) {
      console.log(err);
      res.status(err.statusCode).send(err);
    }
  }
);

router.post(
  "/updateApplicationNote",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { ref_id, notes } = req.body;
      //*check if app exists and if perms.app is holder
      const application = await fetchApplicationByRefId(ref_id);
      if (application.rowCount == 0) {
        throw new BadRequestError("Application not found");
      }
      if (application.rows[0].holder != req.User.perms.application_tracking) {
        throw new AccessDeniedError(
          "Insufficient Permissions to edit the notes"
        );
      }
      //*update note
      await UpdateNote(notes, ref_id);
      res.status(200).send("Successfully Updated the notes");
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);

router.post(
  "/deleteApplication",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      interface Element {
        trail_id: number;
        ref_id: string;
        transfer_no: number;
        sender: string;
        receiver: string;
        status: string;
        transfer_time: string;
      }
      const { ref_id } = req.body;
      //*check if app exists and if perms.app is holder and central
      const application = await fetchApplicationByRefId(ref_id);
      if (application.rowCount == 0) {
        throw new BadRequestError("Application not found");
      }
      if (
        req.User.perms.application_tracking != "central" ||
        application.rows[0].holder != req.User.perms.application_tracking
      ) {
        throw new AccessDeniedError(
          "Insufficient Permissions to delete the application"
        );
      }
      //*check if only one trail exists
      const trail = await fetchTrailByRefId(ref_id);
      console.log(trail.rows);
      if (trail.rows.every((element: Element) => element.status === 'rejected')) {
        throw new AccessDeniedError("Cannot delete this application");
      }
      //*delete app
      await DeleteApplication(ref_id);

      res.status(200).send("Successfully Deleted the application");
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);

router.post(
  "/outwardApplication",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { ref_id, outwardNo } = req.body;
      //* check if outward is NULL or blank
      if (!outwardNo || outwardNo == "") {
        throw new BadRequestError("Invalid outward number");
      }
      //*check if app exists and if perms.app is holder and central
      const application = await fetchApplicationByRefId(ref_id);
      if (application.rowCount == 0) {
        throw new BadRequestError("Application not found");
      }
      if (
        req.User.perms.application_tracking != "central" ||
        application.rows[0].holder != req.User.perms.application_tracking
      ) {
        throw new AccessDeniedError(
          "Insufficient Permissions to outward the application"
        );
      }

      //*outward app
      await OutwardApplication(ref_id, outwardNo);

      res.status(200).send("Successfully outwarded the application");
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);

router.get(
  "/getHoldingFiles",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const application = await getHoldingFiles(
        req.User.perms.application_tracking
      );
      res.send(application.rows);
    } catch (err: any) {
      res.status(err.statusCode).send(err);
    }
  }
);
