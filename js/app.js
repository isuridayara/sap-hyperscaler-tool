// app.js - connects the page to the engines.
// It loads the CSV files, reads the form, runs cost.js, mcda.js and sensitivity.js,
// and fills the four tabs. It also switches tabs and shows the DEMO DATA banner.

var App = {};

// Which data files the page loads. To use real data later, change these three names
// (for example "data/prices.csv"). A file name with "_demo" switches on the red banner.
App.FILES = {
  prices: "data/prices.csv",
  normalisation: "data/normalisation_demo.csv",
  criteria: "data/criteria_demo.csv"
};

// One fixed colour per provider, so a provider looks the same in every chart.
App.COLOURS = ["#4C72B0", "#DD8452", "#55A868", "#8172B3"];

App.data = {};     // the loaded CSV rows
App.charts = {};   // the Chart.js charts, so they can be replaced on recalculation
App.last = null;   // results of the last calculation (used by the Sensitivity tab)

// ---------- small helpers ----------

// Format a number for display, or "NA" when it is missing.
App.fmt = function (x, digits) {
  if (x === null || x === undefined || isNaN(x)) return "NA";
  return x.toLocaleString("en-GB", { minimumFractionDigits: digits || 0, maximumFractionDigits: digits || 0 });
};
App.pct = function (x) { return x === null ? "NA" : App.fmt(x * 100, 1) + "%"; };

// Build an HTML table from a header list and a list of rows (each row a list of cells).
// A cell that is a number is right-aligned.
App.table = function (header, rows) {
  var html = "<table><thead><tr>";
  header.forEach(function (h) { html += "<th>" + h + "</th>"; });
  html += "</tr></thead><tbody>";
  rows.forEach(function (r) {
    html += "<tr>";
    r.forEach(function (cell) {
      var isNum = typeof cell === "object" && cell !== null && cell.num;
      html += isNum ? "<td class=\"num\">" + cell.text + "</td>" : "<td>" + App.escape(cell) + "</td>";
    });
    html += "</tr>";
  });
  return html + "</tbody></table>";
};
App.num = function (text) { return { num: true, text: text }; };   // marks a table cell as a number
App.escape = function (s) {
  return String(s === null || s === undefined ? "NA" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Show a message above the form (for example a file that could not be loaded).
App.status = function (text) { document.getElementById("status").textContent = text; };

// Load one CSV file and return its rows as objects (column name -> value).
App.loadCsv = function (url) {
  return fetch(url).then(function (response) {
    if (!response.ok) throw new Error("Could not load " + url + " (HTTP " + response.status + ")");
    return response.text();
  }).then(function (text) {
    return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
  });
};

// Draw (or redraw) a Chart.js chart on the canvas with this id.
App.drawChart = function (canvasId, config) {
  if (typeof Chart === "undefined") return;           // library not loaded: tables still work
  if (App.charts[canvasId]) App.charts[canvasId].destroy();
  App.charts[canvasId] = new Chart(document.getElementById(canvasId), config);
};

// ---------- tabs ----------

App.setupTabs = function () {
  var buttons = document.querySelectorAll(".tab-buttons button");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });
};

// ---------- form ----------

// Unique values of one column, in the order they first appear.
App.unique = function (rows, column) {
  var out = [];
  rows.forEach(function (r) { if (r[column] && out.indexOf(r[column]) < 0) out.push(r[column]); });
  return out;
};

// Fill the Region list, the user-defined weight fields and the Sensitivity criterion list.
App.fillForm = function () {
  var regionSelect = document.getElementById("region");
  regionSelect.innerHTML = "";
  App.unique(App.data.prices, "region").forEach(function (reg) {
    regionSelect.add(new Option(reg, reg));
  });

  var box = document.getElementById("user-weights");
  var sens = document.getElementById("sens-criterion");
  box.innerHTML = "<p><strong>User-defined importance</strong> (1 = hardly important, 9 = extremely important)</p>";
  sens.innerHTML = "";
  App.data.normalisation.forEach(function (c) {
    box.innerHTML += "<div class=\"form-row\"><label for=\"imp-" + c.criterion_id + "\">" +
      App.escape(c.criterion_id + " " + c.criterion_name) + "</label>" +
      "<input type=\"number\" min=\"1\" max=\"9\" value=\"5\" id=\"imp-" + c.criterion_id + "\"></div>";
    sens.add(new Option(c.criterion_id + " " + c.criterion_name, c.criterion_id));
  });

  // Show the user-defined fields only when that preset is chosen.
  var preset = document.getElementById("preset");
  function toggle() { box.style.display = preset.value === "user" ? "block" : "none"; }
  preset.addEventListener("change", toggle);
  toggle();
};

