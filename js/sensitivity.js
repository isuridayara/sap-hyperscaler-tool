// sensitivity.js - how much can one weight change before another provider comes out on top?
// We change the weight of one criterion from 0% to 100% and recalculate the weighted result
// each time (a "sweep"). A switch-point is a weight where the winner changes.
// Uses Mcda.weightedSum from mcda.js.

var Sens = {};

// Give one criterion a new weight and scale the other weights so that all still add up to 1.
// The other criteria keep their proportions to each other.
Sens.reweight = function (weights, criterion, newWeight) {
  var others = Object.keys(weights).filter(function (c) { return c !== criterion; });
  var othersSum = others.reduce(function (s, c) { return s + weights[c]; }, 0);
  var out = {};
  out[criterion] = newWeight;
  others.forEach(function (c) {
    out[c] = othersSum > 0 ? (1 - newWeight) * weights[c] / othersSum
                           : (1 - newWeight) / others.length;   // all others were 0: share equally
  });
  return out;
};

// Winner (provider name) for given scores and weights, or null if no total can be calculated.
Sens.winner = function (scores, weights) {
  var ranking = Mcda.weightedSum(scores, weights);
  return ranking[0].total === null ? null : ranking[0].provider;
};

// Sweep: weight of `criterion` = 0, 1/steps, 2/steps ... 1. For each point keep all totals and the winner.
Sens.sweep = function (scores, weights, criterion, steps) {
  steps = steps || 20;
  var points = [];
  for (var i = 0; i <= steps; i++) {
    var w = i / steps;
    var ranking = Mcda.weightedSum(scores, Sens.reweight(weights, criterion, w));
    var totals = {};
    ranking.forEach(function (r) { totals[r.provider] = r.total; });
    points.push({ weight: w, totals: totals, winner: ranking[0].total === null ? null : ranking[0].provider });
  }
  return points;
};

// Switch-points: between two sweep points with different winners, narrow down the exact
// weight by halving the interval 30 times ("bisection").
Sens.switchPoints = function (scores, weights, criterion, points) {
  var found = [];
  for (var i = 1; i < points.length; i++) {
    var a = points[i - 1], b = points[i];
    if (a.winner === b.winner) continue;
    var lo = a.weight, hi = b.weight;
    for (var k = 0; k < 30; k++) {
      var mid = (lo + hi) / 2;
      if (Sens.winner(scores, Sens.reweight(weights, criterion, mid)) === a.winner) lo = mid; else hi = mid;
    }
    found.push({ weight: (lo + hi) / 2, from: a.winner, to: b.winner });
  }
  return found;
};
