#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   15
#define RST_PIN  13
#define SCK_PIN  18
#define MISO_PIN 19
#define MOSI_PIN 23

MFRC522 rfid(SS_PIN, RST_PIN);

void setupRFID() {
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  rfid.PCD_Init();
  Serial.println("Cititor RFID MFRC522 inițializat.");
}


String getRFID(){
   if (!rfid.PICC_IsNewCardPresent()) return "";
  if (!rfid.PICC_ReadCardSerial()) return "";
  String RFID="";
  for(byte i=0;i<rfid.uid.size;i++){
    if (rfid.uid.uidByte[i] < 0x10) { //daca valoarea este sub 0x10 dintr-un octet, adaug un 0
      RFID += "0";
    }
    
    RFID+=String(rfid.uid.uidByte[i],HEX);
    if(i<rfid.uid.size-1){
      RFID+=" ";
    }
  }
  RFID.toUpperCase();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  return RFID;
}