// Read the company profile from the form.
App.readProfile = function () {
  function val(id) { return parseFloat(document.getElementById(id).value) || 0; }
  return {
    hanaMemoryGb: val("hana-memory"),
    dataVolumeGb: val("data-volume"),
    growthPct: val("growth"),
    networkGbMonth: val("network"),
    years: Math.max(1, Math.round(val("years"))),
    region: document.getElementById("region").value,
    discountPct: val("discount"),
    preset: document.getElementById("preset").value
  };
};

// Importance (1-9) per criterion for the chosen preset.
App.importance = function (preset) {
  return App.data.normalisation.map(function (c) {
    if (preset === "cost") return Cost.toNumber(c.importance_cost_preset);
    if (preset === "compliance") return Cost.toNumber(c.importance_compliance_preset);
    var v = parseFloat(document.getElementById("imp-" + c.criterion_id).value);
    return Math.min(9, Math.max(1, isNaN(v) ? 5 : v));
  });
};

// ---------- calculation ----------

App.calculate = function () {
  var profile = App.readProfile();
  var providers = App.unique(App.data.prices, "provider");
  var criteria = App.data.normalisation;

  // 1. Costs (low / base / high) per provider.
  var costs = {};
  providers.forEach(function (p) { costs[p] = Cost.scenarios(App.data.prices, p, profile); });

  // 2. Scores per provider and criterion (1-9). Cost is calculated, the rest comes from the matrix.
  var baseTotals = {};
  providers.forEach(function (p) { baseTotals[p] = costs[p].base.total; });
  var costScore = Mcda.costScores(baseTotals);
  var scores = {}, cells = {};
  providers.forEach(function (p) {
    scores[p] = {}; cells[p] = {};
    criteria.forEach(function (c) {
      if (c.method === "minmax_from_cost") {
        scores[p][c.criterion_id] = costScore[p];
        cells[p][c.criterion_id] = { score: costScore[p], source: "calculated from " + App.FILES.prices + " (base case)", confidence: "same as the prices" };
        return;
      }
      var row = App.data.criteria.filter(function (r) { return r.provider === p && r.criterion_id === c.criterion_id; })[0];
      var s = row ? Cost.toNumber(row.score) : null;
      scores[p][c.criterion_id] = s;
      cells[p][c.criterion_id] = { score: s, source: row ? row.source : "NA", confidence: row ? row.confidence : "NA" };
    });
  });

  // 3. Weights from AHP.
  var ahp = Mcda.ahpWeights(Mcda.pairwiseFromImportance(App.importance(profile.preset)));
  var weights = {};
  criteria.forEach(function (c, i) { weights[c.criterion_id] = ahp.weights[i]; });

  // 4. Ranking and cross-check.
  var ranking = Mcda.weightedSum(scores, weights);
  var topsis = Mcda.topsis(scores, weights);

  App.last = { profile: profile, providers: providers, criteria: criteria, costs: costs,
               scores: scores, cells: cells, ahp: ahp, weights: weights, ranking: ranking, topsis: topsis };

  App.showCost();
  App.showMatrix();
  App.showResult();
  App.showSensitivity();
};

// ---------- tab 1: Cost comparison ----------

App.showCost = function () {
  var L = App.last;
  var parts = ["compute", "storage", "backup", "network", "managed", "oneoff"];

  var rows = L.providers.map(function (p) {
    var c = L.costs[p];
    return [p, App.num(App.fmt(c.low.total)), App.num(App.fmt(c.base.total)), App.num(App.fmt(c.high.total))];
  });
  var html = "<p>Total over " + L.profile.years + " years, EUR. " +
    "Low: discount " + L.costs[L.providers[0]].low.discountPct + "%, growth " + App.fmt(L.costs[L.providers[0]].low.growthPct, 1) + "% per year. " +
    "Base: discount " + L.costs[L.providers[0]].base.discountPct + "%, growth " + App.fmt(L.costs[L.providers[0]].base.growthPct, 1) + "%. " +
    "High: discount " + L.costs[L.providers[0]].high.discountPct + "%, growth " + App.fmt(L.costs[L.providers[0]].high.growthPct, 1) + "%.</p>";
  html += App.table(["Provider", "Low", "Base", "High"], rows);
  html += "<p class=\"note\">" + App.snapshotText() + "</p>";

  // Base case split into the six parts (summed over all years).
  var partRows = L.providers.map(function (p) {
    var row = [p];
    parts.forEach(function (part) {
      var sum = 0;
      L.costs[p].base.years.forEach(function (y) { sum = (sum === null || y[part] === null) ? null : sum + y[part]; });
      row.push(App.num(App.fmt(sum)));
    });
    return row;
  });
  html += App.missingNote(L);
  html += "<p>Base case by cost part (EUR, all years together):</p>";
  html += App.table(["Provider", "Compute", "Storage", "Backup", "Network", "Managed", "OneOff"], partRows);
  document.getElementById("cost-table").innerHTML = html;

  App.drawChart("cost-chart", {
    type: "bar",
    data: {
      labels: L.providers,
      datasets: ["low", "base", "high"].map(function (s, i) {
        return { label: s, data: L.providers.map(function (p) { return L.costs[p][s].total; }),
                 backgroundColor: ["#9DB7D5", "#4C72B0", "#22385E"][i] };
      })
    },
    options: { plugins: { title: { display: true, text: "Cost over the evaluation period (EUR)" } } }
  });
};

