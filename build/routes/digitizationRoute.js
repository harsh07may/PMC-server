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
const isAuth_1 = require("../isAuth");
const db_1 = require("../utils/db");
const multer = require("multer");
const fs = __importStar(require("fs"));
const upload = multer({ dest: 'uploads/' });
const errors_1 = require("../models/errors");
exports.router.post("/upload", isAuth_1.authMiddleware, upload.single('file'), (req, res) => {
    console.log(req.file);
    if (req.file == null) {
        return res.status(400).json({ 'message': 'Please choose one file' });
    }
    else {
        const file = req.file;
        console.log(file.originalname);
        const fileStream = fs.createReadStream(file.path);
        const path = `D://PMC Document Digitization//${file.originalname}`;
        console.log(path);
        const wStream = fs.createWriteStream(path);
        fileStream.on('data', (data) => {
            wStream.write(data);
        });
        res.send({ fileLink: `${path}` });
    }
});
// 4. Protected Routes
exports.router.post("/insert", isAuth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { doc_name, doc_location, doc_type } = req.body;
    try {
        //   const userId = req.User?.userId;
        const { doc_name, doc_location, doc_type } = req.body;
        const newContent = yield db_1.pool.query("INSERT INTO document (doc_name,doc_location,doc_type) VALUES($1,$2,$3) RETURNING *", [doc_name, doc_location, doc_type]);
        res.json(newContent.rows[0]);
    }
    catch (err) {
        res.send({ error: `${err.message}` });
    }
}));
exports.router.get("/", isAuth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userRole = req.User.userRoles;
    const err = new errors_1.AccessDeniedError("You need to be an Admin");
    if (userRole != "admin")
        return res.status(err.statusCode).send({ error: err });
    res.json(req.User);
}));
exports.router.post("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { doc_id } = req.body;
        console.log("doc_id" + doc_id);
        const document = yield db_1.pool.query("SELECT * from document WHERE doc_id = $1", [doc_id]);
        // console.log(document.rows[0]);
        if (document.rowCount === 0)
            throw new Error("File not found");
        res.download(document.rows[0].doc_location);
    }
    catch (error) {
        res.send({ error: `${error.message}` });
    }
}));
