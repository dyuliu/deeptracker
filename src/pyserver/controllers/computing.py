import time
import numpy as np
from numpy import linalg as LA
from flask import request
from flask_restful import Resource
from scipy.spatial.distance import cosine
from pyserver.utils.cluster import DBSCAN, OPTICS, KMEANS

class Cluster(Resource):
    def post(self):
        body = request.json
        vectors = np.asarray(body['vectors'], dtype=np.float)
        eps = body['eps'] if 'eps' in body else 0.0001
        minn = 100
        maxx = -100
        for i, ei in enumerate(vectors):
            if LA.norm(ei) == 0:
                continue
            for j, ej in enumerate(vectors):
                if LA.norm(ej) == 0:
                    continue
                if (not i == j):
                    minn = min(minn, cosine(ei, ej))
                    maxx = max(maxx, cosine(ei, ej))
        # print ('cosine_distance: min & max', minn, maxx)
        # n_cluseter, labels = DBSCAN(vectors, eps=0.05, min_samples=30, metric='euclidean')
        # n_cluseter, labels = OPTICS(vectors, cluster_size=100, threshold=0.005)
        n_cluseter, labels = KMEANS(vectors, n_clusters=4)
        return {
            'clusterNum': n_cluseter,
            'labels': labels
        }
