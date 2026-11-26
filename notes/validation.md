# Validation of the prototype (Chat 6)

Status: Chat 6, 2026-11-23 to 2026-11-26. All three vectors and the switch-point tables are filled in; open items are marked [TODO].
Purpose: test the tool along three validation vectors: (1) correctness of the cost engine against a vendor
calculator, (2) documented migration cases, (3) a practitioner walkthrough. Section 4 adds the sensitivity
sweep and its switch-points.
Important: the criteria scores for six of the seven criteria are still DEMO values (data/criteria_demo.csv), so all
rankings, case results and switch-points below are provisional until real scores exist.

## 1. Vector 1: cost engine compared with a vendor calculator

The AWS check was done in Chat 4 (notes/calculator_check.md: +0.23% without support, only the snapshot model
differed). In Chat 6 the same check was repeated for a second provider, Microsoft Azure.

### 1.1 Workload entered (reference profile, Year 1, base case, one month)

Entered by Claude in the public Azure Pricing Calculator (https://azure.microsoft.com/en-us/pricing/calculator/)
on 2026-11-26, at Eva's request, currency USD, not logged in (Microsoft Customer Agreement list prices).

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
Optional: Eva logs in, rebuilds it with the settings above and saves the link.]

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

For both providers the engine reproduces the vendor calculator within 0.25%. Compute, which is about 97% of the
monthly cost, matches to the cent for both. The remaining differences come from two simplifications that are
documented in the price rows (free egress allowance not deducted; one full snapshot copy). Neither changes the
cost order of the providers. Google Cloud was not checked against its calculator [TODO: state as a limitation].

### 1.5 Text for the thesis (draft)

To check the cost engine against a second vendor tool, the reference profile (Year 1, base case) was entered into
the public Azure Pricing Calculator on 2026-11-26 [CITATION NEEDED: Azure Pricing Calculator, access date].
The calculator gave 6,822.40 USD per month for compute, disk storage, snapshots, internet egress and Standard
support, against 6,831.10 USD from the engine (-0.13%). All parts matched exactly except internet egress, where
the calculator deducts a free allowance of 100 GB per month that the engine does not. Together with the AWS check
(+0.23%), this shows that the engine reproduces vendor calculators within 0.25% for the reference profile.

## 2. Vector 2: documented cases

Three publicly documented migrations of SAP to a hyperscaler, one per provider. Extraction sheet with all quotes and
links: notes/validation_cases.md. [TODO: Eva to confirm each extracted line against the source.]
A mismatch between the tool and the company's choice is a result, not a failure: it names a factor that the model
cannot see.

### 2.1 How each case was run

None of the sources states the HANA memory size, data volume or network traffic. Each case was therefore run with
the reference profile (notes/reference_profile.md: 600 GB data, 900 GB memory, 10% growth, 500 GB/month, 5 years,
EU Frankfurt, list price) and only the values given by the source were changed. The weight preset was chosen from
the reasons the source gives. Run on 2026-11-26 with the Chat 6 page; six of seven criteria scores are DEMO values,
so the rankings are provisional.

| Case | Values changed from the reference profile | Preset |
|---|---|---|
| A VHV Group | none | Cost-sensitive (capital expenditure and cost savings are named) |
| B Arvato | HANA memory 6,144 GB ("up to 6 TB" VMs) | Cost-sensitive and Compliance-sensitive |
| C Deutsche Börse | none | Compliance-sensitive (regulators, encryption, own keys are named); Cost-sensitive as a check |

### 2.2 Case table

Table 2.2: tool recommendation compared with the documented choice (source: page run on 2026-11-26, notes/validation_cases.md).

