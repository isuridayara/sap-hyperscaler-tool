# Validation cases: extraction sheet (Chat 6, Vector 2)

Status: 2026-11-26, sources checked line by line on 2026-11-26. Claude found and read these pages; everything below is what the pages say (short quotes) or
"not stated". **Check done 2026-11-26:** Claude re-opened every source page and compared each line with the page text.
All lines hold; small corrections are marked "corrected 2026-11-26". Dayara may spot-check any line. Nothing here is invented; where a source is silent the value is NA.

Scope check for our tool: all three are customer-managed SAP on a hyperscaler (Route B). None of the sources
mentions RISE with SAP / SAP Cloud ERP Private.

---

## Case A: VHV Group on AWS

| Field | Value from the source | Checked |
|---|---|---|
| Source | AWS Partner Success story "VHV Group ... Netlution", https://aws.amazon.com/partners/success/vhv-netlution/ (date not shown; page updated 2026-11-17) | [x] |
| Source type | Vendor-published (AWS), with the partner (Netlution) | [x] |
| Company | VHV Group, Hanover, Germany; insurance; 4,000 employees ("With 4,000 employees") | [x] corrected 2026-11-26 (page says 4,000, not "about") |
| SAP | "several dozen" on-premises SAP systems, upgrade to S/4HANA; BW already moved, ERP in progress | [x] |
| Operated by | Customer, after "training and support from Netlution" ("taking full control of the project") | [x] corrected 2026-11-26 (wording) |
| Sizing for our form | HANA memory: NA. Data volume: NA. Region: NA (Germany, region not stated). Egress: NA | [x] |
| Stated reasons | (1) hardware shortage: "prices were very high or there was just zero availability"; (2) avoid a large capital expenditure; (3) AWS was already "its preferred server-workload cloud provider", earlier projects with AWS; (4) "greater agility, faster innovation, and potential cost savings". Weight of the reasons on the page: hardware was "the final reason"; capex and hardware "were not the most important factors"; the main driver named is speed and innovation | [x] corrected 2026-11-26 (added how the page weighs the reasons) |
| Outside-model factors named | Existing relationship / preferred provider; AWS Migration Acceleration Program funding through the partner ("access to AWS Migration Acceleration Program funding", quote from VHV, tied to choosing Netlution) | [x] |

## Case B: Arvato on Microsoft Azure

| Field | Value from the source | Checked |
|---|---|---|
| Source 1 | Microsoft customer story, 13 Nov 2023, https://microsoft.com/en/customers/story/1693313197199549267-arvato-professional-services-azure-en-germany | [x] |
| Source 2 | Arvato Systems reference (implementation partner, same group), https://www.arvato-systems.com/more/about-arvato-systems/references/sap-on-azure-at-arvato | [x] |
| Source type | Vendor-published (Microsoft) + partner-published (Arvato Systems) | [x] |
| Company | Arvato (Bertelsmann), logistics / supply chain; 87 sites, over 4,000 ERP users per shift (both from Source 2); country not stated on the pages | [x] corrected 2026-11-26 (source named) |
| SAP | 40 systems (from more than 70), R/3 on Oracle to S/4HANA, brownfield conversion together with the cloud move, finished early 2023 ("R/3 Oracle" and "brownfield" from Source 2; 70 to 40 systems and early 2023 from Source 1) | [x] corrected 2026-11-26 (source named) |
| Operated by | Not stated (customer-run VMs; partner did the migration) | [x] |
| Sizing for our form | VMs "up to 6 TB" (M-series and E-series); "more than 4 terabytes of pure system data"; Premium SSD v2. Region: NA. Egress: NA | [x] corrected 2026-11-26 (exact quote) |
| Stated reasons | (1) fits cloud-first / modern-workplace strategy ("flexibility, adaptability, and cost-saving features"); (2) one platform: "chose Azure for SAP versus being multicloud"; (3) "Microsoft providing SAP solutions on top of the infrastructure"; (4) ease of adoption; (5) already uses Microsoft 365, Teams, Power BI, Power Platform | [x] corrected 2026-11-26 (exact quote in 3) |
| Outside-model factors named | Existing Microsoft ecosystem; single-vendor strategy; top-down decision ("Digital transformation comes from the top down"); partner in the same group | [x] |

## Case C: Deutsche Börse Group on Google Cloud

| Field | Value from the source | Checked |
|---|---|---|
| Source 1 | Google Cloud blog, 1 Feb 2024, written by Lars Bolanca (Deutsche Börse), https://cloud.google.com/blog/products/sap-google-cloud/deutsche-borse-group-runs-s4-hana-on-google-cloud | [x] |
| Source 2 (independent) | The Stack, 5 Feb 2024, Edward Targett, https://www.thestack.technology/deutsche-borse-sap-google-cloud/ | [x] corrected 2026-11-26 (author's full name) |
| Source 3 (independent) | CIO.de, 3 Jan 2025, B. Reder, https://www.cio.de/article/3701813/deutsche-boerse-packt-haelfte-der-workloads-in-die-cloud.html | [x] |
| Source type | Vendor-published (customer-authored post on Google's blog) + independent trade media | [x] |
| Company | Deutsche Börse Group, exchange operator (Frankfurt, named in Source 2), financial services; size not stated | [x] |
| SAP | SAP ERP on premises to S/4HANA, moved to the cloud at the same time | [x] |
| Operated by | Not stated | [x] |
| Sizing for our form | NA for memory, data, egress. Region not stated | [x] |
| Stated reasons | No explicit selection reasons. Described after the move: triple encryption with customer-held keys, scaling for trading peaks, faster onboarding, trust with regulators | [x] |
| Outside-model factors named | Strategic partnership with Google Cloud announced Feb 2023 (The Stack); Google "preferred cloud platform" since 2023 (CIO.de); regulator acceptance; multi-cloud (Azure used by subsidiary Clearstream, CIO.de) | [x] |

## Reserve case (if one of the above does not hold)

Schmitz Cargobull on Azure: CIO.de, 21 Jan 2020, https://www.cio.de/article/3694602/schmitz-cargobull-verlagert-sap-loesungen-in-die-cloud.html
(independent media; checked 2026-11-26, all details confirmed). Trailer maker, Germany, about 3,500 SAP users, 28 systems, Oracle to HANA; S/4HANA not stated;
no reason for choosing Azure stated; operating costs about 20% lower.

## What this means for running the page

None of the sources states the HANA memory size, data volume or traffic. So the company profile for each case
can only partly come from the source. Approach (agreed by Dayara on 2026-11-26):
- Run each case with the **reference profile** (600 GB data, 1,200 GB memory (2 x data, since 2026-11-26), Frankfurt, list price) and change only
  what the source gives. For Arvato: memory 6,144 GB ("up to 6 TB"), which is above the largest machine in
  data/prices.csv (4 TiB), so the page will show compute as NA. That is itself a result: the tool's price data does not cover
  the largest SAP landscapes.
- Use the preset that fits the stated reasons: Cost-sensitive for VHV (capex, cost), Compliance-sensitive for
  Deutsche Börse (regulators, encryption), and both for Arvato.
- Record "tool recommends" vs "company chose", and name the factor outside the model.
