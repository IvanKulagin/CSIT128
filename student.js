const express = require("express");
const mysql = require("mysql");
const formidable = require("formidable")
const path = require("path")
const router = express.Router();

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

function isStudent (req, res, next) {
    if (req.session.user) next()
    else res.redirect("/student/login")
}

router.get("/", isStudent, (req, res) => {
    pool.query("select * from student where id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        res.send("Welcome " + result[0].name)
    })
})

router.route("/register")
    .get((req, res) => {
        res.send("reg")
    })

router.route("/login")
    .get((req, res) => {
        res.render("login_student")
    })
    .post(express.urlencoded(), (req, res) => {
        pool.query("select * from student where email = ? and password = ?", [req.body.email, req.body.password], (err, result) => {
            if (err) throw err
            if (result.length != 0) {
                req.session.regenerate((err) => {
                    if (err) throw err
                    req.session.user = result[0].id
                    req.session.save((err) => {
                        if (err) throw err
                        res.redirect("/student/internship")
                    })
                })
            }
            else {
                res.redirect("/student/login")
            }
        })
    })

router.get("/logout", (req, res) => {
    req.session.user = null
    req.session.save(function (err) {
        if (err) throw err
        req.session.regenerate(function (err) {
            if (err) throw err
            res.redirect("/")
        })
    })
})

router.get("/internship", isStudent, (req, res) => {
    pool.query("select * from company", (err, result) => {
        if (err) throw err
        res.render("student_dashboard", {
            companies: result
        })
    })
})

router.get("/internship/:id", isStudent, (req, res) => {
    pool.query("select internship.*, company.name from internship join company on company_id = company.id where internship.id = ?", [req.params.id], (err, result) => {
        res.render("student_internship", result[0])
    })
})

router.route("/internship/:id/apply")
    .get(isStudent, (req, res) => {
        pool.query("select * from internship where internship.id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.render("create_application", result[0])
        })
    })
    .post((req, res) => {
        const form = formidable.formidable({ uploadDir: path.join(__dirname, "uploads") });
        form.parse(req, (err, fields, files) => {
            if (err) throw err
            console.log(fields)
            console.log(files)
            pool.query("insert into application values (null, ?, ?, ?, ?, null)", [req.session.user, req.params.id, files.cv[0].newFilename, fields.about[0]], (err, result) => {
                if (err) throw err
                console.log(result)
                res.redirect("/student/internship")
            })
        })
    })

module.exports = router
