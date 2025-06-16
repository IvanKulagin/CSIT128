const express = require("express")
const session = require("express-session")
const mysql = require("mysql")
const formidable = require("formidable")
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

app.get("/", (req, res) => {
    res.send("Welcome!")
})

app.use("/admin", admin)

app.use("/student", student)

app.get("/api/applications/:id", (req, res) => {
    pool.query("select * from application where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.download(__dirname + "/uploads/" + result[0].portfolio) //set a nice name or save original name in the table
    })
})

app.post("/api/internships", express.json(), (req, res) => { //fails if array is empty
    console.log(req.body)
    pool.query("select internship.id, title, application.id as application, status from internship left join (select * from application where student_id = ?) application on internship.id = internship_id where title like ? and company_id in (?) and location = ?", [req.session.user, `%${req.body.title}%`, req.body.companies, req.body.location], (err, result) => {
        if (err) throw err
        console.log(result)
        res.send(result)
    })
})

app.listen(3000)
