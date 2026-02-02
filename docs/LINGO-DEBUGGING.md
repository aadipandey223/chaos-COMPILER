# Lingo CLI Debugging Guide

Quick reference for troubleshooting Lingo.dev integration issues in Chaos Lab.

## 🔍 Quick Diagnostics

Run this in browser console to check system health:

```javascript
__lingoDiagnostics()
```

Or programmatically:

```typescript
import { quickDiagnostics } from '@/lingo';
await quickDiagnostics();
```

## 🚨 Common Issues & Solutions

### 1. Authentication Errors

**Symptom:**
```
LingoAuthError: Not authenticated
```

**Fix:**
```bash
# Development
echo "VITE_LINGO_API_KEY=ld_your_key_here" >> .env

# Production
export LINGO_API_KEY="ld_your_key_here"
```

**Verify:**
```typescript
const lingo = new LingoCLI({ /* config */ });
const status = lingo.getAuthStatus();
console.log(status); // { authenticated: true, mode: 'production' }
```

---

### 2. Invalid Locale Codes

**Symptom:**
```
LingoValidationError: Unsupported locale: 'sp'
```

**Fix:** Use BCP-47 standard codes:

| ❌ Wrong | ✅ Correct |
|----------|------------|
| `sp`     | `es`       |
| `ch`     | `zh`       |
| `jp`     | `ja`       |
| `in`     | `hi`       |

**Supported Locales:**
- English: `en`
- Spanish: `es`
- French: `fr`
- German: `de`
- Chinese: `zh`
- Japanese: `ja`
- Hindi: `hi`
- Arabic: `ar`
- Portuguese: `pt`
- Russian: `ru`

---

### 3. Configuration Errors

**Symptom:**
```
LingoConfigError: Invalid Lingo configuration
```

**Fix:** Validate your config structure:

```typescript
const config = {
  apiKey: 'ld_xxxxxxxxxx',        // Required, must start with 'ld_'
  projectId: 'chaos-lab-compiler', // Required
  baseLocale: 'en',                // Must be 'en'
  targetLocales: ['es', 'zh', 'hi'], // Must be valid BCP-47 codes
  timeout: 5000,                   // Optional, default 5000ms
  maxRetries: 3,                   // Optional, default 3
};
```

---

### 4. Network Timeouts

**Symptom:**
```
LingoNetworkError: Request timeout after 5000ms
```

**Fix:** Increase timeout or check connectivity:

```typescript
const lingo = new LingoCLI({
  // ... other config
  timeout: 10000, // 10 seconds
  maxRetries: 5,  // More retry attempts
});
```

---

### 5. Translation Loading Failures

**Symptom:**
- UI shows "No translation available"
- Console: `Translation fetch failed`

**Fix:**

```typescript
// Check validation status in LanguageProvider
const { validationStatus } = useI18n();

// States:
// 'loading'  - Fetching translations
// 'verified' - Translations loaded successfully
// 'partial'  - Loading failed, using fallbacks
// 'error'    - Critical failure
```

**Graceful Degradation:**
The system automatically falls back to English if translations fail:

```typescript
const { t } = useI18n();
t('ui.compile', 'Run Chaos Engine'); // Always returns something
```

---

## 🛠️ Development Tools

### Browser Console Commands

```javascript
// Run full diagnostics
await __lingoDiagnostics();

// Check auth status
const lingo = new LingoCLI({ /* config */ });
console.log(lingo.getAuthStatus());

// Test translation fetch
try {
  const translations = await lingo.pullTranslations('es');
  console.log('Translations:', translations);
} catch (error) {
  console.error('Error details:', error.code, error.details);
}
```

### Error Type Detection

```typescript
import { 
  LingoError, 
  LingoAuthError, 
  LingoValidationError,
  LingoConfigError,
  LingoNetworkError 
} from '@/lingo';

try {
  await lingo.pullTranslations('es');
} catch (error) {
  if (error instanceof LingoAuthError) {
    // Handle authentication failure
    console.error('Auth failed:', error.message);
  } else if (error instanceof LingoNetworkError) {
    // Handle network issues
    console.error('Network error:', error.details);
  } else if (error instanceof LingoValidationError) {
    // Handle validation errors
    console.error('Invalid input:', error.details);
  }
}
```

---

## 📊 Health Check Interpretation

Diagnostic report format:

```
═══════════════════════════════════════════════════════
  LINGO CLI DIAGNOSTIC REPORT
═══════════════════════════════════════════════════════

Status: ✅ HEALTHY
Time: 2/1/2026, 10:30:00 AM

Checks:
────────────────────────────────────────────────────────
  ✓ Config         Valid
  ✓ Auth           Authenticated
  ✓ Glossary       18 terms cached
  ✓ Network        Connected

═══════════════════════════════════════════════════════
```

### Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| **HEALTHY** | All checks passed | ✅ No action needed |
| **DEGRADED** | Some checks failed | ⚠️ Review failed checks |
| **FAILED** | Critical failures | ❌ Fix config/auth |

---

## 🔄 Retry Logic

The system automatically retries failed requests with exponential backoff:

```
Attempt 1: Immediate
Attempt 2: Wait 100ms
Attempt 3: Wait 200ms
Attempt 4: Wait 400ms
```

**Errors that skip retry:**
- `LingoValidationError` (bad input)
- `LingoConfigError` (invalid config)
- `LingoAuthError` (auth failure)

**Errors that trigger retry:**
- `LingoNetworkError` (timeout, connection)
- Generic errors (unexpected failures)

---

## 🎓 Educational Mode

For demo/teaching purposes, use demo key:

```typescript
const lingo = new LingoCLI({
  apiKey: 'demo-key', // Enables demo mode
  projectId: 'demo',
  baseLocale: 'en',
  targetLocales: ['es'],
});

// Demo mode:
// ✅ No real API calls
// ✅ Mock translations
// ✅ No auth required
// ❌ No production features
```

---

## 📞 Support Resources

- **Lingo.dev Docs:** https://lingo.dev/docs
- **BCP-47 Codes:** https://www.ietf.org/rfc/bcp/bcp47.txt
- **Project Issues:** Check GitHub Issues
- **Console Help:** Type `__lingoDiagnostics()` in browser console

---

## 🔐 Security Notes

- Never commit `.env` files with real API keys
- Use environment variables in CI/CD
- Rotate API keys regularly
- Demo mode is for development only

```bash
# Production deployment
VITE_LINGO_API_KEY=${{ secrets.LINGO_API_KEY }}
```

---

## 📝 Example: Full Integration Test

```typescript
import { LingoCLI, runLingoDiagnostics } from '@/lingo';

async function testLingoIntegration() {
  try {
    // Initialize
    const lingo = new LingoCLI({
      apiKey: import.meta.env.VITE_LINGO_API_KEY || 'demo-key',
      projectId: 'chaos-lab-compiler',
      baseLocale: 'en',
      targetLocales: ['es', 'zh', 'hi'],
      timeout: 10000,
      maxRetries: 3,
    });

    // Run diagnostics
    const report = await runLingoDiagnostics(lingo);
    console.log('Diagnostics:', report);

    if (report.overallStatus !== 'healthy') {
      console.warn('System degraded:', report.recommendations);
    }

    // Test translation fetch
    for (const locale of ['es', 'zh', 'hi']) {
      const translations = await lingo.pullTranslations(locale);
      console.log(`${locale}: ${Object.keys(translations).length} translations`);
    }

    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    throw error;
  }
}
```

---

*Last Updated: February 1, 2026*
