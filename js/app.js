// app.js - connects the page to the engines.
// It loads the CSV files, reads the form, runs cost.js, mcda.js and sensitivity.js,
// and fills the four tabs. Chat 5: AHP weights from data/pairwise.csv, both rankings in tab 3.
// Chat 6: tab 4 shows switch-point tables for all weights and the main cost drivers.
// It also switches tabs and shows the DEMO DATA notices.
// Chat 2b: the real criteria files (data/normalisation.csv, data/criteria.csv) are used;
// if one cannot be loaded, the page falls back to its demo twin and shows the DEMO notice for it.

var App = {};

// Which data files the page loads. A file name with "_demo" switches on the red DEMO notice.
// pairwise.csv holds Dayara's AHP judgments for the two presets (real decisions, not demo).
App.FILES = {
  prices: "data/prices.csv",
  normalisation: "data/normalisation.csv",
  criteria: "data/criteria.csv",
  pairwise: "data/pairwise.csv"
};

// Fallback files: used only if the real file above cannot be loaded (for example not uploaded yet).
App.FALLBACK = {
  normalisation: "data/normalisation_demo.csv",
  criteria: "data/criteria_demo.csv"
};

// True if at least one criteria file is a demo file (then rankings are not findings).
App.usesDemo = function () {
  return App.FILES.normalisation.indexOf("_demo") >= 0 || App.FILES.criteria.indexOf("_demo") >= 0;
};

// Load one of the files in App.FILES. If it fails and there is a fallback file, load that instead
// and remember the file name actually used (so the DEMO notice names the right file).
App.loadWithFallback = function (key) {
  return App.loadCsv(App.FILES[key]).catch(function (err) {
    if (!App.FALLBACK[key]) throw err;
    console.warn(err.message + " - using " + App.FALLBACK[key] + " instead");
    App.FILES[key] = App.FALLBACK[key];
    return App.loadCsv(App.FILES[key]);
  });
};

// Names of the presets as the page shows them.
App.PRESET_LABEL = { cost: "Cost-sensitive", compliance: "Compliance-sensitive", user: "User-defined" };

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
App.pct = function (x) { return x === null || x === undefined ? "NA" : App.fmt(x * 100, 1) + "%"; };

// Show a pairwise judgment the way it is written on the Saaty scale: 3, 1, 1/2, 1/5 ...
App.frac = function (x) {
  if (x === null || x === undefined) return "NA";
  if (x >= 1) return App.fmt(x, Math.abs(x - Math.round(x)) < 1e-9 ? 0 : 2);
  var inv = 1 / x;
  return Math.abs(inv - Math.round(inv)) < 1e-9 ? "1/" + Math.round(inv) : App.fmt(x, 3);
};

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

// Importance (1-9) per criterion, typed in by the user (only for the "User-defined" preset).
App.importance = function () {
  return App.data.normalisation.map(function (c) {
    var v = parseFloat(document.getElementById("imp-" + c.criterion_id).value);
    return Math.min(9, Math.max(1, isNaN(v) ? 5 : v));
  });
};

// AHP weights for the chosen preset.
// - cost / compliance: the two-level AHP from Dayara's judgments in data/pairwise.csv.
// - user: one importance value per criterion (simple, always consistent).
// Returns { weights: { "C1.1": ... }, hierarchy (or null), flat (or null), consistent, error }.
App.presetWeights = function (preset, ids) {
  if (preset === "user") {
    var flat = Mcda.ahpWeights(Mcda.pairwiseFromImportance(App.importance()));
    var w = {};
    ids.forEach(function (c, i) { w[c] = flat.weights[i]; });
    return { weights: w, hierarchy: null, flat: flat, consistent: flat.consistent, error: null };
  }
  var judgments = App.data.pairwise
    .filter(function (r) { return r.preset === preset; })
    .map(function (r) { return { matrix: r.matrix, row: r.row, col: r.col, value: Mcda.parseJudgment(r.value) }; });
  var h = Mcda.ahpHierarchy(ids, judgments);
  return { weights: h.weights, hierarchy: h, flat: null, consistent: h.consistent, error: h.error };
};

