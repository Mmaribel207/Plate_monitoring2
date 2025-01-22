import fs from 'fs';
import mysql from 'mysql2'
import { parseString } from "xml2js";
import { parseStringPromise } from 'xml2js'; 
import xml2js from 'xml2js';

import express from 'express';
import bodyParser from 'body-parser';

import { saveData,savePEA, saveAVD, saveOSC, saveObjectCounting, saveVFD, saveLPR, saveVSDCar,saveVSDPerson} from './database.js';
const app = express();

app.use(bodyParser.text({ type: 'application/xml', limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));


// Define the endpoint to receive XML
app.post('/SendAlarmData', (req, res) => {
    console.log('ENTRO');
    const xmlData = req.body; // The raw XML string from the request body
    console.log('¡Se detecto algo!');
    console.log('Solicitud recibida en /SendAlarmData:');
    //console.log('Solicitud recibida en /SendAlarmData:', req.body);

    //console.log(xmlData);
    //fs.writeFileSync("xmlData.txt",xmlData );
    
    parseString(xmlData, function (err, results) {
        if (err) {
            console.error("Error al parsear XML:", err);
        } else {
            // Convertir a JSON
            let data = JSON.stringify(results, null, 2);

            // Opcional: Guardar en un archivo JSON
           // fs.writeFileSync("output2.json", data);
           /*let mac, sn, deviceName = getDeviceInfo(results);
           let device = {
            'mac': mac,
            'sn':sn,
            'deviceName':deviceName
           }*/

           let type = '';
            // Checamos la alarma recibida
            const smartType = results?.config?.smartType?.[0]?._ || null; 
            console.log("Smart type: "+smartType);
            switch(smartType){
                //NUNCA RECIBIMOS MITOIN NI OSC
                case "MOTION":
                    console.log("MOTION alarm received: 3.3 ");
                    console.log("Resultados JSON:\n", data);
                    break;
                case "OSC":
                    console.log("OSC message received: 3.4 Item monitoring alarm");
                    console.log("Resultados JSON:\n", data);
                    break;
                
                case "AVD":
                    type = "Tampering alarm";
                    console.log("AVD alarm recieved:3.5 Tampering/Scene change/shifting alarm");
                    console.log("Resultados JSON:\n", data);
                    processAVD(results, type);
                    break;
                case "PEA":
                    type = "Line Crossing"
                    console.log("PEA alarm recieved: 3.6 Tripwire / line crossing alarm");
                  
                    console.log("Resultados JSON:\n", data);
                    processPEA(results, type);
                    break;
                case "AOIENTRY":
                    type = "Area Entry alarm"
                    console.log("AOIENTRY alarm recieved:3.7 Area Entry alarm");
                    
                    console.log("Resultados JSON:\n", data);
                    processAOIENTRY(results, type);
                    break;
                case "AOILEAVE":
                    type = "Area Exit alarm"
                    console.log("AOILEAVE alarm recieved:3.8 Area Exit alarm");
                    
                    console.log("Resultados JSON:\n", data);
                    processAOILEAVE(results, type);
                    break;
                case "PASSLINECOUNT":
                    type = "Passline Count"
                    console.log("PASSLINECOUNT alarm recieved:3.9 Object counting - line (Passline)");
                    
                    console.log("Resultados JSON:\n", data);
                    processPassline(results, type);
                    break;
                case "TRAFFIC":
                    type = "Area (Traffic)"
                    console.log("TRAFFIC alarm recieved:3.10 Object counting – area (Traffic)");
                    
                    console.log("Resultados JSON:\n", data);
                    processTraffic(results, type);
                    break;
                case "VFD":
                    type = "Video Face Detection";
                    console.log("VFD alarm recieved:3.12 Video face detection");
                    
                    console.log("Resultados JSON:\n", data);
                    
                    processVFD(results, type);
                    break;
                case "VSD":
                    type = "Meta Data";
                    console.log("VSD alarm recieved:Meta Data");
                    
                    console.log("Resultados JSON:\n", data);
                    
                    processVSD(results, type);
                    break;

                case "VEHICE":
                    type = "License Plate Recognition";
                    console.log("LICENSE PLATE RECEIVED")
                    console.log("Resultados JSON:\n", data);
                    //
                    //processResults(results);
                    processLPR(results, type);
                    break;
            }
        }
    });
    // Respond to the sender
    res.send('XML received successfully');
});



function getDeviceInfo(results){

    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;
    const subscribeOption = results?.config?.subscribeOption?.[0]?._ || null;

    return mac, sn, deviceName;
}

function processVSD(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    let infoItems = null;
    infoItems = Array.isArray(results?.config?.vsd?.[0]?.vsdInfo?.[0]?.item)
        ? results.config.vsd[0].vsdInfo[0].item
        : results?.config?.vsd?.[0]?.vsdInfo?.[0]?.item ? [results.config.vsd[0].vsdInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de cruce de línea para TRESPASSING.");
        return;
       
    }

    const processedData = [];
    let eventId = null;
    let targetId = null;
    let boundary = null;
    let currentDate = null;
    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        boundary = item.boundary?.[0]?.$?.[0]?.count || null;
        currentDate = new Date();
      
    });

    //FOR IMAGE
    let image = null;
    let plateimage = null;
    if (Array.isArray(results?.config?.vsd?.[0]?.targetImageData?.[0]?.targetBase64Data) && results.config.vsd[0].targetImageData[0].targetBase64Data[0]?._) {
        plateimage = results.config.vsd[0].targetImageData[0].targetBase64Data[0]?._;
        console.log("I HAVE SEEN AN IMAGE");

        if (typeof plateimage === 'string') {
            plateimage = plateimage.replace(/[\r\n]/g, '').trim();

            const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
            const imagePath = targetId
                ? `passline_${targetId}.jpg` 
                : null; 
            fs.writeFileSync(imagePath, imageBuffer); 
        }
    } else {
        console.log(`Imagen no encontrada`);
    }
    image = plateimage;

    /////////////////////////////
    //TARGE TYPE ATTIRBUTE MAY BE DIFFERENT IF ITS A CAR OR BIKE
    
    let items = null;
    const targetType = results?.config?.vsd?.[0]?.targetImageData?.[0]?.targetType?.[0]?._ || null;
    console.log("This is before checking out what it detected");
    console.log("Target type: ", targetType);
    if(targetType == "person"){
        console.log("That's rigth, i am a person");

        items = Array.isArray(results?.config?.vsd?.[0]?.targetImageData?.[0]?.personAttr)
        ? results.config.vsd[0].targetImageData[0].personAttr
        : results?.config?.vsd?.[0]?.targetImageData?.[0]?.personAttr ? [results.config.vsd[0].targetImageData[0].personAttr] : [];

        if (items.length === 0) {
            console.log("No se encontró object passline count FOR IMAGE.");
            return;
        }
    
        items.forEach((item) => {
    
            let age = item.age?.[0]?._ || null;
            let backpack = item.backpack?.[0]?._ || null;
            let glasses = item.glasses?.[0]?._ || null;
            let hat = item.hat?.[0]?._ || null;
            let mask = item.mask?.[0]?._ || null;
            let sex = item.sex?.[0]?._ || null;
    
            let shoulderbag = item.shoulderbag?.[0]?._ || null;
            let skirt = item.skirt?.[0]?._ || null;
            let uppercolor = item.uppercolor?.[0]?._ || null;
            let upperlength = item.upperlength?.[0]?._ || null;
    
            saveVSDPerson(mac, deviceName, sn, type, eventId, targetId, sex, image);
        
    
           processedData.push({
                'Target Type' : targetType || null,
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName || null,
                'Event ID': eventId?.trim() || null,
                'Target ID': targetId?.trim() || null,
                'Boundary': boundary || null,
                'Fecha y hora': currentDate.toLocaleString(),
                'Type': type,
                'Imagen': image ? `Archivo guardado en target_${targetId?.trim().replace(/\s+/g, '_')}.jpg` : null,
                'Age': age,
                'Backpack': backpack,
                'Glasses': glasses,
                'Hat': hat,
                'Mask': mask,
                'Sex': sex,
                'Shoulderbag': shoulderbag,
                'Skirt': skirt,
                'Upper Color': uppercolor,
                'Upper Length': upperlength
            });
            
            // Imprimir todo el contenido de processedData
            console.log("Contenido de processedData:");
            console.log(JSON.stringify(processedData, null, 2));
        
     
           
        });

    }
    if(targetType == "car"){
        console.log("Vroom vroom, this is a car");

        items = Array.isArray(results?.config?.vsd?.[0]?.targetImageData?.[0]?.carAttr)
        ? results.config.vsd[0].targetImageData[0].carAttr
        : results?.config?.vsd?.[0]?.targetImageData?.[0]?.carAttr ? [results.config.vsd[0].targetImageData[0].carAttr] : [];

        if (items.length === 0) {
            console.log("No se encontró object passline count FOR IMAGE.");
            return;
        }
    
        items.forEach((item) => {
    
            let year = item.year?.[0]?._ || null;
            let carType = item.type?.[0]?._ || null;
            let color = item.color?.[0]?._ || null;
            let brand = item.brand?.[0]?._ || null;
            let model = item.model?.[0]?._ || null;

            saveVSDCar(mac, deviceName, sn, type, eventId, targetId, color, image);
        
           processedData.push({
            'Target Type' : targetType || null,
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName || null,
                'Event ID': eventId.trim(),
                'Target ID': targetId.trim() || null,
                'Status': status || null,
                'Fecha y hora': currentDate.toLocaleString(),
                'Type': type,
                'Imagen': image ? `Archivo guardado en target_${targetId.trim().replace(/\s+/g, '_')}.jpg` : null,
                'Year': year,
                'Car Type': carType,
                'Color': color,
                'Brand': brand,
                'Model': model
            });
            
            // Imprimir el contenido completo de processedData para verificar
            console.log("Contenido de processedData para carro:");
            console.log(JSON.stringify(processedData, null, 2));
           
        });
    }
    
    

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de cruce de línea.");
    }
}

