from flask import Flask
from flask_cors import CORS

# ------------------------------ flask env init  --------------------------------#
app = Flask(__name__, static_url_path='')

def configure():
    app.config.from_object('pyserver.config.ProductionConfig')
    CORS(app)

    # load flask route
    from pyserver import routes
        
