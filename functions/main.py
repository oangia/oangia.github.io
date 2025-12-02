from firebase_functions import https_fn
from firebase_admin import initialize_app
from flask import Flask, jsonify, request
from oangiapy.agent52 import run

initialize_app()
app = Flask(__name__)

@app.route('/<path:path>', methods=['GET', 'POST', 'OPTIONS'])
def index(path):
    return run(request)

# Wrap Flask in Firebase function
@https_fn.on_request()
def on_request_example(req: https_fn.Request):
    with app.request_context(req.environ):
        return app.full_dispatch_request()
