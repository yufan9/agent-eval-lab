"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wrench,
  XCircle
} from "lucide-react";
import {
  DIFFICULTIES,
  FAILURE_CATEGORIES,
  PROMPT_VERSIONS,
  SCENARIOS,
  STORAGE_KEY,
  buildRunSummary,
  comparePromptVersions,
  computeMetrics,
  createSeedRunHistory,
  evaluateSuite,
  formatCurrency,
  formatPercent,
  formatScore,
  getExecutiveSummary,
  supportTestCases
} from "../lib/evaluation";

const TOOL_OPTIONS = [
  "policy_lookup",
  "account_management",
  "billing_dispute",
  "billing_lookup",
  "identity_verification",
  "privacy_request",
  "human_escalation",
  "security_escalation",
  "none"
];

const emptyForm = {
  title: "",
  scenario: "Refund policy",
  difficulty: "Medium",
  userInput: "",
  expectedBehavior: "",
  forbiddenBehavior: "",
  expectedTool: "policy_lookup"
};

function MetricCard({ icon: Icon, label, value, caption, tone = "neutral" }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function StatusPill({ status }) {
  const Icon = status === "pass" ? CheckCircle2 : XCircle;
  return (
    <span className={`status-pill status-pill--${status}`}>
      <Icon size={15} />
      {status}
    </span>
  );
}

function PanelHeader({ eyebrow, title, icon: Icon }) {
  return (
    <div className="panel__header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <Icon size={20} aria-hidden="true" />
    </div>
  );
}

function makeRubric(form) {
  return {
    taskSuccess: "Satisfies the user input and expected behavior.",
    factuality: "Does not invent policy, billing, privacy, or account details.",
    toolUse: `Uses ${form.expectedTool} only when the task requires it.`,
    safety: "Avoids the forbidden behavior and protects sensitive data.",
    uxQuality: "Clear, empathetic, and action-oriented for support."
  };
}

export default function Home() {
  const seededRunHistory = useMemo(() => createSeedRunHistory(supportTestCases), []);
  const [testCases, setTestCases] = useState(supportTestCases);
  const [activePromptVersion, setActivePromptVersion] = useState("v2");
  const [selectedScenario, setSelectedScenario] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [runStatus, setRunStatus] = useState("idle");
  const [lastRunAt, setLastRunAt] = useState(seededRunHistory[0].completedAt);
  const [runHistory, setRunHistory] = useState(seededRunHistory);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (storedValue) {
      try {
        const stored = JSON.parse(storedValue);
        if (Array.isArray(stored.testCases)) {
          setTestCases(stored.testCases);
        }
        if (stored.activePromptVersion) {
          setActivePromptVersion(stored.activePromptVersion);
        }
        if (stored.lastRunAt) {
          setLastRunAt(stored.lastRunAt);
        }
        if (Array.isArray(stored.runHistory) && stored.runHistory.length > 0) {
          setRunHistory(stored.runHistory);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ testCases, activePromptVersion, lastRunAt, runHistory })
    );
  }, [activePromptVersion, hasHydrated, lastRunAt, runHistory, testCases]);

  const activeResults = useMemo(
    () => evaluateSuite(testCases, activePromptVersion),
    [activePromptVersion, testCases]
  );
  const resultMap = useMemo(
    () => new Map(activeResults.map((result) => [result.testCaseId, result])),
    [activeResults]
  );
  const metrics = useMemo(() => computeMetrics(activeResults), [activeResults]);
  const comparison = useMemo(() => comparePromptVersions(testCases), [testCases]);
  const executiveSummary = useMemo(() => getExecutiveSummary(comparison), [comparison]);

  const filteredCases = useMemo(() => {
    return testCases.filter((testCase) => {
      const scenarioMatch =
        selectedScenario === "All" || testCase.scenario === selectedScenario;
      const difficultyMatch =
        selectedDifficulty === "All" || testCase.difficulty === selectedDifficulty;
      return scenarioMatch && difficultyMatch;
    });
  }, [selectedDifficulty, selectedScenario, testCases]);

  const promptVersion = PROMPT_VERSIONS.find((version) => version.id === activePromptVersion);
  const baseline = comparison.find((item) => item.version.id === "v1")?.metrics;
  const improved = comparison.find((item) => item.version.id === "v2")?.metrics;
  const comparisonRows = [
    {
      label: "Pass Rate",
      key: "passRate",
      format: formatPercent,
      higherIsBetter: true
    },
    {
      label: "Mock Hallucination Rate",
      key: "hallucinationRate",
      format: formatPercent,
      higherIsBetter: false
    },
    {
      label: "Tool-use Rubric Score",
      key: "toolUseAccuracy",
      format: formatPercent,
      higherIsBetter: true
    },
    {
      label: "Safety Issue Rate",
      key: "safetyIssueRate",
      format: formatPercent,
      higherIsBetter: false
    },
    {
      label: "Simulated Latency",
      key: "averageLatency",
      format: (value) => `${Math.round(value)} ms`,
      higherIsBetter: false
    },
    {
      label: "Estimated Mock Cost",
      key: "averageCost",
      format: formatCurrency,
      higherIsBetter: false
    }
  ];

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addTestCase(event) {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.userInput.trim() ||
      !form.expectedBehavior.trim() ||
      !form.forbiddenBehavior.trim()
    ) {
      return;
    }

    const nextCase = {
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      scenario: form.scenario,
      difficulty: form.difficulty,
      userInput: form.userInput.trim(),
      expectedBehavior: form.expectedBehavior.trim(),
      forbiddenBehavior: form.forbiddenBehavior.trim(),
      expectedTool: form.expectedTool,
      secondaryTags: [],
      rubric: makeRubric(form)
    };

    setTestCases((current) => [nextCase, ...current]);
    setForm(emptyForm);
  }

  function runSuite() {
    setRunStatus("running");
    window.setTimeout(() => {
      const completedAt = new Date().toISOString();
      const runSummary = buildRunSummary({
        id: `run-${Date.now()}`,
        label: "Manual suite run",
        promptVersionId: activePromptVersion,
        results: activeResults,
        completedAt
      });
      setLastRunAt(completedAt);
      setRunHistory((current) => [runSummary, ...current].slice(0, 6));
      setRunStatus("completed");
    }, 520);
  }

  function resetWorkspace() {
    setTestCases(supportTestCases);
    setActivePromptVersion("v2");
    setSelectedScenario("All");
    setSelectedDifficulty("All");
    const nextHistory = createSeedRunHistory(supportTestCases);
    setRunHistory(nextHistory);
    setLastRunAt(nextHistory[0].completedAt);
    setRunStatus("idle");
  }

  const lastRunLabel =
    runStatus === "running"
      ? "Running suite"
      : new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }).format(new Date(lastRunAt));

  const maxFailureCount = Math.max(
    1,
    ...Object.values(metrics.failureDistribution)
  );

  const insightText =
    baseline && improved
      ? `Prompt v2 lifts pass rate by ${Math.round(
          improved.passRate - baseline.passRate
        )} points and cuts hallucination by ${Math.round(
          baseline.hallucinationRate - improved.hallucinationRate
        )} points, while adding ${Math.round(
          improved.averageLatency - baseline.averageLatency
        )} ms and ${formatCurrency(improved.averageCost - baseline.averageCost)} per case. The PM trade-off is worthwhile for high-risk support flows, but low-risk FAQ traffic could use a lighter prompt.`
      : "Prompt comparison is available after the deterministic suite is evaluated.";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-lockup__mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <div className="brand-lockup__copy">
            <span>Customer Support Agent Evaluation</span>
            <h1>AI PM Evaluation Dashboard</h1>
          </div>
        </div>
        <div className="topbar__actions">
          <Link className="button button--ghost" href="/bad-cases">
            <FileText size={17} />
            Bad cases
          </Link>
          <Link className="button button--ghost" href="/case-study">
            <FileText size={17} />
            Case study
          </Link>
          <div className="run-state">
            <Activity size={16} />
            <span>
              {runStatus === "running"
                ? "Status: running"
                : `Status: ${runStatus} · latest ${lastRunLabel}`}
            </span>
          </div>
          <button className="button button--ghost" type="button" onClick={resetWorkspace}>
            <RotateCcw size={17} />
            Reset
          </button>
          <button
            className="button button--primary"
            type="button"
            onClick={runSuite}
            disabled={runStatus === "running"}
          >
            <Play size={17} />
            {runStatus === "running" ? "Evaluating..." : "Run suite"}
          </button>
        </div>
      </header>

      <section className="executive-summary" aria-label="Executive summary">
        <div className="executive-summary__main">
          <span>Executive Summary</span>
          <div className="executive-summary__title">
            <h2>{executiveSummary.headline}</h2>
            <strong className={`launch-badge launch-badge--${executiveSummary.recommendation.toLowerCase().replaceAll(" ", "-")}`}>
              {executiveSummary.recommendation}
            </strong>
          </div>
          <p>
            Prompt v2 is recommended for limited rollout. It improves pass rate and reduces hallucination/safety failures, but increases latency and estimated cost.
          </p>
          <p>
            Recommended next step: ship to low-risk support queues first and continue iterating on escalation cases.
          </p>
        </div>
        <div className="summary-grid">
          <div>
            <span>Quality lift</span>
            <strong>{executiveSummary.qualityLift}</strong>
          </div>
          <div>
            <span>Risk reduction</span>
            <strong>{executiveSummary.riskReduction}</strong>
          </div>
          <div>
            <span>Cost and latency trade-off</span>
            <strong>{executiveSummary.tradeOff}</strong>
          </div>
          <div>
            <span>PM decision</span>
            <strong>{executiveSummary.pmDecision}</strong>
          </div>
        </div>
      </section>

      <section className="scenario-strip" aria-label="Project context">
        <div>
          <span>Product problem</span>
          <strong>Support leaders need to know whether an AI agent can resolve real customer issues without policy drift, unsafe handling, or bad tool routing.</strong>
        </div>
        <div>
          <span>Default suite</span>
          <strong>{testCases.length} support test cases across policy, billing, account, privacy, safety, and escalation workflows.</strong>
        </div>
        <div>
          <span>Active prompt</span>
          <strong>{promptVersion?.label}: {promptVersion?.summary}</strong>
        </div>
      </section>

      <section className="metrics-grid metrics-grid--eight" aria-label="Evaluation metrics">
        <MetricCard
          icon={CheckCircle2}
          label="Pass Rate"
          value={formatPercent(metrics.passRate)}
          caption={`${metrics.passed}/${metrics.total} cases passing`}
          tone="green"
        />
        <MetricCard
          icon={Gauge}
          label="Average Score"
          value={formatScore(metrics.averageScore)}
          caption="weighted rubric score"
          tone="blue"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Mock Hallucination Rate"
          value={formatPercent(metrics.hallucinationRate)}
          caption="mock evaluator flags factuality/policy failures"
          tone="rose"
        />
        <MetricCard
          icon={Wrench}
          label="Tool-use Rubric Score"
          value={formatPercent(metrics.toolUseAccuracy)}
          caption="rubric-based score, not live tool telemetry"
          tone="violet"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Safety Issue Rate"
          value={formatPercent(metrics.safetyIssueRate)}
          caption="privacy, credential, legal, medical"
          tone="green"
        />
        <MetricCard
          icon={Clock3}
          label="Simulated Latency"
          value={`${Math.round(metrics.averageLatency)} ms`}
          caption="deterministic mock agent plus evaluator"
          tone="blue"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Estimated Mock Cost"
          value={formatCurrency(metrics.averageCost)}
          caption="mock token estimate per case"
          tone="amber"
        />
        <MetricCard
          icon={BarChart3}
          label="Failures"
          value={String(metrics.failed)}
          caption="latest deterministic suite"
          tone="rose"
        />
      </section>

      <div className="workspace-grid">
        <aside className="panel panel--form">
          <PanelHeader eyebrow="Create" title="Test Case" icon={ListChecks} />
          <form className="case-form" onSubmit={addTestCase}>
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Refund exception for annual renewal"
              />
            </label>
            <div className="form-pair">
              <label>
                Scenario
                <select
                  value={form.scenario}
                  onChange={(event) => updateForm("scenario", event.target.value)}
                >
                  {SCENARIOS.map((scenario) => (
                    <option key={scenario}>{scenario}</option>
                  ))}
                </select>
              </label>
              <label>
                Difficulty
                <select
                  value={form.difficulty}
                  onChange={(event) => updateForm("difficulty", event.target.value)}
                >
                  {DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              User input
              <textarea
                value={form.userInput}
                onChange={(event) => updateForm("userInput", event.target.value)}
                placeholder="The customer message the agent receives."
                rows={4}
              />
            </label>
            <label>
              Expected behavior
              <textarea
                value={form.expectedBehavior}
                onChange={(event) => updateForm("expectedBehavior", event.target.value)}
                placeholder="What a good support response should do."
                rows={4}
              />
            </label>
            <label>
              Forbidden behavior
              <textarea
                value={form.forbiddenBehavior}
                onChange={(event) => updateForm("forbiddenBehavior", event.target.value)}
                placeholder="What must never appear in the response."
                rows={3}
              />
            </label>
            <label>
              Expected tool
              <select
                value={form.expectedTool}
                onChange={(event) => updateForm("expectedTool", event.target.value)}
              >
                {TOOL_OPTIONS.map((tool) => (
                  <option key={tool}>{tool}</option>
                ))}
              </select>
            </label>
            <button className="button button--primary button--wide" type="submit">
              <Plus size={17} />
              Add test
            </button>
          </form>
        </aside>

        <section className="panel panel--suite">
          <PanelHeader eyebrow="Suite" title="Customer Support Test Cases" icon={LayoutDashboard} />
          <div className="suite-controls">
            <div className="segmented-control" aria-label="Prompt version">
              {PROMPT_VERSIONS.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  className={activePromptVersion === version.id ? "is-active" : ""}
                  onClick={() => setActivePromptVersion(version.id)}
                >
                  {version.label}
                </button>
              ))}
            </div>
            <div className="filter-row">
              <select
                value={selectedScenario}
                onChange={(event) => setSelectedScenario(event.target.value)}
                aria-label="Filter by scenario"
              >
                <option>All</option>
                {SCENARIOS.map((scenario) => (
                  <option key={scenario}>{scenario}</option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(event) => setSelectedDifficulty(event.target.value)}
                aria-label="Filter by difficulty"
              >
                <option>All</option>
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty}>{difficulty}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="case-list">
            {filteredCases.map((testCase) => {
              const result = resultMap.get(testCase.id);
              return (
                <article className="case-row" key={testCase.id}>
                  <div className="case-row__main">
                    <div className="case-row__title">
                      <h3>{testCase.title}</h3>
                      <span>{testCase.scenario}</span>
                      <span>{testCase.difficulty}</span>
                    </div>
                    <p>{testCase.userInput}</p>
                    <div className="case-row__details">
                      <strong>Expected:</strong> {testCase.expectedBehavior}
                    </div>
                    <div className="keyword-list" aria-label="Rubric dimensions">
                      {Object.keys(testCase.rubric).map((rubricKey) => (
                        <span key={rubricKey}>{rubricKey.replace(/([A-Z])/g, " $1")}</span>
                      ))}
                    </div>
                  </div>
                  <div className="case-row__meta">
                    <StatusPill status={result.status} />
                    <strong>{result.overallScore}</strong>
                    <span>{result.failureCategory}</span>
                    <div className="tag-list tag-list--compact">
                      {result.secondaryTags.slice(0, 3).map((tag) => (
                        <em key={tag}>{tag}</em>
                      ))}
                    </div>
                    <span>{result.latencyMs} ms</span>
                    <span>{formatCurrency(result.estimatedCost)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel panel--failures">
          <PanelHeader eyebrow="Quality" title="Failure Category Distribution" icon={BarChart3} />
          <div className="failure-list">
            {FAILURE_CATEGORIES.map((category) => {
              const count = metrics.failureDistribution[category];
              return (
                <div className="failure-row" key={category}>
                  <div>
                    <span>{category}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="failure-row__bar" aria-hidden="true">
                    <span style={{ width: `${(count / maxFailureCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link className="text-link" href="/bad-cases">
            Review failed cases
            <ArrowRight size={15} />
          </Link>
        </section>

        <section className="panel panel--results">
          <PanelHeader eyebrow="Evaluator" title="Latest Results" icon={Activity} />
          <div className="result-table" role="table" aria-label="Latest evaluation results">
            <div className="result-table__head" role="row">
              <span>Case</span>
              <span>Status</span>
              <span>Overall</span>
              <span>Task</span>
              <span>Fact</span>
              <span>Tool</span>
              <span>Safety</span>
              <span>UX</span>
              <span>Failure</span>
              <span>Tags</span>
            </div>
            {activeResults.map((result) => {
              const testCase = testCases.find((item) => item.id === result.testCaseId);
              return (
                <div className="result-table__row" role="row" key={result.testCaseId}>
                  <span>{testCase?.title}</span>
                  <span>
                    <StatusPill status={result.status} />
                  </span>
                  <span>{result.overallScore}</span>
                  <span>{result.taskSuccessScore}</span>
                  <span>{result.factualityScore}</span>
                  <span>{result.toolUseScore}</span>
                  <span>{result.safetyScore}</span>
                  <span>{result.uxQualityScore}</span>
                  <span>{result.failureCategory}</span>
                  <span>{result.secondaryTags.join(", ") || "-"}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel panel--comparison">
          <PanelHeader eyebrow="Experiment" title="Prompt Version Comparison" icon={BarChart3} />
          <div className="comparison-layout">
            <div className="comparison-table" role="table" aria-label="Prompt comparison table">
              <div className="comparison-table__head" role="row">
                <span>Metric</span>
                <span>Prompt v1</span>
                <span>Prompt v2</span>
                <span>Delta</span>
              </div>
              {comparisonRows.map((row) => {
                const v1 = baseline?.[row.key] || 0;
                const v2 = improved?.[row.key] || 0;
                const delta = v2 - v1;
                const isGood = row.higherIsBetter ? delta >= 0 : delta <= 0;
                return (
                  <div className="comparison-table__row" role="row" key={row.key}>
                    <span>{row.label}</span>
                    <span>{row.format(v1)}</span>
                    <span>{row.format(v2)}</span>
                    <span className={isGood ? "delta-good" : "delta-watch"}>
                      {delta > 0 ? "+" : ""}
                      {row.key === "averageCost"
                        ? formatCurrency(delta)
                        : row.key === "averageLatency"
                          ? `${Math.round(delta)} ms`
                          : `${Math.round(delta)} pts`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="comparison-chart" aria-label="Prompt comparison chart">
              {comparisonRows.map((row) => {
                const v1 = baseline?.[row.key] || 0;
                const v2 = improved?.[row.key] || 0;
                const max = Math.max(1, v1, v2);
                return (
                  <div className="chart-row" key={row.key}>
                    <span>{row.label}</span>
                    <div className="chart-bars">
                      <i className="chart-bars__v1" style={{ width: `${(v1 / max) * 100}%` }} />
                      <i className="chart-bars__v2" style={{ width: `${(v2 / max) * 100}%` }} />
                    </div>
                    <strong>{row.format(v2)}</strong>
                  </div>
                );
              })}
              <div className="chart-legend">
                <span><i className="legend-v1" />Prompt v1</span>
                <span><i className="legend-v2" />Prompt v2</span>
              </div>
            </div>
          </div>
          <div className="product-insight">
            <span>Product Insight</span>
            <p>{insightText}</p>
          </div>
        </section>

        <section className="panel panel--history">
          <PanelHeader eyebrow="Runs" title="Run History" icon={Activity} />
          <div className="run-history">
            {runHistory.map((run) => (
              <article className="run-card" key={run.id}>
                <div>
                  <strong>{run.label}</strong>
                  <span>{run.promptVersionLabel}</span>
                </div>
                <div>
                  <span>Pass rate</span>
                  <strong>{formatPercent(run.passRate)}</strong>
                </div>
                <div>
                  <span>Safety issue rate</span>
                  <strong>{formatPercent(run.safetyIssueRate)}</strong>
                </div>
                <div>
                  <span>Simulated latency</span>
                  <strong>{Math.round(run.averageLatency)} ms</strong>
                </div>
                <div>
                  <span>Estimated cost</span>
                  <strong>{formatCurrency(run.averageCost)}</strong>
                </div>
                <strong className={`launch-badge launch-badge--${run.launchRecommendation.toLowerCase().replaceAll(" ", "-")}`}>
                  {run.launchRecommendation}
                </strong>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
