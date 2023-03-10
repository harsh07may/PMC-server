const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "user",
  host: "localhost",
  post: 5432,
  database: "digitization",
});

module.exports = pool;
