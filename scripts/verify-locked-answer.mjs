// Verify: command question shows LOCKED terminal block before solving,
// and reveals the command chip after solving.
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));

await page.goto("http://localhost:3000/practice", { waitUntil: "networkidle" });

// dismiss boot intro: click to skip typing, then Enter to enter
const intro = page.getByTestId("boot-intro");
if (await intro.count()) {
  await intro.click({ position: { x: 10, y: 10 } });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
}

// open the first command-type question (filter to LVM to find one fast)
await page.getByRole("button", { name: /^lvm \d+/ }).click({ force: true });
await page.waitForTimeout(600);

// find a row that says "terminal" (unsolved command question) and open it
const rows = page.locator('button[aria-expanded="false"]', { hasText: "terminal" });
const row = rows.first();
await row.scrollIntoViewIfNeeded();
await row.click();
await page.waitForTimeout(700);

const lockedVisible = await page.getByText("terminal lab command locked").count();
const chipVisibleBefore = await page.locator("code", { hasText: "pvcreate" }).count();
console.log("locked placeholder visible:", lockedVisible > 0);
console.log("answer chip visible BEFORE solve (should be 0):", chipVisibleBefore);
await page.screenshot({ path: "shots/09-answer-locked.png" });

// ── now solve a known question and verify the chip reveals ──
const header = page.locator('button[aria-expanded]', { hasText: "Init a physical volume" }).first();
await header.scrollIntoViewIfNeeded();
const input0 = await page.getByLabel(/Command input for/).count();
if (!input0) {
  await header.click();
  await page.waitForTimeout(500);
}
const input = page.getByLabel(/Command input for/);
await input.fill("sudo pvcreate /dev/sdb");
await input.press("Enter");
await page.waitForTimeout(600);
const revealed = await page.getByText("solved — now run it in the terminal lab").count();
const chipAfter = await page.locator("code", { hasText: "pvcreate /dev/sdb" }).count();
console.log("reveal header after solve:", revealed > 0);
console.log("answer chip visible AFTER solve (should be 1):", chipAfter);
await page.screenshot({ path: "shots/10-answer-revealed.png" });
