#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include "secrets.h"
#include <ArduinoJson.h>
#include "soc/gpio_struct.h"
#define PIR_PIN 13
#define BUZZ_PIN 25
#define DHTPIN 26
#define DHTTYPE DHT11

WiFiClient wifiClient;
HTTPClient client;
DHT dht(DHTPIN, DHTTYPE);
RTC_DATA_ATTR float prag = 30; // acum supraviețuiește deep sleep-ului
float humid = 0;
float temp = 0;
bool miscare = false;
int incercari=0;

//=======================FUNCTII=====================
void citireSenzori()
{
  miscare = (GPIO.in >> PIR_PIN) & 1;
  temp = dht.readTemperature();
  humid = dht.readHumidity();
  if (isnan(temp) || isnan(humid))
  {
    Serial.println("Eroare la citirea senzorului DHT!");
    return;
  }
}

void setareBuzzer()
{
  if (temp > prag)
  {
    GPIO.out_w1tc = (1 << BUZZ_PIN); // modulul de buzzer merge pe logica inversa
  }
  else
  {
    GPIO.out_w1ts = (1 << BUZZ_PIN);
  }
}

void trimitereDate()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    JsonDocument docTrimitere;
    docTrimitere["temperatura"] = temp;
    docTrimitere["umiditate"] = humid;
    docTrimitere["miscare"] = miscare;
    char valoriSenzori[128];
    serializeJson(docTrimitere, valoriSenzori);
    client.begin(wifiClient, "http://192.168.0.150:8000/api/senzori");
    client.addHeader("Content-Type", "application/json");
    int httpCode = client.POST(valoriSenzori);
    Serial.println("HTTP Code: " + String(httpCode));
    if (httpCode > 0)
    {
      String raspuns = client.getString();
      JsonDocument docRaspuns;
      DeserializationError error = deserializeJson(docRaspuns, raspuns);
      if (!error)
      {
        if (docRaspuns["prag"])
        {
          prag = docRaspuns["prag"].as<float>();
          Serial.print("Noul prag salvat: ");
          Serial.println(prag);
        }
      }
      else
      {
        Serial.print("Eroare JSON: ");
        Serial.println(error.c_str());
      }
      Serial.println("Date trimise cu succes");
    }
    else
    {
      Serial.println("Eroare HTTP: ");
      Serial.println(httpCode);
    }
    client.end();
  }
}

void pornesteDeepSleep()
{
  esp_sleep_enable_ext0_wakeup((gpio_num_t)PIR_PIN, 1);
  esp_sleep_enable_timer_wakeup(3 * 1000000);
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  esp_deep_sleep_start();
}
void setup()
{

  GPIO.enable_w1tc = (1 << PIR_PIN);
  GPIO.enable_w1ts = (1 << BUZZ_PIN);
  GPIO.out_w1ts = (1 << BUZZ_PIN);
  
  WiFi.begin(WIFI_SSID,WIFI_PASS);
  dht.begin();

  Serial.begin(115200);
  while (WiFi.status() != WL_CONNECTED && incercari < 20)
  {
    delay(500);
    Serial.println("Connecting...");
    incercari++;
  }
  if(WiFi.status() != WL_CONNECTED){
    pornesteDeepSleep(); // renunță, încearcă la următorul ciclu
  return;
  }
  Serial.println(WiFi.localIP());

  citireSenzori();

  if (isnan(temp) || isnan(humid))
  {
    pornesteDeepSleep();
    return;
  }

  setareBuzzer();
  trimitereDate();
  pornesteDeepSleep();
}
void loop()
{
}