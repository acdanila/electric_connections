# BPM Broker Usage Guide

This guide shows how to use the new signal smoothing and live plotting features.

## Quick Start

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the broker**:
   ```bash
   python bpm_broker.py
   ```

3. **Test with simulated data** (in another terminal):
   ```bash
   python test_bpm_data.py --users 2 --rate 1.0
   ```

## What You'll See

### Terminal Output
The broker will show enhanced logging with smoothing information:
```
2024-01-15 10:30:15 - INFO - Starting BPM Broker...
2024-01-15 10:30:15 - INFO - WebSocket server starting on 0.0.0.0:6789
2024-01-15 10:30:15 - INFO - UDP server listening on 0.0.0.0:8888
2024-01-15 10:30:16 - INFO - Live plotting started
2024-01-15 10:30:20 - INFO - Created signal smoother for User 1
2024-01-15 10:30:20 - INFO - User 1 (127.0.0.1): 78.5 → 78.5 BPM (smoothed)
2024-01-15 10:30:21 - INFO - User 1 (127.0.0.1): 82.1 → 79.5 BPM (smoothed)
```

### Live Plot Window
A matplotlib window will open showing:
- Real-time heart rate graphs for each user
- Different colors for different users
- Current BPM values annotated on the graph
- Connection status and statistics

## Signal Smoothing Features

### Exponential Moving Average
- Smooths out rapid fluctuations
- Configurable smoothing factor (α = 0.3 default)
- Lower α = more smoothing, higher α = more responsive

### Outlier Detection
- Detects sudden jumps > 15 BPM (configurable)
- Uses median of recent history to replace outliers
- Logs outlier detections for monitoring

### Range Validation
- Ensures BPM values stay within 40-200 range
- Rejects impossible values
- Maintains data integrity

## Configuration

Edit the constants at the top of `bpm_broker.py`:

```python
# Signal processing configuration
SMOOTHING_ENABLED = True        # Enable/disable all smoothing
SMOOTHING_ALPHA = 0.3          # EMA factor (0-1)
OUTLIER_THRESHOLD = 15         # BPM difference for outlier detection
HISTORY_LENGTH = 100           # Samples to keep in memory
MIN_BPM = 40                   # Minimum valid BPM
MAX_BPM = 200                  # Maximum valid BPM

# Plotting configuration
ENABLE_PLOTTING = True         # Enable/disable live plotting
PLOT_WINDOW_SIZE = 50          # Samples shown in plot
PLOT_UPDATE_INTERVAL = 100     # Milliseconds between updates
```

## Testing Scenarios

### Normal Operation
```bash
python test_bpm_data.py --users 1 --rate 2.0
```
- Simulates normal heart rate with small variations
- Shows smooth filtering in action

### Multiple Users
```bash
python test_bpm_data.py --users 3 --rate 1.5
```
- Different colors for each user
- Independent smoothing for each signal

### Stress Testing
```bash
python test_bpm_data.py --users 5 --rate 5.0 --duration 120
```
- High data rate to test performance
- Multiple simultaneous users

## WebSocket API

### Get Smoothing Status
```json
{"type": "get_status"}
```

Response includes smoothing configuration:
```json
{
  "type": "status_response",
  "smoothing_enabled": true,
  "smoothing_config": {
    "alpha": 0.3,
    "outlier_threshold": 15,
    "history_length": 100
  },
  ...
}
```

### Get Signal History
```json
{"type": "get_signal_history", "user_id": 1}
```

Response includes complete smoothed history and statistics:
```json
{
  "type": "signal_history_response",
  "user_id": 1,
  "history": [75.2, 75.8, 76.1, ...],
  "statistics": {
    "mean": 75.5,
    "std": 2.3,
    "min": 70.1,
    "max": 82.4,
    "last": 76.1
  }
}
```

### Get All Statistics
```json
{"type": "get_all_statistics"}
```

Returns statistics for all active users.

## Data Format

The broker now outputs enhanced data with smoothing information:

```json
{
  "user": 1,
  "bpm": 75.8,           # Smoothed value
  "bpm_raw": 79.2,       # Original raw value
  "bpm_smoothed": true,   # Indicates smoothing was applied
  "signal_stats": {      # Real-time statistics
    "mean": 75.5,
    "std": 2.3,
    "min": 70.1,
    "max": 82.4,
    "last": 75.8
  },
  "timestamp": 1234567890.123,
  "server_timestamp": 1234567891.456,
  "source_ip": "192.168.1.101",
  "received_at": "2024-01-15T10:30:20.123456"
}
```

## Troubleshooting

### No Plot Window Appears
- Check if matplotlib backend supports GUI (try `pip install tkinter`)
- Set `ENABLE_PLOTTING = False` if running headless
- Check for display/X11 forwarding on remote systems

### High CPU Usage
- Reduce `PLOT_UPDATE_INTERVAL` (increase the number)
- Reduce `PLOT_WINDOW_SIZE`
- Disable plotting with `ENABLE_PLOTTING = False`

### Smoothing Too Aggressive
- Increase `SMOOTHING_ALPHA` (closer to 1.0)
- Increase `OUTLIER_THRESHOLD`
- Disable with `SMOOTHING_ENABLED = False`

### Smoothing Not Enough
- Decrease `SMOOTHING_ALPHA` (closer to 0.0)
- Decrease `OUTLIER_THRESHOLD`
- Increase `HISTORY_LENGTH` for better outlier detection

## Performance Notes

- Smoothing adds minimal computational overhead
- Plotting can use significant CPU on older systems
- Memory usage scales with `HISTORY_LENGTH` × number of users
- WebSocket clients receive both raw and smoothed values
