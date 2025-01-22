CREATE DATABASE IF NOT EXISTS plate_db;

USE plate_db;

CREATE TABLE plate (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate VARCHAR(50) NOT NULL,
    ID_car VARCHAR(50) UNIQUE NOT NULL,
    register_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    car_color VARCHAR(50),
    image BLOB
);


CREATE TABLE alarms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mac VARCHAR(25) NOT NULL,
    deviceName VARCHAR(50) NOT NULL,
    sn VARCHAR(25) NOT NULL,
    register_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(25) NOT NULL,

    eventId INT,
    targetId INT,
    status VARCHAR(50),

    alarmType VARCHAR(50),

    sex VARCHAR(10),

    enterPersonCount INT,
    leavePersonCount INT,
    existPersonCount INT,


    plate VARCHAR(50),
    carId VARCHAR(50) UNIQUE,
    car_color VARCHAR(50),

    image BLOB

);
