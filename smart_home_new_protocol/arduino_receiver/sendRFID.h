#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "scanRFID.h"
#define RED 14
#define GREEN 21
const char* ssid = "DIGI_df69a9";
const char* password = "511076c0";
int incercari=0;
bool ledAprins=false;
unsigned long momentAprindere=0;
const unsigned long durata_led=3000;
void stingereAutomata(){
  if(ledAprins && millis()-momentAprindere>=durata_led){
    GPIO.out_w1tc=(1<<RED) | (1<<GREEN);
    ledAprins=false;
  }
}
void sendDataSetup() {
  GPIO.enable_w1ts=(1 << RED);
  GPIO.enable_w1ts=(1 << GREEN);
  GPIO.out_w1tc=(1<<RED) | (1<<GREEN); //setare ambii pe low
}
void trimitereDateRFID(const char* url){
  String rfidUID=getRFID();
  if(rfidUID!=""){
 if(WiFi.status()==WL_CONNECTED()){
  HTTPClient http;
  String urlComplet=String(url)+"/rfid_login";
  http.begin(urlComplet);
  http.addHeader("Content-Type","application/json");
  String RFID = "{\"rfid\":\"" + rfidUID + "\"}";
  int httpResponse=http.POST(RFID);
   if (httpResponse > 0) {
      String response = http.getString();
      Serial.print("Cod Raspuns HTTP: ");
      Serial.println(httpResponse);
      Serial.print("Răspuns Server: ");
      Serial.println(response);

      if (httpResponse == 200) { //semnal ca am fost acceptat
        Serial.println(">>> ACCES PERMIS!");
        GPIO.out_w1ts=(1<<GREEN);
        momentAprindere=millis();
        ledAprins=true;
        
      } else if (httpResponse == 401) { //semnal ca nu am fost acceptat
        Serial.println(">>> ACCESS REFUZAT!");
        GPIO.out_w1ts(1<<RED);
        momentAprindere=millis();
        ledAprins=true;
      }
    } else {
      Serial.print("Eroare la trimiterea POST: ");
      Serial.println(httpResponse);
    }
    http.end();
 }
  }
 
}