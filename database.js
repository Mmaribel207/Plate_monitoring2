import mysql from 'mysql2';

const pool = mysql.createPool({
    host: 'db', 
    user: 'root',
    password: 'rootpassword',
    database: 'plate_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});


function saveData(plateNumber, vehiceId, colorCar, plateimage) {
    const query = `INSERT INTO plate (plate, ID_car, car_color, image) VALUES (?, ?, ?, ?)`;

    let imageBuffer = null;
    if (plateimage) {
        imageBuffer = Buffer.from(plateimage, 'base64');
    }

    pool.query(query, [plateNumber, vehiceId, colorCar, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}
/*
id INT AUTO_INCREMENT PRIMARY KEY,
    mac VARCHAR(25) UNIQUE NOT NULL,
    deviceName VARCHAR(50) NOT NULL,
    sn VARCHAR(25) NOT NULL,
    register_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(25) NOT NULL,

    eventId INT,
    targerId INT,
    id_rect INT,
    status VARCHAR(50),

    alarmType VARCHAR(50),

    sex VARCHAR(10),

    enterPersonCount INT,
    leavePersonCount INT,
    existPersonCount INT,


    plate VARCHAR(50),
    ID_car VARCHAR(50) UNIQUE,
    car_color VARCHAR(50),

    image BLOB,

    Foreign Key (id_rect) REFERENCES rect(id_rect)
*/
function saveRect(x1, y1, x2, y2){
    const query = `INSERT INTO rect (x1, y1, x2, y2) VALUES (?, ?, ?, ?)`;
    pool.query(query, [x1, y1, x2, y2], (err, results) =>{
        if(err)
        {
            console.error('Error gurdando RECT en la base de datos: ', err);
        }else{
            console.log('Datos de RECT guardados correctamente: ', results);
        }
    });

}


function saveOSC(mac, deviceName, sn, type, eventId, targetId, status) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, targetId, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    pool.query(query, [mac, deviceName, sn, type, eventId, targetId, status], (err, results) => {
        if (err) {
            console.error('Error guardando OSC en la base de datos:', err);
        } else {
            console.log('Datos guardados OSC correctamente:', results);
        }
    });
}

function saveAVD(mac, deviceName, sn, type, eventId, status, alarmType) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, status, alarmType) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    pool.query(query, [mac, deviceName, sn, type, eventId, status, alarmType], (err, results) => {
        if (err) {
            console.error('Error guardando AVD en la base de datos:', err);
        } else {
            console.log('Datos AVD guardados correctamente:', results);
        }
    });
}

function savePEA(mac, deviceName, sn, type, eventId, targetId, status, image) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, targetId, status, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, eventId, targetId, status, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}


function saveObjectCounting(mac, deviceName, sn, type, eventId, targetId, status, image, enterPersonCount, leavePersonCount, existPersonCount) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, targetId, status, image, enterPersonCount, leavePersonCount, existPersonCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, eventId, targetId, status, imageBuffer, enterPersonCount, leavePersonCount, existPersonCount], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}


function saveVFD(mac, deviceName, sn, type, targetId, sex, image) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, targetId, sex, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, targetId, sex, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}

function saveVSDCar(mac, deviceName, sn, type, eventId, targetId, color, image) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, targetId, car_color, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, eventId, targetId, color, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}

function saveVSDPerson(mac, deviceName, sn, type, eventId, targetId, sex, image) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, eventId, targetId, sex, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, eventId, targetId, sex, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}

    
function saveLPR(mac, deviceName, sn, type, plate, carId, car_color, image) {
    const query = `INSERT INTO alarms (mac, deviceName, sn, type, plate, carId, car_color, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    let imageBuffer = null;
    if (image) {
        imageBuffer = Buffer.from(image, 'base64');
    }

    pool.query(query, [mac, deviceName, sn, type, plate, carId, car_color, imageBuffer], (err, results) => {
        if (err) {
            console.error('Error guardando en la base de datos:', err);
        } else {
            console.log('Datos guardados correctamente:', results);
        }
    });
}

export { saveData, savePEA, saveRect, saveAVD, saveOSC, saveObjectCounting, saveVFD, saveLPR, saveVSDCar, saveVSDPerson};
