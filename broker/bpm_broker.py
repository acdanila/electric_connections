#!/usr/bin/env python3
"""
BPM Broker - Heart Rate Monitoring WebSocket Server

Receives UDP messages from ESP32 devices containing heart rate data
and broadcasts them to connected WebSocket clients (e.g., TouchDesigner).

Features:
- Signal smoothing with configurable filters
- Real-time data streaming

Author: Electric Connections Project
License: MIT
"""

import asyncio
import websockets
import json
import socket
import logging
import time
import threading
from datetime import datetime
from typing import Set, Dict, Any, Optional
from collections import deque
import numpy as np


from scipy import signal

# Configuration
UDP_HOST = "0.0.0.0"
UDP_PORT = 8888
WEBSOCKET_HOST = "0.0.0.0"
WEBSOCKET_PORT = 6789

# Signal processing configuration
SMOOTHING_ENABLED = True
SMOOTHING_ALPHA = 0.3  # Exponential moving average factor (0-1, lower = more smoothing)
HISTORY_LENGTH = 100  # Number of samples to keep in history
MIN_BPM = 40  # Minimum valid BPM
MAX_BPM = 200  # Maximum valid BPM

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global broker instance for WebSocket handler
_broker_instance = None

async def websocket_connection_handler(websocket, path=None):
    """Global WebSocket handler function - path is optional for compatibility"""
    if _broker_instance is None:
        logger.error("Broker instance not initialized")
        await websocket.close()
        return

    return await _broker_instance.handle_websocket_connection(websocket, path or "/")

class SignalSmoother:
    """Signal smoothing and filtering for heart rate data"""

    def __init__(self, alpha: float = SMOOTHING_ALPHA):
        self.alpha = alpha  # EMA factor
        self.last_value: Optional[float] = None
        self.history: deque = deque(maxlen=HISTORY_LENGTH)
        self.startup_readings = 0  # Count of readings since startup/reset
        self.startup_threshold = 10  # Skip smoothing for first 10 readings

    def add_sample(self, value: float) -> float:
        """Add a new sample and return the smoothed value"""
        # Basic range validation
        if value < MIN_BPM or value > MAX_BPM:
            logger.warning(f"BPM value {value} outside valid range ({MIN_BPM}-{MAX_BPM})")
            return self.last_value or value

        # Skip smoothing for the first 10 readings to let sensor stabilize
        if self.startup_readings < self.startup_threshold:
            self.startup_readings += 1
            self.last_value = value
            self.history.append(value)
            logger.info(f"Startup reading {self.startup_readings}/{self.startup_threshold}: {value:.1f} BPM (no smoothing)")
            return value

        # Exponential moving average (normal operation)
        if self.last_value is None:
            smoothed_value = value
        else:
            smoothed_value = self.alpha * value + (1 - self.alpha) * self.last_value

        self.last_value = smoothed_value
        self.history.append(smoothed_value)

        return smoothed_value

    def reset_for_new_session(self):
        """Reset the smoother for a new finger detection session"""
        self.startup_readings = 0
        self.last_value = None
        # Keep some history but clear startup state
        logger.info("Signal smoother reset for new finger detection session")

    def get_history(self) -> list:
        """Get the complete history of smoothed values"""
        return list(self.history)

    def get_statistics(self) -> Dict[str, float]:
        """Get basic statistics of the signal"""
        if not self.history:
            return {}

        history_array = np.array(self.history)
        return {
            "mean": float(np.mean(history_array)),
            "std": float(np.std(history_array)),
            "min": float(np.min(history_array)),
            "max": float(np.max(history_array)),
            "last": float(history_array[-1]) if len(history_array) > 0 else 0.0
        }

class UDPProtocol(asyncio.DatagramProtocol):
    """UDP Protocol handler for ESP32 data"""

    def __init__(self, broker):
        self.broker = broker

    def connection_made(self, transport):
        self.transport = transport
        logger.info(f"UDP server listening on {UDP_HOST}:{UDP_PORT}")

    def datagram_received(self, data, addr):
        """Called when UDP data is received"""
        try:
            data_str = data.decode('utf-8')
            # Process in async context
            asyncio.create_task(self.broker.process_udp_data(data_str, addr))
        except Exception as e:
            logger.error(f"Error receiving UDP data: {e}")