function processVFD(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;


    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
        ? results.config.listInfo[0].item
        : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        console.log("No se encontró ninguna cara/persona.");
        return;
    }

    const itemsData = [];
    items.forEach((item) => {
        const targetId = item.targetId?.[0]?._ || null; 
        const age = item.age?.[0]?._ || null; 
        const sex = item.sex?.[0]?._ || null; 
        const currentDate = new Date();

        let image = null;
        let plateimage = null;
        if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
            plateimage = item.targetImageData[0].targetBase64Data[0]._;

            if (typeof plateimage === 'string') {
                plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                const imagePath = targetId 
                    ? `vfd_${targetId}.jpg` 
                    : null; 
                fs.writeFileSync(imagePath, imageBuffer); 
            }
        } else {
            console.log(`Imagen no encontrada`);
        }
        image = plateimage;
        saveVFD(mac, deviceName, sn, type, targetId, sex, image);
        
       
            itemsData.push({
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName|| null,
                'Type': type,
                'targetId ': targetId || null,
                'Age': age?.trim() || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'sex': sex || null,
                'Imagen': image ? `Archivo guardado en placa_${targetId.trim().replace(/\s+/g, '_')}.jpg` : null
            });

            
    });

    if (itemsData && itemsData.length > 0) {
        console.log("Items Data:", itemsData);
    } else {
        console.log("No se pudo procesar información de VFD");
   
    }  
}

