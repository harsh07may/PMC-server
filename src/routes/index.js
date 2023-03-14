const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./db")
const PORT = 3000
const multer = require('multer')
const fs = require('fs');
const upload = multer({ dest: 'uploads/' })

var bodyParser = require("body-parser");


const app = express();

app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.json({ "status": "working" });
})

app.post("/upload", upload.single('file'), (req, res) => {
    console.log(req.file);
    if (req.file == null) {
        return res.status(400).json({ 'message': 'Please choose one file' })
    }

    else {
        const file = req.file;
        console.log(file.originalname);

        const fileStream = fs.createReadStream(file.path);
        const path = `D://PMC Document Digitization//${file.originalname}`
        console.log(path);
        const wStream = fs.createWriteStream(path);

        fileStream.on('data', (data) => {
            wStream.write(data);
        })

        res.send({fileLink : `${path}`});
    }
})

app.post("/insertdb", async(req, res) => {
    const {name, filelink} = req.body;
    try {
        const data = await db.query(`INSERT INTO "test_record" ("name", "filelink") VALUES ($1, $2)`, [name, filelink])
        res.json(data.rows[0]);
        
    } catch (error) {
       res.send({error: `${error.message}`}) 
    }
})

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});