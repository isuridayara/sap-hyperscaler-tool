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
