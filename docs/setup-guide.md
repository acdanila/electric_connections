# Electric Connections - Complete Setup Guide

Step-by-step instructions to build and configure the wireless heart rate monitoring system.

## 📋 Prerequisites

### Hardware Required
- 2x ESP32 DevKit boards
- 2x Analog Pulse Sensors
- 2x 3.7V LiPo batteries (1000mAh)
- 2x TP4056 charging modules
- 2x Slide switches (SPDT)
- Jumper wires (M-M and M-F)
- 2x Mini breadboards
- 4x 10kΩ resistors

### Software Required
- **PlatformIO IDE** or VSCode with PlatformIO extension
- **Python 3.8+** with pip
- **TouchDesigner** 2023.x or newer
- **Git** (optional, for version control)

### Network Requirements
- WiFi network (2.4GHz)
- Computer connected to same network
- Router with UDP and TCP port access

## 🔧 Part 1: Hardware Assembly

### Device Assembly (Repeat for both devices)

#### 1. Prepare the Breadboard
1. Place ESP32 DevKit on breadboard
2. Connect power rails (+ and - strips)
3. Add jumper wires for easy connections

#### 2. Wire the Pulse Sensor
```
Pulse Sensor → ESP32
VCC (Red)    → 3.3V
GND (Black)  → GND
Signal (Purple) → A0 (GPIO36)
```

#### 3. Add Power Management
```
TP4056 Module → Slide Switch → ESP32
OUT+ → Switch Pin 1
OUT- → GND
Switch Pin 2 → VIN (ESP32)
```

#### 4. Connect Battery
```
LiPo Battery → TP4056
Red (+) → B+
Black (-) → B-
```

#### 5. Test Connections
- Switch ON: ESP32 LED should light up
- Switch OFF: ESP32 should be completely off
- USB to TP4056: Red LED indicates charging

### Power System Verification
1. **Charging Test**: Connect USB to TP4056, red LED should illuminate
2. **Power Test**: Switch device on, ESP32 blue LED should light
3. **Battery Test**: Disconnect USB, device should remain powered

## 💻 Part 2: Software Setup

### ESP32 Programming

#### 1. Install PlatformIO
```bash
# Using VSCode
# Install "PlatformIO IDE" extension from marketplace

# Using standalone
pip install platformio
```

#### 2. Configure Device 1
```bash
cd esp32/device_1
cp src/config.h.example src/config.h
```

Edit `src/config.h`:
```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* UDP_SERVER_IP = "192.168.1.100"; // Your computer's IP
```

#### 3. Upload to Device 1
```bash
pio run --target upload
pio device monitor  # Monitor serial output
```

#### 4. Configure Device 2
```bash
cd ../device_2
cp src/config.h.example src/config.h
```

Edit `src/config.h` (same as device 1 but ensure DEVICE_ID = 2)

#### 5. Upload to Device 2
```bash
pio run --target upload
```

### Python Broker Setup

#### 1. Install Dependencies
```bash
cd broker
pip install -r requirements.txt
```

#### 2. Find Your Computer's IP
```bash
# On Windows
ipconfig

# On macOS/Linux
ifconfig
# or
ip addr show
```

#### 3. Update ESP32 Configurations
Update both device config.h files with your computer's IP address.

#### 4. Start the Broker
```bash
python bpm_broker.py
```

You should see:
```
INFO - UDP server listening on 0.0.0.0:8888
INFO - WebSocket server starting on 0.0.0.0:6789
INFO - BPM Broker is running!
```

### TouchDesigner Setup

