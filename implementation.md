# Chaos Compiler — Complete Frontend Design & Build Specification
### For: Frontend Developer
### Version: 1.0 | Status: Handoff Ready

---

## 0. How to Read This Document

This document is the single source of truth for building and improving the Chaos Compiler web application frontend. It covers:

- What the product is and who it is for
- The complete design system (colors, fonts, spacing, motion)
- Every page — what exists, what needs fixing, what needs building from scratch
- The new animated Learn section (5 stages, fully specified)
- Flowcharts for every user journey
- Future features that must be designed with extensibility in mind

Read the design system section completely before writing a single line of code. Every decision downstream depends on it.

---

## 1. What This Product Is

**Chaos Compiler** is a developer tool and learning platform that:

1. Takes C/C++ source code as input
2. Parses it into an Abstract Syntax Tree (AST)
3. Deliberately mutates it using a "chaos engine" (operator swaps, condition flips, literal shifts, dead code injection)
4. Visualizes every step — token stream, AST tree, mutation diff, mutation log
5. Teaches users how compilers work through a 5-stage animated tutorial

**Primary users:** Computer science students, developers learning about compilers, security researchers interested in mutation testing.

**The one thing users must remember:** "The tool that breaks your code on purpose — and shows you exactly how."

---

## 2. Current Tech Stack — Do Not Change

```
client/          React 18 + Vite
server/          Node.js + Express (port 4000)
compiler/        Custom C binary (chaos-compiler.exe)
styling          CSS Modules (*.module.css)
editor           @uiw/react-codemirror + @codemirror/lang-cpp
state            React Context + useReducer (useCompilerStore)
http             axios
tree viz         D3.js
routing          react-router-dom
```

**Do not introduce:** Tailwind, MUI, Chakra, styled-components, or any component library. CSS Modules only.

**You may add:** framer-motion (for page transitions and animations), react-intersection-observer (for scroll triggers).

---

## 3. Design System

This is the most important section. Every component, every page, every animation derives from these decisions.

### 3.1 Aesthetic Direction

**Theme:** Clean modern SaaS — light surface, professional, polished. NOT the current dark terminal aesthetic. This is a deliberate rebrand toward something that feels like a serious professional tool (think Linear, Vercel dashboard, Raycast).

**The contrast principle:** The app shell is light and clean. The code editor, AST tree, and compiler output remain dark — because code always looks better dark. This light/dark contrast is intentional and makes the tool feel premium.

**What makes it unforgettable:** The micro-interactions. Every button press, every compile, every node click has a precisely tuned response. The animations feel mechanical and precise — like compiler output, not like a marketing website.

### 3.2 Color Palette

```css
:root {
  /* Surfaces */
  --surface-0:      #ffffff;   /* page background */
  --surface-1:      #f8f7f4;   /* card backgrounds */
  --surface-2:      #f0ede8;   /* secondary panels */
  --surface-3:      #e8e4dd;   /* borders, dividers */

  /* Text */
  --text-primary:   #1a1917;   /* headings, primary content */
  --text-secondary: #6b6760;   /* labels, descriptions */
  --text-tertiary:  #a09c97;   /* hints, placeholders */
  --text-inverse:   #f8f7f4;   /* text on dark backgrounds */

  /* Accent — the chaos orange */
  --accent:         #d4522a;   /* primary CTAs, active states */
  --accent-light:   #f5e6e0;   /* accent backgrounds */
  --accent-dark:    #a33d1e;   /* accent hover */

  /* Code surfaces (always dark) */
  --code-bg:        #0f0f0e;
  --code-surface:   #161614;
  --code-border:    #2a2825;
  --code-text:      #e8e4dd;
  --code-muted:     #7a7671;

  /* Semantic */
  --success:        #2d7a4f;
  --success-light:  #e6f4ec;
  --warning:        #a06020;
  --warning-light:  #fdf3e6;
  --error:          #c23b2a;
  --error-light:    #fce8e5;
  --info:           #2560a8;
  --info-light:     #e8f0fb;

  /* Node type colors (for AST tree — keep on dark bg) */
  --node-funcdecl:  #3a9e6e;   /* green */
  --node-vardecl:   #3a6a9e;   /* blue */
  --node-control:   #9e8a3a;   /* amber — if/while */
  --node-expr:      #7a3a9e;   /* purple — BinaryOp/UnaryOp */
  --node-literal:   #3a8a8a;   /* teal — Number/Ident */
  --node-call:      #d4522a;   /* accent orange — Call */
  --node-return:    #9e3a3a;   /* red */
  --node-default:   #5a5855;   /* gray */

  /* Mutation type colors (for log badges) */
  --mut-operator:   #7a3a9e;
  --mut-condition:  #9e8a3a;
  --mut-literal:    #3a8a8a;
  --mut-return:     #9e3a3a;
  --mut-deadcode:   #3a6a9e;
}
```

### 3.3 Typography

**Display font:** `Bricolage Grotesque` — variable weight, wide character set, editorial feel. Used for headings, hero text, and feature titles.

**Body font:** `DM Sans` — clean, neutral, highly legible at small sizes. Used for body text, labels, UI elements.

**Code font:** `JetBrains Mono` — replaces IBM Plex Mono. Better ligatures, cleaner at small sizes.

```css
/* Import in index.html */
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

:root {
  --font-display: 'Bricolage Grotesque', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-code:    'JetBrains Mono', monospace;
}
```

