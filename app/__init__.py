import json
import logging
import os
import sys
import time
import uuid

from flask import Flask, Response, request

RUNNING_IN_KUBERNETES = 'KUBERNETES_SERVICE_HOST' in os.environ

app = Flask(__name__)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
app.logger.addHandler(handler)

# disable flask's default request logger
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.ERROR)

@app.after_request
def log_after(response):
    # check if the request was made from a kubernetes liveness/readiness probe
    if RUNNING_IN_KUBERNETES:
        if request.headers.get('User-Agent') == 'Go-http-client/1.1':
            return response
    app.logger.warning('%s %s %s %s %s %s',
        time.strftime('[%Y-%b-%d %H:%M]'),
        request.remote_addr,
        request.method,
        request.scheme,
        request.full_path,
        response.status)
    return response

@app.route("/", methods=['GET'])
def hello():
    return Response(str(uuid.uuid4()), status=200, mimetype='text/plain')
