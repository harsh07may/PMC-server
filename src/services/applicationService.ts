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
  receiver: string,
  sender: string,
  status: string
) {
  try {
    const result = await pool.query(
      "SELECT DISTINCT a.* FROM application a JOIN application_trail t ON a.ref_id = t.ref_id WHERE a.ref_id ILIKE '%' || $1 || '%' AND a.title ILIKE '%' || $2 || '%' AND a.holder ILIKE '%' || $3 || '%' AND t.receiver ILIKE '%' || $4 || '%' AND t.sender ILIKE '%' || $5 || '%' AND t.status::text ILIKE '%' || $6 || '%'",
      [ref_id, title, holder, receiver, sender, status]
    );

    return result;
  } catch (error: any) {
    logger.log("error", error);
    throw new InternalError("Internal Server Error");
  }
}
export async function addNewApplication(ref_id: string, title: string) {
  try {
    const result = await pool.query(
      "INSERT INTO application(ref_id,title) VALUES ($1,$2) RETURNING *",
      [ref_id, title]
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
      "SELECT a.ref_id, a.title, a.created_at, a.outwarded, a.holder AS sender, at.transfer_time FROM application a INNER JOIN application_trail at on at.ref_id=a.ref_id WHERE at.receiver = $1 and at.status = $2;",
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

export async function fetchTrailById(trail_id: number) {
  try {
    const trail = await pool.query(
      "SELECT * FROM application_trail WHERE trail_id =$1",
      [trail_id]
    );
    return trail;
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

export async function getHoldingFiles(sender: string) {
  try {
    const result = await pool.query(
      "SELECT a.*, tt.sender AS sent_by, t.receiver AS sending_to, t.status FROM application a LEFT JOIN (SELECT ax.* FROM application_trail ax JOIN (SELECT ref_id, MAX(transfer_no) AS max_transfer_no FROM application_trail GROUP BY ref_id) ay ON ax.ref_id = ay.ref_id AND ax.transfer_no = ay.max_transfer_no) t ON t.ref_id = a.ref_id AND t.sender = $1 AND t.status IN ('unseen', 'rejected') LEFT JOIN (SELECT x.* FROM application_trail x JOIN (SELECT ref_id, MAX(transfer_no) AS max_transfer_no FROM application_trail WHERE status = 'accepted' GROUP BY ref_id) y ON x.ref_id = y.ref_id AND x.transfer_no = y.max_transfer_no) tt ON tt.ref_id = a.ref_id AND tt.receiver = $1 WHERE holder = $1 AND a.outwarded = 'false'",
      [sender]
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
