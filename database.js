const mysql = require("mysql")
const bcrypt = require("bcrypt")
require("dotenv").config()

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})


function update_profile(table, keys) {
    return (req, res, next) => {
        pool.query(`select * from ${table} where name = ? and id != ?`, [req.body.name, req.session.user], (err, result) => {
            if (err) throw err
            if (table === "company" && result.length > 0) {
                req.session.error = "Name already exists"
                res.redirect(req.originalUrl)
            }
            else {
                pool.query(`select * from ${table} where email = ? and id != ?`, [req.body.email, req.session.user], (err, result) => {
                    if (err) throw err
                    if (result.length > 0) {
                        req.session.error = "Email already exists"
                        res.redirect(req.originalUrl)
                    }
                    else {
                        if (req.body.password === "") {
                            pool.query(`update ${table} set ${keys.map(key => `${key} = ?`).join(", ")} where id = ?`, [...keys.map(key => req.body[key] === "" ? null : req.body[key]), req.session.user], (err, result) => {
                                if (err) throw err
                                next()
                            })
                        }
                        else {
                            bcrypt.hash(req.body.password, 10, function(err, hash) {
                                pool.query(`update ${table} set ${keys.map(key => `${key} = ?`).join(", ")}, password = ? where id = ?`, [...keys.map(key => req.body[key] === "" ? null : req.body[key]), hash, req.session.user], (err, result) => {
                                    if (err) throw err
                                    next()
                                })
                            });
                        }
                    }
                })
            }
        })
    }
}

module.exports = {
    pool,
    update_profile
}
