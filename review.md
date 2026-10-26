# Code Review — Gautham D N Portfolio & Digital Twin

**Reviewed:** 25 October 2026
**Scope:** Full project (`app/`, configuration, dependencies, git state, deployed repository)
**Status of code:** No changes were made. This document records findings and recommended remedial actions only.

---

## 1. Executive Summary

The project is a well-structured, small Next.js 16 application with a clean build, no type errors, no lint errors, and no dependency vulnerabilities. The visual design system is coherent and the AI chat integration follows the correct security pattern of keeping the OpenAI key server-side.

However, the review found **one critical privacy issue** and **three high-severity issues** that should be addressed before this is treated as a public, production-facing personal brand site.

| Severity | Count | Theme |
| --- | --- | --- |
| Critical | 1 | Personal contact data published in a public repository |
| High | 3 | API cost abuse, unbounded request body, keyboard accessibility |
| Medium | 10 | Error semantics, resilience, performance, SEO, dialog accessibility |
| Low | 14 | Hygiene, naming, readability, project conventions |

The single most urgent action is removing `LinkedinProfile.pdf` from the public GitHub repository and rotating nothing else — the API key was never committed, which was verified.

### Verified baseline (what is already healthy)

These were run as part of the review and all passed:

```
npx tsc --noEmit                  → exit 0, no type errors
npm run lint                      → exit 0, no ESLint warnings or errors
npm audit                         → found 0 vulnerabilities
git log --all -- .env             → empty (the API key was never committed)
git log --all -p | grep 'sk-...'  → no key-like strings anywhere in history
```

---

## 2. Critical Findings

### C1. Personal mobile number and email are published in a public GitHub repository

**Location:** `LinkedinProfile.pdf` (repository root, tracked in git)

**Evidence:**

```
$ git ls-files
...
LinkedinProfile.pdf          ← tracked

$ git log --oneline -- LinkedinProfile.pdf
334fb48 Initial commit       ← committed and pushed

$ curl -s https://api.github.com/repos/gauthamdn/site
"private": false
"visibility": "public"
```

The PDF contains the personal mobile number `9886025498`, the personal email address, and the full employment history. It was committed in the initial commit and pushed to `https://github.com/gauthamdn/site.git`, which is publicly readable. It is also the *source* document for the site, so it has no reason to ship with the code.

**Impact:** The mobile number is scrapeable by anyone, including automated harvesters. Removing the file from the current commit is not sufficient — git history retains it, and GitHub will continue to serve the blob from the commit.

**Remedial action (in priority order):**

1. Stop tracking the file and ignore it:

   ```bash
   git rm --cached LinkedinProfile.pdf
   printf '\n# Source documents containing personal data\nLinkedinProfile.pdf\n*.pdf\n' >> .gitignore
   git commit -m "Remove personal source document from version control"
   ```

2. Purge it from history. The repository has a single relevant commit, so this is low-risk:

   ```bash
   # Preferred: git-filter-repo
   git filter-repo --invert-paths --path LinkedinProfile.pdf --force
   git push origin main --force
   ```

3. After the force-push, **contact GitHub Support to purge cached views**, because forks and the commit cache can still expose the blob.

4. Consider whether the repository needs to be public at all. If it does, treat the repository root as a publishing surface and keep source material in a sibling directory outside the repo.

**Note:** The site itself intentionally publishes `gauthamdn@gmail.com` in the contact section, which is a deliberate choice and is acceptable. The phone number is not published on the site and should not be in the repository either.

---

## 3. High-Severity Findings

### H1. The chat API has no rate limiting, so anyone can spend the OpenAI budget

**Location:** `app/api/chat/route.ts` (entire `POST` handler)

**Evidence:** There is no throttling, quota, session check, origin check, or bot protection anywhere in the route. Any client that can reach the site can call `POST /api/chat` in a loop. This is not theoretical — during development the OpenAI account already hit `429 credit_balance_exhausted`, which demonstrates how quickly the budget is consumed.

