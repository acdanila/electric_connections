# 💓 Heart Rate Sync Dashboard

A beautiful, real-time web dashboard that displays heart rate data from two users with synchronized animations and sync detection.

## ✨ Features

### 🎨 Visual Elements
- **Animated Hearts**: Pulsing heart emojis that beat in real-time with actual BPM
- **Sync Detection**: Special golden glow effects when heart rates are synchronized
- **Signal Strength**: WiFi-style bars showing connection quality
- **Real-time Updates**: Live BPM numbers with smooth transitions

### 🔗 Sync Animations
- **Close Match Detection**: Automatically detects when BPMs are within 8 beats
- **Global Sync Effects**: Entire dashboard pulses and glows when users are in sync
- **Connection Line**: Animated line between users showing sync status
- **Sync Statistics**: Tracks percentage of time users spend synchronized

### 📝 Customizable Names
- **Live Name Updates**: Edit `user_names.json` and see changes within 5 seconds
- **Easy Configuration**: Simple JSON format for quick modifications

## 🚀 Quick Start

### Step 1: Start the Broker
```bash
# Terminal 1: Start the BPM broker
cd broker
python bpm_broker.py
```

### Step 2: Start Test Data (Optional)
```bash
# Terminal 2: Generate realistic test data
cd broker
python test_dashboard_data.py
```

### Step 3: Start the Dashboard
```bash
# Terminal 3: Start the web server
cd web_dashboard
python server.py
```

### Step 4: Open in Browser
Visit: **http://localhost:8080**

## 📁 Files Overview

```
web_dashboard/
├── index.html          # Main dashboard HTML structure
├── styles.css          # Beautiful CSS with animations
├── dashboard.js        # WebSocket connection & logic
├── user_names.json     # Editable user names (YOU CAN EDIT THIS!)
├── server.py           # Simple HTTP server
└── README.md           # This file
```

## 🎮 How to Use

### Changing User Names
1. Edit `web_dashboard/user_names.json`:
   ```json
   {
     "user1": "Emma",
     "user2": "Liam"
   }
   ```
2. Save the file
3. Names update automatically within 5 seconds!

### Understanding the Dashboard

#### User Sections
- **Heart Animation**: Beats at the user's actual BPM rate
- **BPM Display**: Large number showing current heart rate
- **Signal Bars**: Connection strength indicator
- **Stats**: Last update time and raw BPM value

#### Sync Indicator (Center)
- **Gray**: Users not synchronized
- **Golden/Pulsing**: Users are in sync! ✨
- **Difference**: Shows BPM difference between users

#### Footer Stats
- **Active Users**: How many users are sending data
- **Avg BPM**: Average heart rate across all users
- **Sync Time**: Percentage of time users have been synchronized

## 🎨 Sync Animation Effects

The dashboard creates magical effects when users' heart rates synchronize:

### When BPMs Match (within 8 beats):
1. **Golden Glow**: User cards get a golden border with pulsing glow
2. **Sync Indicator**: Center indicator becomes active and animated
3. **Global Pulse**: Entire dashboard background subtly pulses
4. **Connection Line**: Animated line appears between users
5. **Color Changes**: Sync difference text turns golden

### Heart Rate Animations:
- **Slow BPM** (<60): 1.5 second heartbeat cycle
- **Normal BPM** (60-100): 1 second heartbeat cycle
- **Fast BPM** (>100): 0.5 second heartbeat cycle
- **Exact Timing**: Animation speed matches real BPM precisely

## 🛠️ Technical Details

### WebSocket Connection
- **Auto-connect**: Connects to `ws://localhost:6789` on startup
- **Auto-reconnect**: Automatically reconnects if connection drops
- **Status Indicator**: Shows connection state in header

### Data Processing
- **Real-time**: Updates immediately when new data arrives
- **Smoothing**: Displays both raw and smoothed BPM values
- **History Tracking**: Keeps sync history for statistics

### Responsive Design
- **Desktop**: Side-by-side layout with center sync indicator
- **Mobile**: Stacked layout optimized for smaller screens
- **Modern**: Uses CSS Grid, Flexbox, and modern animations

## 🔧 Customization

### Sync Sensitivity
Edit `dashboard.js` line 17:
```javascript
this.syncThreshold = 8; // Change this number (lower = more sensitive)
```

### Colors & Themes
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-color: #ff4757;     /* User 1 color */
    --secondary-color: #3742fa;   /* User 2 color */
    --sync-color: #ffa502;        /* Sync effect color */
    /* ... more variables ... */
}
```

### Animation Speeds
Modify animation durations in `styles.css`:
```css
@keyframes heartbeat {
    /* Customize heartbeat animation */
}

@keyframes sync-glow {
    /* Customize sync glow effect */
}
```

## 🐛 Troubleshooting

### Dashboard Not Loading
1. **Check server**: Is `python server.py` running?
2. **Check URL**: Visit `http://localhost:8080`
3. **Check browser console**: Press F12 → Console tab

### No Heart Rate Data
1. **Check broker**: Is `python bpm_broker.py` running?
2. **Check WebSocket**: Look for "Connected" in dashboard header
3. **Use test data**: Run `python test_dashboard_data.py`

### Names Not Updating
1. **Check file format**: Ensure `user_names.json` is valid JSON
2. **Check file location**: Must be in `web_dashboard/` folder
3. **Wait 5 seconds**: Names update every 5 seconds automatically

### Connection Issues
- **Firewall**: Ensure ports 6789 (WebSocket) and 8080 (HTTP) are open
- **Network**: All services must run on same machine/network
- **Browser**: Modern browser required (Chrome, Firefox, Safari, Edge)

## 🎯 Advanced Features

### Debug Mode
Click the sync indicator in the center to log sync status to console (F12 → Console).

### Performance Monitoring
The dashboard includes:
- **Error Handling**: Graceful error recovery
- **Memory Management**: Automatic cleanup of old data
- **Connection Monitoring**: Smart reconnection logic

### Browser Compatibility
- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+

## 🚀 What's Next?

Ideas for extending the dashboard:
- **Sound Effects**: Audio feedback for heartbeats and sync
- **Data Export**: Save sync data to CSV files
- **Multiple Users**: Support for more than 2 users
- **Themes**: Dark/light mode toggle
- **Alerts**: Notifications for unusual heart rates

## 💡 Tips

1. **Full Screen**: Press F11 for immersive full-screen experience
2. **Live Names**: Keep `user_names.json` open in a text editor for quick changes
3. **Multiple Browsers**: Open dashboard in multiple browser windows
4. **Test Data**: Use the test data generator to explore all features
5. **Mobile**: Dashboard works great on tablets and phones too!

---

**Enjoy your beautiful heart rate sync dashboard!** 💖✨
