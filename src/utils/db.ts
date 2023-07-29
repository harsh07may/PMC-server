import { FieldDef, Pool, PoolConfig, QueryResult } from "pg";
import { getEnv } from "./constants";
import z from "zod";

const db_config: PoolConfig = {
  user: String(getEnv("DB_USER")),
  password: String(getEnv("DB_PASSWORD")),
  host: String(getEnv("DB_HOST")),
  port: Number(getEnv("DB_PORT")),
  database: String(getEnv("DB_NAME")),
};

export const enum TABLE {
  LEAVE_APPLICATIONS = "leave_applications",
}

// ? this stuff was used for old_leaveManagement route (see old_leaveManagement.ts)
export function buildZodObjFromPgResult<T extends z.ZodRawShape>(
  zodObj: z.ZodObject<T>,
  result: QueryResult<any>
): Array<z.infer<typeof zodObj>> {
  const helper = (valueObj: Record<string, any>) => {
    const leaveApplication = zodObj.safeParse(valueObj);

    if (leaveApplication.success) {
      return leaveApplication.data;
    } else {
      console.log(
        "Cannot deserialize object due to ",
        leaveApplication.error.message
      );
      return null;
    }
  };

  return result.rows
    .map((row: Record<string, any>) => helper(row))
    .filter((o) => o !== null) as Array<z.infer<typeof zodObj>>;
}

// TODO: Fix `undefined` errors across codebase, because pg might not return any data
export const pool = new Pool(db_config) as any;
