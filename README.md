# Smart Home Monitor

Sistem IoT pentru monitorizarea unei locuințe, construit cu ESP32, senzori
reali, un server web și o bază de date MySQL.

## Descriere

ESP32 citește temperatura, umiditatea și mișcarea, declanșează alarme locale și
trimite datele către backend prin Wi-Fi. Aplicația web afișează datele curente,
istoricul măsurătorilor, graficele și starea dispozitivului.

## Funcționalități

- Citirea temperaturii și umidității cu DHT11
- Detectarea mișcării cu HC-SR501
- Afișarea datelor pe ecran OLED
- Alarmă locală cu buzzer atunci când temperatura depășește pragul
- Comunicare ESP32–server prin HTTP și JSON
- Salvarea măsurătorilor în MySQL
- Dashboard web cu date live
- Grafice pentru temperatură și umiditate
- Istoric al măsurătorilor și al evenimentelor
- Înregistrare și autentificare utilizatori
- Parole protejate cu bcrypt
- Autentificare JWT pentru rutele protejate
- Rate limiting pentru autentificare
- Deep sleep pentru reducerea consumului ESP32

## Arhitectură

```text
ESP32 + DHT11 + HC-SR501 + OLED + buzzer
                    |
                    | Wi-Fi / HTTP JSON
                    v
          Node.js + Express API
                    |
                    v
                 MySQL
                    ^
                    |
          Dashboard web HTML/CSS/JavaScript
```

## Tehnologii

### Hardware și firmware

- ESP32
- Arduino C++
- DHT11
- HC-SR501
- OLED SSD1306
- Buzzer
- Wi-Fi
- Deep sleep

### Backend

- Node.js
- Express
- MySQL
- mysql2
- JSON Web Tokens
- bcrypt
- Helmet
- express-rate-limit

### Frontend

- HTML
- CSS
- JavaScript
- Fetch API
- Chart.js

## Structura proiectului

```text
smart_home_server/
├── client/frontend/          # Interfața web
├── server/backend/           # API-ul Express și conectarea la MySQL
├── esp32/smart_home/         # Codul pentru ESP32
└── README.md
```

## Configurare și rulare

### Backend

1. Instalează Node.js și MySQL.
2. Creează baza de date `smart_home` și tabelele necesare, inclusiv
   `users` și `sensors`.
3. Creează fișierul `server/backend/.env`:

   ```env
   DB_HOST=localhost
   DB_USER=utilizatorul_mysql
   DB_PASSWORD=parola_mysql
   DB_NAME=smart_home
   JWT_SECRET=un_secret_lung_si_random
   PORT=8000
   ```

4. Instalează dependențele și pornește serverul:

   ```powershell
   cd server/backend
   npm install
   npm start
   ```

5. Deschide în browser:

   ```text
   http://localhost:8000
   ```

Nu publica fișierul `.env` și nu folosi parola contului MySQL `root` într-un
mediu de producție.

### ESP32

1. Deschide `esp32/smart_home/smart_home.ino` în Arduino IDE.
2. Creează `esp32/smart_home/secrets.h`:

   ```cpp
   #define WIFI_SSID "numele-retelei"
   #define WIFI_PASS "parola-retelei"
   ```

3. Actualizează adresa serverului în `client.begin(...)` din
   `smart_home.ino`.
4. Selectează placa ESP32 și încarcă firmware-ul.

ESP32 și serverul trebuie să fie accesibile în aceeași rețea locală pentru
rularea proiectului în modul local.

## API principal

| Metodă | Rută | Descriere | Autentificare |
|---|---|---|---|
| `POST` | `/api/register` | Creează un utilizator | Nu |
| `POST` | `/api/login` | Autentifică un utilizator și returnează JWT | Nu |
| `GET` | `/api/verify-token` | Verifică token-ul curent | Bearer JWT |
| `GET` | `/api/senzori` | Returnează ultimele date ale senzorilor | Bearer JWT |
| `GET` | `/api/istoric` | Returnează istoricul măsurătorilor | Bearer JWT |
| `GET` | `/api/evenimente` | Returnează evenimentele serverului | Bearer JWT |
| `GET` | `/api/status-esp` | Verifică dacă ESP32 a comunicat recent | Nu |
| `POST` | `/api/senzori` | Primește date de la ESP32 | Dispozitiv local |

Pentru rutele protejate, clientul trimite:

```text
Authorization: Bearer <token>
```

## Testare

Backend-ul include Jest și SuperTest în dependențele de dezvoltare. Testele pot
fi rulate cu:

```powershell
cd server/backend
npm test
```

## Siguranță

- Folosește un `JWT_SECRET` lung și aleatoriu.
- Nu publica parolele Wi-Fi, parola bazei de date sau token-urile.
- Ține `.env` și `secrets.h` în afara repository-ului.
- Pentru deployment public, folosește HTTPS.
- Protejează endpoint-ul care primește date de la ESP32 cu o cheie de dispozitiv
  sau cu semnături HMAC.
- Folosește un utilizator MySQL cu permisiuni limitate.

## Idei pentru dezvoltare ulterioară

- Autentificare dedicată pentru ESP32
- Comunicare HTTPS între ESP32 și server
- Controlul automat al unui ventilator prin releu
- Notificări pentru alarme
- Deployment în cloud
- Backup automat pentru baza de date
