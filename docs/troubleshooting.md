# Troubleshooting Guide - Electric Connections

Comprehensive troubleshooting for the heart rate monitoring system.

## 🚨 Quick Diagnostics

### System Status Check
```bash
# Check if broker is running
netstat -an | grep :6789
netstat -an | grep :8888

# Check ESP32 connection (replace with your device port)
pio device monitor --port /dev/ttyUSB0

# Test WebSocket manually
python -c "import websockets; print('WebSocket module available')"
```

### Visual Indicators
| Component | Normal | Problem |
|-----------|--------|---------|
| ESP32 LED | Solid blue when connected | Blinking = connecting, Off = no power |
| TP4056 Charging | Red when charging, Blue when complete | Off = no USB/bad connection |
| TouchDesigner WebSocket | Green "Connected" | Red "Disconnected" |
| Python Broker | Continuous log messages | Error messages or silence |

## 🔌 Hardware Issues

### Power Problems

#### ESP32 Won't Power On
**Symptoms**: No LED, no serial output
**Causes & Solutions**:
1. **Switch Position**
   - Check slide switch is in ON position
   - Test switch continuity with multimeter

2. **Battery Issues**
   - Measure battery voltage (should be >3.0V)
   - Check battery connections to TP4056
   - Verify TP4056 output voltage

3. **Wiring Problems**
   - Check VIN connection to ESP32
   - Verify GND connection
   - Look for loose breadboard connections

4. **Faulty ESP32**
   - Test with USB cable directly to ESP32
   - If USB works but battery doesn't, check TP4056

#### TP4056 Not Charging
**Symptoms**: No red LED when USB connected
**Solutions**:
1. **USB Connection**
   - Try different USB cable
   - Test different USB port/charger
   - Check USB-C connection firmly seated

2. **Battery Connection**
   - Verify battery polarity (red to B+, black to B-)
   - Check for loose battery connections
   - Test with different battery

3. **Module Damage**
   - Check for burn marks on TP4056
   - Measure input voltage at USB (should be ~5V)
   - Replace module if damaged

#### Battery Draining Quickly
**Symptoms**: <4 hours battery life
**Solutions**:
1. **WiFi Power Management**
   ```cpp
   // Add to ESP32 code
   WiFi.setSleep(true);  // Enable WiFi sleep
   ```

2. **Reduce Transmission Rate**
   ```cpp
   const unsigned long BPM_SEND_INTERVAL = 2000; // Every 2 seconds instead of 1
   ```

3. **Power Down Unused Peripherals**
   ```cpp
   // Disable Bluetooth
   btStop();
   ```

### Sensor Issues

#### No Pulse Detection
**Symptoms**: Serial shows "Beat detected - BPM: 0" or no beat messages
**Solutions**:
1. **Physical Contact**
   - Clean pulse sensor with isopropyl alcohol
   - Ensure firm finger contact
   - Try different finger placement

2. **Electrical Connections**
   - Check 3.3V supply to sensor (not 5V!)
   - Verify signal wire to A0 (GPIO36)
   - Test GND connection

3. **Sensor Calibration**
   ```cpp
   // Adjust in config.h
   const int PULSE_THRESHOLD = 1800; // Lower for weak signals
   // or
   const int PULSE_THRESHOLD = 2500; // Higher for strong signals
   ```

4. **Analog Reading Test**
   ```cpp
   // Add to loop() for debugging
   int rawValue = analogRead(PULSE_SENSOR_PIN);
   Serial.print("Raw sensor: ");
   Serial.println(rawValue);
   delay(100);
   ```

#### Erratic BPM Readings
**Symptoms**: BPM jumping wildly (30-200+ BPM)
**Solutions**:
1. **Increase Smoothing**
   ```cpp
   const int WINDOW_SIZE = 20; // Increase from 10
   ```

2. **Better Threshold Management**
   ```cpp
   // Auto-adjust threshold more frequently
   if (millis() % 500 == 0) { // Every 0.5 seconds
       peak = (peak + signal) / 2;
       trough = (trough + signal) / 2;
   }
   ```

3. **Filter Invalid Readings**
   ```cpp
   if (beatInterval > 250 && beatInterval < 2500) { // Stricter range
       int currentBPM = 60000 / beatInterval;
       // Store BPM...
   }
   ```

#### Signal Strength Issues
**Symptoms**: Weak or noisy pulse sensor readings
**Solutions**:
1. **Check Power Supply**
   - Measure 3.3V rail voltage
   - Ensure clean power (no voltage drops)

2. **Shield from Interference**
   - Keep away from WiFi antenna
   - Use shorter sensor wires
   - Add ground plane if soldering

3. **Software Filtering**
   ```cpp
   // Add low-pass filter
   int filtered_signal = (signal * 0.7) + (previous_signal * 0.3);
   ```

## 📡 Network Issues

### WiFi Connection Problems

