const express = require("express")
const { register, validate, login, logout } = require("./session")
const { pool, update_profile } = require("./database")

const router = express.Router()

function isAdmin (req, res, next) {
    if (req.session.user && req.session.role === "admin") next()
    else res.redirect("/admin/login")
}

function internshipOwned (req, res, next) {
    pool.query("select company_id from internship where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        if (result[0].company_id === req.session.user) {
            next()
        }
        else {
            res.redirect("/admin/internship")
        }
    })
}

function applicationOwned (req, res, next) {
    pool.query("select company_id from application join internship on internship_id = internship.id where application.id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        if (result[0].company_id === req.session.user) {
            next()
        }
        else {
            res.redirect("/admin/internship")
        }
    })
}

router.get("/", (req, res) => {
    res.redirect("/admin/internship")
})

router.route("/register")
    .get((req, res) => {
        const error = req.session.error
        req.session.error = null
        res.render("register_company", { error })
    })
    .post(express.urlencoded(), register("company"), login("admin"), (req, res) => {
        res.redirect("/admin/internship")
    })

router.route("/login")
    .get((req, res) => {
        const error = req.session.error
        req.session.error = null
        res.render("login_company", { error })
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
            const error = req.session.error
            req.session.error = null
            res.render("company_profile", { ...result[0], error })
        })
    })
    .post(express.urlencoded(), isAdmin, update_profile("company", ["name", "email", "phone", "address", "description"]), (req, res) => {
        res.redirect("/admin/internship")
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
    .post(express.json(), isAdmin, (req, res) => {
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
    .post(express.urlencoded(), isAdmin, (req, res) => {
        const keys = ["title", "location", "type", "skills", "salary", "duration", "deadline", "description"]
        pool.query(`insert into internship (company_id, ${keys.join(", ")}) value (${"?, ".repeat(keys.length)}?)`, [req.session.user].concat(keys.map(key => req.body[key])), (err, result) => {
            if (err) throw err
        })
        res.redirect("/admin/internship")
    })

router.get("/internship/:id", isAdmin, internshipOwned, (req, res) => {
    pool.query("select * from internship where id = ?", [req.params.id], (err, internship) => {
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
    .get(isAdmin, internshipOwned, (req, res) => {
        pool.query("select * from internship where id = ?", [req.params.id], (err, internship) => {
            if (err) throw err
            res.render("edit_internship", internship[0])
        })
    })
    .post(express.urlencoded(), isAdmin, (req, res) => {
        const keys = ["title", "location", "type", "skills", "salary", "duration", "deadline", "description"]
        pool.query(`update internship set ${keys.map(key => `${key} = ?`).join(", ")} where id = ?`, [...keys.map(key => req.body[key]), req.params.id], (err, result) => {
            if (err) throw err
            res.redirect("/admin/internship")
        })
    })

router.get("/internship/:id/delete", isAdmin, internshipOwned, (req, res) => {
    pool.query("delete from internship where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.redirect("/admin/internship")
    })
})

router.route("/application/:id")
    .get(isAdmin, applicationOwned, (req, res) => {
        pool.query("select student.*, cv, filename, about from application join student on student_id = student.id where application.id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.render("application", result[0])
        })
    })
    .post(express.urlencoded(), isAdmin, (req, res) => {
        pool.query("update application set status = ? where id = ?", [req.body.action, req.params.id], (err, result) => {
            if (err) throw err
        })
        pool.query("select internship_id from application where id = ?", [req.params.id], (err, result) => {
            if (err) throw err
            res.redirect(`/admin/internship/${result[0].internship_id}`)
        })
    })

module.exports = router
