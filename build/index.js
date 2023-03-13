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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const jsonwebtoken_1 = require("jsonwebtoken");
const bcryptjs_1 = require("bcryptjs");
const constants_1 = require("./utils/constants");
const tokens_1 = require("./tokens");
// dotenv.config();
const db_1 = require("./utils/db");
const isAuth_1 = require("./isAuth");
const errors_1 = require("./models/errors");
const app = (0, express_1.default)();
//MIDDLEWARE
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json()); //support JSON bodies
app.use(express_1.default.urlencoded({ extended: true })); //support url encoded bodies
//ROUTES
app.get("/getall", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allContent = yield db_1.pool.query("SELECT * from users");
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
app.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
app.post("/logout", (req, res) => {
    res.clearCookie("refreshtoken", { path: "/refresh_token" });
    return res.send({
        message: "Logged Out",
    });
});
// 4. Protected Routes
app.post("/add", isAuth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // const userId = isAuth(req);
        // console.log("user data ->>", JSON.stringify(req.User, null, 2));
        const userId = (_a = req.User) === null || _a === void 0 ? void 0 : _a.userId;
        if (userId !== null) {
            const { content_desc } = req.body;
            const newContent = yield db_1.pool.query("INSERT INTO content (content_desc) VALUES($1) RETURNING *", [content_desc]);
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
//LISTENER
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
