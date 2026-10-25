# Building Gautham's Professional Website: A Beginner-Friendly Tutorial

This tutorial explains how the professional portfolio website in this project works. It assumes you are completely new to frontend development, so it starts with the basic ideas before reviewing the important code in detail.

By the end, you should understand:

- How a browser turns React components and CSS into a website.
- Why Next.js is used on top of React.
- How the page content and responsive design are organized.
- How interactive features such as the mobile menu and scroll indicator work.
- How the Digital Twin chat sends questions safely to OpenAI.
- How to run, check, and modify the project.

---

## 1. What We Built

The project is a responsive professional website for Gautham D N. It uses information from his LinkedIn profile to present:

- A prominent introductory section.
- Career highlights and measurable achievements.
- An About section.
- Leadership principles.
- A career timeline.
- Selected business impact.
- A placeholder for future portfolio case studies.
- Contact and social links.
- An AI-powered Digital Twin that answers questions about his career.

The visual style combines an enterprise feel with more expressive typography, animation, geometric graphics, and a blue color palette.

The site has been designed for both large desktop screens and smaller mobile devices. On mobile, the navigation changes into a menu button and the AI chat becomes a nearly full-screen panel.

---

## 2. Technology Summary

### HTML

HTML describes the meaning and structure of a web page. Examples include headings, paragraphs, links, buttons, and sections.

In this project, we do not write a standalone `.html` file. React generates the HTML from components written in TSX.

### CSS

CSS controls how the HTML looks. It defines colors, spacing, typography, layouts, animation, and responsive behavior.

The project's main stylesheet is:

```text
app/globals.css
```

### JavaScript

JavaScript adds behavior to a web page. It lets the page respond when a visitor clicks a button, types a question, or scrolls.

### TypeScript

TypeScript is JavaScript with additional type checking. Types describe the shape of data and help catch mistakes before the code runs.

For example:

```ts
type Message = {
  role: "user" | "assistant";
  content: string;
};
```

This says that every chat message must have:

- A `role` that is exactly either `"user"` or `"assistant"`.
- A `content` value containing text.

### React

React lets us build a website from reusable components. A component is a function that returns the interface it wants to display.

For example:

```tsx
function Greeting() {
  return <h1>Hello!</h1>;
}
```

React also provides hooks such as `useState` and `useEffect`, which let components remember information and respond to browser events.

### Next.js

Next.js is a framework built around React. It provides:

- A development server.
- Page routing based on folders and files.
- Server-side API routes.
- Production build optimization.
- Metadata support for browser tabs and search engines.
- A secure server environment for the OpenAI API key.

This project uses the **App Router**, where files inside the `app` directory become pages, layouts, components, or API endpoints.

### OpenAI

The OpenAI JavaScript package sends Digital Twin questions to an AI model. The current configured model is:

```text
gpt-6-luna
```

The secret API key is stored in `.env` and used only by server-side code. It is never sent to the visitor's browser.

### Lucide React

`lucide-react` provides the interface icons used throughout the page, including arrows, menu icons, social icons, and chat icons.

### ESLint

ESLint checks the code for common mistakes and consistency problems.

---

## 3. Project Structure

The most important files are:

```text
site/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── components/
│   │   └── CareerChat.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env
├── .gitignore
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── tsconfig.json
└── tutorial.md
```

Here is what each major file does:

- `app/page.tsx`: Builds the main portfolio page.
- `app/layout.tsx`: Creates the outer HTML document and site metadata.
- `app/globals.css`: Styles the entire website.
- `app/components/CareerChat.tsx`: Builds the interactive Digital Twin chat interface.
- `app/api/chat/route.ts`: Receives chat questions on the server and calls OpenAI.
- `package.json`: Lists dependencies and common commands.
- `.env`: Stores the secret OpenAI API key.
- `.gitignore`: Prevents secrets and generated files from being committed to Git.

---