**Type scale:**
```css
--text-xs:   11px / 1.4  DM Sans
--text-sm:   13px / 1.5  DM Sans
--text-base: 15px / 1.6  DM Sans
--text-lg:   18px / 1.5  DM Sans
--text-xl:   24px / 1.3  Bricolage Grotesque 600
--text-2xl:  36px / 1.2  Bricolage Grotesque 700
--text-3xl:  52px / 1.1  Bricolage Grotesque 700
--text-hero: 72px / 1.0  Bricolage Grotesque 800
```

### 3.4 Spacing System

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   24px
--space-6:   32px
--space-7:   48px
--space-8:   64px
--space-9:   96px
--space-10: 128px
```

### 3.5 Border Radius

```css
--radius-sm:   4px    /* tags, badges, small pills */
--radius-md:   8px    /* buttons, inputs, small cards */
--radius-lg:  12px    /* cards, panels */
--radius-xl:  20px    /* large cards, modals */
--radius-full: 9999px /* pill buttons, avatars */
```

### 3.6 Shadows

```css
--shadow-sm:  0 1px 3px rgba(26,25,23,0.08), 0 1px 2px rgba(26,25,23,0.04);
--shadow-md:  0 4px 12px rgba(26,25,23,0.10), 0 2px 4px rgba(26,25,23,0.06);
--shadow-lg:  0 12px 32px rgba(26,25,23,0.12), 0 4px 8px rgba(26,25,23,0.06);
--shadow-xl:  0 24px 64px rgba(26,25,23,0.14), 0 8px 16px rgba(26,25,23,0.08);
```

### 3.7 Motion System

Install: `npm install framer-motion`

**Principles:**
- Transitions feel mechanical and precise, not bouncy or playful
- Duration: 150ms for micro (hover), 250ms for standard, 400ms for page, 600ms+ for reveals
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `cubic-bezier(0.4, 0, 1, 1)` for exits

**Standard variants for framer-motion:**
```js
// Page entrance
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }},
  exit:    { opacity: 0, y: -8,
    transition: { duration: 0.2 }}
};

// Staggered children
export const containerVariants = {
  animate: { transition: { staggerChildren: 0.06 }}
};

// Card / item reveal on scroll
export const itemVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
};

