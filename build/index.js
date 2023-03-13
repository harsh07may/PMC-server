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
const authRoute_1 = require("./routes/authRoute");
const db_1 = require("./utils/db");
const isAuth_1 = require("./isAuth");
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
app.use("/api/v1/user", authRoute_1.router);
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
//LISTENER
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
