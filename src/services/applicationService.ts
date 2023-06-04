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
