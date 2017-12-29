import math
import numpy as np
from scipy.spatial.distance import cosine as cosine_distance

################################################################################
# POINT
################################################################################

class Point:

    def __init__(self, point, idx=-1):

        self.vec = point
        self.idx = idx
        self.cd = None              # core distance
        self.rd = None              # reachability distance
        self.processed = False      # has this point been processed?

    # --------------------------------------------------------------------------
    # calculate the distance between any two points on earth
    # --------------------------------------------------------------------------

    def distance(self, point):
        return cosine_distance(self.vec, point.vec);

    @property
    def dimension(self):
        return len(self.vec)

    def __repr__(self):
        return '%d' % self.idx

################################################################################
# CLUSTER
################################################################################

class Cluster:

    def __init__(self, points):

        self.points = points

    # --------------------------------------------------------------------------
    # calculate the centroid for the cluster
    # --------------------------------------------------------------------------

    def centroid(self):
        c_point = []
        for i in range(self.points[0].dimension):
            c_point.append(sum([p[i] for p in self.points])/len(self.points))
        return Point(c_point)

    # --------------------------------------------------------------------------
    # calculate the region (centroid, bounding radius) for the cluster
    # --------------------------------------------------------------------------

    def region(self):

        centroid = self.centroid()
        radius = reduce(lambda r, p: max(r, p.distance(centroid)), self.points)
        return centroid, radius


################################################################################
# OPTICS
################################################################################

class Optics:

    def __init__(self, points, max_radius, min_cluster_size):

        self.points = points
        self.max_radius = max_radius                # maximum radius to consider
        self.min_cluster_size = min_cluster_size    # minimum points in cluster

    # --------------------------------------------------------------------------
    # get ready for a clustering run
    # --------------------------------------------------------------------------

    def _setup(self):

        for p in self.points:
            p.rd = None
            p.processed = False
        self.unprocessed = [p for p in self.points]
        self.ordered = []
    # --------------------------------------------------------------------------
    # distance from a point to its nth neighbor (n = min_cluser_size)
    # --------------------------------------------------------------------------

    def _core_distance(self, point, neighbors):

        if point.cd is not None: return point.cd
        if len(neighbors) >= self.min_cluster_size - 1:
            sorted_neighbors = sorted([n.distance(point) for n in neighbors])
            point.cd = sorted_neighbors[self.min_cluster_size - 2]
            return point.cd

    # --------------------------------------------------------------------------
    # neighbors for a point within max_radius
    # --------------------------------------------------------------------------

    def _neighbors(self, point):

        return [p for p in self.points if p is not point and
            p.distance(point) <= self.max_radius]

    # --------------------------------------------------------------------------
    # mark a point as processed
    # --------------------------------------------------------------------------

    def _processed(self, point):

        point.processed = True
        self.unprocessed.remove(point)
        self.ordered.append(point)

    # --------------------------------------------------------------------------
    # update seeds if a smaller reachability distance is found
    # --------------------------------------------------------------------------

    def _update(self, neighbors, point, seeds):

        # for each of point's unprocessed neighbors n...

        for n in [n for n in neighbors if not n.processed]:

            # find new reachability distance new_rd
            # if rd is null, keep new_rd and add n to the seed list
            # otherwise if new_rd < old rd, update rd

            new_rd = max(point.cd, point.distance(n))
            if n.rd is None:
                n.rd = new_rd
                seeds.append(n)
            elif new_rd < n.rd:
                n.rd = new_rd

    # --------------------------------------------------------------------------
    # run the OPTICS algorithm
    # --------------------------------------------------------------------------

    def run(self):

        self._setup()

        # for each unprocessed point (p)...

        while self.unprocessed:
            point = self.unprocessed[0]

            # mark p as processed
            # find p's neighbors

            self._processed(point)
            point_neighbors = self._neighbors(point)

            # if p has a core_distance, i.e has min_cluster_size - 1 neighbors

            if self._core_distance(point, point_neighbors) is not None:

                # update reachability_distance for each unprocessed neighbor

                seeds = []
                self._update(point_neighbors, point, seeds)

                # as long as we have unprocessed neighbors...

                while(seeds):

                    # find the neighbor n with smallest reachability distance

                    seeds.sort(key=lambda n: n.rd)
                    n = seeds.pop(0)

                    # mark n as processed
                    # find n's neighbors

                    self._processed(n)
                    n_neighbors = self._neighbors(n)

                    # if p has a core_distance...

                    if self._core_distance(n, n_neighbors) is not None:

                        # update reachability_distance for each of n's neighbors

                        self._update(n_neighbors, n, seeds)

        # when all points have been processed
        # return the ordered list

        return self.ordered

    # --------------------------------------------------------------------------

    def cluster(self, cluster_threshold):

        clusters = []
        separators = []

        for i in range(len(self.ordered)):
            selfi = i
            next_i = i + 1
            selfp = self.ordered[i]
            selfrd = selfp.rd if selfp.rd else float('infinity')

            # use an upper limit to separate the clusters

            if selfrd > cluster_threshold:
                separators.append(selfi)

        separators.append(len(self.ordered))

        for i in range(len(separators) - 1):
            start = separators[i]
            end = separators[i + 1]
            if end - start >= self.min_cluster_size:
                clusters.append(Cluster(self.ordered[start:end]))

        return clusters
