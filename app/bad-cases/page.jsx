import Link from "next/link";
import { AlertTriangle, LayoutDashboard, Sparkles } from "lucide-react";
import {
  CATEGORY_SUMMARIES,
  FAILURE_CATEGORIES,
  formatCurrency,
  getBadCaseGroups,
  supportTestCases
} from "../../lib/evaluation";

export const metadata = {
  title: "Bad Cases | Customer Support Agent Evaluation",
  description: "Failed customer support agent evaluation cases grouped by failure category."
};

export default function BadCasesPage() {
  const groups = getBadCaseGroups(supportTestCases, ["v1", "v2"]);
  const totalFailures = Object.values(groups).reduce((sum, cases) => sum + cases.length, 0);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-lockup__mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className="brand-lockup__copy">
            <span>Customer Support Agent Evaluation</span>
            <h1>Bad Cases Review</h1>
          </div>
        </div>
        <div className="topbar__actions">
          <Link className="button button--ghost" href="/">
            <LayoutDashboard size={17} />
            Dashboard
          </Link>
          <div className="run-state">
            <AlertTriangle size={16} />
            <span>{totalFailures} failed evaluations</span>
          </div>
        </div>
      </header>

      <section className="scenario-strip" aria-label="Bad case context">
        <div>
          <span>Review lens</span>
          <strong>Failed Prompt v1 and Prompt v2 runs are grouped by product-risk category.</strong>
        </div>
        <div>
          <span>PM job</span>
          <strong>Turn evaluator failures into prompt, policy, tool-routing, and escalation improvements.</strong>
        </div>
        <div>
          <span>Scope</span>
          <strong>Mock data only. No live customer data, external API calls, or model calls are used.</strong>
        </div>
      </section>

      <div className="badcase-grid">
        {FAILURE_CATEGORIES.map((category) => {
          const cases = groups[category];
          return (
            <section className="panel category-section" key={category}>
              <div className="category-section__header">
                <div>
                  <h2>{category}</h2>
                  <p>{CATEGORY_SUMMARIES[category]}</p>
                </div>
                <span>{cases.length} cases</span>
              </div>

              {cases.map(({ testCase, result }) => (
                <article className="badcase-card" key={`${result.promptVersionId}-${testCase.id}`}>
                  <div className="badcase-card__top">
                    <div>
                      <h3>{testCase.title}</h3>
                      <div className="badcase-card__meta">
                        <span>{result.promptVersionLabel}</span>
                        <span>{testCase.scenario}</span>
                        <span>{testCase.difficulty}</span>
                        <span>{result.overallScore} overall</span>
                        <span>{result.severity} severity</span>
                        <span>{result.latencyMs} ms</span>
                        <span>{formatCurrency(result.estimatedCost)}</span>
                      </div>
                    </div>
                    <span className="status-pill status-pill--fail">fail</span>
                  </div>

                  <div className="badcase-card__body">
                    <div className="detail-block">
                      <strong>User input</strong>
                      <p>{testCase.userInput}</p>
                    </div>
                    <div className="detail-block">
                      <strong>Agent response</strong>
                      <p>{result.agentResponse}</p>
                    </div>
                    <div className="detail-block">
                      <strong>Primary failure category</strong>
                      <p>{result.primaryFailureCategory}</p>
                    </div>
                    <div className="detail-block">
                      <strong>Secondary tags</strong>
                      <div className="tag-list">
                        {result.secondaryTags.map((tag) => (
                          <em key={tag}>{tag}</em>
                        ))}
                      </div>
                    </div>
                    <div className="detail-block">
                      <strong>Why it failed</strong>
                      <p>{result.evaluatorNotes}</p>
                    </div>
                    <div className="detail-block">
                      <strong>Severity</strong>
                      <p>{result.severity}</p>
                    </div>
                    <div className="detail-block">
                      <strong>PM decision</strong>
                      <p>{result.pmDecision}</p>
                    </div>
                    <div className="detail-block">
                      <strong>Next prompt/product change</strong>
                      <p>{result.nextPromptProductChange}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </main>
  );
}
