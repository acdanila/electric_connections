#!/usr/bin/env python3
"""
Minimal WebSocket server to test the handler signature issue
"""

import asyncio
import websockets
import json
import time

async def simple_handler(websocket, path):
    """Simple working WebSocket handler"""
    print(f"✅ Client connected to {path}")

    try:
        # Send a test message
        test_data = {
            "type": "status",
            "message": "WebSocket is working!",
            "timestamp": time.time()
        }
        await websocket.send(json.dumps(test_data))

        # Keep connection alive
        async for message in websocket:
            print(f"📨 Received: {message}")

    except websockets.exceptions.ConnectionClosed:
        print("❌ Client disconnected")

async def main():
    print("🚀 Testing simple WebSocket server on port 6789...")

    server = await websockets.serve(simple_handler, "localhost", 6789)
    print("✅ Server started - test with: ws://localhost:6789")

    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
