const express = require("express")
const mysql = require("mysql")
const bcrypt = require("bcrypt")

const { pool } = require("./database")

function register(table) {
    return (req, res, next) => {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) throw err
            pool.query(`select * from ${table} where name = ?`, [req.body.name], (err, result) => {
                if (err) throw err
                if (table !== "student" && result.length !== 0) {
                    req.session.error = "Name already exists"
                    res.redirect(req.originalUrl)
                }
                else {
                    pool.query(`select * from ${table} where email = ?`, [req.body.email], (err, result) => {
                        if (result.length != 0) {
                            req.session.error = "Email already exists"
                            res.redirect(req.originalUrl)
                        }
                        else {
                            pool.query(`insert into ${table} (name, email, password) values (?, ?, ?)`, [req.body.name, req.body.email, hash], (err, result) => {
                                if (err) throw err
                                req.user = result.insertId
                                next()
                            })
                        }
                    })
                }
            })
        })
    }
}

function login(role) {
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

function validate(table) {
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
                        req.session.error = true
                        res.redirect(req.originalUrl)
                    }
                })
            }
            else {
                req.session.error = true
                res.redirect(req.originalUrl)
            }
        })
    }
}

function logout(req, res, next) {
    req.session.user = null
    req.session.save(function (err) {
        if (err) throw err
        req.session.regenerate(function (err) {
            if (err) throw err
            next()
        })
    })
}

module.exports = {
    register,
    login,
    validate,
    logout
}
