"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendRefreshToken = exports.appendAccessToken = exports.createRefreshToken = exports.createAccessToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const constants_1 = require("./utils/constants");
const createAccessToken = (userId) => {
    return (0, jsonwebtoken_1.sign)({ userId }, String((0, constants_1.getEnv)("ACCESS_TOKEN_SECRET")), {
        expiresIn: "15m",
    });
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (userId) => {
    return (0, jsonwebtoken_1.sign)({ userId }, String((0, constants_1.getEnv)("REFRESH_TOKEN_SECRET")), {
        expiresIn: "7d",
    });
};
exports.createRefreshToken = createRefreshToken;
const appendAccessToken = (req, res, accesstoken) => {
    res.send({
        accesstoken,
        username: req.body.username,
    });
};
exports.appendAccessToken = appendAccessToken;
const appendRefreshToken = (res, refreshtoken) => {
    res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/refresh_token",
    });
};
exports.appendRefreshToken = appendRefreshToken;
// module.exports = {
//   createAccessToken,
//   createRefreshToken,
//   sendAccessToken,
//   sendRefreshToken,
// };
