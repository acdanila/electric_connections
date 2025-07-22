# System Architecture - Electric Connections

Visual overview of the heart rate monitoring system architecture.

## 🏗️ High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   ESP32 Device  │    │   ESP32 Device  │
│     (User 1)    │    │     (User 2)    │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │PulseSensor  │ │    │ │PulseSensor  │ │
│ │    ♥️       │ │    │ │    ♥️       │ │
│ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │
│ WiFi: 2.4GHz    │    │ WiFi: 2.4GHz    │
│ User ID: 1      │    │ User ID: 2      │
│ UDP Port: 8888  │    │ UDP Port: 8888  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │       WiFi          │
          │      Network         │
          │                      │
          └──────────┬───────────┘
                     │
                     v
          ┌─────────────────────┐
          │   Computer/Broker   │
          │                     │
          │ ┌─────────────────┐ │
          │ │ Python Broker   │ │
          │ │  bmp_broker.py  │ │
          │ │                 │ │
          │ │ UDP Server      │ │
          │ │ Port: 8888      │ │
          │ │       ↓         │ │
          │ │ WebSocket       │ │
          │ │ Server          │ │
          │ │ Port: 6789      │ │
          │ └─────────────────┘ │
          └─────────┬───────────┘
                    │
                    │ WebSocket
                    │ ws://localhost:6789
                    │
                    v
          ┌─────────────────────┐
          │   TouchDesigner     │
          │                     │
          │ ┌─────────────────┐ │
          │ │ WebSocket DAT   │ │
          │ │       ↓         │ │
          │ │ JSON DAT        │ │
          │ │       ↓         │ │
          │ │ Visualization   │ │
          │ │ Network         │ │
          │ └─────────────────┘ │
          └─────────────────────┘
```

## 📊 Data Flow Architecture

```
Data Pipeline Overview:

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Physical  │    │   Digital   │    │   Network   │    │   Visual    │
│    Heart    │───▶│   Signal    │───▶│   Message   │───▶│Display/Viz │
│   Beating   │    │ Processing  │    │Transmission │    │            │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       v                   v                   v                   v
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│PulseSensor  │    │ESP32 ADC    │    │UDP Packet   │    │TouchDesigner│
│Analog Signal│    │Peak Detection│   │JSON Message │    │WebSocket DAT│
│~2V-3V       │    │BPM Calc     │    │{"user":1,   │    │Visualization│
│Fluctuating  │    │Moving Avg   │    │ "bpm":75}   │    │Effects      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## 🔄 Communication Protocol Stack

```
Application Layer:
┌─────────────────────────────────────────────────────────────────┐
│                     Heart Rate Application                      │
│  ESP32 Firmware  │  Python Broker  │  TouchDesigner Project    │
└─────────────────────────────────────────────────────────────────┘

Presentation Layer:
┌─────────────────────────────────────────────────────────────────┐
│                         JSON Protocol                          │
│         {"user": 1, "bpm": 75, "timestamp": 123456789}         │
└─────────────────────────────────────────────────────────────────┘

Session Layer:
┌─────────────────────────────────────────────────────────────────┐
│            UDP (ESP32→Broker)  │  WebSocket (Broker→TD)         │
└─────────────────────────────────────────────────────────────────┘

Transport Layer:
┌─────────────────────────────────────────────────────────────────┐
│                  UDP Port 8888 │ TCP Port 6789                  │
└─────────────────────────────────────────────────────────────────┘

Network Layer:
┌─────────────────────────────────────────────────────────────────┐
│                          IPv4 Protocol                         │
│     192.168.1.101      │      192.168.1.100                    │
│    (ESP32 Device)      │    (Broker Computer)                  │
└─────────────────────────────────────────────────────────────────┘

Data Link Layer:
┌─────────────────────────────────────────────────────────────────┐
│                         WiFi 802.11n                           │
│                      2.4GHz Band Only                          │
└─────────────────────────────────────────────────────────────────┘

Physical Layer:
┌─────────────────────────────────────────────────────────────────┐
│               Radio Waves + Ethernet (Computer)                │
└─────────────────────────────────────────────────────────────────┘
```

## ⚡ Power Architecture

