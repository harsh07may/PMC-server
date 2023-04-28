import { Request } from "express";
import { pool } from "../utils/db";
import { user } from "../models/user";
import { hash } from "bcryptjs";

export enum ROLES {
  ADMIN = "admin",
  EDITOR = "editor",
}

//SERVICES
export async function fetchUser(username: string) {
  return pool.query("SELECT user_id,username,fullname,designation,roles FROM users WHERE username = $1", [username]);
}

export async function addNewUserToDB({
  username,
  fullname,
  designation,
  password,
  roles,
}: user) {
  const hashedpassword = await hash(password, 10);

  return pool.query(
    "INSERT INTO users (username,fullname,designation,password,roles,timestamp) VALUES($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *",
    [username, fullname, designation, hashedpassword, roles]
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

export async function updateUser({
  username,
  fullname,
  designation,
  password,
  roles,
}: user) {
  const hashedpassword = await hash(password, 10);

  return pool.query(
    "UPDATE users SET fullname = $1,designation=$2,password=$3,roles=$4 WHERE username = $5",
    [fullname, designation, hashedpassword, roles, username]
  );
}
