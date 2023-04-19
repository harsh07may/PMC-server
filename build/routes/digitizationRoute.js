"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const authMiddleware_1 = require("../authMiddleware");
const db_1 = require("../utils/db");
const multer = require("multer");
const fs = __importStar(require("fs"));
const upload = multer({ dest: "uploads/" });
const errors_1 = require("../models/errors");
exports.router.post("/upload", upload.single("file"), (req, res) => {
    console.log(req.file);
    if (req.file == null) {
        return res.status(400).json({ message: "Please choose one file" });
    }
    else {
        const file = req.file;
        console.log(file.originalname);
        const fileStream = fs.createReadStream(file.path);
        const path = `D:/PMC Document Digitization/${file.originalname}`;
        console.log(path);
        const wStream = fs.createWriteStream(path);
        fileStream.on("data", (data) => {
            wStream.write(data);
        });
        res.send({ fileLink: `${path}` });
    }
});
// 4. Protected Routes
exports.router.post("/insert", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var newContent;
        var auditContent;
        const { type } = req.body;
        const { UserName } = req.body;
        const Action = "Upload";
        if (type == "municipal_property_record") {
            const { WardNo, SubDivNo, Title, FileLink } = req.body;
            newContent = yield db_1.pool.query("INSERT INTO municipal_records (wardno,subdivno,title,filelink, timestamp) VALUES($1,$2,$3,$4, (select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *", [WardNo, SubDivNo, Title, FileLink]);
            auditContent = yield db_1.pool.query("INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *", [type, FileLink, Action, UserName]);
        }
        else if (type == "birth_record") {
            const { Month, Year, FileLink } = req.body;
            newContent = yield db_1.pool.query("INSERT INTO birth_records (month,year,filelink, timestamp) VALUES($1,$2,$3,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *", [Month, Year, FileLink]);
        }
        else if (type === "house_tax_record") {
            const { WardNo, HouseNo, Name, FileLink } = req.body;
            newContent = yield db_1.pool.query("INSERT INTO housetax_records (wardno, houseno, name, filelink, timestamp) VALUES ($1,$2,$3,$4,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *", [WardNo, HouseNo, Name, FileLink]);
        }
        else {
            const { LicenseNo, SubDivNo, Year, Name, FileLink } = req.body;
            newContent = yield db_1.pool.query("INSERT INTO constructionlicense_records(licenseno, subdivno, year, name, filelink, timestamp) VALUES ($1,$2,$3,$4,$5,(select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp)) RETURNING *", [LicenseNo, SubDivNo, Year, Name, FileLink]);
        }
        res.json(newContent.rows[0]);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
//TODO router.get("/search", authMiddleware, async (req, res) => {
exports.router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        var document;
        if (type === "municipal_property_record") {
            const { title, wardNo: wardno, subDivNo: subdivno } = req.query;
            document = yield db_1.pool.query("SELECT * from municipal_records WHERE title LIKE '%' || $1 || '%' AND wardno LIKE '%' || $2 || '%' AND subdivno LIKE '%' || $3 || '%'", [title, wardno, subdivno]);
        }
        else if (type === "birth_record") {
            const { Month, Year } = req.query;
            document = yield db_1.pool.query("SELECT * from birth_records WHERE month LIKE '%' || $1 || '%' AND wardno LIKE '%'", [Month, Year]);
        }
        else if (type === "house_tax_record") {
            const { WardNo, HouseNo, Name } = req.query;
            document = yield db_1.pool.query("SELECT * from housetax_records WHERE wardno LIKE '%' || $1 || '%' AND houseno LIKE '%' || $2 || '%' AND name LIKE '%' || $3 || '%'", [WardNo, HouseNo, Name]);
        }
        else if (type === "construction_license") {
            const { LicenseNo, SubDivNo, Year, Name } = req.query;
            document = yield db_1.pool.query("SELECT * from constructionlicense_records WHERE licenseno LIKE '%' || $1 || '%' AND subdivno LIKE '%' || $2 || '%' AND year LIKE '%' || $3 || '%' AND name LIKE '%' || $4 || '%'", [LicenseNo, SubDivNo, Year, Name]);
        }
        if (document.rowCount === 0)
            throw new Error("File not found");
        res.send(document.rows);
    }
    catch (error) {
        res.send({ error: `${error.message}` });
    }
}));
exports.router.get("/", authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userRole = req.User.userRoles;
    const err = new errors_1.AccessDeniedError("You need to be an Admin");
    if (userRole != "admin")
        return res.status(err.statusCode).send({ error: err });
    res.json(req.User);
}));
exports.router.get("/file-download", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var auditContent;
        const { doc_name, type, username } = req.query;
        const Action = "Search";
        const document = yield db_1.pool.query("SELECT * from housetax_records WHERE name = $1", [doc_name]);
        if (document.rowCount === 0)
            throw new Error("File not found");
        auditContent = yield db_1.pool.query("INSERT INTO searchadd_auditlogs (timestamp, documenttype, resourcename, action, performedby) VALUES((select to_char(now()::timestamp, 'DD-MM-YYYY HH:MI:SS AM') as timestamp), $1,$2,$3,$4) RETURNING *", [type, document.rows[0].filelink, Action, username]);
        const fileName = document.rows[0].filelink.substring(29);
        const filePath = document.rows[0].filelink;
        console.log(filePath);
        res.download(filePath);
    }
    catch (error) {
        res.send({ error: `${error.message}` });
    }
}));