// ---------- calculation ----------

// Scores per provider and criterion (1-9). The cost criterion is calculated from the base-case totals,
// the other criteria come from the criteria file. Chat 6: moved into its own function so that the
// Sensitivity tab can recalculate the scores when a cost driver changes.
App.buildScores = function (providers, criteria, baseTotals) {
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
      cells[p][c.criterion_id] = { score: s, source: row ? row.source : "NA", confidence: row ? row.confidence : "NA",
                                   raw: row && row.raw_value ? row.raw_value + (row.raw_unit ? " " + row.raw_unit : "") : null,
                                   date: row && row.date_captured ? row.date_captured : null };
    });
  });
  return { scores: scores, cells: cells };
};

// The total used for the cost score. If compute has no price (for example no certified machine is big enough),
// the total would leave out about 97% of the bill and could not be compared with the other providers,
// so the cost score becomes NA instead (Chat 6: found with the Arvato case, 6 TB memory).
App.comparableTotal = function (period) {
  return period.missing.indexOf("compute") >= 0 ? null : period.total;
};

// Ranking for a changed company profile, with the weights of the last calculation.
// extraDiscount (optional) = { provider: percent } gives ONE provider an extra discount,
// like a negotiated deal that the other providers do not give. Used by the Sensitivity tab.
App.rankFor = function (profile, extraDiscount) {
  var L = App.last;
  extraDiscount = extraDiscount || {};
  var baseTotals = {};
  L.providers.forEach(function (p) {
    var pr = Object.assign({}, profile, { discountPct: Math.min(90, profile.discountPct + (extraDiscount[p] || 0)) });
    baseTotals[p] = App.comparableTotal(Cost.scenarios(App.data.prices, p, pr).base);
  });
  return Mcda.weightedSum(App.buildScores(L.providers, L.criteria, baseTotals).scores, L.weights);
};

App.calculate = function () {
  App.status("");                  // clear an old error message
  var profile = App.readProfile();
  var providers = App.unique(App.data.prices, "provider");
  var criteria = App.data.normalisation;

  // 1. Costs (low / base / high) per provider.
  var costs = {};
  providers.forEach(function (p) { costs[p] = Cost.scenarios(App.data.prices, p, profile); });

  // 2. Scores per provider and criterion (1-9). Cost is calculated, the rest comes from the matrix.
  var baseTotals = {};
  providers.forEach(function (p) { baseTotals[p] = App.comparableTotal(costs[p].base); });
  var built = App.buildScores(providers, criteria, baseTotals);
  var scores = built.scores, cells = built.cells;

  // 3. Weights from AHP.
  var ids = criteria.map(function (c) { return c.criterion_id; });
  var ahp = App.presetWeights(profile.preset, ids);
  if (ahp.error) {
    App.status("Error in " + App.FILES.pairwise + ": " + ahp.error + ". The ranking cannot be calculated.");
    return;
  }
  var weights = ahp.weights;

  // 4. Ranking (weighted sum), gap contributions and the TOPSIS cross-check.
  var ranking = Mcda.weightedSum(scores, weights);
  var gaps = Mcda.gapContributions(ranking);
  var topsis = Mcda.topsis(scores, weights);
  var comparison = Mcda.compareRankings(ranking, topsis);

  App.last = { profile: profile, providers: providers, criteria: criteria, costs: costs,
               scores: scores, cells: cells, ahp: ahp, weights: weights, ranking: ranking,
               gaps: gaps, topsis: topsis, comparison: comparison };

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
  html += App.yearTable(L);
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

// Table with one row per provider and year: low, base and high cost of that year (EUR),
// plus one total row per provider. The note under it says what the high case means at list price.
App.yearTable = function (L) {
  var rows = [];
  L.providers.forEach(function (p) {
    var c = L.costs[p];
    c.base.years.forEach(function (y, i) {
      rows.push([p, "Year " + (i + 1), App.num(App.fmt(c.low.years[i].total)),
                 App.num(App.fmt(y.total)), App.num(App.fmt(c.high.years[i].total))]);
    });
    rows.push([p, "Total " + L.profile.years + " years", App.num("<strong>" + App.fmt(c.low.total) + "</strong>"),
               App.num("<strong>" + App.fmt(c.base.total) + "</strong>"), App.num("<strong>" + App.fmt(c.high.total) + "</strong>")]);
  });
  var html = "<p>Cost per provider and year (EUR):</p>" + App.table(["Provider", "Year", "Low", "Base", "High"], rows);
  if (L.costs[L.providers[0]].high.discountPct === L.costs[L.providers[0]].base.discountPct) {
    html += "<p class=\"note\">At list price the high case cannot add a price above the list price, so it differs from the base case " +
      "only by faster data growth. The range therefore runs from a discounted price (low) up to the list price (base and high). " +
      "Data growth changes only storage and backup; the machine size stays the same for all years.</p>";
  }
  return html;
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
      row.push("score " + App.fmt(cell.score, 2) + (cell.raw ? " | value: " + cell.raw : "") +
               " | source: " + cell.source + (cell.date ? " (" + cell.date + ")" : "") + " | confidence: " + cell.confidence);
    });
    return row;
  });
  document.getElementById("matrix-table").innerHTML =
    "<p>Scores from 1 (worst) to 9 (best). NA means no value in the data files. Source links and quotes: " +
    App.escape(App.FILES.criteria) + ".</p>" + App.table(header, rows) + App.rulesTable(L);
};

