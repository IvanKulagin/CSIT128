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
        res.render("register_student")
    })
    .post(express.urlencoded(), (req, res) => {
        console.log(req.body)
        const keys = ["name", "email", "password"]
        pool.query("insert into student values (null, ?, ?, ?)", keys.map(key => req.body[key]), (err, result) => {
            if (err) throw err
            console.log(result)
            res.redirect("/student/login") //make autologin
        })
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

router.route("/profile")
    .get(isStudent, (req, res) => {
        pool.query("select * from student where id = ?", [req.session.user], (err, result) => {
            if (err) throw err
            res.render("student_profile", result[0])
        })
    })
    .post(express.urlencoded(), (req, res) => {
        const keys = ["name", "email", "phone", "university", "major", "year", "bio"] //password
        pool.query(`update student set ${keys.map(key => `${key} = ?`).join(", ")} where id = ?`, [...keys.map(key => req.body[key]), req.session.user], (err, result) => {
            if (err) throw err
            res.redirect("/student/internship")
        })
    })

router.route("/internship")
    .get(isStudent, (req, res) => {
        pool.query("select * from company", (err, result) => {
            if (err) throw err
            res.render("student_dashboard", {
                companies: result
            })
        })
    })
    .post(express.json(), (req, res) => {
        console.log(req.body)
        query = "select internship.*, name from internship join company on company_id = company.id where duration <= ? and salary >= ? and "
        params = [req.body.duration, req.body.salary]
        tokens = []
        req.body.search.forEach(token => {
            tokens.push("(title like ? or location like ?)")
            params.push(`%${token}%`)
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
        pool.query(query, params, (err, result) => {
            if (err) throw err
            res.send(result)
        })
    })

router.get("/internship/:id", isStudent, (req, res) => {
    pool.query("select internship.*, company.name, application.id as application, status from internship join company on company_id = company.id join application on internship.id = internship_id where internship.id = ?", [req.params.id], (err, result) => {
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
            pool.query("insert into application values (null, ?, ?, ?, ?, ?, null)", [req.params.id, req.session.user, files.cv[0].newFilename, files.cv[0].originalFilename, fields.about[0]], (err, result) => {
                if (err) throw err
                res.redirect("/student/internship")
            })
        })
    })

router.get("/applications", isStudent, (req, res) => {
    pool.query("select application.*, title, name from application join internship on internship_id = internship.id join company on company_id = company.id where student_id = ?", [req.session.user], (err, result) => {
        res.render("student_applications", { applications: result })
    })

})

module.exports = router
