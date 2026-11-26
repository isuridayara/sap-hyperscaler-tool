# Validation of the prototype (Chat 6)

Status: Chat 6, 2026-11-23 to 2026-11-26. All three vectors and the switch-point tables are filled in; open items are marked [TODO].
Purpose: test the tool along three validation vectors: (1) correctness of the cost engine against a vendor
calculator, (2) documented migration cases, (3) a practitioner walkthrough. Section 4 adds the sensitivity
sweep and its switch-points.
Update Chat 2 (2026-11-26): all seven criteria now use real data (data/criteria.csv, data/normalisation.csv).
The case results (section 2) and switch-points (section 4) were re-run with the real scores; the demo results of
Chat 6 are replaced. Second update (2026-11-26): the reference profile memory is now 1,200 GB (2 x data, SAP
sizing rule) instead of 900 GB; sections 2 and 4 were re-run with it. The calculator checks in section 1 were done
at the old 1,024 GiB step; they check the engine's prices and arithmetic and were not repeated.

## 1. Vector 1: cost engine compared with a vendor calculator

The AWS check was done in Chat 4 (notes/calculator_check.md: +0.23% without support, only the snapshot model
differed). In Chat 6 the same check was repeated for a second provider, Microsoft Azure.

### 1.1 Workload entered (reference profile, Year 1, base case, one month)