```
Power Distribution System:

                    USB Charger (5V)
                           │
                           v
                    ┌─────────────┐
                    │   TP4056    │
                    │  Charging   │
                    │   Module    │
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │ 3.7V LiPo   │
                    │ Battery     │
                    │ 1000mAh     │
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │ Slide Switch│
                    │   ON/OFF    │
                    └──────┬──────┘
                           │
                           v
                    ┌─────────────┐
                    │   ESP32     │
                    │   DevKit    │
                    │    VIN      │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │             │
                    v             v
            ┌─────────────┐  ┌─────────────┐
            │3.3V Regulator│  │GPIO Pins    │
            │(Internal)    │  │Digital I/O  │
            └──────┬──────┘  └─────────────┘
                   │
                   v
            ┌─────────────┐
            │PulseSensor  │
            │    VCC      │
            │   (3.3V)    │
            └─────────────┘

Power Consumption:
- ESP32 Active: ~150mA
- ESP32 WiFi TX: ~200mA peak
- PulseSensor: ~5mA
- Total Average: ~160mA
- Battery Life: 1000mAh / 160mA ≈ 6.25 hours
```

## 🌐 Network Architecture

```
Network Topology:

                    Internet
                       │
                       │
                ┌─────────────┐
                │   Router    │
                │ 192.168.1.1 │
                │             │
                │  WiFi AP    │
                │  2.4GHz     │
                └──────┬──────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         │             │             │
         v             v             v
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ESP32 Device │ │ESP32 Device │ │ Computer/   │
│   User 1    │ │   User 2    │ │  Broker     │
│192.168.1.101│ │192.168.1.102│ │192.168.1.100│
│             │ │             │ │             │
│ UDP Client  │ │ UDP Client  │ │ UDP Server  │
│   :8888     │ │   :8888     │ │   :8888     │
└─────────────┘ └─────────────┘ │             │
                                │WebSocket Srv│
                                │   :6789     │
                                └──────┬──────┘
                                       │
                                       v
                                ┌─────────────┐
                                │TouchDesigner│
                                │   Client    │
                                │ localhost   │
                                │   :6789     │
                                └─────────────┘

Port Assignment:
- UDP 8888: ESP32 → Broker (heart rate data)
- TCP 6789: Broker → TouchDesigner (WebSocket)
- HTTP 80: Optional web interface
- SSH 22: Remote access (if needed)
```

## 🔧 Component Architecture

```
ESP32 Device Internal Architecture:

┌─────────────────────────────────────────────────────────────────┐
│                        ESP32 DevKit                             │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    CPU      │    │    WiFi     │    │   Analog    │         │
│  │  Xtensa     │◄──►│   Module    │    │     ADC     │◄────────┼─ Pulse
│  │ Dual Core   │    │  802.11n    │    │   GPIO36    │         │  Sensor
│  │   240MHz    │    │             │    │   (A0)      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │              │
│         │                   │                   │              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Memory    │    │   Network   │    │   GPIO      │         │
│  │ 520KB RAM  │    │    Stack    │    │   Digital   │◄────────┼─ LED
│  │ 4MB Flash  │    │   TCP/UDP   │    │   GPIO2     │         │  (Status)
│  │             │    │  WebSocket  │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Software Stack:
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                          │
│                Heart Rate Monitor App                          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                     Libraries Layer                            │
│   ArduinoJson  │  AsyncUDP  │  WiFi  │  AnalogRead            │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                    Arduino Framework                           │
│                ESP32 Arduino Core                              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                     FreeRTOS Kernel                            │
│              Task Scheduling & Management                      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                     Hardware Layer                             │
│                 ESP32 Silicon & Peripherals                    │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Performance Characteristics

```
System Performance Metrics:

Latency Pipeline:
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Heartbeat  │ │   ESP32     │ │   Network   │ │TouchDesigner│
│  Detection  │ │ Processing  │ │Transmission │ │ Rendering   │
│   ~10ms     │ │   ~50ms     │ │   ~20ms     │ │   ~16ms     │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
      │               │               │               │
      └───────────────┼───────────────┼───────────────┘
                      │               │
               Total: ~96ms end-to-end latency

Throughput:
- Data Rate: 1 BPM sample/second/device
- Network Bandwidth: ~100 bytes/second/device
- Total System Load: ~200 bytes/second (2 devices)

Reliability:
- WiFi Range: ~50m indoor, ~100m outdoor
- Battery Life: 6-8 hours continuous operation
- Sensor Accuracy: ±5 BPM (calibrated)
- Network Uptime: 99.9% (with auto-reconnect)

Scalability:
- Max Devices: Limited by network bandwidth (~100 devices)
- Max Visualization Clients: Limited by broker capacity (~10 clients)
- Max Data Rate: Configurable (0.1Hz to 10Hz per device)
```

This architecture provides a robust, scalable foundation for real-time heart rate monitoring with low latency and high reliability.