## 4. How to Run the Website

Open a terminal in the project folder and install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Next.js normally opens the website at:

```text
http://localhost:3000
```

If port 3000 is already occupied, Next.js automatically chooses another port, such as:

```text
http://localhost:3001
```

Stop the server by pressing `Control + C` in the terminal.

### Important environment setup

The `.env` file must contain:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Never put this key directly into a React component, CSS file, or public Git repository.

---

## 5. High-Level Request Flow

When someone visits the website, the following happens:

1. Next.js loads `app/layout.tsx`.
2. The layout loads the global CSS and places `app/page.tsx` inside the page body.
3. React turns the components in `page.tsx` into the visible portfolio.
4. Browser-side React code enables the mobile menu, scroll progress, and chat panel.
5. When a visitor asks the Digital Twin a question, the browser sends it to `/api/chat`.
6. The server validates the question.
7. The server adds Gautham's verified career context.
8. The server sends the conversation to OpenAI.
9. OpenAI returns an answer.
10. The server returns only that answer to the browser.
11. React adds the answer to the chat interface.

The key security idea is that the browser never talks directly to OpenAI. It talks to the project's own API route, and that route uses the secret key on the server.

---

## 6. Detailed Code Review

## 6.1 Dependencies and Commands

The `package.json` file describes the project.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "lucide-react": "^0.468.0",
    "next": "^16.4.3",
    "openai": "^6.7.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

The scripts mean:

- `npm run dev`: Starts the development server with automatic refreshing.
- `npm run build`: Produces an optimized production build.
- `npm start`: Runs the production build after it has been created.
- `npm run lint`: Checks the source code with ESLint.

`dependencies` are packages needed by the running application. `devDependencies` are mainly used while writing and checking the project.

---

## 6.2 The Root Layout

Next.js requires a root layout in `app/layout.tsx`.

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gautham D N — Engineering Leader",
  description:
    "Senior engineering leader building high-performing teams, resilient platforms, and products that move businesses forward.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

Important details:

- `import "./globals.css"` makes the global styles available throughout the site.
- `metadata` controls the browser tab title and page description.
- `children` means "whatever page Next.js is currently displaying."
- `lang="en"` helps screen readers and search engines understand the language.

---

## 6.3 The Main Page Component

The main site is built in `app/page.tsx`.

It begins with:

```tsx
"use client";
```

Next.js components are server components by default. `"use client"` tells Next.js that this component needs to run in the browser because it uses state, effects, and click handlers.

### Imports

The file imports icons, React hooks, and the chat component:

```tsx
import { useEffect, useState } from "react";
import CareerChat from "./components/CareerChat";
```

### Storing repeatable content as data

Instead of writing every timeline entry separately, the career information is stored in an array:

```tsx
const journey = [
  {
    period: "2023 — NOW",
    role: "Senior Engineering Manager",
    company: "ATLASSIAN",
    description:
      "Leading product engineering at global scale—building strong teams...",
    current: true,
  },
  // More entries...
];
```

React uses `.map()` to turn every object into an article:

```tsx
{journey.map((item) => (
  <article className="timeline-row" key={`${item.period}-${item.role}`}>
    <div className="timeline-period">{item.period}</div>
    <div className="timeline-role">
      <p>{item.company}</p>
      <h3>{item.role}</h3>
    </div>
    <p className="timeline-description">{item.description}</p>
  </article>
))}
```

This approach makes content easier to update. To add another job, you add another object to the array rather than copying a large block of interface code.

The `key` helps React identify each generated item.

### Component state

The page remembers whether the mobile menu is open and how far the visitor has scrolled:

```tsx
const [menuOpen, setMenuOpen] = useState(false);
const [scroll, setScroll] = useState(0);
```

`useState(false)` returns two things:

1. The current value, `menuOpen`.
2. A function for changing it, `setMenuOpen`.

Clicking the menu button switches between `true` and `false`:

