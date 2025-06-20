const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const router = express.Router();

const { register, validate, login, logout } = require("./session")

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

function isAdmin (req, res, next) {
    if (req.session.user && req.session.role == "admin") next()
    else res.redirect("/admin/login") //remember previous page
}

router.route("/register")
    .get((req, res) => {
        res.render("register_company")
    })
    .post(express.urlencoded(), register("company"), login("admin"), (req, res) => {
        res.redirect("/admin/internship")
    })

router.route("/login")
    .get((req, res) => {
        const failed = req.session.failed
        req.session.failed = null
        res.render("login_company", { failed })
    })
    .post(express.urlencoded(), validate("company"), login("admin"), (req, res) => {
        res.redirect("/admin/internship")
    })

router.get("/logout", isAdmin, logout, (req, res) => {
    res.redirect("/")
})

router.route("/profile")
    .get(isAdmin, (req, res) => {
        pool.query("select * from company where id = ?", [req.session.user], (err, result) => {
            if (err) throw err
            res.render("company_profile", result[0])
        })
    })
    .post(express.urlencoded(), (req, res) => {
        const keys = ["name", "email", "phone", "address", "description"] //password
        pool.query(`update company set ${keys.map(key => `${key} = ?`).join(", ")} where id = ?`, [...keys.map(key => req.body[key]), req.session.user], (err, result) => {
            if (err) throw err
            res.redirect("/admin/internship")
        })
    })


router.route("/internship")
    .get(isAdmin, (req, res) => {
        pool.query("select * from internship where company_id = ?", [req.session.user], (err, result) => {
            if (err) throw err
            res.render("company_dashboard", {
                internships: result
            })
        })
    })
    .post(express.json(), (req, res) => {
        query = "select * from internship where company_id = ? and "
        params = [req.session.user]
        tokens = []
        req.body.title.forEach(token => {
            tokens.push("title like ?")
            params.push(`%${token}%`)
        })
        query += tokens.join(" and ")
        pool.query(query, params, (err, result) => {
            if (err) throw err
            res.send(result)
        })
    })

router.route("/internship/create")
    .get(isAdmin, (req, res) => {
        res.render("create_internship")
    })
    .post(express.urlencoded(), (req, res) => {
        const keys = ["title", "location", "type", "skills", "salary", "duration", "deadline", "description"]
        pool.query(`insert into internship (company_id, ${keys.join(", ")}) value (${"?, ".repeat(keys.length)}?)`, [req.session.user].concat(keys.map(key => req.body[key])), (err, result) => {
            if (err) throw err
        })
        res.redirect("/admin/internship")
    })

router.get("/internship/:id", isAdmin, (req, res) => {
    pool.query("select * from internship where id = ?", [req.params.id], (err, internship) => { //no check for company_id
        if (err) throw err
        pool.query("select application.*, student.name from application join student on student_id = student.id where internship_id = ?", [req.params.id], (err, applications) => {
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
        const keys = ["title", "location", "type", "skills", "salary", "duration", "deadline", "description"]
        pool.query(`update internship set ${keys.map(key => `${key} = ?`).join(", ")} where id = ?`, [...keys.map(key => req.body[key]), req.params.id], (err, result) => {
            if (err) throw err
            res.redirect("/admin/internship")
        })
    })

router.get("/internship/:id/delete", isAdmin, (req, res) => {
    pool.query("delete from internship where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.redirect("/admin/internship")
    })
})

router.route("/application/:id")
    .get(isAdmin, (req, res) => {
        pool.query("select student.*, cv, filename, about from application join student on student_id = student.id where application.id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.render("application", result[0])
        })
    })
    .post(express.urlencoded(), (req, res) => {
        pool.query("update application set status = ? where id = ?", [req.body.action, req.params.id], (err, result) => {
            if (err) throw err
        })
        res.redirect(`/admin/internship`) //better to return to current intership, but we lose its id
    })

module.exports = router