// Table of the scoring rules (only the real normalisation file has the scoring_rule column).
App.rulesTable = function (L) {
  if (!L.criteria.length || L.criteria[0].scoring_rule === undefined) return "";
  var rows = L.criteria.map(function (c) {
    return [c.criterion_id + " " + c.criterion_name, c.raw_measure || "NA", c.scoring_rule || "NA", c.checklist_items || "-"];
  });
  return "<h3>How the scores are calculated (" + App.escape(App.FILES.normalisation) + ")</h3>" +
    App.table(["Criterion", "Value collected", "Scoring rule", "Checklist items"], rows);
};

// ---------- tab 3: Weighted result ----------

App.showResult = function () {
  var L = App.last;
  var ids = L.criteria.map(function (c) { return c.criterion_id; });
  var name = {};
  L.criteria.forEach(function (c) { name[c.criterion_id] = c.criterion_name; });

  // Part 1: the AHP weights, with the matrices and their consistency ratios.
  document.getElementById("weights-info").innerHTML = App.weightsHtml(L, ids, name);

  // Part 2: ranking 1, the weighted sum, with each criterion's contribution.
  var rows = L.ranking.map(function (r, i) {
    var row = [String(i + 1), r.provider, App.num(App.fmt(r.total, 2))];
    ids.forEach(function (c) { row.push(App.num(App.fmt(r.contributions[c], 2))); });
    return row;
  });
  document.getElementById("result-table").innerHTML =
    "<h3>Ranking 1: AHP weighted sum</h3>" +
    "<p>Total = sum of weight x score (scores 1-9, so the maximum is 9). Each criterion column shows its contribution to the total.</p>" +
    App.table(["Rank", "Provider", "Total"].concat(ids), rows);

  App.drawChart("result-chart", {
    type: "bar",
    data: {
      labels: L.ranking.map(function (r) { return r.provider; }),
      datasets: L.criteria.map(function (c, i) {
        return { label: c.criterion_id + " " + c.criterion_name,
                 data: L.ranking.map(function (r) { return r.contributions[c.criterion_id]; }),
                 backgroundColor: App.CRITERION_COLOURS[i % App.CRITERION_COLOURS.length] };
      })
    },
    options: { indexAxis: "y", scales: { x: { stacked: true, max: 9 }, y: { stacked: true } },
               plugins: { title: { display: true, text: "Contribution of each criterion to the total (AHP weighted sum)" } } }
  });

  // Part 3: what makes up the gap between the first provider and each of the others.
  var gapRows = L.gaps.map(function (g) {
    var row = [g.leader + " vs " + g.other, App.num("<strong>" + App.fmt(g.totalGap, 3) + "</strong>")];
    ids.forEach(function (c) { row.push(App.num(App.fmt(g.gaps[c], 3))); });
    return row;
  });
  document.getElementById("gap-table").innerHTML =
    "<h3>Contribution of each criterion to the gap between providers</h3>" +
    "<p>Gap = contribution of the first provider minus contribution of the other provider. " +
    "Positive: this criterion helps the first provider. Negative: it helps the other provider. " +
    "The criterion gaps add up to the total gap.</p>" +
    App.table(["Comparison", "Total gap"].concat(ids), gapRows);

  // Part 4: ranking 2, TOPSIS, and the comparison of the two rankings.
  var topsisRank = {};
  L.topsis.forEach(function (t, i) { topsisRank[t.provider] = i + 1; });
  var tRows = L.topsis.map(function (t, i) {
    return [String(i + 1), t.provider, App.num(App.fmt(t.closeness, 3)),
            App.num(App.fmt(t.dIdeal, 4)), App.num(App.fmt(t.dAnti, 4))];
  });
  var cRows = L.ranking.map(function (r, i) {
    var tr = topsisRank[r.provider];
    return [r.provider, App.num(String(i + 1)), App.num(String(tr)), tr === i + 1 ? "same" : "DIFFERENT"];
  });
  var C = L.comparison;
  var verdict = C.sameOrder
    ? "AHP (weighted sum) and TOPSIS give the same order: " + C.ahpOrder.join(" > ") + "."
    : "FINDING: AHP (weighted sum) and TOPSIS give a different order. AHP: " + C.ahpOrder.join(" > ") +
      "; TOPSIS: " + C.topsisOrder.join(" > ") + ". The result depends on the method, so it is not robust. " +
      "This is a finding, not an error.";
  document.getElementById("topsis-table").innerHTML =
    "<h3>Ranking 2: TOPSIS (cross-check)</h3>" +
    "<p>Same scores and weights. Closeness to the ideal provider from 0 (worst on every criterion) to 1 (best on every criterion). " +
    "Distances are measured to the ideal and to the anti-ideal (worst) provider.</p>" +
    App.table(["Rank", "Provider", "Closeness", "Distance to ideal", "Distance to anti-ideal"], tRows) +
    "<h3>AHP and TOPSIS side by side</h3>" +
    App.table(["Provider", "AHP rank", "TOPSIS rank", "Same place?"], cRows) +
    "<p><strong>" + App.escape(verdict) + "</strong></p>";
};

