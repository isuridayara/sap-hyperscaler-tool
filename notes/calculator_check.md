# Calculator check: our cost engine compared with AWS

Status: Chat 4, 2026-11-20. Part A (price list) and Part B (AWS Pricing Calculator) done.
Purpose: check that the cost engine (js/cost.js) gives the same result as the vendor's own tools when the same
workload is entered. Provider checked: AWS (one provider only, as planned).

## 1. Workload entered (reference profile, Year 1, base case, one month)

Taken from notes/reference_profile.md as it was on 2026-11-20 (memory changed to 1,200 GB / 2,048 GiB on 2026-11-26;
this check was not repeated, it tests prices and arithmetic): 600 GB HANA data, 900 GB memory -> 1,024 GiB step, 500 GB outbound
traffic per month, EU Frankfurt (eu-central-1), list price, on-demand, Linux.

| Part | What is entered | Price row in data/prices.csv |
|---|---|---|
| Compute | 1 x x2idn.16xlarge, Linux, on-demand, 730 hours per month | AWS-C2 |
| Storage | EBS gp3, 600 GB (default 3,000 IOPS, 125 MB/s) | AWS-S1 |
| Backup | EBS snapshots, 600 GB stored (one full copy, as the engine assumes) | AWS-B1 |
| Network | Data transfer out to the internet, 500 GB per month | AWS-N1 |
| Support | Business Support+, 9% of the monthly bill, minimum 29 USD | AWS-M1 |
| One-off | not entered (NA, no public price) | AWS-O1 |

## 2. Our engine, one month (USD before conversion)

The engine works in EUR. To compare with AWS tools, which show USD, the same parts are shown in USD here
(EUR = USD / 1.1179, ECB rate of 2026-11-03, as in data/prices.csv).

| Part | Calculation | USD per month | EUR per month |
|---|---|---|---|
| Compute | 9.337 x 730 h | 6,816.01 | 6,097.15 |
| Storage | 0.0952 x 600 GB | 57.12 | 51.10 |
| Backup | 0.054 x 600 GB | 32.40 | 28.98 |
| Network | 0.09 x 500 GB | 45.00 | 40.25 |
| Support | 9% x 6,950.53 | 625.55 | 559.58 |
| **Total** | | **7,576.08** | **6,777.07** |

Check against the page: Year 1 base for AWS = 81,325 EUR = 6,777.08 EUR per month (difference is rounding).

## 3. Part A: AWS official price list (done 2026-11-20)

Source: AWS Price List bulk files, https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/eu-central-1/index.csv
(publication date 2026-11-20T03:48:50Z) and .../AWSDataTransfer/current/eu-central-1/index.csv. Read by Claude on 2026-11-20.

| Item | Price list 2026-11-20 | data/prices.csv (captured 2026-11-04) | Same? |
|---|---|---|---|
| x2idn.16xlarge, Linux, on-demand | 9.337 USD per hour | 9.337 USD per hour (AWS-C2 notes) | yes |
| EBS gp3 storage | 0.0952 USD per GB-month | 0.0952 USD (AWS-S1 notes) | yes |
| EBS snapshot storage | 0.054 USD per GB-month | 0.054 USD (AWS-B1 notes) | yes |
| Data transfer out, first 10 TB | 0.09 USD per GB, "beyond the global free tier" | 0.09 USD (AWS-N1 notes) | yes |

Result: every AWS unit price used by the engine is unchanged 16 days after capture. The engine's input prices
are therefore correct for AWS. This checks the prices, not the way a calculator adds them up (Part B).

## 4. Part B: AWS Pricing Calculator (done 2026-11-20)

Entered by Eva on 2026-11-20 at https://calculator.aws/ (estimate "Reference profile Chat 4", Europe (Frankfurt)).
Saved estimate: https://calculator.aws/#/estimate?id=6b3e3ab2ed8757ada464a11ce4cd04fe930217b6
Values below are read from the calculator's own "Show calculations" boxes (screenshots kept by Eva).
[TODO: export the estimate as PDF and keep it with the evidence files.]

Entries: Shared tenancy, Linux, constant usage, 1 x x2idn.16xlarge, On-Demand, 100% usage; EBS gp3 600 GB,
3,000 IOPS, 125 MB/s; snapshots monthly, 600 GB changed per snapshot; data transfer out to the internet 500 GB per month.