function processTraffic(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    console.log("All good here 1")
    const enterCarCount =  results?.config?.traffic?.[0]?.enterCarCount?.[0]?._ || null;
    const enterPersonCount =  results?.config?.traffic?.[0]?.enterPersonCount?.[0]?._ || null;
    const enterBikeCount =  results?.config?.traffic?.[0]?.enterBikeCount?.[0]?._ || null;

    const leaveCarCount =  results?.config?.traffic?.[0]?.leaveCarCount?.[0]?._ || null;
    const leavePersonCount =  results?.config?.traffic?.[0]?.leavePersonCount?.[0]?._ || null;
    const leaveBikeCount =  results?.config?.traffic?.[0]?.leaveBikeCount?.[0]?._ || null;

    const existCarCount =  results?.config?.traffic?.[0]?.existCarCount?.[0]?._ || null;
    const existPersonCount =  results?.config?.traffic?.[0]?.existPersonCount?.[0]?._ || null;
    const existBikeCount =  results?.config?.traffic?.[0]?.existBikeCount?.[0]?._ || null;
    console.log("Enter person count: ", enterPersonCount);

    
    const infoItems = Array.isArray(results?.config?.traffic?.[0]?.trafficInfo?.[0]?.item)
        ? results.config.traffic[0].trafficInfo[0].item
        : results?.config?.traffic?.[0]?.trafficInfo?.[0]?.item ? [results.config.traffic[0].trafficInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de passline count.");
        return;
    }
    const processedData = [];

    let eventId =null;
    let targetId = null;
    let status = null;
    let currentDate = null;
    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        status = item.status?.[0]?._ || null;

        currentDate = new Date();
        console.log("TargetId")

    });

       const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
       ? results.config.listInfo[0].item
       : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

        if (items.length === 0) {
            console.log("No se encontró object passline count FOR IMAGE.");
            return;
        }

        
        items.forEach((item) => {

            let image = null;
            let plateimage = null;
            if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
                plateimage = item.targetImageData[0].targetBase64Data[0]._;
                console.log("I HAVE SEEN AN IMAGE");

                if (typeof plateimage === 'string') {
                    plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                    const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                    const imagePath = targetId
                        ? `passline_${targetId}.jpg` 
                        : null; 
                    fs.writeFileSync(imagePath, imageBuffer); 
                }
            } else {
                console.log(`Imagen no encontrada`);
            }
            image = plateimage;
            console.log("An image should have be.....somwhere")

            saveObjectCounting(mac, deviceName, sn, type, eventId, targetId, status, image, enterPersonCount, leavePersonCount, existPersonCount);
            
             processedData.push({
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName|| null,
                'Type': type,
                'Event ID': eventId.trim(),
                'Target ID':targetId.trim() || null,
                'Status': status || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'enterCarCount':enterCarCount || null,
                'enterPersonCount':enterPersonCount || null,
                'enterBikeCount':enterBikeCount || null,
                'leaveCarCount':leaveCarCount || null,
                'leavePersonCount':leavePersonCount || null,
                'leaveBikeCount':leaveBikeCount || null,
                'existCarCount':existCarCount || null,
                'existPersonCount':existPersonCount || null,
                'existBikeCount':existBikeCount || null,
                'Imagen': image ? `Archivo guardado en target.jpg` : null,
              });
            });
        

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de passline count");
    }
}