class BPMBroker:
    def __init__(self):
        self.websocket_clients: Set[websockets.WebSocketServerProtocol] = set()
        self.latest_data: Dict[int, Dict[str, Any]] = {}
        self.user_smoothers: Dict[int, Dict[str, Any]] = {}  # Signal smoothers for each user
        self.user_finger_status: Dict[int, Dict[str, Any]] = {}  # Finger detection tracking
        self.udp_transport = None

    def get_or_create_smoother(self, user_id: int) -> SignalSmoother:
        """Get or create a signal smoother for a user"""
        if user_id not in self.user_smoothers:
            self.user_smoothers[user_id] = {
                'smoother': SignalSmoother(),
                'created_at': time.time()
            }
            logger.info(f"Created signal smoother for User {user_id}")

        return self.user_smoothers[user_id]['smoother']

    def get_or_create_finger_tracker(self, user_id: int) -> Dict[str, Any]:
        """Get or create finger detection tracker for a user"""
        if user_id not in self.user_finger_status:
            self.user_finger_status[user_id] = {
                'consecutive_no_finger': 0,
                'last_finger_detected': True,
                'created_at': time.time()
            }
            logger.info(f"Created finger tracker for User {user_id}")

        return self.user_finger_status[user_id]

    async def start_udp_server(self):
        """Start UDP server to receive data from ESP32 devices"""
        loop = asyncio.get_running_loop()

        # Create UDP endpoint
        transport, protocol = await loop.create_datagram_endpoint(
            lambda: UDPProtocol(self),
            local_addr=(UDP_HOST, UDP_PORT)
        )

        self.udp_transport = transport
        return transport

    async def process_udp_data(self, data_str: str, addr: tuple):
        """Process UDP data from ESP32 devices"""
        try:
            # Parse JSON data
            data = json.loads(data_str)

            # Validate required fields
            if 'user' not in data or 'bpm' not in data:
                logger.warning(f"Invalid data format from {addr}: {data_str}")
                return

            user_id = data['user']
            raw_bpm = data['bpm']

            # Get finger detection tracker
            finger_tracker = self.get_or_create_finger_tracker(user_id)

            # Check finger detection status
            finger_detected = data.get('finger_detected', True)  # Default to True if not provided

            if not finger_detected:
                # Finger not detected, increment counter
                finger_tracker['consecutive_no_finger'] += 1
                finger_tracker['last_finger_detected'] = False

                # If we've had more than 2 consecutive no-finger readings, send "--"
                if finger_tracker['consecutive_no_finger'] > 2:
                    data['bpm'] = "--"
                    data['bpm_raw'] = raw_bpm
                    data['bpm_smoothed'] = False
                    data['no_heart_rate'] = True
                    data['finger_detected'] = False
                    logger.info(f"User {user_id} ({addr[0]}): No finger detected for {finger_tracker['consecutive_no_finger']} readings - sending '--'")
                else:
                    # Still within threshold, process normally but mark as no finger
                    if raw_bpm <= 0:
                        data['bpm'] = "--"
                        data['bpm_raw'] = raw_bpm
                        data['bpm_smoothed'] = False
                        data['no_heart_rate'] = True
                        logger.info(f"User {user_id} ({addr[0]}): No finger + no BPM")
                    else:
                        # Process BPM normally even though no finger detected (might be last valid reading)
                        raw_bpm = float(raw_bpm)

                        if SMOOTHING_ENABLED:
                            smoother = self.get_or_create_smoother(user_id)
                            smoothed_bpm = smoother.add_sample(raw_bpm)
                            data['bpm_raw'] = raw_bpm
                            data['bpm'] = smoothed_bpm
                            data['bpm_smoothed'] = True
                            stats = smoother.get_statistics()
                            data['signal_stats'] = stats
                            logger.info(f"User {user_id} ({addr[0]}): No finger but BPM {raw_bpm:.1f} → {smoothed_bpm:.1f} (smoothed)")
                        else:
                            data['bpm'] = raw_bpm
                            data['bpm_smoothed'] = False
                            logger.info(f"User {user_id} ({addr[0]}): No finger but BPM {raw_bpm:.1f}")

                        data['no_heart_rate'] = False

                    logger.info(f"User {user_id} ({addr[0]}): No finger detected ({finger_tracker['consecutive_no_finger']}/2)")
            else:
                # Finger detected, reset counter
                finger_tracker['consecutive_no_finger'] = 0

                # If we were previously in a no-finger state, reset the smoother for new session
                if not finger_tracker['last_finger_detected']:
                    if SMOOTHING_ENABLED and user_id in self.user_smoothers:
                        smoother = self.user_smoothers[user_id]['smoother']
                        smoother.reset_for_new_session()
                        logger.info(f"User {user_id}: Finger detected after absence - reset smoother")

                finger_tracker['last_finger_detected'] = True

                # Check if no heart rate detected (BPM is 0 or negative)
                if raw_bpm <= 0:
                    # No heart rate detected, send "--"
                    data['bpm'] = "--"
                    data['bpm_raw'] = raw_bpm
                    data['bpm_smoothed'] = False
                    data['no_heart_rate'] = True
                    logger.info(f"User {user_id} ({addr[0]}): Finger detected but no heart rate")
                else:
                    raw_bpm = float(raw_bpm)

                    # Apply signal smoothing if enabled
                    if SMOOTHING_ENABLED:
                        smoother = self.get_or_create_smoother(user_id)
                        smoothed_bpm = smoother.add_sample(raw_bpm)

                        # Add smoothing info to data
                        data['bpm_raw'] = raw_bpm
                        data['bpm'] = smoothed_bpm
                        data['bpm_smoothed'] = True

                        # Add signal statistics
                        stats = smoother.get_statistics()
                        data['signal_stats'] = stats

                        logger.info(f"User {user_id} ({addr[0]}): {raw_bpm:.1f} → {smoothed_bpm:.1f} BPM (smoothed)")
                    else:
                        data['bpm'] = raw_bpm
                        data['bpm_smoothed'] = False
                        logger.info(f"User {user_id} ({addr[0]}): {raw_bpm:.1f} BPM")

                    data['no_heart_rate'] = False

            # Add server timestamp and source IP
            data['server_timestamp'] = time.time()
            data['source_ip'] = addr[0]
            data['received_at'] = datetime.now().isoformat()

            # Store latest data for each user
            self.latest_data[user_id] = data

            # Broadcast to all WebSocket clients
            await self.broadcast_to_websockets(data)

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {addr}: {data_str}")
        except Exception as e:
            logger.error(f"Error processing UDP data: {e}")

    async def broadcast_to_websockets(self, data: Dict[str, Any]):
        """Broadcast data to all connected WebSocket clients"""
        if not self.websocket_clients:
            return

        message = json.dumps(data)

        # Send to all connected clients
        disconnected_clients = set()

        for client in self.websocket_clients:
            try:
                await client.send(message)
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                logger.error(f"Error sending to WebSocket client: {e}")
                disconnected_clients.add(client)

        # Remove disconnected clients
        self.websocket_clients -= disconnected_clients

        if disconnected_clients:
            logger.info(f"Removed {len(disconnected_clients)} disconnected clients")

    async def handle_websocket_command(self, websocket, command: Dict[str, Any]):
        """Handle commands from WebSocket clients"""
        cmd_type = command.get('type')

        if cmd_type == 'get_status':
            status = {
                "type": "status_response",
                "active_devices": list(self.latest_data.keys()),
                "connected_clients": len(self.websocket_clients),
                "latest_data": self.latest_data,
                "smoothing_enabled": SMOOTHING_ENABLED,
                "smoothing_config": {
                    "alpha": SMOOTHING_ALPHA,
                    "history_length": HISTORY_LENGTH
                },
                "timestamp": time.time()
            }
            await websocket.send(json.dumps(status))

        elif cmd_type == 'get_latest':
            user_id = command.get('user_id')
            if user_id and user_id in self.latest_data:
                await websocket.send(json.dumps(self.latest_data[user_id]))
            else:
                await websocket.send(json.dumps({"error": "User not found"}))

        elif cmd_type == 'get_signal_history':
            user_id = command.get('user_id')
            if user_id and user_id in self.user_smoothers:
                smoother = self.user_smoothers[user_id]['smoother']
                response = {
                    "type": "signal_history_response",
                    "user_id": user_id,
                    "history": smoother.get_history(),
                    "statistics": smoother.get_statistics(),
                    "timestamp": time.time()
                }
                await websocket.send(json.dumps(response))
            else:
                await websocket.send(json.dumps({"error": "User not found or no signal data"}))

        elif cmd_type == 'get_all_statistics':
            stats = {}
            for user_id, user_data in self.user_smoothers.items():
                stats[user_id] = user_data['smoother'].get_statistics()

            response = {
                "type": "all_statistics_response",
                "user_statistics": stats,
                "timestamp": time.time()
            }
            await websocket.send(json.dumps(response))

        else:
            logger.warning(f"Unknown command type: {cmd_type}")

    async def start_websocket_server(self):
        """Start WebSocket server for clients like TouchDesigner"""
        logger.info(f"WebSocket server starting on {WEBSOCKET_HOST}:{WEBSOCKET_PORT}")

        # Store broker instance globally for the handler
        global _broker_instance
        _broker_instance = self

        return await websockets.serve(
            websocket_connection_handler,
            WEBSOCKET_HOST,
            WEBSOCKET_PORT
        )

    async def handle_websocket_connection(self, websocket, path):
        """WebSocket connection handler - called by websockets library"""
        # Get client IP safely
        try:
            client_ip = websocket.remote_address[0] if websocket.remote_address else "unknown"
        except Exception:
            client_ip = "unknown"

        path = path or "/"
        logger.info(f"WebSocket client connected: {client_ip} (path: {path})")

        try:
            # Add client to set
            self.websocket_clients.add(websocket)
            logger.info(f"Total WebSocket clients: {len(self.websocket_clients)}")

            # Send current data to new client
            if self.latest_data:
                for user_id, data in self.latest_data.items():
                    try:
                        await websocket.send(json.dumps(data))
                    except Exception as e:
                        logger.warning(f"Failed to send historical data: {e}")

            # Send heartbeat/status message
            status_message = {
                "type": "status",
                "message": "Connected to BPM Broker",
                "active_devices": list(self.latest_data.keys()),
                "timestamp": time.time()
            }

            try:
                await websocket.send(json.dumps(status_message))
                logger.info(f"Status message sent to {client_ip}")
            except Exception as e:
                logger.warning(f"Failed to send status message: {e}")

            # Keep connection alive and handle incoming messages
            try:
                async for message in websocket:
                    try:
                        if message.strip():  # Only process non-empty messages
                            command = json.loads(message)
                            await self.handle_websocket_command(websocket, command)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON from {client_ip}: {message}")
                    except Exception as e:
                        logger.warning(f"Error processing message from {client_ip}: {e}")

            except websockets.exceptions.ConnectionClosed:
                logger.info(f"WebSocket client {client_ip} closed connection")
            except Exception as e:
                logger.error(f"Error in message loop for {client_ip}: {e}")

        except Exception as e:
            logger.error(f"WebSocket handler error for {client_ip}: {e}")
        finally:
            self.websocket_clients.discard(websocket)
            logger.info(f"WebSocket client {client_ip} disconnected (Total: {len(self.websocket_clients)})")

    async def run(self):
        """Main broker run loop"""
        logger.info("Starting BPM Broker...")

        # Start both servers concurrently
        websocket_server = await self.start_websocket_server()
        udp_transport = await self.start_udp_server()

        logger.info("BPM Broker is running!")
        logger.info(f"UDP: {UDP_HOST}:{UDP_PORT}")
        logger.info(f"WebSocket: ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
        logger.info("Press Ctrl+C to stop")

        try:
            # Keep servers running
            await websocket_server.wait_closed()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            if self.udp_transport:
                self.udp_transport.close()
            websocket_server.close()
            await websocket_server.wait_closed()

async def main():
    """Main entry point"""
    broker = BPMBroker()
    await broker.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBroker stopped by user")
