// ==UserScript==
// @name         SCTransalationData viewer button
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  add a viewer button for SCTranslation Github repo
// @author       mihu
// @match        https://github.com/*
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// @updateURL    https://viewer.strawberrytree.top/viewer-button.user.js
// ==/UserScript==

(function() {
  'use strict';
  // const handler =
  function addButton() {

      let targetElement = document.getElementsByClassName('final-path')[0];
      if (!targetElement) return
      if(!targetElement.textContent.endsWith(".csv")) return
      if (document.getElementById('viewer-button')) return
      // 创建按钮元素
      let button = document.createElement('button');
      button.innerHTML = 'Viewer';
      button.id = 'viewer-button'

      // 为按钮元素添加点击事件处理函数
      button.addEventListener('click', function() {
          let rawURI = window.location.toString();
          // 跳转到指定网页
          window.open(`https://viewer.strawberrytree.top/translate/#${encodeURIComponent(rawURI)}`);
      });

      // 将按钮元素添加到目标元素的右侧
      targetElement.appendChild(button);
  }
  addButton();
  const addHistoryEvent = function(type) {
      var originalMethod = history[type];
      return function() {
          var recallMethod = originalMethod.apply(this, arguments);
          var e = new Event(type);
          e.arguments = arguments;
          window.dispatchEvent(e);
          return recallMethod;
      };
  };
  history.pushState = addHistoryEvent('pushState');
  history.replaceState = addHistoryEvent('replaceState');

  window.addEventListener('pushState', ()=>setTimeout(document.onreadystatechange=addButton, 100));

})();