function processPassline(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    console.log("All good here 1")
    const enterCarCount =  results?.config?.passLineCount?.[0]?.enterCarCount?.[0]?._ || null;
    const enterPersonCount =  results?.config?.passLineCount?.[0]?.enterPersonCount?.[0]?._ || null;
    const enterBikeCount =  results?.config?.passLineCount?.[0]?.enterBikeCount?.[0]?._ || null;

    const leaveCarCount =  results?.config?.passLineCount?.[0]?.leaveCarCount?.[0]?._ || null;
    const leavePersonCount =  results?.config?.passLineCount?.[0]?.leavePersonCount?.[0]?._ || null;
    const leaveBikeCount =  results?.config?.passLineCount?.[0]?.leaveBikeCount?.[0]?._ || null;

    const existCarCount =  results?.config?.passLineCount?.[0]?.existCarCount?.[0]?._ || null;
    const existPersonCount =  results?.config?.passLineCount?.[0]?.existPersonCount?.[0]?._ || null;
    const existBikeCount =  results?.config?.passLineCount?.[0]?.existBikeCount?.[0]?._ || null;
    console.log("Enter person count: ", enterPersonCount);

    
    const infoItems = Array.isArray(results?.config?.passLineCount?.[0]?.passLineCountInfo?.[0]?.item)
        ? results.config.passLineCount[0].passLineCountInfo[0].item
        : results?.config?.passLineCount?.[0]?.passLineCountInfo?.[0]?.item ? [results.config.passLineCount[0].passLineCountInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de passline count.");
        return;
    }
    const processedData = [];

    let eventId =null;
    let targetId = null;
    let status = null;
    let currentDate = null;
    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        status = item.status?.[0]?._ || null;

        currentDate = new Date();
        console.log("TargetId")

    });

       const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
       ? results.config.listInfo[0].item
       : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

        if (items.length === 0) {
            console.log("No se encontró object passline count FOR IMAGE.");
            return;
        }

        
        items.forEach((item) => {

            let image = null;
            let plateimage = null;
            if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
                plateimage = item.targetImageData[0].targetBase64Data[0]._;
                console.log("I HAVE SEEN AN IMAGE");

                if (typeof plateimage === 'string') {
                    plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                    const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                    const imagePath = targetId
                        ? `passline_${targetId}.jpg` 
                        : null; 
                    fs.writeFileSync(imagePath, imageBuffer); 
                }
            } else {
                console.log(`Imagen no encontrada`);
            }
            image = plateimage;
            console.log("An image should have be.....somwhere")

            saveObjectCounting(mac, deviceName, sn, type, eventId, targetId, status, image, enterPersonCount, leavePersonCount, existPersonCount);
            
              let some= {
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName|| null,
                'Type': type,
                'Event ID': eventId.trim(),
                'Target ID':targetId.trim() || null,
                'Status': status || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'enterCarCount':enterCarCount || null,
                'enterPersonCount':enterPersonCount || null,
                'enterBikeCount':enterBikeCount || null,
                'leaveCarCount':leaveCarCount || null,
                'leavePersonCount':leavePersonCount || null,
                'leaveBikeCount':leaveBikeCount || null,
                'existCarCount':existCarCount || null,
                'existPersonCount':existPersonCount || null,
                'existBikeCount':existBikeCount || null,
                'Imagen': image ? `Archivo guardado en target.jpg` : null,
              };
            
             console.log("COME OOOOOOON --- Datos procesados:", some);
              
             processedData.push({
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName|| null,
                'Type': type,
                'Event ID': eventId.trim(),
                'Target ID':targetId.trim() || null,
                'Status': status || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'enterCarCount':enterCarCount || null,
                'enterPersonCount':enterPersonCount || null,
                'enterBikeCount':enterBikeCount || null,
                'leaveCarCount':leaveCarCount || null,
                'leavePersonCount':leavePersonCount || null,
                'leaveBikeCount':leaveBikeCount || null,
                'existCarCount':existCarCount || null,
                'existPersonCount':existPersonCount || null,
                'existBikeCount':existBikeCount || null,
                'Imagen': image ? `Archivo guardado en target.jpg` : null,
              });
            });
        

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de passline count");
    }
}

