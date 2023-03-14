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
const isAuth_1 = require("../isAuth");
const db_1 = require("../utils/db");
// 4. Protected Routes
exports.router.post("/add", isAuth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // const userId = isAuth(req);
        // console.log("user data ->>", JSON.stringify(req.User, null, 2));
        const userId = (_a = req.User) === null || _a === void 0 ? void 0 : _a.userId;
        //   const userROle = req.User?.userRole;
        if (userId !== null) {
            const { doc_name, doc_location, doc_type } = req.body;
            const newContent = yield db_1.pool.query("INSERT INTO document (doc_name,doc_location,doc_type) VALUES($1,$2,$3) RETURNING *", [doc_name, doc_location, doc_type]);
            res.json(newContent.rows[0]);
        }
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
exports.router.get("/", isAuth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("This is a protected endpoint");
}));
