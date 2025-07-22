# Wiring Guide - Heart Rate Monitor

Detailed wiring instructions for ESP32 heart rate monitoring devices.

## ⚠️ Safety First

### Electrical Safety
- **Disconnect power** before making connections
- **Check polarity** before connecting batteries
- **Use proper gauge wire** for current requirements
- **Insulate connections** to prevent shorts
- **Test with multimeter** before powering on

### Battery Safety
- **Never short circuit** LiPo batteries
- **Monitor temperature** during charging
- **Use proper LiPo charger** (TP4056)
- **Store safely** when not in use
- **Dispose properly** when worn out

## 🔌 Component Pinouts

### ESP32 DevKit Pinout
```
                    ESP32 DevKit V1
                   ┌─────────────────┐
                   │  [ ]        [ ] │ 3V3
                   │  [ ]        [ ] │ GND
                   │  [ ]        [ ] │ GPIO15
                   │  [ ]        [ ] │ GPIO2
                   │  [ ]        [ ] │ GPIO0
                   │  [ ]        [ ] │ GPIO4
                   │  [ ]        [ ] │ GPIO16
                   │  [ ]        [ ] │ GPIO17
                   │  [ ]        [ ] │ GPIO5
                   │  [ ]        [ ] │ GPIO18
                   │  [ ]        [ ] │ GPIO19
                   │  [ ]        [ ] │ GPIO21
                   │  [ ]        [ ] │ RX2
                   │  [ ]        [ ] │ TX2
                   │  [ ]        [ ] │ GND
                   │  [ ]        [ ] │ GPIO13
                   │  [ ]        [ ] │ GPIO12
                   │  [ ]        [ ] │ GPIO14
                   │  [ ]        [ ] │ GPIO27
                   │  [ ]        [ ] │ GPIO26
                   │  [ ]        [ ] │ GPIO25
                   │  [ ]        [ ] │ GPIO33
                   │  [ ]        [ ] │ GPIO32
                   │  [ ]        [ ] │ GPIO35
                   │  [ ]        [ ] │ GPIO34
VIN                │  [ ]        [ ] │ GPIO39
GND                │  [ ]        [ ] │ GPIO36  <- A0 (Pulse Sensor)
                   │  [ ]        [ ] │ EN
                   │  [ ] [USB] [ ] │ 3V3
                   └─────────────────┘
```

### Pulse Sensor Pinout
```
Pulse Sensor (Front View)
┌─────────────┐
│      💗      │  <- Heart symbol (front)
│             │
└─┬─────────┬─┘
  │    │    │
Red  Black Purple
VCC   GND  Signal
```

### TP4056 Charger Module Pinout
```
TP4056 Module (Top View)
┌─────────────────┐
│  [LED] [LED]    │ <- Charge/Power LEDs
│   RED   BLUE    │
│                 │
│ B+   B-   OUT+ OUT- │
│ │    │    │    │   │
│ └────┼────┼────┼───│
│      │    │    │   │
│    USB-C Port    │
└─────────────────┘

B+ : Battery Positive
B- : Battery Negative
OUT+: Output Positive (to switch)
OUT-: Output Negative (to ESP32 GND)
```

## 📐 Detailed Wiring Diagrams

### Device Wiring Schematic
```
                    LiPo Battery
                    ┌─────────┐
                    │ +    -  │
                    └─┬───┬───┘
                      │   │
                      │   │
                      v   v
                    TP4056 Module
                   ┌─────────────┐
                   │ B+  B-      │
                   │             │
                   │     OUT+ OUT-│
                   └──────┬────┬─┘
                          │    │
                          │    │
                     ┌────v────v─────┐
                     │  Slide Switch  │
                     │ 1   C   2      │  C = Common, 1&2 = Poles
                     └─────┬─────────┘
                           │
                           v
                      ESP32 DevKit
                     ┌─────────────┐
                     │VIN      A0  │←──┐
                     │             │   │
                     │GND     3.3V │←──┼──┐
                     │             │   │  │
                     │        GND  │←──┼──┼──┐
                     └─────────────┘   │  │  │
                                       │  │  │
                               ┌───────┼──┼──┼─────┐
                               │ Purple│  │  │Red  │
                               │   ┌───┘  │  └───┐ │
                               │   │ Black│      │ │
                               │   │   ┌──┘      │ │
                               │   │   │         │ │
                               │ ┌─v─┬─v─┬─────┬─v─┐ │
                               │ │Sig│GND│ ♥️  │VCC│ │
                               │ └───┴───┴─────┴───┘ │
                               │   Pulse Sensor      │
                               └─────────────────────┘
```

