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
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/hermes-lattice.png" });

const body = await page.locator("body").innerText();
const has113 = body.includes("113") || body.includes("stalks");
const hasReview =
  (await page.getByTestId("review-ledger").count()) > 0 ||
  body.includes("Terracotta") ||
  body.includes("L0 waist");
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

console.log(
  JSON.stringify(
    {
      has113,
      hasReview,
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
if (errors.length || !has113 || !hasReview || !roomVisible || !inRoom) process.exit(1);
