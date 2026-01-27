import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSDK } from '../contexts/SDKContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { device, initialized, connecting, connectDevice, searchDevices, error } = useSDK();

  const handleConnectDevice = async () => {
    await connectDevice();
  };

  const handleRefresh = async () => {
    const devices = await searchDevices();
    console.log('Found devices:', devices);
  };

  const handleStartTest = () => {
    navigate('/test');
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hardware Test Agent</h1>
        <p className="text-gray-600 mt-1">硬件钱包自动化测试工具 (WebUSB)</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">错误</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Device Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">设备状态</h2>
            <button
              onClick={handleRefresh}
              className="text-sm text-green-600 hover:text-green-700"
              disabled={!initialized}
            >
              刷新
            </button>
          </div>

          {!initialized ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : device ? (
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <span className="text-green-600 font-medium">已连接</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>设备: {device.deviceType}</p>
                <p>名称: {device.label}</p>
                <p>固件: v{device.firmwareVersion}</p>
                {device.serialNumber && <p>序列号: {device.serialNumber}</p>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                <span className="text-yellow-600 font-medium">未连接</span>
              </div>
              <p className="text-sm text-gray-500">
                请连接 OneKey 硬件设备，然后点击下方按钮选择设备
              </p>
              <button
                onClick={handleConnectDevice}
                disabled={connecting}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {connecting ? '连接中...' : '选择设备 (WebUSB)'}
              </button>
            </div>
          )}
        </div>

        {/* SDK Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SDK 状态</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">初始化状态</span>
              <span className={initialized ? 'text-green-600' : 'text-yellow-600'}>
                {initialized ? '✓ 已初始化' : '初始化中...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">传输方式</span>
              <span className="text-gray-900">WebUSB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">自动化模式</span>
              <span className="text-green-600">✓ 已启用</span>
            </div>
          </div>
        </div>
      </div>

      {/* Start Test Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">开始测试</h2>
          <p className="text-gray-600 mb-4">
            {device
              ? '设备已连接，选择测试套件并运行自动化测试'
              : '请先连接设备，然后开始测试'}
          </p>
          <button
            onClick={handleStartTest}
            disabled={!device}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <span className="mr-2">🚀</span>
            开始新测试
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">WebUSB 使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 确保 OneKey 硬件设备已通过 USB 连接到电脑</li>
          <li>• 点击"选择设备"按钮后，浏览器会弹出设备选择对话框</li>
          <li>• 在对话框中选择您的 OneKey 设备并点击"连接"</li>
          <li>• 连接成功后即可开始自动化测试</li>
        </ul>
      </div>
    </div>
  );
}
