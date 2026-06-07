import fs from "node:fs";
import path from "node:path";

const appOrigin = "http://localhost:3000";
const cdpOrigin = "http://127.0.0.1:9222";
const outDir = "/tmp/time-tracker-cdp-shots";

fs.mkdirSync(outDir, { recursive: true });

async function getPageWebSocketUrl() {
  const response = await fetch(
    `${cdpOrigin}/json/new?${encodeURIComponent("about:blank")}`,
    { method: "PUT" }
  );

  if (!response.ok) {
    throw new Error("Chrome DevTools Protocol is not available on port 9222.");
  }

  const target = await response.json();

  if (!target.webSocketDebuggerUrl) {
    throw new Error("Chrome did not expose a page websocket URL.");
  }

  return target.webSocketDebuggerUrl;
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (!message.id || !pending.has(message.id)) {
      return;
    }

    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) {
      reject(new Error(JSON.stringify(message.error)));
      return;
    }

    resolve(message.result);
  });

  return {
    close() {
      ws.close();
    },
    send(method, params = {}) {
      const messageId = ++id;
      ws.send(JSON.stringify({ id: messageId, method, params }));

      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
      });
    },
  };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime exception");
  }

  return result.result.value;
}

async function waitFor(cdp, expression, label, timeoutMs = 15_000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const value = await evaluate(cdp, expression).catch(() => false);

    if (value) {
      return value;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const url = await evaluate(cdp, "location.href").catch(() => "unknown");
  const text = await evaluate(
    cdp,
    "document.body?.innerText?.slice(0, 500)"
  ).catch(() => "");

  throw new Error(`Timed out waiting for ${label}. url=${url} text=${text}`);
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitFor(
    cdp,
    "document.readyState === 'complete' || document.readyState === 'interactive'",
    `load ${url}`
  );
}

async function setValue(cdp, selector, value) {
  const didSet = await evaluate(
    cdp,
    `(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!input) return false;
      input.focus();
      input.value = ${JSON.stringify(value)};
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()`
  );

  if (!didSet) {
    throw new Error(`Input not found: ${selector}`);
  }
}

async function clickText(cdp, text) {
  const didClick = await evaluate(
    cdp,
    `(() => {
      const element = Array.from(document.querySelectorAll("button,a")).find(
        (node) => node.textContent?.includes(${JSON.stringify(text)})
      );
      if (!element) return false;
      element.click();
      return true;
    })()`
  );

  if (!didClick) {
    throw new Error(`Clickable text not found: ${text}`);
  }
}

async function screenshot(cdp, name) {
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const file = path.join(outDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(shot.data, "base64"));
  return file;
}

async function main() {
  const cdp = await connect(await getPageWebSocketUrl());
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Network.clearBrowserCookies");
  await cdp.send("Storage.clearDataForOrigin", {
    origin: appOrigin,
    storageTypes: "all",
  });

  const stamp = Date.now();
  const ownerEmail = `owner-${stamp}@example.com`;
  const memberEmail = `member-${stamp}@example.com`;
  const password = "password123";

  await navigate(cdp, `${appOrigin}/login`);
  await waitFor(cdp, "Boolean(document.querySelector('input[name=email]'))", "dev login form");
  await setValue(cdp, "input[name=email]", ownerEmail);
  await setValue(cdp, "input[name=password]", password);
  await clickText(cdp, "가입");
  await waitFor(cdp, "location.pathname === '/onboarding'", "owner onboarding", 20_000);

  await setValue(cdp, "input[name=familyName]", "Local QA Family");
  await setValue(cdp, "input[name=child1Name]", "운동");
  await setValue(cdp, "input[name=child1Target]", "60");
  await setValue(cdp, "input[name=child2Name]", "독서");
  await setValue(cdp, "input[name=child2Target]", "60");
  await screenshot(cdp, "01-onboarding-filled");
  await clickText(cdp, "시작하기");
  await waitFor(cdp, "location.pathname === '/dashboard'", "owner dashboard", 20_000);
  await waitFor(
    cdp,
    "document.body.innerText.includes('운동') && document.body.innerText.includes('독서')",
    "dashboard trackers"
  );
  await screenshot(cdp, "02-dashboard-owner");

  await navigate(cdp, `${appOrigin}/settings`);
  await waitFor(cdp, "document.body.innerText.includes('공동 관리')", "settings");
  await setValue(cdp, "input[name=email]", memberEmail);
  await clickText(cdp, "초대 링크 만들기");
  const inviteUrl = await waitFor(
    cdp,
    `(() => {
      const match = document.body.innerText.match(/https?:\\/\\/[^\\s]+\\/invite\\/[a-f0-9]+/);
      return match?.[0] || false;
    })()`,
    "invite URL",
    20_000
  );
  await screenshot(cdp, "03-settings-invite");

  await cdp.send("Network.clearBrowserCookies");
  await cdp.send("Storage.clearDataForOrigin", {
    origin: appOrigin,
    storageTypes: "all",
  });

  await navigate(cdp, inviteUrl);
  await waitFor(
    cdp,
    "location.pathname === '/login' && location.search.includes('next=')",
    "invite login redirect",
    10_000
  );
  await setValue(cdp, "input[name=email]", memberEmail);
  await setValue(cdp, "input[name=password]", password);
  await clickText(cdp, "가입");
  await waitFor(cdp, "location.pathname.startsWith('/invite/')", "member invite page", 20_000);
  await screenshot(cdp, "04-invite-member");
  await clickText(cdp, "참여하기");
  await waitFor(cdp, "location.pathname === '/dashboard'", "member dashboard", 20_000);
  await waitFor(
    cdp,
    "document.body.innerText.includes('운동') && document.body.innerText.includes('독서')",
    "member sees family trackers"
  );
  await screenshot(cdp, "05-dashboard-member");

  const finalUrl = await evaluate(cdp, "location.href");
  cdp.close();

  console.log(
    JSON.stringify(
      {
        ownerEmail,
        memberEmail,
        inviteUrl,
        finalUrl,
        screenshots: fs
          .readdirSync(outDir)
          .sort()
          .map((name) => path.join(outDir, name)),
      },
      null,
      2
    )
  );
}

await main();
