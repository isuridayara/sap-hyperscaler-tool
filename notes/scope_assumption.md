# Scope assumption: what the tool compares and what it leaves out

Status: Chat 3, 2026-11-13. Text for Chapter 2 (scope and delimitation). A short version is shown on the
page in the section "What this tool compares" (index.html).

## 1. Two ways to run SAP S/4HANA on a hyperscaler

A company that moves SAP S/4HANA to AWS, Microsoft Azure or Google Cloud can choose between two routes.

- **Route A: SAP-managed bundle.** SAP offers S/4HANA as one subscription, today called SAP Cloud ERP
  Private (earlier "RISE with SAP") [CITATION NEEDED: SAP source for the current name and the earlier name].
  SAP selects and runs the infrastructure on a hyperscaler and bundles it with the software subscription,
  technical operations and support into one contract [CITATION NEEDED: SAP description of what the bundle
  contains].
- **Route B: customer-managed.** The company (or a partner it hires) rents the infrastructure directly from
  the hyperscaler, installs and runs S/4HANA itself, and uses its own SAP licence.

## 2. Why Route A is excluded

Route A is excluded from the cost comparison for one reason: **it has no public price.**

1. SAP publishes no price list for SAP Cloud ERP Private. The price is agreed in a contract that is
   negotiated for each customer [CITATION NEEDED: SAP page or analyst source showing that pricing is on
   request].
2. The bundle price covers software, infrastructure, operations and support together. Even with a quote,
   the infrastructure part could not be separated and compared with the hyperscaler prices in Route B.
3. The tool follows a strict data rule: every price must come from a dated public source, and a value that
   cannot be traced is recorded as "NA" instead of being estimated (see notes/decisions.md). A Route A number
   could not meet this rule.

The exclusion is a limit of the method, not a judgement about Route A. The tool therefore cannot say
whether Route A would be cheaper or more expensive than Route B for a given company.

## 3. What the tool compares (Route B)

The tool compares the **customer-managed route on three hyperscalers: AWS, Microsoft Azure and Google
Cloud.** IBM Cloud is out of scope. For each provider it adds up six cost parts per year:
compute + storage + backup + network + support + one-off.

All prices in data/prices.csv follow the same rules (27 rows, 9 per provider):

| Rule | Value |
|---|---|
| Region | one region, EU Frankfurt (AWS eu-central-1, Azure Germany West Central, Google Cloud europe-west3) |
| Price type | public list price, on-demand / pay-as-you-go; discounts only as a labelled scenario |
| Compute | smallest machine listed as "OLTP single node" in the SAP Certified and Supported SAP HANA Hardware Directory with at least 512, 1,024, 2,048 or 4,096 GiB; if several, the cheapest in Frankfurt |
| Operating system | price without an operating-system licence (Linux) |
| Currency | EUR; USD prices converted with the ECB reference rate of the capture date |
| Snapshot | prices captured 2026-11-04 (AWS), 2026-11-10 (Azure) and 2026-11-12 (Google Cloud; Azure and AWS one-off rows) |

## 4. What the numbers do not include

The following costs are outside the comparison for all three providers. Because they are left out for
every provider, they shift the totals but are treated the same way.

- **The SAP software licence** (the company brings its own licence in Route B).
- **The operating-system licence** for SAP (SUSE Linux Enterprise Server for SAP or Red Hat Enterprise Linux
  for SAP). The prices used are for an operating system without a licence fee. [TODO: check which OS
  versions SAP supports for HANA and cite the SAP note.]
- **Migration and setup services** (the "one-off" part). No provider publishes a list price for them, so the
  rows are NA and the page states that the totals exclude them.
- **Extra disk performance** above the amount included in the disk price (IOPS and throughput).
- **Free allowances**, for example the free monthly internet egress, are not deducted.
- **Internal staff costs** for running the system, and any partner or consulting fees.

## 5. Consequences for the results

- The tool is a decision-support prototype for the customer-managed route. It is not a quote, not a
  pricing calculator and not a full total cost of ownership model.
- Results are valid for the price snapshot above. Prices change; the dates are shown on the page.
- Where providers price a part differently (for example support as a percentage of the bill on AWS and
  Google Cloud, but a flat monthly fee on Azure), the difference is kept and documented in the notes column
  of data/prices.csv.

## Short version for the page

> **What this tool compares.** Route A, the SAP-managed bundle (SAP Cloud ERP Private, earlier RISE with
> SAP), is **excluded**: SAP publishes no price list, and each contract is negotiated, so no number could be
> traced to a source. Route B, **customer-managed** S/4HANA on AWS, Microsoft Azure or Google Cloud, is what
> the tool compares, using dated public list prices for one region (EU Frankfurt). Not included for any
> provider: SAP and operating-system licences, migration services, and staff costs.
