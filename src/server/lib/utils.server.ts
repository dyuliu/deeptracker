import * as _ from 'lodash';
import * as through from 'through';
import {bson} from '../lib/bson.server';
// let endJson = JSON.stringify(['!end']) + '\n';

/**
 * Array<{key: img_name, cls: class, domain: [number], values: [[number]]}>
 */
export function ImgStreamTransformer (options?) {
  if (!options) { options = {}; }
  let {indent, cls, parser} = options;
  indent = indent || 0;

  let streamTrans;

  let m = new Map(), r = [];
  streamTrans = through(
    function (d) {
      let size = d.label.length;
      for (let i = 0; i < size; i += 1) {
        if (cls && cls.indexOf(d.cls[i]) < 0) { continue; }
        let correct = (d.label[i] === d.answer[i]) ? 1 : 0;
        if (m.has(d.file[i])) {
          r[m.get(d.file[i])].values.push(correct);
          r[m.get(d.file[i])].domain.push(d.iter);
        } else {
          r.push({key: d.file[i], cls: d.cls[i], domain: [d.iter], values: [correct]});
          m.set(d.file[i], r.length - 1);
        }
      }
    },
    function (d) {
      r = _.sortBy(r, ['cls']);
      r = r.slice(0, 10000);
      let count = 0;
      for (let o of r) {
        if (parser === 'json') {
          streamTrans.queue(JSON.stringify(o, null, indent));
        } else if (parser === 'bson') {
          count += bsonify(o, streamTrans);
        }
      }
      streamTrans.queue(null);
      console.timeEnd('data get ready');
    }
  );
  return streamTrans;
};

/**
 * Array<{key: lid, name: layer_name, iter: [number], values: [[number]]}>
 */
export function KernelStreamTransformer (options?) {
  if (!options) { options = {}; }
  let {indent, parser, cls} = options;
  indent = indent || 0;

  let streamTrans, anyData = false;

  let m = new Map(), r = [];
  streamTrans = through(
    function (d) {
      if (m.has(d.lid)) {
        r[m.get(d.lid)].values.push(d.value);
        r[m.get(d.lid)].domain.push(d.iter);
      } else {
        r.push({ key: +d.lid, name: d.name, domain: [d.iter], values: [d.value] });
        m.set(d.lid, r.length - 1);
      }
    },
    function (d) {
      r = _.sortBy(r, ['key']);
      let count = 0;
      for (let o of r) {
        if (parser === 'json') {
          streamTrans.queue(JSON.stringify(o, null, indent));
        } else if (parser === 'bson') {
          count += bsonify(o, streamTrans);
        }
      }
      streamTrans.queue(null);
      console.timeEnd('data get ready');
    }
  );
  return streamTrans;
};

/**
 * Array<{key: img_name, cls: class, domain: [number], values: [[number]]}>
 */
export function LayerStreamTransformer (options?) {
  if (!options) { options = {}; }
  let {type, seqidx, parser, indent} = options;
  indent = indent || 0;

  let streamTrans;
  let m = new Map(), r = [];
  if (options.type === 's_cratio') {
    streamTrans = through(
    function (d) {
      _.each(d.value, (v, lid) => {
        let fv = [];
        for (let i of seqidx) { fv.push(v[i]); }
        if (m.has(lid)) {
          r[m.get(lid)].values.push(fv);
          r[m.get(lid)].domain.push(d.iter);
        } else {
          r.push({key: +lid, domain: [d.iter], values: [fv]});
          m.set(lid, r.length - 1);
        }
      });
    },
    function (d) {
      r = _.sortBy(r, ['key']);
      let count = 0;
      for (let o of r) {
        if (parser === 'json') {
          streamTrans.queue(JSON.stringify(o, null, indent));
        } else if (parser === 'bson') {
          count += bsonify(o, streamTrans);
        }
      }
      streamTrans.queue(null);
      console.timeEnd('data get ready');
    });
  } else {
    streamTrans = through(
      function (d) {
        streamTrans.queue(JSON.stringify(d, null, indent));
      },
      function (d) {
        streamTrans.queue(null);
        console.timeEnd('data get ready');
      }
    );
  }
  return streamTrans;
};

// pack all json to a batch of array of size @batchSize
export function ArrayStreamTransformer (options?) {
  if (!options) { options = {}; }
  let {st, sep, ed, indent, batchSize} = options;
  indent = indent || 0;
  st = st || '[';
  sep = sep || ',';
  ed = ed || ']\n';

  let streamTrans, first = true, anyData = false;
  let batchCount = 0;
  if (!batchSize) { // pack all in one line
    streamTrans = through(
      function (data) {
        anyData = true;

        let json;
        if (typeof data === 'string') {
          json = data;
        } else {
          try {
            json = JSON.stringify(data, null, indent); // encode data
          } catch (err) {
            return streamTrans.emit('error', err);
          }
        }

        if (!first) {
          streamTrans.queue(sep + json);
        } else {
          streamTrans.queue(st + json);
          first = false;
        }
      },
      function (data) {
        if ( !anyData ) { streamTrans.queue(st); }
        streamTrans.queue(ed);
        streamTrans.queue(null);
      }
    );
  } else {
    streamTrans = through(  // pack batchSize data in one line
      function (data) {
        batchCount += 1;
        let json;
        if (typeof data === 'string') {
          json = data;
        } else {
          try {
            json = JSON.stringify(data, null, indent); // encode data
          } catch (err) {
            return streamTrans.emit('error', err);
          }
        }

        let msg = batchCount === 1 ? st + json : sep + json;
        if (batchCount === batchSize) {
          msg += ed;
          batchCount = 0;
        }
        streamTrans.queue(msg);
      },
      function (data) {
        if (batchCount > 0) { streamTrans.queue(ed); }
        streamTrans.queue(null);
      }
    );
  }
  return streamTrans;
}

