const mysql = require("mysql")
require("dotenv").config()

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.MYSQL_PASS,
})

con.query("create database if not exists project", (err, result) => {
    if (err) throw err
    console.log("Database created")
})

con.changeUser({ database: 'project' }, function(err) {
  if (err) throw err;
});

con.query(`create table if not exists company (
    id int auto_increment primary key,
    name text not null,
    email text not null unique,
    phone text,
    address text,
    description text,
    password text
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'company' created")
})

con.query(`create table if not exists internship (
    id int auto_increment primary key,
    company_id int,
    title text,
    location text,
    type enum("Remote", "On-site"),
    skills text,
    salary decimal(10, 2),
    duration int,
    deadline date,
    description text,
    foreign key (company_id) references company(id)
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'intenship' created")
})

con.query(`create table if not exists student (
    id int auto_increment primary key,
    name text not null,
    email text not null unique,
    phone text,
    university text,
    major text,
    year int,
    bio text,
    password text
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'student' created")
})

con.query(`create table if not exists application (
    id int auto_increment primary key,
    internship_id int,
    student_id int,
    cv text,
    filename text,
    about text,
    status enum("Accepted", "Rejected", "Shortlisted"),
    foreign key (student_id) references student(id),
    foreign key (internship_id) references internship(id) on delete cascade
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'application' created")
})
