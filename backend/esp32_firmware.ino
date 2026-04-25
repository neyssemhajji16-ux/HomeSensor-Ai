/*
  ESP32 — Système IoT Surveillance Intelligente
  Capteurs: DHT22 (Temp/Humidité) + MQ-2 (Gaz)
  Communication: WiFi + MQTT
  Alertes locales: LED + Buzzer
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── Configuration WiFi ──
const char* WIFI_SSID = "TON_WIFI";
const char* WIFI_PASS = "TON_MOT_DE_PASSE";

// ── Configuration MQTT ──
const char* MQTT_SERVER = "192.168.1.100";  // IP de ton broker Mosquitto
const int   MQTT_PORT   = 1883;
const char* MQTT_TOPIC  = "iot/sensors/data";
const char* DEVICE_ID   = "ESP32-01";

// ── Pins ──
#define DHT_PIN    4
#define DHT_TYPE   DHT22
#define MQ2_PIN    34   // Analogique
#define LED_RED    26
#define LED_GREEN  27
#define BUZZER_PIN 25

// ── Seuils d'alerte ──
#define TEMP_SEUIL   35.0
#define HUM_SEUIL    80.0
#define GAZ_SEUIL    300

// ── Objets ──
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long lastMsg = 0;
const long INTERVAL = 5000;  // 5 secondes

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(LED_RED,    OUTPUT);
  pinMode(LED_GREEN,  OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void loop() {
  if (!mqttClient.connected()) reconnectMQTT();
  mqttClient.loop();

  unsigned long now = millis();
  if (now - lastMsg > INTERVAL) {
    lastMsg = now;
    readAndPublish();
  }
}

void readAndPublish() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();
  int   gasRaw      = analogRead(MQ2_PIN);
  int   gasPPM      = map(gasRaw, 0, 4095, 0, 500);

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Erreur lecture DHT22!");
    return;
  }

  // Construire JSON
  StaticJsonDocument<256> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["gas"]         = gasPPM;
  doc["timestamp"]   = millis();

  char payload[256];
  serializeJson(doc, payload);

  // Publier MQTT
  mqttClient.publish(MQTT_TOPIC, payload);
  Serial.printf("Publié: T=%.1f°C H=%.1f%% G=%dppm\n", temperature, humidity, gasPPM);

  // Alertes locales
  bool danger = (temperature > TEMP_SEUIL || gasPPM > GAZ_SEUIL);
  digitalWrite(LED_RED,   danger ? HIGH : LOW);
  digitalWrite(LED_GREEN, danger ? LOW  : HIGH);

  if (danger) {
    tone(BUZZER_PIN, 1000, 500);
  }
}

void connectWiFi() {
  Serial.printf("Connexion WiFi: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.printf("\nWiFi connecté! IP: %s\n", WiFi.localIP().toString().c_str());
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connexion MQTT...");
    if (mqttClient.connect(DEVICE_ID)) {
      Serial.println("connecté!");
      mqttClient.subscribe("iot/commands/#");
    } else {
      Serial.printf("échec (rc=%d), retry dans 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.printf("Message reçu [%s]: %s\n", topic, msg.c_str());
  // Traiter commandes (ex: activer/désactiver buzzer)
}