function bsonify (json: any, streamTrans: any) {
  let b;
  try {
    b = bson.serialize(json);
  } catch (err) {
    return streamTrans.emit('error', err);
  }
  let buf = Buffer.alloc(4);
  buf.writeInt32LE(b.byteLength, 0);
  streamTrans.queue(buf);
  streamTrans.queue(b);
  return b.byteLength;
}


interface ITables {
  info: Map<string, string>;
  img: Map<string, string>;
  kernel: Map<string, string>;
  layer: Map<string, string>;
  record: Map<string, string>;
}

export let tables: ITables = {
  info: new Map<string, string>([
    ['layer', 'LayerInfo'],
    ['db', 'DBInfo'],
    ['cls', 'ClsInfo']
  ]),
  img: new Map<string, string>([
    ['testinfo', 'ImgTestInfo'],
    ['traininfo', 'ImgTrainInfo'],
    ['outlier', 'ImgTestStat'],
    ['model_stat', 'ImgTestStat'],
    ['cls_stat', 'ImgTestClsStat'],
    ['detail', 'ImgTestData'],
    ['event', 'ImgTestStat']
  ]),
  kernel: new Map<string, string>([
    ['w_norm1', 'KernelCRNorm1'],
    ['w_norm2', 'KernelCRNorm2'],
    ['w_std', 'KernelWeightStd'],
    ['g_norm1', 'KernelGradNorm1'],
    ['g_norm2', 'KernelGradNorm2'],
    ['i_euclidean', 'KernelIvEuclidean'],
    ['i_manhattan', 'KernelIvManhattan'],
    ['i_cosine', 'KernelIvCosine'],
    ['i_norm1', 'KernelIvCRNorm1'],
    ['i_nomr2', 'KernelIvCRNorm2']
  ]),
  layer: new Map<string, string>([
    ['w_max', 'WeightStatMax'],
    ['w_mean', 'WeightStatMean'],
    ['w_mid', 'WeightStatMid'],
    ['w_min', 'WeightStatMin'],
    ['w_norm0', 'WeightStatNorm0'],
    ['w_norm1', 'WeightStatNorm1'],
    ['w_norm2', 'WeightStatNorm2'],
    ['w_quarter1', 'WeightStatQuarter1'],
    ['w_quarter3', 'WeightStatQuarter3'],
    ['w_std', 'WeightStatStd'],
    ['w_sum', 'WeightStatSum'],
    ['w_var', 'WeightStatVar'],
    ['g_max', 'GradStatMax'],
    ['g_mean', 'GradStatMean'],
    ['g_mid', 'GradStatMid'],
    ['g_min', 'GradStatMin'],
    ['g_norm0', 'GradStatNorm0'],
    ['g_norm1', 'GradStatNorm1'],
    ['g_norm2', 'GradStatNorm2'],
    ['g_quarter1', 'GradStatQuarter1'],
    ['g_quarter3', 'GradStatQuarter3'],
    ['g_std', 'GradStatStd'],
    ['g_sum', 'GradStatSum'],
    ['g_var', 'GradStatVar'],
    ['s_cratio', 'WeightSeqChangeRatio'],
    ['s_histogram', 'WeightSeqHistogram'],
    ['s_histogram', 'GradSeqHistorgram'],
    ['hl_w_max', 'HLWeightStatMax'],
    ['hl_w_mean', 'HLWeightStatMean'],
    ['hl_w_mid', 'HLWeightStatMid'],
    ['hl_w_min', 'HLWeightStatMin'],
    ['hl_w_norm0', 'HLWeightStatNorm0'],
    ['hl_w_norm1', 'HLWeightStatNorm1'],
    ['hl_w_norm2', 'HLWeightStatNorm2'],
    ['hl_w_quarter1', 'HLWeightStatQuarter1'],
    ['hl_w_quarter3', 'HLWeightStatQuarter3'],
    ['hl_w_std', 'HLWeightStatStd'],
    ['hl_w_sum', 'HLWeightStatSum'],
    ['hl_w_var', 'HLWeightStatVar'],
    ['hl_g_max', 'HLGradStatMax'],
    ['hl_g_mean', 'HLGradStatMean'],
    ['hl_g_mid', 'HLGradStatMid'],
    ['hl_g_min', 'HLGradStatMin'],
    ['hl_g_norm0', 'HLGradStatNorm0'],
    ['hl_g_norm1', 'HLGradStatNorm1'],
    ['hl_g_norm2', 'HLGradStatNorm2'],
    ['hl_g_quarter1', 'HLGradStatQuarter1'],
    ['hl_g_quarter3', 'HLGradStatQuarter3'],
    ['hl_g_std', 'HLGradStatStd'],
    ['hl_g_sum', 'HLGradStatSum'],
    ['hl_g_var', 'HLGradStatVar'],
    ['hl_s_cratio', 'HLWeightSeqChangeRatio'],
    ['hl_s_histogram', 'HLWeightSeqHistogram'],
    ['hl_s_histogram', 'HLGradSeqHistorgram']
  ]),
  record: new Map<string, string>([
    ['lr', 'RecLearningRate'],
    ['test_error', 'RecTestError'],
    ['test_loss', 'RecTestLoss'],
    ['train_error', 'RecTrainError'],
    ['train_loss', 'RecTrainLoss']
  ])
};

export let cacheData = {
};

export let cacheSeqData = {
};

export let cacheHLSeqData = {
};

export let cacheKernel = {};