| Case | Source type | Tool recommends | Company chose | Match | Factor outside the model |
|---|---|---|---|---|---|
| A VHV Group (insurance, Germany) | Vendor-published (AWS partner story) | Google Cloud (AWS ranked 3rd) | AWS | No | Existing relationship: AWS was already the "preferred server-workload cloud provider"; migration funding (AWS Migration Acceleration Program) through the partner; urgency from a hardware shortage. The switch-point table shows that a discount of 19.2% given only by AWS would make AWS the recommendation, a size that program funding or a negotiated deal could plausibly reach [CITATION NEEDED: typical size of migration funding]. |
| B Arvato (logistics, Bertelsmann) | Vendor-published (Microsoft) + partner-published (Arvato Systems) | No recommendation (NA): no machine in data/prices.csv is larger than 4 TiB, so compute is NA for all three providers | Microsoft Azure | Not testable | Model limit: the price data covers machines up to 4 TiB, the case uses VMs up to 6 TB. Outside the model as well: existing Microsoft ecosystem (Microsoft 365, Teams, Power BI), explicit choice of one platform "versus being multicloud", top-down decision. |
| C Deutsche Börse (exchange operator, Frankfurt) | Vendor-published (customer-written post on Google's blog) + independent media (The Stack 2024, CIO.de 2025) | Compliance-sensitive: Microsoft Azure (Google Cloud 3rd in AHP, 2nd in TOPSIS). Cost-sensitive: Google Cloud | Google Cloud | No (compliance preset); Yes (cost preset) | Strategic partnership with Google Cloud announced in 2023 and Google as "preferred cloud platform" (independent sources); security features the criteria do not measure (encryption at three levels with customer-held keys). In the compliance preset the cost weight would have to rise from 8.1% to 29.2% for Google Cloud to win. |

### 2.3 What the cases show

1. **Commercial and organisational factors decide where the model disagrees.** In both testable mismatches
   (A and C) the sources name a prior relationship or strategic partnership with the chosen provider. This
   supports H2: the criteria model can reproduce a choice when it is cost-driven (C with the cost preset), and
   the mismatches point to factors outside the model (relationship, funding, ecosystem).
2. **The switch-points make the outside factor measurable.** For VHV the tool can say how large an AWS-only
   discount would have to be (19.2%) to change the recommendation.
3. **A defect was found and fixed.** Before the fix, the Arvato run (6 TB) still produced a ranking, because the
   cost score was calculated from totals that left out compute (no machine large enough). Those totals were
   not comparable. Since Chat 6, a provider without a compute price gets cost score NA (App.comparableTotal in
   js/app.js), and the page shows "no recommendation" instead of a wrong one.
4. **Limits of this vector.** All three sources are written by or with the vendor, except the two independent
   articles for case C; none states the database size, so the company profiles are partly the reference profile;
   the criteria scores are still DEMO. The case results must be re-run when real scores exist.
   [TODO: re-run with real criteria scores.]

## 3. Vector 3: practitioner walkthrough

Plan: 2-3 SAP or cloud practitioners click through the page and answer eight questions. Their answers and
objections are recorded verbatim on the form in notes/practitioner_form.md (one copy per person, coded P1-P3,
no names). [TODO: Eva to recruit the practitioners and run the sessions; results go into table 3.2.]
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
switch-point at weight 0.4).
All values: reference profile, run on 2026-11-26. **Provisional: six of seven criteria scores are DEMO values.**

### 4.1 Weights

Table 4.1: weight switch-points (source: page, tab 4, reference profile).

| Criterion | Cost-sensitive: weight now | Switch-point | Winner then | Compliance-sensitive: weight now | Switch-point | Winner then |
|---|---|---|---|---|---|---|
| Current recommendation | | | Google Cloud | | | Microsoft Azure |
| C1.1 Certified compute price (5-year cost) | 47.7% | 26.2% | Microsoft Azure | 8.1% | 29.2% | Google Cloud |
| C1.2 Certified scale-up range | 9.5% | 35.8% | Microsoft Azure | 2.7% | none | - |
| C2.1 Multi-zone SLA | 10.5% | 78.7% | AWS | 7.7% | 52.8% | AWS |
| C2.2 HANA backup and DR | 10.5% | 78.7% | AWS | 15.3% | 56.7% | AWS |
| C3.1 EU regions | 5.5% | 32.9% | Microsoft Azure | 18.8% | none | - |
| C3.2 Compliance attestations | 5.5% | 41.4% | Microsoft Azure | 37.7% | none | - |
| C4.1 SAP tooling | 10.9% | 44.8% | Microsoft Azure | 9.8% | none | - |

