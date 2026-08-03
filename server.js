// //const express=require('express')
// //const app=express();
// //app.listen(5000);
// //app.post("/api/senzor",confirmare);
// import http from 'node:http'
// const PORT=8000
// const server=http.createServer((req,res)=>{
//     //res.end('Hello from the server!')//end trimite ceva prin http si inchide raspunsul
//     console.log(req.url);//calea cererii(ex:/api/senzori)
//     console.log(req.method);//tipul metodei(get,post etc.)
//     if(req.method==='POST' && req.url==='/api/senzori'){
//         let data='';
//         req.on('data',(chunk)=>{
//             data+=chunk;
//         });
//         req.on('end',()=>{
//             console.log('Datele primite:', data);
//             res.end('Am primit datele!');
//         });
                    
        
//     }
//     else{
//         res.end('Calea nu este buna!');
//     }
// })
// server.listen(PORT,()=>console.log(`Serverul ruleaza pe portul:${PORT}`))
import express from 'express';
import mysql from 'mysql2/promise';
import pool from './database.js';
const app = express();
app.use(express.json());
app.use(express.static('.')); // ← Asta servește fișierele din folder

let senzoriData = {};//obiect, nu vector/array

app.post('/api/senzori', async(req, res) => {
  senzoriData = req.body;
  
  await pool.query(`INSERT INTO sensors(temperatura,miscare) VALUES(?,?)`,[senzoriData.temperatura,senzoriData.miscare]);
  res.json({ status: 'ok' });
});

app.get('/api/senzori', (req, res) => {
  res.json(senzoriData);
});

app.listen(8000, () => console.log('Server pe port 8000'));