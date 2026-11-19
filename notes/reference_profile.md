# Reference company profile

Status: Chat 4, confirmed by Eva on 2026-11-19. All values are assumptions and still need sources (see [CITATION NEEDED]).
Purpose: one fixed, hypothetical company that the cost engine (js/cost.js) is run on, so that the cost range
in the thesis can be reproduced by anyone who opens the page and types in the same values.
The profile is a modelling assumption, not data from a real company.

## 1. The company (hypothetical)

A mid-sized European company that runs SAP S/4HANA as a single production system and wants to move it to
a hyperscaler on the customer-managed route (Route B, see notes/scope_assumption.md). It keeps its data in
the EU, so the region is EU Frankfurt for all three providers.

## 2. Input values for the page

| # | Form field on the page | Value | Why this value |
|---|---|---|---|
| P1 | SAP HANA data volume today (GB) | 600 | Assumed size of a mid-sized S/4HANA database [TODO: Eva to choose; ideally a value from a published case or SAP sizing example] [CITATION NEEDED] |
| P2 | SAP HANA memory size (GB) | 900 | 1.5 x P1, using the memory rule agreed in Chat 2 [CITATION NEEDED: source for the 1.5x rule]. The engine then takes the next certified step, 1,024 GiB |
| P3 | Data growth per year (%) | 10 | Assumption [CITATION NEEDED] |
| P4 | Outbound network traffic (GB per month) | 500 | Assumption: users, interfaces and reports sent out of the cloud [CITATION NEEDED] |
| P5 | Evaluation period (years) | 5 | Common planning horizon for an ERP platform decision [CITATION NEEDED] |
| P6 | Region | EU Frankfurt | Only region in data/prices.csv |
| P7 | Discount scenario (%) | 0 | List price (project rule: discounts only as a labelled scenario) |

## 3. What the engine picks for this profile

| Provider | Machine (1,024 GiB step) | Source row |
|---|---|---|
| AWS | x2idn.16xlarge | AWS-C2 |
| Microsoft Azure | Standard_M64s_v2 | AZ-C2 |
| Google Cloud | m3-ultramem-32 | GC-C2 |

## 4. Limits of the profile

- One production system only: no development, test or quality systems, and no high-availability second node.
- The machine size stays the same for all years, even though the data grows (the engine grows only storage
  and backup).
- Disk size = data volume (P1). A real HANA system also needs log and shared volumes.