// Names of the six cost parts as the page shows them.
App.PART_LABEL = { compute: "compute", storage: "storage", backup: "backup",
                   network: "network", managed: "support", oneoff: "one-off" };

// Why a part is NA: the text after "NA:" in the notes of its price row
// (for example "no public list price"), or a general reason if there is no row.
App.naReason = function (provider, part, profile) {
  var row = part === "compute"
    ? Cost.pickCompute(App.data.prices, provider, profile.region, profile.hanaMemoryGb)
    : Cost.findRow(App.data.prices, provider, profile.region, part);
  if (!row) return "NA, no price row for this region or size";
  var m = /NA:\s*([^.;]+)/.exec(row.notes || "");
  return "NA, " + (m ? m[1].trim() : "no price in the data");
};

// A note under the cost table that says which parts each total leaves out,
// for example "AWS: excludes one-off (NA, no public list price)". Empty if nothing is missing.
App.missingNote = function (L) {
  var lines = [];
  L.providers.forEach(function (p) {
    var miss = L.costs[p].base.missing;
    if (miss.length === 0) return;
    lines.push(App.escape(p) + ": excludes " + miss.map(function (m) {
      return App.PART_LABEL[m] + " (" + App.escape(App.naReason(p, m, L.profile)) + ")";
    }).join(", "));
  });
  if (lines.length === 0) return "";
  return "<p class=\"note\"><strong>Not included in the totals:</strong><br>" + lines.join("<br>") + "</p>";
};

// "Prices captured 2026-11-04 to 2026-11-12": the first and last date_captured in the prices file.
App.snapshotText = function () {
  var dates = App.data.prices.map(function (r) { return r.date_captured; })
    .filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ""); }).sort();
  if (dates.length === 0) return "Price snapshot date: NA";
  var first = dates[0], last = dates[dates.length - 1];
  return "Prices captured " + (first === last ? first : first + " to " + last) +
    " (list prices, on-demand, " + App.escape(App.FILES.prices) + ").";
};

// ---------- tab 2: Criteria matrix ----------

App.showMatrix = function () {
  var L = App.last;
  var header = ["Criterion"].concat(L.providers);
  var rows = L.criteria.map(function (c) {
    var row = [c.criterion_id + " " + c.criterion_name];
    L.providers.forEach(function (p) {
      var cell = L.cells[p][c.criterion_id];
      row.push("score " + App.fmt(cell.score, 1) + " | source: " + cell.source + " | confidence: " + cell.confidence);
    });
    return row;
  });
  document.getElementById("matrix-table").innerHTML =
    "<p>Scores from 1 (worst) to 9 (best). NA means no value in the data files.</p>" + App.table(header, rows);
};

// ---------- tab 3: Weighted result ----------

