import * as numeric from 'numeric';

export let LG: any = {};
LG.utils = {};
LG.utils.Mds = {};
Object.defineProperties(LG.utils.Mds, {

  mds: {
    value: function (distances, dimensions) {
      dimensions = dimensions || 2;

      // square distances
      let M = numeric.mul(-0.5, numeric.pow(distances, 2));

      // double centre the rows/columns
      function mean(A) {
        return numeric.div(numeric.add.apply(null, A), A.length);
      }
      let rowMeans = mean(M),
        colMeans = mean(numeric.transpose(M)),
        totalMean = mean(rowMeans);

      for (let i = 0; i < M.length; ++i) {
        for (let j = 0; j < M[0].length; ++j) {
          M[i][j] += totalMean - rowMeans[i] - colMeans[j];
        }
      }

      // take the SVD of the double centred matrix, and return the
      // points from it
      let ret = numeric.svd(M),
        eigenValues = numeric.sqrt(ret.S);
      return ret.U.map(function (row) {
        return numeric.mul(row, eigenValues).splice(0, dimensions);
      });
    }
  },

  mds_position_by_weightMatrix: {
    value: function (distance, veryLarge) {
      let newDistance = new Array();
      for (let i = 0; i < distance.length; i++) {
        newDistance[i] = new Array();
      }

      for (let i = 0; i < distance.length; i++) {
        for (let j = 0; j < distance.length; j++) {
          newDistance[i][j] = veryLarge - distance[i][j];
        }
      }
      let newPosition = this.mds(newDistance);
      for (let i = 0; i < newPosition.length; i++) {
        let tElement = newPosition[i];
        if (tElement[0] === 0) {
          tElement[0] += 0.001;
        }
        if (tElement[1] === 0) {
          tElement[1] += 0.001;
        }
      }
      return newPosition;
    }
  }
});