// Colours for the seven criteria in the contribution chart (one per criterion).
App.CRITERION_COLOURS = ["#4C72B0", "#9DB7D5", "#DD8452", "#F2C29B", "#55A868", "#A5D6A7", "#8172B3"];

// HTML for the AHP part of tab 3: preset, group matrix, local matrices, final weights, CR.
App.weightsHtml = function (L, ids, name) {
  var A = L.ahp;
  var label = App.PRESET_LABEL[L.profile.preset] || L.profile.preset;
  function crText(ahp) {
    return "CR = " + App.fmt(ahp.cr, 3) + (ahp.consistent ? " (below 0.1: consistent)" : " (0.1 or more: NOT consistent, revise the judgments)");
  }
  function matrixTable(mIds, matrix, ahp, names) {
    var rows = mIds.map(function (id, i) {
      var row = [id + (names && names[id] ? " " + names[id] : "")];
      matrix[i].forEach(function (cell) { row.push(App.num(App.frac(cell))); });
      row.push(App.num("<strong>" + App.fmt(ahp.weights[i], 3) + "</strong>"));
      return row;
    });
    return App.table([""].concat(mIds).concat(["Weight"]), rows);
  }

  var html = "<h3>AHP weights: " + App.escape(label) + " preset</h3>";
  if (A.flat) {
    html += "<p>User-defined importance values (1-9) are turned into a pairwise matrix (importance i / importance j). " +
      "Such a matrix is always consistent: " + crText(A.flat) + ".</p>";
  } else {
    var H = A.hierarchy;
    var groupName = {};
    L.criteria.forEach(function (c) { groupName[c.group_id] = c.group_name; });
    html += "<p>Pairwise judgments on the Saaty scale (1 = equal ... 9 = extremely more important) from " +
      App.escape(App.FILES.pairwise) + ". Read each row as: the row is X times as important as the column. " +
      "Weights = principal eigenvector of the matrix.</p>";
    html += "<p><strong>Level 1: the four groups.</strong> lambda max = " + App.fmt(H.groups.ahp.lambdaMax, 3) +
      ", CI = " + App.fmt(H.groups.ahp.ci, 4) + ", RI = " + App.fmt(Mcda.RANDOM_INDEX[H.groups.ids.length], 2) +
      ", " + crText(H.groups.ahp) + ".</p>";
    html += matrixTable(H.groups.ids, H.groups.matrix, H.groups.ahp, groupName);
    html += "<p><strong>Level 2: inside each group.</strong> A 2 x 2 matrix is always consistent (CR = 0); " +
      "a group with one criterion needs no comparison.</p>";
    H.groups.ids.forEach(function (g) {
      var loc = H.local[g];
      if (loc.ids.length < 2) return;
      html += "<p>" + App.escape(g + " " + (groupName[g] || "")) + ": " + crText(loc.ahp) + "</p>";
      html += matrixTable(loc.ids, loc.matrix, loc.ahp, null);
    });
  }

  var wRows = L.criteria.map(function (c) {
    var row = [c.criterion_id + " " + c.criterion_name];
    if (A.hierarchy) {
      var g = A.hierarchy.groups.ids.indexOf(c.group_id);
      var loc = A.hierarchy.local[c.group_id];
      row.push(App.num(App.fmt(A.hierarchy.groups.ahp.weights[g], 3)));
      row.push(App.num(App.fmt(loc.ahp.weights[loc.ids.indexOf(c.criterion_id)], 3)));
    }
    row.push(App.num("<strong>" + App.fmt(L.weights[c.criterion_id], 3) + "</strong>"));
    return row;
  });
  html += "<p><strong>Final weights</strong>" + (A.hierarchy ? " = group weight x local weight" : "") + ". They add up to 1.</p>";
  html += App.table(A.hierarchy ? ["Criterion", "Group weight", "Local weight", "Final weight"] : ["Criterion", "Weight"], wRows);
  html += A.consistent
    ? "<p>All matrices are consistent (CR below 0.1).</p>"
    : "<p class=\"status\"><strong>At least one matrix has CR of 0.1 or more. Revise the judgments in " + App.escape(App.FILES.pairwise) + ".</strong></p>";
  return html;
};