Cost per request is bounded at **700 output tokens** (`route.ts:130`), which is good, but the *number* of requests is unbounded and the *input* size is large: ten messages of up to 2,000 characters each (`route.ts:109`, `CareerChat.tsx:186`) plus the ~2,700-character system prompt on every call.

**Impact:** Direct financial loss, and a denial of service for genuine visitors once credits are exhausted. For a public personal site this is the highest-value hardening step after C1.

**Remedial action:**

- Add per-IP rate limiting in front of the model call. For a site on Vercel, `@upstash/ratelimit` with Upstash Redis is the usual low-friction choice:

  ```ts
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(8, "1 h"),
    prefix: "career-twin",
  });

  export async function POST(request: Request) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "You've reached the question limit. Please try again later." },
        { status: 429, headers: { "Retry-After": String(reset) } },
      );
    }
    // ...
  }
  ```

- Add a hard monthly spend limit in the OpenAI dashboard as a backstop that does not depend on application code.
- Consider a lightweight bot check (Cloudflare Turnstile or Vercel BotID) before the first message of a session.
- Add a server-side daily token budget counter so a distributed attack across many IPs still cannot exceed a known ceiling.

### H2. Request bodies of arbitrary size are parsed into memory before validation

**Location:** `app/api/chat/route.ts:101` — `const body = (await request.json()) as { messages?: unknown };`

**Evidence:** Probed directly against the running server with an 8.2 MB payload:

```
$ curl -o /dev/null -w "status=%{http_code} upload=%{size_upload}\n" \
    --data-binary @/tmp/big.json http://127.0.0.1:3001/api/chat
status=400  upload=8272015
```

The server accepted and fully parsed all 8,272,015 bytes before the message validation on line 109 rejected it. The `slice(-10)` and 2,000-character limits protect the *OpenAI call*, but they run after the entire body has been deserialized.

**Impact:** Cheap memory-pressure attack. Repeated large bodies can exhaust a serverless function's memory or tie up a self-hosted Node process, with no OpenAI cost to signal that it is happening.

**Remedial action:** Reject oversized bodies before parsing.

```ts
const MAX_BODY_BYTES = 32 * 1024; // ~16x the legitimate maximum

const declaredLength = Number(request.headers.get("content-length") ?? 0);
if (declaredLength > MAX_BODY_BYTES) {
  return NextResponse.json({ error: "Request too large." }, { status: 413 });
}

const raw = await request.text();
if (raw.length > MAX_BODY_BYTES) {
  return NextResponse.json({ error: "Request too large." }, { status: 413 });
}
const body = JSON.parse(raw) as { messages?: unknown };
```

`Content-Length` alone is not trustworthy, so the length of the read text is checked as well.

### H3. No visible keyboard focus indicator anywhere on the site

**Location:** `app/globals.css` (no focus rules at all); `app/globals.css:1308` actively removes the one default that mattered.

**Evidence:**

```
$ rg -c 'focus-visible|:focus' app/globals.css
0 focus styles found
```

The chat input compounds this:

```css
.chat-input textarea {
  border: 0;
  outline: none;   /* line 1308 — removes the only focus affordance */
}
```

**Impact:** This is a **WCAG 2.1 Level AA failure (2.4.7 Focus Visible)**. A keyboard-only or screen-magnifier user cannot tell which of the many links, buttons, suggestion chips, and the chat textarea currently has focus. On the dark hero and the blue principles section, the browser default outline is also low-contrast where it does still apply.

**Remedial action:** Add an explicit, high-contrast focus ring and remove the `outline: none`.

```css
:where(a, button, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

/* On dark sections, ensure the ring reads against #111418 */
.hero :focus-visible,
.principles :focus-visible,
.impact :focus-visible,
.contact :focus-visible,
footer :focus-visible {
  outline-color: #ffffff;
}
```

Then delete `outline: none;` from `.chat-input textarea` and instead move the focus ring to the containing `.chat-input` with `:focus-within`, so the composed input still looks intentional.

---

## 4. Medium-Severity Findings

### M1. Malformed JSON is reported as a server error

