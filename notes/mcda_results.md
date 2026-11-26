# MCDA results: AHP weights and rankings (Chat 5)

Date: 2026-11-20. Code: js/mcda.js, js/app.js. Judgments: data/pairwise.csv. Checks: tests.html (47 of 47 PASS).

> **Status (Chat 2, 2026-11-26): real data.** All seven criteria now use real evidence: C1.1 from data/prices.csv,
> C1.2 to C4.1 from data/criteria.csv (source link, date and quote per value) with the scoring rules in
> data/normalisation.csv. The rankings in section 6 replace the demo rankings of Chat 5.

## 1. Method

- **AHP** (Analytic Hierarchy Process) with Saaty's 1-9 scale [CITATION NEEDED: Saaty 1980 / 2008].
  Two levels (decision by Dayara, 2026-11-20): four groups C1 to C4, then the sub-criteria inside each group.
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
- **C1.1 score** (decision by Dayara, 2026-11-20): min-max from the 5-year base-case total cost of the cost engine
  (cheapest = 9, most expensive = 1), not EUR per GB RAM-hour as first planned in Chat 2.
  Reason: compute is about 98% of the bill before support (AWS calculator check, notes/calculator_check.md), so both give the same order, and the Cost tab and the ranking then agree.
- The two presets describe hypothetical buyer types, not a real company.

## 2. Criteria and groups

Table 1. Criteria hierarchy (source: data/normalisation.csv)

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

## 6. Rankings (real data, reference profile)

Inputs: reference profile (notes/reference_profile.md): 1,200 GB memory (2 x data, changed 2026-11-26), 600 GB data, 10% growth, 500 GB/month egress,
5 years, EU Frankfurt, list price. C1.1 scores from the 5-year base-case totals
(Google Cloud 634,505 EUR = 9.0; Microsoft Azure 721,139 EUR = 4.97; AWS 806,535 EUR = 1.0).
C1.2 to C4.1: data/criteria.csv, scored with the rules in data/normalisation.csv (decision Dayara, 2026-11-26).
Run on 2026-11-26 (local copy of the Chat 2 page; tests.html 80 of 80 PASS).

Table 7. Criteria scores (source: data/criteria.csv, data/prices.csv)

| Criterion | Raw value AWS / Azure / Google Cloud | AWS | Microsoft Azure | Google Cloud |
|---|---|---|---|---|
| C1.1 5-year base cost | 806,535 / 721,139 / 634,505 EUR | 1.00 | 4.97 | 9.00 |
| C1.2 largest certified memory | 32 / 29.69 / 32 TiB | 9.00 | 8.42 | 9.00 |
| C2.1 multi-zone VM SLA | 99.99 / 99.99 / 99.99 % | 9.00 | 9.00 | 9.00 |
| C2.2 backup and DR | 2 / 2 / 2 of 2 | 9.00 | 9.00 | 9.00 |
| C3.1 EU regions with certified instances | 6 / 11 / 11 | 5.36 | 9.00 | 9.00 |
| C3.2 attestations | 4 / 4 / 4 of 4 | 9.00 | 9.00 | 9.00 |
| C4.1 SAP tooling | 3 / 3 / 3 of 3 | 9.00 | 9.00 | 9.00 |

Four of the six non-cost criteria do not separate the providers (all score 9). Only cost (C1.1), EU regions (C3.1)
and, slightly, scale-up range (C1.2) differ. Google Cloud scores at least as high as both others on every criterion
for this profile, so it ranks first for **any** set of weights (it "dominates" here).

Table 8. Cost-sensitive preset: both rankings (source: tab 3 of the page, 2026-11-26)

| Provider | AHP total | AHP rank | TOPSIS closeness | TOPSIS rank |
|---|---|---|---|---|
| Google Cloud | 9.00 | 1 | 1.000 | 1 |
| Microsoft Azure | 7.02 | 2 | 0.497 | 2 |
| AWS | 4.98 | 3 | 0.010 | 3 |

Same order in both methods.

Table 9. Cost-sensitive preset: contribution of each criterion to the gap (AHP weighted sum)

| Comparison | Total gap | C1.1 | C1.2 | C2.1 | C2.2 | C3.1 | C3.2 | C4.1 |
|---|---|---|---|---|---|---|---|---|
| Google Cloud vs Microsoft Azure | 1.977 | 1.922 | 0.055 | 0 | 0 | 0 | 0 | 0 |
| Google Cloud vs AWS | 4.015 | 3.816 | 0 | 0 | 0 | 0.199 | 0 | 0 |

Table 10. Compliance-sensitive preset: both rankings (source: tab 3 of the page, 2026-11-26)

| Provider | AHP total | AHP rank | TOPSIS closeness | TOPSIS rank |
|---|---|---|---|---|
| Google Cloud | 9.00 | 1 | 1.000 | 1 |
| Microsoft Azure | 8.66 | 2 | 0.651 | 2 |
| AWS | 7.67 | 3 | 0.013 | 3 |

Same order in both methods. The AHP/TOPSIS disagreement seen on demo data in Chat 5 does not appear with real data.

Table 11. Compliance-sensitive preset: contribution of each criterion to the gap (AHP weighted sum)

| Comparison | Total gap | C1.1 | C1.2 | C2.1 | C2.2 | C3.1 | C3.2 | C4.1 |
|---|---|---|---|---|---|---|---|---|
| Google Cloud vs Microsoft Azure | 0.340 | 0.324 | 0.016 | 0 | 0 | 0 | 0 | 0 |
| Google Cloud vs AWS | 1.330 | 0.644 | 0 | 0 | 0 | 0.686 | 0 | 0 |

What the rankings show:
1. With real data the compliance-sensitive buyer gets the same recommendation as the cost-sensitive buyer
   (Google Cloud), because the three providers do not differ on attestations, backup/DR, SLA or SAP tooling.
   The compliance preset mainly shrinks the gaps (Azure 0.34 behind instead of 1.98).
2. The gap to Azure comes almost only from cost; the gap to AWS from cost and the number of EU regions.
3. The result depends on the profile, not only on the weights: below about 768 GB memory, or with a provider-specific
   discount, another provider wins (notes/validation.md, Table 4.2). So the dominance holds for the reference
   profile only, which is consistent with H1.
4. The checklists use yes/no items at the level of "does the provider offer it". Finer differences (for example how
   many services are in audit scope, or how mature a tool is) are not measured. [TODO: name as a limitation.]

## 7. Open items

- [CITATION NEEDED: Saaty scale and AHP; random index values; TOPSIS (Hwang and Yoon 1981).]
- [CITATION NEEDED: AHP "ratings" mode, where alternatives are scored on a scale instead of compared pairwise.]
- [CITATION NEEDED: scoring a value relative to the best value (1 + 8 x value / best) as a normalisation method.]
