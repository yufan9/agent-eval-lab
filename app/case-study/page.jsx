import Link from "next/link";
import { BarChart3, LayoutDashboard, Sparkles } from "lucide-react";
import {
  comparePromptVersions,
  formatCurrency,
  formatPercent,
  formatScore,
  getExecutiveSummary,
  supportTestCases
} from "../../lib/evaluation";

export const metadata = {
  title: "Portfolio Case Study | Customer Support Agent Evaluation",
  description: "Concise AI PM case study for the customer support agent evaluation dashboard."
};

export default function CaseStudyPage() {
  const comparison = comparePromptVersions(supportTestCases);
  const summary = getExecutiveSummary(comparison);
  const v1 = comparison.find((item) => item.version.id === "v1").metrics;
  const v2 = comparison.find((item) => item.version.id === "v2").metrics;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-lockup__mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className="brand-lockup__copy">
            <span>Customer Support Agent Evaluation</span>
            <h1>Portfolio Case Study</h1>
          </div>
        </div>
        <div className="topbar__actions">
          <Link className="button button--ghost" href="/">
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <Link className="button button--ghost" href="/bad-cases">
            <BarChart3 size={17} />
            Bad cases
          </Link>
        </div>
      </header>

      <section className="case-study-grid">
        <article className="panel case-study-card">
          <span>Problem</span>
          <p>
            Support teams want AI agents to resolve common tickets, but PMs need evidence that the agent is accurate, safe, and operationally ready before launch.
          </p>
        </article>
        <article className="panel case-study-card">
          <span>Hypothesis</span>
          <p>
            A stronger Prompt v2 with policy grounding, privacy checks, and escalation rules will reduce high-risk failures enough to justify a limited rollout.
          </p>
        </article>
        <article className="panel case-study-card">
          <span>Experiment setup</span>
          <p>
            Run {supportTestCases.length} deterministic customer support evals across refund, billing, account, safety, privacy, escalation, multilingual, accessibility, regional, fraud, and enterprise cases.
          </p>
        </article>
        <article className="panel case-study-card">
          <span>Key results</span>
          <p>
            Pass rate moved from {formatPercent(v1.passRate)} to {formatPercent(v2.passRate)}. Average score moved from {formatScore(v1.averageScore)} to {formatScore(v2.averageScore)}. Mock hallucination rate moved from {formatPercent(v1.hallucinationRate)} to {formatPercent(v2.hallucinationRate)}.
          </p>
        </article>
        <article className="panel case-study-card">
          <span>PM decision</span>
          <p>
            {summary.recommendation}: {summary.pmDecision}
          </p>
        </article>
        <article className="panel case-study-card">
          <span>Next iteration</span>
          <p>
            Reduce over-refusal and tool-outage failures, add human-review gating for sensitive flows, and monitor the simulated latency and estimated mock cost increase of {Math.round(v2.averageLatency - v1.averageLatency)} ms and {formatCurrency(v2.averageCost - v1.averageCost)} per case.
          </p>
        </article>
      </section>
    </main>
  );
}
