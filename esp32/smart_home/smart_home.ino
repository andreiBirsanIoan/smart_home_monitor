#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "DHT.h"
#include "soc/gpio_struct.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
//SDA GPIO21
//SCL GPIO22
#define PIR_PIN 13
#define BUZZ_PIN 25
#define DHTPIN 26
#define DHTTYPE DHT11
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
const char* ssid="TP-LINK_404B8E";
const char* password="511076c0";
WiFiClient wifiClient;   // ← nou
HTTPClient client;
DHT dht(DHTPIN,DHTTYPE);
float prag=30;
float ultimaHumid=0;
float ultimaTemp=0;
bool ultima_miscare=false;
unsigned long timpUltimaCitire=0;
unsigned long intervalCitire=2000;
void setup(){
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  // adresa I2C, de obicei 0x3C
  display.clearDisplay();
  GPIO.enable_w1ts=(1<<BUZZ_PIN);
  WiFi.begin(ssid);
  dht.begin();
  GPIO.enable_w1tc=(1<<PIR_PIN);
  Serial.begin(115200);
  while(WiFi.status()!=WL_CONNECTED){
    delay(500);
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Connecting...");
    display.display();
  }
  Serial.println(WiFi.localIP());
  }
void loop(){
  if(millis()-timpUltimaCitire>=intervalCitire){
    timpUltimaCitire=millis();
  }
  bool miscare=(GPIO.in>>PIR_PIN)&1;
  //bool miscare=0;
  Serial.println(miscare);
  float temp =dht.readTemperature();
  float humid=dht.readHumidity();
  if(isnan(temp) || isnan(humid)){
    Serial.println("Eroare la citirea senzorului DHT!");
    return;
  }
 
   // sau valoarea reala/simulata;
  if(temp>prag){
    GPIO.out_w1tc=(1<<BUZZ_PIN);//modulul de buzzer merge pe logica inversa
  }
  else{
    GPIO.out_w1ts=(1<<BUZZ_PIN);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Temp: "+String(temp));
  display.setCursor(0,20);
  display.println("Umiditate: "+String(humid));
  display.setCursor(0,40);
  display.println("Miscare: "+String(miscare ? "DA":"NU"));
  display.display();
  //Serial.println(temp);
     String text = "{\"temperatura\":" + String(temp) + 
                  ",\"umiditate\":" + String(humid) + 
                  ",\"miscare\":" + String(miscare ? "true" : "false") + "}";
                  Serial.println("WiFi status: " + String(WiFi.status()));
 client.begin(wifiClient, "http://192.168.0.150:8000/api/senzori");  // ← schimbat
  client.addHeader("Content-Type", "application/json");
  int httpCode = client.POST(text);
  Serial.println("HTTP Code: " + String(httpCode));
  if (httpCode > 0) {
    String textPrimit=client.getString();
    int valoarePrag=textPrimit.indexOf("\"prag\":");
    if(valoarePrag!=-1){
      prag=textPrimit.substring(valoarePrag+7).toInt();
    }
    Serial.println("Trimis cu succes, cod: " + String(httpCode));
  } else {
    Serial.println("Eroare de conexiune!");
  }
  client.end();
    ultimaTemp=temp;
    ultima_miscare=miscare;
    ultimaHumid=humid;
  if((GPIO.in>>PIR_PIN) & 1){
      return;
  }
  WiFi.disconnect(true);
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_13,1);
  esp_sleep_enable_timer_wakeup(3*1000000);
  display.ssd1306_command(SSD1306_DISPLAYOFF);//oprire oled pentru deepSleep
  esp_deep_sleep_start();
}