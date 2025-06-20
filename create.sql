drop database if exists project;
create database project;
use project;

create table company(
	id int auto_increment primary key,
	name text not null,
	email text not null unique,
	phone text,
	address text,
	description text,
	password text
);

create table internship (
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
);

create table student (
	id int auto_increment primary key,
	name text not null,
	email text not null unique,
	phone text,
	university text,
	major text,
	year int,
	bio text,
	password text
);

create table application (
	id int auto_increment primary key,
	internship_id int,
	student_id int,
	cv text,
	filename text,
	about text,
	status enum("Accepted", "Rejected", "Shortlisted"),
	foreign key (student_id) references student(id),
	foreign key (internship_id) references internship(id) on delete cascade
);

insert into company (name, email, password) values ("Company 1", "admin@test.com", "$2b$10$evvpvujR8eMihq6CpQn3jOHW/YH1ZD8FemSjlnksmQh5z8zQulcoG");
insert into company (name, email) values ("Company 2", "admin2@test.com");

insert into internship values (null, 1, "Test Internship 1", "Dubai", "On-site", "Some skills", 1200.99, 3, "2025-08-01", "Here is a description");
insert into internship values (null, 2, "Best Internship 2", "Abu Dhabi", "Remote", "Some skills", 500, 6, "2025-08-01", "Here is a description");

insert into student values (null, "John", "user@test.com", "+9710501234567", "Wollongong", "CS", 2, "My bio", "$2b$10$evvpvujR8eMihq6CpQn3jOHW/YH1ZD8FemSjlnksmQh5z8zQulcoG");
insert into student values (null, "John", "user2@test.com", "+9710501234567", "Wollongong", "CS", 2, "My bio", "123");

insert into application values (null, 1, 1, "test.pdf", "cv.pdf", "Description", null);
insert into application values (null, 1, 2, "test.pdf", "cv.pdf", "Description", null);