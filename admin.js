const express = require("express");
const mysql = require("mysql");
const router = express.Router();

var pool = mysql.createPool({
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
        res.send("Welcome " + result[0].name)
    })
})

router.route("/login")
    .get((req, res) => {
        res.sendFile(__dirname + "/login.html")
    })
    .post(express.urlencoded(), (req, res) => {
        pool.query("select * from company where username = ? and password = ?", [req.body.username, req.body.password], (err, result) => {
            if (err) throw err
            console.log(result)
            if (result.length != 0) {
                req.session.regenerate((err) => {
                    if (err) throw err
                    req.session.user = result[0].id
                    req.session.save((err) => {
                        if (err) throw err
                        res.redirect("/admin")
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
            res.redirect("/admin/login")
        })
    })
})

router.get("/internship", isAdmin, (req, res) => {
    pool.query("select * from internship where company_id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        var response = ""
        result.forEach((row) => {
            response += `${row.title} ${row.salary} <a href="/admin/internship/edit/${row.id}">Edit</a> <a href="/admin/applications/${row.id}">Applications</a><br>`
        })
        res.send(response)
    })
})

router.route("internship/create")
    .get(isAdmin, (req, res) => {
        res.sendFile(__dirname + "/create.html")
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        var keys = ["title", "location", "skills", "salary", "duration", "deadline"]
        pool.query("insert into internship value (null, ?, ?, ?, ?, ?, ?, ?)", [req.session.user].concat(keys.map(key => req.body[key])), (err, result) => {
            if (err) throw err
            console.log(result)
        })
        res.redirect("/admin/internship")
    })

router.route("/internship/edit/:id")
    .get(isAdmin, (req, res) => {
        pool.query("select * from internship where id = ?", [req.params.id], (err, result) => { //no check for company_id
            if (err) throw err
            console.log(result[0])
            res.render("form", {
                title: result[0].title,
                location: result[0].location,
                skills: result[0].skills,
                salary: result[0].salary,
                duration: result[0].duration,
                deadline: result[0].deadline,
                id: result[0].id
            })
        })
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        var keys = ["title", "location", "skills", "salary", "duration", "deadline"]
        var query = `update internship set
                     title = ?,
                     location = ?,
                     skills = ?,
                     salary = ?,
                     duration = ?,
                     deadline = ?
                     where id = ?`
        pool.query(query, keys.map(key => req.body[key]).concat(req.params.id), (err, result) => {
            if (err) throw err
            console.log(result)
            res.redirect("/admin/internship")
        })
    })

router.post("/internship/delete", express.urlencoded(), (req, res) => {
    console.log(req.body)
    pool.query("delete from internship where id = ?", [req.body.id], (err, result) => {
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

router.route("/applications/view/:id")
    .get(isAdmin, (req, res) => {
        pool.query("select * from application where id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.render("review", {
                id: result[0].id,
                comment: result[0].comment
            })
        })
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        pool.query("update application set status = ? where id = ?", [req.body.status, req.params.id], (err, result) => {
            if (err) throw err
            console.log(result)
        })
        res.redirect(`/admin/internship`) //better to return to current intership, but I lose it's id
    })

module.exports = router