#### ESP32 Can't Connect to WiFi
**Symptoms**: "Connecting to WiFi....." forever
**Solutions**:
1. **Network Compatibility**
   - Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   - Check WPA2 encryption (WPA3 may not work)
   - Disable MAC address filtering

2. **Credentials Check**
   ```cpp
   // In config.h - verify exact spelling
   const char* WIFI_SSID = "YourNetworkName"; // Case sensitive!
   const char* WIFI_PASSWORD = "YourPassword"; // Special characters OK
   ```

3. **Signal Strength**
   - Move closer to router for testing
   - Check for interference (microwaves, other devices)
   - Use WiFi analyzer to check channel congestion

4. **Router Configuration**
   - Temporarily disable guest network isolation
   - Check device limit on router
   - Restart router if needed

#### WiFi Keeps Disconnecting
**Symptoms**: ESP32 repeatedly connects and disconnects
**Solutions**:
1. **Power Management**
   ```cpp
   // Disable WiFi sleep mode
   WiFi.setSleep(false);
   ```

2. **Reconnection Logic**
   ```cpp
   void checkWiFiConnection() {
       if (WiFi.status() != WL_CONNECTED) {
           Serial.println("WiFi lost, reconnecting...");
           WiFi.reconnect();
           delay(5000);
       }
   }

   // Call in loop() every 30 seconds
   ```

3. **Router Issues**
   - Update router firmware
   - Check DHCP lease time
   - Increase router range/power

### UDP Communication Problems

#### Broker Not Receiving Data
**Symptoms**: No UDP messages in broker logs
**Solutions**:
1. **IP Address Configuration**
   ```cpp
   // In ESP32 config.h - use computer's actual IP
   const char* UDP_SERVER_IP = "192.168.1.100"; // Not localhost!
   ```

2. **Port Conflicts**
   ```bash
   # Check if port 8888 is available
   netstat -an | grep :8888
   # If in use, change port in both ESP32 and broker
   ```

3. **Firewall Issues**
   ```bash
   # Windows - allow UDP port
   netsh advfirewall firewall add rule name="ESP32_UDP" dir=in action=allow protocol=UDP localport=8888

   # macOS - check firewall settings
   sudo pfctl -sr | grep 8888

   # Linux - allow port
   sudo ufw allow 8888/udp
   ```

4. **Network Routing**
   - Ensure all devices on same subnet
   - Check router VLAN settings
   - Try direct ping from ESP32 to computer

#### Data Transmission Errors
**Symptoms**: Partial or corrupted JSON in broker
**Solutions**:
1. **JSON Validation**
   ```cpp
   // Test JSON format
   String testJson = "{\"user\":1,\"bpm\":75}";
   Serial.println("Sending: " + testJson);
   ```

2. **UDP Packet Size**
   ```cpp
   // Keep messages small (<512 bytes)
   StaticJsonDocument<256> doc; // Reduced size
   ```

3. **Network Quality**
   - Test with shorter range
   - Reduce transmission frequency
   - Add error checking/retransmission

## 💻 Software Issues

### Python Broker Problems

#### Broker Won't Start
**Symptoms**: Python errors on startup
**Solutions**:
1. **Dependencies**
   ```bash
   pip install --upgrade websockets asyncio
   ```

2. **Port Already in Use**
   ```bash
   # Find what's using port 6789
   lsof -i :6789  # macOS/Linux
   netstat -ano | findstr :6789  # Windows

   # Kill process or change port in broker
   ```

3. **Python Version**
   ```bash
   python --version  # Should be 3.8+
   pip install --upgrade python
   ```

#### High Memory Usage
**Symptoms**: Broker consumes excessive RAM
**Solutions**:
1. **Limit Data Storage**
   ```python
   # In bpm_broker.py
   MAX_HISTORY = 100  # Limit stored messages

   def cleanup_old_data(self):
       if len(self.message_history) > MAX_HISTORY:
           self.message_history = self.message_history[-MAX_HISTORY:]
   ```

2. **Efficient JSON Handling**
   ```python
   # Use json instead of json5 for better performance
   import json  # instead of json5
   ```

### TouchDesigner Issues

#### WebSocket Won't Connect
**Symptoms**: "Connection refused" or "Timeout" errors
**Solutions**:
1. **Address Configuration**
   - Use `localhost` or `127.0.0.1` if broker is local
   - Use actual IP address if broker is remote
   - Verify port 6789 is correct

2. **TouchDesigner WebSocket Settings**
   ```
   Active: On
   Protocol: WebSocket Client
   Address: ws://localhost:6789
   Auto Reconnect: On
   Timeout: 10.0
   ```

3. **Broker Status**
   ```bash
   # Verify broker is running and listening
   python bmp_broker.py
   # Should show: "WebSocket server starting on 0.0.0.0:6789"
   ```

#### No Data Processing
**Symptoms**: WebSocket connects but no BPM values appear
**Solutions**:
1. **JSON Parsing**
   - Check JSON DAT for parsing errors
   - Verify incoming data format matches expected

