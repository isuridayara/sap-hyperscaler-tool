# MCDA results: AHP weights and rankings (Chat 5)

Date: 2026-11-20. Code: js/mcda.js, js/app.js. Judgments: data/pairwise.csv. Checks: tests.html (47 of 47 PASS).

> **Status of the rankings: DEMO.** The weights and consistency ratios below are final (Eva's judgments).
> The rankings use real data only for C1.1 (cost, from data/prices.csv). The scores for C1.2 to C4.1 come from
> data/criteria_demo.csv and are invented placeholders. The rankings must be recalculated when the real
> criteria scores exist, and must not be reported as findings before that.

## 1. Method

- **AHP** (Analytic Hierarchy Process) with Saaty's 1-9 scale [CITATION NEEDED: Saaty 1980 / 2008].
  Two levels (decision by Eva, 2026-11-20): four groups C1 to C4, then the sub-criteria inside each group.
  Weights = principal eigenvector of each pairwise matrix (power iteration).
  Final weight of a criterion = group weight x local weight.
- **Consistency:** CI = (lambda max - n) / (n - 1), CR = CI / RI, with RI = 0.90 for n = 4 (Saaty's random index)
  [CITATION NEEDED: source of the RI values]. Accepted if CR < 0.1. A 2 x 2 matrix always has CR = 0.
- **Ranking 1, AHP weighted sum:** total = sum of weight x score, scores 1-9 (9 = best).
  The gap between two providers is split into the contribution of each criterion
  (weight x score difference); these parts add up exactly to the total gap.
- **Ranking 2, TOPSIS** (cross-check) [CITATION NEEDED: Hwang and Yoon 1981]: vector normalisation, weighting,
  distance to the ideal and the anti-ideal provider, closeness = distance to anti-ideal / (sum of both distances).
  A different order from Ranking 1 is reported as a finding.
- **C1.1 score** (decision by Eva, 2026-11-20): min-max from the 5-year base-case total cost of the cost engine
  (cheapest = 9, most expensive = 1), not EUR per GB RAM-hour as first planned in Chat 2.
  Reason: compute is about 98% of the bill before support (AWS calculator check, notes/calculator_check.md), so both give the same order, and the Cost tab and the ranking then agree.
- The two presets describe hypothetical buyer types, not a real company.

## 2. Criteria and groups

Table 1. Criteria hierarchy (source: data/normalisation_demo.csv)

| Group | Criterion | Direction |
|---|---|---|
| C1 Cost and capacity | C1.1 Price of HANA-certified compute (scored from the 5-year base-case total cost) | lower cost is better |
| C1 Cost and capacity | C1.2 Certified scale-up range (largest certified single-node memory) | higher is better |
| C2 Availability and DR | C2.1 Availability (published VM SLA, multi-zone) | higher is better |
| C2 Availability and DR | C2.2 HANA backup and DR (checklist) | higher is better |
| C3 Residency and compliance | C3.1 EU regions with HANA-certified instances | higher is better |
| C3 Residency and compliance | C3.2 Compliance attestations (checklist) | higher is better |
| C4 SAP tooling | C4.1 SAP deployment and operations tooling (checklist) | higher is better |

## 3. Cost-sensitive preset

Table 2. Group matrix, cost-sensitive (source: data/pairwise.csv). Read: the row is X times as important as the column.

| | C1 | C2 | C3 | C4 | Weight |
|---|---|---|---|---|---|
| C1 Cost and capacity | 1 | 3 | 5 | 5 | 0.572 |
| C2 Availability and DR | 1/3 | 1 | 2 | 2 | 0.209 |
| C3 Residency and compliance | 1/5 | 1/2 | 1 | 1 | 0.109 |
| C4 SAP tooling | 1/5 | 1/2 | 1 | 1 | 0.109 |

lambda max = 4.004, CI = 0.0014, RI = 0.90, **CR = 0.002 (< 0.1, consistent)**.

Table 3. Matrices inside the groups, cost-sensitive (source: data/pairwise.csv)

| Group | Judgment | Local weights | CR |
|---|---|---|---|
| C1 | C1.1 vs C1.2 = 5 | C1.1 0.833, C1.2 0.167 | 0 |
| C2 | C2.1 vs C2.2 = 1 | C2.1 0.500, C2.2 0.500 | 0 |
| C3 | C3.1 vs C3.2 = 1 | C3.1 0.500, C3.2 0.500 | 0 |
| C4 | (one criterion) | C4.1 1.000 | - |

## 4. Compliance-sensitive preset

Table 4. Group matrix, compliance-sensitive (source: data/pairwise.csv)

| | C1 | C2 | C3 | C4 | Weight |
|---|---|---|---|---|---|
| C1 Cost and capacity | 1 | 1/2 | 1/5 | 1 | 0.107 |
| C2 Availability and DR | 2 | 1 | 1/3 | 3 | 0.230 |
| C3 Residency and compliance | 5 | 3 | 1 | 5 | 0.565 |
| C4 SAP tooling | 1 | 1/3 | 1/5 | 1 | 0.098 |

lambda max = 4.034, CI = 0.0114, RI = 0.90, **CR = 0.013 (< 0.1, consistent)**.

Table 5. Matrices inside the groups, compliance-sensitive (source: data/pairwise.csv)

| Group | Judgment | Local weights | CR |
|---|---|---|---|
| C1 | C1.1 vs C1.2 = 3 | C1.1 0.750, C1.2 0.250 | 0 |
| C2 | C2.1 vs C2.2 = 1/2 | C2.1 0.333, C2.2 0.667 | 0 |
| C3 | C3.1 vs C3.2 = 1/2 | C3.1 0.333, C3.2 0.667 | 0 |
| C4 | (one criterion) | C4.1 1.000 | - |

The reason for every judgment is in the `reason` column of data/pairwise.csv.

## 5. Final weights

Table 6. Final weights = group weight x local weight (source: tab 3 of the page, data/pairwise.csv; checked in tests.html and separately with Python/numpy)

| Criterion | Cost-sensitive | Compliance-sensitive |
|---|---|---|
| C1.1 | 0.477 | 0.081 |
| C1.2 | 0.095 | 0.027 |
| C2.1 | 0.105 | 0.077 |
| C2.2 | 0.105 | 0.153 |
| C3.1 | 0.055 | 0.188 |
| C3.2 | 0.055 | 0.377 |
| C4.1 | 0.109 | 0.098 |
| **Sum** | 1.000 | 1.000 (0.001 rounding) |

## 6. Rankings (DEMO, reference profile)

Inputs: reference profile (notes/reference_profile.md): 900 GB memory, 600 GB data, 10% growth, 500 GB/month egress,
5 years, EU Frankfurt, list price. C1.1 scores from the 5-year base-case totals
(Google Cloud 322,376 EUR = 9.0; Microsoft Azure 367,213 EUR = 4.8; AWS 407,784 EUR = 1.0).
All other scores: data/criteria_demo.csv (**DEMO - invented**).

Table 7. Cost-sensitive preset: both rankings (source: tab 3 of the page, 2026-11-20; DEMO scores)

| Provider | AHP total | AHP rank | TOPSIS closeness | TOPSIS rank |
|---|---|---|---|---|
| Google Cloud | 7.69 | 1 | 0.915 | 1 |
| Microsoft Azure | 6.46 | 2 | 0.479 | 2 |
| AWS | 4.49 | 3 | 0.054 | 3 |

Same order in both methods.

Table 8. Cost-sensitive preset: contribution of each criterion to the gap (AHP weighted sum; DEMO scores)

| Comparison | Total gap | C1.1 | C1.2 | C2.1 | C2.2 | C3.1 | C3.2 | C4.1 |
|---|---|---|---|---|---|---|---|---|
| Google Cloud vs Microsoft Azure | 1.226 | 2.003 | -0.286 | 0.000 | 0.000 | -0.164 | -0.109 | -0.219 |
| Google Cloud vs AWS | 3.198 | 3.816 | -0.191 | -0.105 | -0.105 | -0.055 | -0.055 | -0.109 |

Table 9. Compliance-sensitive preset: both rankings (source: tab 3 of the page, 2026-11-20; DEMO scores)

| Provider | AHP total | AHP rank | TOPSIS closeness | TOPSIS rank |
|---|---|---|---|---|
| Microsoft Azure | 7.62 | 1 | 0.710 | 1 |
| AWS | 6.66 | 2 | 0.331 | 3 |
| Google Cloud | 6.36 | 3 | 0.432 | 2 |

**Different order in places 2 and 3** (AHP: AWS before Google Cloud; TOPSIS: Google Cloud before AWS).
On demo data this only shows that the cross-check works. A possible reason: TOPSIS measures distance to the
worst value, and AWS has the worst C1.1 score (1.0), which pulls it towards the anti-ideal even with a small
C1.1 weight. [TODO: re-check with real scores; if the disagreement remains, report it as a finding.]

Table 10. Compliance-sensitive preset: contribution of each criterion to the gap (AHP weighted sum; DEMO scores)

| Comparison | Total gap | C1.1 | C1.2 | C2.1 | C2.2 | C3.1 | C3.2 | C4.1 |
|---|---|---|---|---|---|---|---|---|
| Microsoft Azure vs AWS | 0.955 | 0.306 | 0.027 | -0.077 | -0.153 | 0.377 | 0.377 | 0.098 |
| Microsoft Azure vs Google Cloud | 1.257 | -0.338 | 0.081 | 0.000 | 0.000 | 0.565 | 0.754 | 0.196 |

## 7. Open items

- [TODO: replace data/criteria_demo.csv and data/normalisation_demo.csv with real files, then update Tables 7-10.]
- [CITATION NEEDED: Saaty scale and AHP; random index values; TOPSIS (Hwang and Yoon 1981).]
- [CITATION NEEDED: AHP "ratings" mode, where alternatives are scored on a scale instead of compared pairwise.]
- [TODO: Sensitivity tab (switch-points) with real scores; on demo data, cost preset: C1.1 switch-point at 26.2%
  (Microsoft Azure below, Google Cloud above).]
