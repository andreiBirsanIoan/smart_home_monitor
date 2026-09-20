#include <Arduino.h>
#include "dhtRead.h"
#define HEADER   0
#define UMID_INT 1
#define UMID_ZEC 2
#define TEMP_INT 3
#define TEMP_ZEC 4
#define PIR      5
#define LIGHT    6
#define CHECKSUM 7
uint8_t secret=0x50;
uint8_t pachet[8];
volatile bool miscare=false;
unsigned long ultimulTimpCitire = 0;
const unsigned long INTERVAL_3_SECUNDE = 3000;
void setup() {
  noInterrupts();
  // Pornim Serial-ul pe D1
  Serial.begin(9600);
  DDRD &= ~(1<<PD2); //PIR
  DDRD &= ~(1<<PD7);
  ultimulTimpCitire = millis();
  //setare pentru orice schimbare
  EICRA |= (1 << ISC01) | (1 << ISC00);
  EIMSK |= (1 << INT0);
  interrupts();
  // AȘTEPTĂM 3 SECUNDE ca ESP32 să se trezească complet din boot!
  delay(3000); 
}

ISR(INT0_vect){
  miscare=true;
}

void crearePachet(){
  pachet[HEADER]=0xF0;
  int rezultat=citireDHT11_BareMetal();
  if(rezultat==0){
      pachet[UMID_INT]=dht_date[0];
      pachet[UMID_ZEC]=dht_date[1];
      pachet[TEMP_INT]=dht_date[2];
      pachet[TEMP_ZEC]=dht_date[3];
  }
  pachet[PIR]=(PIND & (1<<PD2))? 1:0;
  pachet[LIGHT]=0;
  pachet[LIGHT]=(PIND & (1<<PD7))? 1:0;
  uint8_t chk=0x00;
  for(int i=0;i<7;i++){
    chk^=pachet[i];
  }
  pachet[CHECKSUM]=chk;
  delay(3000);
}

void criptareDate(){
  for(int i=0;i<8;i++){
    pachet[i]^=secret;
  }
}

void loop() {
  unsigned long timpCurent = millis();
  bool auTrecut3Secunde = (timpCurent - ultimulTimpCitire >= INTERVAL_3_SECUNDE);
  if(miscare || auTrecut3Secunde){
    miscare=false;
    crearePachet();
    criptareDate();
    Serial.write(pachet,8);
  }
  delay(1000);
}
// void loop() {
//   if (miscare) {
//     miscare = false;

//     Serial.println("\n----------------------------------");
//     Serial.println("[PIR] Detecție mișcare declanșată!");

//     // Citim DHT11
//     int codRezultat = citireDHT11_BareMetal();

//     // Afișăm codul de retur al funcției (0 înseamnă SUCCES)
//     Serial.print("Cod retur DHT11: ");
//     Serial.print(codRezultat);

//     if (codRezultat == 0) {
//       Serial.println(" (OK - Măsurătoare reușită)");
      
//       // Afișăm valorile brute extrase din vectorul dht_date
//       Serial.print("  -> Umiditate:   ");
//       Serial.print(dht_date[0]);
//       Serial.print(".");
//       Serial.print(dht_date[1]);
//       Serial.println(" %");

//       Serial.print("  -> Temperatură: ");
//       Serial.print(dht_date[2]);
//       Serial.print(".");
//       Serial.print(dht_date[3]);
//       Serial.println(" °C");

//       Serial.print("  -> Checksum RAW: ");
//       Serial.println(dht_date[4]);
//     } else {
//       Serial.println(" (EROARE la citire!)");
      
//       // Interpretare coduri de eroare
//       if (codRezultat == 1) Serial.println("  -> Cauză: Senzorul nu a tras linia în LOW (Răspuns lipsă)");
//       if (codRezultat == 2) Serial.println("  -> Cauză: Senzorul a rămas blocat în LOW");
//       if (codRezultat == 3) Serial.println("  -> Cauză: Senzorul a rămas blocat în HIGH");
//       if (codRezultat == 4) Serial.println("  -> Cauză: Timeout la debutul unui bit");
//       if (codRezultat == 5) Serial.println("  -> Cauză: Timeout în timpul citirii bitului");
//       if (codRezultat == 6) Serial.println("  -> Cauză: Checksum Invalid (date alterate pe traseu)");
//     }

//     // Citim senzorul de lumină (LDR)
//     bool stareLDR = (PIND & (1 << PD7)) ? true : false;
//     Serial.print("Stare LDR (Lumină): ");
//     Serial.println(stareLDR ? "LUMINĂ (1)" : "ÎNTUNERIC (0)");

//     Serial.println("----------------------------------");
//   }

//   delay(100);
// }