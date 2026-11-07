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
- Arduino AtMega328p
- Arduino C++
- DHT22
- HC-SR501
- Buzzer
- Wi-Fi

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
smart_home_monitor/
├── client/frontend/                # Interfața web statică
├── server/backend/                 # API Express și conexiunea MySQL
├── smart_home_old_version/
│   └── smart_home/                 # Varianta ESP32 cu DHT11
├── smart_home_new_protocol/
│   ├── ATmega328P/                 # Citire DHT22/PIR și transmisie UART
│   └── arduino_receiver/           # ESP32: recepție UART, HTTP și RFID
├── package.json                   # Dependențe folosite și de backend
└── README.md
```
Varianta veche citește senzorii direct pe ESP32. Varianta nouă separă
citirea senzorilor pe ATmega328P de comunicarea Wi-Fi pe ESP32.

## Configurare și rulare

### Backend

Ai nevoie de Node.js, npm și un server MySQL pornit.
Backend-ul a fost verificat în mediul cloud cu Node.js 24.

#### Baza de date

Execută următoarele comenzi într-un client MySQL.
Schema de mai jos este o schemă minimă pentru dezvoltare, corespunzătoare
interogărilor actuale din backend.

```sql
CREATE DATABASE IF NOT EXISTS smart_home

USE smart_home;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  rfid_tag VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS sensors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  temperatura DOUBLE NOT NULL,
  umiditate DOUBLE NOT NULL,
  miscare BOOLEAN NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
Creează un utilizator de bază de date dedicat aplicației și acordă-i
drepturile necesare asupra bazei `smart_home`. Evită folosirea contului
administrativ al bazei de date pentru aplicație.

#### Variabile de mediu

Creează `server/backend/.env`:

```env
DB_HOST=127.0.0.1
DB_USER=utilizatorul_mysql
DB_PASSWORD=parola_utilizatorului_mysql
DB_NAME=smart_home
JWT_SECRET=inlocuieste_cu_un_secret_random_lung
PORT=8000
```
#### Instalare și pornire

Execută din rădăcina proiectului:

```bash
npm ci
npm ci --prefix server/backend
cd server/backend
npm start
```

Sunt necesare ambele instalări: backend-ul folosește și dependențe
declarate în `package.json` din rădăcină.

Deschide `http://localhost:8000/login.html`.

Frontend-ul este servit direct de Express din `client/frontend`;
nu necesită un server separat sau o comandă de build.
### Firmware

#### Varianta veche: ESP32 și DHT11

Deschide `smart_home_old_version/smart_home/smart_home.ino`.

Copiază `secrets.example.h` în `secrets.h`, în același director,
și completează `WIFI_SSID` și `WIFI_PASS`.

Actualizează adresa din `client.begin(...)` astfel încât să indice
IP-ul calculatorului care rulează backend-ul și ruta `/api/senzori`.

#### Varianta nouă: ATmega328P și ESP32

Firmware-ul pentru ATmega328P se află în
`smart_home_new_protocol/ATmega328P/arduino_esp_serial.ino`.
Acesta folosește DHT22 și transmite date prin UART la 9600 baud.

Firmware-ul ESP32 se află în
`smart_home_new_protocol/arduino_receiver/esp_arduino_serial.ino`.

Creează în directorul ESP32 fișierul `secrets.h`:

```cpp
#define WIFI_SSID "numele-retelei"
#define WIFI_PASSWORD "parola-retelei"
#define SERVER_URL "http://192.168.1.100:8000"
```

Înlocuiește IP-ul cu adresa calculatorului care rulează backend-ul.
`SERVER_URL` nu trebuie să includă `/api/senzori` sau slash final.

Exemplul `secrets.example.h` din varianta nouă trebuie adaptat:
codul folosește `WIFI_PASSWORD` și `SERVER_URL`.

Instalează bibliotecile necesare sketch-ului ales, inclusiv
ArduinoJson și biblioteca DHT. Varianta RFID folosește și MFRC522.

ESP32 trebuie să poată accesa backend-ul prin rețea.
Adresa `localhost` pe ESP32 nu indică serverul de pe calculator.

## API principal

| Metodă | Rută                | Descriere                                   | Autentificare    |
| ------ | ------------------- | ------------------------------------------- | ---------------- |
| `POST` | `/api/register`     | Creează un utilizator                       | Nu               |
| `POST` | `/api/login`        | Autentifică un utilizator și returnează JWT | Nu               |
| `GET`  | `/api/verify-token` | Verifică token-ul curent                    | Bearer JWT       |
| `GET`  | `/api/senzori`      | Returnează ultimele date ale senzorilor     | Bearer JWT       |
| `GET`  | `/api/istoric`      | Returnează istoricul măsurătorilor          | Bearer JWT       |
| `GET`  | `/api/evenimente`   | Returnează evenimentele serverului          | Bearer JWT       |
| `GET`  | `/api/status-esp`   | Verifică dacă ESP32 a comunicat recent      | Nu               |
| `POST` | `/api/senzori`      | Primește date de la ESP32                   | Dispozitiv local |

Pentru rutele protejate, clientul trimite:

```text
Authorization: Bearer <token>
```
