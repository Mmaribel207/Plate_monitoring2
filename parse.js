// Filename - app.js

// Import File System Module
import fs from "fs"; 

// Import xml2js Module
import { parseString } from "xml2js"; 

// XML data (tu archivo XML completo como cadena)
var xmldata = `
<?xml version="1.0" encoding="UTF-8"?>
<config version="1.7" xmlns="http://www.ipc.com/ver10">
    <types>
        <openAlramObj>
            <enum>MOTION</enum>
            <enum>SENSOR</enum>
            <enum>PEA</enum>
            <enum>AVD</enum>
            <enum>OSC</enum>
            <enum>CPC</enum>
            <enum>CDD</enum>
            <enum>IPD</enum>
            <enum>VFD</enum>
            <enum>VFD_MATCH</enum>
            <enum>VEHICE</enum>
            <enum>AOIENTRY</enum>
            <enum>AOILEAVE</enum>
            <enum>PASSLINECOUNT</enum>
            <enum>TRAFFIC</enum>
            <enum>FALLING</enum>
            <enum>EA</enum>
            <enum>VSD</enum>
        </openAlramObj>
        <subscribeRelation>
            <enum>ALARM</enum>
            <enum>FEATURE_RESULT</enum>
            <enum>ALARM_FEATURE</enum>
        </subscribeRelation>
        <perStatus>
            <enum>SMART_NONE</enum>
            <enum>SMART_START</enum>
            <enum>SMART_STOP</enum>
            <enum>SMART_PROCEDURE</enum>
        </perStatus>
        <targetType>
            <enum>person</enum>
            <enum>car</enum>
            <enum>motor</enum>
        </targetType>
    </types>
    <smartType type="openAlramObj">VFD</smartType>
    <subscribeOption type="subscribeRelation">FEATURE_RESULT</subscribeOption>
    <currentTime type="tint64">1736362068600385</currentTime>
    <mac type="string"><![CDATA[84:11:c2:cd:33:35]]></mac>
    <sn type="string"><![CDATA[I33350V1246A]]></sn>
    <deviceName type="string"><![CDATA[I4-320IPEN-36-V4]]></deviceName>
    <sourceDataInfo>
        <dataType type="uint32">0</dataType>
        <width type="uint32">1280</width>
        <height type="uint32">720</height>
        <sourceBase64Length type="uint32">0</sourceBase64Length>
        <sourceBase64Data type="string"><![CDATA[]]></sourceBase64Data>
    </sourceDataInfo>
    <listInfo type="list" count="2">
        <item>
            <targetId type="uint32">1229</targetId>
            <Width type="uint32">1280</Width>
            <Height type="uint32">720</Height>
            <leftTop><x type="uint32">546</x><y type="uint32">322</y></leftTop>
            <rightTop><x type="uint32">606</x><y type="uint32">322</y></rightTop>
            <leftBottom><x type="uint32">546</x><y type="uint32">382</y></leftBottom>
            <rightBottom><x type="uint32">606</x><y type="uint32">382</y></rightBottom>
            <pose type="uint32">0</pose>
            <sex type="sexType">male</sex>
            <PosFaceImage><x type="uint32">562</x><y type="uint32">322</y></PosFaceImage>
            <feature_score type="float">0.00</feature_score>
            <eye_dist type="uint32">0</eye_dist>
            <blur type="uint32">0</blur>
            <pose_est_score type="uint32">0</pose_est_score>
            <illumination type="uint32">0</illumination>
            <faceliveness type="uint32">0</faceliveness>
            <completeness type="uint32">0</completeness>
            <comprehensive_score type="float">97.00</comprehensive_score>
            <targetImageData>
                <dataType type="uint32">0</dataType>
                <targetType type="targetType">person</targetType>
                <width type="uint32">60</width>
                <height type="uint32">60</height>
                <targetBase64Length type="uint32">0</targetBase64Length>
                <sourceBase64Data type="string"><![CDATA[]]></sourceBase64Data>
            </targetImageData>
        </item>
    </listInfo>
</config>
`;

// Parse XML data to JSON
parseString(xmldata, function (err, results) {
    if (err) {
        console.error("Error al parsear XML:", err);
    } else {
        // Convertir a JSON
        let data = JSON.stringify(results, null, 2);

        // Mostrar resultados en JSON
        console.log("Resultados JSON:\n", data);

        // Opcional: Guardar en un archivo JSON
        fs.writeFileSync("output.json", data);
    }
});
