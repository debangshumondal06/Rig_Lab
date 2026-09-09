"""
Minimal server for the Joint Doll webapp.

All the actual logic (parsing movement code, animating the doll) runs
in the browser via script.js. This file just serves the static files
(index.html, style.css, script.js) over HTTP so you can open the app
at http://localhost:5000

Run with:
    pip install flask
    python app.py
"""

from flask import Flask, send_from_directory
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000)