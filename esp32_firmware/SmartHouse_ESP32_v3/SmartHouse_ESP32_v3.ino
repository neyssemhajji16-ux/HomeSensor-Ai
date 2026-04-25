/*
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║       SMART HOUSE — ESP32 v3  · API + APP MOBILE COMPATIBLE     ║
 * ║   Ajout endpoints de commande pour l'application Flutter         ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  NOUVEAUX ENDPOINTS :                                            ║
 * ║   POST /api/cmd/door/open    → Ouvrir la porte manuellement     ║
 * ║   POST /api/cmd/door/close   → Fermer la porte manuellement     ║
 * ║   POST /api/cmd/buzzer/off   → Couper le buzzer                 ║
 * ║   POST /api/cmd/reset        → Reset alertes                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <ESP32Servo.h>

// ── CONFIG WiFi ─────────────────────────────────────────────────────
const char* WIFI_SSID     = "Amine";
const char* WIFI_PASSWORD = "amine2345";

// ── PINS CAPTEURS ───────────────────────────────────────────────────
#define PIR_PIN      23
#define DHT_PIN       4
#define DHT_TYPE    DHT11
#define SOUND_DO     34
#define SOUND_AO     35
#define GAS_DO       26
#define GAS_AO       32
#define FLAME_DO     25
#define FLAME_AO     33
#define I2C_SDA      21
#define I2C_SCL      22

// ── PINS ACTIONNEURS ────────────────────────────────────────────────
#define BUZZER_PIN   27
#define SERVO_PIN    19
#define LED_ROUGE    15
#define LED_VERTE    18

#define SERVO_FERME   180
#define SERVO_OUVERT  90

// ── SEUILS ──────────────────────────────────────────────────────────
#define TEMP_MAX        35.0f
#define HUMID_MAX       80.0f
#define GAS_SEUIL      2500
#define SOUND_SEUIL    3800
#define LUX_NUIT        50.0f
#define DEBOUNCE_COUNT  3

DHT             dht(DHT_PIN, DHT_TYPE);
BH1750          lightMeter;
Servo           monServo;
AsyncWebServer  server(80);
AsyncWebSocket  ws("/ws");

struct SensorData {
  float   temperature   = 0.0f;
  float   humidity      = 0.0f;
  float   lux           = 0.0f;
  bool    isNight       = false;
  bool    motion        = false;
  bool    soundDetected = false;
  int     soundLevel    = 0;
  bool    gasDetected   = false;
  int     gasLevel      = 0;
  bool    flameDetected = false;
  int     flameLevel    = 0;
  bool    alertActive   = false;
  uint8_t alertPriority = 0;
  String  alertMessage  = "";
  bool    servoOuvert   = false;
  bool    buzzerOn      = false;
  bool    ledRougeOn    = false;
  bool    ledVerteOn    = true;
} data;

unsigned long tSenseurs    = 0;
unsigned long tWSSend      = 0;
unsigned long tBuzzer      = 0;
unsigned long tSerial      = 0;
unsigned long tServoRetour = 0;

bool buzzerBlink         = false;
bool servoEnAttente      = false;
volatile bool flammeISR  = false;

bool manualDoorOverride  = false;
bool manualBuzzerSilence = false;

int flammeCompteur = 0;
int sonCompteur    = 0;

const char DASHBOARD[] PROGMEM = R"rawliteral(
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Smart House</title>
<style>body{background:#060b12;color:#c8dce8;font-family:system-ui;padding:20px;text-align:center;}h1{color:#4d9fff;}p{color:#7a90a8;}a{color:#50fa7b;}</style>
</head><body><h1>&#127968; Smart House ESP32</h1><p>Serveur actif — Utilisez l'application mobile Flutter</p>
<p><a href="/api/data">/api/data</a> — <a href="/api/info">/api/info</a></p></body></html>
)rawliteral";

void IRAM_ATTR ISR_Flamme() { flammeISR = true; }

void ouvrirPorte() {
  if (!data.servoOuvert) {
    monServo.write(SERVO_OUVERT);
    data.servoOuvert = true;
    tServoRetour     = millis();
    servoEnAttente   = true;
    Serial.println(F("  [SERVO] Porte OUVERTE (90deg)"));
  }
}

void fermerPorte() {
  if (data.servoOuvert) {
    monServo.write(SERVO_FERME);
    data.servoOuvert = false;
    servoEnAttente   = false;
    Serial.println(F("  [SERVO] Porte FERMEE (0deg)"));
  }
}

void setLEDs(bool danger) {
  digitalWrite(LED_ROUGE, danger ? HIGH : LOW);
  digitalWrite(LED_VERTE, danger ? LOW  : HIGH);
  data.ledRougeOn = danger;
  data.ledVerteOn = !danger;
}

void updateBuzzer(uint8_t mode) {
  if (manualBuzzerSilence) mode = 0;
  unsigned long now = millis();
  if (mode == 0) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerBlink    = false;
    data.buzzerOn  = false;
  } else if (mode == 3) {
    digitalWrite(BUZZER_PIN, HIGH);
    data.buzzerOn  = true;
  } else {
    unsigned long interval = (mode == 1) ? 900UL : 180UL;
    if (now - tBuzzer >= interval) {
      tBuzzer       = now;
      buzzerBlink   = !buzzerBlink;
      digitalWrite(BUZZER_PIN, buzzerBlink ? HIGH : LOW);
      data.buzzerOn = buzzerBlink;
    }
  }
}

void readAllSensors() {
  float rawH = dht.readHumidity();
  float rawT = dht.readTemperature();
  if (!isnan(rawH) && !isnan(rawT)) {
    data.humidity    = rawH;
    data.temperature = rawT;
  }

  float luxVal = lightMeter.readLightLevel();
  if (luxVal >= 0) {
    data.lux     = luxVal;
    data.isNight = (luxVal < LUX_NUIT);
  }

  data.motion = (digitalRead(PIR_PIN) == HIGH);

  bool sonBrut = (digitalRead(SOUND_DO) == LOW);
  if (sonBrut) {
    sonCompteur++;
    if (sonCompteur >= DEBOUNCE_COUNT) data.soundDetected = true;
  } else {
    sonCompteur = 0;
    data.soundDetected = false;
  }
  data.soundLevel = 0;

  data.gasLevel    = analogRead(GAS_AO);
  data.gasDetected = (digitalRead(GAS_DO) == LOW)
                  && (data.gasLevel > GAS_SEUIL);

  bool flammeBrut = (digitalRead(FLAME_DO) == LOW);
  if (flammeBrut || flammeISR) {
    flammeCompteur++;
    if (flammeCompteur >= DEBOUNCE_COUNT) data.flameDetected = true;
    if (flammeISR) flammeISR = false;
  } else {
    flammeCompteur     = 0;
    data.flameDetected = false;
  }
  data.flameLevel = 0;
}

uint8_t buzzerMode = 0;

void processAlerts() {
  if (data.flameDetected) {
    data.alertActive   = true;
    data.alertPriority = 3;
    data.alertMessage  = "INCENDIE DETECTE ! Evacuez !";
    buzzerMode = 3;
    setLEDs(true);
    if (!manualDoorOverride) ouvrirPorte();
    manualBuzzerSilence = false;
  } else if (data.gasDetected) {
    data.alertActive   = true;
    data.alertPriority = 3;
    data.alertMessage  = "Fuite de gaz detectee !";
    buzzerMode = 2;
    setLEDs(true);
    if (!manualDoorOverride) ouvrirPorte();
  } else if (data.temperature > TEMP_MAX) {
    data.alertActive   = true;
    data.alertPriority = 2;
    data.alertMessage  = "Temperature elevee: " + String(data.temperature, 1) + " C";
    buzzerMode = 1;
    setLEDs(true);
    if (!manualDoorOverride) fermerPorte();
  } else if (data.humidity > HUMID_MAX) {
    data.alertActive   = true;
    data.alertPriority = 2;
    data.alertMessage  = "Humidite elevee: " + String(data.humidity, 1) + " %";
    buzzerMode = 0;
    setLEDs(true);
    if (!manualDoorOverride) fermerPorte();
  } else if (data.soundDetected) {
    data.alertActive   = true;
    data.alertPriority = 2;
    data.alertMessage  = "Bruit anormal detecte !";
    buzzerMode = 0;
    setLEDs(true);
    if (!manualDoorOverride) fermerPorte();
  } else if (data.motion) {
    data.alertActive   = true;
    data.alertPriority = 1;
    data.alertMessage  = "Mouvement detecte";
    buzzerMode = 0;
    setLEDs(true);
    if (!manualDoorOverride) fermerPorte();
  } else {
    data.alertActive   = false;
    data.alertPriority = 0;
    data.alertMessage  = "";
    buzzerMode = 0;
    setLEDs(false);
    if (!manualDoorOverride) fermerPorte();
    manualBuzzerSilence = false;
  }
}

String buildJson() {
  StaticJsonDocument<512> doc;
  doc["temperature"]   = round(data.temperature * 10) / 10.0;
  doc["humidity"]      = round(data.humidity * 10) / 10.0;
  doc["lux"]           = round(data.lux);
  doc["isNight"]       = data.isNight;
  doc["motion"]        = data.motion;
  doc["soundDetected"] = data.soundDetected;
  doc["soundLevel"]    = data.soundLevel;
  doc["gasDetected"]   = data.gasDetected;
  doc["gasLevel"]      = data.gasLevel;
  doc["flameDetected"] = data.flameDetected;
  doc["flameLevel"]    = data.flameLevel;
  doc["alertActive"]   = data.alertActive;
  doc["alertPriority"] = data.alertPriority;
  doc["alertMessage"]  = data.alertMessage;
  doc["servoOuvert"]   = data.servoOuvert;
  doc["buzzerOn"]      = data.buzzerOn;
  doc["ledRougeOn"]    = data.ledRougeOn;
  doc["ledVerteOn"]    = data.ledVerteOn;
  doc["uptime"]        = millis() / 1000;
  String json; serializeJson(doc, json);
  return json;
}

void sendWebSocket() {
  ws.textAll(buildJson());
}

void onWSEvent(AsyncWebSocket* s, AsyncWebSocketClient* c,
               AwsEventType t, void* a, uint8_t* d2, size_t l) {
  if (t == WS_EVT_CONNECT) {
    Serial.printf("[WS] Client #%u connecte\n", c->id());
    c->text(buildJson());
  } else if (t == WS_EVT_DISCONNECT) {
    Serial.printf("[WS] Client #%u deconnecte\n", c->id());
  }
}

void printSerialMonitor() {
  Serial.println();
  Serial.print(F("[STATUS] T="));  Serial.print(data.temperature, 1);
  Serial.print(F("C H="));          Serial.print(data.humidity, 1);
  Serial.print(F("% Lux="));        Serial.print(data.lux, 0);
  Serial.print(F(" PIR="));         Serial.print(data.motion);
  Serial.print(F(" Son="));         Serial.print(data.soundDetected);
  Serial.print(F(" Gaz="));         Serial.print(data.gasDetected);
  Serial.print(F(" Flam="));        Serial.print(data.flameDetected);
  Serial.print(F(" | Porte="));     Serial.print(data.servoOuvert ? "OPEN" : "CLOSE");
  Serial.print(F(" Buz="));         Serial.print(data.buzzerOn);
  Serial.print(F(" | Alert="));     Serial.println(data.alertMessage);
}

void bipDemarrage() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH); digitalWrite(LED_ROUGE, HIGH); digitalWrite(LED_VERTE, HIGH);
    delay(80);
    digitalWrite(BUZZER_PIN, LOW); digitalWrite(LED_ROUGE, LOW); digitalWrite(LED_VERTE, LOW);
    delay(120);
  }
  monServo.write(90); delay(500); monServo.write(0); delay(400);
  setLEDs(false);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println(F("\n=== SMART HOUSE ESP32 v3 — API APP MOBILE ==="));

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_ROUGE,  OUTPUT);
  pinMode(LED_VERTE,  OUTPUT);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  monServo.setPeriodHertz(50);
  monServo.attach(SERVO_PIN, 500, 2400);
  monServo.write(SERVO_FERME);

  pinMode(PIR_PIN,  INPUT);
  pinMode(SOUND_DO, INPUT);
  pinMode(GAS_DO,   INPUT);
  pinMode(FLAME_DO, INPUT);
  attachInterrupt(digitalPinToInterrupt(FLAME_DO), ISR_Flamme, FALLING);

  Wire.begin(I2C_SDA, I2C_SCL);
  dht.begin();
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print(F("[WiFi] Connexion"));
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 60) {
    delay(500); Serial.print('.'); tries++;
    digitalWrite(LED_VERTE, !digitalRead(LED_VERTE));
  }
  digitalWrite(LED_VERTE, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print(F("[WiFi] IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WiFi] Echec — redemarrage"));
    delay(3000); ESP.restart();
  }

  ws.onEvent(onWSEvent);
  server.addHandler(&ws);

  server.on("/", HTTP_GET, [](AsyncWebServerRequest* req) {
    req->send_P(200, "text/html", DASHBOARD);
  });

  server.on("/api/data", HTTP_GET, [](AsyncWebServerRequest* req) {
    req->send(200, "application/json", buildJson());
  });

  server.on("/api/info", HTTP_GET, [](AsyncWebServerRequest* req) {
    StaticJsonDocument<256> doc;
    doc["ip"]      = WiFi.localIP().toString();
    doc["rssi"]    = WiFi.RSSI();
    doc["heap"]    = ESP.getFreeHeap();
    doc["clients"] = ws.count();
    doc["uptime"]  = millis() / 1000;
    String json; serializeJson(doc, json);
    req->send(200, "application/json", json);
  });

  server.on("/api/cmd/door/open", HTTP_POST, [](AsyncWebServerRequest* req) {
    manualDoorOverride = true;
    ouvrirPorte();
    Serial.println(F("[CMD APP] Ouverture porte manuelle"));
    req->send(200, "application/json", "{\"ok\":true,\"door\":\"open\"}");
  });

  server.on("/api/cmd/door/close", HTTP_POST, [](AsyncWebServerRequest* req) {
    if (data.flameDetected || data.gasDetected) {
      Serial.println(F("[CMD APP] Fermeture porte REFUSEE (danger actif)"));
      req->send(403, "application/json", "{\"ok\":false,\"reason\":\"danger_active\"}");
      return;
    }
    manualDoorOverride = true;
    fermerPorte();
    Serial.println(F("[CMD APP] Fermeture porte manuelle"));
    req->send(200, "application/json", "{\"ok\":true,\"door\":\"closed\"}");
  });

  server.on("/api/cmd/buzzer/off", HTTP_POST, [](AsyncWebServerRequest* req) {
    if (data.flameDetected) {
      Serial.println(F("[CMD APP] Silence buzzer REFUSE (incendie)"));
      req->send(403, "application/json", "{\"ok\":false,\"reason\":\"fire_active\"}");
      return;
    }
    manualBuzzerSilence = true;
    digitalWrite(BUZZER_PIN, LOW);
    data.buzzerOn = false;
    Serial.println(F("[CMD APP] Buzzer coupe"));
    req->send(200, "application/json", "{\"ok\":true,\"buzzer\":\"off\"}");
  });

  server.on("/api/cmd/reset", HTTP_POST, [](AsyncWebServerRequest* req) {
    manualDoorOverride  = false;
    manualBuzzerSilence = false;
    Serial.println(F("[CMD APP] Reset — overrides manuels annules"));
    req->send(200, "application/json", "{\"ok\":true}");
  });

  server.onNotFound([](AsyncWebServerRequest* req) {
    req->send(404, "text/plain", "Not found");
  });

  server.begin();
  Serial.println(F("[OK] Serveur demarre"));
  Serial.print(F("Dashboard : http://")); Serial.println(WiFi.localIP());
  Serial.print(F("WebSocket : ws://"));    Serial.print(WiFi.localIP()); Serial.println(F("/ws"));
  Serial.println(F("API COMMANDES :"));
  Serial.println(F("   POST /api/cmd/door/open"));
  Serial.println(F("   POST /api/cmd/door/close"));
  Serial.println(F("   POST /api/cmd/buzzer/off"));
  Serial.println(F("   POST /api/cmd/reset"));

  bipDemarrage();
}

void loop() {
  unsigned long maintenant = millis();

  if (maintenant - tSenseurs >= 2000UL) {
    tSenseurs = maintenant;
    readAllSensors();
    processAlerts();
  }

  updateBuzzer(buzzerMode);

  if (servoEnAttente && !manualDoorOverride
      && (maintenant - tServoRetour >= 10000UL)) {
    if (!data.gasDetected && !data.flameDetected) {
      fermerPorte();
    } else {
      tServoRetour = maintenant;
    }
  }

  if (maintenant - tSerial >= 3000UL) {
    tSerial = maintenant;
    printSerialMonitor();
  }

  if (maintenant - tWSSend >= 1000UL) {
    tWSSend = maintenant;
    ws.cleanupClients();
    sendWebSocket();
  }
}
