#!/usr/bin/env python3
"""
Rig Lab — local server

The app itself is plain HTML/CSS/JS and needs no backend logic, but
serving it over http:// (instead of opening index.html as a file://
URL) avoids browser quirks with some setups. This script just serves
the current folder.

Usage:
    python3 server.py            # serves on http://localhost:8000
    python3 server.py 5050       # serves on a different port
"""
import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DIRECTORY = Path(__file__).parent.resolve()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def log_message(self, fmt, *args):
        # Slightly quieter default logging.
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Serving Rig Lab from {DIRECTORY}")
        print(f"Open {url} in your browser (Ctrl+C to stop)")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")


if __name__ == "__main__":
    main()