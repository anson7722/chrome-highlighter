// 弹出窗口脚本
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBtn');
  
  // 获取当前状态
  chrome.runtime.sendMessage(
    {action: 'getHighlighterStatus'}, 
    function(response) {
      updateButtonState(response.enabled);
    }
  );

  // 切换按钮点击事件
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id, 
        {action: 'toggleHighlighter'}, 
        function(response) {
          if (response) {
            updateButtonState(response.status === 'enabled');
          }
        }
      );
    });
  });

  function updateButtonState(isEnabled) {
    if (isEnabled) {
      toggleBtn.textContent = '点击禁用';
      toggleBtn.className = 'toggle-btn enabled';
    } else {
      toggleBtn.textContent = '点击启用';
      toggleBtn.className = 'toggle-btn disabled';
    }
  }
});