In both presets the most sensitive weight is C1.1 (cost): about 21 percentage points away from a switch. No other
weight is closer than 26 points (cost preset) or 41 points (compliance preset).

### 4.2 Cost drivers

Table 4.2: cost-driver switch-points (source: page, tab 4, reference profile).

| Cost driver | Value now | Range tested | Cost-sensitive: switch-point | Compliance-sensitive: switch-point |
|---|---|---|---|---|
| Extra discount given only by AWS | 0% | 0-60% | 19.2% (Google Cloud to AWS) | none |
| Extra discount given only by Microsoft Azure | 0% | 0-60% | 7.5% (Google Cloud to Azure) | none |
| Extra discount given only by Google Cloud | 0% | 0-60% | none (already first) | none |
| Same discount from all providers | 0% | 0-60% | none | none |
| SAP HANA memory size | 900 GB | 256-4,096 GB | between 512 and 768 GB (Azure below, Google Cloud above) | none |
| Data growth per year | 10% | 0-50% | none | none |
| Outbound traffic per month | 500 GB | 0-20,000 GB | 13,549 GB (Google Cloud to Azure) | none |
| Evaluation period | 5 years | 1-10 | none | none |

### 4.3 What the switch-points show

1. **A discount that all providers give hardly matters; a discount from one provider does.** The cost score
   compares the providers with each other (cheapest = 9, most expensive = 1), so equal discounts leave the order
   unchanged. An AWS-only discount of 19.2% or an Azure-only discount of 7.5% changes the cost-sensitive
   recommendation. This links the model to the commercial factors found in Vector 2 (negotiated deals,
   migration funding).
2. **Machine size is a real driver.** Below about 768 GB of HANA memory, Azure is recommended instead of
   Google Cloud, because Google Cloud's certified 512 GiB machine is relatively expensive (see Chat 4). This
   supports H1: no provider is best for every profile.
3. **The compliance-sensitive recommendation is robust.** No cost driver in the tested range and only three of
   seven weights can change it, and only with large moves (21 points or more).
4. **Growth, years and (up to 13.5 TB a month) traffic do not change the recommendation** for this profile.

### 4.4 Text for the thesis (draft)

A one-at-a-time sensitivity analysis was run on the reference profile [Table 4.1, Table 4.2]. With the
cost-sensitive preset, the recommendation (Google Cloud) changes when the weight of the cost criterion falls from
47.7% to 26.2%, when HANA memory is below about 768 GB, when outbound traffic exceeds about 13.5 TB per month, or
when a single provider grants an extra discount of 7.5% (Azure) or 19.2% (AWS). With the compliance-sensitive
preset, the recommendation (Microsoft Azure) changes only through large weight changes. Because six criteria
still use demonstration scores, these switch-points are provisional [TODO: re-run with real criteria scores].

## 5. Summary

| Vector | Result | Status |
|---|---|---|
| 1 Calculator | Engine within 0.25% of the AWS (+0.23%) and Azure (-0.13%) calculators; compute matches to the cent | Done; Google Cloud not checked [TODO: limitation] |
| 2 Cases | 3 cases (AWS, Azure, Google Cloud): 2 mismatches explained by relationship/partnership factors, 1 not testable (6 TB above price data); one defect found and fixed | Done; Eva to confirm extraction; provisional (DEMO scores) |
| 3 Practitioners | Session outline, 8 questions, answer form | Questions ready; sessions [TODO] |
| Switch-points | Tables 4.1 and 4.2; shown in tab 4 | Done; provisional (DEMO scores) |