function processAOILEAVE(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    const infoItems = Array.isArray(results?.config?.iveAoiLeave?.[0]?.aoiInfo?.[0]?.item)
        ? results.config.iveAoiLeave[0].aoiInfo[0].item
        : results?.config?.iveAoiLeave?.[0]?.aoiInfo?.[0]?.item ? [results.config.iveAoiLeave[0].aoiInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de entrada al area.");
        return;
    }

    const processedData = [];
    let eventId = null;
    let targetId = null;
    let status = null;
    let boundary = null;
    let currentDate = null;

    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        status = item.status?.[0]?._ || null;

        boundary = item.boundary?.[0]?.$?.[0]?.count || null;
        console.log("Boundary: ", boundary);

        currentDate = new Date();
    
        // mac, deviceName, sn, type, eventId, targetId, status, imag
    });

    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
    ? results.config.listInfo[0].item
    : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        console.log("No se encontró object passline count FOR IMAGE.");
        return;
    }

    items.forEach((item) => {

        let image = null;
        let plateimage = null;
        if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
            plateimage = item.targetImageData[0].targetBase64Data[0]._;
            console.log("I HAVE SEEN AN IMAGE");

            if (typeof plateimage === 'string') {
                plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                const imagePath = targetId
                    ? `passline_${targetId}.jpg` 
                    : null; 
                fs.writeFileSync(imagePath, imageBuffer); 
            }
        } else {
            console.log(`Imagen no encontrada`);
        }
        image = plateimage;

        savePEA(mac, deviceName, sn, type, eventId, targetId, status, image);
    

        processedData.push({
            'Mac': mac || null,
            'Sn': sn || null,
            'Device Name': deviceName|| null,
            'Event ID': eventId.trim(),
            'Target ID':targetId.trim() || null,
            'Status': status || null,
            'Fecha y hora' : currentDate.toLocaleString(),
            'Type': type,
            'Imagen': image ? `Archivo guardado en target_${targetId.trim().replace(/\s+/g, '_')}..jpg` : null,
         });
       
    });

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de cruce de línea.");
    }
}

