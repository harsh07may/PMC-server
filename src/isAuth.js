const { verify } = require("jsonwebtoken");

const isAuth = (req) => {
  const authorization = req.header("authorization");
  if (!authorization) throw new Error("You need to login");

  const token = authorization.split(" ")[1];
  const { userId } = verify(token, process.env.ACCESS_TOKEN_SECRET);
  return userId;
};

const authMiddleware = (req, res, next) => {
  const authorization = req.header("authorization");
  // console.log(req.headers);
  if (!authorization) {
    // throw new Error("You need to login");
    return res.status(401).send("You are not logged in!");
  }

  const token = authorization.replace("Bearer ", "").replace("bearer ", "");
  const userData = verify(token, process.env.ACCESS_TOKEN_SECRET);

  req.User = userData;

  next();
};

module.exports = {
  isAuth,
  authMiddleware,
};
