import assert from "node:assert/strict";
import test from "node:test";
import {
  formatKST,
  getReportDate,
  parseDatetimeLocalString,
  toDatetimeLocalString,
} from "../lib/date/utils";

test("parseDatetimeLocalString interprets values in Asia/Seoul", () => {
  const parsed = parseDatetimeLocalString("2026-06-06T20:00");

  assert.equal(parsed.toISOString(), "2026-06-06T11:00:00.000Z");
  assert.equal(getReportDate(parsed), "2026-06-06");
});

test("datetime-local strings round-trip in Asia/Seoul", () => {
  const original = "2026-06-06T20:00";
  const parsed = parseDatetimeLocalString(original);

  assert.equal(toDatetimeLocalString(parsed), original);
  assert.equal(formatKST(parsed, "yyyy-MM-dd HH:mm"), "2026-06-06 20:00");
});

test("getReportDate keeps early-morning KST sessions on the same local day", () => {
  const parsed = parseDatetimeLocalString("2026-06-06T00:30");

  assert.equal(parsed.toISOString(), "2026-06-05T15:30:00.000Z");
  assert.equal(getReportDate(parsed), "2026-06-06");
});
