# AgentEval Lab

**Live Demo:** https://agenteval-lab.netlify.app/  
**GitHub:** https://github.com/yufan9/agent-eval-lab

AgentEval Lab is an AI Agent evaluation dashboard for customer support launch readiness. It helps AI product managers compare prompt versions, analyze bad cases, and make rollout decisions such as "Do not ship", "Limited rollout", or "Ready to ship".

# Customer Support Agent Evaluation Dashboard

Portfolio-ready Next.js MVP for evaluating a mock AI customer support agent. The product uses deterministic mock data first, so it can demonstrate the AI PM workflow without real customer data, model calls, authentication, or external APIs.

## Product Problem

Customer support teams want AI agents to resolve repetitive tickets, but PMs need evidence that the agent is safe, accurate, and operationally useful before launch. A simple demo chat transcript is not enough. The team needs repeatable evaluations across policy, billing, account, privacy, safety, accessibility, regional policy, fraud, enterprise permissions, and escalation scenarios.

## Target Users

- AI product managers validating prompt and workflow changes.
- Support operations leaders reviewing launch readiness.
- Trust and safety reviewers checking privacy, medical, legal, credential, and escalation boundaries.
- Engineering teams debugging prompt, tool-routing, and evaluator regressions.

## MVP Scope

- 40 seeded customer support test cases.
- Edge-case coverage for multilingual support, low-literacy/accessibility, regional policy differences, ambiguous identity, tool outage, fraud/abuse, enterprise permissions, data retention, angry human-handoff requests, and medical/legal boundaries.
- Test case fields: user input, expected behavior, forbidden behavior, scenario, difficulty, expected tool, secondary tags, and rubric.
- Deterministic mock agent response generation for Prompt v1 and Prompt v2.
- Deterministic evaluator results with pass/fail, five rubric scores, overall score, primary failure category, secondary tags, severity, latency, estimated mock cost, evaluator notes, PM decision, and next prompt/product change.
- Executive summary with launch recommendation, quality lift, risk reduction, and cost/latency trade-off.
- Run status, latest run timestamp, loading state, and mock run history.
- Prompt version comparison with table, chart, and product insight.
- Bad Cases page grouped by primary failure category with category-level summaries.
- Portfolio Case Study page with problem, hypothesis, setup, results, PM decision, and next iteration.

## Evaluation Metrics

- **Pass Rate:** Share of cases without a primary failure category.
- **Average Score:** Weighted overall score across task success, factuality, tool use, safety, and UX quality.
- **Mock Hallucination Rate:** Cases with hallucination failure or factuality/policy failures in the mock evaluator.
- **Tool-use Rubric Score:** Rubric-based score for whether the expected workflow/tool was selected; this is not live production tool telemetry.
- **Safety Issue Rate:** Cases with unsafe response failure or low safety score.
- **Simulated Latency:** Deterministic mock agent plus evaluator latency.
- **Estimated Mock Cost:** Estimated per-case token cost for demo purposes.
- **Failure Category Distribution:** Count of failed cases by PM-actionable primary category.

## Failure Taxonomy

Each failed result has one primary category:

- Hallucination
- Missing Clarification
- Wrong Tool Call
- Over-refusal
- Unsafe Response
- Irrelevant Answer
- Escalation Needed
- Format Error

Secondary tags add context without creating overlapping primary buckets:

- privacy
- billing
- security
- refund
- account
- regional_policy
- tool_outage
- fraud_abuse
- multilingual
- accessibility
- enterprise_permission

## Scoring Rubric

Overall score is weighted to reflect support-agent launch risk:

- Task success: 32%
- Factuality: 22%
- Tool use: 16%
- Safety: 18%
- UX quality: 12%

Each test case includes rubric text describing what good performance means for that scenario. A case fails when the deterministic evaluator assigns a primary failure category, even if some individual scores are strong.

## Prompt Trade-offs

Prompt v1 is faster and cheaper, but it has weaker grounding, escalation, privacy, and tool-routing behavior. Prompt v2 improves pass rate, hallucination rate, and safety handling by adding stricter policy and escalation instructions. The trade-off is higher simulated latency and estimated mock cost per case.

The current PM recommendation is **Limited rollout**: ship Prompt v2 to low-risk support queues first, hold sensitive escalation flows behind human review, and continue iterating on over-refusal and tool-outage cases.

## Future Roadmap

- Add real model and evaluator APIs behind a feature flag.
- Connect policy retrieval and support-tool sandboxes.
- Add evaluator calibration with human reviewer labels.
- Track runs over time and show regression deltas by release.
- Add CSV import/export for eval suites.
- Add confidence intervals and severity weighting.
- Add team workflows for triage, owner assignment, and prompt-change approval.

## Run Locally

```bash
npm install
npm run dev
```

Build and production start:

```bash
npm run build
npm run start
```

The project currently uses mock data only. No real API keys or customer data are required.
