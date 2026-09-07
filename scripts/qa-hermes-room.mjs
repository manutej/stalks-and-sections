#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/?g=hermes-agent";
mkdirSync("/workspace/screenshots", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const isNoise = (msg) =>
  msg.includes("caret-color") || msg.includes("hydration-mismatch");
page.on("pageerror", (err) => {
  const s = String(err);
  if (!isNoise(s)) errors.push(s);
});
page.on("console", (msg) => {
  if (msg.type() === "error" && !isNoise(msg.text())) errors.push(msg.text());
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
const enter = page.getByTestId("enter-lattice");
if (await enter.count()) {
  await enter.click();
}
await page.waitForTimeout(2800);
await page.screenshot({ path: "/workspace/screenshots/hermes-lattice.png" });

const body = await page.locator("body").innerText();
const has113 = body.includes("113") || body.includes("stalks");
const hasReview =
  (await page.getByTestId("review-ledger").count()) > 0 ||
  body.includes("Terracotta") ||
  body.includes("L0 waist");
const hasViews = (await page.getByTestId("view-switch").count()) > 0;

await page.getByTestId("view-matrix").click();
await page.waitForTimeout(600);
const hasMatrix = (await page.getByTestId("matrix-view").count()) > 0;
await page.screenshot({ path: "/workspace/screenshots/hermes-matrix.png" });

await page.getByTestId("view-multiples").click();
await page.waitForTimeout(600);
const hasMultiples = (await page.getByTestId("multiples-view").count()) > 0;
await page.screenshot({ path: "/workspace/screenshots/hermes-multiples.png" });

await page.getByTestId("view-spectral").click();
await page.waitForTimeout(1800);
const hasSpectralHud = (await page.getByTestId("kernel-hud").count()) > 0;
await page.screenshot({ path: "/workspace/screenshots/hermes-spectral.png" });

await page.getByTestId("view-strata").click();
await page.waitForTimeout(400);

await page.getByPlaceholder("Search stalks").fill("run_agent");
await page.waitForTimeout(400);
await page.keyboard.press("Enter");
await page.waitForTimeout(800);

const enterRoom = page.getByTestId("enter-room").first();
const roomVisible = (await page.getByTestId("enter-room").count()) > 0;
if (roomVisible) await enterRoom.click();
await page.waitForTimeout(1500);
await page.screenshot({ path: "/workspace/screenshots/hermes-room.png" });

const after = await page.locator("body").innerText();
const inRoom = after.includes("Leave") || after.includes("Interior") || after.includes("Runtime waist");
const hud = await page.getByTestId("kernel-hud").innerText().catch(() => "");
const hasH0 = /H\s*⁰|H0|family|unique/i.test(`${hud}\n${after}`);

console.log(
  JSON.stringify(
    {
      has113,
      hasReview,
      hasViews,
      hasMatrix,
      hasMultiples,
      hasSpectralHud,
      hasH0,
      roomButton: roomVisible,
      inRoom,
      errors,
      snippet: after.slice(0, 400),
    },
    null,
    2,
  ),
);

await browser.close();
if (
  errors.length ||
  !has113 ||
  !hasReview ||
  !hasViews ||
  !hasMatrix ||
  !hasMultiples ||
  !roomVisible ||
  !inRoom
) {
  process.exit(1);
}
