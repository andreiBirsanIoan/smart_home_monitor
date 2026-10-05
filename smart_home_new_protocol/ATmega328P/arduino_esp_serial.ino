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
volatile bool pachetPrimit=false;
bool sistemCalibrat;
uint8_t pachet[8];
volatile bool miscare=false;



ISR(INT0_vect){
  miscare=true;
}

ISR(USART_RX_vect){
  if(UDR0==0xFF){
    pachetPrimit=true;
  }
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
  
}

void criptareDate(){
  for(int i=0;i<8;i++){
    pachet[i]^=secret;
  }
}

int verificareDate(){ //verific daca datele sunt in limite normale
  if(dht_date[0] < 20 || dht_date[0] > 90){ //umiditate in intervalul [20,90]
      return 0;
  }
  if(dht_date[2] < 0 || dht_date[2] > 50){ //temperatura intre [0,50]
    return 0;
  }
  return 1;
}



int calibrareSemnal(){
  for(int i=0;i<3;i++){
      TCNT1=0;
      pachetPrimit=false;
     
      while(!(UCSR0A & (1<<UDRE0)));
      UDR0=0xFF;
      while(!pachetPrimit && TCNT1<15625){ //neaparat bucla de asteptare pentru receptie semnal
      
      }
      if(!pachetPrimit || TCNT1 >15625){
        return 0;
      }
  }
  return 1;
}
void setup() {
  noInterrupts();
  // Pornim Serial-ul pe D1
  UBRR0=103;
  UCSR0B=0x98;
  UCSR0C=0x06;
  DDRD &= ~(1<<PD2); //PIR
  DDRD &= ~(1<<PD7);
  TCCR1A = 0x00;
  TCCR1B = 0x05;
  //setare pentru schimbare pe front crescator(cand trece senzorul de PIR din 0 in 1)
  EICRA |= (1 << ISC01) | (1 << ISC00);
  EIMSK |= (1 << INT0);
  interrupts();
  // AsTEPT 3 SECUNDE ca ESP32 sa se trezeasca complet din boot!

  delay(3000); 
    sistemCalibrat=calibrareSemnal();
}
void loop() {
  if(!sistemCalibrat){
    sistemCalibrat=calibrareSemnal();
    return;
  }
    bool auTrecut3Secunde = (TCNT1 >= 46875);
    if(miscare || auTrecut3Secunde){
      TCNT1=0;// resetez ceasul de 3 secunde
      miscare=false;
      crearePachet();
      if(verificareDate()){
        criptareDate();
        for(int i=0;i<8;i++){
          while(!(UCSR0A & (1<<UDRE0)));
          UDR0=pachet[i];
        }
      } 
    }
}