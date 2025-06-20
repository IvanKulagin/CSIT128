const express = require("express")
const session = require("express-session")
const mysql = require("mysql")
const path = require("path")
require("dotenv").config()

const admin = require("./admin")
const student = require("./student")

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

const app = express()

app.set("view engine", "ejs")

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
}))

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index")
})

app.use("/admin", admin)

app.use("/student", student)

app.get("/api/download/:file", (req, res) => {
    res.download(__dirname + "/uploads/" + req.params.file, req.query.filename)
})

app.listen(3000)
