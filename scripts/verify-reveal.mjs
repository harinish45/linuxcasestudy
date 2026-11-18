// Lean check: solve question 002, confirm the terminal command reveals.
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
page.setDefaultTimeout(15000);
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

await page.goto("http://localhost:3000/practice", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const intro = page.getByTestId("boot-intro");
if (await intro.count()) {
  await intro.click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Enter");
}
await page.waitForTimeout(500);

const header = page.locator('button[aria-expanded]', { hasText: "Init a physical volume" }).first();
await header.scrollIntoViewIfNeeded();
if (!(await page.getByLabel(/Command input for/).count())) {
  await header.click({ force: true });
}
await page.waitForTimeout(400);

const input = page.getByLabel(/Command input for/).first();
await input.fill("sudo pvcreate /dev/sdb");
await input.press("Enter");
await page.waitForTimeout(800);

console.log("pass feedback:", await page.getByText("exit code 0 — correct").count());
console.log("reveal header:", await page.getByText("solved — now run it in the terminal lab").count());
console.log("revealed chip:", await page.locator("code", { hasText: "pvcreate /dev/sdb" }).count());
await page.screenshot({ path: "shots/10-answer-revealed.png" });
await browser.close();
console.log("errors:", errors.length ? errors : "none");
