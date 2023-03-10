const Pool = require("pg").Pool;
// const { getEnv } = require("./constants");
import { getEnv } from "./constants";

const db_config = {
  user: "postgres",
  password: getEnv("DB_PASSWORD"),
  host: "localhost",
  post: 5432,
  database: "digitization",
};
console.log(db_config);

export const pool = new Pool(db_config);

