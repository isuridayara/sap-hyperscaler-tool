// cost.js - the cost engine.
// Cost = Compute + Storage + Backup + Network + Managed + OneOff, per provider per year.
// Prices come from the prices CSV (one row = one price). If a price is missing,
// that part becomes null and is shown as "NA" on the page. Nothing is guessed.
// The total adds up only the parts that have a price; the parts that are NA are
// listed in "missing" so the page can say what the total leaves out
// (decision by Dayara, 2026-11-01, see notes/decisions.md).

var Cost = {};

// Hours in one year, used to turn an hourly machine price into a yearly one.
Cost.HOURS_PER_YEAR = 24 * 365;

// Scenario settings for low / base / high. These are modelling assumptions,
// not prices (see notes/decisions.md).
//   low  = extra discount and slower data growth
//   high = less discount and faster data growth
Cost.SCENARIO = {
  low:  { extraDiscountPct: 10,  growthFactor: 0.5 },
  base: { extraDiscountPct: 0,   growthFactor: 1.0 },
  high: { extraDiscountPct: -10, growthFactor: 1.5 }
};

// Turn a text from the CSV into a number, or null if it is empty or "NA".
Cost.toNumber = function (text) {
  if (text === undefined || text === null) return null;
  var n = parseFloat(String(text).replace(",", "."));
  return isNaN(n) ? null : n;
};

// Find the first price row for one provider, region and category (for example "storage").
Cost.findRow = function (prices, provider, region, category) {
  for (var i = 0; i < prices.length; i++) {
    var r = prices[i];
    if (r.provider === provider && r.region === region && r.service_category === category) return r;
  }
  return null;
};

// Pick the smallest compute machine whose memory (the number in "spec") is at least memoryGb.
Cost.pickCompute = function (prices, provider, region, memoryGb) {
  var best = null;
  for (var i = 0; i < prices.length; i++) {
    var r = prices[i];
    if (r.provider !== provider || r.region !== region || r.service_category !== "compute") continue;
    var mem = Cost.toNumber(r.spec);
    if (mem === null || mem < memoryGb) continue;
    if (best === null || mem < Cost.toNumber(best.spec)) best = r;
  }
  return best;
};

// Price of a row as a number, or null if the row or its price is missing.
Cost.priceOf = function (row) {
  return row ? Cost.toNumber(row.unit_price) : null;
};

// True when a support ("managed") row is a percentage of the monthly bill,
// for example AWS Business Support+ (9%) or Google Cloud Enhanced Support (10%).
Cost.isPercentRow = function (row) {
  return row !== null && row.unit === "percent of monthly charges";
};

// The monthly minimum of a percentage support row, read from its spec,
// for example "minimum 25.94 EUR/month" gives 25.94. Returns 0 if there is none.
Cost.minimumOf = function (row) {
  var m = /minimum\s+([\d.,]+)/i.exec(row.spec || "");
  return m ? Cost.toNumber(m[1]) : 0;
};

// Cost of one year (yearNumber = 1, 2, 3 ...) for one provider.
// profile: { hanaMemoryGb, dataVolumeGb, networkGbMonth, region }
// Returns the six parts and the total; a part is null when its price is missing.
Cost.yearCost = function (prices, provider, profile, yearNumber, growthPct, discountPct) {
  var region = profile.region;
  var keep = 1 - discountPct / 100;                                    // share of the list price that is paid
  var dataGb = profile.dataVolumeGb * Math.pow(1 + growthPct / 100, yearNumber - 1);  // HANA data grows every year

  var pCompute = Cost.priceOf(Cost.pickCompute(prices, provider, region, profile.hanaMemoryGb));
  var pStorage = Cost.priceOf(Cost.findRow(prices, provider, region, "storage"));
  var pBackup  = Cost.priceOf(Cost.findRow(prices, provider, region, "backup"));
  var pNetwork = Cost.priceOf(Cost.findRow(prices, provider, region, "network"));
  var managedRow = Cost.findRow(prices, provider, region, "managed");
  var pManaged = Cost.priceOf(managedRow);
  var pOneOff  = Cost.priceOf(Cost.findRow(prices, provider, region, "oneoff"));

  // Multiply only when the price exists; otherwise keep null (= NA).
  function part(price, amount) { return price === null ? null : price * amount; }

  var y = {
    compute: part(pCompute, Cost.HOURS_PER_YEAR * keep),               // per hour x hours in a year
    storage: part(pStorage, dataGb * 12 * keep),                       // per GB-month x GB x 12 months
    backup:  part(pBackup,  dataGb * 12 * keep),                       // one backup copy of the data
    network: part(pNetwork, profile.networkGbMonth * 12 * keep),       // per GB sent out x GB per year
    managed: part(pManaged, 12 * keep),                                // flat fee: per month x 12
    oneoff:  yearNumber === 1 ? part(pOneOff, 1) : 0                   // only in year 1, no discount
  };

  // Support given as a percentage: percent x (the year's running costs),
  // but at least the monthly minimum x 12. First tier only (decision by Dayara, 2026-11-04).
  if (Cost.isPercentRow(managedRow) && pManaged !== null) {
    var running = [y.compute, y.storage, y.backup, y.network];
    if (running.indexOf(null) >= 0) {
      y.managed = null;                                                // cannot work out a % of an unknown bill
    } else {
      var bill = running.reduce(function (a, b) { return a + b; }, 0);
      y.managed = Math.max(bill * pManaged / 100, Cost.minimumOf(managedRow) * 12 * keep);
    }
  }

  // The total adds up the parts that have a price. Parts that are NA are left out
  // and named in y.missing. If every part is NA, the total is NA too.
  var names = ["compute", "storage", "backup", "network", "managed", "oneoff"];
  y.missing = names.filter(function (n) { return y[n] === null; });
  if (y.missing.length === names.length) {
    y.total = null;
  } else {
    y.total = names.reduce(function (sum, n) { return y[n] === null ? sum : sum + y[n]; }, 0);
  }
  return y;
};

// Cost over the whole evaluation period: a list of years, the sum, and the
// parts that are NA in at least one year (so the page can say what is left out).
Cost.periodCost = function (prices, provider, profile, growthPct, discountPct) {
  var years = [];
  var total = 0;
  var missing = [];
  for (var n = 1; n <= profile.years; n++) {
    var y = Cost.yearCost(prices, provider, profile, n, growthPct, discountPct);
    years.push(y);
    total = (total === null || y.total === null) ? null : total + y.total;
    y.missing.forEach(function (m) { if (missing.indexOf(m) < 0) missing.push(m); });
  }
  return { years: years, total: total, missing: missing };
};

// Low / base / high for one provider, built from the two scenario variables: discount and growth.
Cost.scenarios = function (prices, provider, profile) {
  var out = {};
  ["low", "base", "high"].forEach(function (name) {
    var s = Cost.SCENARIO[name];
    var discount = Math.min(90, Math.max(0, profile.discountPct + s.extraDiscountPct));
    var growth = profile.growthPct * s.growthFactor;
    out[name] = Cost.periodCost(prices, provider, profile, growth, discount);
    out[name].discountPct = discount;
    out[name].growthPct = growth;
  });
  return out;
};
