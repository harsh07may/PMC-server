import { pool } from "../utils/db";
import { InternalError } from "../models/errors";
import { logger } from "../utils/logger";

export async function addLeave(name: string, designation: string, department: string, leave_type: string, start_date: Date, end_date: Date) {
    try {
        const result = await pool.query(
            "INSERT INTO leave(applicant_name, created_at, designation, department, leave_type, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, (new Date()).toISOString(), designation, department, leave_type, start_date, end_date]
        );
        return result;
    } catch (error: any) {
        console.log(error);
        throw new InternalError("Internal Server Error");
    }
}

export async function getAllLeaves() {
    try {
        const result = await pool.query(
            "SELECT * FROM leave",
            []
        );
        return result.rows;
    } catch (error: any) {
        throw new InternalError("Internal Server Error");
    }
}

export async function getLeavesInDateRange(start_date: Date, end_date: Date) {
    try {
        const result = await pool.query(
            `SELECT * FROM leave
            WHERE (start_date >= $1 AND end_date <= $2)
            OR (start_date <= $1 AND end_date >= $1)
            OR (start_date <= $2 AND end_date >= $2)
            OR (start_date <= $1 AND end_date >= $2)
            `,
            [start_date, end_date]
        );
        return result;
    } catch (error: any) {
        throw new InternalError("Internal Server Error");
    }
}
