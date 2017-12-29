import sys
from os.path import dirname
from termcolor import colored
from pyserver import app, configure
from gevent.wsgi import WSGIServer

# just in case u run app using the full path
sys.path.append(dirname(__file__))

# get running environment
configure()

http_server = WSGIServer(('127.0.0.1', 5001), app)
print(colored('Starting up FLASK APP in production mode', 'yellow'))
print(colored('Available on:', 'yellow'))
print('  http://127.0.0.1:' + colored('5001', 'green'))
http_server.serve_forever()
