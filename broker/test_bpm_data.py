#!/usr/bin/env python3
"""
Test BPM Data Generator

Simulates ESP32 devices sending heart rate data to test the BPM broker's
signal smoothing and live plotting features.

Usage:
    python test_bpm_data.py
"""

import socket
import json
import time
import random
import math
import threading
import argparse

# Default configuration
DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 8888
DEFAULT_USERS = 2
DEFAULT_RATE = 1.0  # messages per second

# Shared beat counter across threads
global_beat_count = 0
global_beat_lock = threading.Lock()

class HeartRateSimulator:
    """Simulates patterned heart rate for cyclic synchrony/divergence"""

    def __init__(self, user_id: int, base_bpm: float = 75.0):
        self.user_id = user_id
        self.base_bpm = base_bpm

    def get_bpm(self, beat_count: int) -> float:
        """Generate BPM based on cyclic synchronization logic"""
        cycle_beat = beat_count % 40  # 0–39 beats per cycle
        delta = 0

        if cycle_beat < 20:
            # Perfect sync for 20 beats
            delta = 0
        elif 20 <= cycle_beat < 30:
            # Diverge linearly (e.g., ±10 BPM)
            progress = (cycle_beat - 20) / 10.0
            delta = 10 * progress
        else:
            # Converge linearly back
            progress = (cycle_beat - 30) / 10.0
            delta = 10 * (1 - progress)

        # Alternate users go in opposite directions
        if self.user_id % 2 == 0:
            bpm = self.base_bpm + delta
        else:
            bpm = self.base_bpm - delta

        # Small noise
        bpm += random.gauss(0, 1.0)

        return max(40, min(200, bpm))

class BPMDataSender:
    """Sends simulated BPM data via UDP"""

    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def send_data(self, user_id: int, bpm: float, additional_data: dict = None):
        """Send BPM data to the broker"""
        data = {
            "user": user_id,
            "bpm": round(bpm, 2),
            "timestamp": time.time(),
            "device_id": f"ESP32_SIM_{user_id:02d}",
            "signal_strength": random.randint(-70, -30),
        }

        if additional_data:
            data.update(additional_data)

        try:
            message = json.dumps(data).encode('utf-8')
            self.socket.sendto(message, (self.host, self.port))
            return True
        except Exception as e:
            print(f"Error sending data: {e}")
            return False

    def close(self):
        self.socket.close()

def simulate_user(user_id: int, host: str, port: int, rate: float, duration: float):
    """Simulate a single user sending heart rate data"""
    simulator = HeartRateSimulator(user_id, base_bpm=75.0)
    sender = BPMDataSender(host, port)

    print(f"Starting simulation for User {user_id} (base BPM: {simulator.base_bpm:.1f})")

    interval = 1.0 / rate
    start_time = time.time()
    message_count = 0

    try:
        while time.time() - start_time < duration:
            # Get and increment shared beat count
            global global_beat_count
            with global_beat_lock:
                beat_count = global_beat_count
                global_beat_count += 1

            bpm = simulator.get_bpm(beat_count)

            success = sender.send_data(user_id, bpm)
            if success:
                message_count += 1
                print(f"User {user_id}: {bpm:.1f} BPM (#{message_count})")

            time.sleep(interval)

    except KeyboardInterrupt:
        print(f"User {user_id} simulation interrupted")
    finally:
        sender.close()
        print(f"User {user_id} sent {message_count} messages")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Simulate BPM data for testing")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST,
                       help=f"Broker hostname (default: {DEFAULT_BROKER_HOST})")
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT,
                       help=f"Broker UDP port (default: {DEFAULT_BROKER_PORT})")
    parser.add_argument("--users", type=int, default=DEFAULT_USERS,
                       help=f"Number of users to simulate (default: {DEFAULT_USERS})")
    parser.add_argument("--rate", type=float, default=DEFAULT_RATE,
                       help=f"Messages per second per user (default: {DEFAULT_RATE})")
    parser.add_argument("--duration", type=float, default=float('inf'),
                       help="Duration in seconds (default: infinite)")

    args = parser.parse_args()

    print(f"BPM Data Simulator")
    print(f"Target: {args.host}:{args.port}")
    print(f"Users: {args.users}")
    print(f"Rate: {args.rate} messages/sec per user")
    print(f"Duration: {'infinite' if args.duration == float('inf') else f'{args.duration}s'}")
    print("-" * 50)

    # Start simulation threads for each user
    threads = []

    for user_id in range(1, args.users + 1):
        thread = threading.Thread(
            target=simulate_user,
            args=(user_id, args.host, args.port, args.rate, args.duration),
            daemon=True
        )
        threads.append(thread)
        thread.start()
        time.sleep(0.5)

    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("\nSimulation stopped by user")

    print("Simulation complete")

if __name__ == "__main__":
    main()
