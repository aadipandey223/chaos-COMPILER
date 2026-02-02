/**
 * Lingo CLI Diagnostics Utility
 * Run health checks and troubleshoot Lingo integration issues
 */

import { LingoCLI, LingoError } from './cli-integration';

export interface DiagnosticReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'failed';
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    suggestion?: string;
  }>;
  recommendations: string[];
}

/**
 * Run comprehensive Lingo diagnostics
 */
export async function runLingoDiagnostics(lingo: LingoCLI): Promise<DiagnosticReport> {
  console.log('🔍 Running Lingo CLI diagnostics...\n');

  const result = await lingo.runDiagnostics();
  const recommendations: string[] = [];

  // Enhance checks with suggestions
  const enhancedChecks = result.checks.map(check => {
    const enhanced = { ...check, suggestion: undefined as string | undefined };
    
    if (!check.passed) {
      switch (check.name) {
        case 'Auth':
          enhanced.suggestion = 'Run: npx lingo.dev@latest auth --login';
          recommendations.push('Set VITE_LINGO_API_KEY environment variable');
          recommendations.push('Verify API key format: ld_xxxxxxxxxx');
          break;
        case 'Config':
          enhanced.suggestion = 'Check lingo.config.json for errors';
          recommendations.push('Validate locale codes use BCP-47 format (es, zh, hi)');
          recommendations.push('Ensure project ID matches your Lingo.dev account');
          break;
        case 'Network':
          enhanced.suggestion = 'Check network connectivity and firewall settings';
          recommendations.push('Verify API endpoint is accessible');
          recommendations.push('Check for proxy/VPN interference');
          break;
        case 'Glossary':
          enhanced.suggestion = 'Ensure glossary.json exists in src/lingo/';
          recommendations.push('Run: npx lingo.dev@latest glossary:push');
          break;
      }
    }
    
    return enhanced;
  });

  const authStatus = lingo.getAuthStatus();
  if (!authStatus.authenticated) {
    recommendations.push('⚠️  Lingo Client not authenticated - translations will fail');
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus: result.status,
    checks: enhancedChecks,
    recommendations: Array.from(new Set(recommendations)),
  };
}

/**
 * Format diagnostic report for console output
 */
export function formatDiagnosticReport(report: DiagnosticReport): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('  LINGO CLI DIAGNOSTIC REPORT');
  lines.push('═'.repeat(60));
  lines.push('');

  // Status indicator
  const statusIcon = 
    report.overallStatus === 'healthy' ? '✅' :
    report.overallStatus === 'degraded' ? '⚠️' :
    '❌';
  
  lines.push(`Status: ${statusIcon} ${report.overallStatus.toUpperCase()}`);
  lines.push(`Time: ${new Date(report.timestamp).toLocaleString()}`);
  lines.push('');

  // Individual checks
  lines.push('Checks:');
  lines.push('─'.repeat(60));
  report.checks.forEach(check => {
    const icon = check.passed ? '✓' : '✗';
    lines.push(`  ${icon} ${check.name.padEnd(15)} ${check.message}`);
    if (check.suggestion) {
      lines.push(`    → ${check.suggestion}`);
    }
  });
  lines.push('');

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('Recommendations:');
    lines.push('─'.repeat(60));
    report.recommendations.forEach((rec, i) => {
      lines.push(`  ${i + 1}. ${rec}`);
    });
    lines.push('');
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Quick diagnostic command for development
 * Usage in browser console:
 *   import { quickDiagnostics } from './lingo/diagnostics';
 *   await quickDiagnostics();
 */
export async function quickDiagnostics() {
  try {
    const { LingoCLI } = await import('./cli-integration');
    
    const lingo = new LingoCLI({
      apiKey: (import.meta as any).env?.VITE_LINGO_API_KEY || 'demo-key',
      projectId: 'chaos-lab-compiler',
      baseLocale: 'en',
      targetLocales: ['es', 'zh', 'hi'],
    });

    const report = await runLingoDiagnostics(lingo);
    const formatted = formatDiagnosticReport(report);
    
    console.log(formatted);
    return report;
  } catch (error) {
    console.error('❌ Diagnostics failed:', error);
    if (error instanceof LingoError) {
      console.error(`   Code: ${error.code}`);
      console.error(`   Details:`, error.details);
    }
    throw error;
  }
}

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).__lingoDiagnostics = quickDiagnostics;
  console.log('💡 Tip: Run `__lingoDiagnostics()` in console to check Lingo integration');
}
