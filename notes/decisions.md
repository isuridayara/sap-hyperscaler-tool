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
- Decision (Dayara, 2026-11-01): the total leaves out NA parts, and the page names them. All three one-off rows are NA
  (no public list price for migration or setup services).
- Decision (Dayara, 2026-11-04): support given as a percentage of the bill uses the first tier only, with the monthly minimum
  (AWS 9%, min 25.94 EUR; Google Cloud 10%, min 90.24 EUR). Azure support is a flat 89.34 EUR per month.
- Known limitations: SAP and OS licences not included; extra IOPS/throughput not included; free egress allowances not
  deducted; snapshots modelled as one full copy although they are incremental; first-tier support overstates support
  above 10,000 USD per month.

## Real data and reference profile (Chat 4, 2026-11-18 to 2026-11-20)

- Decision (Dayara, 2026-11-18): the red DEMO notice is shown only on the tabs that still use demo files
  (Criteria matrix, Weighted result, Sensitivity: data/normalisation_demo.csv, data/criteria_demo.csv). The top
  banner appears only if a demo prices file is loaded. The Cost tab runs on data/prices.csv without a banner.
- Decision (Dayara, 2026-11-19): reference profile confirmed (notes/reference_profile.md): 600 GB HANA data, 900 GB
  memory (1,024 GiB step), 10% growth per year, 500 GB egress per month, 5 years, EU Frankfurt, list price.
  Changed by Dayara on 2026-11-26: memory 1,200 GB (2 x data, SAP sizing rule), which gives the 2,048 GiB step.
  The form on the page opens with these values. All values are assumptions [CITATION NEEDED].
- Decision (Dayara, 2026-11-19): at list price the high case cannot go above the list price, so high differs from base
  only by faster data growth. This is kept and explained on the page; no price-increase assumption is added.
- Calculator check (2026-11-20, notes/calculator_check.md): AWS Pricing Calculator vs engine for the reference
  profile, Year 1 base, one month: compute, storage and network identical; snapshots +16.20 USD in the calculator
  (full first copy plus half-month change); total without support +0.23%.

## Weights and ranking (Chat 5, 2026-11-20)

- Decision (Dayara, 2026-11-20): AHP in two levels: four groups (C1 Cost and capacity, C2 Availability and DR,
  C3 Residency and compliance, C4 SAP tooling), then the sub-criteria inside each group.
  Final weight = group weight x local weight. 9 judgments per preset instead of 21.
- Decision (Dayara, 2026-11-20): pairwise judgments for the cost-sensitive (CR 0.002) and compliance-sensitive
  (CR 0.013) presets, with a reason for each, in data/pairwise.csv. Results in notes/mcda_results.md.
- Decision (Dayara, 2026-11-20): C1.1 is scored from the 5-year base-case total cost (min-max, cheapest = 9),
  not from EUR per GB RAM-hour. Compute is about 98% of the bill before support (notes/calculator_check.md), and
  the order is the same (Google Cloud, Microsoft Azure, AWS).
- The demo criteria files now use the seven criteria C1.1 to C4.1; their scores (except C1.1) are invented,
  so tabs 2-4 keep the red DEMO notice and the rankings are not findings yet.
- TOPSIS is the cross-check. If its order differs from the AHP weighted sum, the page writes "FINDING".
- tests.html added: 47 automatic checks of AHP, weighted sum, TOPSIS and both presets.

## Chat 6 (2026-11-23 to 2026-11-26): validation and switch-points

- Vector 1: the calculator check was repeated for Microsoft Azure (AWS was done in Chat 4). Entered by Claude in
  the public Azure Pricing Calculator on 2026-11-26 at Dayara's request; screenshots kept in the project files.
  Result: -0.13% (free 100 GB egress is the only difference). Details: notes/validation.md, section 1.
- Vector 2: three documented cases (VHV/AWS, Arvato/Azure, Deutsche Börse/Google Cloud). No source gives the
  database size, so each case is run with the reference profile plus the values the source gives
  (agreed by Dayara on 2026-11-26). Extraction: notes/validation_cases.md.
- Defect found with the Arvato case and fixed: if a provider has no compute price (no certified machine large
  enough), its cost score is now NA (App.comparableTotal in js/app.js). Before, the score was calculated from a
  total without compute and gave a wrong ranking.
- Vector 3: practitioner walkthrough with 8 questions; form in notes/practitioner_form.md.
- Sensitivity: tab 4 shows switch-points for all seven weights and for the main cost drivers. Cost drivers
  include a discount given by ONE provider only, because the cost score compares providers with each other and an
  equal discount for all hardly changes the order. Ranges tested: discounts 0-60%, memory 256-4,096 GB,
  growth 0-50%, traffic 0-20,000 GB per month, 1-10 years.
- tests.html: 10 new checks for js/sensitivity.js (57 in total).
- All switch-points and case results are provisional while six criteria use DEMO scores.

## Chat 2 completed (2026-11-26): real criteria data

- Files: data/normalisation.csv (what each criterion measures, scoring rule, checklist items, where to look) and
  data/criteria.csv (one row per provider and criterion C1.2-C4.1: raw value, score, source_url, date_captured,
  confidence, quote). They keep the roles of the demo files, so js/app.js changed only a little. The demo files stay
  in the repository as fallback: if a real file cannot be loaded, the page uses the demo file and shows the DEMO notice.
- Decision (Dayara, 2026-11-26): scoring rules. C1.2 and C3.1: score = 1 + 8 x value / best value. C2.1: compares allowed
  downtime, score = 1 + 8 x (100 - best SLA) / (100 - SLA). Checklists C2.2 (2 items), C3.2 (4 items), C4.1 (3 items):
  score = 1 + 8 x items met / items; an item counts only if a public source shows it. C1.1 unchanged (min-max from cost).
- Rules for C3.1 (Claude, written in the notes column): "EU" = EU member states; regions closed to normal customers
  are not counted (Azure France South, Germany North, Sweden South); the AWS European Sovereign Cloud is not counted
  (separate partition with its own accounts). Counted at family/series level from the providers' region pages; for
  Azure from the public Retail Prices API.
- Azure SLA (C2.1) read from the SLA document Dayara downloaded (Microsoft Online Services, November 17 2026): 99.99%.
- AWS SOC 2 Type 2: wording found in the AWS Security Blog (2023-11-29); the current SOC page shows the 12-month reports.
- Result: four of six non-cost criteria tie (all 9). Google Cloud scores at least as high as the others on every
  criterion for the reference profile, so both presets recommend Google Cloud, AHP and TOPSIS agree, and no weight
  has a switch-point. Cost drivers still change the result (memory size, provider-specific discount, traffic).
  Details: notes/mcda_results.md section 6, notes/validation.md sections 2 and 4.
- js/sensitivity.js: a tie at the top is no longer reported as a switch-point (Sens.TIE).
- tests.html: 80 checks (2 for ties, 21 that recalculate every score in data/criteria.csv from its raw value).

- Decision (Dayara, 2026-11-26): memory rule changed from 1.5 x data to 2 x data. No source was found for 1.5x;
  SAP Learning ("Performing SAP HANA Sizing") says total RAM = static data RAM x 2. Reference profile memory is now
  1,200 GB, so the engine picks the 2,048 GiB machines (AWS-C3, AZ-C3, GC-C3). Form default changed in index.html.
  The order stays Google Cloud > Azure > AWS. The traffic switch-point disappears (none up to 20,000 GB/month).
  The calculator checks (AWS, Azure, Google Cloud) were done at the 1,024 GiB step and stay valid as a check of
  the engine's arithmetic and prices; they were not repeated for 2,048 GiB.