// ---------- tab 4: Sensitivity ----------

// The cost drivers that tab 4 changes one at a time (Chat 6). For each driver: a label, the value now,
// the values that are tried, whether values in between make sense (continuous), how a value is shown,
// and evaluate(value) = the ranking when only this driver has that value (everything else as in the form).
App.costDrivers = function (L) {
  var P = L.profile;
  function withValue(key) {
    return function (v) { var pr = Object.assign({}, P); pr[key] = v; return App.rankFor(pr); };
  }
  function pct(v) { return App.fmt(v, 1) + "%"; }   // e.g. 7.5%
  var drivers = L.providers.map(function (p) {
    return { label: "Extra discount given only by " + p, now: 0, values: Sens.range(0, 60, 5), continuous: true,
             show: pct, evaluate: function (v) { var e = {}; e[p] = v; return App.rankFor(P, e); } };
  });
  drivers.push({ label: "Same discount from all providers", now: P.discountPct, values: Sens.range(0, 60, 5),
                 continuous: true, show: pct, evaluate: withValue("discountPct") });
  drivers.push({ label: "SAP HANA memory size (GB)", now: P.hanaMemoryGb, values: [256, 512, 768, 1024, 1536, 2048, 3072, 4096],
                 continuous: false, show: function (v) { return App.fmt(v, 0) + " GB"; }, evaluate: withValue("hanaMemoryGb") });
  drivers.push({ label: "Data growth per year", now: P.growthPct, values: Sens.range(0, 50, 5),
                 continuous: true, show: pct, evaluate: withValue("growthPct") });
  drivers.push({ label: "Outbound network traffic (GB per month)", now: P.networkGbMonth, values: Sens.range(0, 20000, 1000),
                 continuous: true, show: function (v) { return App.fmt(v, 0) + " GB"; }, evaluate: withValue("networkGbMonth") });
  drivers.push({ label: "Evaluation period (years)", now: P.years, values: Sens.range(1, 10, 1),
                 continuous: false, show: function (v) { return App.fmt(v, 0); }, evaluate: withValue("years") });
  return drivers;
};

