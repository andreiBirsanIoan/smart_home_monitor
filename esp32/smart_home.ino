#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define PIR_PIN 13
#define POT_PIN 33
#define BUZZ_PIN 18
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
const char* ssid="TP-LINK_404B8E";
const char* password="511076c0";
WiFiClient wifiClient;   // ← nou
HTTPClient client;
float ultimaHumid=0;
float ultimaTemp=0;
bool ultima_miscare=false;
void setup(){
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);  // adresa I2C, de obicei 0x3C
  display.clearDisplay();
  pinMode(BUZZ_PIN,OUTPUT);
  WiFi.begin(ssid);
  pinMode(PIR_PIN,INPUT);
  Serial.begin(115200);
  while(WiFi.status()!=WL_CONNECTED){
    delay(500);
    display.setCursor(0, 0);
    display.println("Connecting...");
    display.display();
  }
  Serial.println(WiFi.localIP());
  }
void loop(){
  //bool miscare=digitalRead(PIR_PIN);
  bool miscare=0;
  Serial.println(miscare);
  float temp = random(35);
  float humid=random(50,81);
  int valoare=analogRead(POT_PIN);
  int prag=map(valoare,0,4095,15,40);
   // sau valoarea reala/simulata;
  if(temp>prag){
    digitalWrite(BUZZ_PIN,HIGH);
  }
  else{
    digitalWrite(BUZZ_PIN,LOW);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0,0);
  display.println("Temp: "+String(temp));
  display.setCursor(0,20);
  display.println("Umiditate: "+String(humid));
  display.setCursor(0,40);
  display.println("Temp: "+String(miscare ? "DA":"NU"));
  display.display();
  //Serial.println(temp);
  if(ultimaTemp!=temp || ultima_miscare!=miscare || ultimaHumid!=humid){
     String text = "{\"temperatura\":" + String(temp) + 
                  ",\"umiditate\":" + String(humid) + 
                  ",\"miscare\":" + String(miscare ? "true" : "false") + "}";
                  Serial.println("WiFi status: " + String(WiFi.status()));
 client.begin(wifiClient, "http://192.168.0.100:8000/api/senzori");  // ← schimbat
  client.addHeader("Content-Type", "application/json");
  int httpCode = client.POST(text);
  Serial.println("HTTP Code: " + String(httpCode));
  if (httpCode > 0) {
    Serial.println("Trimis cu succes, cod: " + String(httpCode));
  } else {
    Serial.println("Eroare de conexiune!");
  }
  client.end();
    ultimaTemp=temp;
    ultima_miscare=miscare;
    ultimaHumid=humid;
  }
  delay(5000);
}