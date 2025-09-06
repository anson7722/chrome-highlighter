// 高亮功能实现
class TextHighlighter {
  constructor() {
    this.isEnabled = false;
    this.highlightedElements = new Set();
    this.hoveredElement = null;
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
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    document.body.style.cursor = 'pointer';
    chrome.storage.local.set({highlighterEnabled: true});
  }

  disableHighlighter() {
    this.isEnabled = false;
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseout', this.handleMouseOut.bind(this));
    this.removeHoverEffect();
    document.body.style.cursor = 'default';
    chrome.storage.local.set({highlighterEnabled: false});
  }

  handleMouseMove(event) {
    if (!this.isEnabled) return;

    // 获取当前鼠标位置的元素
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) return;

    // 如果已经是高亮元素或者是高亮元素的子元素，不显示悬停效果
    if (element.closest('.chrome-highlighter')) {
      this.removeHoverEffect();
      return;
    }

    // 检查元素是否是可高亮的文本容器
    if (this.isHighlightableElement(element)) {
      this.showHoverEffect(element);
    } else {
      this.removeHoverEffect();
    }
  }

  // 判断元素是否可高亮
  isHighlightableElement(element) {
    // 允许的元素类型：DIV、P、SPAN、A（但A元素需要特殊处理）
    const allowedTags = ['DIV', 'P', 'SPAN', 'A'];
    
    // 检查元素标签是否在允许列表中
    if (!allowedTags.includes(element.tagName)) {
      return false;
    }

    // 对于A标签，只有当它包含文本内容时才允许高亮
    if (element.tagName === 'A') {
      return element.textContent && element.textContent.trim();
    }

    // 其他元素需要有文本内容
    return element.textContent && element.textContent.trim();
  }

  handleClick(event) {
    if (!this.isEnabled) return;

    // 移除悬停效果
    this.removeHoverEffect();

    // 获取点击的元素
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element) return;

    // 检查是否点击的是可高亮元素
    if (this.isHighlightableElement(element)) {
      // 如果已经是高亮元素，取消高亮
      if (element.classList.contains('chrome-highlighter')) {
        this.removeHighlight(element);
      } else {
        // 否则进行高亮
        this.highlightElement(element);
      }
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // 高亮整个元素（而不是文本节点）
  highlightElement(element) {
    // 保存原始HTML
    const originalHTML = element.innerHTML;
    const originalClass = element.className;
    
    // 添加高亮样式
    element.style.backgroundColor = 'yellow';
    element.style.color = 'black';
    element.style.cursor = 'pointer';
    element.classList.add('chrome-highlighter');
    
    // 保存原始状态以便恢复
    element.setAttribute('data-original-html', originalHTML);
    element.setAttribute('data-original-class', originalClass);
    
    this.highlightedElements.add(element);

    // 添加点击事件来取消高亮
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeHighlight(element);
    });
  }

  removeHighlight(element) {
    // 恢复原始HTML和样式
    if (element.hasAttribute('data-original-html')) {
      element.innerHTML = element.getAttribute('data-original-html');
      element.removeAttribute('data-original-html');
    }
    
    if (element.hasAttribute('data-original-class')) {
      element.className = element.getAttribute('data-original-class');
      element.removeAttribute('data-original-class');
    }
    
    // 移除高亮样式
    element.style.backgroundColor = '';
    element.style.color = '';
    element.style.cursor = '';
    element.classList.remove('chrome-highlighter');
    
    this.highlightedElements.delete(element);
  }

  handleMouseOut(event) {
    if (!this.isEnabled) return;
    this.removeHoverEffect();
  }

  showHoverEffect(element) {
    // 如果已经是当前悬停的元素，不做处理
    if (this.hoveredElement === element) return;

    // 移除之前的悬停效果
    this.removeHoverEffect();

    // 添加悬停样式
    element.style.outline = '2px dashed rgba(255, 204, 0, 0.5)';
    element.style.outlineOffset = '2px';
    this.hoveredElement = element;
  }

  removeHoverEffect() {
    if (this.hoveredElement) {
      this.hoveredElement.style.outline = '';
      this.hoveredElement.style.outlineOffset = '';
      this.hoveredElement = null;
    }
  }

  handleClick(event) {
    if (!this.isEnabled) return;

    // 防止点击链接等元素
    if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
      return;
    }

    // 移除悬停效果
    this.removeHoverEffect();

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