| Part | Calculator (USD/month) | Engine (USD/month) | Difference (calculator - engine) |
|---|---|---|---|
| Compute | 9.337 x 730 h = 6,816.01 | 6,816.01 | 0.00 |
| Storage | 600 GB x 0.0952 = 57.12 | 57.12 | 0.00 |
| Backup | 32.40 initial + 16.20 incremental = 48.60 | 32.40 | +16.20 |
| Network | 500 GB x 0.09 = 45.00 | 45.00 | 0.00 |
| Support | not entered | 625.55 | see 5.4 |
| **Total without support** | **6,966.73** | **6,950.53** | **+16.20 (+0.23%)** |
| Same in EUR (/ 1.1179) | 6,231.98 | 6,217.49 | +14.49 |
| Same for 12 months, EUR | 74,783.76 | 74,609.86 | +173.90 |

Entry errors that were found and removed from the comparison (they are not differences in method):
- an extra, almost empty EC2 row (2.04 USD per month) created by accident when the estimate was started;
- 500 GB per month of intra-region traffic (10.00 USD) typed into the wrong field. The reference profile has no
  intra-region traffic.
With both, the calculator summary showed 6,978.77 USD per month (83,745.24 USD for 12 months) = 6,966.73 + 2.04 + 10.00.
[TODO: Eva to delete the extra row and the intra-region amount in the saved estimate, then re-save the link.]

## 5. Reasons for the differences

1. **Compute, storage and network: no difference.** The calculator uses the same unit prices and the same
   730 hours per month as the engine. The calculator does not deduct the 100 GB free internet egress either
   (500 GB x 0.09 = 45.00 USD), so the engine's choice (AWS-N1 notes) matches the vendor tool.
2. **Backup: +16.20 USD per month (calculator higher).** The calculator counts a first full snapshot
   (600 GB x 0.054 = 32.40 USD) plus the data changed during the month at half the monthly price
   ("discount for partial storage month", 32.40 x 50% = 16.20 USD). The engine counts one full copy only
   (32.40 USD). With 0 GB changed, the calculator shows 0.00 USD for snapshots, so the result depends strongly on
   the assumed change rate, which the reference profile does not define. The engine's one-copy rule is in between.
3. **Currency.** The calculator shows USD only. The EUR values above use the same ECB rate as data/prices.csv
   (1.1179 USD per EUR, 2026-11-03), so currency causes no difference here. Small gaps (below 1 EUR per year)
   come from rounding the EUR prices in data/prices.csv to four decimals.
4. **Support: not compared.** Support is added in the calculator with a separate "Add support" step, which was not
   used. The engine adds 9% of the running costs (625.55 USD per month, AWS-M1). Because the monthly bill is below
   10,000 USD, the engine's first-tier rule equals AWS's published tiered rule here (see AWS-M1 notes).
   [TODO: optional, add Business Support in the calculator and record its value.]
5. **One-off.** Neither tool has a price for migration or setup services (AWS-O1 is NA).
6. **Not in either.** SAP and operating-system licences, staff costs.

## 6. Result

For the same workload, the AWS Pricing Calculator and the cost engine agree on compute, storage and network to
the cent. The only method difference is the snapshot model, which makes the calculator 0.23% higher
(16.20 USD per month without support). Compute is 98% of the compared cost, so the engine's AWS result for the
reference profile is confirmed by the vendor's own tool, with backup as the one part that depends on an
assumption (change rate) that the engine simplifies.

## Text for the thesis (validation section, draft)

To check the cost engine, the reference profile (Year 1, base case) was entered into the public AWS Pricing
Calculator on 2026-11-20 [CITATION NEEDED: AWS Pricing Calculator estimate link and access date]. The calculator
gave 6,966.73 USD per month for compute, storage, snapshots and data transfer, against 6,950.53 USD from the
engine (+0.23%). Compute, storage and data transfer matched exactly; the difference came only from snapshots,
which the calculator models as a full first copy plus monthly changes, while the engine assumes one full copy.
Support was not part of the calculator entry. The check covers one provider only (AWS); Azure and Google Cloud
were not checked against their calculators [TODO: state as a limitation].
