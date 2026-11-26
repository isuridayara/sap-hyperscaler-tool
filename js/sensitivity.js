// sensitivity.js - how robust is the recommendation?
// Part 1 (weights): we change the weight of one criterion from 0% to 100% and recalculate the
//   weighted result each time (a "sweep"). A switch-point is a weight where the winner changes.
// Part 2 (cost drivers, Chat 6): we change one input of the cost model (for example a discount that
//   only one provider gives, or the HANA memory size) and look for the value where the winner changes.
// Uses Mcda.weightedSum from mcda.js. The cost drivers are recalculated by app.js, which passes in a
// small function "evaluate(value)" that returns the ranking for one value of the driver.

var Sens = {};

// Chat 2b: with the real criteria data many scores are equal (for example all providers score 9 on C2.1).
// If one such criterion gets 100% of the weight, two or three providers have exactly the same total.
// That is a tie, not a new winner, so a tie is never reported as a switch-point.
Sens.TIE = "tie";

// Leader of a ranking: the best provider, Sens.TIE if the best two totals are equal, or null if no total.
Sens.leader = function (ranking) {
  if (ranking[0].total === null) return null;
  if (ranking.length > 1 && ranking[1].total !== null && Math.abs(ranking[0].total - ranking[1].total) < 1e-9) return Sens.TIE;
  return ranking[0].provider;
};

// ---------- Part 1: weights ----------

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
  return Sens.leader(Mcda.weightedSum(scores, weights));
};

// Sweep points without the tied ones. A real switch can pass exactly through a tie (then the points
// before and after it still have different winners); a tie at the end of the range (weight 100%) is left out.
Sens.withoutTies = function (points) {
  return points.filter(function (pt) { return pt.winner !== Sens.TIE; });
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
    points.push({ weight: w, totals: totals, winner: Sens.leader(ranking) });
  }
  return points;
};

// Switch-points: between two sweep points with different winners, narrow down the exact
// weight by halving the interval 30 times ("bisection").
Sens.switchPoints = function (scores, weights, criterion, points) {
  var found = [];
  points = Sens.withoutTies(points);
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

// Summary for ALL criteria at once (the switch-point table in tab 4).
// For each criterion: current weight, every switch-point, and the nearest one ("margin" = how far the
// weight must move, in percentage points, before the recommendation changes; null = never changes).
Sens.allWeightSwitchPoints = function (scores, weights, steps) {
  return Object.keys(weights).map(function (c) {
    var points = Sens.sweep(scores, weights, c, steps || 100);
    var switches = Sens.switchPoints(scores, weights, c, points);
    var nearest = null;
    switches.forEach(function (s) {
      if (nearest === null || Math.abs(s.weight - weights[c]) < Math.abs(nearest.weight - weights[c])) nearest = s;
    });
    return { criterion: c, weight: weights[c], switches: switches, nearest: nearest,
             margin: nearest === null ? null : nearest.weight - weights[c] };
  });
};

// ---------- Part 2: cost drivers ----------

// Sweep over a list of driver values. evaluate(value) must return a ranking (best first),
// like Mcda.weightedSum. For each value we keep the winner and every provider's total.
Sens.driverSweep = function (values, evaluate) {
  return values.map(function (v) {
    var ranking = evaluate(v);
    var totals = {};
    ranking.forEach(function (r) { totals[r.provider] = r.total; });
    return { value: v, totals: totals, winner: Sens.leader(ranking) };
  });
};

// Switch-points of a driver sweep.
// continuous = true: the driver can take any value in between (a discount, growth, traffic), so the exact
//   value is found by bisection, like for the weights.
// continuous = false: the driver jumps in steps (the machine size), so the switch-point is reported as
//   "between value a and value b".
Sens.driverSwitchPoints = function (points, evaluate, continuous) {
  function winnerAt(v) {
    return Sens.leader(evaluate(v));
  }
  var found = [];
  points = Sens.withoutTies(points);
  for (var i = 1; i < points.length; i++) {
    var a = points[i - 1], b = points[i];
    if (a.winner === b.winner) continue;
    if (!continuous) {
      found.push({ value: null, between: [a.value, b.value], from: a.winner, to: b.winner });
      continue;
    }
    var lo = a.value, hi = b.value;
    for (var k = 0; k < 30; k++) {
      var mid = (lo + hi) / 2;
      if (winnerAt(mid) === a.winner) lo = mid; else hi = mid;
    }
    found.push({ value: (lo + hi) / 2, between: [a.value, b.value], from: a.winner, to: b.winner });
  }
  return found;
};

// List of evenly spaced values from `from` to `to` (both included), e.g. range(0, 60, 5) = 0, 5 ... 60.
Sens.range = function (from, to, step) {
  var out = [];
  for (var v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
};
