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
    name varchar(255) not null,
    email varchar(255) not null unique,
    phone varchar(255),
    address text,
    description text,
    password varchar(255)
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'company' created")
})

con.query(`create table if not exists internship (
    id int auto_increment primary key,
    company_id int,
    title varchar(255),
    location varchar(255),
    type enum("Remote", "On-site"),
    skills varchar(255),
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
    name varchar(255) not null,
    email varchar(255) not null unique,
    phone varchar(255),
    university varchar(255),
    major varchar(255),
    year int,
    bio text,
    password varchar(255)
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'student' created")
})

con.query(`create table if not exists application (
    id int auto_increment primary key,
    internship_id int,
    student_id int,
    cv varchar(255),
    filename varchar(255),
    about text,
    status enum("Accepted", "Rejected", "Shortlisted"),
    foreign key (student_id) references student(id),
    foreign key (internship_id) references internship(id) on delete cascade
);`, (err, result) => {
    if (err) throw err
    console.log("Table 'application' created")
})
