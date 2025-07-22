#include <WiFi.h>
#include <AsyncUDP.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "config.h"

// Hardware configuration
MAX30105 particleSensor;

// Network configuration
AsyncUDP udp;
unsigned long lastBPMSend = 0;
const unsigned long BPM_SEND_INTERVAL = 1000; // Send BPM every 1 second

// Heart rate calculation variables
const byte RATE_ARRAY_SIZE = 4;  // Increase this for more averaging. 4 is good.
long rateArray[RATE_ARRAY_SIZE]; // Array of heart rates
byte rateArrayIndex = 0;
long lastBeat = 0; // Time at which the last beat occurred
long deltaTime = 0;

// LED indicator
const int LED_PIN = 2; // Built-in LED

// Function declarations
void connectToWiFi();
void initializeSensor();
void readHeartRate();
long calculateBPM();
void sendBPMData(long bpm);

void setup() {
    Serial.begin(115200);
    Serial.println("MAX30102 Heart Rate Monitor - Device 1");

    pinMode(LED_PIN, OUTPUT);

    // Initialize I2C and sensor
    initializeSensor();

    // Connect to WiFi
    connectToWiFi();

    Serial.println("Device 1 initialized with MAX30102");
    Serial.print("UDP Target: ");
    Serial.print(UDP_SERVER_IP);
    Serial.print(":");
    Serial.println(UDP_SERVER_PORT);
}

void loop() {
    // Read heart rate data
    readHeartRate();

    // Send BPM data every second
    if (millis() - lastBPMSend >= BPM_SEND_INTERVAL) {
        long currentBPM = calculateBPM();
        sendBPMData(currentBPM);
        lastBPMSend = millis();
    }

    delay(10); // Small delay for stability
}

void connectToWiFi() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
        digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink while connecting
    }

    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN, HIGH); // Solid light when connected
}

void initializeSensor() {
    if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) { // Use default I2C port, 400kHz speed
        Serial.println("MAX30102 was not found. Please check wiring/power.");
        while (1) {
            digitalWrite(LED_PIN, !digitalRead(LED_PIN)); // Blink error pattern
            delay(100);
        }
    }

    Serial.println("MAX30102 found and initialized!");

    // Setup sensor with optimal settings for heart rate
    particleSensor.setup(); // Configure sensor with default settings
    particleSensor.setPulseAmplitudeRed(0x1F); // Increase Red LED power for better detection
    particleSensor.setPulseAmplitudeIR(0x1F);  // Increase IR LED power for better detection
    particleSensor.setPulseAmplitudeGreen(0); // Turn off Green LED

    Serial.println("Sensor configured with higher LED power for better detection");

    // Initialize rate array
    for (byte i = 0; i < RATE_ARRAY_SIZE; i++) {
        rateArray[i] = 0;
    }
}

void readHeartRate() {
    long irValue = particleSensor.getIR();

    // Check if a finger is detected
    if (checkForBeat(irValue)) {
        // Calculate time between beats
        deltaTime = millis() - lastBeat;
        lastBeat = millis();

        // Calculate BPM
        int beatsPerMinute = 60000 / deltaTime;

        // Store valid BPM values (between 40-200 BPM)
        if (beatsPerMinute > 40 && beatsPerMinute < 200) {
            // Store this reading in the array
            rateArray[rateArrayIndex++] = beatsPerMinute;
            rateArrayIndex %= RATE_ARRAY_SIZE; // Wrap variable

            // Visual heartbeat indicator
            digitalWrite(LED_PIN, LOW);
            delay(50);
            digitalWrite(LED_PIN, HIGH);

            Serial.print("Heartbeat detected! BPM: ");
            Serial.println(beatsPerMinute);
        }
    }

    // Check if finger is on sensor (more sensitive threshold)
    if (irValue < 20000) {
        Serial.println("No finger detected - place finger on sensor");
        Serial.print("IR Value: ");
        Serial.println(irValue);
    } else if (irValue < 50000) {
        Serial.println("Weak finger contact - press firmer");
        Serial.print("IR Value: ");
        Serial.println(irValue);
    } else {
        Serial.print("Good finger contact! IR Value: ");
        Serial.println(irValue);
    }
}

long calculateBPM() {
    // Take average of readings in the array
    long total = 0;
    byte validReadings = 0;

    for (byte i = 0; i < RATE_ARRAY_SIZE; i++) {
        if (rateArray[i] != 0) {
            total += rateArray[i];
            validReadings++;
        }
    }

    if (validReadings == 0) {
        return 0; // No valid readings
    }

    return total / validReadings;
}

void sendBPMData(long bpm) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected, attempting reconnect...");
        connectToWiFi();
        return;
    }

    // Get current sensor readings
    long irValue = particleSensor.getIR();
    long redValue = particleSensor.getRed();

    // Create JSON message with sensor data
    StaticJsonDocument<400> doc;
    doc["user"] = DEVICE_ID;
    doc["bpm"] = bpm;
    doc["timestamp"] = millis();
    doc["signal_strength"] = WiFi.RSSI();
    doc["ir_value"] = irValue;
    doc["red_value"] = redValue;
    doc["finger_detected"] = (irValue > 20000);
    doc["sensor_type"] = "MAX30102";

    String jsonString;
    serializeJson(doc, jsonString);

    // Send UDP packet using AsyncUDP
    IPAddress serverIP;
    serverIP.fromString(UDP_SERVER_IP);
    udp.writeTo((uint8_t*)jsonString.c_str(), jsonString.length(), serverIP, UDP_SERVER_PORT);

    Serial.print("Sent: ");
    Serial.println(jsonString);
}
