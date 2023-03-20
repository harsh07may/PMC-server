"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const errors_1 = require("./models/errors");
const constants_1 = require("./utils/constants");
const authMiddleware = (req, res, next) => {
    const authorization = req.header("authorization");
    if (!authorization) {
        // throw new Error("You need to login");
        // return res.status(401).send("You need to login");
        const err = new errors_1.AuthenticationError("You are not logged in");
        return res.status(err.statusCode).send({ error: err });
    }
    const token = authorization.replace("Bearer ", "");
    // console.log("token -->>" + token);
    const userData = (0, jsonwebtoken_1.verify)(token, String((0, constants_1.getEnv)("ACCESS_TOKEN_SECRET")));
    req.User = userData;
    next();
};
exports.authMiddleware = authMiddleware;
