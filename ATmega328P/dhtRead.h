#define F_CPU 16000000UL
#include <avr/io.h>
#include <util/delay.h>

uint8_t dht_date[5];
uint8_t citireDHT11_BareMetal() {
  uint8_t i, j;
  uint8_t timp_counter;

  for (i = 0; i < 5; i++) dht_date[i] = 0;

  //START 
  DDRD |= (1 << PD6);     // PD4 Output (DHT11 ) si PD7 Output (Releu)
  
  PORTD &= ~(1 << PD6);   // PD4 pe LOW
  _delay_ms(25);          // 20ms LOW (Senzorul DHT11 are nevoie sa stea minim 18ms pe LOW la inceput)

  PORTD |= (1 << PD6);    // DHT11 pin HIGH
  _delay_us(30);          // 30us HIGH

  DDRD &= ~(1 << PD6);    // Schimb directia DHT11 pin pe INPUT
  PORTD |= (1 << PD6);    // Activează Pull-up intern de siguranță

  noInterrupts();
  // Asteptam semnalul de LOW de la senzor(~80us)
  timp_counter = 0;
  while (PIND & (1 << PD6)) {
    _delay_us(1);
    if (++timp_counter > 200){ interrupts(); return 1;} // Cod eroare 1: Senzorul nu a tras linia în LOW (Răspuns lipsă)
  }

  // Asteptam semnalul HIGH de la senzor (~80us)
  timp_counter = 0;
  while (!(PIND & (1 << PD6))) {
    _delay_us(1);
    if (++timp_counter > 200){ interrupts(); return 2;} // Cod eroare 2: Senzorul a rămas blocat în LOW
  }

  // Așteptăm terminarea semnalului HIGH al răspunsului
  timp_counter = 0;
  while (PIND & (1 << PD6)) {
    _delay_us(1);
    if (++timp_counter > 200){ interrupts(); return 3;} // Cod eroare 3: Senzorul a rămas blocat în HIGH
  }
  //biti senzor
  for (j = 0; j < 40; j++) {
    // verific cand se termina starea de low de la senzor
    timp_counter = 0;
    while (!(PIND & (1 << PD6))) {
      _delay_us(1);
      if (++timp_counter > 200){ interrupts(); return 4;} // Cod eroare 4: Timeout la debutul bitului
    }
    // Măsurăm durata stării HIGH a bitului
    timp_counter = 0;
    while (PIND & (1 << PD6)) {
      _delay_us(1);
      if (++timp_counter > 200){ interrupts(); return 5;}  // Cod eroare 5: Line rămasă HIGH în timpul citirii biților
    }
    //Verificare stare bit, un bit are valoarea '0' daca durata semnalului HIGH este de ~26-28us
    //Daca durata este ~70 us, atunci bitul are valoarea '1'
    if (timp_counter > 35) {
      dht_date[j / 8] |= (1 << (7 - (j % 8))); //adaugare biti
    }
  }
  interrupts();
  // Checksum Test
  uint8_t sum = dht_date[0] + dht_date[1] + dht_date[2] + dht_date[3];
  if (sum != dht_date[4]) {
    return 6; //Cod eroare 6: Checksum Invalid (date alterate)
  }
  return 0;
}
