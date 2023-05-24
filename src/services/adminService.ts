import { Request } from "express";
import { pool } from "../utils/db";
import { User } from "../types/user";
import { Perms } from "../types/user";
import { hash } from "bcryptjs";

export enum ROLES {
  ADMIN = "admin",
  EDITOR = "editor",
}

//SERVICES
export async function fetchUser(username: string) {
  return pool.query(
    "SELECT user_id,username,fullname,password FROM users WHERE username = $1",
    [username]
  );
}

export async function addNewUserToDB({
  username,
  fullname,
  password,
  perms,
}: User) {
  const hashedpassword = await hash(password, 10);
  const {
    admin,
    municipality_property_records,
    birth_records,
    death_records,
    construction_license_records,
    house_tax_records,
    trade_license_records,
  } = perms;
  const user = await pool.query(
    "INSERT INTO users (username,fullname,password,timestamp) VALUES($1,$2,$3,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
    [username, fullname, hashedpassword]
  );
  const { user_id } = user.rows[0];
  return pool.query(
    "INSERT INTO permissions (user_id,admin,municipality_property_records,birth_records,death_records,construction_license_records,house_tax_records,trade_license_records) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
    [
      user_id,
      admin,
      municipality_property_records,
      birth_records,
      death_records,
      construction_license_records,
      house_tax_records,
      trade_license_records,
    ]
  );
}

export async function addAuditLog(
  action: string,
  description: string,
  username: string
) {
  return pool.query(
    "INSERT INTO admin_auditlogs(timestamp,Action,description,performedBy) VALUES ((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp),$1,$2,$3) RETURNING *",
    [action, description, username]
  );
}

export function checkPermissions(req: Request, roles: ROLES[]): boolean {
  const { userRoles } = req.User;
  return roles.includes(userRoles);
}
export function checkPerms(
  perms: Perms,
  resource: keyof Perms,
  accessLevel: string
): boolean {
  if (perms["admin"] === true || perms[resource] == accessLevel) {
    return true;
  } else if (perms[resource] == "viewer" && accessLevel == "editor") {
    return false;
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
  const hashedpassword = await hash(password, 10);

  return pool.query(
    "UPDATE users SET fullname = $1,designation=$2,password=$3 WHERE username = $5",
    [fullname, hashedpassword, username]
  );
}
