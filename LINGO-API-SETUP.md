# Lingo.dev API Integration - Production Configuration

## Overview

The Chaos Compiler uses **real-time Lingo.dev API integration** for production-grade translation management. All translations are fetched directly from the Lingo API - no mock data or fallbacks.

## How It Works

1. **API-Only Mode**: System fetches translations from `https://api.lingo.dev/v1/translations/{locale}`
2. **Error Handling**: If API fails, user is notified and system reverts to English
3. **Production-Ready**: Proper authentication, error states, and user feedback

## API Configuration

### Environment Variables

**Required** - Add to your `.env` file:

```bash
# Lingo.dev API endpoint (optional, defaults to https://api.lingo.dev/v1)
VITE_LINGO_API_URL=https://api.lingo.dev/v1

# Lingo.dev API key (REQUIRED for production)
VITE_LINGO_API_KEY=ld_your_api_key_here
```

### Production API Key

**Required** - Get your Lingo.dev API key:

1. Sign up at [lingo.dev](https://lingo.dev)
2. Create a project for "chaos-lab-compiler"
3. Generate an API key (format: `ld_xxxxxxxxxxxxx`)
4. Add to `.env` as `VITE_LINGO_API_KEY`

## API Endpoints

### Translations Endpoint

```
GET https://api.lingo.dev/v1/translations/{locale}
Authorization: Bearer {apiKey}
```

**Response Format:**
```json
{
  "app.title": "Chaos Lab Compiler",
  "ui.editor.run": "Ejecutar",
  "ui.editor.chaos": "Caos",
  // ... 250+ translation keys
}
```

### Authentication Endpoint

```
GET https://api.lingo.dev/v1/auth/verify
Authorization: Bearer {apiKey}
```

## Features

### ✅ Real-Time API Integration

- Direct API calls to Lingo.dev on every language switch
- Production-grade authentication and validation
- Comprehensive error handling and user feedback

### ✅ Production Error Handling

- Network timeouts (5 second default)
- HTTP error status handling with user alerts
- Authentication validation on startup
- Retry logic with exponential backoff
- Automatic fallback to English on failure

### ✅ Glossary Integration

- Compiler terminology validated against approved glossary
- `getTerm()` method for localized technical terms
- Ensures pedagogical accuracy across languages

## Usage in Components

### Basic Translation

```javascript
import { useI18n } from '@/i18n/LanguageProvider';

function MyComponent() {
  const { t } = useI18n();
  
  return <button>{t('ui.editor.run', 'Run')}</button>;
}
```

### Compiler Terminology

```javascript
import { useI18n } from '@/i18n/LanguageProvider';

function TechDocs() {
  const { getTerm } = useI18n();
  
  // Returns localized compiler term from glossary
  return <p>The {getTerm('IR')} stage optimizes code...</p>;
}
```

### Direct LingoCLI Access

```javascript
import { useI18n } from '@/i18n/LanguageProvider';

function AdvancedFeature() {
  const { lingo } = useI18n();
  
  // Access LingoCLI methods directly
  const glossary = lingo.getGlossary();
  const term = lingo.getLocalizedTerm('opaque_predicate', 'es');
  
  return <div>{term}</div>;
}
```

## Translation Keys

The system requires 250+ translation keys across these namespaces (must be published on Lingo.dev):

- **app.*** - Application-level (title, tabs, headers)
- **ui.*** - UI components (buttons, labels, tooltips)
- **chaos.*** - Chaos engineering features
- **pipeline.*** - Compilation pipeline stages
- **ir.*** - IR transformation timeline
- **mcp.*** - Model Context Protocol explanations

All keys must be present in target locales (es, zh, hi) for the application to function properly.

## Monitoring

Check browser console for API status:

```
[Lingo] Authentication validated
[Lingo API] Successfully fetched 250 translations for es
[i18n] Loaded 250 translations for es
```

Errors will show:
```
[i18n] ❌ Network error - Lingo API unreachable
[i18n] ❌ Authentication failed - verify VITE_LINGO_API_KEY is valid
```

## Troubleshooting

### API Not Being Called

1. Check console for authentication errors
2. Verify `VITE_LINGO_API_KEY` is set correctly
3. Ensure API key format is `ld_xxxxx` or `api_xxxxx`
4. Check network tab in DevTools for API requests

### Authentication Errors

1. Verify API key format: `ld_xxxxxxxxxxxxx` or `api_xxxxxxxxxxxxx`
2. Check key is active on lingo.dev dashboard
3. Ensure key has project access for `chaos-lab-compiler`
4. Try regenerating API key if needed

### CORS Issues

If seeing CORS errors:

1. Contact Lingo.dev support to whitelist your domain
2. Use Lingo.dev's proxy endpoint if available
3. Run API requests through your backend as proxy

### Translations Not Loading

If translations fail to load:

1. Check API key is valid and not expired
2. Verify project ID `chaos-lab-compiler` exists on Lingo.dev
3. Ensure translations are published for target locales (es, zh, hi)
4. System will alert user and fall back to English

## Performance

- **API Response Time**: ~200-500ms (network dependent)
- **Timeout Protection**: 5 seconds max wait
- **Retry Logic**: Up to 3 attempts with exponential backoff
- **Caching**: Translations cached until language switch

## Production Deployment

### Required Environment Variables

```env
VITE_LINGO_API_KEY=api_flh335hyn7ms7h3sfeir9w46
VITE_LINGO_API_URL=https://api.lingo.dev/v1
```

### Deployment Checklist

- [ ] Valid production API key configured
- [ ] API key has access to `chaos-lab-compiler` project
- [ ] Target locales (es, zh, hi) have published translations
- [ ] Network allows HTTPS requests to api.lingo.dev
- [ ] Error alerts are acceptable for production UX
- [ ] Console logging reviewed for sensitive data

### Error Handling in Production

When translations fail to load:
1. User sees alert: "Failed to load {locale} translations. Falling back to English."
2. System automatically reverts to English locale
3. Error details logged to console for debugging
4. Application continues functioning in English

## Summary

The Lingo CLI integration is **production-ready** with:
- Direct API calls to Lingo.dev (no mocks or demos)
- Real-time translation fetching
- Proper authentication and error handling
- User-facing error alerts
- Automatic fallback to English on failure
- Zero tolerance for missing API configuration