App.showSensitivity = function () {
  var L = App.last;
  if (L.ranking[0].total === null) {          // no provider has a complete total, so there is nothing to switch
    document.getElementById("switch-summary").innerHTML =
      "<p><strong>No recommendation, so no switch-points.</strong> At least one score is NA for every provider " +
      "(see the Cost comparison and Criteria matrix tabs, for example no certified machine is large enough for the memory size).</p>";
    document.getElementById("switch-points").innerHTML = "";
    App.drawChart("sens-chart", { type: "line", data: { labels: [], datasets: [] } });
    return;
  }
  var name = {};
  L.criteria.forEach(function (c) { name[c.criterion_id] = c.criterion_name; });
  var winner = L.ranking[0].provider;
  var intro = "<p>Current recommendation (weighted sum, " + App.escape(App.PRESET_LABEL[L.profile.preset] || L.profile.preset) +
    " preset): <strong>" + App.escape(winner) + "</strong>. A <strong>switch-point</strong> is the value at which another provider " +
    "comes out on top. Only one thing is changed at a time; everything else stays as in the form." +
    (App.usesDemo() ? " While the criteria scores are DEMO values, these switch-points are provisional." : "") + "</p>";

  // Table 1: weights of all criteria.
  var wRes = Sens.allWeightSwitchPoints(L.scores, L.weights, 100);
  var wRows = [];
  wRes.forEach(function (r) {
    var label = r.criterion + " " + (name[r.criterion] || "");
    if (r.switches.length === 0) {
      wRows.push([label, App.num(App.pct(r.weight)), "none (0-100%)", "-", App.num("-")]);
      return;
    }
    r.switches.forEach(function (s) {
      var to = s.from === winner ? s.to : s.from;     // the provider that wins on the other side
      wRows.push([label, App.num(App.pct(r.weight)), App.num(App.pct(s.weight)), to,
                  App.num(App.fmt((s.weight - r.weight) * 100, 1))]);
    });
  });
  var closest = wRes.filter(function (r) { return r.margin !== null; })
                    .sort(function (a, b) { return Math.abs(a.margin) - Math.abs(b.margin); })[0];
  var wText = closest
    ? "<p>Most sensitive weight: <strong>" + App.escape(closest.criterion) + "</strong>. Moving it by " +
      App.fmt(Math.abs(closest.margin) * 100, 1) + " percentage points (to " + App.pct(closest.nearest.weight) +
      ") changes the recommendation.</p>"
    : "<p>No weight change between 0% and 100% changes the recommendation.</p>";

  // Table 2: cost drivers.
  var dRows = [];
  App.costDrivers(L).forEach(function (d) {
    var points = Sens.driverSweep(d.values, d.evaluate);
    var switches = Sens.driverSwitchPoints(points, d.evaluate, d.continuous);
    var range = d.show(d.values[0]) + " to " + d.show(d.values[d.values.length - 1]);
    if (switches.length === 0) {
      dRows.push([d.label, App.num(d.show(d.now)), range, "none in this range", "-"]);
      return;
    }
    switches.forEach(function (s) {
      var at = s.value === null ? "between " + d.show(s.between[0]) + " and " + d.show(s.between[1]) : d.show(s.value);
      dRows.push([d.label, App.num(d.show(d.now)), range, at, s.from + " → " + s.to]);
    });
  });

  document.getElementById("switch-summary").innerHTML = intro +
    "<h3>Switch-points 1: weights</h3>" +
    "<p>The weight of one criterion goes from 0% to 100%; the other weights keep their proportions. " +
    "Distance = switch-point minus current weight, in percentage points.</p>" +
    App.table(["Criterion", "Weight now", "Switch-point (weight)", "Winner on the other side", "Distance (pp)"], wRows) + wText +
    "<h3>Switch-points 2: cost drivers</h3>" +
    "<p>One input of the cost model is changed; costs and the cost score (C1.1) are recalculated, the weights stay the same. " +
    "The cost score compares the providers with each other, so a discount that all providers give equally hardly " +
    "changes anything; a discount from one provider only (a negotiated deal) can.</p>" +
    App.table(["Cost driver", "Value now", "Range tested", "Switch-point", "Winner changes"], dRows);

  App.showWeightDetail();
};

