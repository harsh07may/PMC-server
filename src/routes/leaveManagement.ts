// Applicant needs to fill form to apply for leave
// Form consists of 2 parts:
// 1. Declaration from the applicant
// 2. Declaration from doctor

// The applicants direct supervisor needs to approve the leave
// The Head of Department also needs to approve the leave

// Leaves cannot be auto-approved
// Leaves may be auto-rejected based on some rules

import { z } from "zod";
import { Router } from "express";
import { ResourceNotFoundError, ValidationError } from "../models/errors";
import { FieldDef, Pool, QueryResult } from "pg";
import { TABLE, buildZodObjFromPgResult, pool } from "../utils/db";
import { unescape } from "querystring";
import { MillisecondsIn } from "../utils/constants";
import { authMiddleware } from "../authMiddleware";
import { create } from "domain";

const LeaveApplicationStatus = z.enum([
  "pending",
  "rejected",
  "manager-approved",
  "hod-approved",
]);

const LeaveApplicationType = z.enum(["medical", "causal"]);

const LeaveApplication = z.object({
  id: z.number().int().gte(1),
  ctime: z.date().default(() => new Date()), // creation time
  user_id: z.number().int().gte(1),
  manager_id: z.number().int().gte(1),
  hod_id: z.number().int().gte(1),
  status: LeaveApplicationStatus.default("pending"),
  type: LeaveApplicationType,
  manager_modified_at: z.date().optional(),
  hod_modified_at: z.date().optional(),
  start_date: z.date(),
  end_date: z.date(),
});

type ILeaveApplication = z.infer<typeof LeaveApplication>;

type LeaveValidationFunction = (
  leaveApplication: ILeaveApplication
) => ValidationError | null;

// RPC endpoints
// 1. POST api to create leave
//    - run validations to auto-reject leave
// 2. GET api for managers to view leave of their sub-ordinates
// 3. PUT api for managers to approve leave of their sub-ordinates
// 4. GET api for hod to view leave of their sub-ordinates
// 5. PUT api for hod to approve leave of their sub-ordinates
// 6. GET api to view a leave application

class LeaveManagementService {
  db: Pool;
  validations: Array<LeaveValidationFunction> = [
    this.maxLeaveDurationTest,
    this.managerMoodTest,
  ];

  constructor(db: Pool) {
    // Making the DB set on construction lets you selectively pass
    // a dummy db when developing or testing
    this.db = db;
  }

  /***
   * LEAVE LIFECYCLE HELPERS
   ***/
  async createLeaveApplication(
    application: ILeaveApplication
  ): Promise<ILeaveApplication> {
    console.log(
      "Creating leave application for user",
      application.user_id,
      "from",
      application.start_date,
      "to",
      application.end_date
    );

    // Run validations to auto-reject
    for (const validationRule of this.validations) {
      const error = validationRule(application);
      if (error) {
        console.error(`Leave auto-rejected due to ${error}`);
        throw error;
      }
    }

    // Insert into database
    const newApp = await this.db.query(
      `
        INSERT INTO ${TABLE.LEAVE_APPLICATIONS}
        (user_id, manager_id, hod_id, status, type, ctime, start_date, end_date)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `,
      [
        application.user_id,
        application.manager_id,
        application.hod_id,
        application.status,
        application.type,
        application.ctime,
        application.start_date,
        application.end_date,
      ]
    );

    const insertedApplication = LeaveApplication.parse(newApp.rows[0]);

    console.log(
      "Created leave application for user",
      application.user_id,
      "with id",
      insertedApplication.id
    );

    return insertedApplication;
  }

  async fetchLeaveApplication(
    user_id: number,
    application_id: ILeaveApplication["id"]
  ): Promise<ILeaveApplication | null> {
    console.log(
      "User",
      user_id,
      "is searching for leave application",
      application_id
    );

    const result = await this.db.query(
      `
        SELECT * FROM ${TABLE.LEAVE_APPLICATIONS}
        WHERE id = $1 AND (user_id = $2 OR manager_id = $2 OR hod_id = $2)
        LIMIT 1
    `,
      [application_id, user_id]
    );

    console.log(
      result.rowCount,
      "leave applications found for user_id",
      user_id,
      "and app_id",
      application_id
    );

    const applications = buildZodObjFromPgResult(LeaveApplication, result);
    return applications[0] ?? null;
  }

