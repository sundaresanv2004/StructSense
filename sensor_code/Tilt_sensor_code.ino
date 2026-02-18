#include <HTTPClient.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <Wire.h>

// ================= WIFI =================
const char *ssid = "wifi_name";
const char *password = "password";

// ================= API =================
const char *serverUrl = "https://[yourdomain.com]/api/v1/sensor/ingest";
String deviceUID = "esp32_structsense_001";

// ================= MPU6050 =============
MPU6050 mpu;

// ================= Ultrasonic ==========
#define TRIG_PIN 5
#define ECHO_PIN 18

#define NUM_SAMPLES 7 // Median filter size

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

// ================= Ultrasonic RAW Duration ==========
unsigned long getUltrasonicDuration() {

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // 30ms timeout prevents blocking
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  return duration;
}

// ================= Median Filter for Stability ==========
double getFilteredDuration() {

  unsigned long readings[NUM_SAMPLES];

  for (int i = 0; i < NUM_SAMPLES; i++) {
    readings[i] = getUltrasonicDuration();
    delay(5);
  }

  // Sort readings
  for (int i = 0; i < NUM_SAMPLES - 1; i++) {
    for (int j = i + 1; j < NUM_SAMPLES; j++) {
      if (readings[j] < readings[i]) {
        unsigned long temp = readings[i];
        readings[i] = readings[j];
        readings[j] = temp;
      }
    }
  }

  return readings[NUM_SAMPLES / 2]; // Return median value
}

// ================= Main Loop ===========
void loop() {

  // ----- Read MPU6050 (RAW) -----
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  // ----- Read Ultrasonic (Filtered) -----
  double rawDuration = getFilteredDuration();

  // Convert to millimeters
  double distance_mm = rawDuration * 0.1715;

  // ----- Print locally -----
  Serial.print("Tilt X: ");
  Serial.print(ax);
  Serial.print(" Y: ");
  Serial.print(ay);
  Serial.print(" Z: ");
  Serial.print(az);
  Serial.print(" Distance (mm): ");
  Serial.println(distance_mm, 2);

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
    jsonData += "\"distance_mm\":" + String(distance_mm, 2);
    jsonData += "}";

    int httpResponseCode = http.POST(jsonData);

    Serial.print("HTTP Response: ");
    Serial.println(httpResponseCode);

    http.end();

  } else {
    Serial.println("WiFi disconnected");
  }

  delay(3000); // Send every 3 seconds
}
