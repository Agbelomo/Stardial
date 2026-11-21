# Contractor Terms: Scope, Compliance, Disputes, and Exit

This document sets the commercial and legal ground rules for contractor
engagements: how scope is defined (deliverables, assumptions, boundaries,
exclusions, and success), how budget and changes are controlled, what compliance applies to
international work, how disagreements are resolved, what happens at the end, and
whether the engagement may be transferred. It supplements the statement of work.

## 1. Scope, Budget, and Change Control

### 1.1 Defining the scope

Every statement of work must contain the sections below, written in plain
language. Work does not start until both parties have agreed them in writing.
Anything left blank or marked "to be decided" is out of scope until a change
request adds it.

| Section             | What it must say                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Objective           | One or two sentences on the problem being solved and who benefits                                                                              |
| Deliverables        | A numbered list of each item to be handed over (code, document, design, deployment, or report), with its format and where it will be delivered |
| Acceptance criteria | For each deliverable, the checks that show it is done, in addition to the quality standards in the contractor agreement                        |
| In scope            | The features, systems, environments, platforms, and repositories the work covers                                                               |
| Out of scope        | Related work the contractor will not do (see the default exclusions below)                                                                     |
| Assumptions         | Facts the plan depends on, such as access, inputs, third-party availability, and decision turnaround                                           |
| Dependencies        | What Stardial or others must supply, and by when                                                                                               |
| Milestones          | Target dates for each deliverable and the budget attached to each                                                                              |

Write acceptance criteria so that a reviewer can answer "yes" or "no". For
example, "users can export a split history as CSV from the dashboard, and the
export matches the on-chain records for the test account" is testable; "a good
export feature" is not.

### 1.2 Default exclusions

Unless the statement of work lists them as deliverables, the following are out
of scope:

- New features, screens, endpoints, or contract functions not named in the
  deliverables list.
- Ongoing operation, hosting, monitoring, or support after acceptance. Ongoing
  service levels apply only where the statement of work includes them.
- Fixing defects in code, infrastructure, or third-party services that the
  contractor did not write or change.
- Data migration, content entry, translation, and user training.
- Security audits, penetration tests, or formal verification by a third party.
- Paid third-party licences, hosting, or API usage beyond what Stardial provides.
- Rework caused by Stardial changing requirements after acceptance criteria are
  agreed. This is handled as a change request.

### 1.3 Assumptions and boundaries

- If an assumption in the statement of work turns out to be false, the party who
  finds out tells the other in writing within **2 business days**. The parties
  then agree a change request or confirm that the impact is absorbed.
- Ambiguous scope is not read as including extra work. When the contractor is
  unsure whether something is in scope, they ask in writing before doing it.
  Work done without that confirmation is not payable as extra work.
- Small clarifications that do not change effort, cost, or dates, such as
  wording, naming, or layout choices inside an agreed deliverable, can be agreed
  in the pull request or issue without a change request.

### 1.4 Definition of success

The engagement is successful when every deliverable in the statement of work has
been accepted under the sign-off process in the contractor agreement, and any
milestone budget has not been exceeded without an approved change request. Work
that is not in the deliverables list does not count toward or against success.

### 1.5 Budget and change control

- The statement of work lists the deliverables and a **not-to-exceed budget**.
  Work outside that list is out of scope.
- No out-of-scope work starts without a written change request approved by both
  parties. The change request states the extra cost, effort, and date impact.
- The contractor reports spend against budget at each milestone. If forecast
  spend reaches **80%** of the not-to-exceed amount, the contractor must notify
  Stardial before continuing.
- Stardial may pause or stop work at any milestone; payment is due only for work
  accepted up to that point.
- Once the not-to-exceed budget is reached, the contractor stops unless a new
  change request is approved. Unapproved overruns are not payable.

## 2. International Work and Legal Compliance

- Each party follows the laws that apply where it is established. The contractor
  is responsible for its own tax registration, filings, and work authorisation.
- The contractor identifies the jurisdiction where the work is performed and
  obtains every licence, permit, registration, and approval that the delivery
  location requires before starting that work. Copies are provided to Stardial
  on request, and any renewal or condition is tracked for the duration of the
  engagement.