**Location:** `app/api/chat/route.ts:101` inside the `try`, caught by the handler at `route.ts:139`

**Evidence:**

```
$ curl -d '{"messages":' http://127.0.0.1:3001/api/chat
{"error":"I couldn't answer that just now. Please try again."}
status=500
```

A client sending invalid JSON receives `500`, and the server logs it via `console.error("Career twin request failed:", error)` as if the application had failed.

**Impact:** Client faults are misattributed to the server, which pollutes error logs and will cause false alarms in any monitoring added later. It also misleads the caller, implying a retry might help when it never will.

**Remedial action:** Parse in its own `try`/`catch` and return `400`:

```ts
let body: { messages?: unknown };
try {
  body = JSON.parse(await request.text());
} catch {
  return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
}
```

### M2. Upstream rate limits and quota exhaustion are indistinguishable from bugs

**Location:** `app/api/chat/route.ts:139-145`

Every failure — quota exhausted, model not found, network timeout, genuine code bug — collapses into the same `500` with the same message. This is exactly what made the earlier `credit_balance_exhausted` incident hard to read from the outside: the site said "I couldn't answer that just now," which suggested a transient glitch rather than an empty account.

**Remedial action:** Branch on the SDK's typed error so the status code carries real information:

```ts
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error("OpenAI error:", error.status, error.code, error.message);

    if (error.status === 429) {
      return NextResponse.json(
        { error: "The career twin is busy right now. Please try again shortly." },
        { status: 429, headers: { "Retry-After": "30" } },
      );
    }
    if (error.status === 404) {
      return NextResponse.json(
        { error: "The career twin is misconfigured." },
        { status: 503 },
      );
    }
  }

  console.error("Career twin request failed:", error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
```

### M3. The client discards the server's error message

**Location:** `app/components/CareerChat.tsx:77-94`

The code reads `data.error` and throws it:

```ts
if (!response.ok || !data.answer) {
  throw new Error(data.error || "No answer was returned.");
}
```

…but the `catch` block ignores the thrown message entirely and always renders the same fixed string: *"I'm having trouble connecting right now."*

**Impact:** The carefully differentiated server messages (`"The career twin is not configured yet."` for a missing key, and any new `429` copy from M2) can never reach the visitor. The server-side effort is wasted.

**Remedial action:** Render the actual message, with the generic text as a fallback:

```ts
} catch (error) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "I'm having trouble connecting right now. Please try again in a moment.";

  setMessages((current) => [...current, { role: "assistant", content: message }]);
}
```

### M4. No timeout or cancellation on the OpenAI call

**Location:** `app/api/chat/route.ts:121` (server) and `app/components/CareerChat.tsx:65` (client)

Neither side bounds how long a request may take. The route also sets no `maxDuration`, so it inherits the platform default.

**Impact:** A slow or hanging upstream response holds the function open, consuming a concurrency slot and, on a metered host, billable execution time. On the client there is no way to cancel: closing the panel leaves the request in flight, and the answer is appended to state afterwards.

**Remedial action:**

```ts
// route.ts
export const maxDuration = 30;

const completion = await client.chat.completions.create(
  { /* ... */ },
  { timeout: 20_000, maxRetries: 1 },
);
```

```tsx
// CareerChat.tsx — abort on unmount or panel close
const abortRef = useRef<AbortController | null>(null);

abortRef.current?.abort();
const controller = new AbortController();
abortRef.current = controller;

const response = await fetch("/api/chat", {
  method: "POST",
  signal: controller.signal,
  // ...
});
```

Remember to ignore `AbortError` in the `catch` so a deliberate cancellation does not render as a failure bubble.

### M5. The entire page is a client component, shipping the whole site as JavaScript

**Location:** `app/page.tsx:1` — `"use client";`

**Evidence:**

```
$ ls -la .next/static/chunks/*.js | awk '{s+=$5} END {print s}'
total client chunk bytes: 589345 (576 KB)
```

The page is almost entirely static marketing content — the hero, the proof strip, the About copy, the principles grid, the timeline, the impact list, the portfolio teaser, and the contact block never change. Only two things need the browser: the scroll progress bar and the mobile menu toggle.

