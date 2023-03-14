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
const db_1 = require("./utils/db");
const authRoute_1 = require("./routes/authRoute");
const authRoute_2 = require("./routes/authRoute");
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
app.use("/api/v1/digitization", authRoute_2.router);
// app.use("/api/v1/user", LeaveRoute);
// app.use("/api/v1/user", TrackingRoute);
//LISTENER
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
