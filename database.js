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


export { saveData };
