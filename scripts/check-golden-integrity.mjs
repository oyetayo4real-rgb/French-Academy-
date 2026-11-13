#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const jsonPath = "tests/golden/legacy-v1.json";
const shaPath = "tests/golden/legacy-v1.sha256";

function git(args, allowFailure = false) {
  try { return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trimEnd(); }
  catch (error) { if (allowFailure) return ""; throw error; }
}

function parentHadJson(commit) {
  return Boolean(git(["cat-file", "-e", commit + "^:" + jsonPath], true));
}

function main() {
  const hasJson = existsSync(jsonPath), hasSha = existsSync(shaPath);
  if (!hasJson && !hasSha) {
    console.log("SKIP: golden files have not been generated yet.");
    return;
  }
  if (!hasJson || !hasSha) throw new Error("FAIL: golden JSON and SHA file must exist together.");
  const bytes = readFileSync(jsonPath);
  const expected = (readFileSync(shaPath, "utf8").trim().match(/^[a-f0-9]{64}/i) || [])[0] || "";
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (!expected || expected.toLowerCase() !== actual) throw new Error("FAIL: legacy-v1.json does not match legacy-v1.sha256.");
  console.log("PASS: legacy-v1.json matches legacy-v1.sha256.");

  const base = process.env.GOLDEN_BASE_SHA || "";
  let commits;
  if (base && /^[a-f0-9]{40}$/i.test(base) && !/^0+$/.test(base) && git(["cat-file", "-e", base], true)) {
    commits = git(["rev-list", "--reverse", base + "..HEAD"]).split("\n").filter(Boolean);
  } else {
    commits = git(["rev-list", "--reverse", "HEAD"]).split("\n").filter(Boolean);
  }
  for (const commit of commits) {
    const files = new Set(git(["diff-tree", "--no-commit-id", "-r", "-m", "--name-only", commit]).split("\n").filter(Boolean));
    const jsonChanged = files.has(jsonPath), shaChanged = files.has(shaPath);
    if (!jsonChanged && !shaChanged) continue;
    if (!parentHadJson(commit)) continue;
    const message = git(["log", "-1", "--format=%B", commit]);
    if (!jsonChanged || !shaChanged || !message.includes("APPROVED GOLDEN UPDATE")) {
      throw new Error("FAIL: golden files changed in " + commit + " without updating both files in a commit containing APPROVED GOLDEN UPDATE.");
    }
  }
  console.log("PASS: golden-file changes update JSON and SHA together with APPROVED GOLDEN UPDATE.");
}
main();
