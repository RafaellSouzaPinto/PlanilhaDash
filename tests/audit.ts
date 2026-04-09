#!/usr/bin/env tsx
/**
 * Audit script: Feature × Regras de Negócio × Testes
 * Lê resultados do vitest e cruza com features e RN do projeto.
 * Calcula % de cobertura e imprime relatório tabular.
 */

import fs from "fs";
import path from "path";

interface TestResult {
  status: "passed" | "failed" | "skipped";
  name: string;
  duration?: number;
}

interface TestSuite {
  name: string;
  status: "passed" | "failed";
  assertionResults: TestResult[];
  tests?: TestResult[]; // fallback alias
}

interface VitestReport {
  testResults?: TestSuite[];
  numPassedTests?: number;
  numFailedTests?: number;
  numTotalTests?: number;
}

// Feature × Test mapping
const FEATURE_TESTS: Record<string, string[]> = {
  "F01 — Signup":      ["signup.test.ts"],
  "F02 — Login":       ["login.test.ts"],
  "F03 — Logout":      ["logout.test.ts"],
  "F04 — API Key":     ["apiKey.test.ts", "crypto.test.ts"],
  "F05 — Upload/Parser": ["inferTypes.test.ts"],
  "F06 — AI Analyze":  ["aiAnalyze.test.ts"],
  "F07 — Reports":     ["reports.test.ts"],
  "F08 — PDF Export":  [], // client-side only, no automated test
  "F09 — Chart Engine": ["chartEngine.test.ts"],
};

// Business Rules × Test mapping
const BN_TESTS: Record<string, string[]> = {
  "RN01 — API Key nunca em log":              ["apiKey.test.ts"],
  "RN02 — API Key nunca retornada decriptada": ["apiKey.test.ts"],
  "RN03 — Sem any no TypeScript":             [], // verified by build
  "RN04 — Zod em todos endpoints":            ["signup.test.ts", "login.test.ts"],
  "RN05 — userId sempre da sessão":           ["reports.test.ts"],
  "RN06 — bcrypt custo >= 12":               ["signup.test.ts"],
  "RN07 — Ownership 403":                    ["reports.test.ts"],
  "RN08 — Máximo 4 gráficos":               ["chartEngine.test.ts"],
  "RN09 — Máximo 50 linhas para IA":        ["aiAnalyze.test.ts"],
  "RN10 — Email único (409)":               ["signup.test.ts"],
  "RN11 — Sessão criada no signup":         ["signup.test.ts"],
  "RN12 — Mensagem de erro genérica login": ["login.test.ts"],
};

function loadResults(): VitestReport {
  const resultsPath = path.join(process.cwd(), "tests", "results.json");
  if (!fs.existsSync(resultsPath)) {
    console.error("❌ tests/results.json não encontrado. Execute: npx vitest run --reporter=json");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
}

function getTests(suite: TestSuite): TestResult[] {
  return suite.assertionResults ?? suite.tests ?? [];
}

function getPassedFiles(report: VitestReport): Set<string> {
  const passed = new Set<string>();
  for (const suite of report.testResults ?? []) {
    const fileName = path.basename(suite.name);
    const tests = getTests(suite);
    const allPassed = tests.every((t) => t.status === "passed");
    if (allPassed && tests.length > 0) {
      passed.add(fileName);
    }
  }
  return passed;
}

function getFailedTests(report: VitestReport): string[] {
  const failed: string[] = [];
  for (const suite of report.testResults ?? []) {
    for (const test of getTests(suite)) {
      if (test.status === "failed") {
        failed.push(`${path.basename(suite.name)} > ${test.name}`);
      }
    }
  }
  return failed;
}

function printTable(
  title: string,
  mapping: Record<string, string[]>,
  passedFiles: Set<string>
) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${title}`);
  console.log("═".repeat(70));
  console.log(`  ${"Item".padEnd(35)} ${"Arquivos de Teste".padEnd(25)} Status`);
  console.log(`  ${"-".repeat(35)} ${"-".repeat(25)} ------`);

  let covered = 0;
  const total = Object.keys(mapping).length;

  for (const [item, files] of Object.entries(mapping)) {
    const isCovered =
      files.length === 0 ||
      files.some((f) => passedFiles.has(f));

    const fileNames = files.length === 0 ? "(n/a)" : files.join(", ");
    const status = files.length === 0 ? "✅ N/A" : isCovered ? "✅ OK" : "❌ FAIL";

    if (isCovered) covered++;

    console.log(
      `  ${item.padEnd(35)} ${fileNames.substring(0, 24).padEnd(25)} ${status}`
    );
  }

  const pct = Math.round((covered / total) * 100);
  console.log(`\n  Cobertura: ${covered}/${total} (${pct}%)`);
  return { covered, total, pct };
}

function main() {
  console.log("\n🔍 AUDITORIA PLANILHADASH — Feature × RN × Testes");
  console.log(`   Executado em: ${new Date().toLocaleString("pt-BR")}\n`);

  const report = loadResults();
  const passedFiles = getPassedFiles(report);
  const failedTests = getFailedTests(report);

  // Raw test numbers
  const passed = report.numPassedTests ?? 0;
  const failed = report.numFailedTests ?? 0;
  const total = report.numTotalTests ?? 0;

  console.log(`  📊 Testes: ${passed} passando, ${failed} falhando, ${total} total`);

  if (failedTests.length > 0) {
    console.log("\n  ❌ Testes com falha:");
    for (const t of failedTests) {
      console.log(`     • ${t}`);
    }
  }

  const featureResult = printTable("FEATURES", FEATURE_TESTS, passedFiles);
  const rnResult = printTable("REGRAS DE NEGÓCIO", BN_TESTS, passedFiles);

  const overallPct = Math.round(
    ((featureResult.covered + rnResult.covered) /
      (featureResult.total + rnResult.total)) *
      100
  );

  console.log(`\n${"═".repeat(70)}`);
  console.log(`  RESULTADO FINAL: ${overallPct}%`);

  if (overallPct === 100 && failed === 0) {
    console.log("  ✅ 100% — Todos os testes passando! Sistema validado.");
  } else {
    console.log(
      `  ⚠️  ${100 - overallPct}% de gap — ${failed} teste(s) falhando.`
    );
    console.log("  Corrija as falhas acima e execute novamente.");
  }
  console.log("═".repeat(70) + "\n");

  // Exit with error code if not 100%
  if (failed > 0 || overallPct < 100) {
    process.exit(1);
  }
}

main();
