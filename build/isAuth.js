"use strict";
const { verify } = require("jsonwebtoken");
const { AuthenticationError } = require("./models/errors");
const isAuth = (req) => {
    // const authorization = req.header("authorization");
    const authorization = req.header("authorization");
    if (!authorization) {
        // throw new Error("You need to login");
        const err = new AuthenticationError("You are not logged in");
        return res.status(err.statusCode).send({ error: err });
    }
    const token = authorization.split(" ")[1];
    const { userId } = verify(token, process.env.ACCESS_TOKEN_SECRET);
    return userId;
};
const authMiddleware = (req, res, next) => {
    const authorization = req.header("authorization");
    if (!authorization) {
        // throw new Error("You need to login");
        // return res.status(401).send("You need to login");
        const err = new AuthenticationError("You are not logged in");
        return res.status(err.statusCode).send({ error: err });
    }
    const token = authorization.replace("Bearer ", "");
    // console.log("token -->>" + token);
    const userData = verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.User = userData;
    next();
};
module.exports = {
    isAuth,
    authMiddleware,
};