function processAOIENTRY(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    const infoItems = Array.isArray(results?.config?.iveAoiEntry?.[0]?.aoiInfo?.[0]?.item)
        ? results.config.iveAoiEntry[0].aoiInfo[0].item
        : results?.config?.iveAoiEntry?.[0]?.aoiInfo?.[0]?.item ? [results.config.iveAoiEntry[0].aoiInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de entrada al area.");
        return;
    }

    const processedData = [];
    let eventId = null;
    let targetId = null;
    let status = null;
    let boundary = null;
    let currentDate = null;

    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        status = item.status?.[0]?._ || null;

        boundary = item.boundary?.[0]?.$?.[0]?.count || null;

        currentDate = new Date();
    
        // mac, deviceName, sn, type, eventId, targetId, status, imag
    });

    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
    ? results.config.listInfo[0].item
    : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        console.log("No se encontró object passline count FOR IMAGE.");
        return;
    }

    items.forEach((item) => {

        let image = null;
        let plateimage = null;
        if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
            plateimage = item.targetImageData[0].targetBase64Data[0]._;
            console.log("I HAVE SEEN AN IMAGE");

            if (typeof plateimage === 'string') {
                plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                const imagePath = targetId
                    ? `passline_${targetId}.jpg` 
                    : null; 
                fs.writeFileSync(imagePath, imageBuffer); 
            }
        } else {
            console.log(`Imagen no encontrada`);
        }
        image = plateimage;

        savePEA(mac, deviceName, sn, type, eventId, targetId, status, image);
    

        processedData.push({
            'Mac': mac || null,
            'Sn': sn || null,
            'Device Name': deviceName|| null,
            'Event ID': eventId.trim(),
            'Target ID':targetId.trim() || null,
            'Status': status || null,
            'Fecha y hora' : currentDate.toLocaleString(),
            'Type': type,
            'Imagen': image ? `Archivo guardado en target_${targetId.trim().replace(/\s+/g, '_')}..jpg` : null,
         });
       
    });

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de cruce de línea.");
    }
}

