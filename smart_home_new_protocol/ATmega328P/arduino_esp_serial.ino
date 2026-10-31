#include <Arduino.h>
#include "dhtRead.h"
#define HEADER 0
#define UMID_INT 1
#define UMID_ZEC 2
#define TEMP_INT 3
#define TEMP_ZEC 4
#define PIR 5
#define LIGHT 6
#define CHECKSUM 7
#define PIR_PIN 2
#define LDR_PIN 7
volatile uint8_t secunde = 0;
volatile bool treiSecunde = false;
int temperatura_int, umiditate_int, temperatura_zec, umiditate_zec;
uint8_t secret = 0x50;
volatile bool pachetPrimit = false;
bool sistemCalibrat;
uint8_t pachet[8];
volatile bool miscare = false;

// intrerupere externa pe int0

ISR(INT0_vect)
{ // intrerupere exclusiv pentru PD2 (pinul 2)
  miscare = true;
}

ISR(TIMER1_COMPA_vect)
{
  secunde++;
  if (secunde == 3)
  {
    secunde = 0;
    treiSecunde = true;
  }
}

int verificareDateDHT22()
{
  if (temperatura_int < -40 || temperatura_int > 80)
  {
    return 0;
  }
  if (umiditate_int < 0 || umiditate_int > 100)
  {
    return 0;
  }
  return 1;
}

bool crearePachet()
{
  if (!readDHT(temperatura_int, umiditate_int,
               temperatura_zec, umiditate_zec))
  {
    return false;
  }

  if (!verificareDateDHT22())
  {
    return false;
  }

  pachet[HEADER] = 0xF0;
  pachet[UMID_INT] = umiditate_int;
  pachet[UMID_ZEC] = umiditate_zec;
  pachet[TEMP_INT] = temperatura_int;
  pachet[TEMP_ZEC] = temperatura_zec;

  // pachet[PIR] = miscare ? 1 : 0;

  // Temporar, până integrezi citirea LDR.
  pachet[LIGHT] = 0;

  uint8_t chk = 0;
  for (int i = 0; i < 7; i++)
  {
    chk ^= pachet[i];
  }

  pachet[CHECKSUM] = chk;

  return true;
}
void criptareDate()
{
  for (int i = 0; i < 8; i++)
  {
    pachet[i] ^= secret;
  }
}

int calibrareSemnal()
{
  for (int i = 0; i < 3; i++)
  {
    TCNT1 = 0;
    pachetPrimit = false;

    while (!(UCSR0A & (1 << UDRE0)))
      ;
    UDR0 = 0xFF;
    while (!pachetPrimit && TCNT1 < 15625)
    { // neaparat bucla de asteptare pentru receptie semnal
    }
    if (!pachetPrimit || TCNT1 > 15625)
    {
      return 0;
    }
  }
  return 1;
}
void setup()
{
  noInterrupts();
  initDHT();
  // Pornim Serial-ul pe D1
  // baud 9600
  UBRR0 = 103;
  UCSR0B = 0x98;
  UCSR0C = 0x06;
  DDRD &= ~(1 << PIR_PIN); // PIR
  DDRD &= ~(1 << LDR_PIN); // ldr
  TCCR1A = 0x00;
  TCCR1B = (1 << WGM12) | (1 << CS12) | (1 << CS10); // prescale 1024
  TCNT1 = 0;
  TIMSK1 |= (1 << OCIE1A);
  OCR1A = 15624;
  // setare pentru orice schimbare
  EICRA |= (1 << ISC01) | (1 << ISC00); // rising value(trece din 0 in 1)
  EIMSK |= (1 << INT0);                 // intreruperi pe PD2
  interrupts();
  // AȘTEPT 3 SECUNDE ca ESP32 să se trezească complet din boot!

  delay(3000);
  sistemCalibrat = true;
}
void loop()
{
  if (treiSecunde)
  {
    treiSecunde = false;
    noInterrupts();
    bool miscareDetectata = miscare;
    miscare = false;
    interrupts();

    pachet[PIR] = miscareDetectata ? 1 : 0;

    if (crearePachet())
    {
      criptareDate();

      for (int i = 0; i < 8; i++)
      {
        while (!(UCSR0A & (1 << UDRE0)))
          ;
        UDR0 = pachet[i];
      }
    }
  }
}
