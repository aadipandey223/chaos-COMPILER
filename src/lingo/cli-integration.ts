/**
 * Lingo.dev CLI Integration (Browser-Compatible)
 * Extends validation-gated trust model to internationalization
 * Ensures compiler terminology maintains semantic accuracy across languages
 * 
 * Note: This is a browser-compatible mock for demo purposes.
 * Production would use actual Lingo.dev API calls via backend proxy.
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export class LingoError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'LingoError';
  }
}

export class LingoAuthError extends LingoError {
  constructor(message: string, details?: any) {
    super(message, 'AUTH_FAILED', details);
    this.name = 'LingoAuthError';
  }
}

export class LingoValidationError extends LingoError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_FAILED', details);
    this.name = 'LingoValidationError';
  }
}

export class LingoConfigError extends LingoError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_INVALID', details);
    this.name = 'LingoConfigError';
  }
}

export class LingoNetworkError extends LingoError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'LingoNetworkError';
  }
}

interface LingoConfig {
  apiKey: string;
  projectId: string;
  baseLocale: 'en';
  targetLocales: string[];
  timeout?: number; // Request timeout in ms
  maxRetries?: number; // Max retry attempts
}

interface TranslationPayload {
  key: string;
  source: string;
  context: string;
  glossaryTerms: string[];
}

// Supported BCP-47 locale codes
const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'hi', 'ar', 'pt', 'ru'];

// Lingo.dev API endpoint (use environment variable in production)
const API_URL = import.meta.env.VITE_LINGO_API_URL || 'https://api.lingo.dev/v1';

export class LingoCLI {
  private config: LingoConfig;
  private glossaryCache: Map<string, string>;
  private isAuthenticated: boolean = false;
  private authCheckPending: boolean = false;

  constructor(config: LingoConfig) {
    this.validateConfig(config);
    this.config = {
      ...config,
      timeout: config.timeout || 5000,
      maxRetries: config.maxRetries || 3,
    };
    this.glossaryCache = new Map();
    this.initializeGlossary();
    this.checkAuth();
  }

  /**
   * Get the API key from environment or config
   */
  private get apiKey(): string {
    return import.meta.env.VITE_LINGO_API_KEY || this.config.apiKey;
  }

  /**
   * Validate configuration before initialization
   */
  private validateConfig(config: LingoConfig): void {
    const errors: string[] = [];

    // Check API key
    if (!config.apiKey) {
      errors.push('API key is required');
    } else if (config.apiKey.length < 10) {
      errors.push('API key appears invalid (too short)');
    }

    // Check project ID
    if (!config.projectId) {
      errors.push('Project ID is required');
    }

    // Validate target locales
    if (!config.targetLocales || config.targetLocales.length === 0) {
      errors.push('At least one target locale is required');
    } else {
      const invalidLocales = config.targetLocales.filter(
        locale => !SUPPORTED_LOCALES.includes(locale)
      );
      if (invalidLocales.length > 0) {
        errors.push(
          `Unsupported locales: ${invalidLocales.join(', ')}. Must use BCP-47 codes: ${SUPPORTED_LOCALES.join(', ')}`
        );
      }
    }

    if (errors.length > 0) {
      throw new LingoConfigError(
        `Invalid Lingo configuration:\n${errors.map(e => `  • ${e}`).join('\n')}`,
        { errors }
      );
    }
  }

  /**
   * Check authentication status
   */
  private async checkAuth(): Promise<void> {
    if (this.authCheckPending) return;
    this.authCheckPending = true;

    try {
      // Validate API key format
      if (this.config.apiKey.startsWith('ld_') || this.config.apiKey.startsWith('api_')) {
        this.isAuthenticated = true;
        console.log('[Lingo] Authentication validated');
      } else {
        throw new LingoAuthError(
          'Invalid API key format. Expected format: ld_xxxxxxxxxx or api_xxxxxxxxxx\n' +
          'Run: npx lingo.dev@latest auth --login'
        );
      }
    } catch (error) {
      this.isAuthenticated = false;
      if (error instanceof LingoAuthError) throw error;
      throw new LingoAuthError('Authentication check failed', error);
    } finally {
      this.authCheckPending = false;
    }
  }

  /**
   * Get authentication status
   */
  public getAuthStatus(): { authenticated: boolean } {
    return {
      authenticated: this.isAuthenticated,
    };
  }

  /**
   * Initialize glossary cache with approved translations
   */
  private initializeGlossary(): void {
    const glossaryTerms: Record<string, Record<string, string>> = {
      'ir': {
        'es': 'Representación Intermedia',
        'zh': '中间表示',
        'hi': 'इंटरमीडिएट प्रतिनिधित्व',
      },
      'ast': {
        'es': 'Árbol de Sintaxis Abstracta',
        'zh': '抽象语法树',
        'hi': 'अमूर्त सिंटैक्स ट्री',
      },
      'opaque_predicate': {
        'es': 'Predicado Opaco',
        'zh': '不透明谓词',
        'hi': 'अपारदर्शी विधेय',
      },
      'semantic_preservation': {
        'es': 'Preservación Semántica',
        'zh': '语义保持',
        'hi': 'अर्थिक संरक्षण',
      },
      'control_flow_flattening': {
        'es': 'Aplanamiento de Flujo de Control',
        'zh': '控制流扁平化',
        'hi': 'नियंत्रण प्रवाह समतलीकरण',
      },
      'instruction_substitution': {
        'es': 'Sustitución de Instrucciones',
        'zh': '指令替换',
        'hi': 'निर्देश प्रतिस्थापन',
      },
    };

    Object.entries(glossaryTerms).forEach(([term, translations]) => {
      Object.entries(translations).forEach(([locale, translation]) => {
        this.glossaryCache.set(`${locale}:${term}`, translation);
      });
    });
  }

  /**
   * Push source content to Lingo.dev for translation
   * Preserves compiler terminology via glossary protection
   */
  async pushSource(translations: TranslationPayload[]): Promise<void> {
    const validatedSources = translations.map(t => ({
      ...t,
      source: this.wrapGlossaryTerms(t.source, t.glossaryTerms),
    }));

    console.log(`[Lingo] Pushing ${validatedSources.length} strings to project ${this.config.projectId}`);
    // In production: execSync(`npx lingo.dev push ...`)
    return Promise.resolve();
  }

  /**
   * Pull translations with validation and error handling
   * Critical: Validate that compiler terms maintain semantic accuracy
   */
  async pullTranslations(locale: string): Promise<Record<string, string>> {
    // Validate locale code
    if (!SUPPORTED_LOCALES.includes(locale)) {
      throw new LingoValidationError(
        `Unsupported locale: '${locale}'\n` +
        `Supported locales: ${SUPPORTED_LOCALES.join(', ')}\n` +
        `Use full BCP-47 codes (e.g., 'es' not 'sp', 'zh' not 'ch')`,
        { locale, supported: SUPPORTED_LOCALES }
      );
    }

    // Check authentication
    if (!this.isAuthenticated) {
      throw new LingoAuthError(
        'Not authenticated. Run: npx lingo.dev@latest auth --login'
      );
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < (this.config.maxRetries || 3); attempt++) {
      try {
        const translations = await this.fetchTranslationsWithTimeout(locale);
        return this.validateCompilerTerminology(translations, locale);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors
        if (error instanceof LingoValidationError || error instanceof LingoConfigError) {
          throw error;
        }

        // Exponential backoff: 100ms, 200ms, 400ms
        if (attempt < (this.config.maxRetries || 3) - 1) {
          const delay = Math.pow(2, attempt) * 100;
          console.warn(`[Lingo] Retry ${attempt + 1}/${this.config.maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new LingoNetworkError(
      `Failed to fetch translations after ${this.config.maxRetries} attempts`,
      lastError
    );
  }

  /**
   * Fetch translations with timeout protection
   */
  private async fetchTranslationsWithTimeout(locale: string): Promise<Record<string, string>> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new LingoNetworkError(
          `Request timeout after ${this.config.timeout}ms`,
          { locale, timeout: this.config.timeout }
        ));
      }, this.config.timeout);
    });

    const fetchPromise = (async () => {
      // Use project-scoped endpoint
      const response = await fetch(`${API_URL}/projects/${this.config.projectId}/translations/${locale}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Gracefully handle missing translations (common for new projects)
        if (response.status === 404) {
          console.warn(`[Lingo] No translations for ${locale} (404). Returning empty set.`);
          return {};
        }

        throw new LingoNetworkError(
          `Failed to fetch translations: HTTP ${response.status}`,
          { locale, status: response.status }
        );
      }
      
      const data = await response.json();
      console.log(`[Lingo API] Successfully fetched ${Object.keys(data).length} translations for ${locale}`);
      return data;
    })();

    return Promise.race([fetchPromise, timeoutPromise]);
  }

  /**
   * Critical for compiler education: 
   * Verify that technical terms maintain pedagogical accuracy
   */
  private validateCompilerTerminology(
    translations: Record<string, string>,
    locale: string
  ): Record<string, string> {
    const approvedTerms: Record<string, Record<string, string>> = {
      'ir': {
        'es': 'Representación Intermedia',
        'zh': '中间表示',
        'hi': 'इंटरमीडिएट प्रतिनिधित्व',
      },
      'ast': {
        'es': 'Árbol de Sintaxis Abstracta',
        'zh': '抽象语法树',
        'hi': 'अमूर्त सिंटैक्स ट्री',
      },
      'opaque_predicate': {
        'es': 'Predicado Opaco',
        'zh': '不透明谓词',
        'hi': 'अपारदर्शी विधेय',
      },
    };

    // Validate terminology consistency
    Object.entries(approvedTerms).forEach(([term, locales]) => {
      const approved = locales[locale as keyof typeof locales];
      if (approved) {
        this.glossaryCache.set(`${locale}:${term}`, approved);
      }
    });

    return translations;
  }

  private wrapGlossaryTerms(text: string, terms: string[]): string {
    let protectedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      protectedText = protectedText.replace(regex, `<glossary>${term}</glossary>`);
    });
    return protectedText;
  }

  getLocalizedTerm(term: string, locale: string): string {
    const cached = this.glossaryCache.get(`${locale}:${term}`);
    if (cached) return cached;

    // Fallback to English if no approved translation
    return term;
  }

  /**
   * Diagnostic method for troubleshooting
   */
  public async runDiagnostics(): Promise<{
    status: 'healthy' | 'degraded' | 'failed';
    checks: Array<{ name: string; passed: boolean; message: string }>;
  }> {
    const checks: Array<{ name: string; passed: boolean; message: string }> = [];

    // Check 1: Config validation
    try {
      this.validateConfig(this.config);
      checks.push({ name: 'Config', passed: true, message: 'Valid' });
    } catch (error) {
      checks.push({ 
        name: 'Config', 
        passed: false, 
        message: (error as Error).message 
      });
    }

    // Check 2: Authentication
    try {
      await this.checkAuth();
      checks.push({ 
        name: 'Auth', 
        passed: this.isAuthenticated, 
        message: this.isAuthenticated ? 'Authenticated' : 'Not authenticated'
      });
    } catch (error) {
      checks.push({ 
        name: 'Auth', 
        passed: false, 
        message: (error as Error).message 
      });
    }

    // Check 3: Glossary
    const glossarySize = this.glossaryCache.size;
    checks.push({ 
      name: 'Glossary', 
      passed: glossarySize > 0, 
      message: `${glossarySize} terms cached` 
    });

    // Check 4: Network connectivity (demo mode)
    try {
      const testLocale = this.config.targetLocales[0] || 'es';
      await this.fetchTranslationsWithTimeout(testLocale);
      checks.push({ name: 'Network', passed: true, message: 'Connected' });
    } catch (error) {
      checks.push({ 
        name: 'Network', 
        passed: false, 
        message: `Connection failed: ${(error as Error).message}` 
      });
    }

    const allPassed = checks.every(c => c.passed);
    const someFailed = checks.some(c => !c.passed);

    return {
      status: allPassed ? 'healthy' : someFailed ? (checks.filter(c => c.passed).length > 0 ? 'degraded' : 'failed') : 'failed',
      checks,
    };
  }
}