2. **Data Flow**
   ```
   WebSocket DAT → JSON DAT → Select DAT → Your visualization
   ```

3. **Debug Output**
   ```python
   # In TouchDesigner Python DAT
   def onReceive(dat, data):
       print(f"Received: {data}")  # Debug line
       # ... rest of processing
   ```

## 📊 Performance Issues

### High Latency
**Symptoms**: >1 second delay from heartbeat to visualization
**Solutions**:
1. **Network Optimization**
   - Use wired connection for broker computer
   - Minimize WiFi interference
   - Reduce other network traffic

2. **Processing Optimization**
   ```cpp
   // ESP32 - reduce processing
   const unsigned long BPM_SEND_INTERVAL = 500; // Send every 0.5s
   ```

   ```python
   # Broker - efficient processing
   async def process_udp_data(self, data_str, addr):
       # Minimal processing for speed
       data = json.loads(data_str)
       await self.broadcast_to_websockets(data)  # Direct broadcast
   ```

3. **TouchDesigner Optimization**
   - Reduce unnecessary DAT operations
   - Use efficient data structures
   - Minimize visual complexity during testing

### System Instability
**Symptoms**: Random crashes, disconnections, data loss
**Solutions**:
1. **Memory Management**
   ```cpp
   // ESP32 - monitor memory
   void loop() {
       Serial.println("Free heap: " + String(ESP.getFreeHeap()));
       // ... rest of loop
   }
   ```

2. **Error Handling**
   ```python
   # Broker - robust error handling
   try:
       data = json.loads(data_str)
   except json.JSONDecodeError:
       logger.error(f"Invalid JSON: {data_str}")
       return  # Don't crash, just skip
   ```

3. **Watchdog Timers**
   ```cpp
   // ESP32 - add watchdog for stability
   #include <esp_task_wdt.h>

   void setup() {
       esp_task_wdt_init(30, true); // 30 second timeout
       esp_task_wdt_add(NULL);
   }

   void loop() {
       esp_task_wdt_reset(); // Reset watchdog
       // ... rest of loop
   }
   ```

## 🔧 Advanced Diagnostics

### Network Packet Analysis
```bash
# Capture UDP traffic
sudo tcpdump -i any -X port 8888

# Monitor WebSocket traffic
sudo tcpdump -i any -X port 6789

# Test UDP manually
echo '{"user":1,"bpm":75,"timestamp":1234567890}' | nc -u localhost 8888
```

### ESP32 Debug Output
```cpp
// Enable verbose WiFi debugging
#define CORE_DEBUG_LEVEL 5

// Add extensive logging
Serial.println("=== ESP32 Debug Info ===");
Serial.println("Chip ID: " + String((uint32_t)ESP.getEfuseMac(), HEX));
Serial.println("Free Heap: " + String(ESP.getFreeHeap()));
Serial.println("WiFi Status: " + String(WiFi.status()));
Serial.println("Signal Strength: " + String(WiFi.RSSI()));
Serial.println("IP Address: " + WiFi.localIP().toString());
```

### System Integration Test
```bash
#!/bin/bash
# Complete system test script

echo "Testing Heart Rate Monitor System..."

# Test 1: Broker startup
echo "1. Starting broker..."
python broker/bmp_broker.py &
BROKER_PID=$!
sleep 5

# Test 2: UDP connectivity
echo "2. Testing UDP..."
echo '{"user":1,"bpm":75}' | nc -u localhost 8888

# Test 3: WebSocket connectivity
echo "3. Testing WebSocket..."
python -c "
import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('ws://localhost:6789') as ws:
            print('WebSocket connection successful')
    except Exception as e:
        print(f'WebSocket error: {e}')

asyncio.run(test())
"

# Cleanup
kill $BROKER_PID
echo "Test complete."
```

## 📞 Getting Help

### Diagnostic Information to Collect
When asking for help, include:
1. **Hardware Setup**: ESP32 model, sensor type, power supply
2. **Software Versions**: PlatformIO, Python, TouchDesigner versions
3. **Network Info**: Router model, WiFi settings, IP addresses
4. **Error Messages**: Exact error text from all components
5. **Serial Output**: ESP32 serial monitor output
6. **Broker Logs**: Python broker console output

### Log Collection Commands
```bash
# ESP32 logs
pio device monitor > esp32_logs.txt

# Broker logs
python bmp_broker.py > broker_logs.txt 2>&1

# System information
uname -a > system_info.txt
python --version >> system_info.txt
pio --version >> system_info.txt
```

### Common Support Resources
- **PlatformIO Forum**: community.platformio.org
- **TouchDesigner Forum**: forum.derivative.ca
- **ESP32 Documentation**: docs.espressif.com
- **WebSocket Protocol**: tools.ietf.org/html/rfc6455

Remember: Most issues are configuration-related. Double-check all settings before assuming hardware failure!