```tsx
onClick={() => setMenuOpen((value) => !value)}
```

### Measuring scroll progress

The component listens for browser scroll events:

```tsx
useEffect(() => {
  const updateScroll = () => {
    const height =
      document.documentElement.scrollHeight - window.innerHeight;
    setScroll(height > 0 ? (window.scrollY / height) * 100 : 0);
  };

  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  return () => window.removeEventListener("scroll", updateScroll);
}, []);
```

This code:

1. Calculates the total scrollable distance.
2. Divides the current scroll position by that distance.
3. Converts the result into a percentage.
4. saves the percentage in React state.

The percentage becomes the width of the progress bar:

```tsx
<div className="scroll-progress" style={{ width: `${scroll}%` }} />
```

The cleanup function removes the event listener if React removes the component. Cleaning up prevents duplicate listeners and memory leaks.

### Semantic sections

The page is divided into meaningful HTML sections:

```tsx
<section className="about section" id="about">
  ...
</section>
```

The `id` connects the section to navigation links:

```tsx
<a href="#about">About</a>
```

When the visitor selects that link, the browser moves to the element whose ID is `about`.

### Adding the chat component

The AI interface is included with one reusable component:

```tsx
<CareerChat />
```

This keeps the page file from containing all of the chat logic.

---

## 6.4 Styling and the Design System

The site is styled in `app/globals.css`.

### CSS variables

Reusable colors and fonts are declared near the top:

```css
:root {
  --ink: #111418;
  --paper: #f2f0e9;
  --paper-deep: #e6e3d9;
  --acid: #9abfff;
  --blue: #3659c9;
  --muted: #6e716e;
  --line: rgba(17, 20, 24, 0.15);
  --mono: "DM Mono", monospace;
  --sans: "Manrope", sans-serif;
  --serif: "Playfair Display", serif;
}
```

Although the variable is named `--acid`, its current value is the pale blue accent color. A style can use the variable like this:

```css
.button-primary {
  background: var(--acid);
}
```

If the variable changes, every style using it changes automatically.

### Responsive layout

The site uses CSS Grid and Flexbox.

For example, the statistics area uses four columns on larger screens:

```css
.proof-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
```

On smaller screens, a media query changes it to two columns:

```css
@media (max-width: 760px) {
  .proof-strip {
    grid-template-columns: 1fr 1fr;
  }
}
```

A media query means "apply these rules only when this condition is true."

### Flexible font sizes

The site uses `clamp()` for headings:

```css
.hero h1 {
  font-size: clamp(50px, 7.15vw, 108px);
}
```

This means:

- Never make the text smaller than 50 pixels.
- Prefer a size based on the viewport width.
- Never make it larger than 108 pixels.

### Animation

The entrance animation is defined with keyframes:

```css
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

An element uses it through the `.reveal` class:

```css
.reveal {
  animation: reveal 750ms both cubic-bezier(0.22, 1, 0.36, 1);
}
```

The site also respects visitors who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is an important accessibility feature.

---

## 6.5 The Digital Twin Interface

The chat interface lives in `app/components/CareerChat.tsx`.

It is a client component because it responds to input and stores the conversation:

```tsx
"use client";
```

### Chat state

The component stores four main pieces of information:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
const [input, setInput] = useState("");
const [isLoading, setIsLoading] = useState(false);
```

- `isOpen`: Whether the panel is visible.
- `messages`: The conversation so far.
- `input`: The text currently typed by the visitor.
- `isLoading`: Whether the site is waiting for OpenAI.

### Controlled text input

The text area gets its value from React:

```tsx
<textarea
  value={input}
  onChange={(event) => setInput(event.target.value)}
  placeholder="Ask about Gautham’s career…"
  maxLength={2000}
/>
```

This is called a **controlled input**. Every time the visitor types, `onChange` updates React state.

### Sending a question

The most important browser-side function is `sendMessage`:

