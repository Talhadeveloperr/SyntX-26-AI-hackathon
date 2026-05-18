#app\__init__.py
from flask import Flask
from flask_cors import CORS  # Import this
from flask_caching import Cache

cache = Cache()

def create_app():
    app = Flask(__name__)
    
    # This enables CORS for all routes and allows your specific frontend origin
    CORS(app, resources={r"/api/*": {"origins": "*"}})


    return app