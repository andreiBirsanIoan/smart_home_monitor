#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "soc/gpio_struct.h"
#include "sendRFID.h"
#include "secrets.h"
#define HEADER   0
#define UMID_INT 1
#define UMID_ZEC 2
#define TEMP_INT 3
#define TEMP_ZEC 4
#define PIR      5
#define LIGHT    6
#define CHECKSUM 7
#define BUZZ_PIN 25
#define RX2_PIN 16
#define TX2_PIN 17

// const char* ssid = "DIGI_df69a9";
// const char* password = "511076c0";
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;
const char* serverUrl = SERVER_URL;
int incercari=0;
bool pachetPregatit = false;
unsigned long ultimulOctet = 0;
const unsigned long TIMEOUT_UART = 100;
float prag = 30.0;//prag implicit de temperatura
const uint8_t SECRET=0x50;
int indexPachet=0;
bool gasit=false;
uint8_t pachet[8];
uint8_t decriptat[8];
void setup() {
   GPIO.enable_w1ts = (1 << BUZZ_PIN);
  GPIO.out_w1ts = (1 << BUZZ_PIN);
  Serial.begin(115200); // Pentru Serial
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN); // Pentru Arduino
  Serial.println("\n--- Sistem Pregatit ---");
  WiFi.begin(ssid,password);
  Serial.println("Conectare...");
  
   while(WiFi.status()!= WL_CONNECTED && incercari<20){
    delay(500);
    incercari++;
    Serial.print(".");
  }
  Serial.println("Conectat la reteaua WiFi cu adresa IP: ");
  Serial.println(WiFi.localIP());
  setupRFID();
  sendDataSetup();
}
void trimitereSenzori(float temperatura, float umiditate, uint8_t pir, uint8_t light, const char* url) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient client;
    WiFiClient wifiClient;

    // 1. Construim URL-ul dinamic (fără IP hardcodat)
    String fullUrl = String(url) + "/api/senzori";
    client.begin(wifiClient, fullUrl);
    client.addHeader("Content-Type", "application/json");

    // 2. Serializăm datele primite din pachetul decriptat
    JsonDocument docTrimitere;
    docTrimitere["temperatura"] = temperatura;
    docTrimitere["umiditate"] = umiditate;
    docTrimitere["miscare"] = pir;
    docTrimitere["lumina"] = light;

    char valoriSenzori[128];
    serializeJson(docTrimitere, valoriSenzori);

    // 3. Trimitem cererea POST
    int httpCode = client.POST(valoriSenzori);
    Serial.print("HTTP Code: ");
    Serial.println(httpCode);
  if (temperatura > prag)
  {
    GPIO.out_w1tc = (1 << BUZZ_PIN); // modulul de buzzer merge pe logica inversa
  }
  else
  {
    GPIO.out_w1ts = (1 << BUZZ_PIN);
  }
    if (httpCode > 0) {
      // Păstrăm logica de citire răspuns JSON de la server!
      String raspuns = client.getString();
      JsonDocument docRaspuns;
      DeserializationError error = deserializeJson(docRaspuns, raspuns);

      if (!error) {
        if (docRaspuns.containsKey("prag")) {
          prag = docRaspuns["prag"].as<float>();
          Serial.print("Noul prag primit de la server: ");
          Serial.println(prag);
        }
      } else {
        Serial.print("Eroare JSON: ");
        Serial.println(error.c_str());
      }
      
      Serial.println("Date senzori trimise cu succes!");
      
      // Flash scurt pe LED Verde ca confirmare fizică!
      GPIO.out_w1ts = (1 << GREEN);
      momentAprindere = millis();
      ledAprins = true;

    } else {
      Serial.print("Eroare HTTP la trimitere senzori: ");
      Serial.println(httpCode);
      
      // Aprind LED Roșu în caz de eroare la server
      GPIO.out_w1ts = (1 << RED);
      momentAprindere = millis();
      ledAprins = true;
    }

    client.end();
  }
}
void decriptare(){
  Serial.println("\n==================================");
  Serial.println("   PACHET NOU RECEPTIONAT & VALIDAT");
  Serial.println("==================================");
  
  Serial.print("Umiditate:   ");
  Serial.print(decriptat[UMID_INT]);
  Serial.print(".");
  Serial.print(decriptat[UMID_ZEC]);
  Serial.println(" %");

  Serial.print("Temperatura: ");
  Serial.print(decriptat[TEMP_INT]);
  Serial.print(".");
  Serial.print(decriptat[TEMP_ZEC]);
  Serial.println(" C");

  Serial.print("Stare PIR:   ");
  Serial.println(decriptat[PIR] ? "MISCARE DETECTATA (1)" : "FARA MISCARE (0)");

  Serial.print("Stare LDR:   ");
  Serial.println(decriptat[LIGHT] ? "LUMINA (1)" : "INTUNERIC (0)");
  
  Serial.println("==================================\n");
  float umiditate=decriptat[UMID_INT]+(decriptat[UMID_ZEC]/10.0f);
  float temperatura=decriptat[TEMP_INT]+(decriptat[TEMP_ZEC]/10.0f);
  uint8_t pir=decriptat[PIR];
  uint8_t light=decriptat[LIGHT];
  trimitereSenzori(temperatura, umiditate, pir, light, SERVER_URL);
}

void calibrare(){ //transmitere semnal de inceput
if (indexPachet > 0 &&
    millis() - ultimulOctet > TIMEOUT_UART) {
    indexPachet = 0;
    Serial.println("Timeout UART!");
}

  while (Serial2.available() >0) {
    uint8_t byte=Serial2.read();
    ultimulOctet = millis();
    if(indexPachet==0){
      if((byte ^ SECRET) == 0xF0){
        pachet[indexPachet]=byte;
        indexPachet++;
      }
    }
    else if(indexPachet>0){
        pachet[indexPachet]=byte;
        indexPachet++;
      }
    
    if(indexPachet==8){
      for(int i=0;i<indexPachet;i++){
        decriptat[i]=pachet[i]^SECRET;
      }
      int checksum=0;
          for(int i=0;i<indexPachet-1;i++){
              checksum^=decriptat[i];
              
          }
       
          if(checksum==decriptat[CHECKSUM] && decriptat[HEADER]==0xF0){
                Serial.println("PACHET VALID!");
                decriptare();
                pachetPregatit = true;
                indexPachet=0;
              }
              if (checksum != decriptat[CHECKSUM]) {
    Serial.println("TEST: Checksum invalid!");
}
          
        
        else{
          
          gasit=false;
          int indexHeader;
          for(int i=1;i<indexPachet;i++){
            if(decriptat[i]==0xF0){
              indexHeader=i;
              gasit=true;
              for(int i=0;i<(indexPachet-indexHeader);i++){
                pachet[i]=pachet[i+indexHeader];
              }
              indexPachet-=indexHeader;
              break;
            }
          }
          if(!gasit){
            indexPachet=0;
          }
          
        }
      }
    }
  }
//trimitere date de la senzori prin http la backend




void loop() {
  // Calibrarea de la inceput ping-pong cu semnalul 0xFF
  stingereAutomata();
  calibrare();
  if (pachetPregatit) {
        pachetPregatit = false;
        decriptare();
  }
  trimitereDateRFID(SERVER_URL);
}