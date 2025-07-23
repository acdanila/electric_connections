#!/usr/bin/env python3
"""
Manual BPM Data Sender

Sends constant BPM values per user to test the UDP broker.

Usage:
    python manual_bpm_sender.py --bpm 70 75 --rate 2 --duration 60
"""

import socket
import json
import time
import random
import threading
import argparse

DEFAULT_BROKER_HOST = "localhost"
DEFAULT_BROKER_PORT = 8888
DEFAULT_RATE = 2.0
DEFAULT_DURATION = 1000000000000000000.0

class BPMDataSender:
    """Sends BPM data via UDP"""

    def __init__(self, host: str, port: int):
        self.host = host
        self.port = port
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def send_data(self, user_id: int, bpm: float):
        """Send fixed BPM data"""
        data = {
            "user": user_id,
            "bpm": round(bpm, 2),
            "timestamp": time.time(),
            "device_id": f"ESP32_MANUAL_{user_id:02d}",
            "signal_strength": random.randint(-70, -30),
        }

        try:
            message = json.dumps(data).encode('utf-8')
            self.socket.sendto(message, (self.host, self.port))
            return True
        except Exception as e:
            print(f"Error sending data: {e}")
            return False

    def close(self):
        self.socket.close()

def simulate_user(user_id: int, bpm: float, host: str, port: int, rate: float, duration: float):
    """Send constant BPM messages for one user"""
    sender = BPMDataSender(host, port)
    interval = 1.0 / rate
    message_count = 0
    start_time = time.time()

    print(f"User {user_id} → BPM: {bpm} | Sending every {interval:.2f}s for {duration:.1f}s")

    try:
        while time.time() - start_time < duration:
            if sender.send_data(user_id, bpm):
                message_count += 1
                print(f"User {user_id}: {bpm:.1f} BPM (#{message_count})")
            time.sleep(interval)
    except KeyboardInterrupt:
        print(f"User {user_id} interrupted")
    finally:
        sender.close()
        print(f"User {user_id} sent {message_count} messages")

def main():
    parser = argparse.ArgumentParser(description="Send fixed BPM values per user")
    parser.add_argument("--host", default=DEFAULT_BROKER_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_BROKER_PORT)
    parser.add_argument("--bpm", type=float, nargs='+', required=True,
                        help="Space-separated BPM values for each user (e.g. 70 75)")
    parser.add_argument("--rate", type=float, default=DEFAULT_RATE)
    parser.add_argument("--duration", type=float, default=DEFAULT_DURATION)

    args = parser.parse_args()

    print(f"Manual BPM Sender")
    print(f"Target: {args.host}:{args.port}")
    print(f"Users: {len(args.bpm)} | Rate: {args.rate}/s | Duration: {args.duration}s")
    print("-" * 50)

    threads = []
    for user_id, bpm in enumerate(args.bpm, start=1):
        t = threading.Thread(
            target=simulate_user,
            args=(user_id, bpm, args.host, args.port, args.rate, args.duration),
            daemon=True
        )
        threads.append(t)
        t.start()
        time.sleep(0.25)

    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\nStopped by user")

if __name__ == "__main__":
    main()
