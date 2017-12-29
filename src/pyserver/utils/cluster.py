import numpy as np
from sklearn.cluster import DBSCAN as DBScan, KMeans
from sklearn.datasets.samples_generator import make_blobs
from sklearn.preprocessing import StandardScaler

if __package__ is None:
    import sys
    from os import path
    sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
    print (path.dirname(path.dirname(path.abspath(__file__))))
    from .algs.optics import Optics, Point as OpticsPoint
else:
    from pyserver.utils.algs.optics import Optics, Point as OpticsPoint

def DBSCAN(X, metric='euclidean', eps=0.3, min_samples=10):
    """Perform DBSCAN clustering from features.

    Parameters
    ----------
    X : A feature array
    metric : string
    """

    X = StandardScaler().fit_transform(X)
    if metric == 'euclidean':
        rs = DBScan(eps=eps, min_samples=min_samples, metric=metric).fit(X)
    elif metric == 'cosine':
        rs = DBScan(eps=eps, min_samples=min_samples,
                    metric=metric, algorithm='brute').fit(X)
    labels = rs.labels_
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    return n_clusters, labels.tolist()

def KMEANS(X, n_clusters=2):
    """Perform DBSCAN clustering from features.

    Parameters
    ----------
    X : A feature array
    metric : string
    """

    X = StandardScaler().fit_transform(X)
    rs = KMeans(n_clusters=n_clusters, random_state=0).fit(X)
    labels = rs.labels_
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    return n_clusters, labels.tolist()

def OPTICS(X, cluster_size=2, threshold=0.1):
    """Perform DBSCAN-OPTICS clustering from features.
        default cosine distance

    Parameters
    ----------
    X : A feature array
    cluster_size: number of points to form a cluster
    threshold: distance threshold for clustering
    """

    X = StandardScaler().fit_transform(X)
    points = [OpticsPoint(p, i) for i, p in enumerate(X)]

    optics = Optics(points, 2, cluster_size)
    optics.run()
    clusters = optics.cluster(threshold)

    labels = [-1] * X.shape[0]
    label = 0
    for cluster in clusters:
        for p in cluster.points:
            labels[p.idx] = label
        label += 1
    n_clusters = len(clusters)
    return n_clusters, labels

if __name__ == "__main__":
    # #############################################################################
    # Generate sample data
    centers = [[1, 1], [-1, -1], [1, -1]]
    X, labels_true = make_blobs(n_samples=100, centers=centers, cluster_std=0.4,
                                random_state=0)
    X = StandardScaler().fit_transform(X)

    # #############################################################################
    # Compute DBSCAN
    n_clusters, labels = DBSCAN(X)
    print (n_clusters)
    print (labels)

    # #############################################################################
    # Compute OPTICS
    n_clusters, labels = OPTICS(X)
    print (n_clusters)
    print (labels)

