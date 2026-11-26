# Open [CITATION NEEDED] items

Status: Chat 2, step 7 (2026-11-26). This file lists every [CITATION NEEDED] item in the notes, together with a
suggested source. **Dayara checks each suggested source** (in the library, Google Scholar or on the web page itself)
before it goes into the thesis. Claude only read the web pages marked "read 2026-11-26". The literature entries are
well-known standard works, and Claude has not opened them. [TODO: Dayara to verify each reference and tick the box.]

Legend: **A** = source found and read, needs a tick. **B** = standard literature, Dayara to verify. **C** = no source
found; keep the value as a labelled assumption, or change it.

## 1. Method (notes/mcda_results.md, notes/validation.md)

| # | Where | Claim | Suggested source | Type | OK |
|---|---|---|---|---|---|
| M1 | mcda_results.md sec 1, 7 | AHP with Saaty's 1-9 scale, principal eigenvector | Saaty, T. L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill. And Saaty, T. L. (2008). Decision making with the analytic hierarchy process. *International Journal of Services Sciences*, 1(1), 83-98. | B | [ ] |
| M2 | mcda_results.md sec 1, 7 | Random index (RI) values and CR < 0.1 | Saaty (1980), as in M1. Check that the RI table in the book matches the values in js/mcda.js. | B | [ ] |
| M3 | mcda_results.md sec 1, 7 | TOPSIS (vector normalisation, ideal and anti-ideal solution) | Hwang, C.-L., & Yoon, K. (1981). *Multiple Attribute Decision Making: Methods and Applications*. Springer (Lecture Notes in Economics and Mathematical Systems, 186). | B | [ ] |
| M4 | mcda_results.md sec 7 | AHP "ratings" mode: alternatives scored on a scale instead of pairwise | Saaty, T. L. (1986). Absolute and relative measurement with the AHP. *Socio-Economic Planning Sciences*, 20(6), 327-331. | B | [ ] |
| M5 | mcda_results.md sec 7 | Score relative to the best value (1 + 8 x value / best) as a normalisation | Jahan, A., & Edwards, K. L. (2015). A state-of-the-art survey on the influence of normalization techniques in ranking. *Materials & Design*, 65, 335-342 (linear "max" normalisation). The mapping onto 1-9 is our own choice; say so in the text. | B | [ ] |
| M6 | validation.md sec 3 | Expert walkthrough / expert evaluation of a design artefact | Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75-105. And Venable, J., Pries-Heje, J., & Baskerville, R. (2016). FEDS: a framework for evaluation in design science research. *European Journal of Information Systems*, 25(1), 77-89. | B | [ ] |

## 2. Calculators (notes/calculator_check.md, notes/validation.md)

| # | Where | Claim | Source | Type | OK |
|---|---|---|---|---|---|
| K1 | calculator_check.md | AWS Pricing Calculator estimate, accessed 2026-11-20 | https://calculator.aws/#/estimate?id=6b3e3ab2ed8757ada464a11ce4cd04fe930217b6 (already in the file; cite as "AWS Pricing Calculator, accessed 20 November 2026"). | A | [ ] |
| K2 | validation.md sec 1.3 | Azure Pricing Calculator, accessed 2026-11-26 | https://azure.microsoft.com/pricing/calculator/ , accessed 26 November 2026. No share link exists, because saving needs a Microsoft login. The table in validation.md is the record. | A | [ ] |
| K3 | validation.md sec 1.6 | Google Cloud Pricing Calculator, accessed 2026-11-26 | Share link in sec 1.6, plus screenshots in evidence/gcp-calc_*.jpg. | A | [ ] |

## 3. Scope (notes/scope_assumption.md)

| # | Where | Claim | Suggested source | Type | OK |
|---|---|---|---|---|---|
| S1 | scope_assumption.md | Current name "SAP Cloud ERP Private", earlier "RISE with SAP" | SAP product page https://www.sap.com/products/erp/s4hana-private-edition.html (it now carries the title "SAP Cloud ERP Private"). SAP News, 22 April 2025, "Introducing SAP Cloud ERP Private Package to Accelerate Transformation" (read 2026-11-26). **Careful:** the article calls it a *new commercial package* that includes S/4HANA Cloud Private Edition. It does **not** say that it is a rename of RISE with SAP. [TODO: Dayara, rewrite the sentence as "SAP Cloud ERP Private, the package that succeeds RISE with SAP" only if an SAP source says so; otherwise write "SAP's managed offering (RISE with SAP, now also sold as the SAP Cloud ERP Private package)".] | A | [ ] |
| S2 | scope_assumption.md | The bundle combines software, infrastructure, technical operations and support in one contract | Same SAP News article (lists applications, transformation tools and services, and cloud services in the package). Infrastructure and operations: SAP page "What is SAP ERP Private operations and support" (sap.com, products/erp/cloud-erp-private/what-is-sap-erp-private-operations-and-support.html). [TODO: Dayara to open and check.] | A/B | [ ] |
| S3 | scope_assumption.md | Pricing is negotiated per customer, no public price list | SAP pricing page https://www.sap.com/products/erp/s4hana-private-edition/pricing.html [TODO: Dayara to check that it shows "contact us" and no list price, and note the access date]. | B | [ ] |

## 4. Reference profile (notes/reference_profile.md, notes/decisions.md)

| # | Value | Finding | Type | OK |
|---|---|---|---|---|
| P1 | 600 GB HANA data | No published source found. Keep it as a labelled assumption ("mid-sized system"). The practitioner sessions can confirm whether it is realistic. | C | [ ] |
| P2 | Memory = 2 x data (1,200 GB → 2,048 GiB), changed from 1.5x by Dayara on 2026-11-26 | **No source supports 1.5x.** SAP Learning "Performing SAP HANA Sizing" (read 2026-11-26) says to "calculate the total RAM by multiplying the static RAM by two", so memory = **2 x** data in memory. It also says memory should be sized with the SAP Quick Sizer or the sizing reports. The AWS "SAP HANA Sizing" page gives no factor and refers to SAP Note 1793345. Dayara chose the 2x rule on 2026-11-26; the profile and all results are updated. | A | [ ] |
| P3 | 10% data growth per year | No source found. Keep it as an assumption; the low/base/high cases already vary it. | C | [ ] |
| P4 | 500 GB/month outbound traffic | No source found. Keep it as an assumption; the sweep (0-20,000 GB/month, no switch-point) shows the result is not sensitive to it. | C | [ ] |
| P5 | 5-year evaluation period | No source found. Keep it as an assumption; ask in the practitioner sessions. | C | [ ] |

## 5. Validation cases (notes/validation.md sec 2)

| # | Claim | Finding | Type | OK |
|---|---|---|---|---|
| V1 | A 21.9% AWS-only discount is a size that migration funding could reach | AWS does not publish MAP funding amounts. No public source found. [TODO: Dayara, rewrite as "whether such a discount is realistic could not be checked from public sources" unless a practitioner can confirm it.] | C | [ ] |

## Summary

- 6 literature references (M1-M6): Dayara verifies them in the library.
- 4 web sources were read and only need a tick (K1-K3, S1). S1 needs a small rewrite.
- 1 important finding: the 1.5x memory rule had no source; SAP's own course material uses 2x, so the profile now uses 2x.
- 5 items have no public source (P1, P3, P4, P5, V1): keep them as labelled assumptions.
