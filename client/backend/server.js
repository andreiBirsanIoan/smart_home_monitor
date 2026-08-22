import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import open from 'open'; 
import rateLimit from 'express-rate-limit';
import pool from './database.js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {verifyLogin} from './middleware/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//Când folosești helmet(), el blochează implicit încărcarea anumitor resurse externe 
// (cum ar fi scripturile Chart.js din CDN sau unele fonturi) prin antetul Content Security Policy (CSP). 
// De asemenea, helmet() trebuie apelat înainte de express.static('.').
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
// Permite CDN-uri externe (Chart.js etc.)
//app.use(xss());
const loginLimiter=rateLimit({
  windowMs:1 * 60 * 1000, 
  max:10,
  message: {error: 'Prea multe incercari. Asteapta 1 minut!' }
});
let senzoriData = {};//obiect, nu vector/array
let pragCurent=25;
let ultimaComunicare;
let loguriEvenimente=[];
function adaugaLogServer(tip,mesaj,valoare){
  const oraActuala=new Date().toLocaleTimeString();
  loguriEvenimente.unshift({
    ora:oraActuala,
    tip:tip,
    mesaj:mesaj,
    valoare:valoare
  })
  if(loguriEvenimente.length>20){
    loguriEvenimente.pop();
  }
}
app.get('/',(req,res)=>{
  res.redirect('/login.html');
});
app.post('/api/senzori', async(req, res) => {
  ultimaComunicare=Date.now();
  if(req.body.prag!==undefined){
    pragCurent=parseFloat(req.body.prag);
    return res.json({status:'prag actualizat', prag:pragCurent});
  }
  senzoriData = req.body;
  const {temperatura, umiditate, miscare}=req.body;
  ultimaComunicare=Date.now();
  if(temperatura>pragCurent){
    adaugaLogServer('ALERT', `Prag depasit! Temperatura peste ${pragCurent}°C`, `${temperatura} °C`);

  }
  else if(temperatura>=pragCurent-2){
    adaugaLogServer('WARN', `Prag depășit! Temp peste ${pragCurent}°C`, `${temperatura} °C`);
  }
  else if (miscare === true) {
        adaugaLogServer('WARN', 'Mișcare detectată în incintă', 'PIR ACTIV');
    } 
    else {
        adaugaLogServer('INFO', 'Pachet date recepționat cu succes', `${temperatura} °C`);
    }
  try{
  await pool.query(`INSERT INTO sensors(temperatura,miscare,umiditate) VALUES(?,?,?)`,[senzoriData.temperatura,senzoriData.miscare,senzoriData.umiditate]);
  }catch(err){
    console.error("Eroare la salvarea datelor in DB:",err);  
  }
      res.json({ success: true, prag: pragCurent });

});
app.get('/api/status-esp',async(req,res)=>{
  const secundeTrecute=(Date.now()-ultimaComunicare)/1000;
  if(secundeTrecute<10){
    res.json({online:true});
  }
  else{
    res.json({online:false});
  }
});

app.get('/api/senzori',verifyLogin, (req, res) => {
  res.json(senzoriData);
});
app.get('/api/evenimente', (req, res) => {
    res.json(loguriEvenimente);
});
app.get('/api/istoric',verifyLogin, async(req,res)=>{
  const [rows]=await pool.query('SELECT * FROM sensors ORDER BY id DESC LIMIT 30');
  res.json(rows);
});
app.post('/api/register', async(req,res)=>{
  const {username,password}=req.body;
  const hashedPassword=await bcrypt.hash(password,10);
  await pool.query('INSERT INTO users(username,password) VALUES(?,?)',[username,hashedPassword]);
  res.json({status:'utilizator creat'});
});
app.post('/api/login',loginLimiter,async(req,res)=>{
  const{username, password}=req.body;
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  if(rows.length===0){
    return  res.status(400).json({status:'utilizator inexistent'});
  }
  const parolaCorecta=await bcrypt.compare(password,rows[0].password);
  if(!parolaCorecta){
    return res.status(401).json({status:'Parola incorecta'})
  }
  const token=jwt.sign(
    {userId:rows[0].id},
    process.env.JWT_SECRET,
    {expiresIn:'1h'}
  );
  return res.json({token:token});
})
const PORT = 8000;
app.listen(PORT, async () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
    
    // Deschide automat browserul la pornirea serverului! daca exista index il deschide ala

    await open(`http://localhost:${PORT}`);
});
export default app;