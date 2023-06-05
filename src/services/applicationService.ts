import { pool } from "../utils/db";

export async function fetchApplication(ref_id: string) {
  return pool.query("SELECT * FROM application WHERE ref_id = $1", [ref_id]);
}
export async function addNewApplication(ref_id: string, title: string) {
  return pool.query(
    "INSERT INTO application(ref_id,title) VALUES ($1,$2) RETURNING *",
    [ref_id, title]
  );
}

export async function fetchTrailByStatus(dept: string, status: string) {
  return pool.query(
    "SELECT * FROM application_trail WHERE reciever = $1 AND status = $2",
    [dept, status]
  );
}

export async function checkTrail(ref_id: string) {
  var transfer_no = 1;
  const trail = await pool.query(
    "SELECT * FROM application_trail WHERE ref_id = $1 ORDER BY trail_id desc",
    [ref_id]
  );
  if (trail.rows.length > 0) {
    transfer_no = trail.rows[0].transfer_no + 1;
  }
  return transfer_no;
}

export async function transferApplication(
  ref_id: string,
  transfer_no: number,
  sender: string,
  reciever: string
) {
  return pool.query(
    "INSERT INTO application_trail(ref_id,transfer_no,transfer_time,sender,reciever) VALUES ($1,$2,(SELECT CURRENT_TIMESTAMP(0)::timestamp),$3,$4) RETURNING *",
    [ref_id, transfer_no, sender, reciever]
  );
}