#### 1. Install TouchDesigner
Download from [derivative.ca](https://derivative.ca/)

#### 2. Create New Project
1. Open TouchDesigner
2. Create new project
3. Follow instructions in `touchdesigner/README.md`

#### 3. Configure WebSocket Connection
1. Add WebSocket DAT
2. Set address to `ws://localhost:6789`
3. Enable Active and Auto Reconnect

## 🔍 Part 3: System Testing

### Step-by-Step Verification

#### 1. Test ESP32 Connectivity
```bash
# Check device serial output
pio device monitor
```

Expected output:
```
WiFi connected!
IP address: 192.168.1.101
Device 1 initialized
UDP Target: 192.168.1.100:8888
```

#### 2. Test Pulse Sensor
1. Place finger on pulse sensor
2. Monitor serial output for beat detection
3. Should see: `Beat detected - BPM: 75`

#### 3. Test UDP Communication
1. Start Python broker
2. Power on ESP32 devices
3. Broker should show: `Received from User 1 (192.168.1.101): 75 BPM`

#### 4. Test WebSocket Connection
1. Open TouchDesigner project
2. WebSocket DAT should show "Connected"
3. JSON data should appear in connected DATs

### Calibration Process

#### 1. Pulse Sensor Calibration
```cpp
// In config.h, adjust these values:
const int PULSE_THRESHOLD = 2048;  // Increase if too sensitive
const int MIN_BPM = 40;            // Adjust for user
const int MAX_BPM = 200;           // Adjust for user
```

#### 2. Upload calibrated settings
```bash
pio run --target upload
```

#### 3. Test BPM Accuracy
1. Use a stopwatch to count actual heartbeats for 15 seconds
2. Multiply by 4 to get BPM
3. Compare with device reading
4. Adjust threshold if needed

## 🌐 Part 4: Network Configuration

### Firewall Setup

#### Windows
```powershell
# Allow UDP port 8888
netsh advfirewall firewall add rule name="ESP32 UDP" dir=in action=allow protocol=UDP localport=8888

# Allow TCP port 6789
netsh advfirewall firewall add rule name="TouchDesigner WebSocket" dir=in action=allow protocol=TCP localport=6789
```

#### macOS
```bash
# No action typically needed, but check:
sudo pfctl -sr | grep 8888
sudo pfctl -sr | grep 6789
```

#### Linux (Ubuntu)
```bash
sudo ufw allow 8888/udp
sudo ufw allow 6789/tcp
```

### Router Configuration

#### Port Forwarding (if needed)
- **UDP 8888**: Forward to broker computer
- **TCP 6789**: Forward to broker computer

#### Quality of Service (QoS)
- Prioritize broker computer traffic
- Limit bandwidth for other devices if needed

## 🎯 Part 5: Final Integration

### Complete System Test

#### 1. Start Everything
```bash
# Terminal 1: Start broker
cd broker
python bpm_broker.py

# Terminal 2: Monitor device 1
cd esp32/device_1
pio device monitor

# Terminal 3: Monitor device 2
cd esp32/device_2
pio device monitor

# Open TouchDesigner project
```

#### 2. Verify Data Flow
1. **ESP32 → Broker**: Check broker logs for incoming UDP
2. **Broker → TouchDesigner**: Verify WebSocket data reception
3. **TouchDesigner**: Confirm visualization updates with heartbeat

#### 3. Test Both Users
1. Have two people use the devices simultaneously
2. Verify both user IDs appear in TouchDesigner
3. Check that data doesn't cross between users

### Performance Optimization

#### 1. Reduce Latency
- Use 5GHz WiFi if ESP32 supports it
- Place devices close to router
- Minimize network traffic

#### 2. Improve Reliability
- Add WiFi reconnection logic
- Implement data buffering
- Use error correction in UDP

#### 3. Battery Life
- Implement sleep modes
- Reduce transmission frequency
- Lower WiFi power consumption

## 🚨 Troubleshooting Quick Reference

### Common Issues

| Problem | Solution |
|---------|----------|
| ESP32 won't connect to WiFi | Check SSID/password, ensure 2.4GHz |
| No data in broker | Verify ESP32 IP configuration |
| TouchDesigner not receiving | Check WebSocket address/port |
| Erratic BPM readings | Calibrate pulse sensor threshold |
| High latency | Optimize network, reduce interference |

### Debug Commands

```bash
# Test UDP manually
echo '{"user":1,"bpm":75}' | nc -u localhost 8888

# Check port availability
netstat -an | grep 8888
netstat -an | grep 6789

# Monitor network traffic
tcpdump -i any port 8888
```

## ✅ Success Criteria

Your system is working correctly when:

1. ✅ Both ESP32 devices connect to WiFi automatically
2. ✅ Pulse sensors detect heartbeats reliably
3. ✅ Broker receives UDP data from both devices
4. ✅ TouchDesigner displays real-time heart rate data
5. ✅ System runs continuously for 30+ minutes
6. ✅ Reconnection works after WiFi interruption
7. ✅ Battery life exceeds 8 hours per charge

## 🔄 Maintenance

### Daily
- Check battery levels
- Verify device connections
- Clean pulse sensor contacts

### Weekly
- Restart broker system
- Update device calibration if needed
- Check for software updates

### Monthly
- Full system test
- Clean hardware connections
- Backup configuration files

## 📚 Next Steps

1. **Expand Visualization**: Add more TouchDesigner effects
2. **Data Logging**: Implement long-term data storage
3. **Mobile App**: Create smartphone monitoring
4. **Machine Learning**: Add anomaly detection
5. **Multi-Device**: Scale to more than 2 users
