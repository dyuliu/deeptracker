from pyserver import app
from flask_restful import Api
from pyserver.controllers import computing, conf

api = Api(app)

#------------------------------- global  ----------------------------------#
api.add_resource(conf.Test, '/api/v1/conf/test/')

#------------------------ computing resource  -----------------------------#
api.add_resource(computing.Cluster, '/api/v1/computing/cluster')
