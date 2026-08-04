import express from 'express';
import mysql from 'mysql2/promise';
import pool from './database.js';
import cors from 'cors';
const app = express();
app.use(cors());
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
app.get('/api/istoric', async(req,res)=>{
  const [rows]=await pool.query('SELECT * FROM sensors ORDER BY id DESC LIMIT 20');
  res.json(rows);
});
app.listen(8000, () => console.log('Server pe port 8000'));