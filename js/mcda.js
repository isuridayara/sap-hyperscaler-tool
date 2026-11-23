// mcda.js - turning scores and weights into a ranking (Chat 5 version).
// 1. AHP: weights from pairwise comparisons (Saaty 1-9 scale), principal eigenvector,
//    consistency ratio CR (must be below 0.1). Used in two levels: 4 groups, then the
//    sub-criteria inside each group (decision by Eva, 2026-11-20).
// 2. Ranking: weighted sum (weight x score), with the contribution of each criterion.
// 3. TOPSIS: cross-check ranking. If it disagrees with the weighted sum, that is a finding.
// All scores here are on the 1-9 scale where 9 is best.

var Mcda = {};

// Saaty's random index (RI) for matrices of size n = 0 ... 10. Needed for the consistency ratio.
// For n = 1 and n = 2 it is 0: such a matrix is always consistent.
Mcda.RANDOM_INDEX = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

// ---------- AHP ----------

// Read a judgment written as text, for example "3", "1/2" or "0.2". Returns null if it is not
// a valid value on the Saaty scale (between 1/9 and 9).
Mcda.parseJudgment = function (text) {
  var s = String(text === null || text === undefined ? "" : text).trim();
  var value;
  if (s.indexOf("/") >= 0) {
    var parts = s.split("/");
    value = parseFloat(parts[0]) / parseFloat(parts[1]);
  } else {
    value = parseFloat(s);
  }
  if (isNaN(value) || value < 1 / 9 - 1e-9 || value > 9 + 1e-9) return null;
  return value;
};

// Build the full pairwise matrix from the judgments above the diagonal.
// ids: list of criterion or group ids in a fixed order, e.g. ["C1", "C2", "C3", "C4"].
// judgments: list of { row: "C1", col: "C2", value: 3 } meaning "row is 3 times as important as col".
// The diagonal is 1 and the cell below the diagonal is the reciprocal (1 / value).
// A missing judgment makes the whole matrix null, because AHP cannot run with a gap.
Mcda.buildMatrix = function (ids, judgments) {
  var n = ids.length;
  var m = [];
  for (var i = 0; i < n; i++) {
    m.push([]);
    for (var j = 0; j < n; j++) m[i].push(i === j ? 1 : null);
  }
  judgments.forEach(function (jd) {
    var r = ids.indexOf(jd.row), c = ids.indexOf(jd.col);
    if (r < 0 || c < 0 || r === c || jd.value === null) return;
    m[r][c] = jd.value;
    m[c][r] = 1 / jd.value;
  });
  for (var a = 0; a < n; a++) {
    for (var b = 0; b < n; b++) if (m[a][b] === null) return null;
  }
  return m;
};

// PLACEHOLDER for the "User-defined" preset: build a pairwise matrix from one importance value
// (1-9) per criterion. Cell [i][j] = importance i / importance j. Always consistent (CR = 0).
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

  for (var step = 0; step < 1000; step++) {
    var next = matrix.map(function (row) {
      return row.reduce(function (sum, cell, j) { return sum + cell * w[j]; }, 0);
    });
    var total = next.reduce(function (a, b) { return a + b; }, 0);
    next = next.map(function (x) { return x / total; });           // weights add up to 1
    var change = next.reduce(function (m, x, k) { return Math.max(m, Math.abs(x - w[k])); }, 0);
    w = next;
    if (change < 1e-12) break;
  }

  // lambdaMax = average of (matrix x weights) / weights
  var lambdaMax = 0;
  for (var r = 0; r < n; r++) {
    var rowSum = matrix[r].reduce(function (sum, cell, j) { return sum + cell * w[j]; }, 0);
    lambdaMax += rowSum / w[r] / n;
  }
  // Math.max(0, ...) removes tiny negative values caused by rounding (a perfect matrix has CI = 0).
  var ci = n > 2 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0;
  var ri = Mcda.RANDOM_INDEX[n] || 0;
  var cr = ri > 0 ? ci / ri : 0;
  return { weights: w, lambdaMax: lambdaMax, ci: ci, cr: cr, consistent: cr < 0.1 };
};

// Group of a criterion: the part before the dot, so "C1.2" belongs to group "C1".
Mcda.groupOf = function (criterionId) { return String(criterionId).split(".")[0]; };

// Two-level AHP (the hierarchy Eva chose on 2026-11-20).
// criterionIds: e.g. ["C1.1", "C1.2", "C2.1", ..., "C4.1"]
// judgments: rows of data/pairwise.csv for ONE preset:
//   { matrix: "groups" or a group id like "C1", row: ..., col: ..., value: number }
// Result:
//   groups: { ids, matrix, ahp }            the 4x4 group comparison
//   local:  { C1: { ids, matrix, ahp }, ...} the comparison inside each group
//   weights: { "C1.1": 0.477, ... }          final weight = group weight x local weight
//   consistent: true only if every matrix has CR < 0.1
//   error: text if a judgment is missing (then weights is null)
Mcda.ahpHierarchy = function (criterionIds, judgments) {
  var groupIds = [];
  criterionIds.forEach(function (c) {
    var g = Mcda.groupOf(c);
    if (groupIds.indexOf(g) < 0) groupIds.push(g);
  });

  function judgmentsFor(matrixName) {
    return judgments.filter(function (j) { return j.matrix === matrixName; });
  }

  var groupMatrix = Mcda.buildMatrix(groupIds, judgmentsFor("groups"));
  if (groupMatrix === null) return { weights: null, consistent: false, error: "a judgment between the groups is missing" };
  var groupAhp = Mcda.ahpWeights(groupMatrix);

  var local = {};
  var weights = {};
  var consistent = groupAhp.consistent;
  for (var g = 0; g < groupIds.length; g++) {
    var gid = groupIds[g];
    var members = criterionIds.filter(function (c) { return Mcda.groupOf(c) === gid; });
    var m = Mcda.buildMatrix(members, judgmentsFor(gid));
    if (m === null) return { weights: null, consistent: false, error: "a judgment inside group " + gid + " is missing" };
    var a = Mcda.ahpWeights(m);
    local[gid] = { ids: members, matrix: m, ahp: a };
    if (!a.consistent) consistent = false;
    members.forEach(function (c, k) { weights[c] = groupAhp.weights[g] * a.weights[k]; });
  }

  return { groups: { ids: groupIds, matrix: groupMatrix, ahp: groupAhp },
           local: local, weights: weights, consistent: consistent, error: null };
};

