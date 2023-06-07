import { pool } from "../utils/db";
import { InternalError } from "../models/errors";
import { logger } from "../utils/logger";

export async function fetchApplicationById(ref_id: string) {
  try {
    const result = await pool.query(
      "SELECT * FROM application WHERE ref_id = $1",
      [ref_id]
    );
    return result;
  } catch (error: any) {
    throw new InternalError("Internal Server Error");
  }
}

export async function searchApplications(
  ref_id: string,
  title: string,
  holder: string,
  sender: string,
  receiver: string,
  status: string
) {
  try {
    //!major flaw: cannot show applications that have not been transferred yet since ref_id is used for JOIN
    //! FIX: Split search for untranferred applications and transferred applications
    // TODO Split up Application, application_trail
    const result = await pool.query(
      "SELECT * FROM application a,application_trail at WHERE a.ref_id = at.ref_id AND a.ref_id iLIKE '%' || $1 || '%' AND a.title iLIKE '%' || $2 || '%' AND a.holder iLIKE '%' || $3 || '%'",
      [ref_id, title, holder]
    );

    return result;
  } catch (error: any) {
    logger.log("error", error);
    throw new InternalError("Internal Server Error");
  }
}
export async function addNewApplication(
  ref_id: string,
  title: string,
  notes: string
) {
  try {
    const result = await pool.query(
      "INSERT INTO application(ref_id,title,notes) VALUES ($1,$2,$3) RETURNING *",
      [ref_id, title, notes]
    );
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function fetchTrailByStatus(receiver: string, status: string) {
  try {
    // TODO: Send trail_id,title, ref_id, sender,time
    const result = await pool.query(
      "SELECT at.trail_id,at.ref_id,at.transfer_time,at.sender,a.title FROM application_trail at,application a WHERE at.ref_id=a.ref_id AND at.receiver iLIKE '%' || $1 || '%' AND at.status = $2",
      [receiver, status]
    );
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function checkTrail(ref_id: string) {
  try {
    var transfer_no = 1;
    const trail = await pool.query(
      "SELECT * FROM application_trail WHERE ref_id = $1 ORDER BY trail_id desc",
      [ref_id]
    );
    if (trail.rows.length > 0) {
      transfer_no = trail.rows[0].transfer_no + 1;
    }
    return transfer_no;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function transferApplication(
  ref_id: string,
  transfer_no: number,
  sender: string,
  receiver: string
) {
  try {
    const result = await pool.query(
      "INSERT INTO application_trail(ref_id,transfer_no,transfer_time,sender,receiver) VALUES ($1,$2,(SELECT CURRENT_TIMESTAMP(0)::timestamp),$3,$4) RETURNING *",
      [ref_id, transfer_no, sender, receiver]
    );
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}
export async function checkInValidTransfer(ref_id: string, sender: string) {
  try {
    const trail = await pool.query(
      "SELECT * FROM application_trail WHERE ref_id = $1 AND sender=$2 ORDER BY trail_id desc",
      [ref_id, sender]
    );
    if (trail.rowCount == 0) {
      return false;
    }
    const { status } = trail.rows[0];
    if (status === "unseen") {
      return true;
    }
    return false;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function updateApplicationTrailStatus(
  trail_id: number,
  status: string
) {
  try {
    const result = await pool.query(
      "UPDATE application_trail SET status = $1 WHERE trail_id = $2 RETURNING *",
      [status, trail_id]
    );
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}
export async function updateHolder(ref_id: string, holder: string) {
  try {
    const result = await pool.query(
      "UPDATE application SET holder = $1 WHERE ref_id = $2 RETURNING *",
      [holder, ref_id]
    );
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}
