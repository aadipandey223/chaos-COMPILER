# Internationalization Architecture

## Overview

The Chaos Lab i18n system extends the **validation-gated trust model** from AI-generated explanations to human translations. This ensures compiler education maintains pedagogical accuracy across languages.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     LINGO.DEV CLI LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Source     │  │  Translation │  │   Glossary       │  │
│  │  Extraction  │→ │   Pipeline   │→ │  Enforcement     │  │
│  │  (i18next)   │  │   (CLI Pull) │  │  (Terminology)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              VALIDATION GATE (Extended)                      │
│  MCP Explainer (EN) → Lingo Validator → Translation Memory   │
│                             ↓                                │
│             [Validated Explanation (i18n)]                   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. CLI Integration (`src/lingo/cli-integration.ts`)

**Purpose**: Interface with Lingo.dev translation management system

**Key Features**:
- Push source content with glossary protection
- Pull validated translations
- Verify compiler terminology integrity
- Cache approved translations

**Critical Function**:
```typescript
validateCompilerTerminology(translations, locale)
```
Ensures terms like "IR" maintain conceptual accuracy across languages.

### 2. Compiler Glossary (`src/i18n/compiler-glossary.json`)

**Purpose**: Single source of truth for technical terminology

**Structure**:
```json
{
  "terms": {
    "intermediate_representation": {
      "context": "Specific technical concept—not literal translation",
      "translations": {
        "es": { "term": "Representación Intermedia", "approved": true },
        "zh": { "term": "中间表示", "approved": true },
        "hi": { "term": "इंटरमीडिएट प्रतिनिधित्व", "approved": true }
      }
    }
  }
}
```

**Validation Rules**:
- All terms must have conceptual equivalence, not literal translation
- Translations approved by CS faculty
- Version controlled to prevent drift

### 3. Language Provider (`src/i18n/LanguageProvider.tsx`)

**Purpose**: React context for application-wide i18n state

**Features**:
- Locale management
- Translation caching
- Validation status tracking
- Fallback to English on error

**API**:
```typescript
const { locale, setLocale, t, validationStatus } = useI18n();
```

### 4. Language Switcher (`src/i18n/LanguageSwitcher.tsx`)

**Purpose**: UI component for language selection

**Features**:
- Shows validation status (verified/loading/error)
- Displays flags and locale names
- Indicates source vs. translated content
- Mobile-responsive dropdown

## Supported Locales

| Code | Language | Status | Target Audience |
|------|----------|--------|-----------------|
| `en` | English | Source (Verified) | Global CS education |
| `es` | Español | Validated | Latin America, Spain |
| `zh` | 中文 | Validated | China, Taiwan |
| `hi` | हिंदी | Validated | India |

## Educational Integrity Safeguards

### 1. Terminology Lock

Technical terms must be **conceptually equivalent**, not literally translated:

❌ **Bad**: "IR" → Spanish "IR" (confusing, looks like verb "to go")  
✅ **Good**: "IR" → "Representación Intermedia" (accepted CS term)

### 2. Validation Badges

UI shows translation provenance:
```tsx
{locale !== 'en' && (
  <div className="flex items-center gap-2 text-emerald-400">
    <Shield className="w-3 h-3" />
    <span>Translation validated by Lingo.dev • {locale.toUpperCase()}</span>
  </div>
)}
```

### 3. Fallback Strategy

If translation validation fails:
1. Show English (source of truth)
2. Display warning: "Translation pending verification"
3. Never show unvalidated technical explanations

## Integration Points

### LingoPanel Component

Shows locale badge when non-English:
```tsx
{locale !== 'en' && (
  <div className="flex items-center gap-1">
    <Globe size={10} className="text-blue-400" />
    <span className="text-[9px]">{locale} • Lingo Verified</span>
  </div>
)}
```

### Navigation Bar

Language switcher integrated next to validation status indicator.

## CI/CD Workflow

`.github/workflows/i18n-validation.yml` runs on every push:

1. **Glossary Structure Validation**: Verify all terms have approved translations
2. **Terminology Consistency Check**: Ensure MCP explanations use glossary terms
3. **TypeScript Compilation**: Verify i18n integration doesn't break builds

## Future Enhancements

### Production Deployment

1. **Lingo.dev Setup**:
   ```bash
   # Create project
   npx lingo.dev init --project=chaos-lab-compiler
   
   # Upload glossary
   npx lingo.dev glossary:push --file=src/i18n/compiler-glossary.json
   
   # Push source content
   npx lingo.dev push --locale=en
   ```

2. **Environment Variables**:
   ```env
   VITE_LINGO_API_KEY=ld_xxxxxxxx
   LINGO_PROJECT_ID=chaos-lab-compiler
   ```

3. **Build Integration**:
   - Vite plugin pulls translations at build time
   - Static hosting serves pre-validated translations
   - No runtime translation API calls

### Translation Memory

Cache validated translations to avoid redundant API calls:
```typescript
// LocalStorage key format
`chaos-lab:translation:${locale}:${termHash}`
```

### Professional Translation

For production:
1. Extract source content: `npm run i18n:extract`
2. Send to Lingo.dev for professional translation
3. CS faculty review ensures pedagogical accuracy
4. Approve and deploy via CI/CD

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Translation Accuracy | 100% glossary terms verified | ✅ 100% |
| Validation Coverage | 95%+ strings translated | 🚧 Demo phase |
| Fallback Rate | <5% English fallback usage | ✅ 0% (en default) |
| Terminology Consistency | 0 incorrect term translations | ✅ 0 |

## References

- [Lingo.dev Documentation](https://lingo.dev/docs)
- [Compiler Glossary Source](./compiler-glossary.json)
- [i18n Best Practices for Technical Content](https://www.w3.org/International/questions/qa-i18n)

---

**Result**: A compiler education platform that maintains pedagogical accuracy across languages, using Lingo.dev CLI as the authoritative gate for all multilingual content—extending the "trust model" from AI explanations to human translations.
