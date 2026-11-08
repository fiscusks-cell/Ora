# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who bill clients by the hour and need the hours to become invoices without re-keying: accounting and bookkeeping firms, and independent freelancers, treated as equal audiences (confirmed). Inside a workspace there are three roles — OWNER, ADMIN, MEMBER. Members track their own time; owners and admins also run billing periods, approve them, and publish invoices.

## Product Purpose

ORA turns tracked time into issued invoices. A member starts a timer against a client project; at month end an admin reviews the billing period, approves it, and publishes one invoice per client to QuickBooks Online or Xero, with the PDF time report attached. Success is a period that closes with every client invoiced from the hours actually logged, and a report that reproduces what was sent. Tagline in use: "Time, tracked. Invoices, done."

## Positioning

[inferred from the codebase, not yet confirmed] The mechanism is the billing period: hours are approved as a unit and fan out into per-client invoices in the accounting system, with a ledger that prevents double-billing on retry. Neighboring timers export CSVs; ORA closes the period into the books.

## Operating Context

- Daily use is the timer page: start/stop, inline edits, grouped entries by week and day.
- Reports (summary, detailed, workload, profitability) are read weekly and at period close; CSV and PDF exports leave the app.
- Periods are monthly for the current clients (confirmed). Publishing goes to QuickBooks Online (sandbox and live) or Xero (live only — Xero has no sandbox, so the app confirms before creating live invoices).
- Money is carried in integer minor units and rounded once per entry; each client has its own currency.
- Built and operated by Fiscus LLC, an accounting firm that uses it for its own clients.

## Capabilities and Constraints

- Role-gated surfaces: periods, invoices, team, organization and integration settings are owner/admin only; every API route re-reads the role from the database.
- A workspace setting (`showAmountsToMembers`, default off) decides whether members see rates and amounts; billable status is always visible.
- One invoice per client per period, enforced in the database; publishing is resumable and self-limiting against the hosting function timeout.
- Rates are currently read live from the project; snapshotting the rate per entry (so past reports reproduce issued invoices) is decided but not yet built.
- Invoice numbering may need to be gapless for Kosovo VAT; flagged, undecided.
- `ReportPDF` is a printable business document and is styled independently of the app theme.

## Brand Commitments

- Name: ORA. Byline: "Powered by Fiscus LLC".
- Visual system: `docs/DESIGN.md` is binding (dark graphite canvas, one aurora beam, Electric Iris / Ember Pulse, Lato body with Akt display, pill controls).
- No gradient text, no eyebrow labels, no decorative glass — per the design reference and craft floor.

## Evidence on Hand

- The product itself: every screen can be shown as a faithful code-built mockup (confirmed as the hero visual).
- Real integrations: QuickBooks Online and Xero, with PDF attachment.
- There are **no** customer testimonials, logos, counts, or case studies. Marketing copy must not claim any (confirmed). The previous landing page's "Join freelancers and agencies who trust ORA" is retired for that reason.

## Product Principles

1. The numbers must reconcile: what a report shows, what a PDF prints, and what an invoice bills are the same integer sums.
2. Members never see what they are not allowed to see, enforced on the server, not by hiding UI.
3. The server is the clock: billable time is never trusted from a browser.
4. Fail closed and say why: a refused action names what is required; a failed save stays open with the server's message.
5. Show the product, not a promise: proof is the real workflow and the real integrations.
