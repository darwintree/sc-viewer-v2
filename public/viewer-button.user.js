// ==UserScript==
// @name         Github Viewer Button
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Add a viewer button for SCTranslation Github repo
// @author       mihu
// @match        https://github.com/*
// @run-at       document-end
// @icon         https://static.sc-viewer.top/favicon.ico
// @grant        none
// @updateURL    https://static.sc-viewer.top/viewer-button.user.js
// @supportURL   https://github.com/darwintree/sc-viewer-v2/issues
// ==/UserScript==

;(function () {
  'use strict'
  function createFloatingWindow() {
    if (!window.location.toString().endsWith('.csv')) return
    // 创建悬浮窗
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.top = '125px'
    div.style.right = '50px'
    div.style.width = '200px'
    div.style.height = '50px'
    div.style.backgroundColor = '#fff'
    div.style.boxShadow = '0px 2px 5px rgba(0, 0, 0, 0.3)'
    div.style.border = '2px solid grey'
    div.style.zIndex = '9999'
    div.style.display = 'flex'
    div.style.flexDirection = 'column' // 修改为列布局
    div.style.alignItems = 'center'
    div.style.justifyContent = 'center'
    div.style.cursor = 'pointer'
    div.style.borderRadius = '10px'

    const row = document.createElement('div')
    row.style.display = 'flex'
    row.style.alignItems = 'center'
    row.style.justifyContent = 'center'
    row.style.margin = '5px'

    // 创建图像元素
    const img = document.createElement('img')
    img.src =
      'data:image/webp;base64,UklGRjADAABXRUJQVlA4WAoAAAAQAAAAHwAAHwAAQUxQSBQBAAANgJj+f1zlSwkhhFBKjfWdGziKeziLY+gIjnTrO2IIpYRQvN71FxeIiAngH1bGWNd2E3MXjlLaWNe0k8nUO6vII5vbp51uUTft5KJtjKIUjrUmANXV9Vg+ETX1CvgsC6Sr7g3grbZSzJ93VtaJLV4+gVA1YpOYgT57sTYPwNB3Ys3YA2P0Yk4H4PN9KmbNDm8TMd2sdlaNllL+bU9tpFg+fwIb48QmoQDxs5VLA9BnL+ZLAnLqxGoVgM+NnNM7rM/FjAufwKoT03Ucd1olpc4+CrBxRoou5R1rxfwwALGqxbo9qfjTxjL0fUrtJUCOk32feehjDCGuYypUWntXAeOD2exuQ8qfylhdcerNvbaKv1wN/CFWUDgg9gEAAFAJAJ0BKiAAIAA+nUCbSaWjoiEwGAgAsBOJQBdmZg+gjQTL57Hj0f4zOPboP1C3+f8D09NDD0hv9lGHjFPrT0V692dvWcojSOMEevcr3RX0VywAAP40Vy4cLjHUumUZn1O2TFCWAf7lfT/nPtP0qdWH/yV+3wn2c78XFsI6u96v/5Zs4n/lPKwj9vJIHyWhDOVaOmy5ujmomTH/zStYLt19/u4TavrXfdRkaxojDC3HHr8LJtErv87XWAvFE7ME/C2QQe8ycibolAqBTKodSA5CJlbF8UnASL08TPHT76zE6MBepWnmAtEbJFVskCOg0L0S6CO4v2i45/hXtpDs9U24yk3TUoLYDxZmajT5iJnQJ2mzhKgx7n52VAMqcUK4DXMn/z+XxE6qNlJuyonyQlzv/sexTimxVF5qwPIa6YKcYrrV+r/5G03dCqb4GULk7k2Ab+ngDI9aB1zInc5o7l21X/9N/dYHvTT3VYTxIWDqwUgkTq9sTU8j/5qHY2IP8UsqYem3+1FZGl23HWfbvYQdWz4T6FWS4rHIYlbbD0inrmaVFzzNBOz4GPov/Kl5Zd53vwlnEeFosCj9aqAwLBo/9s3u60/Sf5ShNUZSKHIlMh/65JB7S9V/JVqa31CvE3kD63BOpRPN5EyPCqXxL9zW9e9Z8AA='
    img.style.width = '32px'
    img.style.height = '32px'
    img.style.marginRight = '5px'
    img.style.display = 'inline'

    // 创建段落元素
    const p = document.createElement('span')
    p.style.margin = '0'
    p.innerHTML = 'Go To Viewer'
    // p.style.display = 'inline';
    p.style.fontSize = '1.5em'
    p.style.fontWeight = '500'
    p.style.fontFamily = 'consolas'

    // 创建进度条元素
    const progress = document.createElement('div')
    progress.style.width = '0%'
    progress.style.height = '3px'
    progress.style.backgroundColor = '#7CFC00'
    progress.style.marginTop = '2px' // 设置间距
    //progress.style.flexGrow = '1'; // 设置自动填充剩余空间

    // 将图像元素、段落元素和进度条元素添加到悬浮窗中
    row.appendChild(img)
    row.appendChild(p)
    div.appendChild(row)
    div.appendChild(progress)

    // 添加悬浮效果
    div.addEventListener('mouseover', function () {
      div.style.backgroundColor = '#eee'
    })
    div.addEventListener('mouseout', function () {
      div.style.backgroundColor = '#fff'
    })

    // 设置进度条和自动关闭功能
    const startTime = Date.now()
    const endTime = startTime + 10000 // 10秒钟后自动关闭
    const timer = setInterval(function () {
      const now = Date.now()
      const progressValue = ((now - startTime) / (endTime - startTime)) * 100
      progress.style.width = progressValue + '%'
      if (now >= endTime) {
        clearInterval(timer)
        div.remove()
      }
    }, 50)

    div.addEventListener('click', function () {
      const rawURI = window.location.toString()
      // 跳转到指定网页
      window.open(
        `https://sc-viewer.top/translate/#${encodeURIComponent(rawURI)}`
      )
    })

    // 将悬浮窗添加到页面中
    document.body.appendChild(div)
  }

  createFloatingWindow()
  const addHistoryEvent = function (type) {
    const originalMethod = history[type]
    return function (...args) {
      const recallMethod = originalMethod.apply(this, args)
      const e = new Event(type)
      e.arguments = args
      window.dispatchEvent(e)
      return recallMethod
    }
  }
  history.pushState = addHistoryEvent('pushState')
  history.replaceState = addHistoryEvent('replaceState')

  window.addEventListener('pushState', () =>
    setTimeout((document.onreadystatechange = createFloatingWindow), 100)
  )
})()
