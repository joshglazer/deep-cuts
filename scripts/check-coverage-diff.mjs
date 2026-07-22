#!/usr/bin/env node
// Fails (and, in CI, comments on the PR) unless the lines a PR actually
// added/changed are covered at COVERAGE_DIFF_THRESHOLD% or better, using
// vitest's coverage/coverage-final.json (v8 provider, Istanbul format) plus
// a `git diff` against the PR's base — unlike vitest's own
// `coverage.thresholds`, which grades the whole repo, not just the diff.
//
// Env vars (all optional, with CI-friendly defaults):
//   DIFF_BASE                 ref to diff from (default: origin/main)
//   DIFF_HEAD                 ref to diff to (default: HEAD)
//   COVERAGE_DIFF_THRESHOLD   percent required (default: 80)
//   COVERAGE_FINAL_JSON       path to coverage-final.json (default: coverage/coverage-final.json)
//   COVERAGE_SUMMARY_JSON     path to coverage-summary.json (default: coverage/coverage-summary.json)
//   GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER   set (by CI) to post/update a PR comment

import { execFileSync } from "node:child_process";
import { readFileSync, appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import istanbulLibCoverage from "istanbul-lib-coverage";
const { createFileCoverage } = istanbulLibCoverage;

const repoRoot = path.resolve(fileURLToPath(import.meta.url), "../..");

const DIFF_BASE = process.env.DIFF_BASE || "origin/main";
const DIFF_HEAD = process.env.DIFF_HEAD || "HEAD";
const THRESHOLD = Number(process.env.COVERAGE_DIFF_THRESHOLD || 80);
const COVERAGE_FINAL_JSON =
  process.env.COVERAGE_FINAL_JSON || path.join(repoRoot, "coverage/coverage-final.json");
const COVERAGE_SUMMARY_JSON =
  process.env.COVERAGE_SUMMARY_JSON || path.join(repoRoot, "coverage/coverage-summary.json");
const COMMENT_MARKER = "<!-- diff-coverage-report -->";

function parseAddedLinesByFile(diffOutput) {
  const addedLinesByFile = new Map();
  let currentFile = null;
  let newLine = 0;

  for (const line of diffOutput.split("\n")) {
    if (line.startsWith("+++ ")) {
      const filePath = line.slice(4).trim();
      currentFile = filePath === "/dev/null" ? null : filePath.replace(/^b\//, "");
      continue;
    }
    if (line.startsWith("@@")) {
      const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) newLine = Number(match[1]);
      continue;
    }
    if (currentFile === null) continue;
    if (line.startsWith("+")) {
      if (!addedLinesByFile.has(currentFile)) addedLinesByFile.set(currentFile, []);
      addedLinesByFile.get(currentFile).push(newLine);
      newLine++;
    }
    // Lines starting with "-" (deletions) don't exist in the new file, so
    // they don't advance newLine; --unified=0 means every other line here
    // is one or the other.
  }
  return addedLinesByFile;
}

function getDiffAddedLines(base, head) {
  const diffOutput = execFileSync(
    "git",
    ["diff", "--unified=0", "--diff-filter=ACMR", base, head, "--", "*.ts", "*.tsx"],
    { cwd: repoRoot, encoding: "utf-8", maxBuffer: 1024 * 1024 * 64 }
  );
  return parseAddedLinesByFile(diffOutput);
}

function loadCoverageFinal() {
  try {
    return JSON.parse(readFileSync(COVERAGE_FINAL_JSON, "utf-8"));
  } catch {
    return null;
  }
}

function loadOverallPct() {
  try {
    const summary = JSON.parse(readFileSync(COVERAGE_SUMMARY_JSON, "utf-8"));
    return summary.total?.statements?.pct;
  } catch {
    return undefined;
  }
}

function computeDiffCoverage(addedLinesByFile, coverageFinal) {
  const results = [];
  let totalCoverable = 0;
  let totalCovered = 0;

  for (const [relativePath, addedLines] of addedLinesByFile) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    const fileData = coverageFinal[absolutePath];
    if (!fileData) continue; // Outside vitest's coverage include/exclude scope.

    const lineCoverage = createFileCoverage(fileData).getLineCoverage();
    let coverable = 0;
    let covered = 0;
    const uncoveredLines = [];
    for (const lineNumber of addedLines) {
      const hits = lineCoverage[lineNumber];
      if (hits === undefined) continue; // Not a coverable line (blank/comment/type-only/etc).
      coverable++;
      if (hits > 0) {
        covered++;
      } else {
        uncoveredLines.push(lineNumber);
      }
    }
    if (coverable === 0) continue;

    results.push({ file: relativePath, covered, coverable, uncoveredLines });
    totalCoverable += coverable;
    totalCovered += covered;
  }

  results.sort((a, b) => a.file.localeCompare(b.file));
  return { results, totalCoverable, totalCovered };
}

