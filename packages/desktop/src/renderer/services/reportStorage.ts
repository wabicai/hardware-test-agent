/**
 * Report Storage Service - Persists test reports to localStorage
 */

import type { TestReport } from './testRunner';

const STORAGE_KEY = 'hardware-test-reports';
const MAX_REPORTS = 50;

export interface StoredReport extends TestReport {
  createdAt: string; // ISO string for serialization
}

class ReportStorageService {
  /**
   * Save a report to storage
   */
  save(report: TestReport): void {
    const reports = this.getAll();

    const storedReport: StoredReport = {
      ...report,
      createdAt: report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : report.createdAt,
    };

    // Add to beginning (most recent first)
    reports.unshift(storedReport);

    // Limit storage size
    if (reports.length > MAX_REPORTS) {
      reports.splice(MAX_REPORTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    console.log('[ReportStorage] Saved report:', report.id);
  }

  /**
   * Get all reports
   */
  getAll(): StoredReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('[ReportStorage] Failed to parse reports:', e);
      return [];
    }
  }

  /**
   * Get a single report by ID
   */
  getById(id: string): StoredReport | undefined {
    return this.getAll().find((r) => r.id === id);
  }

  /**
   * Delete a report by ID
   */
  delete(id: string): boolean {
    const reports = this.getAll();
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) return false;

    reports.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    console.log('[ReportStorage] Deleted report:', id);
    return true;
  }

  /**
   * Clear all reports
   */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ReportStorage] Cleared all reports');
  }

  /**
   * Export report to different formats
   */
  exportToMarkdown(report: StoredReport): string {
    const lines: string[] = [
      `# Hardware Test Report`,
      ``,
      `**Report ID:** ${report.id}`,
      `**Date:** ${new Date(report.createdAt).toLocaleString()}`,
      `**Duration:** ${Math.round(report.duration / 1000)}s`,
      ``,
      `## Device Info`,
      `- **Type:** ${report.device.deviceType}`,
      `- **Label:** ${report.device.label}`,
      `- **Firmware:** ${report.device.firmwareVersion}`,
      ``,
      `## Summary`,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total | ${report.summary.total} |`,
      `| Passed | ${report.summary.passed} |`,
      `| Failed | ${report.summary.failed} |`,
      `| Skipped | ${report.summary.skipped} |`,
      `| Pass Rate | ${report.summary.passRate}% |`,
      ``,
      `## Test Suites`,
      ``,
    ];

    for (const suite of report.suites) {
      const statusIcon = suite.status === 'passed' ? '✅' : '❌';
      lines.push(`### ${statusIcon} ${suite.name}`);
      lines.push(`- Passed: ${suite.passed} | Failed: ${suite.failed} | Skipped: ${suite.skipped}`);
      lines.push(`- Duration: ${suite.duration}ms`);
      lines.push(``);

      for (const testCase of suite.cases) {
        const caseIcon = testCase.status === 'passed' ? '✓' : testCase.status === 'failed' ? '✗' : '○';
        lines.push(`- ${caseIcon} ${testCase.title} (${testCase.duration}ms)`);
        if (testCase.error) {
          lines.push(`  - Error: ${testCase.error}`);
        }
      }
      lines.push(``);
    }

    return lines.join('\n');
  }

  exportToJSON(report: StoredReport): string {
    return JSON.stringify(report, null, 2);
  }

  exportToHTML(report: StoredReport): string {
    const passedPercent = report.summary.passRate;
    const failedPercent = report.summary.total > 0
      ? Math.round((report.summary.failed / report.summary.total) * 100)
      : 0;

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hardware Test Report - ${report.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 2rem; max-width: 1200px; margin: 0 auto; background: #f5f5f5; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1a1a1a; margin-bottom: 1rem; }
    h2 { color: #333; margin-bottom: 0.5rem; font-size: 1.25rem; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1rem 0; }
    .stat { text-align: center; padding: 1rem; border-radius: 8px; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { font-size: 0.875rem; color: #666; }
    .stat.total { background: #f3f4f6; }
    .stat.passed { background: #dcfce7; }
    .stat.passed .stat-value { color: #16a34a; }
    .stat.failed { background: #fee2e2; }
    .stat.failed .stat-value { color: #dc2626; }
    .stat.rate { background: #e0f2fe; }
    .stat.rate .stat-value { color: #0284c7; }
    .suite { margin-top: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
    .suite-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .suite-name { font-weight: 600; }
    .suite-stats { font-size: 0.875rem; color: #666; }
    .case { padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 0.5rem; }
    .case:last-child { border-bottom: none; }
    .case-icon { width: 1.25rem; text-align: center; }
    .case-icon.passed { color: #16a34a; }
    .case-icon.failed { color: #dc2626; }
    .case-title { flex: 1; }
    .case-duration { color: #666; font-size: 0.875rem; }
    .case-error { color: #dc2626; font-size: 0.875rem; margin-left: 1.75rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hardware Test Report</h1>
    <div class="meta">
      <div>Report ID: ${report.id}</div>
      <div>Date: ${new Date(report.createdAt).toLocaleString()}</div>
      <div>Duration: ${Math.round(report.duration / 1000)}s</div>
      <div>Device: ${report.device.deviceType} - ${report.device.label} (FW: ${report.device.firmwareVersion})</div>
    </div>

    <div class="summary">
      <div class="stat total">
        <div class="stat-value">${report.summary.total}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat passed">
        <div class="stat-value">${report.summary.passed}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat failed">
        <div class="stat-value">${report.summary.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat rate">
        <div class="stat-value">${report.summary.passRate}%</div>
        <div class="stat-label">Pass Rate</div>
      </div>
    </div>
  </div>

  <div class="card">
    <h2>Test Suites</h2>
    ${report.suites.map(suite => `
      <div class="suite">
        <div class="suite-header">
          <span class="suite-name">${suite.status === 'passed' ? '✅' : '❌'} ${suite.name}</span>
          <span class="suite-stats">Passed: ${suite.passed} | Failed: ${suite.failed} | ${suite.duration}ms</span>
        </div>
        ${suite.cases.map(c => `
          <div class="case">
            <span class="case-icon ${c.status}">${c.status === 'passed' ? '✓' : c.status === 'failed' ? '✗' : '○'}</span>
            <span class="case-title">${c.title}</span>
            <span class="case-duration">${c.duration}ms</span>
          </div>
          ${c.error ? `<div class="case-error">Error: ${c.error}</div>` : ''}
        `).join('')}
      </div>
    `).join('')}
  </div>
</body>
</html>`;
  }
}

export const reportStorage = new ReportStorageService();