### Breadboard Layout
```
ESP32 DevKit on Breadboard (Top View)

Power Rails:     +  -     a b c d e  f g h i j     +  -
                 │  │     │ │ │ │ │  │ │ │ │ │     │  │
                 │  │   1 ○ ○ ○ ○ ○  ○ ○ ○ ○ ○  1  │  │
                 │  │   2 ○ ○ ○ ○ ○  ○ ○ ○ ○ ○  2  │  │
                 │  │   3 ○ ○ ○ ○ ○  ○ ○ ○ ○ ○  3  │  │
                 │  │  ...                       ... │  │
                 │  │  30 ○ ○ ○ ○ ○  ○ ○ ○ ○ ○ 30  │  │
                 │  │     └─ESP32 DevKit─────┘       │  │
                 │  │                                │  │
              Red│  │Black                          │  │Purple
         Pulse ┌─┴──┴─┐                             │  └─────┐
        Sensor │  ♥️  │                             │        │
               └──────┘                             └────────┘
                                                       A0 Pin
```

## 🔧 Step-by-Step Wiring

### Step 1: Prepare Components
1. **Check all components** for damage
2. **Test ESP32** by connecting to USB (blue LED should light)
3. **Verify TP4056** by connecting USB (red charging LED)
4. **Check pulse sensor** for loose connections
5. **Test slide switch** with multimeter for continuity

### Step 2: Power System Wiring

#### A. Battery to TP4056
```
LiPo Battery Red Wire    → TP4056 B+
LiPo Battery Black Wire  → TP4056 B-
```
⚠️ **Double-check polarity!** Reversed polarity can damage components.

#### B. TP4056 to Switch
```
TP4056 OUT+  → Slide Switch Pin 1 (or Common)
TP4056 OUT-  → ESP32 GND
```

#### C. Switch to ESP32
```
Slide Switch Pin 2  → ESP32 VIN
ESP32 GND          → TP4056 OUT- (already connected)
```

### Step 3: Pulse Sensor Wiring

#### Connection Order:
```
1. Pulse Sensor VCC (Red)    → ESP32 3.3V
2. Pulse Sensor GND (Black)  → ESP32 GND
3. Pulse Sensor Signal (Purple) → ESP32 A0 (GPIO36)
```

#### Breadboard Connections:
1. **Insert ESP32** into breadboard (straddling center gap)
2. **Connect power rails** to breadboard + and - strips
3. **Add jumper wires** from ESP32 to pulse sensor
4. **Use different colors** for easy identification

### Step 4: Final Assembly

#### Secure Connections
1. **Push connections firmly** into breadboard
2. **Check for loose wires** by gently tugging
3. **Verify no shorts** between adjacent pins
4. **Route wires neatly** to avoid tangles

#### Cable Management
```
Power System:        Battery → TP4056 → Switch → ESP32
Sensor Connection:   Pulse Sensor → ESP32 A0/3.3V/GND
Status Indicator:    ESP32 built-in LED (GPIO2)
```

## 🔍 Connection Verification

### Pre-Power Checks
Use a multimeter to verify:

1. **Battery Voltage**: 3.7V ± 0.5V
2. **Switch Continuity**: Closed when ON
3. **No Shorts**: Check between VCC and GND
4. **Pulse Sensor**: ~2V on signal line (finger off sensor)

