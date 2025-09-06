// 后台脚本 - 管理插件状态
chrome.runtime.onInstalled.addListener(() => {
  console.log('阿度AI-网页标记笔插件已安装');
});

// 处理来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getHighlighterStatus') {
    chrome.storage.local.get(['highlighterEnabled'], (result) => {
      sendResponse({enabled: result.highlighterEnabled || false});
    });
    return true; // 保持消息通道开放
  }
});