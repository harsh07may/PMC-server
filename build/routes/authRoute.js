"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
exports.router = (0, express_1.Router)();
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const constants_1 = require("../utils/constants");
const tokens_1 = require("../tokens");
const db_1 = require("../utils/db");
const errors_1 = require("../models/errors");
//1.Register an user
exports.router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield db_1.pool.query("SELECT * from users WHERE username = $1", [
            username,
        ]);
        if (user.rows.length > 0) {
            // throw new Error("User already exists");
            const err = new errors_1.ExistingUserError("User already exists");
            return res.status(err.statusCode).send({ error: err });
        }
        const hashedpassword = yield (0, bcryptjs_1.hash)(password, 10);
        const newUser = yield db_1.pool.query("INSERT INTO users (username,password) VALUES($1,$2) RETURNING *", [username, hashedpassword]);
        res.json(newUser.rows[0]);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
//2.Login
exports.router.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield db_1.pool.query("SELECT * from users WHERE username = $1", [
            username,
        ]);
        if (user.rows.length === 0) {
            // throw new Error("Username or Password is incorrect ");
            const err = new errors_1.FailedLoginError("Username or Password is incorrect");
            return res.status(err.statusCode).send({ error: err });
        }
        const valid = yield (0, bcryptjs_1.compare)(password, user.rows[0].password);
        if (!valid) {
            // throw new Error("Username or Password is incorrect ");
            const err = new errors_1.FailedLoginError("Username or Password is incorrect");
            return res.status(err.statusCode).send({ error: err });
        }
        const accessToken = (0, tokens_1.createAccessToken)(user.rows[0].user_id);
        const refreshToken = (0, tokens_1.createRefreshToken)(user.rows[0].user_id);
        const updatedUser = yield db_1.pool.query("UPDATE users SET refresh_token = $1 WHERE username = $2", [refreshToken, username]);
        (0, tokens_1.appendRefreshToken)(res, refreshToken);
        (0, tokens_1.appendAccessToken)(req, res, accessToken);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
// 3.Logout
exports.router.post("/logout", (req, res) => {
    res.clearCookie("refreshtoken", { path: "/refresh_token" });
    return res.send({
        message: "Logged Out",
    });
});
// 5. Generate token with refresh token
exports.router.post("/refresh_token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.refreshtoken;
    if (!token)
        return res.send({ accesstoken: "" });
    let payload = null;
    try {
        payload = (0, jsonwebtoken_1.verify)(token, String((0, constants_1.getEnv)("REFRESH_TOKEN_SECRET")));
    }
    catch (err) {
        return res.send({ accesstoken: "" });
    }
    console.log(payload);
    const user = yield db_1.pool.query("SELECT * from users WHERE user_id = $1", [
        payload.userId,
    ]);
    if (user.rowCount == 0)
        return res.send({ accesstoken: "" });
    if (user.rows[0].refresh_token !== token)
        return res.send({ accesstoken: "" });
    const accesstoken = (0, tokens_1.createAccessToken)(user.user_id);
    const refreshtoken = (0, tokens_1.createRefreshToken)(user.user_id);
    const updatedUser = yield db_1.pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [refreshtoken, payload.userId]);
    (0, tokens_1.appendRefreshToken)(res, refreshtoken);
    return res.send({ accesstoken });
}));