function processPEA(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    let infoItems = null;
    infoItems = Array.isArray(results?.config?.tripwire?.[0]?.tripInfo?.[0]?.item)
        ? results.config.tripwire[0].tripInfo[0].item
        : results?.config?.tripwire?.[0]?.tripInfo?.[0]?.item ? [results.config.tripwire[0].tripInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró información de cruce de línea para TRESPASSING.");
        infoItems = Array.isArray(results?.config?.perimeter?.[0]?.perInfo?.[0]?.item)
        ? results.config.perimeter[0].perInfo[0].item
        : results?.config?.perimeter?.[0]?.perInfo?.[0]?.item ? [results.config.perimeter[0].perInfo[0].item] : [];
        
        if (infoItems.length === 0) {
            console.log("No se encontró información de cruce de línea para Sterile Area.");
            return;
        }else{
            type = "Sterile Area"
        }
       
    }

    const processedData = [];
    let eventId = null;
    let targetId = null;
    let status = null;
    let currentDate = null;
    infoItems.forEach((item) => {
        eventId = item.eventId?.[0]?._ || null;
        targetId = item.targetId?.[0]?._ || null;
        status = item.status?.[0]?._ || null;
        currentDate = new Date();
      
    });

    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
    ? results.config.listInfo[0].item
    : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        console.log("No se encontró object passline count FOR IMAGE.");
        return;
    }

    items.forEach((item) => {

        let image = null;
        let plateimage = null;
        if (Array.isArray(item.targetImageData?.[0]?.targetBase64Data) && item.targetImageData[0].targetBase64Data[0]?._) {
            plateimage = item.targetImageData[0].targetBase64Data[0]._;
            console.log("I HAVE SEEN AN IMAGE");

            if (typeof plateimage === 'string') {
                plateimage = plateimage.replace(/[\r\n]/g, '').trim();

                const imageBuffer = Buffer.from(plateimage, 'base64'); //Buffer es una representación binaria de esos datos que se puede manipular y guardar como archivos binarios.
                const imagePath = targetId
                    ? `passline_${targetId}.jpg` 
                    : null; 
                fs.writeFileSync(imagePath, imageBuffer); 
            }
        } else {
            console.log(`Imagen no encontrada`);
        }
        image = plateimage;

        savePEA(mac, deviceName, sn, type, eventId, targetId, status, image);
    

        processedData.push({
            'Mac': mac || null,
            'Sn': sn || null,
            'Device Name': deviceName|| null,
            'Event ID': eventId.trim(),
            'Target ID':targetId.trim() || null,
            'Status': status || null,
            'Fecha y hora' : currentDate.toLocaleString(),
            'Type': type,
            'Imagen': image ? `Archivo guardado en target_${targetId.trim().replace(/\s+/g, '_')}..jpg` : null,
         });
 
       
    });

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de cruce de línea.");
    }
}

function processAVD(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;

    const infoItems = Array.isArray(results?.config?.listInfo?.[0]?.item)
    ? results.config.listInfo[0].item
    : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (infoItems.length === 0) {
        console.log("No se encontró ningun item en AVD");
        return;
    }

    const processedData = [];
    infoItems.forEach((item) => {
        const eventId = item.eventId?.[0]?._ || null;
        const alarmType = item.alarmType?.[0]?._ || null;
        const status = item.status?.[0]?._ || null;
        const currentDate = new Date();
        // mac, deviceName, sn, type, eventId, targetId, status, image
        
        processedData.push({
           'Mac': mac || null,
           'Sn': sn || null,
           'Device Name': deviceName|| null,
           'Event ID': eventId.trim(),
           'Alarm type':alarmType.trim() || null,
           'Status': status || null,
           'Fecha y hora' : currentDate.toLocaleString(),
           'Type': type
        });

         saveAVD(mac, deviceName, sn, type, eventId, status, alarmType) 
    });

    if (processedData && processedData.length > 0) {
        console.log("Datos procesados:", processedData);
    } else {
        console.log("No se pudo procesar información de cruce de línea.");
    }
}

function processLPR(results, type) {
    const mac = results?.config?.mac?.[0]?._ ;
    const sn =  results?.config?.sn?.[0]?._ ;
    const deviceName =  results?.config?.deviceName?.[0]?._ || null;


    const items = Array.isArray(results?.config?.listInfo?.[0]?.item)
        ? results.config.listInfo[0].item
        : results?.config?.listInfo?.[0]?.item ? [results.config.listInfo[0].item] : [];

    if (items.length === 0) {
        console.log("No se encontró ninguna matrícula.");
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
                'Mac': mac || null,
                'Sn': sn || null,
                'Device Name': deviceName|| null,
                'Type': type,
                'Plate number': plateNumber.trim(),
                'Id carro': vehiceId?.trim() || null,
                'Fecha y hora' : currentDate.toLocaleString(),
                'Color carro': colorCar || null,
                'Imagen': plateimage ? `Archivo guardado en placa_${plateNumber.trim().replace(/\s+/g, '_')}.jpg` : null
            });

            saveData(plateNumber.trim(), vehiceId?.trim(), colorCar, plateimage); 
            saveLPR(mac, deviceName, sn, type, plateNumber.trim(), vehiceId?.trim(), colorCar, plateimage); 
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
