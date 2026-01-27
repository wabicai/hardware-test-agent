import React, { useEffect, useState } from 'react';
import { reportStorage, StoredReport } from '../services/reportStorage';

export function Results() {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<StoredReport | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const allReports = reportStorage.getAll();
    setReports(allReports);
    if (allReports.length > 0 && !selectedReport) {
      setSelectedReport(allReports[0]);
    }
  };

  const deleteReport = (id: string) => {
    reportStorage.delete(id);
    loadReports();
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  const clearAllReports = () => {
    if (confirm('确定要清空所有测试报告吗？')) {
      reportStorage.clear();
      setReports([]);
      setSelectedReport(null);
    }
  };

  const exportReport = async (report: StoredReport, format: 'md' | 'json' | 'html') => {
    let content: string;
    let extension: string;
    let mimeType: string;

    switch (format) {
      case 'md':
        content = reportStorage.exportToMarkdown(report);
        extension = 'md';
        mimeType = 'text/markdown';
        break;
      case 'json':
        content = reportStorage.exportToJSON(report);
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'html':
        content = reportStorage.exportToHTML(report);
        extension = 'html';
        mimeType = 'text/html';
        break;
    }

    const defaultName = `test-report-${report.id}.${extension}`;

    // Use electron file dialog
    const result = await window.electronAPI.fs.saveReport(content, defaultName);
    if (result.success) {
      console.log('Report exported to:', result.path);
    } else if (result.error) {
      console.error('Export failed:', result.error);
    }
  };

  const toggleSuite = (suiteId: string) => {
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) {
        next.delete(suiteId);
      } else {
        next.add(suiteId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">测试结果</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadReports}
            className="text-sm text-green-600 hover:text-green-700"
          >
            刷新
          </button>
          {reports.length > 0 && (
            <button
              onClick={clearAllReports}
              className="text-sm text-red-600 hover:text-red-700"
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">暂无测试报告</h2>
            <p className="text-gray-600">运行测试后，结果将显示在这里</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 min-h-0">
          {/* Report List */}
          <div className="w-80 flex-shrink-0 overflow-auto">
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedReport?.id === report.id
                      ? 'border-green-500 ring-1 ring-green-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(report.createdAt)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        report.summary.failed === 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {report.summary.passRate}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {report.device.deviceType} - {report.device.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    通过 {report.summary.passed} / 失败 {report.summary.failed} / 跳过 {report.summary.skipped}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Detail */}
          {selectedReport ? (
            <div className="flex-1 overflow-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">
                      测试报告详情
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(selectedReport.createdAt)} · {formatDuration(selectedReport.duration)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportReport(selectedReport, 'md')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => exportReport(selectedReport, 'json')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => exportReport(selectedReport, 'html')}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      HTML
                    </button>
                    <button
                      onClick={() => deleteReport(selectedReport.id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* Device Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <span className="text-gray-600">设备: </span>
                  <span className="font-medium">{selectedReport.device.deviceType}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-600">标签: </span>
                  <span className="font-medium">{selectedReport.device.label}</span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-600">固件: </span>
                  <span className="font-medium">{selectedReport.device.firmwareVersion}</span>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedReport.summary.total}
                    </div>
                    <div className="text-sm text-gray-500">总用例</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedReport.summary.passed}
                    </div>
                    <div className="text-sm text-gray-500">通过</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {selectedReport.summary.failed}
                    </div>
                    <div className="text-sm text-gray-500">失败</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedReport.summary.passRate}%
                    </div>
                    <div className="text-sm text-gray-500">通过率</div>
                  </div>
                </div>
              </div>

              {/* Suites */}
              <div className="space-y-3">
                {selectedReport.suites.map((suite) => (
                  <div
                    key={suite.suiteId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200"
                  >
                    <div
                      onClick={() => toggleSuite(suite.suiteId)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {suite.status === 'passed' ? '✅' : '❌'}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">{suite.name}</div>
                          <div className="text-sm text-gray-500">
                            通过 {suite.passed} · 失败 {suite.failed} · 跳过 {suite.skipped}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {formatDuration(suite.duration)}
                        </span>
                        <span className="text-gray-400">
                          {expandedSuites.has(suite.suiteId) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>

                    {expandedSuites.has(suite.suiteId) && (
                      <div className="border-t border-gray-100 p-4 pt-2">
                        {suite.cases.map((testCase) => (
                          <div
                            key={testCase.caseId}
                            className="py-2 border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={
                                    testCase.status === 'passed'
                                      ? 'text-green-500'
                                      : testCase.status === 'failed'
                                      ? 'text-red-500'
                                      : 'text-gray-400'
                                  }
                                >
                                  {testCase.status === 'passed'
                                    ? '✓'
                                    : testCase.status === 'failed'
                                    ? '✗'
                                    : '○'}
                                </span>
                                <span className="text-sm text-gray-800">
                                  {testCase.title}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {testCase.duration}ms
                              </span>
                            </div>
                            {testCase.error && (
                              <div className="mt-1 ml-5 text-xs text-red-600 bg-red-50 p-2 rounded">
                                {testCase.error}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">选择一个报告查看详情</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