```tsx
async function sendMessage(question: string) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion || isLoading) return;

  const userMessage: Message = {
    role: "user",
    content: trimmedQuestion,
  };

  const nextMessages = [...messages, userMessage];
  setMessages(nextMessages);
  setInput("");
  setIsLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextMessages.slice(1),
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.answer) {
      throw new Error(data.error || "No answer was returned.");
    }

    setMessages((current) => [
      ...current,
      { role: "assistant", content: data.answer },
    ]);
  } catch {
    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content:
          "I’m having trouble connecting right now. Please try again in a moment.",
      },
    ]);
  } finally {
    setIsLoading(false);
  }
}
```

Important ideas:

- `async` means the function performs work that takes time.
- `await` pauses that function until a network operation finishes.
- `fetch()` makes an HTTP request.
- `POST` is used because the browser is sending conversation data.
- `JSON.stringify()` converts JavaScript data into text suitable for HTTP.
- `try`, `catch`, and `finally` handle success, failure, and cleanup.

The welcome message is removed from the API payload with `slice(1)` because it is interface text, not part of the real AI conversation.

### Rendering messages

The messages array becomes visible message bubbles:

```tsx
{messages.map((message, index) => (
  <div
    className={`chat-message ${message.role}`}
    key={`${message.role}-${index}`}
  >
    <p>{message.content}</p>
  </div>
))}
```

The role becomes part of the CSS class. This lets CSS align user messages to the right and style assistant messages differently.

### Accessibility details

The chat uses:

```tsx
<div className="chat-messages" aria-live="polite">
```

`aria-live="polite"` tells screen readers to announce new messages without abruptly interrupting the visitor.

Buttons also have descriptive `aria-label` values, and the launcher reports whether it is expanded.

---

## 6.6 The Server-Side Chat API

The OpenAI integration lives in:

```text
app/api/chat/route.ts
```

Because it is under `app/api/chat`, Next.js makes it available at:

```text
POST /api/chat
```

### Why the API runs on the server

The API key is secret. Browser code can be inspected by any visitor, so the key must never appear in `CareerChat.tsx`.

The route reads it safely from the server environment:

