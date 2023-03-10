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
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs");
const { createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken, } = require("./tokens");
// dotenv.config();
const pool = require("./utils/db");
const { isAuth, authMiddleware } = require("./isAuth");
const { FailedLoginError, ExistingUserError } = require("./models/errors");
const app = express();
//MIDDLEWARE
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json()); //support JSON bodies
app.use(express.urlencoded({ extended: true })); //support url encoded bodies
//ROUTES
app.get("/getall", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allContent = yield pool.query("SELECT * from users");
        res.json(allContent.rows);
    }
    catch (err) {
        console.log(err.message);
    }
}));
//1.Register an user
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield pool.query("SELECT * from users WHERE username = $1", [
            username,
        ]);
        if (user.rows.length > 0) {
            // throw new Error("User already exists");
            const err = new ExistingUserError("User already exists");
            return res.status(err.statusCode).send({ error: err });
        }
        const hashedpassword = yield hash(password, 10);
        const newUser = yield pool.query("INSERT INTO users (username,password) VALUES($1,$2) RETURNING *", [username, hashedpassword]);
        res.json(newUser.rows[0]);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
//2.Login
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield pool.query("SELECT * from users WHERE username = $1", [
            username,
        ]);
        if (user.rows.length === 0) {
            // throw new Error("Username or Password is incorrect ");
            const err = new FailedLoginError("Username or Password is incorrect");
            return res.status(err.statusCode).send({ error: err });
        }
        const valid = yield compare(password, user.rows[0].password);
        if (!valid) {
            // throw new Error("Username or Password is incorrect ");
            const err = new FailedLoginError("Username or Password is incorrect");
            return res.status(err.statusCode).send({ error: err });
        }
        const accessToken = createAccessToken(user.rows[0].user_id);
        const refreshToken = createRefreshToken(user.rows[0].user_id);
        const updatedUser = yield pool.query("UPDATE users SET refresh_token = $1 WHERE username = $2", [refreshToken, username]);
        sendRefreshToken(res, refreshToken);
        sendAccessToken(res, req, accessToken);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
// 3.Logout
app.post("/logout", (req, res) => {
    res.clearCookie("refreshtoken", { path: "/refresh_token" });
    return res.send({
        message: "Logged Out",
    });
});
// 4. Protected Routes
app.post("/add", authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const userId = isAuth(req);
        // console.log("user data ->>", JSON.stringify(req.User, null, 2));
        const userId = req.User.userId;
        if (userId !== null) {
            const { content_desc } = req.body;
            const newContent = yield pool.query("INSERT INTO content (content_desc) VALUES($1) RETURNING *", [content_desc]);
            res.json(newContent.rows[0]);
        }
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
// 5. Generate token with refresh token
app.post("/refresh_token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.cookies.refreshtoken;
    if (!token)
        return res.send({ accesstoken: "" });
    let payload = null;
    try {
        payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
    }
    catch (err) {
        return res.send({ accesstoken: "" });
    }
    console.log(payload);
    const user = yield pool.query("SELECT * from users WHERE user_id = $1", [
        payload.userId,
    ]);
    if (user.rowCount == 0)
        return res.send({ accesstoken: "" });
    if (user.rows[0].refresh_token !== token)
        return res.send({ accesstoken: "" });
    const accesstoken = createAccessToken(user.user_id);
    const refreshtoken = createRefreshToken(user.user_id);
    const updatedUser = yield pool.query("UPDATE users SET refresh_token = $1 WHERE user_id = $2", [refreshtoken, payload.userId]);
    sendRefreshToken(res, refreshtoken);
    return res.send({ accesstoken });
}));
//LISTENER
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
