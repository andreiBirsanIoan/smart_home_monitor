# Smart Home Monitor

Proiect IoT complet: ESP32 citește senzori și trimite date către un server Express

## Ce face
-Citește temperatura de la un senzor DHT11 și mișcare (senzor real HC-SR501)
-Alarmă (LED + buzzer) când temperatura trece de un prag reglabil manual (potențiometru)
-Afișare live pe ecran OLED, direct pe dispozitiv
-Trimite date către server prin HTTP POST (JSON)
-Server-ul salvează datele în MySQL și le pune la dispoziție printr-un API
-Pagina WEB afișează datele curente, actualizate live

## Tehnologii
-**Hardware**: ESP32, HC-SR501, buzzer, potențiometru, OLED SSD1306
-**Backend**: Node.js, Express, MySQL (mysql2)
-**Frontend**: HTML, JavaScript (fetch API)

## Cum rulează

### Server
1. `cd server`
2. `npm install`
3. Creezi un fișier `.env` cu:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=parola_ta
DB_NAME=smart_home

4. `node server.js`

### ESP32
1. Deschizi `esp32/smart_home.ino` în Arduino IDE
2. Actualizezi `ssid` și `password` cu datele tale WiFi
3. Actualizezi IP-ul serverului în `client.begin(...)`
4. Încarci codul pe placă

## Ce urmează
- Senzor real de temperatură (DHT11)
- Istoric de date + grafic
- Control automat de ventilator (releu)
- Faza 2: comunicare criptată între componente
