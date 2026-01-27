import type { TestReport, SuiteResult, FailureDetail } from '../types';

export class Reporter {
  /**
   * Export report as Markdown
   */
  toMarkdown(report: TestReport): string {
    const lines: string[] = [];

    // Header
    lines.push('# 测试报告');
    lines.push('');

    // Meta info
    lines.push('## 📋 概览');
    lines.push('');
    lines.push('| 项目 | 值 |');
    lines.push('|------|-----|');
    lines.push(`| 设备 | ${report.device.deviceType} |`);
    lines.push(`| 设备名称 | ${report.device.label} |`);
    lines.push(`| 固件版本 | ${report.device.firmwareVersion} |`);
    lines.push(`| 序列号 | ${report.device.serialNumber || 'N/A'} |`);
    lines.push(`| 测试时间 | ${report.createdAt.toLocaleString()} |`);
    lines.push(`| 总耗时 | ${this.formatDuration(report.duration)} |`);
    lines.push(`| SDK 版本 | ${report.sdkVersion} |`);
    lines.push('');

    // Summary
    lines.push('## 📊 统计');
    lines.push('');
    lines.push(`- ✅ 通过: ${report.summary.passed} (${report.summary.passRate}%)`);
    lines.push(`- ❌ 失败: ${report.summary.failed} (${this.calcPercent(report.summary.failed, report.summary.total)}%)`);
    lines.push(`- ⏭ 跳过: ${report.summary.skipped} (${this.calcPercent(report.summary.skipped, report.summary.total)}%)`);
    lines.push(`- 📝 总计: ${report.summary.total}`);
    lines.push('');

    // Suite results
    lines.push('## 📦 测试套件结果');
    lines.push('');
    lines.push('| 套件 | 通过 | 失败 | 跳过 | 耗时 | 状态 |');
    lines.push('|------|------|------|------|------|------|');

    for (const suite of report.suites) {
      const statusIcon = suite.status === 'passed' ? '✅' : '❌';
      lines.push(
        `| ${suite.name} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${this.formatDuration(suite.duration)} | ${statusIcon} |`
      );
    }
    lines.push('');

    // Failures
    if (report.failures.length > 0) {
      lines.push('## ❌ 失败详情');
      lines.push('');

      for (const failure of report.failures) {
        lines.push(`### [${failure.suiteName}] ${failure.caseTitle}`);
        lines.push('');
        lines.push(`- **用例 ID**: ${failure.caseId}`);
        lines.push(`- **错误**: ${failure.error}`);
        if (failure.expected !== undefined) {
          lines.push(`- **预期**: \`${JSON.stringify(failure.expected)}\``);
        }
        if (failure.actual !== undefined) {
          lines.push(`- **实际**: \`${JSON.stringify(failure.actual)}\``);
        }
        lines.push('');
      }
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push(`> 报告生成时间: ${new Date().toLocaleString()}`);
    lines.push('> 生成工具: Hardware Test Agent');

    return lines.join('\n');
  }

  /**
   * Export report as JSON
   */
  toJSON(report: TestReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as HTML
   */
  toHTML(report: TestReport): string {
    const passRate = report.summary.passRate;
    const passRateColor = passRate >= 95 ? '#22c55e' : passRate >= 80 ? '#eab308' : '#ef4444';

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试报告 - ${report.createdAt.toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { font-size: 24px; margin-bottom: 20px; }
    h2 { font-size: 18px; margin-bottom: 15px; color: #333; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .stat { text-align: center; padding: 15px; border-radius: 8px; background: #f9fafb; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
    .pass-rate { color: ${passRateColor}; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f9fafb; font-weight: 600; }
    .status-passed { color: #22c55e; }
    .status-failed { color: #ef4444; }
    .failure { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
    .failure-title { font-weight: 600; margin-bottom: 8px; }
    .failure-detail { font-size: 14px; color: #666; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .meta-table td:first-child { color: #666; width: 120px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>🔧 硬件钱包测试报告</h1>
      <table class="meta-table">
        <tr><td>设备</td><td>${report.device.deviceType} - ${report.device.label}</td></tr>
        <tr><td>固件版本</td><td>${report.device.firmwareVersion}</td></tr>
        <tr><td>测试时间</td><td>${report.createdAt.toLocaleString()}</td></tr>
        <tr><td>总耗时</td><td>${this.formatDuration(report.duration)}</td></tr>
      </table>
    </div>

    <div class="card">
      <h2>📊 测试统计</h2>
      <div class="summary">
        <div class="stat">
          <div class="stat-value pass-rate">${report.summary.passRate}%</div>
          <div class="stat-label">通过率</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #22c55e;">${report.summary.passed}</div>
          <div class="stat-label">通过</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #ef4444;">${report.summary.failed}</div>
          <div class="stat-label">失败</div>
        </div>
        <div class="stat">
          <div class="stat-value" style="color: #666;">${report.summary.skipped}</div>
          <div class="stat-label">跳过</div>
        </div>
        <div class="stat">
          <div class="stat-value">${report.summary.total}</div>
          <div class="stat-label">总计</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>📦 测试套件</h2>
      <table>
        <thead>
          <tr>
            <th>套件名称</th>
            <th>通过</th>
            <th>失败</th>
            <th>跳过</th>
            <th>耗时</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${report.suites
            .map(
              (suite) => `
            <tr>
              <td>${suite.name}</td>
              <td>${suite.passed}</td>
              <td>${suite.failed}</td>
              <td>${suite.skipped}</td>
              <td>${this.formatDuration(suite.duration)}</td>
              <td class="${suite.status === 'passed' ? 'status-passed' : 'status-failed'}">
                ${suite.status === 'passed' ? '✅ 通过' : '❌ 失败'}
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    ${
      report.failures.length > 0
        ? `
    <div class="card">
      <h2>❌ 失败详情 (${report.failures.length})</h2>
      ${report.failures
        .map(
          (f) => `
        <div class="failure">
          <div class="failure-title">[${f.suiteName}] ${f.caseTitle}</div>
          <div class="failure-detail">
            <p><strong>错误:</strong> ${f.error}</p>
            ${f.expected !== undefined ? `<p><strong>预期:</strong> <code>${JSON.stringify(f.expected)}</code></p>` : ''}
            ${f.actual !== undefined ? `<p><strong>实际:</strong> <code>${JSON.stringify(f.actual)}</code></p>` : ''}
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <div style="text-align: center; color: #666; font-size: 14px; padding: 20px;">
      生成时间: ${new Date().toLocaleString()} | Hardware Test Agent
    </div>
  </div>
</body>
</html>`;
  }

  // ============ Helper Methods ============

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  private calcPercent(value: number, total: number): string {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(1);
  }
}
