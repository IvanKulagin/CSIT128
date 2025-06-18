drop database if exists project;
create database project;
use project;

create table company(
	id int auto_increment primary key,
	name text,
	email text,
	password text
);

create table internship (
	id int auto_increment primary key,
	company_id int,
	title text,
	location text,
	type enum("remote", "on-site"),
	skills text,
	salary decimal(10, 2),
	duration int,
	deadline date,
	foreign key (company_id) references company(id)
);

create table student (
	id int auto_increment primary key,
	name text,
	email text,
	password text
);

create table application ( #make student_id and intership_id combination unique
	id int auto_increment primary key,
	internship_id int,
	student_id int,
	portfolio text,
	comment text,
	status enum("accepted", "rejected", "shortlisted"),
	foreign key (student_id) references student(id),
	foreign key (internship_id) references internship(id) on delete cascade
);

insert into company values (null, "Company 1", "admin@test.com", "123");
insert into company values (null, "Company 2", "admin2", "");

insert into internship values (null, 1, "Internship 1", "Location 1", "remote", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 1, "Internship 2", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");
insert into internship values (null, 2, "Internship 3", "Location 1", "on-site", "Some skills", 12345.67, 365, "2025-07-01");

insert into student values (null, "John", "user@test.com", "123");
insert into student values (null, "Bob", "user2", "");

insert into application values (null, 1, 1, "test.pdf", "Comment", null);
insert into application values (null, 1, 2, "test.pdf", "Comment", null);
insert into application values (null, 1, 1, "test.pdf", "Comment", null);
insert into application values (null, 1, 2, "test.pdf", "Comment", null);
insert into application values (null, 2, 2, "test.pdf", "Comment", null);