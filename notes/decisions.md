# Decisions log

Decisions and rules for the S/4HANA hyperscaler decision-support prototype. Newest chat at the bottom.

## Price snapshot (Chat 3, 2026-11-04 to 2026-11-12)

- File: data/prices.csv, 27 rows (9 per provider: compute C1-C4, storage, backup, network, support, one-off).
- Capture dates: AWS 2026-11-04 (ECB rate 1.1179 USD per EUR, published 2026-11-03);
  Microsoft Azure 2026-11-10 (ECB 1.1193, published 2026-11-09);
  Google Cloud 2026-11-12 (ECB 1.1081, published 2026-11-12). The AWS and Azure one-off rows were checked on 2026-11-12.
- SAP HANA hardware directory checked: AWS 2026-11-04, Azure as of 2026-11-05, Google Cloud 2026-11-12 (PDF exports kept as evidence).
- Rules: region EU Frankfurt for all providers; public list price, on-demand, OS-licence-free Linux; EUR = USD / ECB rate
  (latest rate published on or before the capture date); compute = smallest "OLTP single node" machine in the SAP
  directory with at least 512 / 1,024 / 2,048 / 4,096 GiB, cheapest in Frankfurt if several (then newest generation).
- Decision (Eva, 2026-11-01): the total leaves out NA parts, and the page names them. All three one-off rows are NA
  (no public list price for migration or setup services).
- Decision (Eva, 2026-11-04): support given as a percentage of the bill uses the first tier only, with the monthly minimum
  (AWS 9%, min 25.94 EUR; Google Cloud 10%, min 90.24 EUR). Azure support is a flat 89.34 EUR per month.
- Known limitations: SAP and OS licences not included; extra IOPS/throughput not included; free egress allowances not
  deducted; snapshots modelled as one full copy although they are incremental; first-tier support overstates support
  above 10,000 USD per month.

## Real data and reference profile (Chat 4, 2026-11-18 to 2026-11-20)

- Decision (Eva, 2026-11-18): the red DEMO notice is shown only on the tabs that still use demo files
  (Criteria matrix, Weighted result, Sensitivity: data/normalisation_demo.csv, data/criteria_demo.csv). The top
  banner appears only if a demo prices file is loaded. The Cost tab runs on data/prices.csv without a banner.
- Decision (Eva, 2026-11-19): reference profile confirmed (notes/reference_profile.md): 600 GB HANA data, 900 GB
  memory (1,024 GiB step), 10% growth per year, 500 GB egress per month, 5 years, EU Frankfurt, list price.
  The form on the page opens with these values. All values are assumptions [CITATION NEEDED].
- Decision (Eva, 2026-11-19): at list price the high case cannot go above the list price, so high differs from base
  only by faster data growth. This is kept and explained on the page; no price-increase assumption is added.
- Calculator check (2026-11-20, notes/calculator_check.md): AWS Pricing Calculator vs engine for the reference
  profile, Year 1 base, one month: compute, storage and network identical; snapshots +16.20 USD in the calculator
  (full first copy plus half-month change); total without support +0.23%.

## Weights and ranking (Chat 5, 2026-11-20)

- Decision (Eva, 2026-11-20): AHP in two levels: four groups (C1 Cost and capacity, C2 Availability and DR,
  C3 Residency and compliance, C4 SAP tooling), then the sub-criteria inside each group.
  Final weight = group weight x local weight. 9 judgments per preset instead of 21.
- Decision (Eva, 2026-11-20): pairwise judgments for the cost-sensitive (CR 0.002) and compliance-sensitive
  (CR 0.013) presets, with a reason for each, in data/pairwise.csv. Results in notes/mcda_results.md.
- Decision (Eva, 2026-11-20): C1.1 is scored from the 5-year base-case total cost (min-max, cheapest = 9),
  not from EUR per GB RAM-hour. Compute is about 98% of the bill before support (notes/calculator_check.md), and
  the order is the same (Google Cloud, Microsoft Azure, AWS).
- The demo criteria files now use the seven criteria C1.1 to C4.1; their scores (except C1.1) are invented,
  so tabs 2-4 keep the red DEMO notice and the rankings are not findings yet.
- TOPSIS is the cross-check. If its order differs from the AHP weighted sum, the page writes "FINDING".
- tests.html added: 47 automatic checks of AHP, weighted sum, TOPSIS and both presets.
