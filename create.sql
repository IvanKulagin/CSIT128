drop database if exists project;
create database project;
use project;

create table company(
	id int auto_increment primary key,
	name text,
	username text,
	password text
);

create table internship (
	id int auto_increment primary key,
	company_id int,
	title text,
	location enum("remote", "on-site"),
	skills text,
	salary decimal(10, 2),
	duration int,
	deadline date,
	foreign key (company_id) references company(id)
);

create table student (
	id int auto_increment primary key,
	name text,
	username text,
	password text
);

create table application ( #make student_id and intership_id combination unique
	id int auto_increment primary key,
	student_id int,
	internship_id int,
	portfolio text,
	comment text,
	status enum("rejected", "shortlisted", "accepted"),
	foreign key (student_id) references student(id),
	foreign key (internship_id) references internship(id) on delete cascade
);

insert into company values (null, "Company 1", "admin", "");
insert into company values (null, "Company 2", "admin2", "");

insert into internship values (null, 1, "Internship 1", "remote", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 2, "Internship 3", "on-site", "Some skills", 12345.67, 365, "2025-07-01");

insert into student values (null, "John", "user", "");
insert into student values (null, "Bob", "user2", "");

insert into application values (null, 1, 1, "Portfolio 1", "Comment", null);
insert into application values (null, 1, 2, "Portfolio 1", "Comment", null);
insert into application values (null, 2, 2, "Portfolio 2", "Comment", null);