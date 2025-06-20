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
    res.download(__dirname + "/uploads/" + req.params.file, req.query.filename) //set a nice name or save original name in the table
})

app.post("/api/internships", express.json(), (req, res) => {
    query = "select internship.*, name from internship join company on company_id = company.id where "
    params = []
    tokens = []
    req.body.title.forEach(token => {
        tokens.push("title like ?")
        params.push(`%${token}%`)
    })
    query += tokens.join(" and ")
    if (req.body.company.length > 0) {
        query += " and company_id in (?)"
        params.push(req.body.company)
    }
    if (req.body.type.length > 0) {
        query += " and type in (?)"
        params.push(req.body.type)
    }
    //pool.query("select internship.id, title, application.id as application, status from internship left join (select * from application where student_id = ?) application on internship.id = internship_id where title like ? and company_id in (?) and location = ?", [req.session.user, `%${req.body.title}%`, req.body.companies, req.body.location], (err, result) => {
    pool.query(query, params, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

app.listen(3000)
