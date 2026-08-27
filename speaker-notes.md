# VIREO ARK · The Next Version — speaker notes

Removidas do deck a pedido (a barra inferior do modo apresentador). Guardadas aqui caso queira reinseri-las.

## Cover

Open by naming the four pillars and saying they are one story, not four projects: the product knows what matters, shows it well, shows it to the right person, and carries it across into MindBeat without a seam.

## Where this starts

Name the base before criticising it: the initial development is done and the software works. Everything after this slide is about the next version of it, not about starting over. If the room is the team itself, say the names.

## Today's list

Leave the mock-up on screen in silence for two seconds before speaking. The question for the room: on this screen, which row do you open first? The honest answer is “the top one”, and that is exactly the problem.

## The cost in numbers

The number that is not on the slide, if asked: 22 ECG Holters and 25 ABPM studies in the same window. Enough volume for the inbox to matter in the live demo itself.

## Exam 43963

This is the slide that buys the room. Add nothing: show the row, wait, then show the panel. If asked why the Result field doesn’t solve it — it is filled by a human at reporting time, so ranking by it means ranking what is already done.

## Roles today

The engine is not the problem — the setup is. Ask how long it takes to onboard a new customer today, one permission at a time. The consequence to land: with no role applied, the user is handed every module in the product, and that is the opposite of a fluid first day.

## The thesis

The consequence is the answer to the cost objection, before anyone raises it: most of this work is composition and exposure, not foundation. Plant the sentence here and prove it near the end.

## The four pillars

If the order gets debated, debate it here and not at the end. The point to defend: interface first is not designer preference, it is avoiding rework on every screen the inbox touches.

## Pillar 01

Worth saying that the inbox is not a new idea: it sits in the company’s own competitive analysis and in the ARK macro-spec, flagged high priority, and never entered a planning cycle.

## The inbox

Point at the reason line in orange at the foot of each card. Without it the ranking is a black box and no cardiologist trusts it. Ask the room: what else should be written on that line?

## Prioritisation criteria

Be explicit that pacemaker and acquisition failure were not observed during the audit — that is a question for Engineering, not a claim. Promising a criterion whose data does not exist is the fastest way to lose a clinical room. The waiting row carries two signals: elapsed time and no assigned reader; the SLA threshold itself does not exist yet and has to be configurable per site.

## Customisable with a floor

The last line on the right is the most delicate safety decision in the pack: AI raises priority and never lowers it. It is subject to clinical validation and the preliminary recommendation is to keep that asymmetry.

## Pillar 02

Say plainly that this is not a cosmetic wish list. In a room of clinicians a broken icon and a three-line column header do more damage to credibility than a missing feature.

## Before and after

Insist that none of this is new data: STAT, the received timestamp and the card-view components are all already in the product. This pillar is exposure, not collection.

## Interface debt

Useful nuance for engineering: each finding is one of three kinds — the product contradicts the design system, the design system doesn’t cover the case, or it covers it and the product didn’t apply it. Only the second kind needs new design work.

## Pillar 03

This is the pillar with the largest gap between what exists and what is visible. The permission engine shipped; the experience it should produce did not.

## The role engine

This is a good-news slide and should be delivered as one: the expensive half — authentication, roles, permissions, scoping — is done. What is left is the half that shows.

## Four roles, four landings

This is the slide that makes the point without explanation. Walk left to right and say only what each person does first in their day. The permission model underneath is the same one; what changes is the opening.

## What a role defines

If asked whether this fragments the product: no. It is one permission model with a landing screen and a menu scope attached to it. The clinical floor from pillar 01 applies identically to every role.

## Pillar 04

A naming note for the room: MindBridge is the integration and AI-services layer; MindBeat is the Holter analysis product that arrives through it. This pillar is about the journey, not about a vendor.

## The journey

The test of this pillar is a question the user should never have to ask: “where am I?”. If someone has to re-select the patient, log in again, or re-enter a finding, the journey is broken no matter how good each product is on its own.

## Synced, not merged

For a technical room this is the important slide: the separation is not styling, it is what stops an inattentive edit from erasing the machine’s finding — and what makes it auditable who concluded what.

## Layers of feasibility

This is the ready answer to “are you going to demo something that doesn’t exist?”. Column A is everything the demo touches, and none of it depends on real integration.

## Effort

The reason effort is low is the thesis from slide 5: the ranking data exists, the card components exist, real-time exists, the role engine exists. Say the caveat out loud — do not let it be read as a schedule.

## Open questions

Frame these as cheap: each is a question to Engineering or to a clinical validator, not a piece of work. Answering them is the highest-return move available right now.

## Closing

This slide stays projected through the questions. The question I leave open for the room: which prioritisation criteria matter most in your own daily practice?
