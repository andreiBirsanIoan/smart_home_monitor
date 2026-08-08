import jwt from 'jsonwebtoken';
import 'dotenv/config';
export function verifyLogin(req,res,next){
   if(!req.headers.authorization){
    return res.status(401).json({status:'neautentificat'});
   }
   const token=req.headers.authorization.split(' ')[1];
   try{
    jwt.verify(token,process.env.JWT_SECRET);
    next();
   }
   catch(err){
    return res.status(401).json({error:'TOKEN LIPSA'});
   }
}