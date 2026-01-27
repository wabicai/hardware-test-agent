import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSDK } from '../contexts/SDKContext';
import { testRunnerService, TestProgress, CaseResult, TestReport } from '../services/testRunner';
import { getSuiteInfos, getSuitesByIds, SuiteInfo } from '../services/testSuites';
import { reportStorage } from '../services/reportStorage';

type RunnerState = 'idle' | 'running' | 'paused' | 'completed';

export function TestRunner() {
  const navigate = useNavigate();
  const { device, getSDK, setCurrentPassphrase } = useSDK();

  const [suites, setSuites] = useState<SuiteInfo[]>([]);
  const [selectedSuites, setSelectedSuites] = useState<Set<string>>(new Set());
  const [runnerState, setRunnerState] = useState<RunnerState>('idle');
  const [progress, setProgress] = useState<TestProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<TestReport | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuites(getSuiteInfos());
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Redirect if no device
  useEffect(() => {
    if (!device) {
      navigate('/dashboard');
    }
  }, [device, navigate]);

  const toggleSuite = (id: string) => {
    setSelectedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedSuites(new Set(suites.map((s) => s.id)));
  };

  const clearAll = () => {
    setSelectedSuites(new Set());
  };

  const startTest = async () => {
    if (selectedSuites.size === 0 || !device) return;

    setRunnerState('running');
    setLogs([]);
    setProgress(null);
    setReport(null);

    try {
      const sdk = getSDK();
      const suitesToRun = getSuitesByIds(Array.from(selectedSuites));

      // Initialize test runner
      testRunnerService.initialize({
        sdk,
        connectId: device.connectId,
        deviceId: device.deviceId,
        setCurrentPassphrase,
        device: {
          deviceType: device.deviceType,
          label: device.label,
          firmwareVersion: device.firmwareVersion,
        },
      });

      // Setup event listeners
      const handleProgress = (p: TestProgress) => setProgress(p);
      const handleCaseComplete = (result: CaseResult) => {
        const status = result.status === 'passed' ? '✓' : '✗';
        const duration = `(${result.duration}ms)`;
        setLogs((prev) => [...prev, `${status} ${result.title} ${duration}`]);
        if (result.error) {
          setLogs((prev) => [...prev, `  └─ ${result.error}`]);
        }
      };
      const handleComplete = (r: TestReport) => {
        setRunnerState('completed');
        setReport(r);
        // Save report to storage
        reportStorage.save(r);
        setLogs((prev) => [
          ...prev,
          '',
          `════════════════════════════════════════`,
          `测试完成!`,
          `通过: ${r.summary.passed} | 失败: ${r.summary.failed} | 跳过: ${r.summary.skipped}`,
          `通过率: ${r.summary.passRate}%`,
          `总耗时: ${Math.round(r.duration / 1000)}s`,
        ]);
      };

      testRunnerService.on('progress', handleProgress);
      testRunnerService.on('case:complete', handleCaseComplete);
      testRunnerService.on('complete', handleComplete);

      // Run tests
      await testRunnerService.runSuites(suitesToRun);

      // Cleanup
      testRunnerService.off('progress', handleProgress);
      testRunnerService.off('case:complete', handleCaseComplete);
      testRunnerService.off('complete', handleComplete);
    } catch (error) {
      setLogs((prev) => [...prev, `错误: ${(error as Error).message}`]);
      setRunnerState('idle');
    }
  };

  const pauseTest = () => {
    testRunnerService.pause();
    setRunnerState('paused');
  };

  const resumeTest = () => {
    testRunnerService.resume();
    setRunnerState('running');
  };

  const stopTest = () => {
    testRunnerService.stop();
    setRunnerState('idle');
  };

  const totalCases = suites
    .filter((s) => selectedSuites.has(s.id))
    .reduce((sum, s) => sum + s.caseCount, 0);

  if (!device) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">请先连接设备</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">测试运行</h1>

      {runnerState === 'idle' && (
        <>
          {/* Device Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <span className="font-medium text-green-800">
                已连接: {device.deviceType} - {device.label}
              </span>
            </div>
          </div>

          {/* Suite Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">选择测试套件</h2>
              <div className="space-x-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  全选
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-600 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {suites.map((suite) => (
                <label
                  key={suite.id}
                  className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSuites.has(suite.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSuites.has(suite.id)}
                    onChange={() => toggleSuite(suite.id)}
                    className="mt-1 mr-3 h-4 w-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{suite.name}</div>
                    <div className="text-sm text-gray-500">
                      {suite.description} · {suite.caseCount} 个用例
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              已选择 {selectedSuites.size} 个套件，共 {totalCases} 个用例
            </div>
            <button
              onClick={startTest}
              disabled={selectedSuites.size === 0}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              开始测试
            </button>
          </div>
        </>
      )}

      {(runnerState === 'running' || runnerState === 'paused') && (
        <>
          {/* Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {runnerState === 'paused' ? '⏸ 已暂停' : '🔄 测试进行中...'}
              </h2>
              <div className="space-x-2">
                {runnerState === 'running' ? (
                  <button
                    onClick={pauseTest}
                    className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    暂停
                  </button>
                ) : (
                  <button
                    onClick={resumeTest}
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    继续
                  </button>
                )}
                <button
                  onClick={stopTest}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  停止
                </button>
              </div>
            </div>

            {progress && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {progress.completedCases} / {progress.totalCases} 用例
                    </span>
                    <span>{progress.overallProgress}%</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${progress.overallProgress}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    当前套件: <span className="font-medium">{progress.currentSuite}</span> (
                    {progress.completedSuites}/{progress.totalSuites})
                  </p>
                  <p>
                    当前用例: <span className="font-medium">{progress.currentCase}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-auto font-mono text-sm">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.startsWith('✓')
                    ? 'text-green-400'
                    : log.startsWith('✗')
                    ? 'text-red-400'
                    : log.startsWith('  └─')
                    ? 'text-red-300 text-xs'
                    : log.startsWith('═')
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              >
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </>
      )}

      {runnerState === 'completed' && report && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-600 mb-4">✅ 测试完成</h2>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold">{report.summary.total}</div>
                <div className="text-sm text-gray-500">总用例</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{report.summary.passed}</div>
                <div className="text-sm text-gray-500">通过</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{report.summary.failed}</div>
                <div className="text-sm text-gray-500">失败</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{report.summary.passRate}%</div>
                <div className="text-sm text-gray-500">通过率</div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setRunnerState('idle')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                开始新测试
              </button>
              <button
                onClick={() => navigate('/results')}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                查看详细报告
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-auto font-mono text-sm">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.startsWith('✓')
                    ? 'text-green-400'
                    : log.startsWith('✗')
                    ? 'text-red-400'
                    : log.startsWith('  └─')
                    ? 'text-red-300 text-xs'
                    : log.startsWith('═')
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
