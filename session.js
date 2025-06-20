const express = require("express")
const mysql = require("mysql")
const bcrypt = require("bcrypt")

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
    database: "project",
    connectionLimit: 10,
    dateStrings: true
})

exports.register = (table) => {
    return (req, res, next) => {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) throw err
            pool.query(`insert into ${table} (name, email, password) values (?, ?, ?)`, [req.body.name, req.body.email, hash], (err, result) => {
                if (err) throw err
                req.user = result.insertId
                next()
            })
        })
    }
}

exports.login = (role) => {
    return (req, res, next) => {
        req.session.regenerate((err) => {
            if (err) throw err
            req.session.user = req.user
            req.session.role = role
            req.session.save((err) => {
                if (err) throw err
                next()
            })
        })
    }
}

exports.validate = (table) => {
    return (req, res, next) => {
        pool.query(`select * from ${table} where email = ?`, [req.body.email], (err, result) => {
            if (err) throw err
            if (result.length != 0) {
                bcrypt.compare(req.body.password, result[0].password, (err, password) => {
                    if (password) {
                        req.user = result[0].id
                        next()
                    }
                    else {
                        req.session.failed = true
                        res.redirect(req.originalUrl)
                    }
                })
            }
            else {
                req.session.failed = true
                res.redirect(req.originalUrl)
            }
        })
    }
}

exports.logout = (req, res, next) => {
    req.session.user = null
    req.session.save(function (err) {
        if (err) throw err
        req.session.regenerate(function (err) {
            if (err) throw err
            next()
        })
    })
}
