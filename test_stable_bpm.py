#!/usr/bin/env python3
"""
Test script to send stable BPM data to verify the fix for circle movement
Sends constant 70.0 BPM readings to both users to confirm circles stay still
"""

import socket
import json
import time

def send_stable_bpm_data():
    """Send stable BPM data to test the dashboard fix"""

    # UDP configuration
    UDP_IP = "127.0.0.1"
    UDP_PORT = 8888

    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    print("🧪 Testing stable BPM data - circles should NOT move")
    print("📡 Sending constant 70.0 BPM to both users...")
    print("👀 Watch the browser console for 'skipping visual updates' messages")
    print("🎯 Expected: Circles should stay perfectly still after initial sync")
    print("=" * 60)

    try:
        reading_count = 0

        while True:
            reading_count += 1

            # Send data for User 1
            data1 = {
                "user": 1,
                "bpm": 70.0,
                "signal_strength": 95,
                "finger_detected": True,
                "timestamp": time.time()
            }

            # Send data for User 2
            data2 = {
                "user": 2,
                "bpm": 70.0,
                "signal_strength": 92,
                "finger_detected": True,
                "timestamp": time.time()
            }

            # Send both readings
            sock.sendto(json.dumps(data1).encode(), (UDP_IP, UDP_PORT))
            sock.sendto(json.dumps(data2).encode(), (UDP_IP, UDP_PORT))

            if reading_count % 10 == 0:
                print(f"📊 Sent {reading_count} stable readings (70.0 BPM for both users)")
                print("   ➡️ Check browser console - should see 'BPM unchanged' messages")

            # Wait 500ms between readings (similar to ESP32)
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n✅ Test completed after {reading_count} readings")
        print("🔍 Expected results:")
        print("   • Circles should be stationary and synced (green background)")
        print("   • Browser console should show 'BPM unchanged - skipping visual updates'")
        print("   • No continuous movement or transitions")

    finally:
        sock.close()

if __name__ == "__main__":
    send_stable_bpm_data()