// ---------- scores ----------

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

// ---------- ranking 1: weighted sum (AHP synthesis) ----------

// Weighted sum: total = sum of (weight x score). Also keeps each criterion's share ("contribution").
// scores: { provider: { "C1.1": 7, ... } }, weights: { "C1.1": 0.4, ... }
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

// Contribution of each criterion to the gap between the first provider and every other one.
// gap for criterion c = contribution of the leader - contribution of the other provider.
// Positive = this criterion helps the leader, negative = it helps the other provider.
// The gaps of all criteria add up exactly to the difference of the totals.
Mcda.gapContributions = function (ranking) {
  var leader = ranking[0];
  return ranking.slice(1).map(function (r) {
    var gaps = {};
    Object.keys(leader.contributions).forEach(function (c) {
      var a = leader.contributions[c], b = r.contributions[c];
      gaps[c] = (a === null || b === null) ? null : a - b;
    });
    var totalGap = (leader.total === null || r.total === null) ? null : leader.total - r.total;
    return { leader: leader.provider, other: r.provider, totalGap: totalGap, gaps: gaps };
  });
};

// ---------- ranking 2: TOPSIS (cross-check) ----------

// TOPSIS: distance of each provider to an ideal and to an anti-ideal (worst) provider.
// closeness = 1 means the provider is the ideal on every criterion, 0 means it is the worst.
// directions (optional): { "C1.1": "lower_is_better", ... }. Default: higher is better
// (true for all our 1-9 scores, where the cost is already turned into "9 = cheapest").
// A provider with an NA score is left out of the calculation and gets closeness null.
Mcda.topsis = function (scores, weights, directions) {
  directions = directions || {};
  var providers = Object.keys(scores);
  var criteria = Object.keys(weights);
  var complete = providers.filter(function (p) {
    return criteria.every(function (c) { return scores[p][c] !== null && scores[p][c] !== undefined; });
  });

  // 1. Normalise each criterion column (divide by its length) and 2. multiply by the weight.
  var v = {};
  complete.forEach(function (p) { v[p] = {}; });
  criteria.forEach(function (c) {
    var length = Math.sqrt(complete.reduce(function (s, p) { return s + scores[p][c] * scores[p][c]; }, 0));
    complete.forEach(function (p) { v[p][c] = length > 0 ? weights[c] * scores[p][c] / length : 0; });
  });

  // 3. Ideal = best value per criterion, anti-ideal = worst value.
  var ideal = {}, anti = {};
  criteria.forEach(function (c) {
    var col = complete.map(function (p) { return v[p][c]; });
    var hi = Math.max.apply(null, col), lo = Math.min.apply(null, col);
    var lowerBetter = directions[c] === "lower_is_better";
    ideal[c] = lowerBetter ? lo : hi;
    anti[c] = lowerBetter ? hi : lo;
  });

  // 4. Distances and 5. closeness = distance to anti-ideal / (distance to ideal + distance to anti-ideal).
  var list = providers.map(function (p) {
    if (complete.indexOf(p) < 0) return { provider: p, closeness: null, dIdeal: null, dAnti: null };
    var dIdeal = 0, dAnti = 0;
    criteria.forEach(function (c) {
      dIdeal += Math.pow(v[p][c] - ideal[c], 2);
      dAnti += Math.pow(v[p][c] - anti[c], 2);
    });
    dIdeal = Math.sqrt(dIdeal); dAnti = Math.sqrt(dAnti);
    var closeness = (dIdeal + dAnti) > 0 ? dAnti / (dIdeal + dAnti) : 0;
    return { provider: p, closeness: closeness, dIdeal: dIdeal, dAnti: dAnti };
  });
  return Mcda.sortBest(list, "closeness");
};

// ---------- comparing the two rankings ----------

// Do the weighted sum and TOPSIS give the same order? Returns the two orders and the
// positions where they differ. A difference is reported on the page as a finding.
Mcda.compareRankings = function (ranking, topsis) {
  var a = ranking.map(function (r) { return r.provider; });
  var b = topsis.map(function (t) { return t.provider; });
  var differences = [];
  a.forEach(function (p, i) { if (b[i] !== p) differences.push(i + 1); });
  return { ahpOrder: a, topsisOrder: b, sameWinner: a[0] === b[0], sameOrder: differences.length === 0,
           differentPlaces: differences };
};

// Sort a list from highest to lowest value of `key`; NA (null) values go last.
Mcda.sortBest = function (list, key) {
  return list.sort(function (a, b) {
    if (a[key] === null) return 1;
    if (b[key] === null) return -1;
    return b[key] - a[key];
  });
};
