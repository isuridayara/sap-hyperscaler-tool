// mcda.js - turning scores and weights into a ranking.
// Simple first versions (placeholders) of AHP and TOPSIS. They are good enough for the
// prototype shell; the full pairwise-comparison input comes in a later chat.
// All scores here are on the 1-9 scale where 9 is best.

var Mcda = {};

// Saaty's random index (RI) for matrices of size n = 1 ... 10. Needed for the consistency ratio.
Mcda.RANDOM_INDEX = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

// PLACEHOLDER: build an AHP pairwise matrix from one importance value (1-9) per criterion.
// Cell [i][j] says how much more important criterion i is than criterion j.
// A matrix built this way is always perfectly consistent (CR = 0).
Mcda.pairwiseFromImportance = function (importance) {
  return importance.map(function (a) {
    return importance.map(function (b) { return a / b; });
  });
};

// AHP weights = principal eigenvector of the pairwise matrix, found by "power iteration":
// multiply the matrix by the vector again and again until the vector stops changing.
// Also returns lambdaMax, the consistency index CI and the consistency ratio CR (must be < 0.1).
Mcda.ahpWeights = function (matrix) {
  var n = matrix.length;
  var w = [];
  for (var i = 0; i < n; i++) w.push(1 / n);

  for (var step = 0; step < 100; step++) {
    var next = matrix.map(function (row) {
      return row.reduce(function (sum, cell, j) { return sum + cell * w[j]; }, 0);
    });
    var total = next.reduce(function (a, b) { return a + b; }, 0);
    next = next.map(function (x) { return x / total; });           // weights add up to 1
    var change = next.reduce(function (m, x, k) { return Math.max(m, Math.abs(x - w[k])); }, 0);
    w = next;
    if (change < 1e-10) break;
  }

  // lambdaMax = average of (matrix x weights) / weights
  var lambdaMax = 0;
  for (var r = 0; r < n; r++) {
    var rowSum = matrix[r].reduce(function (sum, cell, j) { return sum + cell * w[j]; }, 0);
    lambdaMax += rowSum / w[r] / n;
  }
  var ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  var ri = Mcda.RANDOM_INDEX[n] || 0;
  var cr = ri > 0 ? ci / ri : 0;
  return { weights: w, lambdaMax: lambdaMax, ci: ci, cr: cr, consistent: cr < 0.1 };
};

// Turn costs into 1-9 scores: cheapest = 9, most expensive = 1, the rest in between.
// costs: { provider: total EUR or null }. A null cost gives a null score (NA).
Mcda.costScores = function (costs) {
  var values = Object.keys(costs).map(function (p) { return costs[p]; })
                                 .filter(function (x) { return x !== null; });
  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  var out = {};
  Object.keys(costs).forEach(function (p) {
    var x = costs[p];
    if (x === null) out[p] = null;
    else if (max === min) out[p] = 9;                     // all equal: everybody gets the best score
    else out[p] = 1 + 8 * (max - x) / (max - min);
  });
  return out;
};

// Weighted sum: total = sum of (weight x score). Also keeps each criterion's share ("contribution").
// scores: { provider: { C1: 7, C2: 8, ... } }, weights: { C1: 0.4, ... }
// Returns a list sorted from best to worst. A provider with an NA score gets total null.
Mcda.weightedSum = function (scores, weights) {
  var list = Object.keys(scores).map(function (p) {
    var contributions = {};
    var total = 0;
    Object.keys(weights).forEach(function (c) {
      var s = scores[p][c];
      contributions[c] = (s === null || s === undefined) ? null : weights[c] * s;
      total = (total === null || contributions[c] === null) ? null : total + contributions[c];
    });
    return { provider: p, total: total, contributions: contributions };
  });
  return Mcda.sortBest(list, "total");
};

// PLACEHOLDER TOPSIS (cross-check): distance to an ideal and to a worst provider.
// closeness = 1 means the provider is the ideal on every criterion, 0 means it is the worst.
Mcda.topsis = function (scores, weights) {
  var providers = Object.keys(scores);
  var criteria = Object.keys(weights);
  var complete = providers.filter(function (p) {
    return criteria.every(function (c) { return scores[p][c] !== null && scores[p][c] !== undefined; });
  });

  // 1. Normalise each criterion column (divide by its length) and multiply by the weight.
  var v = {};
  complete.forEach(function (p) { v[p] = {}; });
  criteria.forEach(function (c) {
    var length = Math.sqrt(complete.reduce(function (s, p) { return s + scores[p][c] * scores[p][c]; }, 0));
    complete.forEach(function (p) { v[p][c] = length > 0 ? weights[c] * scores[p][c] / length : 0; });
  });

  // 2. Ideal = best value per criterion, worst = lowest value (all scores: higher is better).
  var best = {}, worst = {};
  criteria.forEach(function (c) {
    var col = complete.map(function (p) { return v[p][c]; });
    best[c] = Math.max.apply(null, col);
    worst[c] = Math.min.apply(null, col);
  });

  // 3. Closeness = distance to worst / (distance to best + distance to worst).
  var list = providers.map(function (p) {
    if (complete.indexOf(p) < 0) return { provider: p, closeness: null };
    var dBest = 0, dWorst = 0;
    criteria.forEach(function (c) {
      dBest += Math.pow(v[p][c] - best[c], 2);
      dWorst += Math.pow(v[p][c] - worst[c], 2);
    });
    dBest = Math.sqrt(dBest); dWorst = Math.sqrt(dWorst);
    var closeness = (dBest + dWorst) > 0 ? dWorst / (dBest + dWorst) : 0;
    return { provider: p, closeness: closeness };
  });
  return Mcda.sortBest(list, "closeness");
};

// Sort a list from highest to lowest value of `key`; NA (null) values go last.
Mcda.sortBest = function (list, key) {
  return list.sort(function (a, b) {
    if (a[key] === null) return 1;
    if (b[key] === null) return -1;
    return b[key] - a[key];
  });
};