**Impact:** All of that static markup, plus every `lucide-react` icon imported at `page.tsx:3-19`, is serialized into the client bundle and hydrated for no behavioural benefit. This inflates Time to Interactive and the JavaScript parse cost, which is the main lever available on a site with no images.

**Remedial action:** Invert the default. Make `page.tsx` a server component and extract only the interactive parts:

```
app/page.tsx                       ← server component (no "use client")
app/components/ScrollProgress.tsx   ← "use client"
app/components/SiteHeader.tsx       ← "use client" (mobile menu state)
app/components/CareerChat.tsx       ← "use client" (already correct)
```

This keeps the static sections as server-rendered HTML with zero hydration cost, and shrinks the client bundle to the three components that actually need it.

### M6. The copyright year is frozen at build time

**Location:** `app/page.tsx:411` — `<Copyright size={13} /> {new Date().getFullYear()} Gautham D N`

**Evidence:** The year is baked into the prerendered HTML:

```
$ rg -o '.{30}Gautham D N' .next/server/app/index.html
h></svg> <!-- -->2026<!-- --> Gautham D N
```

The route is statically prerendered (`○ (Static)` in the build output), so `new Date()` evaluates once at build time.

**Impact:** Two defects from one line. First, the footer will display a stale year from 1 January until the site is next rebuilt and redeployed. Second, because the component is also a client component, the client re-evaluates `new Date().getFullYear()` during hydration, so a stale build served across a year boundary produces a genuine hydration mismatch — the same class of error already observed in the dev overlay during development.

**Remedial action:** Make the year static, since a copyright notice does not need to be live:

```tsx
<Copyright size={13} /> 2026 Gautham D N
```

If a rolling year is preferred, compute it in a server component (which re-renders per request only if the route is dynamic) or render it after mount via `useEffect` so the server and client markup agree.

### M7. The chat panel and mobile menu are not accessible dialogs

**Location:** `app/components/CareerChat.tsx:113-201` and `app/page.tsx:116-140`

**Evidence:**

```
$ rg -n 'Escape|role="dialog"|aria-modal|inert' app/
(no matches)
```

Both overlays are plain `div`/`nav` elements. Neither:

- closes on <kbd>Escape</kbd>,
- traps focus while open,
- moves focus into the panel on open,
- restores focus to the trigger on close,
- marks the content behind it as inert.

The mobile menu covers the full viewport (`globals.css:1444-1459`, `inset: 0`), so a keyboard user who opens it can tab straight past the five menu links and into the page content underneath, which is visually hidden behind the overlay. The chat panel has the same problem.

**Impact:** Accessibility failure for keyboard and screen-reader users, and a confusing experience for anyone who reflexively presses Escape.

**Remedial action:** Promote both to proper dialogs. The simplest durable fix is the native `<dialog>` element with `showModal()`, which provides focus trapping, Escape handling, and inertness for free. If the current markup is preferred, add at minimum:

```tsx
useEffect(() => {
  if (!isOpen) return;

  const onKeyDown = (event: globalThis.KeyboardEvent) => {
    if (event.key === "Escape") setIsOpen(false);
  };

  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [isOpen]);
```

plus `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the panel heading, and focus restoration to the launcher on close.

### M8. The scroll listener re-renders the whole page on every scroll event

**Location:** `app/page.tsx:94-103`

```tsx
const updateScroll = () => {
  const height = document.documentElement.scrollHeight - window.innerHeight;
  setScroll(height > 0 ? (window.scrollY / height) * 100 : 0);
};
window.addEventListener("scroll", updateScroll, { passive: true });
```

`setScroll` is called on every scroll event, and because `Home` is the root component, each call re-renders the entire page tree to update a single `width` style on one `div`. The listener is correctly `passive` and correctly cleaned up, which is good, but it also reads `scrollHeight` on every event — a forced layout read in the scroll path.

**Impact:** Unnecessary main-thread work during the most performance-sensitive interaction on the page. It compounds with M5, since the whole tree is client-rendered.

**Remedial action:** Prefer the CSS-only approach, which runs off the main thread entirely and needs no JavaScript:

```css
.scroll-progress {
  transform-origin: left;
  animation: scroll-progress linear;
  animation-timeline: scroll(root block);
}

