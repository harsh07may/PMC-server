"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const Pool = require("pg").Pool;
// const { getEnv } = require("./constants");
const constants_1 = require("./constants");
const db_config = {
    user: "postgres",
    password: (0, constants_1.getEnv)("DB_PASSWORD"),
    host: "localhost",
    post: 5432,
    database: "digitization",
};
console.log(db_config);
exports.pool = new Pool(db_config);
