# BPM Broker - WebSocket Heart Rate Server

A Python WebSocket broker that receives UDP heart rate data from ESP32 devices and broadcasts it to connected clients like TouchDesigner.

## 🚀 Features

- **UDP Server**: Receives JSON heart rate data from ESP32 devices
- **WebSocket Server**: Broadcasts data to multiple clients simultaneously
- **Signal Smoothing**: Advanced filtering to reduce noise and outliers
- **Live Plotting**: Real-time matplotlib visualization of heart rate data
- **Real-time**: Low-latency data streaming for live visualization
- **Robust**: Handles client connections/disconnections gracefully
- **Logging**: Comprehensive logging for debugging and monitoring

## 📦 Installation

1. **Install Python dependencies**:
```bash
pip install -r requirements.txt
```

2. **Run the broker**:
```bash
python bpm_broker.py
```

## 🔧 Configuration

### Default Ports
- **UDP Server**: `0.0.0.0:8888` (receives from ESP32 devices)
- **WebSocket Server**: `0.0.0.0:6789` (serves to clients like TouchDesigner)

### Firewall Settings
Ensure these ports are open:
- **Port 8888/UDP**: For ESP32 device communication
- **Port 6789/TCP**: For WebSocket client connections

## 📡 Data Flow

```
ESP32 Device 1 ──┐
                 ├── UDP:8888 ── BPM Broker ── WebSocket:6789 ── TouchDesigner
ESP32 Device 2 ──┘
```

## 📊 Data Formats

### Input (UDP from ESP32)
```json
{
  "user": 1,
  "bpm": 76,
  "timestamp": 1234567890,
  "signal_strength": -45
}
```

### Output (WebSocket to clients)
```json
{
  "user": 1,
  "bpm": 76,
  "timestamp": 1234567890,
  "signal_strength": -45,
  "server_timestamp": 1234567891.123,
  "source_ip": "192.168.1.101",
  "received_at": "2024-01-01T12:00:00.123456"
}
```

## 🎮 WebSocket Commands

Clients can send commands to the broker:

### Get Status
```json
{"type": "get_status"}
```

### Get Latest Data for User
```json
{"type": "get_latest", "user_id": 1}
```

## 🔍 Monitoring

The broker provides real-time logging:
- **Device Connections**: When ESP32 devices send data
- **Client Connections**: When WebSocket clients connect/disconnect
- **Data Flow**: BPM values and transmission status
- **Errors**: Network issues, malformed data, etc.

## 🐛 Troubleshooting

### UDP Not Receiving Data
1. Check ESP32 device configuration
2. Verify network connectivity
3. Confirm firewall settings
4. Check ESP32 broker IP configuration

### WebSocket Connection Issues
1. Verify port 6789 is accessible
2. Check firewall settings
3. Ensure TouchDesigner WebSocket DAT configuration
4. Monitor broker logs for connection attempts

### High Latency
1. Check network quality
2. Reduce WiFi interference
3. Minimize other network traffic
4. Consider wired connection for broker computer

## 🔧 Development

### Running in Debug Mode
```bash
# Enable debug logging
python -c "import logging; logging.basicConfig(level=logging.DEBUG)" bpm_broker.py
```

### Testing with Mock Data
```bash
# Send test UDP message
echo '{"user":1,"bpm":75,"timestamp":1234567890}' | nc -u localhost 8888
```

### WebSocket Testing
Use a WebSocket client to connect to `ws://localhost:6789` and monitor real-time data.

### Testing with Simulated Data
```bash
# Run the test data generator
python test_bpm_data.py

# With custom parameters
python test_bpm_data.py --users 3 --rate 1.5 --duration 60
```

## 🎯 Signal Processing Features

### Signal Smoothing
The broker applies several filtering techniques:
- **Exponential Moving Average**: Configurable smoothing factor (α = 0.3 default)
- **Outlier Detection**: Rejects sudden spikes/drops > 15 BPM difference
- **Range Validation**: Ensures BPM values stay within 40-200 range
- **Median Filtering**: Uses recent history median for outlier replacement

### Configuration Options
Edit the configuration constants in `bpm_broker.py`:
```python
SMOOTHING_ENABLED = True          # Enable/disable smoothing
SMOOTHING_ALPHA = 0.3            # EMA factor (0-1, lower = more smoothing)
OUTLIER_THRESHOLD = 15           # BPM difference threshold for outliers
HISTORY_LENGTH = 100             # Number of samples to keep in memory
MIN_BPM = 40                     # Minimum valid BPM
MAX_BPM = 200                    # Maximum valid BPM
```

### Live Plotting
- **Real-time Visualization**: Matplotlib-based live plotting
- **Multi-user Support**: Different colors for each user/device
- **Configurable Window**: Shows recent 50 samples by default
- **Statistics Display**: Current values and connection status
- **Auto-scaling**: Y-axis adjusts to data range

### Enhanced WebSocket Commands

#### Get Signal History
```json
{"type": "get_signal_history", "user_id": 1}
```

#### Get All User Statistics
```json
{"type": "get_all_statistics"}
```

Response includes smoothed values, raw values, and signal statistics.

## 📝 Logging

Logs include:
- **INFO**: Normal operations (connections, data received)
- **WARNING**: Non-critical issues (malformed data)
- **ERROR**: Critical issues (network errors, exceptions)

Log format: `timestamp - level - message`

## 🔒 Security Notes

- **Network**: Broker accepts connections from any IP
- **Authentication**: No authentication required (add if needed)
- **Encryption**: Plain text communication (add SSL for production)
- **Firewall**: Configure appropriately for your network
