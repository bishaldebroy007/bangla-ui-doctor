import { chromium } from "playwright";
import { spawn } from "child_process";

const VIEWPORTS = [
  { name: "Mobile XS (iPhone SE 1st)", width: 320, height: 568 },
  { name: "Mobile S (Galaxy S8 / Android)", width: 360, height: 740 },
  { name: "Mobile M (iPhone SE 2/3)", width: 375, height: 667 },
  { name: "Mobile (iPhone 12/13/14)", width: 390, height: 844 },
  { name: "Mobile L (iPhone 14 Pro Max)", width: 428, height: 926 },
  { name: "Tablet Portrait (iPad)", width: 768, height: 1024 },
  { name: "Tablet Landscape (iPad)", width: 1024, height: 768 },
  { name: "Laptop (13-inch)", width: 1280, height: 800 },
  { name: "Desktop (Standard 1080p)", width: 1440, height: 900 },
  { name: "Desktop Large (Full HD)", width: 1920, height: 1080 },
];

async function waitForServer(url: string, timeoutMs = 20000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 200) return true;
    } catch {
      // Wait a bit
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log("🚀 Starting Next.js production server on port 3000...");
  const server = spawn("bun", ["run", "start", "-p", "3000"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3000" },
  });

  const serverReady = await waitForServer("http://localhost:3000");
  if (!serverReady) {
    console.error("❌ Next.js server failed to start within timeout.");
    server.kill();
    process.exit(1);
  }

  console.log("✅ Next.js server is ready. Launching headless browser...");
  const browser = await chromium.launch({ headless: true });
  let failures = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      // Test 1: Home Page
      await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
      const homeOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      if (homeOverflow.hasOverflow) {
        console.error(
          `❌ [Home] Horizontal overflow at ${vp.name}: scrollWidth=${homeOverflow.scrollWidth} > innerWidth=${homeOverflow.clientWidth}`
        );
        failures++;
      } else {
        console.log(
          `  ✓ [Home] Zero horizontal overflow (${homeOverflow.scrollWidth}px / ${homeOverflow.clientWidth}px)`
        );
      }

      // Test 2: Scan Report Page
      await page.goto("http://localhost:3000/scan?fixture=problematic", {
        waitUntil: "networkidle",
      });
      const reportOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      if (reportOverflow.hasOverflow) {
        console.error(
          `❌ [Report] Horizontal overflow at ${vp.name}: scrollWidth=${reportOverflow.scrollWidth} > innerWidth=${reportOverflow.clientWidth}`
        );
        failures++;
      } else {
        console.log(
          `  ✓ [Report] Zero horizontal overflow (${reportOverflow.scrollWidth}px / ${reportOverflow.clientWidth}px)`
        );
      }

      // Test 3: Open Finding Inspector Drawer
      const firstFinding = page.locator("button:has-text('U+FFFD')").first();
      if ((await firstFinding.count()) > 0) {
        await firstFinding.click();
        await page.waitForTimeout(300);
        const drawerOverflow = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: window.innerWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          };
        });

        if (drawerOverflow.hasOverflow) {
          console.error(
            `❌ [Drawer] Horizontal overflow when drawer opened at ${vp.name}: scrollWidth=${drawerOverflow.scrollWidth} > innerWidth=${drawerOverflow.clientWidth}`
          );
          failures++;
        } else {
          console.log(`  ✓ [Drawer] Opened smoothly with zero overflow`);
        }

        // Close drawer
        const closeBtn = page.locator("button[aria-label='Close inspector']");
        if ((await closeBtn.count()) > 0) {
          await closeBtn.click();
          await page.waitForTimeout(200);
        }
      }

      // Test 4: Viewport simulator switcher buttons
      const tabletTab = page.locator("button:has-text('Tablet')").first();
      if ((await tabletTab.count()) > 0) {
        await tabletTab.click();
        await page.waitForTimeout(200);
      }

      await context.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  if (failures > 0) {
    console.error(`\n❌ Total responsiveness test failures: ${failures}`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${VIEWPORTS.length} VIEWPORTS PASSED WITH ZERO RESPONSIVE DEFECTS!`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
