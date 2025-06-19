const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const router = express.Router();

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

function isAdmin (req, res, next) {
    if (req.session.user) next()
    else res.redirect("/admin/login") //remember previous page
}

router.get("/", isAdmin, (req, res) => {
    pool.query("select * from company where id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        res.send("<p>Welcome " + result[0].name + "</p><br><a href=\"/admin/internship\">Internships</a>")
    })
})

router.route("/register")
    .get((req, res) => {
        res.render("register_company")
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        const keys = ["name", "email", "password"]
        pool.query("insert into company values (null, ?, ?, ?)", keys.map(key => req.body[key]), (err, result) => {
            if (err) throw err
            console.log(result)
            res.redirect("/admin/login") //make autologin
        })
    })

router.route("/login")
    .get((req, res) => {
        res.render("login_company")
    })
    .post(express.urlencoded(), (req, res) => {
        pool.query("select * from company where email = ? and password = ?", [req.body.email, req.body.password], (err, result) => {
            if (err) throw err
            console.log(result)
            if (result.length != 0) {
                req.session.regenerate((err) => {
                    if (err) throw err
                    req.session.user = result[0].id
                    req.session.save((err) => {
                        if (err) throw err
                        res.redirect("/admin/internship")
                    })
                })
            }
            else {
                res.redirect("/admin/login")
            }
        })
    })

router.get("/logout", isAdmin, (req, res) => {
    req.session.user = null
    req.session.save(function (err) {
        if (err) throw err
        req.session.regenerate(function (err) {
            if (err) throw err
            res.redirect("/")
        })
    })
})

router.get("/internship", isAdmin, (req, res) => {
    pool.query("select * from internship where company_id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        /*
        var response = ""
        result.forEach((row) => {
            response += `${row.title} ${row.salary} <a href="/admin/internship/edit/${row.id}">Edit</a> <a href="/admin/applications/${row.id}">Applications</a><br>`
        })
        res.send(response)
        */
        res.render("company_dashboard", {
            internships: result
        })
    })
})

router.route("/internship/create")
    .get(isAdmin, (req, res) => {
        res.render("create_internship")
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        const keys = ["title", "location", "type", "skills", "duration"]
        pool.query("insert into internship (company_id, title, location, type, skills, duration) value (?, ?, ?, ?, ?, ?)", [req.session.user].concat(keys.map(key => req.body[key])), (err, result) => {
            if (err) throw err
            console.log(result)
        })
        res.redirect("/admin/internship")
    })

router.get("/internship/:id", isAdmin, (req, res) => {
    pool.query("select * from internship where id = ?", [req.params.id], (err, internship) => { //no check for company_id
        if (err) throw err
        pool.query("select application.*, student.name from application join student on student_id = student.id where internship_id = ?", [req.params.id], (err, applications) => {
            console.log(applications)
            res.render("company_internship", {
                ...internship[0],
                applications: applications
            })
        })
    })
})

router.route("/internship/:id/edit")
    .get(isAdmin, (req, res) => {
        pool.query("select * from internship where id = ?", [req.params.id], (err, internship) => { //no check for company_id
            if (err) throw err
            res.render("edit_internship", internship[0])
        })
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        const keys = ["title", "location", "type", "skills", "duration"]
        const query = `update internship set
                     title = ?,
                     location = ?,
                     type = ?,
                     skills = ?,
                     duration = ?
                     where id = ?`
        pool.query(query, keys.map(key => req.body[key]).concat(req.params.id), (err, result) => {
            if (err) throw err
            console.log(result)
            res.redirect("/admin/internship")
        })
    })

router.get("/internship/:id/delete", isAdmin, (req, res) => {
    pool.query("delete from internship where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        console.log(result)
        res.redirect("/admin/internship")
    })
})

router.get("/applications/:id", isAdmin, (req, res) => {
    pool.query("select application.id, internship.title, student.name, status from application join internship on internship_id = internship.id join student on student_id = student.id where internship_id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        var response = ""
        result.forEach((row) => {
            response += `${JSON.stringify(row)} <a href="/admin/applications/view/${row.id}">View</a><br>`
        })
        res.send(response)
    })
})

router.route("/application/:id")
    .get(isAdmin, (req, res) => {
        pool.query("select student.*, comment, portfolio from application join student on student_id = student.id where application.id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.render("application", result[0])
        })
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        pool.query("update application set status = ? where id = ?", [req.body.action, req.params.id], (err, result) => {
            if (err) throw err
            console.log(result)
        })
        res.redirect(`/admin/internship`) //better to return to current intership, but we lose its id
    })

module.exports = router