  async fetchLeaveApplications(
    user_id: number,
    limit: number
  ): Promise<Array<ILeaveApplication>> {
    console.log("User", user_id, "is searching for leave applications");

    const result = await this.db.query(
      `
        SELECT * FROM ${TABLE.LEAVE_APPLICATIONS}
        WHERE (user_id = $2 OR manager_id = $2 OR hod_id = $2)
        LIMIT $1
    `,
      [limit, user_id]
    );

    console.log(
      result.rowCount,
      "leave applications found for user_id",
      user_id
    );

    const applications = buildZodObjFromPgResult(LeaveApplication, result);
    return applications;
  }

  async approveLeaveApplication(user_id: number, application_id: number) {
    console.log(
      "User",
      user_id,
      "is trying to approve leave application",
      application_id
    );

    const application = await this.fetchLeaveApplication(
      user_id,
      application_id
    );

    if (!application) {
      throw new ResourceNotFoundError(
        `Application ${application_id} is not available`
      );
    }

    if (["rejected", "hod-approved"].includes(application.status)) {
      // Nothing more to be done
      return;
    }

    // Update manager approved time
    if (
      application.manager_id == user_id &&
      application.status !== "manager-approved"
    ) {
      this.db.query(
        `
            UPDATE ${TABLE.LEAVE_APPLICATIONS}
            SET manager_modified_at = NOW(), status = $2
            WHERE id = $1
            `,
        [application_id, LeaveApplicationStatus.Enum["manager-approved"]]
      );
    }

    // Update hod approved time
    if (
      application.hod_id == user_id &&
      application.status !== "hod-approved"
    ) {
      this.db.query(
        `
            UPDATE ${TABLE.LEAVE_APPLICATIONS}
            SET hod_modified_at = NOW(), status = $2
            WHERE id = $1
            `,
        [application_id, LeaveApplicationStatus.Enum["hod-approved"]]
      );
    }
  }

  async updateLeaveApplication(
    user_id: number,
    application_id: number,
    new_application: ILeaveApplication
  ): Promise<ILeaveApplication> {
    return LeaveApplication.parse({});
  }

  /***
   * LEAVE VALIDATION HELPERS
   ***/
  private managerMoodTest(leaveApplication: ILeaveApplication) {
    return Math.random() > 0.1
      ? null
      : new ValidationError("Manager is in a bad mood");
  }

  private maxLeaveDurationTest(la: ILeaveApplication) {
    const MAX_DAYS = 7;
    const isLeaveTooLong =
      la.end_date.valueOf() - la.start_date.valueOf() >
      MAX_DAYS * MillisecondsIn.DAY;

    return isLeaveTooLong
      ? new ValidationError(`Leave cannot be longer than ${MAX_DAYS} days`)
      : null;
  }

  /***
   * UTILS
   ***/
}

const router = Router();
const service = new LeaveManagementService(pool as Pool);

// Test
void (async () => {
  const application: ILeaveApplication = {
    id: undefined as unknown as number,
    user_id: 1,
    manager_id: 1,
    hod_id: 1,
    status: LeaveApplicationStatus.Enum["manager-approved"],
    type: "causal",
    ctime: new Date(),
    start_date: new Date(),
    end_date: new Date(),
  };

  const createdLeave = await service.createLeaveApplication(application);
  const retrievedLeave = await service.fetchLeaveApplication(
    1,
    createdLeave.id
  );

  console.log({ application, createdLeave, retrievedLeave });
})();

router.get("/:leaveAppId", authMiddleware, async (req, res) => {
  const userId = req.User.userId;
  const { leaveAppId } = req.params;

  const fetchedLeave = await service.fetchLeaveApplication(
    userId,
    Number(leaveAppId)
  );

  return res.status(200).send(fetchedLeave);
});

router.post("/", authMiddleware, async (req, res) => {
  const userId = req.User.userId;
  const leaveRequest = LeaveApplication.safeParse(req.body);

  if (!leaveRequest.success) {
    return res.status(400).send(leaveRequest.error);
  }

  leaveRequest.data.user_id = userId;
  const createdLeave = await service.createLeaveApplication(leaveRequest.data);

  return res.status(201).send(createdLeave);
});
