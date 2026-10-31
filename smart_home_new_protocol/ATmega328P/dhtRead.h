#ifndef DHT_READ_H
#define DHT_READ_H

#include <DHT.h>
#include <math.h>

#define DHT_PIN 6
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

inline void initDHT()
{
  dht.begin();
}

inline bool readDHT(int &temperatura_int, int &umiditate_int, int &temperatura_zec, int &umiditate_zec)
{
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  if (isnan(temp) || isnan(hum))
  {
    return false;
  }
  temperatura_int = (int)temp;
  temperatura_zec = (int)(abs(temp) * 10) % 10;
  umiditate_int = (int)hum;
  umiditate_zec = (int)(abs(hum) * 10) % 10;

  return true;
}

#endif