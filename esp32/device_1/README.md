# ESP32 Device 1 - MAX30102 Heart Rate Monitor

This device uses a MAX30102 sensor for accurate heart rate monitoring via I2C communication.

## Hardware Requirements

- ESP32 Development Board
- MAX30102 Heart Rate Sensor Module
- Jumper wires
- Breadboard (optional)

## MAX30102 Sensor Wiring

Connect the MAX30102 sensor to your ESP32 as follows:

```
MAX30102 Pin    →    ESP32 Pin    →    Description
─────────────────────────────────────────────────────
VIN             →    3.3V         →    Power supply (3.3V recommended)
GND             →    GND          →    Ground
SDA             →    D21          →    I2C Data line (default SDA)
SCL             →    D22          →    I2C Clock line (default SCL)
INT             →    Not used     →    Interrupt pin (optional)
RD              →    Internal     →    Red LED (internal to sensor)
IRD             →    Internal     →    Infrared LED (internal to sensor)
```

### Important Wiring Notes:

1. **Power Supply**: Use 3.3V instead of 5V to avoid damage to the ESP32
2. **I2C Pullup Resistors**: Most MAX30102 modules have built-in pullup resistors for SDA/SCL
3. **INT Pin**: The interrupt pin is optional for basic heart rate monitoring
4. **Multiple GND pins**: Some modules have two GND pins - connect at least one

## Software Setup

1. **Copy config file**:
   ```bash
   cp src/config.h.example src/config.h
   ```

2. **Edit config.h** with your WiFi credentials and server settings

3. **Install dependencies**: PlatformIO will automatically install the required libraries:
   - SparkFun MAX3010x library
   - ArduinoJson
   - AsyncUDP

## Features

- **Accurate Heart Rate Detection**: Uses infrared and red light sensors
- **Finger Detection**: Automatically detects when finger is placed on sensor
- **Real-time Data**: Sends BPM data via UDP every second
- **Visual Feedback**: Built-in LED blinks with each detected heartbeat
- **WiFi Connectivity**: Connects to your local network
- **JSON Data Format**: Sends structured data including sensor readings

## Usage

1. Place your finger gently on the MAX30102 sensor
2. Wait 5-10 seconds for stable readings
3. The built-in LED will blink with each detected heartbeat
4. BPM data is automatically sent to the configured UDP server

## Troubleshooting

### Sensor Not Found
- Check wiring connections
- Verify 3.3V power supply
- Ensure SDA/SCL connections are correct

### No Heartbeat Detection
- Place finger firmly but gently on sensor
- Ensure finger covers both LEDs on the sensor
- Wait 10-15 seconds for stable readings
- Try different finger positions

### WiFi Connection Issues
- Verify SSID and password in config.h
- Check signal strength
- ESP32 LED will blink during connection, solid when connected

## Data Format

The device sends JSON data via UDP:

```json
{
  "user": 1,
  "bpm": 72,
  "timestamp": 45123,
  "signal_strength": -45,
  "ir_value": 95000,
  "red_value": 88000,
  "finger_detected": true,
  "sensor_type": "MAX30102"
}
```

## Advantages over Simple Pulse Sensor

- More accurate and consistent readings
- Better noise filtering
- Automatic finger detection
- Professional-grade sensor technology
- Less affected by movement and ambient light

## 🔧 Setup

1. **Install PlatformIO**: Install PlatformIO IDE or CLI
2. **Copy Configuration**: Copy `src/config.h.example` to `src/config.h`
3. **Update WiFi Credentials**: Edit `src/config.h` with your WiFi details
4. **Set UDP Server IP**: Update the broker computer's IP address in config.h

## 📡 Hardware Connections

### Pulse Sensor
- **VCC** → **3.3V** (ESP32)
- **GND** → **GND** (ESP32)
- **Signal** → **A0** (GPIO36)

### Power Supply
- **Battery +** → **Switch** → **ESP32 VIN**
- **Battery -** → **ESP32 GND**
- **TP4056 OUT+** → **Switch Common**
- **TP4056 OUT-** → **ESP32 GND**

### Status LED
- Built-in LED (GPIO2) indicates:
  - **Blinking**: Connecting to WiFi
  - **Solid**: Connected to WiFi
  - **Quick Blink**: Heartbeat detected

## 🚀 Upload Code

```bash
# Build and upload
pio run --target upload

# Monitor serial output
pio device monitor
```

## 🔍 Troubleshooting

### WiFi Connection Issues
- Verify SSID and password in `config.h`
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

### Pulse Sensor Issues
- Adjust `PULSE_THRESHOLD` in config.h
- Ensure proper contact with finger/skin
- Check wiring connections
- Monitor serial output for raw sensor values

### UDP Communication Issues
- Verify broker IP address in config.h
- Ensure broker is running and listening on correct port
- Check firewall settings on broker computer

## 📊 Data Format

Device sends JSON over UDP:
```json
{
  "user": 1,
  "bpm": 76,
  "timestamp": 1234567890,
  "signal_strength": -45
}
```

## ⚡ Power Management

- **Battery Life**: ~8-12 hours with 1000mAh LiPo
- **Charging**: Use TP4056 module with USB
- **Power Switch**: Slide switch to turn device on/off
- **Low Power Mode**: Can be implemented for longer battery life

## 🔧 Calibration

1. **Threshold Adjustment**: Monitor serial output and adjust `PULSE_THRESHOLD`
2. **BPM Range**: Modify `MIN_BPM` and `MAX_BPM` in config.h
3. **Sampling Rate**: Adjust `SAMPLE_RATE` for different responsiveness