- The contractor must not use the engagement to handle export-controlled
  technology, sanctioned parties, or restricted data. Flag anything that might
  qualify before work starts.
- Stardial data stays in the systems Stardial designates. The contractor must
  not move it to another country or provider without written approval.
- Fees are exclusive of taxes; each party pays its own taxes. Where withholding
  applies, the paying party may withhold and will provide the receipt.
- If a local law conflicts with these terms, notify Stardial and the parties will
  agree a workaround in writing before proceeding.

## 3. Dispute Resolution

No party may start arbitration or litigation until it completes the stages below.
The parties continue performing undisputed obligations while a dispute is
pending, and work continues and undisputed invoices remain payable unless the
engagement was terminated for cause. Emergency relief to preserve evidence,
protect confidential information, prevent unauthorised access, or stop
misappropriation is permitted at any stage.

1. **Written notice and negotiation.** The party raising a dispute gives written
   notice to the nominated contract contacts, describing the facts, the clause
   involved, and the requested resolution. The nominated contacts meet or confer
   in good faith within **10 business days** of the notice.
2. **Senior escalation.** If the nominated contacts do not resolve the dispute,
   each party appoints a senior representative who has authority to settle the
   matter. The representatives meet within **10 further business days**.
3. **Mediation.** If senior escalation does not resolve the dispute, the parties
   jointly appoint a mediator and meet for one mediation session within
   **30 calendar days**. Unless the parties agree otherwise, mediation is private
   and confidential, and the parties split the mediator's fees equally. Statements
   made and documents created solely for mediation cannot be used in later
   proceedings except to the extent admissible under applicable law.
4. **Arbitration.** If mediation fails or a mediator is not appointed within
   **30 calendar days**, the dispute is finally resolved by binding arbitration
   under the Nigerian Arbitration and Mediation Act 2023 (or its replacement).
   The seat is Lagos, Nigeria. The tribunal consists of one arbitrator agreed by
   the parties within 10 business days after a written request for arbitration;
   absent agreement, the appointing authority is the Lagos Court of Arbitration
   (LCA). The arbitrator decides in accordance with these terms and Nigerian law.
   The award is final and binding, and judgment may be entered on it in a court
   of competent jurisdiction.
5. **Litigation.** Litigation is limited to proceedings for interim or emergency
   relief and recognition or enforcement of an arbitral award. Any such
   proceedings are brought exclusively in the courts of Lagos State, Nigeria.

## 3A. Governing Law and Venue

- These terms and each statement of work are governed by the laws of the Federal
  Republic of Nigeria, without regard to conflict-of-laws rules.
- The seat and legal place of arbitration is Lagos, Nigeria.
- Any court proceedings permitted under section 3 are submitted exclusively to
  the courts sitting in Lagos State, Nigeria.
- Each party waives any objection to jurisdiction or venue in Lagos State only
  to the extent it is permitted to do so under applicable mandatory law.

## 4. Exit and Transition

- Either party may end the engagement with **30 days' written notice**; Stardial
  may end it immediately for uncured breach or non-performance.
- On exit the contractor must, within **10 business days**: hand over all work
  product and documentation, return or destroy Stardial data and credentials, and
  provide a written status of unfinished work.
- The contractor provides up to **5 business days** of transition assistance to
  Stardial or a replacement provider, at the agreed rate.
- Access to Stardial systems ends on the last day of the engagement, or sooner on
  request.
- Payment for accepted work remains due after exit; prepaid but undelivered work
  is refunded.

## 5. Assignment

- Neither party may assign or transfer this engagement, in whole or in part,
  without the other party's prior written consent. An assignment made without
  that consent is void.
- Either party may assign the engagement without consent to a successor in a
  merger, reorganisation, or sale of substantially all of its assets, provided
  the successor agrees in writing to be bound by these terms and is not a direct
  competitor of the other party.
- The assigning party remains responsible for obligations accrued before the
  assignment and must notify the other party in writing within **10 business
  days** of any permitted transfer.
- The contractor may not subcontract an assignment of the engagement;
  subcontracting remains subject to the flow-down obligations in the contractor
  agreement.
