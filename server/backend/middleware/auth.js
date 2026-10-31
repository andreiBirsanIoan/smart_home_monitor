import jwt from "jsonwebtoken";
import "dotenv/config";

export function verifyLogin(req, res, next) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token de autentificare lipsă" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token invalid sau expirat" });
  }
}
export function verifyRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Utilizator neautentificat" });
  }
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ error: "Acces interzis. Necesita rol de admin" });
  }
  next();
}
