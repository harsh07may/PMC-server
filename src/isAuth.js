const { verify } = require("jsonwebtoken");

const isAuth = (req) => {
  // const authorization = req.header["authorization"];
  const authorization = req.headers["authorization"];

  // console.log(req.rawHeaders);
  console.log("header==>>", req.headers);
  console.log(authorization);
  if (!authorization) throw new Error("You need to login");

  const token = authorization.split(" ")[1];
  const { userId } = verify(token, process.env.ACCESS_TOKEN_SECRET);
  return userId;
};

module.exports = {
  isAuth,
};
