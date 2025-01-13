import fs from 'fs';
import mysql from 'mysql2'
import { parseString } from "xml2js"; 

import express from 'express';
import bodyParser from 'body-parser';
import { saveData } from './database.js';
const app = express();

app.use(bodyParser.text({ type: 'application/xml', limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

//crear docker
//crear bd 

// Define the endpoint to receive XML
app.post('/SendAlarmData', (req, res) => {
    //console.log('ENTRO');
    const xmlData = req.body; // The raw XML string from the request body
    //console.log('¡Se detecto algo!');
    //console.log(xmlData);
    fs.writeFileSync("xmlData.txt",xmlData );
    
    parseString(xmlData, function (err, results) {
        if (err) {
            console.error("Error al parsear XML:", err);
        } else {
            // Convertir a JSON
            let data = JSON.stringify(results, null, 2);

            // Mostrar resultados en JSON
            //console.log("Resultados JSON:\n", data);

            // Opcional: Guardar en un archivo JSON
            fs.writeFileSync("output2.json", data);

            // Aquí pasamos directamente los resultados del XML parseado
            processResults(results);
        }
    });
    // Respond to the sender
    res.send('XML received successfully');
});



function processResults(results) {
    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
        ? results.config.listInfo[0].item
        : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        //console.log("No se encontró ninguna matrícula.");
        return;
    }

    const itemsData = [];
    items.forEach((item) => {
        const plateNumber = item.plateNumber?.[0]?._ || null; 
        const vehiceId = item.vehiceId?.[0]?._ || null; 
        const colorCar = item.carAttr?.color?.[0]?._ || null; 
        const currentDate = new Date();

        let plateimage = null;
        if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
            plateimage = item.targetImageData[0].targetBase64Data[0]._;

            if (typeof plateimage === 'string') {
                plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                if (!plateNumber || plateNumber.trim() === "") {//aqui se checha si esta vacio la matricula
                    return; //salta al sigueinte elemento
                }
                const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                const imagePath = plateNumber 
                    ? `placa_${plateNumber}.jpg` 
                    : null; 
                fs.writeFileSync(imagePath, imageBuffer); 
            }
        } else {
            //console.log(`Imagen no encontrada`);
        }

        if (plateNumber && plateNumber.trim()) {
            itemsData.push({
                'Plate number': plateNumber.trim(),
                'Id carro': vehiceId?.trim() || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'Color carro': colorCar || null,
                'Imagen': plateimage ? `Archivo guardado en placa_${plateNumber.trim().replace(/\s+/g, '_')}.jpg` : null
            });

            saveData(plateNumber.trim(), vehiceId?.trim(), colorCar, plateimage);  
        }
    });

    if (itemsData && itemsData.length > 0) {
        console.log("Items Data:", itemsData);
    } else {
    }
    
    
}


 
// Configure IP and port
const IP_ADDRESS = '0.0.0.0';
const PORT = 3000;
app.listen(PORT, IP_ADDRESS, () => {
    console.log(`Server running at http://${IP_ADDRESS}:${PORT}/SendAlarmData`);
});
