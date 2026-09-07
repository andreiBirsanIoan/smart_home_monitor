#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"
#include <ArduinoJson.h>
#include "soc/gpio_struct.h"
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define PIR_PIN 13
#define BUZZ_PIN 25
#define DHTPIN 26
#define DHTTYPE DHT11

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
const char *ssid = "TP-LINK_404B8E";
const char *password = "511076c0";
WiFiClient wifiClient;
HTTPClient client;
DHT dht(DHTPIN, DHTTYPE);
RTC_DATA_ATTR float prag = 30; // acum supraviețuiește deep sleep-ului
float humid = 0;
float temp = 0;
bool miscare = false;
unsigned long timpUltimaCitire = 0;
unsigned long intervalCitire = 2000;

//=======================FUNCTII=====================
void citireSenzori()
{
  miscare = (GPIO.in >> PIR_PIN) & 1;
  temp = dht.readTemperature();
  humid = dht.readHumidity();
  if (isnan(temp) || isnan(humid))
  {
    Serial.println("Eroare la citirea senzorului DHT!");
    // Dacă senzorul dă eroare, citim din nou la următorul ciclu de sleep
    esp_sleep_enable_timer_wakeup(3 * 1000000);
    esp_deep_sleep_start();
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

void afisareDisplay()
{
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Temp: " + String(temp));
  display.setCursor(0, 20);
  display.println("Umiditate: " + String(humid));
  display.setCursor(0, 40);
  display.println("Miscare: " + String(miscare ? "DA" : "NU"));
  display.display();
}

void pornesteDeepSleep()
{
  display.ssd1306_command(SSD1306_DISPLAYOFF); // oprire oled pentru deepSleep
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_13, 1);
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
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // adresa I2C, de obicei 0x3C
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  WiFi.begin(ssid);
  dht.begin();

  Serial.begin(115200);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Connecting...");
    display.display();
  }
  Serial.println(WiFi.localIP());

  citireSenzori();

  if (isnan(temp) || isnan(humid))
  {
    pornesteDeepSleep();
    return;
  }

  setareBuzzer();

  afisareDisplay();

  trimitereDate();

  pornesteDeepSleep();
}
void loop()
{
}