// Compile button press
export const compileVariants = {
  tap: { scale: 0.97, transition: { duration: 0.1 }}
};
```

**Noise / particle background:**
Use an SVG `feTurbulence` filter for the noise texture on the hero section — no canvas, no heavy library:
```css
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise */
  opacity: 0.03;
  pointer-events: none;
}
```

### 3.8 Component Library (build these reusable components first)

Before building any page, build these shared components:

```
src/components/ui/
├── Button.jsx          primary / secondary / ghost / danger variants
├── Badge.jsx           colored pill — used for mutation types, node types
├── Card.jsx            surface-1 bg, shadow-sm, radius-lg
├── CodeBlock.jsx       dark surface, JetBrains Mono, line numbers
├── Spinner.jsx         minimal rotating ring, accent color
├── EmptyState.jsx      centered icon + heading + description + CTA button
├── ErrorBoundary.jsx   catches React crashes, shows friendly error card
├── Tooltip.jsx         small dark tooltip on hover
├── Divider.jsx         horizontal rule with optional label
└── PageTransition.jsx  framer-motion wrapper for route changes
```

---

## 4. Application Structure

### 4.1 Route Map

```
/                  → LandingPage          (NEW)
/app               → AppShell             (contains the tool)
/app/editor        → EditorPage           (exists, needs redesign)
/app/ast           → AstPage              (exists, needs redesign)
/app/diff          → DiffPage             (exists, needs fix)
/app/log           → LogPage              (exists, needs redesign)
/learn             → LearnPage            (NEW — animated tutorial)
/learn/lexer       → LexerStage           (NEW)
/learn/parser      → ParserStage          (NEW)
/learn/ast         → AstStage             (NEW)
/learn/semantic    → SemanticStage        (NEW)
/learn/codegen     → CodegenStage         (NEW)
```

### 4.2 File Structure

```
client/src/
├── main.jsx
├── App.jsx                        ← add routes for / and /learn
│
├── components/
│   ├── ui/                        ← NEW: shared UI components (section 3.8)
│   │   ├── Button.jsx
│   │   ├── Badge.jsx
│   │   ├── Card.jsx
│   │   ├── CodeBlock.jsx
│   │   ├── Spinner.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Tooltip.jsx
│   │   └── PageTransition.jsx
│   │
│   ├── layout/                    ← NEW: layout components
│   │   ├── AppShell.jsx           ← sidebar + topbar wrapper for /app/*
│   │   ├── Sidebar.jsx            ← redesigned
│   │   ├── TopBar.jsx             ← redesigned
│   │   └── Navbar.jsx             ← NEW: top nav for landing + learn pages
│   │
│   ├── compiler/                  ← existing compiler components, redesigned
│   │   ├── AstTree.jsx
│   │   ├── AstTree.module.css
│   │   ├── NodeDetail.jsx
│   │   ├── NodeDetail.module.css
│   │   ├── DiffViewer.jsx
│   │   ├── DiffViewer.module.css
│   │   ├── MutationTable.jsx
│   │   └── MutationTable.module.css
│   │
│   └── learn/                     ← NEW: tutorial components
│       ├── StageNav.jsx
│       ├── StageControls.jsx
│       ├── stages/
│       │   ├── LexerStage.jsx
│       │   ├── ParserStage.jsx
│       │   ├── AstStage.jsx
│       │   ├── SemanticStage.jsx
│       │   └── CodegenStage.jsx
│       └── data/
│           └── tutorialData.js    ← pre-computed animation data
│
├── pages/
│   ├── LandingPage.jsx            ← NEW
│   ├── LearnPage.jsx              ← NEW
│   ├── EditorPage.jsx             ← redesign
│   ├── AstPage.jsx                ← redesign
│   ├── DiffPage.jsx               ← fix + redesign
│   └── LogPage.jsx                ← redesign
│
├── store/
│   └── useCompilerStore.js        ← add error boundary integration
│
├── api/
│   └── compile.js                 ← no changes needed
│
└── utils/
    ├── astAdapter.js              ← no changes needed
    ├── motionVariants.js          ← NEW: shared framer-motion variants
    └── tutorialData.js            ← NEW: pre-computed tutorial steps
```

---

## 5. Page-by-Page Specification

---

### 5.1 Landing Page (`/`) — NEW

**Purpose:** Convert first-time visitors. Explain what the tool does, show it working, drive them to `/app/editor`.

**Sections (top to bottom):**

#### Section A — Hero

```
┌─────────────────────────────────────────────────────────┐
│  [Navbar: Logo    Editor  Learn  GitHub]                │
│                                                         │
│  ░░░░ noise texture overlay (3% opacity) ░░░░░░░░░░░░░  │
│                                                         │
│        Break your code.                                 │
│        On purpose.                                      │
│                                                         │
│   Chaos Compiler parses C/C++ into an AST and          │
│   deliberately mutates it — so you can see exactly     │
│   where your code is fragile.                           │
│                                                         │
│   [  Start compiling  →  ]    [ See how it works ]     │
│                                                         │
│   ──────────────────────────────────────────────────   │
│   Animated: token stream scrolling horizontally        │
│   int → KEYWORD  add → IDENT  ( → LPAREN  ...          │
└─────────────────────────────────────────────────────────┘
```

**Hero animation details:**
- On load: heading words stagger in from below (60ms delay between words)
- Background: subtle noise texture (SVG feTurbulence, 3% opacity)
- Below the CTA buttons: an auto-scrolling ticker of tokens from the example C snippet. Uses CSS `animation: scroll linear infinite`. Tokens are colored pills — keyword=orange, ident=blue, number=teal, operator=gray.
- The ticker is purely decorative CSS — no JS required.

#### Section B — How it works (3 steps)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  How Chaos Compiler works                            │
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│  │    1     │    │    2     │    │    3     │       │
│  │  Paste   │ →  │  Parse   │ →  │  Mutate  │       │
│  │  your    │    │  into    │    │  &       │       │
│  │  code    │    │  AST     │    │ Visualize│       │
│  └──────────┘    └──────────┘    └──────────┘       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Cards reveal on scroll with `react-intersection-observer` + framer-motion `itemVariants`. The connecting arrows animate in after the cards appear.

#### Section C — Feature showcase (3 features)

Three feature cards in a grid, each with a small animated preview:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ AST Visualizer  │  │ Mutation Engine  │  │ Learn Mode      │
│                 │  │                 │  │                 │
│ [mini D3 tree   │  │ [animated log   │  │ [stage progress │
│  preview]       │  │  table preview] │  │  bar preview]   │
│                 │  │                 │  │                 │
│ Interactive D3  │  │ 5 mutation types│  │ 5-stage animated│
│ tree of your    │  │ with seed-based │  │ compiler        │
│ parsed code     │  │ reproducibility │  │ walkthrough     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

#### Section D — Mutation types showcase

A horizontal scrolling row of mutation type cards. Each card shows:
- Mutation name (e.g. OPERATOR_MUTATION)
- Before/after code example with syntax highlighting
- What it tests in real code

#### Section E — CTA banner

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   Ready to chaos your code?                         │
│   Paste any C function and see what breaks.         │
│                                                      │
│              [ Open the compiler → ]                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### 5.2 App Shell (`/app/*`) — REDESIGN

The shell wraps all compiler tool pages. Light surface outside, dark editor inside.

```
┌────────────────────────────────────────────────────────────┐
│  TopBar (56px)                                             │
│  Logo  |  Chaos Compiler          [status badge] [Compile]│
├─────────────────┬──────────────────────────────────────────┤
│                 │                                          │
│  Sidebar        │   Page content                          │
│  (220px)        │                                          │
│                 │                                          │
│  Editor    /app │                                          │
│  AST       /ast │                                          │
│  Diff      /dif │                                          │
│  Log       /log │                                          │
│                 │                                          │
│  ───────────    │                                          │
│  Learn     /lrn │                                          │
│                 │                                          │
│  ───────────    │                                          │
│  Seed:          │                                          │
│  [______]       │                                          │
│  Intensity:     │                                          │
│  [medium ▼]     │                                          │
│                 │                                          │
└─────────────────┴──────────────────────────────────────────┘
```

**Sidebar changes from current:**
- Background changes from dark to `--surface-1` (light)
- Active link: `--accent` left border + `--accent-light` background
- Inactive links: `--text-secondary` color
- "Learn" link is visually separated from compiler links with a divider
- Seed and intensity controls move into sidebar (cleaner than options panel)

**TopBar changes:**
- Background: `--surface-0` white with bottom border `--surface-3`
- Left: wordmark "Chaos Compiler" in Bricolage Grotesque 600
- Right: StatusBadge + Upload button + Compile button
- Compile button: `--accent` background, white text, framer-motion tap animation

---

### 5.3 Editor Page (`/app/editor`) — REDESIGN

```
┌──────────────────────────────────────────────────────┐
│  [TopBar]                                            │
├───────────────────────────────┬──────────────────────┤
│                               │  Settings panel      │
│  CodeMirror editor            │  (260px)             │
│  (dark — code-bg)             │  (light — surface-1) │
│                               │  Chaos settings      │
│  flex: 1                      │  ─────────────────   │
│                               │  Seed input          │
│                               │  Intensity select    │
│                               │  ─────────────────   │
│                               │  Mutation types      │
│                               │  (5 toggles)         │
│                               │  ─────────────────   │
│                               │  Last result         │
│                               │  status card         │
│                               │  ─────────────────   │
│                               │  Error display       │
└───────────────────────────────┴──────────────────────┘
```

**New: Mutation type toggles** — let the user enable/disable individual mutation types. Passes enabled types as flags to the API. Each toggle is a small pill with the mutation's color.

**New: Last result card** — shows a mini summary after each compile:
```
Last compile · 3 mutations · seed 42
OPERATOR_MUTATION  line 5
LITERAL_SHIFT      line 8
CONDITION_FLIP     line 12
```

Clicking any row navigates to `/app/log` with that mutation highlighted.

---

### 5.4 AST Page (`/app/ast`) — REDESIGN

```
┌──────────────────────────────────────────────────────┐
│  [TopBar]                                            │
├──────────────────────────────────────────────────────┤
│  Toolbar: [42 nodes · 8 types]  [Legend ●●●●●]      │
│           [JSON toggle]  [PNG export]  [Reset zoom]  │
├────────────────────────────────┬─────────────────────┤
│                                │                     │
│  D3 tree                       │  NodeDetail         │
│  (dark — code-bg)              │  (light — surface-1)│
│                                │                     │
│  Mutated nodes glow orange     │  Type               │
│  All other nodes normal        │  Value              │
│                                │  Line / Col         │
│                                │  Role               │
│                                │  ──────────────     │
│                                │  Description        │
└────────────────────────────────┴─────────────────────┘
```

**New additions vs current:**
- PNG export button — `svg.node().toBlob()` → download
- JSON view toggle — shows raw AST JSON in a CodeBlock instead of tree
- Mutated nodes highlighted — orange glow ring on nodes whose line matches mutation log
- NodeDetail panel now light surface, matching the shell aesthetic

---

### 5.5 Diff Page (`/app/diff`) — FIX + REDESIGN

**Critical fix:** Currently shows the same code on both sides. The right panel must show reconstructed mutated code.

**How to reconstruct mutated text (frontend approach):**

```js
function applyMutations(originalCode, mutations) {
  const lines = originalCode.split('\n');
  const mutated = [...lines];

  mutations.forEach(m => {
    if (!m.line || !m.before || !m.after) return;
    const idx = m.line - 1;
    if (idx >= 0 && idx < mutated.length) {
      // Replace first occurrence of 'before' on that line with 'after'
      mutated[idx] = mutated[idx].replace(m.before, m.after);
    }
  });

  return mutated.join('\n');
}
```

This is imperfect (the before/after in the log are operator strings, not full expressions) but it gives a meaningful visual diff until the C compiler gains a proper code generator.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  [TopBar]                                            │
├──────────────────────────────────────────────────────┤
│  Banner: "3 mutations applied · seed 42"             │
│  (amber if mutations > 0, gray if 0)                 │
├────────────────────────┬─────────────────────────────┤
│  Original              │  Mutated                    │
│  (sticky header)       │  (sticky header)            │
│  ──────────────        │  ──────────────             │
│  1  int add(...) {     │  1  int add(...) {          │
│  2    int x = 10;      │  2    int x = 10;           │
│  3    if (x > 0) {     │  3  ✦ if (!(x > 0)) {      │  ← mutation
│  4      return x + y;  │  4  ✦   return x - y;      │  ← mutation
│  5    }                │  5    }                     │
│  6    return 0;        │  6    return 0;             │
│  7  }                  │  7  }                       │
└────────────────────────┴─────────────────────────────┘
```

Mutated lines on the right: `--warning-light` background + `--accent` left border + `✦` marker.
Synchronized scroll: both panels always at same scroll position.

---

### 5.6 Log Page (`/app/log`) — REDESIGN

```
┌──────────────────────────────────────────────────────┐
│  [TopBar]                                            │
├──────────────────────────────────────────────────────┤
│  Mutation log                                        │
│  Every change the chaos engine made                  │
├──────────────────────────────────────────────────────┤
│  [All] [OPERATOR] [CONDITION] [LITERAL] [RETURN]     │  ← filter pills
│                                     [JSON↓] [CSV↓]  │  ← export buttons
├──────────────────────────────────────────────────────┤
│  #   Type              Line   Before    After        │
│  ─────────────────────────────────────────────────   │
│  1   OPERATOR_MUTATION   5    +         -            │
│  2   LITERAL_SHIFT       8    10        11           │
│  3   CONDITION_FLIP      12   x > 0     !(x > 0)    │
├──────────────────────────────────────────────────────┤
│  3 mutations · 3 unique types · seed 42              │
└──────────────────────────────────────────────────────┘
```

**Changes from current:**
- Light surface (matches new shell)
- Type badges use semantic colors (--mut-operator, --mut-literal etc.)
- Clicking a row highlights that line in the diff page (cross-page navigation)
- Before/After cells use `--font-code` (JetBrains Mono)
- Row hover: `--surface-2` background

---

## 6. Learn Section — Full Specification

### 6.1 Overview

A completely standalone section at `/learn/*`. Uses the same `Navbar` as the landing page (not the AppShell sidebar). This is the animated compiler tutorial.

**The example snippet used throughout all 5 stages:**
```c
int add(int a, int b) {
    if (a > 0) {
        return a + b;
    }
    return b;
}
```

This snippet was chosen because it contains: function declaration, parameters, if statement, binary operator comparison, return statements with expressions, and simple identifiers/literals — enough to demonstrate every compiler stage meaningfully.

### 6.2 LearnPage Shell

```
┌──────────────────────────────────────────────────────┐
│  [Navbar]                                            │
├──────────────────────────────────────────────────────┤
│  Progress dots: ● ○ ○ ○ ○  (filled = current stage) │
│  Stage name: "Stage 1 of 5 — Lexical Analysis"      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Current stage component fills this area]          │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [← Back]  [▶ Play]  [⏭ Step]  [Speed ●──○]  [→ Next]│
└──────────────────────────────────────────────────────┘
```

**StageControls behavior:**
- Play: auto-advances animation at selected speed (0.5x, 1x, 2x)
- Step: advances one animation frame at a time
- Back: goes to previous stage (or restarts current if at beginning)
- Next: goes to next stage (disabled until current stage is complete)
- Speed slider: controls animation playback speed
- Progress dots: clicking a dot jumps to that stage

### 6.3 tutorialData.js — Pre-computed Animation Data

This file contains all data the animations need. It is static — no API calls.

```js
export const SOURCE = `int add(int a, int b) {
    if (a > 0) {
        return a + b;
    }
    return b;
}`;

// Stage 1: Lexer
export const TOKENS = [
  { type: 'KEYWORD', value: 'int',    line: 1, col: 1 },
  { type: 'IDENT',   value: 'add',    line: 1, col: 5 },
  { type: 'LPAREN',  value: '(',      line: 1, col: 8 },
  { type: 'KEYWORD', value: 'int',    line: 1, col: 9 },
  { type: 'IDENT',   value: 'a',      line: 1, col: 13 },
  { type: 'COMMA',   value: ',',      line: 1, col: 14 },
  { type: 'KEYWORD', value: 'int',    line: 1, col: 16 },
  { type: 'IDENT',   value: 'b',      line: 1, col: 20 },
  { type: 'RPAREN',  value: ')',      line: 1, col: 21 },
  { type: 'LBRACE',  value: '{',      line: 1, col: 23 },
  { type: 'KEYWORD', value: 'if',     line: 2, col: 5 },
  { type: 'LPAREN',  value: '(',      line: 2, col: 8 },
  { type: 'IDENT',   value: 'a',      line: 2, col: 9 },
  { type: 'GT',      value: '>',      line: 2, col: 11 },
  { type: 'NUMBER',  value: '0',      line: 2, col: 13 },
  { type: 'RPAREN',  value: ')',      line: 2, col: 14 },
  { type: 'LBRACE',  value: '{',      line: 2, col: 16 },
  { type: 'KEYWORD', value: 'return', line: 3, col: 9 },
  { type: 'IDENT',   value: 'a',      line: 3, col: 16 },
  { type: 'PLUS',    value: '+',      line: 3, col: 18 },
  { type: 'IDENT',   value: 'b',      line: 3, col: 20 },
  { type: 'SEMI',    value: ';',      line: 3, col: 21 },
  { type: 'RBRACE',  value: '}',      line: 4, col: 5 },
  { type: 'KEYWORD', value: 'return', line: 5, col: 5 },
  { type: 'IDENT',   value: 'b',      line: 5, col: 12 },
  { type: 'SEMI',    value: ';',      line: 5, col: 13 },
  { type: 'RBRACE',  value: '}',      line: 6, col: 1 },
  { type: 'EOF',     value: '',       line: 6, col: 2 },
];

// DFA states for Stage 1
export const DFA_STATES = [
  { id: 'START',   label: 'Start',   x: 80,  y: 150 },
  { id: 'IDENT',   label: 'Ident',   x: 240, y: 80  },
  { id: 'NUMBER',  label: 'Number',  x: 240, y: 220  },
  { id: 'OP',      label: 'Op',      x: 400, y: 150 },
  { id: 'ACCEPT',  label: 'Accept',  x: 560, y: 150 },
];

export const DFA_TRANSITIONS = [
  { from: 'START',  to: 'IDENT',  label: 'a-z A-Z _' },
  { from: 'START',  to: 'NUMBER', label: '0-9'        },
  { from: 'START',  to: 'OP',     label: '+ - * / < >' },
  { from: 'IDENT',  to: 'IDENT',  label: 'a-z 0-9 _' },
  { from: 'IDENT',  to: 'ACCEPT', label: 'other'      },
  { from: 'NUMBER', to: 'NUMBER', label: '0-9'        },
  { from: 'NUMBER', to: 'ACCEPT', label: 'other'      },
  { from: 'OP',     to: 'ACCEPT', label: 'any'        },
];

// Token → DFA state mapping (which state is active per token)
export const TOKEN_DFA_STATE = {
  KEYWORD: 'IDENT',   // keywords are identifiers that match a reserved word
  IDENT:   'IDENT',
  NUMBER:  'NUMBER',
  GT:      'OP',
  PLUS:    'OP',
  LPAREN:  'OP',
  RPAREN:  'OP',
  LBRACE:  'OP',
  RBRACE:  'OP',
  COMMA:   'OP',
  SEMI:    'OP',
  EOF:     'ACCEPT',
};

// Stage 2: Parser call stack frames
export const PARSE_STEPS = [
  { fn: 'parse_program',        token: null,    rule: 'program → function*' },
  { fn: 'parse_function',       token: 'int',   rule: 'function → type name ( params ) block' },
  { fn: 'parse_block',          token: '{',     rule: 'block → { statement* }' },
  { fn: 'parse_statement',      token: 'if',    rule: 'statement → if ( expr ) block' },
  { fn: 'parse_expr',           token: 'a',     rule: 'expr → comparison' },
  { fn: 'parse_comparison',     token: 'a',     rule: 'comparison → primary op primary' },
  { fn: 'parse_primary',        token: 'a',     rule: 'primary → IDENT' },
  { fn: 'parse_primary',        token: '0',     rule: 'primary → NUMBER' },
  { fn: 'parse_statement',      token: 'return',rule: 'statement → return expr ;' },
  { fn: 'parse_expr',           token: 'a',     rule: 'expr → addition' },
  { fn: 'parse_addition',       token: 'a',     rule: 'addition → primary + primary' },
];

// Stage 3: AST nodes in build order
export const AST_BUILD_STEPS = [
  { id: 'program',  type: 'Program',   parent: null,       x: 340, y: 40  },
  { id: 'func',     type: 'FuncDecl',  parent: 'program',  x: 340, y: 120 },
  { id: 'param_a',  type: 'VarDecl',   parent: 'func',     x: 180, y: 200, value: 'a' },
  { id: 'param_b',  type: 'VarDecl',   parent: 'func',     x: 280, y: 200, value: 'b' },
  { id: 'block',    type: 'Block',     parent: 'func',     x: 400, y: 200 },
  { id: 'if',       type: 'If',        parent: 'block',    x: 340, y: 280 },
  { id: 'cond',     type: 'BinaryOp',  parent: 'if',       x: 220, y: 360, value: '>' },
  { id: 'ident_a',  type: 'Ident',     parent: 'cond',     x: 160, y: 440, value: 'a' },
  { id: 'num_0',    type: 'Number',    parent: 'cond',     x: 280, y: 440, value: '0' },
  { id: 'ret1',     type: 'Return',    parent: 'if',       x: 460, y: 360 },
  { id: 'plus',     type: 'BinaryOp',  parent: 'ret1',     x: 460, y: 440, value: '+' },
  { id: 'ret2',     type: 'Return',    parent: 'block',    x: 500, y: 280 },
];

// Stage 4: Semantic analysis steps
export const SEMANTIC_STEPS = [
  { nodeId: 'program', result: 'ok',      note: 'Root node — enter scope'             },
  { nodeId: 'func',    result: 'ok',      note: 'FuncDecl "add" registered in scope'  },
  { nodeId: 'param_a', result: 'ok',      note: 'VarDecl "a" type: int'               },
  { nodeId: 'param_b', result: 'ok',      note: 'VarDecl "b" type: int'               },
  { nodeId: 'if',      result: 'ok',      note: 'If statement — condition is boolean' },
  { nodeId: 'cond',    result: 'ok',      note: 'BinaryOp ">" — int > int → bool'     },
  { nodeId: 'ident_a', result: 'ok',      note: 'Ident "a" — resolved to int param'   },
  { nodeId: 'num_0',   result: 'ok',      note: 'Number "0" — type: int'              },
  { nodeId: 'ret1',    result: 'ok',      note: 'Return type matches function: int'   },
  { nodeId: 'plus',    result: 'ok',      note: 'BinaryOp "+" — int + int → int'      },
  { nodeId: 'ret2',    result: 'ok',      note: 'Return type matches function: int'   },
];

// Stage 4: Symbol table entries added during semantic pass
export const SYMBOL_TABLE_STEPS = [
  { step: 2,  entry: { name: 'add', type: 'function', returns: 'int' }},
  { step: 3,  entry: { name: 'a',   type: 'int',      scope: 'add'   }},
  { step: 4,  entry: { name: 'b',   type: 'int',      scope: 'add'   }},
];

// Stage 5: Code generation — each AST node produces output lines
export const CODEGEN_STEPS = [
  { nodeId: 'func',    output: 'int add(int a, int b) {'    },
  { nodeId: 'if',      output: '    if (a > 0) {'           },
  { nodeId: 'ret1',    output: '        return a + b;'      },
  { nodeId: null,      output: '    }'                      },
  { nodeId: 'ret2',    output: '    return b;'              },
  { nodeId: null,      output: '}'                          },
];
```

### 6.4 Stage 1 — LexerStage.jsx

**Layout:**
```
┌──────────────────────┬────────────────────────────────┐
│  Source code         │  DFA diagram                   │
│  (left panel)        │  (right panel)                 │
│                      │                                │
│  int add(int a,  ←   │  [START] →a-z→ [IDENT] →→     │
│  int b) {            │         →0-9→ [NUMBER]  Accept │
│  ▲ cursor here       │         →op→  [OP]    ↗        │
│                      │                                │
│  Current char: i     │  Active state glows            │
├──────────────────────┴────────────────────────────────┤
│  Token stream: [int KEYWORD] [add IDENT] [( LPAREN]..│
└───────────────────────────────────────────────────────┘
```

**Animation sequence (per step):**
1. Cursor in source code advances to next character group
2. Matching DFA state circle pulses (scale 1→1.15→1, stroke brightens)
3. If token is complete: token pill flies from source panel to token stream
4. Token stream scrolls right if overflowing

**Token pill colors:**
- KEYWORD → `--accent` orange
- IDENT → `--info` blue
- NUMBER → `--node-literal` teal
- Operators/punctuation → `--text-secondary` gray

**DFA diagram implementation:**
Use inline SVG (not D3 for this — D3 is overkill for a fixed diagram).
Circles at fixed positions. Arrows as SVG `<path>` elements.
Glow effect: `filter: drop-shadow(0 0 6px var(--node-literal))` via CSS class.

### 6.5 Stage 2 — ParserStage.jsx

**Layout:**
```
┌────────────────┬──────────────────┬──────────────────┐
│  Token stream  │  Grammar rules   │  Call stack      │
│  (left)        │  (center)        │  (right)         │
│                │                  │                  │
│  [int] ←active │  program →       │  parse_program   │
│  [add]         │    function*     │  parse_function  │
│  [(]           │                  │  parse_block     │
│  ...           │  ► function →    │ ►parse_statement │ ← active
│                │    type name     │                  │
│                │    ( params )    │                  │
│                │    block         │                  │
└────────────────┴──────────────────┴──────────────────┘
```

**Animation per step:**
1. Current token in token stream gets `--accent` highlight
2. Matching grammar rule highlights in center panel
3. Current function name in call stack highlights
4. When a rule completes: checkmark appears next to it

### 6.6 Stage 3 — AstStage.jsx

**Layout:** Full width SVG canvas. Nodes appear one by one.

**Animation per step (using framer-motion + SVG):**
1. New node rect fades in with scale `0.5 → 1.0` over 300ms
2. After node appears, edge draws from parent center to new node
   (SVG `stroke-dashoffset` animation from full length to 0)
3. Previous level dims to 60% opacity as new level builds

**Node appearance:**
- Same color system as AstTree in the app
- Node rects: 120×40px, rx=6
- Labels: type on top line, value (if any) on bottom line in muted color
- Edges: `--code-border` color, 1.5px, animated draw

### 6.7 Stage 4 — SemanticStage.jsx

**Layout:**
```
┌──────────────────────────┬──────────────────────────┐
│  AST tree (from Stage 3) │  Symbol table            │
│                          │                          │
│  All nodes gray initially│  name  type    scope     │
│                          │  ─────────────────────   │
│  Scanner beam sweeps     │  add   func    global    │
│  top to bottom           │  a     int     add       │
│                          │  b     int     add       │
│  Nodes turn:             │                          │
│  ✓ green = ok            │  Entries appear as       │
│  ⚠ amber = warning       │  scanner reaches them    │
│  ✗ red   = error         │                          │
└──────────────────────────┴──────────────────────────┘
```

**Scanner beam:** A horizontal line (`--accent` color, 1px, 20% opacity) that animates from `y=0` to `y=treeHeight` over the course of the stage. As it passes each node, that node's status badge animates in.

### 6.8 Stage 5 — CodegenStage.jsx

**Layout:**
```
┌──────────────────────────┬──────────────────────────┐
│  AST tree                │  Generated code          │
│  (left — dark)           │  (right — dark)          │
│                          │                          │
│  Current node:           │  int add(int a, int b) { │
│  [FuncDecl] glows orange │  ▶  if (a > 0) {         │ ← typing in
│                          │                          │
│  Connecting line from    │                          │
│  node → output line      │                          │
└──────────────────────────┴──────────────────────────┘
```

**Animation per step:**
1. AST node highlights (orange glow)
2. Connecting line animates from node to right panel
3. Output line "types itself in" — character by character using a typewriter effect
4. Cursor blinks at end of current line

**Typewriter implementation:**
```js
// Use a simple useEffect with setInterval
useEffect(() => {
  const line = CODEGEN_STEPS[currentStep].output;
  let i = 0;
  const interval = setInterval(() => {
    setDisplayedText(prev => prev + line[i]);
    i++;
    if (i >= line.length) clearInterval(interval);
  }, 30 / speedMultiplier);
  return () => clearInterval(interval);
}, [currentStep, speedMultiplier]);
```

---

## 7. Bug Fixes Required Before Redesign

Fix these before touching any design work. They will cause test failures if left unfixed.

### 7.1 .exe path bug (CRITICAL)

**File:** `server/utils/runner.js`

```js
// CURRENT (broken on Windows):
const COMPILER_BIN = path.resolve(__dirname, '../../compiler/chaos-compiler');

// FIXED:
const COMPILER_BIN = process.env.COMPILER_PATH ||
  path.resolve(
    __dirname,
    process.platform === 'win32'
      ? '../../compiler/chaos-compiler.exe'
      : '../../compiler/chaos-compiler'
  );
```

### 7.2 Health route ordering

**File:** `server/index.js`

Move `app.get('/api/health', ...)` to BEFORE `app.use('/api', compileRouter)`.

### 7.3 Dead CSS

**File:** `client/src/App.css`

Delete all Vite scaffold styles. Keep only global resets and CSS variable declarations.

### 7.4 React Error Boundary

**Create:** `client/src/components/ui/ErrorBoundary.jsx`

```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Wrap the entire app in `App.jsx`:
```jsx
<ErrorBoundary>
  <RouterProvider ... />
</ErrorBoundary>
```

---

## 8. Build Order for the Developer

Follow this exact sequence. Each phase is independently testable.

```
Phase A — Foundation (2-3 days)
  1. Fix all 4 bugs from section 7
  2. Install framer-motion
  3. Build all shared UI components (section 3.8)
  4. Implement design system (CSS variables, fonts, spacing)
  5. Verify no regressions in existing functionality

Phase B — Shell redesign (1-2 days)
  6. Redesign AppShell, Sidebar, TopBar
  7. Redesign EditorPage (move options into sidebar)
  8. Add mutation type toggles to settings

Phase C — Tool pages (2-3 days)
  9. Redesign AstPage (add PNG export, JSON toggle, mutation glow)
  10. Fix and redesign DiffPage (fix same-code bug, new layout)
  11. Redesign LogPage (light surface, row click navigation)

Phase D — Landing page (2-3 days)
  12. Build Navbar component
  13. Build LandingPage (all 5 sections)
  14. Add page transition animations
  15. Test on mobile (landing page must be responsive)

Phase E — Learn section (4-5 days)
  16. Build LearnPage shell and StageControls
  17. Build tutorialData.js (all pre-computed data)
  18. Build LexerStage (DFA + token stream)
  19. Build ParserStage (grammar + call stack)
  20. Build AstStage (tree building animation)
  21. Build SemanticStage (scanner beam + symbol table)
  22. Build CodegenStage (typewriter output)
  23. Wire all stages together with progress tracking
```

---

## 9. Future Features — Design With These in Mind

The following features will be added in future phases. The current design must not make them impossible or awkward to add. Notes on how to leave room for each:

**Mutation history / run comparison**
Leave a collapsible "History" panel slot in the AppShell sidebar. The state store should be designed to hold an array of runs, not just the latest.

**Shareable URL**
All compile options (code, seed, intensity) should be serializable. Design the URL structure as `/app/editor?seed=42&intensity=medium`. Don't hash-encode the full code — use a short ID that maps to stored results.

**Download mutated code**
The Diff page toolbar already has an export area. Reserve a "Download .c" button slot there, currently disabled with a tooltip "Coming soon — requires code generator."

**Custom mutation rules**
The intensity/seed settings panel in the sidebar should have a clear visual slot for "Custom rules" below the intensity selector. Show it as a locked feature with a lock icon for now.

**Step-through mutation replay**
The AST page toolbar has space for a "Replay mutations" button next to the reset zoom. Reserve that slot. When clicked it will eventually animate each mutation one by one on the tree.

**Expanded C language support**
No UI changes needed — this is purely a compiler change. The frontend handles whatever the compiler produces.

**Dark mode toggle**
The design system uses CSS variables throughout. Add a `[data-theme="dark"]` attribute to `<html>` and provide dark overrides for all surface/text variables. The code panels are already dark and don't change. Only the shell, landing page, and learn section need dark variants.

---

## 10. Responsive Design Requirements

**Landing page (`/`):** Fully responsive. Mobile-first. Hero text scales from `--text-2xl` on mobile to `--text-hero` on desktop. Feature cards stack vertically on mobile.

**App shell (`/app/*`):** Minimum supported width: 900px. Below 900px show a "Please use a wider screen for the compiler tool" message. The tool is not designed for mobile use.

**Learn section (`/learn/*`):** Responsive down to 768px. Stage layouts shift from side-by-side to stacked on smaller screens.

---

## 11. Performance Requirements

- Lighthouse performance score ≥ 90 on landing page
- First Contentful Paint ≤ 1.5s
- D3 tree redraws ≤ 100ms for ASTs up to 200 nodes
- Tutorial stage transitions ≤ 300ms
- No layout shift during font loading (use `font-display: swap`)
- framer-motion animations must respect `prefers-reduced-motion`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; }
  }
  ```

---

## 12. Deliverables Checklist

Before handoff, verify every item:

**Design system:**
  [ ] All CSS variables defined and working in light mode
  [ ] Bricolage Grotesque + DM Sans + JetBrains Mono loading correctly
  [ ] All shared UI components built and documented
  [ ] framer-motion page transitions working on all routes

**Bug fixes:**
  [ ] .exe path bug fixed and tested on Windows
  [ ] Health route ordering fixed
  [ ] Dead CSS removed
  [ ] ErrorBoundary wrapping the app

**Existing pages redesigned:**
  [ ] EditorPage — new light shell, mutation type toggles, last result card
  [ ] AstPage — PNG export, JSON toggle, mutated node glow
  [ ] DiffPage — fixed same-code bug, mutated text reconstruction
  [ ] LogPage — light surface, row click cross-navigation

**New pages:**
  [ ] LandingPage — all 5 sections, hero animation, token ticker
  [ ] LearnPage — all 5 stages, play/step/speed controls
  [ ] LexerStage — DFA + token stream animation
  [ ] ParserStage — grammar rules + call stack animation
  [ ] AstStage — tree building animation
  [ ] SemanticStage — scanner beam + symbol table
  [ ] CodegenStage — typewriter output

**Quality:**
  [ ] No console errors on any page
  [ ] No TypeScript/lint errors
  [ ] Lighthouse performance ≥ 90 on landing page
  [ ] All animations respect prefers-reduced-motion
  [ ] ErrorBoundary tested with a deliberate crash
  [ ] Works on Chrome, Firefox, Safari, Edge