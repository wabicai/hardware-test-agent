import React, { useState, useEffect } from 'react';
import { useSDK } from '../contexts/SDKContext';

export function Settings() {
  const { automationConfig, setAutomationConfig } = useSDK();

  const [localSettings, setLocalSettings] = useState({
    defaultPin: automationConfig.defaultPin,
    defaultPassphrase: automationConfig.defaultPassphrase,
    autoRespond: automationConfig.autoRespond,
    reportPath: '~/Documents/hardware-test-reports',
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings((prev) => ({
      ...prev,
      defaultPin: automationConfig.defaultPin,
      defaultPassphrase: automationConfig.defaultPassphrase,
      autoRespond: automationConfig.autoRespond,
    }));
  }, [automationConfig]);

  const handleChange = (key: string, value: string | number | boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setAutomationConfig({
      defaultPin: localSettings.defaultPin,
      defaultPassphrase: localSettings.defaultPassphrase,
      autoRespond: localSettings.autoRespond,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">设置</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y">
        {/* Automation Settings */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">自动化设置</h2>

          <div className="space-y-4">
            {/* Auto Respond Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="font-medium text-gray-900">自动响应</label>
                <p className="text-sm text-gray-500">
                  自动响应 PIN 和 Passphrase 请求
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.autoRespond}
                  onChange={(e) => handleChange('autoRespond', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                默认 PIN 码
              </label>
              <input
                type="text"
                value={localSettings.defaultPin}
                onChange={(e) => handleChange('defaultPin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="输入默认 PIN"
              />
              <p className="text-sm text-gray-500 mt-1">
                自动化测试时使用的默认 PIN 码（通常为 1-9 位数字）
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                默认 Passphrase
              </label>
              <input
                type="text"
                value={localSettings.defaultPassphrase}
                onChange={(e) => handleChange('defaultPassphrase', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="留空表示使用空 passphrase"
              />
              <p className="text-sm text-gray-500 mt-1">
                当测试用例未指定 passphrase 时使用此默认值
              </p>
            </div>
          </div>
        </div>

        {/* Report Settings */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">报告设置</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              报告保存路径
            </label>
            <div className="flex">
              <input
                type="text"
                value={localSettings.reportPath}
                onChange={(e) => handleChange('reportPath', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200">
                浏览
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            保存设置
          </button>
          {saved && (
            <span className="text-green-600 text-sm">✓ 设置已保存</span>
          )}
        </div>
      </div>

      {/* WebUSB Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">WebUSB 信息</h2>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• 本应用使用 WebUSB 与硬件设备通信</p>
          <p>• 每次打开应用需要重新选择设备（浏览器安全限制）</p>
          <p>• 确保设备已解锁且未被其他应用占用</p>
          <p>• 如遇连接问题，请尝试重新插拔设备</p>
        </div>
      </div>

      {/* About Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">关于</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Hardware Test Agent</strong> v0.1.0</p>
          <p>用于 OneKey 硬件钱包的自动化测试工具</p>
          <p className="mt-2">
            <span className="text-gray-500">技术栈:</span> Electron + React + WebUSB
          </p>
          <p>
            <span className="text-gray-500">SDK:</span> @onekeyfe/hd-common-connect-sdk
          </p>
          <p className="text-gray-400 mt-4">© 2024 OneKey</p>
        </div>
      </div>
    </div>
  );
}