// Detail for one criterion (chosen in the list): its switch-points and a chart of all totals.
App.showWeightDetail = function () {
  var L = App.last;
  if (L.ranking[0].total === null) return;    // see App.showSensitivity
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

// ---------- demo notices ----------

// Which tabs each data file feeds. The prices feed every tab (cost is also a criterion),
// the criteria files feed only the last three tabs.
App.DEMO_TABS = {
  prices: ["tab-cost", "tab-matrix", "tab-result", "tab-sensitivity"],
  normalisation: ["tab-matrix", "tab-result", "tab-sensitivity"],
  criteria: ["tab-matrix", "tab-result", "tab-sensitivity"],
  pairwise: ["tab-result", "tab-sensitivity"]
};

// Red DEMO notices (decision by Dayara, 2026-11-18):
// - demo prices file: the red banner at the top of the page, as before;
// - demo criteria files: a red notice at the top of each tab that uses them,
//   and "(DEMO)" on its tab button. The Cost tab stays clean when the prices are real.
App.showDemoNotices = function () {
  var demoFiles = {};                                  // tab id -> list of demo files it uses
  Object.keys(App.FILES).forEach(function (k) {
    if (App.FILES[k].indexOf("_demo") < 0) return;
    App.DEMO_TABS[k].forEach(function (tab) {
      (demoFiles[tab] = demoFiles[tab] || []).push(App.FILES[k]);
    });
  });

  if (App.FILES.prices.indexOf("_demo") >= 0) {
    var banner = document.getElementById("demo-banner");
    banner.textContent = "DEMO DATA - the prices are not real: " + App.FILES.prices;
    banner.style.display = "block";
  }

  Object.keys(demoFiles).forEach(function (tab) {
    var notice = document.createElement("div");
    notice.className = "demo-banner";
    notice.style.display = "block";
    notice.style.margin = "0 0 16px";
    notice.textContent = "DEMO DATA - this tab uses files that are not real yet: " + demoFiles[tab].join(", ");
    var panel = document.getElementById(tab);
    panel.insertBefore(notice, panel.firstChild);
    var button = document.querySelector(".tab-buttons button[data-tab=\"" + tab + "\"]");
    if (button) button.textContent += " (DEMO)";
  });
};

// ---------- start ----------

App.start = function () {
  App.setupTabs();

  Promise.all([App.loadCsv(App.FILES.prices), App.loadWithFallback("normalisation"),
               App.loadWithFallback("criteria"), App.loadCsv(App.FILES.pairwise)])
    .then(function (results) {
      App.showDemoNotices();       // after loading, so that a fallback to a demo file gets its notice
      App.data.prices = results[0];
      App.data.normalisation = results[1];
      App.data.criteria = results[2];
      App.data.pairwise = results[3];
      App.fillForm();
      document.getElementById("profile-form").addEventListener("submit", function (e) {
        e.preventDefault();        // stay on the page instead of reloading it
        App.calculate();
      });
      document.getElementById("sens-criterion").addEventListener("change", App.showWeightDetail);
      App.calculate();             // first result with the example values
    })
    .catch(function (err) {
      App.status("Error: " + err.message);
      console.error(err);
    });
};

document.addEventListener("DOMContentLoaded", App.start);
