#include <Arduino.h>
#define HEADER   0
#define UMID_INT 1
#define UMID_ZEC 2
#define TEMP_INT 3
#define TEMP_ZEC 4
#define PIR      5
#define LIGHT    6
#define CHECKSUM 7
#define RX2_PIN 16
#define TX2_PIN 17

const uint8_t SECRET=0x50;
uint8_t pachetPrimit[8];
void setup() {
  Serial.begin(115200); // Pentru Serial
  Serial2.begin(9600, SERIAL_8N1, RX2_PIN, TX2_PIN); // Pentru Arduino
  Serial.println("\n--- Sistem Pregatit ---");
}

void decriptare(){
  uint8_t decriptat[8];
  for(int i=0;i<8;i++){
    decriptat[i]=pachetPrimit[i] ^ SECRET;
  }
  if(decriptat[HEADER]!=0xF0){
    Serial.println("HEADER INVALID! DATE CORUPTE");
    return;
  }
  uint8_t chkCalculat=0x00;
  for(int i=0;i<7;i++){
    chkCalculat ^= decriptat[i];
  }
  if(chkCalculat != decriptat[CHECKSUM]){
    Serial.println("CHECKSUM GRESIT");
    return;
  }
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
}

void loop() {
  // Calibrarea de la inceput ping-pong cu semnalul 0xFF
  if (Serial2.available() >0) {
    uint8_t byte=Serial2.peek();
    if(byte==0xFF){
      Serial2.read();
      Serial2.write(0xFF);
      return;
    }
    // Verificăm dacă primul octet din buffer este HEADER-ul (0xF0 criptat cu 0x50 este 0xA0)
    if ((Serial2.peek() ^ SECRET) == 0xF0) {
      if(Serial2.available()>=8){
      // Citesc pachetul primit
      for (int i = 0; i < 8; i++) {
        pachetPrimit[i] = Serial2.read();
      }

      decriptare(); // Procesare pachet
      }
    } else {

      Serial2.read(); 
    }
  }
}