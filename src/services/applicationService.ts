import { pool } from "../utils/db";
import { InternalError, ResourceNotFoundError } from "../models/errors";
import { logger } from "../utils/logger";

export async function fetchApplicationByRefId(ref_id: string) {
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
  outwarded: string,
  applicantName: string,
  outwardNo: string,
  inwardNo: string,
  page: number
) {
  try {
    const limit = 10;
    const offset = (page - 1) * limit;
    console.log({ ref_id, title, holder, receiver, sender, outwarded, applicantName, outwardNo, inwardNo, page, offset });

    const count = await pool.query(
      "SELECT COUNT(*) AS total_count FROM (SELECT DISTINCT a.* FROM application a JOIN application_trail t ON a.ref_id = t.ref_id WHERE a.ref_id ILIKE '%' || $1 || '%' AND a.title ILIKE '%' || $2 || '%' AND a.holder ILIKE '%' || $3 || '%' AND t.receiver ILIKE '%' || $4 || '%' AND t.sender ILIKE '%' || $5 || '%' AND a.outwarded::text ILIKE '%' || $6 || '%' AND COALESCE(a.applicant_name, '') ILIKE '%' || $7 || '%' AND COALESCE(a.inward_no, '') ILIKE '%' || $8 || '%' AND  COALESCE(a.outward_no, '') ILIKE '%' || $9 || '%') AS subquery",
      [ref_id, title, holder, receiver, sender, outwarded, applicantName, inwardNo, outwardNo]
    );
    // if (offset > count.rows[0].total_count) {
    //   throw new ResourceNotFoundError("Applications Not Found");
    // }

    const result = await pool.query(
      "SELECT DISTINCT a.* FROM application a JOIN application_trail t ON a.ref_id = t.ref_id WHERE a.ref_id ILIKE '%' || $1 || '%' AND a.title ILIKE '%' || $2 || '%' AND a.holder ILIKE '%' || $3 || '%' AND t.receiver ILIKE '%' || $4 || '%' AND t.sender ILIKE '%' || $5 || '%' AND a.outwarded::text ILIKE '%' || $6 || '%' AND COALESCE(a.applicant_name, '') ILIKE '%' || $7 || '%' AND COALESCE(a.outward_no, '') ILIKE '%' || $8 || '%' AND  COALESCE(a.inward_no, '') ILIKE '%' || $9 || '%' ORDER BY ref_id DESC LIMIT $10 OFFSET $11",
      [ref_id, title, holder, receiver, sender, outwarded, applicantName, outwardNo, inwardNo, limit, offset]
    );

    return { result, count };
  } catch (error: any) {
    logger.log("error", error);
    throw new InternalError("Internal Server Error");
  }
}

export async function addNewApplication(ref_id: string, title: string, applicant: string, inward_no: string) {
  try {
    const result = await pool.query(
      "INSERT INTO application(ref_id,title, created_at, applicant_name, inward_no) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [ref_id, title, (new Date()).toISOString(), applicant, inward_no]
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
      "SELECT a.ref_id, a.title, a.created_at, a.outwarded, a.notes, a.holder AS sender, at.transfer_time, at.trail_id FROM application a INNER JOIN application_trail at on at.ref_id=a.ref_id WHERE at.receiver = $1 and at.status = $2;",
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

export async function fetchApplicationTrail(ref_id: string) {
  try {
    // TODO: Send trail_id,title, ref_id, sender,time
    const result = await pool.query(
      "SELECT SELECT * FROM application_trail WHERE ref_id = $2",
      [ref_id]
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
      "INSERT INTO application_trail(ref_id,transfer_no,sender,receiver,transfer_time) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [ref_id, transfer_no, sender, receiver, (new Date()).toISOString()]
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

export async function transferNewApplication(
  ref_id: string,
  transfer_no: number,
  sender: string,
  receiver: string
) {
  try {
    const result = await pool.query(
      "INSERT INTO application_trail(ref_id,transfer_no,transfer_time,sender,receiver,status) VALUES ($1,$2,$3,$4,$5,'accepted') RETURNING *",
      [ref_id, transfer_no, (new Date()).toISOString(), sender, receiver]
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
export async function checkIfValidTransfer(ref_id: string, sender: string) {
  try {
    const trail = await pool.query(
      "SELECT * FROM application_trail WHERE ref_id = $1 ORDER BY trail_id desc",
      [ref_id]
    );
    if (trail.rowCount == 0) {
      return false;
    }
    const { status } = trail.rows[0];
    if (status === "unseen") {
      return false;
    }
    return true;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function fetchTrailByRefId(ref_id: string) {
  try {
    const trail = await pool.query(
      "SELECT * FROM application_trail WHERE ref_id =$1",
      [ref_id]
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

export async function fetchTrailByTrailId(trail_id: string) {
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

export async function UpdateNote(notes: string, ref_id: string) {
  try {
    const result = await pool.query(
      "UPDATE application SET notes = $1 WHERE ref_id = $2 RETURNING *",
      [notes, ref_id]
    );
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function DeleteApplication(ref_id: string) {
  try {
    await pool.query(
      "DELETE FROM application WHERE application.ref_id = $1",
      [ref_id]
    );
    console.log(ref_id);
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function OutwardApplication(ref_id: string, outwardNo: string) {
  try {
    await pool.query(
      "UPDATE application SET outwarded = true, outward_no = $1 WHERE ref_id = $2",
      [outwardNo, ref_id]
    );
    console.log(ref_id);
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

export async function appendNoteByRefId(ref_id: string, note: string) {
  try {
    await pool.query(
      "UPDATE application SET notes = notes || E'\n' || $1 WHERE ref_id = $2",
      [note, ref_id]
    );
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
      "SELECT a.*, tt.sender AS sent_by, tt.transfer_time AS sent_at, t.receiver AS sending_to, t.status, t.trail_id FROM application a LEFT JOIN (SELECT ax.* FROM application_trail ax JOIN (SELECT ref_id, MAX(transfer_no) AS max_transfer_no FROM application_trail GROUP BY ref_id) ay ON ax.ref_id = ay.ref_id AND ax.transfer_no = ay.max_transfer_no) t ON t.ref_id = a.ref_id AND t.sender = $1 AND t.status IN ('unseen', 'rejected') LEFT JOIN (SELECT x.* FROM application_trail x JOIN (SELECT ref_id, MAX(transfer_no) AS max_transfer_no FROM application_trail WHERE status = 'accepted' GROUP BY ref_id) y ON x.ref_id = y.ref_id AND x.transfer_no = y.max_transfer_no) tt ON tt.ref_id = a.ref_id AND tt.receiver = $1 WHERE holder = $1 AND a.outwarded = 'false'",
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
