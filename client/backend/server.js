import express from 'express';
import helmet from 'helmet';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import pool from './database.js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import {verifyLogin} from './middleware/auth.js';
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
//Când folosești helmet(), el blochează implicit încărcarea anumitor resurse externe 
// (cum ar fi scripturile Chart.js din CDN sau unele fonturi) prin antetul Content Security Policy (CSP). 
// De asemenea, helmet() trebuie apelat înainte de express.static('.').
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // ← Asta servește fișierele din folder
// Permite CDN-uri externe (Chart.js etc.)
app.use(xss());
const loginLimiter=rateLimit({
  windowMs:1 * 60 * 1000,
  max:10,
  message: {error: 'Prea multe incercari. Asteapta 1 minut!' }
});
let senzoriData = {};//obiect, nu vector/array
app.post('/api/senzori', async(req, res) => {
  senzoriData = req.body;
  await pool.query(`INSERT INTO sensors(temperatura,miscare,umiditate) VALUES(?,?,?)`,[senzoriData.temperatura,senzoriData.miscare,senzoriData.umiditate]);
  res.json({ status: 'ok' });
});

app.get('/api/senzori',verifyLogin, (req, res) => {
  res.json(senzoriData);
});
app.get('/api/istoric',verifyLogin, async(req,res)=>{
  const [rows]=await pool.query('SELECT * FROM sensors ORDER BY id DESC LIMIT 5');
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
    return  res.json({status:'utilizator inexistent'});
  }
  const parolaCorecta=await bcrypt.compare(password,rows[0].password);
  if(!parolaCorecta){
    return res.json({status:'Parola incorecta'})
  }
  const token=jwt.sign(
    {userId:rows[0].id},
    process.env.JWT_SECRET,
    {expiresIn:'1h'}
  );
  return res.json({token:token});
})
app.listen(8000, () => console.log('Server pe port 8000'));