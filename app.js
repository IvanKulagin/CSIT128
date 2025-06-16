var express = require("express")
var session = require("express-session")
var mysql = require("mysql")
var formidable = require("formidable")
require("dotenv").config()

const admin = require("./admin")

var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

var app = express()

app.set("view engine", "ejs")

app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true
}))

function isStudent (req, res, next) {
    if (req.session.user) next()
    else res.redirect("/student/login")
}

app.get("/", (req, res) => {
    res.send("Welcome!")
})

app.use("/admin", admin)

app.get("/api/applications/:id", (req, res) => {
    pool.query("select * from application where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.download(__dirname + "/uploads/" + result[0].portfolio) //set a nice name or save original name in the table
    })
})

app.get("/student", isStudent, (req, res) => {
    pool.query("select * from student where id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        res.send("Welcome " + result[0].name)
    })
})

app.get("/student/login", (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

app.post("/student/login", express.urlencoded(), (req, res) => {
    pool.query("select * from student where username = ? and password = ?", [req.body.username, req.body.password], (err, result) => {
        if (err) throw err
        console.log(result)
        if (result.length != 0) {
            req.session.regenerate((err) => {
                if (err) throw err
                req.session.user = result[0].id
                req.session.save((err) => {
                    if (err) throw err
                    res.redirect("/student")
                })
            })
        }
        else {
            res.redirect("/admin/login")
        }
    })
})

app.get("/student/internship", isStudent, (req, res) => {
    pool.query("select * from company", (err, result) => {
        if (err) throw err
        res.render("search", {
            companies: result
        })
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

app.get("/student/internship/:id", isStudent, (req, res) => {
    pool.query("select * from internship join company on company_id = company.id where internship.id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.render("application", {
            internship: JSON.stringify(result)
        })
    })
})

app.post("/student/internship/:id", (req, res) => {
    const form = formidable.formidable({ uploadDir: __dirname + "/uploads" });
    form.parse(req, (err, fields, files) => {
        if (err) throw err
        console.log(fields)
        console.log(files)
        pool.query("insert into application values (null, ?, ?, ?, ?, null)", [req.session.user, req.params.id, files.portfolio[0].newFilename, fields.comment[0]], (err, result) => {
            if (err) throw err
            console.log(result)
            res.redirect("/student/internship")
        })
    })
})

app.listen(3000)
