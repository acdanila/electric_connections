# Electric Connections - Real-Time Heart Rate Monitoring System

A wireless heart rate monitoring system using ESP32 devices that stream BPM data to a Python WebSocket broker for real-time visualization in TouchDesigner.

## 🏗️ Architecture

```
ESP32 Device 1 ──┐
                 ├─── UDP ──── Python Broker ──── WebSocket ──── TouchDesigner
ESP32 Device 2 ──┘
```

## 📁 Project Structure

```
electric_connections/
├── esp32/
│   ├── device_1/          # PlatformIO project for first ESP32
│   └── device_2/          # PlatformIO project for second ESP32
├── broker/                # Python WebSocket broker
├── touchdesigner/         # TouchDesigner project files
├── docs/                  # Setup instructions and wiring diagrams
├── diagrams/              # System diagrams and schematics
├── parts-list.csv         # Bill of materials
└── README.md              # This file
```

## 🚀 Quick Start

1. **Hardware Setup**: See `docs/wiring-guide.md` for component connections
2. **ESP32 Setup**: Upload code to both devices using PlatformIO
3. **Broker Setup**: Run the Python WebSocket broker
4. **TouchDesigner**: Open the .toe file and configure WebSocket connection

## 📋 Hardware Requirements

- 2x ESP32 DevKit boards
- 2x Analog PulseSensors
- 2x 3.7V LiPo batteries (1000mAh)
- 2x TP4056 charger modules
- 2x Slide switches
- Jumper wires and breadboards

## 🔧 Setup Instructions

### ESP32 Devices
```bash
cd esp32/device_1
pio run --target upload
```

### Python Broker
```bash
cd broker
pip install -r requirements.txt
python bmp_broker.py
```

### TouchDesigner
Open `touchdesigner/heart_rate_monitor.toe` and configure WebSocket DAT to connect to `ws://localhost:6789`

## 📡 Data Format

ESP32 devices send UDP messages in JSON format:
```json
{"user": 1, "bpm": 76, "timestamp": 1234567890}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details 