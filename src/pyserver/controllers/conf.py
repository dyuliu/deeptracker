from flask import request
from flask_restful import reqparse, Resource

# request.json              Content-Type: application/json
# request.remote_addr       ip address
# request.query_string      http://localhost:3001/config?query_string

# only for test
class Test(Resource):
    def get(self):
        print('test get')
        return 'get okay!'
    def post(self):
        print('test post')
        return 'post okay!'
    def delete(self):
        print('test delete')
        return 'delete okay!'
    def put(self):
        print('test put')
        return 'put okay!'
