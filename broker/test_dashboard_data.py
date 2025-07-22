#!/usr/bin/env python3
"""
Test BPM Data Generator

Generates fake heart rate data for testing TouchDesigner dashboard
without needing physical ESP32 devices.

Usage:
1. Start broker: python bpm_broker.py
2. Run this test: python test_dashboard_data.py
3. Open TouchDesigner dashboard
"""

import socket
import json
import time
import random
import math
import threading
from datetime import datetime

# Configuration
BROKER_HOST = "localhost"
BROKER_PORT = 8888
TEST_DURATION = 300  # 5 minutes
UPDATE_INTERVAL = 1.0  # Send data every 1 second

# Simulated users
USERS = {
    1: {
        "base_bpm": 72,  # User 1: Resting heart rate
        "variation": 5,   # +/- BPM variation
        "pattern": "resting"  # Activity pattern
    },
    2: {
        "base_bpm": 95,   # User 2: Active heart rate
        "variation": 8,
        "pattern": "active"
    }
}

def generate_realistic_bpm(user_id: int, timestamp: float) -> float:
    """Generate realistic heart rate data with patterns"""
    user_config = USERS[user_id]
    base_bpm = user_config["base_bpm"]
    variation = user_config["variation"]
    pattern = user_config["pattern"]

    # Time-based variations (simulate daily rhythm)
    time_factor = math.sin(timestamp / 60) * 0.3  # Slow variation over time

    # Activity patterns
    if pattern == "resting":
        # Gentle variations, occasional spikes
        if random.random() < 0.05:  # 5% chance of slight activity
            activity_spike = random.uniform(10, 20)
        else:
            activity_spike = 0
    elif pattern == "active":
        # More dynamic variations
        activity_spike = math.sin(timestamp / 10) * 15  # Rhythmic activity
        if random.random() < 0.1:  # 10% chance of high activity
            activity_spike += random.uniform(15, 25)
    else:
        activity_spike = 0

    # Random noise
    noise = random.uniform(-variation, variation)

    # Combine factors
    bpm = base_bpm + time_factor * 5 + activity_spike + noise

    # Clamp to realistic range
    return max(45, min(180, bpm))

def generate_signal_strength() -> int:
    """Generate realistic WiFi signal strength (-30 to -90 dBm)"""
    return random.randint(-90, -30)

def send_test_data(user_id: int, sock: socket.socket):
    """Send a single data packet for a user"""
    timestamp = time.time()
    bpm = generate_realistic_bpm(user_id, timestamp)
    signal_strength = generate_signal_strength()

    # Create data packet matching ESP32 format
    data = {
        "user": user_id,
        "bpm": round(bpm, 1),
        "timestamp": int(timestamp),
        "signal_strength": signal_strength
    }

    try:
        message = json.dumps(data).encode('utf-8')
        sock.sendto(message, (BROKER_HOST, BROKER_PORT))
        print(f"Sent User {user_id}: {bpm:.1f} BPM (Signal: {signal_strength} dBm)")
        return True
    except Exception as e:
        print(f"Error sending data for User {user_id}: {e}")
        return False

def run_user_simulation(user_id: int, stop_event: threading.Event):
    """Run simulation for a single user"""
    print(f"Starting simulation for User {user_id}")

    # Create UDP socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    try:
        while not stop_event.is_set():
            if send_test_data(user_id, sock):
                # Variable timing to simulate real sensors
                sleep_time = UPDATE_INTERVAL + random.uniform(-0.2, 0.2)
                time.sleep(sleep_time)
            else:
                time.sleep(1)  # Wait before retrying on error

    except KeyboardInterrupt:
        pass
    finally:
        sock.close()
        print(f"User {user_id} simulation stopped")

def main():
    """Main test function"""
    print("🫀 TouchDesigner BPM Dashboard Test Data Generator")
    print("=" * 50)
    print(f"Target: {BROKER_HOST}:{BROKER_PORT}")
    print(f"Users: {list(USERS.keys())}")
    print(f"Update interval: {UPDATE_INTERVAL}s")
    print()
    print("Make sure broker is running: python bpm_broker.py")
    print("Press Ctrl+C to stop")
    print()

    # Create stop event for coordinating threads
    stop_event = threading.Event()

    # Start simulation threads for each user
    threads = []
    for user_id in USERS.keys():
        thread = threading.Thread(
            target=run_user_simulation,
            args=(user_id, stop_event),
            name=f"User{user_id}Sim"
        )
        thread.start()
        threads.append(thread)

    try:
        # Run for specified duration or until interrupted
        if TEST_DURATION > 0:
            print(f"Running test for {TEST_DURATION} seconds...")
            time.sleep(TEST_DURATION)
            print("Test duration completed")
        else:
            print("Running indefinitely...")
            while True:
                time.sleep(1)

    except KeyboardInterrupt:
        print("\nStopping test...")

    finally:
        # Signal all threads to stop
        stop_event.set()

        # Wait for all threads to finish
        for thread in threads:
            thread.join(timeout=2)

        print("Test data generator stopped")

if __name__ == "__main__":
    main()