App.showResult = function () {
  var L = App.last;
  var ids = L.criteria.map(function (c) { return c.criterion_id; });

  var wRows = L.criteria.map(function (c) { return [c.criterion_id + " " + c.criterion_name, App.num(App.pct(L.weights[c.criterion_id]))]; });
  document.getElementById("weights-info").innerHTML =
    "<p>Weights from AHP (simple placeholder). Consistency ratio CR = " + App.fmt(L.ahp.cr, 3) +
    (L.ahp.consistent ? " (below 0.1: acceptable)." : " (0.1 or more: NOT consistent, revise the judgements).") + "</p>" +
    App.table(["Criterion", "Weight"], wRows);

  var rows = L.ranking.map(function (r, i) {
    var row = [String(i + 1), r.provider, App.num(App.fmt(r.total, 2))];
    ids.forEach(function (c) { row.push(App.num(App.fmt(r.contributions[c], 2))); });
    return row;
  });
  document.getElementById("result-table").innerHTML =
    "<p>Total = sum of weight x score (maximum 9). Each criterion column shows its contribution.</p>" +
    App.table(["Rank", "Provider", "Total"].concat(ids), rows);

  App.drawChart("result-chart", {
    type: "bar",
    data: {
      labels: L.ranking.map(function (r) { return r.provider; }),
      datasets: L.criteria.map(function (c, i) {
        return { label: c.criterion_id + " " + c.criterion_name,
                 data: L.ranking.map(function (r) { return r.contributions[c.criterion_id]; }),
                 backgroundColor: App.COLOURS[i % App.COLOURS.length] };
      })
    },
    options: { indexAxis: "y", scales: { x: { stacked: true, max: 9 }, y: { stacked: true } },
               plugins: { title: { display: true, text: "Contribution of each criterion to the total" } } }
  });

  var tRows = L.topsis.map(function (t, i) { return [String(i + 1), t.provider, App.num(App.fmt(t.closeness, 3))]; });
  var agree = L.topsis[0].provider === L.ranking[0].provider;
  document.getElementById("topsis-table").innerHTML =
    "<h3>Cross-check with TOPSIS (simple placeholder)</h3>" +
    "<p>Closeness to the ideal provider, from 0 to 1. " +
    (agree ? "TOPSIS and the weighted sum agree on the first place."
           : "TOPSIS and the weighted sum disagree on the first place. This is a finding, not an error.") + "</p>" +
    App.table(["Rank", "Provider", "Closeness"], tRows);
};

// ---------- tab 4: Sensitivity ----------

App.showSensitivity = function () {
  var L = App.last;
  var crit = document.getElementById("sens-criterion").value;
  var points = Sens.sweep(L.scores, L.weights, crit, 20);
  var switches = Sens.switchPoints(L.scores, L.weights, crit, points);

  var html = "<p>The weight of " + App.escape(crit) + " is changed from 0% to 100%; the other weights keep their proportions. " +
    "Current weight: " + App.pct(L.weights[crit]) + ", current winner: " + App.escape(L.ranking[0].provider) + ".</p>";
  if (switches.length === 0) {
    html += "<p>No switch-point: the winner is the same for every weight of this criterion.</p>";
  } else {
    html += App.table(["Switch-point (weight)", "Winner below", "Winner above"],
      switches.map(function (s) { return [App.num(App.pct(s.weight)), s.from, s.to]; }));
  }
  document.getElementById("switch-points").innerHTML = html;

  App.drawChart("sens-chart", {
    type: "line",
    data: {
      labels: points.map(function (pt) { return Math.round(pt.weight * 100) + "%"; }),
      datasets: L.providers.map(function (p, i) {
        return { label: p, data: points.map(function (pt) { return pt.totals[p]; }),
                 borderColor: App.COLOURS[i % App.COLOURS.length], backgroundColor: App.COLOURS[i % App.COLOURS.length],
                 pointRadius: 2 };
      })
    },
    options: { plugins: { title: { display: true, text: "Weighted total while the weight of " + crit + " changes" } },
               scales: { x: { title: { display: true, text: "Weight of " + crit } },
                         y: { title: { display: true, text: "Weighted total" } } } }
  });
};

// ---------- start ----------

App.start = function () {
  App.setupTabs();

  // Red banner when any demo file is used.
  var demo = Object.keys(App.FILES).some(function (k) { return App.FILES[k].indexOf("_demo") >= 0; });
  if (demo) {
    var demoFiles = Object.keys(App.FILES).map(function (k) { return App.FILES[k]; })
      .filter(function (f) { return f.indexOf("_demo") >= 0; });
    var banner = document.getElementById("demo-banner");
    banner.textContent = "DEMO DATA - these files are not real yet: " + demoFiles.join(", ");
    banner.style.display = "block";
  }

  Promise.all([App.loadCsv(App.FILES.prices), App.loadCsv(App.FILES.normalisation), App.loadCsv(App.FILES.criteria)])
    .then(function (results) {
      App.data.prices = results[0];
      App.data.normalisation = results[1];
      App.data.criteria = results[2];
      App.fillForm();
      document.getElementById("profile-form").addEventListener("submit", function (e) {
        e.preventDefault();        // stay on the page instead of reloading it
        App.calculate();
      });
      document.getElementById("sens-criterion").addEventListener("change", App.showSensitivity);
      App.calculate();             // first result with the example values
    })
    .catch(function (err) {
      App.status("Error: " + err.message);
      console.error(err);
    });
};

document.addEventListener("DOMContentLoaded", App.start);
