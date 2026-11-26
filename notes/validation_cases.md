# Validation cases: extraction sheet (Chat 6, Vector 2)

Status: 2026-11-26. Claude found and read these pages; everything below is what the pages say (short quotes) or
"not stated". **Eva: please read each source yourself and tick or correct every line** before we use it in
notes/validation.md (section 2). Nothing here is invented; where a source is silent the value is NA.

Scope check for our tool: all three are customer-managed SAP on a hyperscaler (Route B). None of the sources
mentions RISE with SAP / SAP Cloud ERP Private.

---

## Case A: VHV Group on AWS

| Field | Value from the source | Eva checked |
|---|---|---|
| Source | AWS Partner Success story "VHV Group ... Netlution", https://aws.amazon.com/partners/success/vhv-netlution/ (date not shown; page updated 2026-11-17) | [ ] |
| Source type | Vendor-published (AWS), with the partner (Netlution) | [ ] |
| Company | VHV Group, Hanover, Germany; insurance; about 4,000 employees | [ ] |
| SAP | "several dozen" on-premises SAP systems, upgrade to S/4HANA; BW already moved, ERP in progress | [ ] |
| Operated by | Customer, after training by Netlution ("taking full control of the project") | [ ] |
| Sizing for our form | HANA memory: NA. Data volume: NA. Region: NA (Germany, region not stated). Egress: NA | [ ] |
| Stated reasons | (1) hardware shortage: "prices were very high or there was just zero availability"; (2) avoid a large capital expenditure; (3) AWS was already "its preferred server-workload cloud provider", earlier projects with AWS; (4) agility, faster innovation, "potential cost savings" | [ ] |
| Outside-model factors named | Existing relationship / preferred provider; AWS Migration Acceleration Program funding through the partner | [ ] |

## Case B: Arvato on Microsoft Azure

| Field | Value from the source | Eva checked |
|---|---|---|
| Source 1 | Microsoft customer story, 13 Nov 2023, https://microsoft.com/en/customers/story/1693313197199549267-arvato-professional-services-azure-en-germany | [ ] |
| Source 2 | Arvato Systems reference (implementation partner, same group), https://www.arvato-systems.com/more/about-arvato-systems/references/sap-on-azure-at-arvato | [ ] |
| Source type | Vendor-published (Microsoft) + partner-published (Arvato Systems) | [ ] |
| Company | Arvato (Bertelsmann), logistics / supply chain; 87 sites, over 4,000 ERP users per shift; country not stated on the pages | [ ] |
| SAP | 40 systems (from more than 70), R/3 on Oracle to S/4HANA, brownfield conversion together with the cloud move, finished early 2023 | [ ] |
| Operated by | Not stated (customer-run VMs; partner did the migration) | [ ] |
| Sizing for our form | VMs "up to 6 TB" (M-series and E-series); "more than 4 TB of pure system data"; Premium SSD v2. Region: NA. Egress: NA | [ ] |
| Stated reasons | (1) fits cloud-first / modern-workplace strategy ("flexibility, adaptability, and cost-saving features"); (2) one platform: "chose Azure for SAP versus being multicloud"; (3) Microsoft providing SAP solutions on the infrastructure; (4) ease of adoption; (5) already uses Microsoft 365, Teams, Power BI, Power Platform | [ ] |
| Outside-model factors named | Existing Microsoft ecosystem; single-vendor strategy; top-down decision ("Digital transformation comes from the top down"); partner in the same group | [ ] |

## Case C: Deutsche Börse Group on Google Cloud

| Field | Value from the source | Eva checked |
|---|---|---|
| Source 1 | Google Cloud blog, 1 Feb 2024, written by Lars Bolanca (Deutsche Börse), https://cloud.google.com/blog/products/sap-google-cloud/deutsche-borse-group-runs-s4-hana-on-google-cloud | [ ] |
| Source 2 (independent) | The Stack, 5 Feb 2024, E. Targett, https://www.thestack.technology/deutsche-borse-sap-google-cloud/ | [ ] |
| Source 3 (independent) | CIO.de, 3 Jan 2025, B. Reder, https://www.cio.de/article/3701813/deutsche-boerse-packt-haelfte-der-workloads-in-die-cloud.html | [ ] |
| Source type | Vendor-published (customer-authored post on Google's blog) + independent trade media | [ ] |
| Company | Deutsche Börse Group, exchange operator (Frankfurt), financial services; size not stated | [ ] |
| SAP | SAP ERP on premises to S/4HANA, moved to the cloud at the same time | [ ] |
| Operated by | Not stated | [ ] |
| Sizing for our form | NA for memory, data, egress. Region not stated | [ ] |
| Stated reasons | No explicit selection reasons. Described after the move: triple encryption with customer-held keys, scaling for trading peaks, faster onboarding, trust with regulators | [ ] |
| Outside-model factors named | Strategic partnership with Google Cloud announced Feb 2023 (The Stack); Google "preferred cloud platform" since 2023 (CIO.de); regulator acceptance; multi-cloud (Azure used by subsidiary Clearstream, CIO.de) | [ ] |

## Reserve case (if one of the above does not hold)

Schmitz Cargobull on Azure: CIO.de, 21 Jan 2020, https://www.cio.de/article/3694602/schmitz-cargobull-verlagert-sap-loesungen-in-die-cloud.html
(independent media). Trailer maker, Germany, about 3,500 SAP users, 28 systems, Oracle to HANA; S/4HANA not stated;
no reason for choosing Azure stated; operating costs about 20% lower.

## What this means for running the page

None of the sources states the HANA memory size, data volume or traffic. So the company profile for each case
can only partly come from the source. Approach (agreed by Eva on 2026-11-26):
- Run each case with the **reference profile** (600 GB data, 1,200 GB memory (2 x data, since 2026-11-26), Frankfurt, list price) and change only
  what the source gives. For Arvato: memory 6,144 GB ("up to 6 TB"), which is above the largest machine in
  data/prices.csv (4 TiB), so the page will show compute as NA. That is itself a result: the tool's price data does not cover
  the largest SAP landscapes.
- Use the preset that fits the stated reasons: Cost-sensitive for VHV (capex, cost), Compliance-sensitive for
  Deutsche Börse (regulators, encryption), and both for Arvato.
- Record "tool recommends" vs "company chose", and name the factor outside the model.
