import * as numeric from 'numeric';
import * as _ from 'lodash';
import * as d3 from 'd3';

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

export function mdsLayout(data) {
  let distMatrix = [];
  let length = data.length;
  let max = -1;
  for (let i = 0; i < length; i += 1) {
    distMatrix.push(Array(length).fill(0));
    distMatrix[i][i] = 0;
    for (let j = i - 1; j >= 0; j -= 1) { distMatrix[i][j] = distMatrix[j][i]; }
    for (let j = i + 1; j < length; j += 1) {
      distMatrix[i][j] = computeDist2(data[i].value, data[j].value);
      if (distMatrix[i][j] > max) { max = distMatrix[i][j]; }
    }
  }

  let fs = d3.scaleLinear().range([0, 1]).domain([0, max]).clamp(true);
  for (let i = 0; i < length; i += 1) {
    for (let j = 0; j < length; j += 1) {
      distMatrix[i][j] = fs(distMatrix[i][j]);
    }
  }
  console.log('mds calc ing ~~~~');
  let coordinate = _.map(LG.utils.Mds.mds(distMatrix, 1), (d, i) => {
    return [i, d[0]];
  });
  coordinate = _.sortBy(coordinate, d => d[1]);
  for (let i = 0; i < data.length; i += 1) {
    let idx = coordinate[i][0];
    data[idx].index = i;
  }
}

function computeDist(va, vb) {
  let size = va.length;
  let dist = 0;
  for (let i = 0; i < size; i += 1) {
    dist += va[i] !== vb[i] ? 1 : 0;
  }
  return dist;
}

// cos
function computeDist2(va, vb) {
  let nva = numeric.norm2(va);
  let nvb = numeric.norm2(vb);
  if (nva !== 0 && nvb !== 0) {
    return 1 - numeric.dot(va, vb) / (numeric.norm2(va) * numeric.norm2(vb));
  }
  return 1;
}