Entered by Claude in the public Azure Pricing Calculator (https://azure.microsoft.com/en-us/pricing/calculator/)
on 2026-11-26, at Dayara's request, currency USD, not logged in (Microsoft Customer Agreement list prices).

| Calculator card | Settings entered | Price row in data/prices.csv |
|---|---|---|
| Virtual Machines | Germany West Central, Linux, Ubuntu (OS only), Standard tier, 1 x M64s v2 (64 vCPUs, 1,024 GB RAM), 730 hours, pay as you go, 0 managed disks | AZ-C2 |
| Managed Disks (1) | Germany West Central, Premium SSD v2, 1 disk x 600 GiB, 1 month (730 h), 3,000 IOPS, 125 MB/s | AZ-S1 |
| Managed Disks (2) | Germany West Central, Standard HDD, 0 disks, 0 transactions, snapshot LRS 600 GB | AZ-B1 |
| Bandwidth | Internet egress from Germany West Central, Microsoft Global Network routing, 500 GB per month | AZ-N1 |
| Support | Standard | AZ-M1 |

Not entered: migration services (AZ-O1 is NA), SAP and operating-system licences.
Evidence: five screenshots taken by Claude on 2026-11-26, kept in the project files under chat6/evidence/
(azure-calc_0_summary, _1_virtual-machine, _2_disk-premium-ssd-v2, _3_snapshot, _4_bandwidth-support-total).
[TODO: the estimate could not be saved as a link, because the calculator needs a Microsoft login for that.
Optional: Dayara logs in, rebuilds it with the settings above and saves the link.]

### 1.2 Calculator compared with the engine (USD per month)

| Part | Calculator shows | Engine | Difference (calculator - engine) |
|---|---|---|---|
| Compute | 9.042 USD/h x 730 h = 6,600.66 | 6,600.66 | 0.00 |
| Storage | 0.000130 USD per GiB-hour x 600 GiB x 730 h = 56.94 | 56.94 | 0.00 |
| Backup | 600 GB x 0.0500 = 30.00 | 30.00 | 0.00 |
| Network | 34.80 (first 100 GB free, 400 GB x 0.087) | 43.50 (500 GB x 0.087) | -8.70 |
| Support | 100.00 | 100.00 | 0.00 |
| **Total** | **6,822.40** | **6,831.10** | **-8.70 (-0.13%)** |
| Same in EUR (/ 1.1193) | 6,095.24 | 6,103.05 | -7.81 |
| Same for 12 months, EUR | 73,142.86 | 73,236.60 | -93.74 |

EUR values use the ECB rate of data/prices.csv for Azure (1.1193 USD per EUR, 2026-11-09).

### 1.3 Reasons for the differences

1. **Compute, storage, backup and support: no difference.** The calculator uses the same unit prices as
   data/prices.csv and the same 730 hours per month. Captured on 2026-11-09, the prices were unchanged on
   2026-11-26.
2. **Network: -8.70 USD per month (calculator lower).** The calculator deducts the first 100 GB of internet
   egress per month for free (its own note: "the first 100 GB/Month of Internet Egress data transfer are free").
   The engine charges all 500 GB (decision recorded in the AZ-N1 notes: free allowance not deducted).
   On AWS, the calculator did not deduct a free allowance, so the engine's rule matched AWS but not Azure.
3. **Snapshots: no difference on Azure.** The Azure calculator prices a snapshot simply as stored GB x price,
   which is exactly the engine's "one full copy" rule. On AWS, the calculator added the monthly change, which
   caused the only AWS difference (+16.20 USD).
4. **Currency.** Both sides were compared in USD, so the exchange rate causes no difference.
5. **Not in either tool:** migration/one-off costs, SAP and operating-system licences, staff costs.

### 1.4 Result of Vector 1 (both providers)

| Provider | Date | Calculator (USD/month) | Engine (USD/month) | Difference | Only cause |
|---|---|---|---|---|---|
| AWS (Chat 4, without support) | 2026-11-20 | 6,966.73 | 6,950.53 | +0.23% | snapshot change rate |
| Microsoft Azure (with support) | 2026-11-26 | 6,822.40 | 6,831.10 | -0.13% | free 100 GB egress |
| Google Cloud (with support) | 2026-11-26 | 5,931.48 | 5,931.48 | 0.00% | none (see 1.6) |

For all three providers the engine reproduces the vendor calculator within 0.25%. Compute, which is about 97% of
the monthly cost, matches to the cent for all three. The remaining differences come from two simplifications that
are documented in the price rows (free egress allowance not deducted; one full snapshot copy). Neither changes the
cost order of the providers.

### 1.6 Google Cloud check (Chat 2, 2026-11-26)

Entered by Claude in the public Google Cloud Pricing Calculator (https://cloud.google.com/products/calculator)
on 2026-11-26, at Dayara's request, currency USD, not signed in (list prices). Shareable estimate:
https://cloud.google.com/products/calculator/estimate-preview/CiQ0ZTkwZDRjNi1jYWUyLTQwZWUtOTNkNy05ZmEyMTkyMjFhZTcQAQ%3D%3D
Evidence: five screenshots in the project files under chat2b/evidence/ (gcp-calc_1_compute, _2_hyperdisk,
_3_snapshot, _4_network, _5_support).

| Calculator card | Settings entered | Price row | Calculator (USD/month) | Engine (USD/month) | Difference |
|---|---|---|---|---|---|
| Compute Engine | 1 x m3-ultramem-32 (Memory-optimized, M3; 32 vCPUs, 976 GiB), Frankfurt (europe-west3), free OS (Linux), Regular, 730 h, no committed use, boot disk 0 GiB | GC-C2 | 5,240.45 | 5,240.45 | 0.00 |
| Hyperdisk and Persistent Disk (1) | Hyperdisk, Frankfurt, Hyperdisk Balanced, 1 disk x 600 GiB, 3,000 IOPS, 140 MiB/s (included baseline) | GC-S1 | 56.40 | 56.40 | 0.00 |
| Hyperdisk and Persistent Disk (2) | Persistent Disk, Frankfurt, Snapshot Storage 600 GiB | GC-B1 | 35.40 | 35.40 | 0.00 |
| Networking | Data Transfer, Premium tier, 500 GiB internet egress, Frankfurt to Europe | GC-N1 | 60.00 | 60.00 | 0.00 |
| Support Services | Enhanced, based on the current estimate total | GC-M1 | 539.23 | 539.23 | 0.00 |
| **Total** | | | **5,931.48** | **5,931.48** | **0.00 (0.00%)** |
| Same in EUR (/ 1.1081) | | | 5,352.80 | 5,352.80 | 0.00 |

Why there is no difference on Google Cloud: the calculator prices snapshots as stored GiB x price (the engine's
"one full copy" rule), shows no free egress allowance for Premium Tier internet egress to Europe, and calculates
Enhanced support as 10% of the estimate (the engine's first-tier rule; the 100 USD minimum does not apply at this
size). Note: the calculator's region list for M3 machines contains Frankfurt; the default 10 GiB boot disk
(0.94 USD/month) was set to 0 because the engine has no boot disk.

### 1.5 Text for the thesis (draft)

To check the cost engine against a second vendor tool, the reference profile (Year 1, base case) was entered into
the public Azure Pricing Calculator on 2026-11-26 [CITATION NEEDED: Azure Pricing Calculator, access date].
The calculator gave 6,822.40 USD per month for compute, disk storage, snapshots, internet egress and Standard
support, against 6,831.10 USD from the engine (-0.13%). All parts matched exactly except internet egress, where
the calculator deducts a free allowance of 100 GB per month that the engine does not. Together with the AWS check
(+0.23%) and the Google Cloud check (0.00%, all five parts identical; Google Cloud Pricing Calculator, accessed
2026-11-26), this shows that the engine reproduces the calculators of all three providers within 0.25% for the
reference profile.

## 2. Vector 2: documented cases

Three publicly documented migrations of SAP to a hyperscaler, one per provider. Extraction sheet with all quotes and
links: notes/validation_cases.md. All extracted lines were checked against the source pages on 2026-11-26; small wording corrections are marked there.
A mismatch between the tool and the company's choice is a result, not a failure: it names a factor that the model
cannot see.

### 2.1 How each case was run

None of the sources states the HANA memory size, data volume or network traffic. Each case was therefore run with
the reference profile (notes/reference_profile.md: 600 GB data, 1,200 GB memory, 10% growth, 500 GB/month, 5 years,
EU Frankfurt, list price) and only the values given by the source were changed. The weight preset was chosen from
the reasons the source gives. Re-run on 2026-11-26 with the Chat 2 page and the real criteria scores.

| Case | Values changed from the reference profile | Preset |
|---|---|---|
| A VHV Group | none | Cost-sensitive (capital expenditure and cost savings are named; the page calls speed and innovation the main driver, but Google Cloud ranks first under any weights for this profile, so the preset does not change the result) |
| B Arvato | HANA memory 6,144 GB ("up to 6 TB" VMs) | Cost-sensitive and Compliance-sensitive |
| C Deutsche Börse | none | Compliance-sensitive (regulators, encryption, own keys are named); Cost-sensitive as a check |

### 2.2 Case table

Table 2.2: tool recommendation compared with the documented choice (source: page re-run on 2026-11-26 with real criteria data, notes/validation_cases.md).

| Case | Source type | Tool recommends | Company chose | Match | Factor outside the model |
|---|---|---|---|---|---|
| A VHV Group (insurance, Germany) | Vendor-published (AWS partner story) | Google Cloud (AWS ranked 3rd) | AWS | No | Existing relationship: AWS was already the "preferred server-workload cloud provider"; migration funding (AWS Migration Acceleration Program) through the partner; urgency from a hardware shortage. The switch-point table shows that a discount of 21.9% given only by AWS would make AWS the recommendation, a size that program funding or a negotiated deal could plausibly reach [CITATION NEEDED: typical size of migration funding]. |
| B Arvato (logistics, Bertelsmann) | Vendor-published (Microsoft) + partner-published (Arvato Systems) | No recommendation (NA): no machine in data/prices.csv is larger than 4 TiB, so compute is NA for all three providers | Microsoft Azure | Not testable | Model limit: the price data covers machines up to 4 TiB, the case uses VMs up to 6 TB. Outside the model as well: existing Microsoft ecosystem (Microsoft 365, Teams, Power BI), explicit choice of one platform "versus being multicloud", top-down decision. |
| C Deutsche Börse (exchange operator, Frankfurt) | Vendor-published (customer-written post on Google's blog) + independent media (The Stack 2024, CIO.de 2025) | Compliance-sensitive: Google Cloud (AHP and TOPSIS). Cost-sensitive: Google Cloud | Google Cloud | Yes (both presets) | The model reproduces the choice, but for its own reasons (lowest cost, most EU regions together with Azure); the sources name other reasons as well: strategic partnership with Google Cloud announced in 2023 and Google as "preferred cloud platform" (independent sources), and security features the criteria do not measure (encryption at three levels with customer-held keys). With demo data (Chat 6) the compliance preset had recommended Azure. |

### 2.3 What the cases show

1. **Commercial and organisational factors decide where the model disagrees.** In the one testable mismatch (A)
   the source names a prior relationship and migration funding with the chosen provider. Case C is now a match in
   both presets. This supports H2: the criteria model reproduces a choice that fits its cost and residency
   criteria (C), and the mismatch points to factors outside the model (relationship, funding).
2. **The switch-points make the outside factor measurable.** For VHV the tool can say how large an AWS-only
   discount would have to be (21.9%) to change the recommendation.
3. **A defect was found and fixed.** Before the fix, the Arvato run (6 TB) still produced a ranking, because the
   cost score was calculated from totals that left out compute (no machine large enough). Those totals were
   not comparable. Since Chat 6, a provider without a compute price gets cost score NA (App.comparableTotal in
   js/app.js), and the page shows "no recommendation" instead of a wrong one. Still NA with real data, because
   data/prices.csv stops at 4 TiB although all three providers have certified machines up to about 30-32 TiB (C1.2).
4. **Real data changed one case result.** With demo scores, case C (compliance preset) was a mismatch; with real
   scores it is a match. The demo scores had given Azure an invented lead on attestations and tooling.
5. **Limits of this vector.** All three sources are written by or with the vendor, except the two independent
   articles for case C; none states the database size, so the company profiles are partly the reference profile.
   Two of three testable runs recommend Google Cloud for every preset, because Google Cloud dominates the
   reference profile (notes/mcda_results.md, section 6).

## 3. Vector 3: practitioner walkthrough

Plan: 2-3 SAP or cloud practitioners click through the page and answer eight questions. Their answers and
objections are recorded verbatim on the form in notes/practitioner_form.md (one copy per person, coded P1-P3,
no names). [TODO: Dayara to recruit the practitioners and run the sessions; results go into table 3.2.]
[CITATION NEEDED: method reference for expert walkthrough / expert evaluation of a design artefact.]

### 3.1 Session outline (about 30-40 minutes)

1. Consent and background (role, years with SAP and cloud, hyperscalers used).
2. Five short tasks on the live page: explain the scope box, enter a profile and calculate, read the cost tab,
   switch weight presets, find a switch-point in tab 4. The observer notes whether each task is done without help.
3. Eight questions (below), four of them with a 1-5 agreement rating.
4. Free remarks.

### 3.2 Questions

| # | Question | What it validates | Rating (1-5) |
|---|---|---|---|
| Q1 | Are the cost parts (compute, storage, backup, network, support) the ones that drive the cost? What is missing that would change the order of the providers? | Cost model scope | no |
| Q2 | Are the seven criteria the ones you would use to compare providers? Which would you remove or add? | Criteria set (C1.1-C4.1) | "The criteria cover what matters." |
| Q3 | Do the two presets reflect how a cost-driven and a compliance-driven company would weigh the criteria? | AHP judgments | "The presets are realistic." |
| Q4 | The recommendation changes at about 7-20% extra discount from one provider. How large are negotiated discounts, migration funding or existing commitments compared with that? | Switch-points vs. real commercial factors | no |
| Q5 | When a customer you know chose a hyperscaler for SAP, which factors decided it? Which does the tool not show? | Factors outside the model (H2) | no |
| Q6 | Is the output understandable without explanation? What was hardest to read? | Usability of the outputs | "I understood the results without help." |
| Q7 | At which point in a real decision would the tool help, and who would use it? | Purpose (decision support, not a calculator) | "The tool would be useful for a first comparison." |
| Q8 | What single change would make you trust the result more? | Improvements | no |

### 3.3 Results

Table 3.3: practitioner answers (source: completed forms, notes/practitioner_form.md).

| Practitioner | Role | Q2 | Q3 | Q6 | Q7 | Main objection (verbatim) | Factor outside the model named |
|---|---|---|---|---|---|---|---|
| P1 | [TODO] | | | | | | |
| P2 | [TODO] | | | | | | |
| P3 | [TODO] | | | | | | |

## 4. Sensitivity sweep and switch-points

Implemented in js/sensitivity.js (Sens.allWeightSwitchPoints, Sens.driverSweep, Sens.driverSwitchPoints) and shown
in tab 4 of the page. A switch-point is the value at which another provider becomes the recommendation. One thing
is changed at a time; everything else stays as in the form. Weights: the weight of one criterion goes from 0% to
100% in steps of 1%, the other weights keep their proportions, and the exact switch-point is found by halving the
interval 30 times. Cost drivers: one input of the cost model is changed, costs and the cost score C1.1 are
recalculated, the weights stay the same. Checked in tests.html (group "Sensitivity", 10 checks, hand example:
switch-point at weight 0.4). Chat 2: a tie at the top (for example when a criterion on which all providers score 9 gets
100% of the weight) is not counted as a switch-point (Sens.TIE, 2 more checks).
All values: reference profile, re-run on 2026-11-26 with the real criteria scores.

### 4.1 Weights

Table 4.1: weight switch-points (source: page, tab 4, reference profile, real data).

| Criterion | Cost-sensitive: weight now | Switch-point | Compliance-sensitive: weight now | Switch-point |
|---|---|---|---|---|
| Current recommendation | Google Cloud | | Google Cloud | |
| C1.1 Certified compute price (5-year cost) | 47.7% | none (0-100%) | 8.1% | none (0-100%) |
| C1.2 Certified scale-up range | 9.5% | none | 2.7% | none |
| C2.1 Multi-zone SLA | 10.5% | none | 7.7% | none |
| C2.2 HANA backup and DR | 10.5% | none | 15.3% | none |
| C3.1 EU regions | 5.5% | none | 18.8% | none |
| C3.2 Compliance attestations | 5.5% | none | 37.7% | none |
| C4.1 SAP tooling | 10.9% | none | 9.8% | none |

No weight change can move Google Cloud from first place, because Google Cloud scores at least as high as both
other providers on every criterion for the reference profile. With 100% weight on C1.2, C2.1, C2.2, C3.1, C3.2 or
C4.1, Google Cloud ties with one or both others; a tie is not a switch.

### 4.2 Cost drivers

Table 4.2: cost-driver switch-points (source: page, tab 4, reference profile, real data).

| Cost driver | Value now | Range tested | Cost-sensitive: switch-point | Compliance-sensitive: switch-point |
|---|---|---|---|---|
| Extra discount given only by AWS | 0% | 0-60% | 21.9% (Google Cloud to AWS) | none |
| Extra discount given only by Microsoft Azure | 0% | 0-60% | 12.4% (Google Cloud to Azure) | 12.6% (Google Cloud to Azure) |
| Extra discount given only by Google Cloud | 0% | 0-60% | none (already first) | none (already first) |
| Same discount from all providers | 0% | 0-60% | none | none |
| SAP HANA memory size | 1,200 GB | 256-4,096 GB | between 512 and 768 GB (Azure below, Google Cloud above) | between 512 and 768 GB (Azure below, Google Cloud above) |
| Data growth per year | 10% | 0-50% | none | none |
| Outbound traffic per month | 500 GB | 0-20,000 GB | none | none |
| Evaluation period | 5 years | 1-10 | none | none |

### 4.3 What the switch-points show

1. **Weights do not change the recommendation for this profile; the profile and the price do.** Because the
   providers tie on four criteria and Google Cloud is cheapest and has the most EU regions (with Azure), no
   weighting makes another provider win. The recommendation changes only through cost drivers.
2. **A discount that all providers give hardly matters; a discount from one provider does.** An Azure-only
   discount of about 12.4% or an AWS-only discount of 21.9% changes the cost-sensitive recommendation. This links
   the model to the commercial factors found in Vector 2 (negotiated deals, migration funding).
3. **Machine size is a real driver.** Below about 768 GB of HANA memory, Azure is recommended instead of
   Google Cloud in both presets, because Google Cloud's certified 512 GiB machine is relatively expensive
   (see Chat 4). This supports H1: no provider is best for every profile.
4. **The compliance preset is no longer different from the cost preset.** With demo data it recommended Azure and
   was robust; with real data it recommends Google Cloud and reacts to the same cost drivers, except an AWS-only
   discount (AWS also has fewer EU regions).
5. **Growth, years and traffic (0-20,000 GB a month) do not change the recommendation** for this profile. With the
   old 900 GB profile Azure won above about 18.8 TB a month; with 2,048 GiB machines the compute gap is too large.

### 4.4 Text for the thesis (draft)

A one-at-a-time sensitivity analysis was run on the reference profile [Table 4.1, Table 4.2]. For this profile,
Google Cloud scores at least as high as the other providers on every criterion, so no change of a single weight
alters the recommendation in either preset. The recommendation does change with the company profile and with
provider-specific prices: below about 768 GB of HANA memory Microsoft Azure is recommended, and an extra discount
granted by a single provider of about 12.4% (Azure) or 21.9% (AWS, cost-sensitive preset only) changes the
recommendation. Traffic up to 20 TB per month does not. The ranking is therefore
driven by cost and profile rather than by the weighting of the qualitative criteria, which mostly do not
differentiate the three providers [Table 7 in notes/mcda_results.md].

## 5. Summary

| Vector | Result | Status |
|---|---|---|
| 1 Calculator | Engine within 0.25% of the AWS (+0.23%), Azure (-0.13%) and Google Cloud (0.00%) calculators; compute matches to the cent | Done |
| 2 Cases | 3 cases (AWS, Azure, Google Cloud), real data: 1 match (Deutsche Börse, both presets), 1 mismatch explained by relationship/funding (VHV), 1 not testable (6 TB above price data); one defect found and fixed | Done; sources checked 2026-11-26 |
| 3 Practitioners | Session outline, 8 questions, answer form | Questions ready; sessions [TODO] |
| Switch-points | Tables 4.1 and 4.2 (real data); shown in tab 4 | Done |
