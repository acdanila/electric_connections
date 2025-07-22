 # Wiring Diagrams - Heart Rate Monitor

Visual wiring diagrams for connecting all hardware components.

## 🔌 Complete Device Wiring

```
Full Device Schematic (Per Device):

                    3.7V LiPo Battery
                    ┌─────────────────┐
                    │    1000mAh      │
                    │  ┌───┐   ┌───┐  │
                    │  │ + │   │ - │  │
                    └──┼───┼───┼───┼──┘
                       │   │   │   │
                  Red  │   │   │   │  Black
                       │   │   │   │
                       v   │   │   v
                    ┌─────────────────┐
                    │   TP4056 Module │
                    │                 │
                    │ B+┌─┐ ┌─┐B-     │
                    │   │ │ │ │       │
                    │   │ │ │ │       │
                    │   │ │ │ │       │
                    │ OUT+─┘ └─OUT-   │
                    │                 │
                    │    [USB-C]      │
                    └────┼─────┼──────┘
                         │     │
                    Red  │     │  Black
                         │     │
                         v     │
                 ┌───────────────────┐
                 │   Slide Switch    │
                 │                   │
                 │   1 ──○── 2       │
                 │       │           │
                 │       C           │
                 └───────┼───────────┘
                         │
                    Red  │
                         │
                         v
              ┌─────────────────────────┐
              │       ESP32 DevKit      │
              │                         │
              │ VIN●                    │◄─── Red (Power)
              │                         │
              │ GND●                    │◄─── Black (Ground)
              │                         │
              │     ...GPIO Pins...     │
              │                         │
              │ 3V3●                    │◄─── Red (Sensor VCC)
              │                         │
              │ GND●                    │◄─── Black (Sensor GND)
              │                         │
              │ A0 ●                    │◄─── Purple (Sensor Signal)
              │ (GPIO36)                │
              │                         │
              │ GPIO2●                  │◄─── Built-in LED
              └─────────────────────────┘
                         │   │   │
                    3.3V │   │   │ A0
                     GND │   │   │
                         │   │   │
                         v   v   v
              ┌─────────────────────────┐
              │     Pulse Sensor        │
              │                         │
              │         ♥️              │
              │                         │
              │  VCC  GND  Signal       │
              │   │    │     │          │
              │  Red Black Purple       │
              └───┼────┼─────┼──────────┘
                  │    │     │
                  └────┼─────┼──────────── To ESP32
                       │     │
                       └─────┼──────────── GND
                             │
                             └──────────── A0 (GPIO36)
```

## 🔧 Breadboard Layout

```
Breadboard Wiring Layout (Top View):

Power Rails    Tie Points                    Tie Points    Power Rails
    +  -      a b c d e | f g h i j             a b c d e | f g h i j      +  -
    │  │      │ │ │ │ │ │ │ │ │ │ │             │ │ │ │ │ │ │ │ │ │ │      │  │
────┼──┼────  1○○○○○○○○○○○             1○○○○○○○○○○○  ────┼──┼────
    │  │      2○○○○○○○○○○○             2○○○○○○○○○○○      │  │
    │  │      3○○○○○○○○○○○             3○○○○○○○○○○○      │  │
    │  │      4○○○○○○○○○○○             4○○○○○○○○○○○      │  │
    │  │      5○○○○○○○○○○○             5○○○○○○○○○○○      │  │
    │  │      6○○○○○○○○○○○             6○○○○○○○○○○○      │  │
    │  │      7○○○○○○○○○○○             7○○○○○○○○○○○      │  │
    │  │      8○○○○○○○○○○○             8○○○○○○○○○○○      │  │
    │  │      9○○○○○○○○○○○             9○○○○○○○○○○○      │  │
    │  │     10○○○○○○○○○○○            10○○○○○○○○○○○      │  │
    │  │     11○○○○○○○○○○○            11○○○○○○○○○○○      │  │
    │  │     12○○○○○○○○○○○            12○○○○○○○○○○○      │  │
    │  │     13○○○○○○○○○○○            13○○○○○○○○○○○      │  │
    │  │     14○○○○○○○○○○○            14○○○○○○○○○○○      │  │
    │  │     15○○○●●●●●●○○   ESP32    15○○●●●●●●○○○      │  │
    │  │     16○○○●●●●●●○○            16○○●●●●●●○○○      │  │
    │  │     17○○○●●●●●●○○  DevKit    17○○●●●●●●○○○      │  │
    │  │     18○○○●●●●●●○○            18○○●●●●●●○○○      │  │
    │  │     19○○○●●●●●●○○   Module   19○○●●●●●●○○○      │  │
    │  │     20○○○●●●●●●○○            20○○●●●●●●○○○      │  │
    │  │     21○○○●●●●●●○○            21○○●●●●●●○○○      │  │
    │  │     22○○○●●●●●●○○            22○○●●●●●●○○○      │  │
    │  │     23○○○●●●●●●○○            23○○●●●●●●○○○      │  │
    │  │     24○○○●●●●●●○○            24○○●●●●●●○○○      │  │
    │  │     25○○○●●●●●●○○            25○○●●●●●●○○○      │  │
    │  │     26○○○●●●●●●○○            26○○●●●●●●○○○      │  │
    │  │     27○○○●●●●●●○○            27○○●●●●●●○○○      │  │
    │  │     28○○○●●●●●●○○            28○○●●●●●●○○○      │  │
    │  │     29○○○●●●●●●○○            29○○●●●●●●○○○      │  │
    │  │     30○○○●●●●●●○○            30○○●●●●●●○○○      │  │
────┼──┼────    └─────────────┘              └─────────────┘    ────┼──┼────
    │  │                                                           │  │
    └──┼─────────────────────────── Power Connections ────────────┼──┘
       │                                                           │
       └─ Black (GND)                                 Red (VCC) ─┘

Wire Connections:
- Red wire from + rail to ESP32 VIN
- Black wire from - rail to ESP32 GND  
- Red wire from ESP32 3.3V to pulse sensor VCC
- Black wire from ESP32 GND to pulse sensor GND
- Purple wire from ESP32 A0 to pulse sensor Signal
```

