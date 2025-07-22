#!/usr/bin/env python3
"""
Simple HTTP Server for BPM Dashboard

Serves the web dashboard files with proper CORS headers
for development and testing.

Usage:
    python server.py

Then open: http://localhost:8080
"""

import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler with CORS support"""

    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        # Parse the URL
        parsed_path = urlparse(self.path)

        # Special handling for user_names.json to ensure it's always fresh
        if parsed_path.path == '/user_names.json':
            try:
                with open('user_names.json', 'r') as f:
                    content = f.read()

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                self.wfile.write(content.encode())
                return

            except FileNotFoundError:
                # Return default names if file doesn't exist
                default_names = {"user1": "User 1", "user2": "User 2"}
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(default_names).encode())
                return

        # Default handling for other files
        super().do_GET()

    def log_message(self, format, *args):
        """Custom log message format"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def main():
    """Main server function"""
    PORT = 8081
    DIRECTORY = os.path.dirname(os.path.abspath(__file__))

    print("🌐 Starting BPM Dashboard HTTP Server")
    print("=" * 40)
    print(f"📁 Serving files from: {DIRECTORY}")
    print(f"🔗 Dashboard URL: http://localhost:{PORT}")
    print(f"📝 Edit user names in: {os.path.join(DIRECTORY, 'user_names.json')}")
    print("💡 Make sure broker is running: python broker/bpm_broker.py")
    print("🔄 Press Ctrl+C to stop")
    print()

    # Change to the dashboard directory
    os.chdir(DIRECTORY)

    # Create the server
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        try:
            print(f"✅ Server started on port {PORT}")
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"🚨 Server error: {e}")

if __name__ == "__main__":
    main()
