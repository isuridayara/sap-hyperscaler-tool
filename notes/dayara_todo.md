# Dayara's to-do list (open items that only Dayara can do)

Status: Chat 2, step 9 (2026-11-26). Claude cannot do these items, because they need Dayara's own reading, Dayara's
contacts or Dayara's login. Each item says where to work, what to do, and what "done" looks like.

## 1. Tick the case sources (notes/validation_cases.md): DONE 2026-11-26

Claude re-opened every source page and checked all 27 lines; all hold, small wording corrections are marked
"corrected 2026-11-26". You may spot-check any line. Note for the thesis: the VHV page calls speed and innovation
the main driver and says capex/hardware "were not the most important factors".

## 2. Practitioner sessions (notes/practitioner_form.md), 2-3 sessions of 30-40 minutes

Before the sessions:
1. Upload all Chat 2 files to GitHub first, so the practitioners see the real data (no DEMO labels on the criteria tabs).
2. Find 2-3 people: SAP Basis or cloud architects, SAP consultants or IT managers. One per hyperscaler is ideal.
   [TODO: Dayara to check with the supervisor whether written consent is needed and which form RNU uses.]
3. Make one copy of notes/practitioner_form.md per person: practitioner_P1.md, practitioner_P2.md, ...

During each session:
4. Follow the outline in notes/validation.md, section 3.1: consent, tasks T1-T5, questions Q1-Q8.
5. Write answers word for word. Do not correct the practitioner. Mark your own notes with [note].

After the sessions:
6. Fill in part E of each form.
7. Send the forms (or paste them) to Claude. Claude then fills table 3.2 in notes/validation.md and writes the
   summary of agreements and objections.

Done when: 2-3 filled forms exist and table 3.2 has one row per practitioner.

Note: Q4 and T5 were updated on 2026-11-26 to the real-data results (discount switch-points about 12.4% Azure and
21.9% AWS; no weight changes the recommendation).

## 3. References (notes/citations_needed.md)

1. Check each literature entry M1-M6 in the library or on Google Scholar. Tick the box when the reference is
   correct, and note the page numbers you use.
2. Open the web sources K1-K3 and S1-S3 once and tick them.
3. Rewrite the S1 sentence in notes/scope_assumption.md as suggested.
4. Reference profile, P2: check on the SAP Learning page that "data" means the data held in memory.

Done when: all boxes in citations_needed.md are ticked.

## 4. Small open items from earlier chats

- AWS SAP directory PDF: optional. Export it to confirm C1.2 (32 TiB) for AWS from SAP's own list. Today the value comes from the AWS documentation.
- AWS calculator estimate: optional cleanup of the saved link (the extra 2.04 row and the intra-region 10 USD). It does not change the result.
- After uploading: tell Claude, so that Claude can take the screenshots of the live page (step 8).