### Power-On Sequence
1. **Switch OFF** → Connect battery → No ESP32 activity
2. **Switch ON** → ESP32 blue LED lights → Success!
3. **USB to TP4056** → Red charging LED → Success!
4. **Monitor serial** → WiFi connection messages → Success!

## 📏 Wire Lengths and Management

### Recommended Wire Lengths
- **Pulse sensor to ESP32**: 15-20cm (6-8 inches)
- **Battery to TP4056**: 10cm (4 inches)
- **TP4056 to switch**: 5cm (2 inches)
- **Switch to ESP32**: 5cm (2 inches)

### Wire Gauge
- **Power connections**: 22 AWG minimum
- **Signal connections**: 24-26 AWG acceptable
- **Battery connections**: 20 AWG recommended

### Color Coding
| Connection | Wire Color | Purpose |
|------------|------------|---------|
| VCC/Power | Red | Positive voltage |
| Ground | Black | Ground/negative |
| Signal | Purple/Yellow | Data/analog signal |
| Control | Blue/Green | Switch/control signals |

## 🔧 Tools Required

### Essential Tools
- **Wire strippers** (for custom wire lengths)
- **Small screwdriver** (for TP4056 terminals if applicable)
- **Multimeter** (for testing connections)
- **Needle-nose pliers** (for precise placement)

### Optional Tools
- **Breadboard jumper kit** (various lengths)
- **Heat shrink tubing** (for permanent connections)
- **Soldering iron** (for permanent assembly)
- **Cable ties** (for wire management)

## 🛠️ Troubleshooting Wiring Issues

### Power Problems
| Symptom | Cause | Solution |
|---------|-------|----------|
| ESP32 won't power on | Switch off, loose connection | Check switch position, verify connections |
| TP4056 not charging | USB connection, battery polarity | Check USB cable, verify battery connections |
| ESP32 resets randomly | Loose power connection | Check VIN and GND connections |

### Sensor Problems
| Symptom | Cause | Solution |
|---------|-------|----------|
| No pulse reading | Loose signal wire | Check A0 connection |
| Erratic readings | Poor sensor contact | Clean sensor, check 3.3V supply |
| Constant high reading | Signal wire touching VCC | Check for shorts |

### Quick Diagnostic Tests
```bash
# Test 1: Power continuity
multimeter VIN to battery positive (switch ON) → Should read ~3.7V

# Test 2: Ground continuity
multimeter ESP32 GND to battery negative → Should read 0 ohms

# Test 3: Sensor power
multimeter pulse sensor VCC to ESP32 3.3V → Should read ~3.3V

# Test 4: Signal connection
multimeter pulse sensor signal to ESP32 A0 → Should read 0 ohms
```

## 📝 Wiring Checklist

### Before First Power-On
- [ ] Battery polarity correct (red to +, black to -)
- [ ] TP4056 connections secure
- [ ] Switch wired correctly
- [ ] ESP32 VIN and GND connected
- [ ] Pulse sensor VCC to 3.3V (not 5V!)
- [ ] Pulse sensor signal to A0 (GPIO36)
- [ ] No loose connections
- [ ] No shorts between power rails
- [ ] Multimeter verification complete

### After Power-On
- [ ] ESP32 blue LED illuminates
- [ ] TP4056 charging LED works (with USB)
- [ ] Serial monitor shows boot messages
- [ ] WiFi connection successful
- [ ] Pulse sensor readings appear
- [ ] UDP data transmission confirmed

## 🔄 Making Changes Safely

### Modifying Connections
1. **Power OFF** (switch and unplug USB)
2. **Wait 10 seconds** for capacitors to discharge
3. **Make changes** carefully
4. **Double-check** all connections
5. **Power ON** and test

### Adding Components
- Always check power requirements
- Verify GPIO pin availability
- Consider current consumption
- Test incrementally

This completes the wiring guide. Follow these instructions carefully, and your heart rate monitoring system should work reliably and safely!
