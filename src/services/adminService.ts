import { Request } from "express";
import { pool } from "../utils/db";
import { User } from "../types/user";
import { Perms } from "../types/user";
import { hash } from "bcryptjs";
import { InternalError } from "../models/errors";
import { logger } from "../utils/logger";

export enum ROLES {
  ADMIN = "admin",
  EDITOR = "editor",
}

//SERVICES
export async function fetchUser(username: string) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}
export async function getUser(username: string) {
  try {
    const result = await pool.query(
      "SELECT user_id,username,fullname FROM users WHERE username = $1",
      [username]
    );
    const perms = await pool.query(
      "SELECT * FROM permissions WHERE user_id = $1",
      [result.rows[0].user_id]
    );
    if (result.rows.length > 0) {
      result.rows[0] = {
        ...result.rows[0],
        perms: {
          admin: perms.rows[0].admin,
          municipality_property_records:
            perms.rows[0].municipality_property_records,
          birth_records: perms.rows[0].birth_records,
          death_records: perms.rows[0].death_records,
          construction_license_records:
            perms.rows[0].construction_license_records,
          house_tax_records: perms.rows[0].house_tax_records,
          trade_license_records: perms.rows[0].trade_license_records,
          application_tracking: perms.rows[0].application_tracking,
          leave_management: perms.rows[0].leave_management,
        },
      };
    }
    return result;
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}

export async function addNewUserToDB({
  username,
  fullname,
  password,
  perms,
}: User) {
  try {
    const hashedpassword = await hash(password, 10);
    const {
      admin,
      municipality_property_records,
      birth_records,
      death_records,
      construction_license_records,
      house_tax_records,
      trade_license_records,
      application_tracking,
      leave_management,
    } = perms;
    const user = await pool.query(
      "INSERT INTO users (username,fullname,password,timestamp) VALUES($1,$2,$3,$4) RETURNING *",
      [username, fullname, hashedpassword, (new Date()).toISOString()]
    );
    const { user_id } = user.rows[0];
    const result = await pool.query(
      "INSERT INTO permissions (user_id,admin,municipality_property_records,birth_records,death_records,construction_license_records,house_tax_records,trade_license_records,application_tracking, leave_management) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [
        user_id,
        admin,
        municipality_property_records,
        birth_records,
        death_records,
        construction_license_records,
        house_tax_records,
        trade_license_records,
        application_tracking,
        leave_management
      ]
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

export async function addAuditLog(
  action: string,
  description: string,
  username: string
) {
  try {
    const result = await pool.query(
      "INSERT INTO admin_auditlogs (action, description, performedby, timestamp) VALUES ($1,$2,$3,$4) RETURNING *",
      [action, description, username, (new Date()).toISOString()]
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

export function checkPerms(
  perms: Perms,
  resource: keyof Perms,
  accessLevel: string
): boolean {
  if (perms[resource] == accessLevel) {
    return true;
    // } else if (perms[resource] == "viewer" && accessLevel == "editor") {
    //   return false;
  } else if (perms[resource] == "editor" && accessLevel == "viewer") {
    return true;
  } else {
    return false;
  }
}

export async function updateUser({
  username,
  fullname,
  password,
  perms,
}: User) {
  try {
    const hashedpassword = await hash(password, 10);

    const user = await pool.query(
      "UPDATE users SET fullname = $1,password=$2 WHERE username = $3 RETURNING *",
      [fullname, hashedpassword, username]
    );

    const {
      admin,
      municipality_property_records,
      birth_records,
      death_records,
      construction_license_records,
      house_tax_records,
      trade_license_records,
      application_tracking,
      leave_management
    } = perms;

    const { user_id } = user.rows[0];
    return pool.query(
      "UPDATE permissions SET admin = $2, municipality_property_records = $3, birth_records = $4, death_records = $5, construction_license_records = $6, house_tax_records = $7, trade_license_records = $8, application_tracking=$9, leave_management=$10 WHERE user_id = $1 RETURNING *",
      [
        user_id,
        admin,
        municipality_property_records,
        birth_records,
        death_records,
        construction_license_records,
        house_tax_records,
        trade_license_records,
        application_tracking,
        leave_management
      ]
    );
  } catch (error: any) {
    logger.log(
      "error",
      `Failed Query. Error message: ${error.message}. Error Code ${error.code}`
    );
    throw new InternalError("Internal Server Error");
  }
}
