#include <HTTPClient.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <Wire.h>

// ================= WIFI =================
const char *ssid = "wifi_name";
const char *password = "password";

// ================= API =================
const char *serverUrl = "http://[IP_ADDRESS]/api/v1/sensor/ingest";
String deviceUID = "esp32_structsense_001";

// ================= MPU6050 =============
MPU6050 mpu;

// ================= Ultrasonic ==========
#define TRIG_PIN 5
#define ECHO_PIN 18

// ================= Setup ===============
void setup() {
  Serial.begin(115200);

  // WiFi connect
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");

  // MPU6050 init
  Wire.begin(21, 22); // SDA, SCL
  mpu.initialize();

  if (mpu.testConnection()) {
    Serial.println("MPU6050 connected");
  } else {
    Serial.println("MPU6050 connection FAILED");
  }

  // Ultrasonic pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

// ================= Distance function (returns MM) ===
float getDistanceMM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = duration * 0.343 / 2; // Changed to 0.343 for millimeters (more precise)
  return distance;
}

// ================= Main loop ===========
void loop() {

  // ----- Read MPU6050 -----
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  // ----- Read ultrasonic (in MM) -----
  float distance = getDistanceMM();

  // ----- Print locally -----
  Serial.print("Tilt X: ");
  Serial.print(ax);
  Serial.print(" Y: ");
  Serial.print(ay);
  Serial.print(" Z: ");
  Serial.print(az);
  Serial.print(" Distance (mm): ");
  Serial.println(distance);

  // ----- Send to backend -----
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonData = "{";
    jsonData += "\"device_uid\":\"" + deviceUID + "\",";
    jsonData += "\"tilt_x\":" + String(ax) + ",";
    jsonData += "\"tilt_y\":" + String(ay) + ",";
    jsonData += "\"tilt_z\":" + String(az) + ",";
    jsonData += "\"distance_mm\":" + String(distance); // Changed field name
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();
  } else {
    Serial.println("WiFi disconnected");
  }

  delay(5000); // send every 5 sec
}
