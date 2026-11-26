# S/4HANA on AWS, Microsoft Azure or Google Cloud - decision-support prototype

A static web page (GitHub Pages) that compares the customer-managed route for SAP S/4HANA on AWS,
Microsoft Azure and Google Cloud. It shows a cost range (low / base / high), a criteria matrix,
a weighted ranking and a sensitivity analysis. It is not a pricing calculator and not a full TCO model.
The SAP-managed bundle (SAP Cloud ERP Private, earlier RISE with SAP) is not priced; see
`notes/scope_assumption.md`.

## Files

| Path | What it is |
|---|---|
| `index.html` | the page |
| `js/cost.js` | cost engine (compute + storage + backup + network + support + one-off) |
| `js/mcda.js` | weighting and ranking |
| `js/sensitivity.js` | sensitivity analysis |
| `js/app.js` | loads the data files and fills the page |
| `data/prices.csv` | real public list prices (27 rows) |
| `data/normalisation.csv` | the seven criteria, what each measures and its scoring rule |
| `data/criteria.csv` | real evidence per provider and criterion (value, score, source link, date) |
| `data/pairwise.csv` | AHP judgments for the two weight presets |
| `data/*_demo.csv` | demo data, used only as fallback if a real file is missing (then marked DEMO) |
| `tests.html` | automatic checks (open it on the live page; all rows should say PASS) |
| `notes/decisions.md` | rules and decisions |
| `notes/scope_assumption.md` | what the tool compares and what it leaves out |
| `notes/reference_profile.md` | the reference company profile the results are based on |
| `notes/calculator_check.md`, `notes/validation.md` | validation: calculator checks, cases, practitioner walkthrough, switch-points |
| `notes/validation_cases.md`, `notes/practitioner_form.md` | case extraction sheet and practitioner answer form |
| `notes/mcda_results.md` | weights and rankings |
| `notes/citations_needed.md`, `notes/dayara_todo.md` | open references and open tasks |

## Price data

The page uses real public list prices from `data/prices.csv` (27 rows, EU Frankfurt, on-demand, EUR).
**Price snapshot: captured 2026-11-04 (AWS), 2026-11-10 (Microsoft Azure) and 2026-11-12 (Google Cloud).**
Prices change; every row has its own `source_url` and `date_captured`. What is compared and what is left out:
see `notes/scope_assumption.md`. Rules and decisions: see `notes/decisions.md`.