## ⚡ Power Circuit Detail

```
Power Management Circuit:

USB Charger                     Load (ESP32 + Sensor)
    5V                               3.3V @ 200mA
     │                                     │
     v                                     │
┌─────────────┐                           │
│   TP4056    │                           │
│             │                           │
│ ┌─────────┐ │      ┌─────────────┐      │
│ │Charge   │ │      │             │      │
│ │Control  │ │      │   3.7V      │      │
│ │         │ │      │   LiPo      │      │
│ │ ○───────┼─┼──────┼─  Battery   ┼──────┘
│ │ │ ○─────┼─┼──────┼─            │
│ └─┼─┼─────┘ │      │ 1000mAh     │
│   │ │       │      │             │
│   │ │       │      └─────────────┘
│ ○─┼─┘       │              │
│   │         │              │
│ ○─┘         │              │
│             │              │
│  RED  BLUE  │              │
│  LED  LED   │              │
└─────────────┘              │
      │   │                  │
      │   │                  │
   Charging Power            │
   Status   OK              │
                             │
                             v
                    ┌─────────────┐
                    │Switch (SPDT)│
                    │             │
                    │  1 ○───○ 2  │
                    │      │      │
                    │      C      │
                    └──────┼──────┘
                           │
                           v
                    ┌─────────────┐
                    │    ESP32    │
                    │             │
                    │ VIN ○───────┼─── From Switch
                    │             │
                    │ GND ○───────┼─── To Battery -
                    │             │
                    │ 3V3 ○───────┼─── To Pulse Sensor
                    │             │
                    │ A0  ○───────┼─── From Pulse Sensor
                    └─────────────┘

Switch Positions:
Position 1: Connect Battery → ESP32 (Device ON)
Position 2: Disconnect Battery (Device OFF)
Center: Open circuit (Device OFF)
```

## 📡 Signal Path Diagram

```
Analog Signal Processing Chain:

Human Heart                        ESP32 Digital Processing
     ♥️                                    📱
     │                                     │
     │ Blood pulse                        │
     │ pressure wave                      │
     │                                    │
     v                                    │
┌─────────────┐                          │
│ Pulse Sensor│                          │
│             │                          │
│ Optical     │                          │
│ Detection   │                          │
│             │                          │
│ Output:     │                          │
│ 1.5V - 3V   │                          │
│ Variable    │                          │
└──────┬──────┘                          │
       │                                 │
       │ Analog Signal                   │
       │ ~2.5V baseline                  │
       │ ±0.5V variation                 │
       │                                 │
       v                                 │
┌─────────────┐                          │
│    ESP32    │                          │
│     ADC     │                          │
│             │                          │
│ 12-bit      │                          │
│ Resolution  │                          │
│ 0-4095      │                          │
│ Range       │                          │
└──────┬──────┘                          │
       │                                 │
       │ Digital Values                  │
       │ 1860-3070 range                 │
       │ ~2048 center                    │
       │                                 │
       v                                 │
┌─────────────┐                          │
│Peak Detection│                         │
│Algorithm     │                         │
│              │                         │
│Threshold:    │                         │
│2048 (adj.)   │                         │
│              │                         │
│Rising Edge   │                         │
│Detection     │                         │
└──────┬──────┘                          │
       │                                 │
       │ Beat Events                     │
       │ Timestamp                       │
       │                                 │
       v                                 │
┌─────────────┐                          │
│ BPM         │                          │
│ Calculation │                          │
│             │                          │
│ 60000ms /   │                          │
│ interval    │                          │
│             │                          │
│ Moving Avg  │                          │
│ (10 beats)  │                          │
└──────┬──────┘                          │
       │                                 │
       │ BPM Value                       │
       │ 60-180 range                    │
       │                                 │
       v                                 │
┌─────────────┐                          │
│ JSON        │                          │
│ Formatting  │                          │
│             │                          │
│{"user": 1,  │                          │
│ "bpm": 75,  │                          │
│ "timestamp":│                          │
│ 123456789}  │                          │
└──────┬──────┘                          │
       │                                 │
       │ UDP Packet                      │
       │                                 │
       v                                 │
    Network ──────────────────────────────┘
```