@keyframes scroll-progress {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
```

If the JavaScript version is retained, move it into a small `ScrollProgress` client component (per M5), cache `scrollHeight` outside the handler, and write to a CSS custom property through a ref rather than through React state so no re-render occurs.

### M9. Career facts are duplicated between the page and the AI context

**Location:** `app/page.tsx:23-87` (the `journey`, `principles`, and `proof` arrays) and `app/api/chat/route.ts:11-79` (the `careerContext` string)

The same employment history, metrics, and leadership philosophy are written out twice, in two different formats, in two different files. The figures already diverge in presentation — the page shows an aggregate `$5.7M` "transformation portfolio" (`page.tsx:86`) that is a derived sum, while the AI context lists the `$1.2M`, `$2M`, and `$2.5M` components separately.

**Impact:** The visible site and the Digital Twin will drift apart as the profile is updated, and the twin may then contradict the page it sits on — which is more damaging than either being slightly out of date, because it undermines trust in the feature.

**Remedial action:** Establish a single source of truth, for example `content/profile.ts`, exporting typed structures consumed by both. The AI context becomes a function that serialises that data into prose:

```ts
// content/profile.ts
export const roles = [
  { company: "Atlassian", title: "Senior Engineering Manager", from: "2023-12", to: null, /* ... */ },
  // ...
] as const;

// app/api/chat/route.ts
import { roles, impact, philosophy } from "@/content/profile";
const careerContext = buildCareerContext({ roles, impact, philosophy });
```

### M10. Fonts are loaded with a CSS `@import` from Google Fonts

**Location:** `app/globals.css:1`

```css
@import url("https://fonts.googleapis.com/css2?family=DM+Mono...&display=swap");
```

A CSS `@import` is discovered only after the stylesheet itself has been fetched and parsed, so it creates a serialised, render-blocking request chain to a third-party origin, with no `preconnect`. Three families with eight weights in total are requested.

**Impact:** Delayed first paint, a third-party dependency on the critical path, and a privacy consideration (visitor IPs are disclosed to Google on every page load).

**Remedial action:** Use `next/font/google`, which self-hosts the font files at build time, removes the third-party round trip, and eliminates layout shift:

```ts
// app/layout.tsx
import { Manrope, DM_Mono, Playfair_Display } from "next/font/google";

const sans = Manrope({ subsets: ["latin"], variable: "--sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--mono" });
const serif = Playfair_Display({ subsets: ["latin"], style: ["italic"], weight: ["600"], variable: "--serif" });
```

Then apply `${sans.variable} ${mono.variable} ${serif.variable}` to `<html>` and delete the `@import`. Also audit which weights are genuinely used — Manrope requests five.

---

## 5. Low-Severity Findings

### L1. A dead ESLint config is still tracked

`.eslintrc.json` remains in the repository and in git, containing `{"extends": "next/core-web-vitals"}`. ESLint 9 uses the flat config in `eslint.config.mjs` and ignores this file entirely. **Action:** `git rm .eslintrc.json`.

### L2. The accent design token is still named for the previous palette

`app/globals.css:7` defines `--acid: #9abfff`. The name dates from the original green design; the value is now pale blue. It appears in 24 places. **Action:** rename to `--accent` (and consider `--surface`, `--surface-deep`, `--brand` for `--paper`, `--paper-deep`, `--blue`) so the tokens describe roles rather than colours.

### L3. Several type sizes are below readable thresholds

`globals.css` sets `font-size: 7px` on `.chat-disclaimer` (line 1345), and `8px` on `.mark-label`, `.preview-card span`, `footer`, and `.chat-suggestions button`. The disclaimer combines 7px with `#969ba5` on white, which fails contrast as well as size. **Action:** raise the floor to 11–12px for any text that must be read, and lift the disclaimer's colour to at least `#6b7280`.

### L4. `aria-hidden` hides real content from screen readers

`app/page.tsx:354` marks the whole `.portfolio-preview` block `aria-hidden="true"`, but the three cards contain meaningful titles ("Order visibility at scale", "Building teams with agency", "From monolith to momentum"). **Action:** either expose them with a note that they are forthcoming, or move the titles out of the decorative block so screen-reader users learn what is coming.

### L5. `cursor: default` on `body` suppresses the text cursor

`globals.css:32-35` sets `cursor: default` on `body, a`, then restores `pointer` for `a`. The net effect is that body copy no longer shows an I-beam, so visitors get no hint that text is selectable. **Action:** remove the `body` rule and let the browser default apply.

### L6. Viewport units do not account for mobile browser chrome

`.chat-panel` uses `height: min(630px, calc(100vh - 110px))` (`globals.css:1120`). On mobile browsers `100vh` includes the collapsing toolbar. The mobile breakpoint sidesteps this with `inset`, so the impact is limited to narrow desktop windows. **Action:** use `100dvh`.

### L7. `tsconfig.json` targets ES5

`"target": "es5"` (line 3) forces downlevelling that Next 16 and all supported browsers do not need, producing larger output and slower builds. **Action:** `"target": "ES2022"`.

### L8. A single `!important` signals a specificity problem

`globals.css:1473` — `.nav-contact { font-size: 12px !important; }`. It is the only `!important` outside the reduced-motion block. **Action:** resolve the underlying specificity conflict with `.nav .nav-contact` instead.

### L9. Project hygiene files are missing

```
MISSING: README.md
MISSING: .env.example
MISSING: .nvmrc
MISSING: .github/workflows
MISSING: LICENSE
```

`tutorial.md` is thorough and partly compensates, but a clone of this repository has no `README` describing setup, no declaration that `OPENAI_API_KEY` is required, and no pinned Node version. **Action:** add a short `README.md`, an `.env.example` containing `OPENAI_API_KEY=` and `OPENAI_MODEL=`, and an `.nvmrc` matching the Node version in use (v26.7.0 locally).

### L10. No tests and no CI

```
$ rg --files -g '*.test.*' -g '*.spec.*'
(no test files)
$ rg '"(test|typecheck|format)"' package.json
no test/typecheck/format scripts
```

Notably, `tsc --noEmit` is only ever run implicitly by `next build`; there is no `typecheck` script. **Action:** add `"typecheck": "tsc --noEmit"`, unit tests for `isChatMessage` (which is pure and trivially testable), and a GitHub Actions workflow running `lint`, `typecheck`, and `build` on push.

### L11. The model name is hardcoded

`app/api/chat/route.ts:122` — `model: "gpt-6-luna"`. Changing the model requires a code edit and redeploy, and this value has already changed three times. **Action:** read it from the environment with a safe default:

```ts
model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
```

### L12. The OpenAI client is constructed on every request

`app/api/chat/route.ts:120` instantiates `new OpenAI({...})` inside the handler. The SDK is designed to be reused, and a module-scope instance allows connection reuse. **Action:** hoist it to module scope, keeping the `OPENAI_API_KEY` guard in the handler.

### L13. Invalid messages are silently discarded

`app/api/chat/route.ts:109` — `body.messages.filter(isChatMessage).slice(-10)`. A conversation containing malformed entries is partially honoured rather than rejected, so a client bug would manifest as subtly missing context rather than a clear error. **Action:** validate strictly and return `400` if any entry fails, which makes client bugs loud.

### L14. Minor code and copy issues

- **Index-based React keys** (`CareerChat.tsx:142`) — `key={`${message.role}-${index}`}`. Safe today because the list is append-only, but it is the pattern that breaks as soon as messages can be edited or removed.
- **Redundant type assertion** (`CareerChat.tsx:83`) — `data.answer as string` is needed only because narrowing is lost inside the updater closure; assigning to a local `const answer = data.answer;` after the guard removes the assertion.
- **Hardcoded section counter** (`page.tsx:186`) — the hero reads `01 / 06`, but there are seven sections plus a footer, and the counter never advances.
- **Decorative `<em>`** (`page.tsx:155` and elsewhere) — `<em>` is used purely for the serif accent styling. It carries semantic emphasis that screen readers may announce. A `<span>` with a class is the honest choice.
- **Stale dev-only config** (`next.config.mjs:4`) — `allowedDevOrigins: ["127.0.0.1"]` was added to silence a development warning during browser testing. It is harmless in production but should carry a comment explaining why it exists, or be removed.
- **Focus-on-open is conditional** (`CareerChat.tsx:47`) — `if (messages.length === 1) inputRef.current?.focus();` focuses the textarea only on the very first open. Reopening a panel with history leaves focus on the launcher.

---

## 6. Recommended Remediation Plan

### Phase 1 — Do immediately (privacy and money)

1. **C1** — Remove `LinkedinProfile.pdf` from the working tree, `.gitignore` it, purge it from history, force-push, and request a GitHub cache purge.
2. **H1** — Add per-IP rate limiting to `/api/chat` and set a hard spend cap in the OpenAI dashboard.
3. **H2** — Add a request body size limit before `JSON.parse`.

### Phase 2 — Before sharing the site widely (accessibility and correctness)

4. **H3** — Add `:focus-visible` styles and remove `outline: none`.
5. **M7** — Make the chat panel and mobile menu real dialogs (Escape, focus trap, focus restore).
6. **M6** — Fix the frozen copyright year.
7. **M1, M2, M3** — Correct the error semantics end to end: `400` for bad input, `429` passed through, and the server's message actually rendered by the client.
8. **M4** — Add timeouts and cancellation on both sides.

### Phase 3 — Quality and maintainability

9. **M5** — Convert the page to a server component and extract the interactive pieces.
10. **M9** — Consolidate career facts into one typed source of truth.
11. **M10** — Migrate to `next/font`.
12. **M8** — Move the scroll indicator to CSS scroll-driven animation.
13. **L9, L10** — Add `README.md`, `.env.example`, `.nvmrc`, a `typecheck` script, tests for `isChatMessage`, and a CI workflow.

### Phase 4 — Polish

14. **L1–L8, L11–L14** — Token renaming, dead config removal, type sizes, and the remaining small items.

---

## 7. What the Project Does Well

It is worth recording the decisions that are already correct, so they are preserved through any refactor:

- **The API key never leaves the server.** It is read only in `app/api/chat/route.ts`, the route correctly declares `runtime = "nodejs"`, and the key was verified absent from the entire git history. This is the single most important thing to get right in an AI integration, and it is right.
- **`.gitignore` covers `.env`** and the key was never committed — confirmed by `git log --all -- .env`.
- **Input validation exists and is type-safe.** `isChatMessage` is a proper TypeScript type predicate, and the conversation is capped at ten messages and 2,000 characters each before reaching the model.
- **Output cost is bounded** by `max_completion_tokens: 700`.
- **The system prompt is well-constructed.** It grounds the model in specific facts, explicitly forbids inventing employers, dates, and outcomes, instructs it to admit gaps, and requires it to disclose that it is an AI twin rather than the real person. The live answers observed during development stayed accurate and on-topic.
- **`prefers-reduced-motion` is honoured** (`globals.css:1642-1654`), including resetting `scroll-behavior`, which is frequently forgotten.
- **`aria-live="polite"` on the message list** (`CareerChat.tsx:138`) is the correct choice for streaming-in chat content.
- **The scroll listener is `passive` and properly cleaned up** (`page.tsx:101-102`), avoiding both scroll jank and a listener leak.
- **The responsive design is genuinely considered**, not merely stacked: the navigation becomes an overlay, the proof strip reflows from four columns to two, the impact section switches axis, and the chat panel becomes near-fullscreen.
- **The build is clean**: no type errors, no lint errors, and zero dependency vulnerabilities on current major versions of Next, React, and the OpenAI SDK.
