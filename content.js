// 高亮功能实现
class TextHighlighter {
  constructor() {
    this.isEnabled = false;
    this.highlightedElements = new Set();
    this.init();
  }

  init() {
    // 监听来自popup或background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleHighlighter') {
        this.toggleHighlighter();
        sendResponse({status: this.isEnabled ? 'enabled' : 'disabled'});
      }
    });

    // 从存储中加载之前的高亮状态
    chrome.storage.local.get(['highlighterEnabled'], (result) => {
      if (result.highlighterEnabled) {
        this.enableHighlighter();
      }
    });
  }

  toggleHighlighter() {
    if (this.isEnabled) {
      this.disableHighlighter();
    } else {
      this.enableHighlighter();
    }
  }

  enableHighlighter() {
    this.isEnabled = true;
    document.addEventListener('click', this.handleClick.bind(this));
    document.body.style.cursor = 'pointer';
    chrome.storage.local.set({highlighterEnabled: true});
  }

  disableHighlighter() {
    this.isEnabled = false;
    document.removeEventListener('click', this.handleClick.bind(this));
    document.body.style.cursor = 'default';
    chrome.storage.local.set({highlighterEnabled: false});
  }

  handleClick(event) {
    if (!this.isEnabled) return;

    // 防止点击链接等元素
    if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
      return;
    }

    // 获取文本节点
    const textNode = this.getTextNodeFromPoint(event.clientX, event.clientY);
    if (textNode && textNode.textContent.trim()) {
      this.highlightText(textNode);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  getTextNodeFromPoint(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element) return null;

    // 寻找包含文本的节点
    const range = document.caretRangeFromPoint(x, y);
    return range ? range.startContainer : null;
  }

  highlightText(textNode) {
    const text = textNode.textContent;
    const parent = textNode.parentNode;
    
    if (parent.classList.contains('chrome-highlighter')) {
      // 如果已经高亮，取消高亮
      this.removeHighlight(parent);
      return;
    }

    // 创建高亮span
    const span = document.createElement('span');
    span.className = 'chrome-highlighter';
    span.style.backgroundColor = 'yellow';
    span.style.color = 'black';
    span.style.cursor = 'pointer';
    span.textContent = text;
    
    // 替换文本节点
    parent.replaceChild(span, textNode);
    this.highlightedElements.add(span);

    // 添加点击事件来取消高亮
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeHighlight(span);
    });
  }

  removeHighlight(element) {
    const text = element.textContent;
    const textNode = document.createTextNode(text);
    element.parentNode.replaceChild(textNode, element);
    this.highlightedElements.delete(element);
  }
}

// 初始化高亮器
new TextHighlighter();