import { pool } from "../utils/db";
import { InternalError } from "../models/errors";
import { logger } from "../utils/logger";

export async function fetchApplication(ref_id: string) {
  try {
    const result = await pool.query(
      "SELECT * FROM application WHERE ref_id iLIKE '%' || $1 || '%'",
      [ref_id]
    );
    return result;
  } catch (error) {
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
  } catch (error) {
    throw new InternalError("Internal Server Error");
  }
}

export async function fetchTrailByStatus(dept: string, status: string) {
  try {
    const result = await pool.query(
      "SELECT * FROM application_trail WHERE reciever iLIKE '%' || $1 || '%' AND status = $2",
      [dept, status]
    );
    return result;
  } catch (error) {
    logger.log("error", error);
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
  } catch (error) {
    throw new InternalError("Internal Server Error");
  }
}

export async function transferApplication(
  ref_id: string,
  transfer_no: number,
  sender: string,
  reciever: string
) {
  try {
    const result = await pool.query(
      "INSERT INTO application_trail(ref_id,transfer_no,transfer_time,sender,reciever) VALUES ($1,$2,(SELECT CURRENT_TIMESTAMP(0)::timestamp),$3,$4) RETURNING *",
      [ref_id, transfer_no, sender, reciever]
    );
    return result;
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    throw new InternalError("Internal Server Error");
  }
}
