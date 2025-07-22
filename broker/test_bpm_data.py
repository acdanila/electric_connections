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
from typing import List

# Default configuration
DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 8888
DEFAULT_USERS = 2
DEFAULT_RATE = 2.0  # messages per second

class HeartRateSimulator:
    """Simulates realistic heart rate patterns for testing"""

    def __init__(self, user_id: int, base_bpm: float = 75.0):
        self.user_id = user_id
        self.base_bpm = base_bpm
        self.time_offset = random.uniform(0, 2 * math.pi)  # Random phase offset
        self.noise_level = 3.0  # Standard deviation of noise
        self.trend_amplitude = 10.0  # How much the base rate can vary
        self.trend_period = 30.0  # Seconds for a complete trend cycle
        self.start_time = time.time()

        # Occasional outliers
        self.outlier_probability = 0.05  # 5% chance of outlier
        self.outlier_magnitude = 25.0

    def get_bpm(self) -> float:
        """Generate a realistic heart rate value"""
        elapsed = time.time() - self.start_time

        # Base trend (slow variation)
        trend = self.trend_amplitude * math.sin(2 * math.pi * elapsed / self.trend_period + self.time_offset)

        # Breathing pattern (faster variation)
        breathing = 2.0 * math.sin(2 * math.pi * elapsed / 4.0 + self.time_offset)

        # Random noise
        noise = random.gauss(0, self.noise_level)

        # Occasional outliers
        if random.random() < self.outlier_probability:
            outlier = random.choice([-1, 1]) * random.uniform(15, self.outlier_magnitude)
            noise += outlier

        bpm = self.base_bpm + trend + breathing + noise

        # Ensure reasonable bounds
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
            "signal_strength": random.randint(-70, -30),  # Simulated WiFi signal strength
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
        """Close the socket"""
        self.socket.close()

def simulate_user(user_id: int, host: str, port: int, rate: float, duration: float):
    """Simulate a single user sending heart rate data"""
    simulator = HeartRateSimulator(user_id, base_bpm=70 + user_id * 5)  # Different base rates
    sender = BPMDataSender(host, port)

    print(f"Starting simulation for User {user_id} (base BPM: {simulator.base_bpm:.1f})")

    interval = 1.0 / rate
    start_time = time.time()
    message_count = 0

    try:
        while time.time() - start_time < duration:
            bpm = simulator.get_bpm()

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

        # Stagger the start times slightly
        time.sleep(0.5)

    try:
        # Wait for all threads
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("\nSimulation stopped by user")

    print("Simulation complete")

if __name__ == "__main__":
    main()
