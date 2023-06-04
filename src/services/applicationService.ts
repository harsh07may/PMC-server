import { pool } from "../utils/db";

export async function fetchApplication() {
  return pool.query("SELECT * FROM application");
}