```ts
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### The system context

The `careerContext` string contains:

- Current role and location.
- Career history.
- Quantified achievements.
- Recognition and publications.
- Leadership philosophy.
- Rules that reduce unsupported answers.

This is the source material for the Digital Twin. It is passed as a system message before the visitor's conversation:

```ts
messages: [
  { role: "system", content: careerContext },
  ...messages.map((message) => ({
    role: message.role,
    content: message.content,
  })),
],
```

The system message has higher priority than ordinary user messages and tells the model how it should behave.

### Request validation

Data sent by a browser cannot automatically be trusted. The route checks every message:

```ts
function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;

  const message = value as Record<string, unknown>;

  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0 &&
    message.content.length <= 2000
  );
}
```

This protects the API from malformed data and limits each message to 2,000 characters.

The route also keeps only the ten most recent messages:

```ts
const messages = body.messages.filter(isChatMessage).slice(-10);
```

This controls token usage, latency, and API cost.

### Calling OpenAI

The model request is:

```ts
const completion = await client.chat.completions.create({
  model: "gpt-6-luna",
  messages: [
    { role: "system", content: careerContext },
    ...messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ],
  max_completion_tokens: 700,
});
```

`max_completion_tokens` limits how much text the model can generate for one answer.

The answer is then extracted:

```ts
const answer = completion.choices[0]?.message?.content?.trim();
```

The `?.` syntax is called optional chaining. It prevents the program from crashing if a value is unexpectedly missing.

Finally, Next.js sends JSON back to the browser:

```ts
return NextResponse.json({ answer });
```

### Error handling

The route checks whether the API key exists:

```ts
if (!process.env.OPENAI_API_KEY) {
  return NextResponse.json(
    { error: "The career twin is not configured yet." },
    { status: 503 },
  );
}
```

Other failures are logged on the server while visitors receive a safe, general message:

```ts
catch (error) {
  console.error("Career twin request failed:", error);
  return NextResponse.json(
    { error: "I couldn't answer that just now. Please try again." },
    { status: 500 },
  );
}
```

This avoids sending internal OpenAI details or sensitive information to the browser.

---

## 7. Client Code Versus Server Code

Understanding this distinction is especially important.

### Browser/client code

The following files run partly or fully in the visitor's browser:

- `app/page.tsx`
- `app/components/CareerChat.tsx`
- `app/globals.css`

They handle:

- Display.
- Clicks.
- Typing.
- Scrolling.
- Chat state.
- Requests to the site's API.

### Server code

The following route runs on the Next.js server:

- `app/api/chat/route.ts`

It handles:

- Reading the secret API key.
- Validating chat messages.
- Providing career context.
- Calling OpenAI.
- Returning the answer.

Never move `OPENAI_API_KEY` into a client component or prefix it with `NEXT_PUBLIC_`. Values beginning with `NEXT_PUBLIC_` are intentionally exposed to browsers.

---

## 8. How to Make Common Changes

### Change a career entry

Edit the `journey` array in `app/page.tsx`.

### Change a statistic

Edit the `proof` array:

```tsx
const proof = [
  { value: "15+", label: "Years in engineering" },
  // ...
];
```

### Change colors

Edit the variables at the top of `app/globals.css`:

```css
:root {
  --acid: #9abfff;
  --blue: #3659c9;
}
```

### Change the AI model

Edit the model in `app/api/chat/route.ts`:

```ts
model: "gpt-6-luna",
```

Only use a model that is available to the OpenAI project associated with the API key.

### Add more Digital Twin knowledge

Add verified facts to `careerContext`. Keep the facts specific and avoid adding anything private or uncertain.

### Add a portfolio case study

Replace one of the placeholder cards in the portfolio section with a link to a dedicated case-study page. With Next.js, a new page could be created at:

```text
app/portfolio/order-visibility/page.tsx
```

That page would automatically be available at:

```text
/portfolio/order-visibility
```

---

## 9. Checking the Project

Before considering a change complete, run:

```bash
npm run lint
```

Then create a production build:

```bash
npm run build
```

The build performs TypeScript checks and confirms that Next.js can generate the application successfully.

To test the production version locally:

```bash
npm run build
npm start
```

You should also manually check:

- Desktop and mobile layouts.
- Navigation links.
- Keyboard access.
- The mobile menu.
- The Digital Twin open/close interaction.
- A successful AI answer.
- The error message shown when the AI request fails.

---

## 10. Five Improvements From a Self-Review

1. **Move portfolio and career content into structured content files or a CMS.**  
   Much of the content currently lives directly inside `page.tsx` and `route.ts`. Moving it into JSON, Markdown, or a content management system would make updates easier and reduce duplication between the visible profile and the Digital Twin context.

2. **Add rate limiting and abuse protection to the chat API.**  
   Anyone who can access the site can currently call `/api/chat`, which can consume paid OpenAI credits. A production version should limit requests by IP address or session, add bot protection, and enforce daily usage limits.

3. **Stream AI answers instead of waiting for the full response.**  
   The current interface waits until OpenAI finishes the complete answer. Streaming would display the response progressively, making the Digital Twin feel faster and more conversational.

4. **Add automated tests.**  
   Unit tests could verify message validation and chat state, while browser tests could check the mobile menu, responsive layouts, navigation, chat opening, successful responses, and error handling.

5. **Improve separation and naming in the visual system.**  
   `globals.css` is large, and the pale blue variable is still named `--acid` from an earlier green design. Splitting styles into component-level files and renaming tokens to semantic names such as `--accent`, `--surface`, and `--brand-primary` would make the design system easier for future developers to understand.
