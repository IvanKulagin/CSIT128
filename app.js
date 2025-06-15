var express = require("express")
var session = require("express-session")
var mysql = require("mysql")
var formidable = require("formidable")
var fs = require("fs")
require("dotenv").config()

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

function isAdmin (req, res, next) {
    if (req.session.user) next()
    else res.redirect("/admin/login") //remember previous page
}

function isStudent (req, res, next) {
    if (req.session.user) next()
    else res.redirect("/student/login")
}

app.get("/", (req, res) => {
    res.send("Welcome!")
})

app.get("/admin", isAdmin, (req, res) => {
    pool.query("select * from company where id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        res.send("Welcome " + result[0].name)
    })
})

app.get("/admin/login", (req, res) => {
    res.sendFile(__dirname + "/login.html")
})

app.post("/admin/login", express.urlencoded(), (req, res) => {
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

app.get("/admin/logout", isAdmin, (req, res) => {
    req.session.user = null
    req.session.save(function (err) {
        if (err) throw err
        req.session.regenerate(function (err) {
            if (err) throw err
            res.redirect("/admin/login")
        })
    })
})

app.get("/admin/internship", isAdmin, (req, res) => {
    pool.query("select * from internship where company_id = ?", [req.session.user], (err, result) => {
        if (err) throw err
        var response = ""
        result.forEach((row) => {
            response += `${row.title} ${row.salary} <a href="/admin/internship/edit/${row.id}">Edit</a> <a href="/admin/applications/${row.id}">Applications</a><br>`
        })
        res.send(response)
    })
})

app.get("/admin/internship/create", isAdmin, (req, res) => {
    res.sendFile(__dirname + "/create.html")
})

app.post("/admin/internship/create", express.urlencoded(), (req, res) => {
    console.log(req.body)
    var keys = ["title", "location", "skills", "salary", "duration", "deadline"]
    pool.query("insert into internship value (null, ?, ?, ?, ?, ?, ?, ?)", [req.session.user].concat(keys.map(key => req.body[key])), (err, result) => {
        if (err) throw err
        console.log(result)
    })
    res.redirect("/admin/internship")
})

app.get("/admin/internship/edit/:id", isAdmin, (req, res) => {
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

app.post("/admin/internship/edit/:id", express.urlencoded(), (req, res) => {
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

app.post("/admin/internship/delete", express.urlencoded(), (req, res) => {
    console.log(req.body)
    pool.query("delete from internship where id = ?", [req.body.id], (err, result) => {
        if (err) throw err
        console.log(result)
        res.redirect("/admin/internship")
    })
})

app.get("/admin/applications/:id", isAdmin, (req, res) => {
    pool.query("select application.id, internship.title, student.name, status from application join internship on internship_id = internship.id join student on student_id = student.id where internship_id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        var response = ""
        result.forEach((row) => {
            response += `${JSON.stringify(row)} <a href="/admin/applications/view/${row.id}">View</a><br>`
        })
        res.send(response)
    })
})

app.get("/admin/applications/view/:id", isAdmin, (req, res) => {
    pool.query("select * from application where id = ?", [req.params.id], (err, result) => {
        if (err) throw err
        res.render("review", {
            id: result[0].id,
            comment: result[0].comment
        })
    })
})

app.post("/admin/applications/view/:id", express.urlencoded(), (req, res) => {
    console.log(req.body)
    pool.query("update application set status = ? where id = ?", [req.body.status, req.params.id], (err, result) => {
        if (err) throw err
        console.log(result)
    })
    res.redirect(`/admin/internship`) //better to return to current intership, but I lose it's id
})

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