## 🔗 Connection Matrix

```
Connection Reference Table:

ESP32 Pin    │ Connection Type │ Destination      │ Wire Color │ Function
─────────────┼─────────────────┼──────────────────┼────────────┼─────────────
VIN          │ Power Input     │ TP4056 OUT+     │ Red        │ Main Power
GND          │ Ground          │ TP4056 OUT-     │ Black      │ Ground
3V3          │ Power Output    │ Pulse Sensor VCC│ Red        │ Sensor Power
GND          │ Ground          │ Pulse Sensor GND│ Black      │ Sensor Ground
A0 (GPIO36)  │ Analog Input    │ Pulse Sensor Sig│ Purple     │ Heart Signal
GPIO2        │ Digital Output  │ Built-in LED    │ Internal   │ Status LED
EN           │ Reset/Enable    │ Not Connected   │ None       │ Not Used
TX/RX        │ Serial/USB      │ Programming     │ Internal   │ Debug/Upload

TP4056 Pin   │ Connection Type │ Destination      │ Wire Color │ Function
─────────────┼─────────────────┼──────────────────┼────────────┼─────────────
B+           │ Battery Input   │ LiPo Battery +  │ Red        │ Battery +
B-           │ Battery Input   │ LiPo Battery -  │ Black      │ Battery -
OUT+         │ Power Output    │ Slide Switch 1  │ Red        │ Switched +
OUT-         │ Power Output    │ ESP32 GND       │ Black      │ Ground
USB+/USB-    │ Charging Input  │ USB Charger     │ Internal   │ 5V Charging

Pulse Sensor │ Connection Type │ Destination      │ Wire Color │ Function
─────────────┼─────────────────┼──────────────────┼────────────┼─────────────
VCC          │ Power Input     │ ESP32 3V3       │ Red        │ 3.3V Power
GND          │ Ground          │ ESP32 GND       │ Black      │ Ground
Signal       │ Analog Output   │ ESP32 A0        │ Purple     │ Heart Signal

Switch       │ Connection Type │ Destination      │ Wire Color │ Function
─────────────┼─────────────────┼──────────────────┼────────────┼─────────────
Pin 1        │ Input           │ TP4056 OUT+     │ Red        │ Battery +
Pin 2        │ Output          │ ESP32 VIN       │ Red        │ Switched +
Common       │ Moving Contact  │ Internal        │ None       │ Switch Action
```

## 🛠️ Assembly Order

```
Recommended Assembly Sequence:

Step 1: Power System
┌─────────────────────────────────────────┐
│ 1. Connect Battery to TP4056           │
│    Red → B+, Black → B-                │
│ 2. Connect TP4056 to Switch            │
│    OUT+ → Switch Pin 1                 │
│ 3. Connect Switch to ESP32             │
│    Pin 2 → ESP32 VIN                   │
│ 4. Connect TP4056 to ESP32             │
│    OUT- → ESP32 GND                    │
└─────────────────────────────────────────┘
              │
              v
Step 2: Sensor System
┌─────────────────────────────────────────┐
│ 1. Connect Pulse Sensor Power          │
│    VCC → ESP32 3V3                     │
│    GND → ESP32 GND                     │
│ 2. Connect Pulse Sensor Signal         │
│    Signal → ESP32 A0 (GPIO36)          │
└─────────────────────────────────────────┘
              │
              v
Step 3: Verification
┌─────────────────────────────────────────┐
│ 1. Check all connections with          │
│    multimeter                          │
│ 2. Test power (switch on = LED on)     │
│ 3. Test charging (USB = red LED)       │
│ 4. Upload firmware and test            │
└─────────────────────────────────────────┘
```

This completes the wiring diagrams. Follow these carefully for a reliable, safe build!