function formatPct(covered, coverable) {
  if (coverable === 0) return "n/a";
  return `${((covered / coverable) * 100).toFixed(1)}%`;
}

function buildReport({ results, totalCoverable, totalCovered }, overallPct) {
  const lines = [COMMENT_MARKER, "## Coverage on changed lines"];

  if (totalCoverable === 0) {
    lines.push(
      "",
      "No coverable lines were added or changed in this PR — nothing to check against the " +
        `${THRESHOLD}% diff-coverage threshold.`
    );
  } else {
    const pct = (totalCovered / totalCoverable) * 100;
    const passed = pct >= THRESHOLD;
    lines.push(
      "",
      `${passed ? "✅" : "❌"} **${pct.toFixed(1)}%** of added/changed lines are covered ` +
        `(${totalCovered}/${totalCoverable}) — target: ${THRESHOLD}%`
    );

    if (results.length > 0) {
      lines.push(
        "",
        "<details><summary>Per-file breakdown</summary>",
        "",
        "| File | Covered / Coverable | % | Uncovered lines |",
        "| --- | --- | --- | --- |"
      );
      for (const r of results) {
        const uncovered =
          r.uncoveredLines.length > 0
            ? r.uncoveredLines.slice(0, 15).join(", ") +
              (r.uncoveredLines.length > 15 ? ", …" : "")
            : "—";
        lines.push(
          `| \`${r.file}\` | ${r.covered}/${r.coverable} | ${formatPct(r.covered, r.coverable)} | ${uncovered} |`
        );
      }
      lines.push("", "</details>");
    }
  }

  if (overallPct !== undefined) {
    lines.push("", `Overall repo statement coverage: ${overallPct}% (informational — not gated).`);
  }

  return lines.join("\n");
}

async function upsertPrComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const prNumber = process.env.PR_NUMBER;
  if (!token || !repository || !prNumber) {
    console.log("(Skipping PR comment — not running with GITHUB_TOKEN/GITHUB_REPOSITORY/PR_NUMBER.)");
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const commentsUrl = `https://api.github.com/repos/${repository}/issues/${prNumber}/comments`;

  const listRes = await fetch(`${commentsUrl}?per_page=100`, { headers });
  if (!listRes.ok) {
    console.error(`Failed to list PR comments: ${listRes.status} ${await listRes.text()}`);
    return;
  }
  const comments = await listRes.json();
  const existing = comments.find((c) => c.body?.includes(COMMENT_MARKER));

  const res = existing
    ? await fetch(`https://api.github.com/repos/${repository}/issues/comments/${existing.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ body }),
      })
    : await fetch(commentsUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ body }),
      });

  if (!res.ok) {
    console.error(`Failed to ${existing ? "update" : "create"} PR comment: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const coverageFinal = loadCoverageFinal();
  if (!coverageFinal) {
    console.error(
      `Could not read ${COVERAGE_FINAL_JSON} — run \`npm run test:coverage\` first.`
    );
    process.exit(1);
  }

  const addedLinesByFile = getDiffAddedLines(DIFF_BASE, DIFF_HEAD);
  const diffCoverage = computeDiffCoverage(addedLinesByFile, coverageFinal);
  const overallPct = loadOverallPct();
  const report = buildReport(diffCoverage, overallPct);

  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
  await upsertPrComment(report);

  const { totalCoverable, totalCovered } = diffCoverage;
  if (totalCoverable > 0 && (totalCovered / totalCoverable) * 100 < THRESHOLD) {
    console.error(`\nDiff coverage is below the ${THRESHOLD}% threshold.`);
    process.exit(1);
  }
}

main();
