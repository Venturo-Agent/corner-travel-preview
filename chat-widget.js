/**
 * 一棧 網站 Chatbox 嵌入 widget（v1、2026-06-07）
 *
 * 用法（貼進任何網站 </body> 前）：
 *   <script src="https://erp.venturo.tw/chat-widget.js" data-site-key="wsc_xxx" defer></script>
 *
 * 可選屬性：
 *   data-endpoint   覆寫 API（預設 = script 來源 host 的 /api/website/chat）
 *   data-title      視窗標題（預設「線上客服」）
 *   data-color      主色（預設 #2D1F18）
 *   data-avatar     啟動鈕頭像圖（圖網址；不設 = 預設 💬）
 *   data-open       預設展開（"1"/"true"）；訪客關掉後同一 session 不再自動彈
 *
 * 零依賴 vanilla JS、樣式自帶 scoped class、不污染宿主頁面。
 */
;(function () {
  'use strict'
  var script = document.currentScript
  if (!script) return
  var SITE_KEY = script.getAttribute('data-site-key')
  if (!SITE_KEY) {
    console.warn('[yz-chat] data-site-key 未設定、widget 不啟動')
    return
  }
  var scriptOrigin = (function () {
    try {
      return new URL(script.src).origin
    } catch (e) {
      return ''
    }
  })()
  var ENDPOINT = script.getAttribute('data-endpoint') || scriptOrigin + '/api/website/chat'
  var TITLE = script.getAttribute('data-title') || '線上客服'
  var COLOR = script.getAttribute('data-color') || '#2D1F18'
  var AVATAR = script.getAttribute('data-avatar') || ''
  var AUTO_OPEN = /^(1|true|yes|open)$/i.test(script.getAttribute('data-open') || '')

  // session id：localStorage 續存、同訪客同 thread
  var SID_KEY = 'yz_chat_sid'
  var sid = ''
  try {
    sid = localStorage.getItem(SID_KEY) || ''
  } catch (e) {
    /* storage 被擋（無痕等）就用記憶體 sid */
  }
  if (!sid || !/^[A-Za-z0-9_-]{8,64}$/.test(sid)) {
    sid = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
    try {
      localStorage.setItem(SID_KEY, sid)
    } catch (e) {
      /* 同上 */
    }
  }

  // ── 樣式 ──
  var css =
    '.yzcw-btn{position:fixed;right:20px;bottom:20px;z-index:99990;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:' + COLOR + ';color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.25);font-size:24px;line-height:56px;text-align:center;overflow:hidden;padding:0;transition:transform .15s}' +
    '.yzcw-btn:hover{transform:scale(1.06)}' +
    '.yzcw-btn img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}' +
    '.yzcw-btn svg{vertical-align:middle}' +
    '.yzcw-panel{position:fixed;right:20px;bottom:88px;z-index:99991;width:340px;max-width:calc(100vw - 40px);height:460px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.28);display:none;flex-direction:column;overflow:hidden;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}' +
    '.yzcw-panel.open{display:flex}' +
    '.yzcw-head{padding:14px 16px;background:' + COLOR + ';color:#fff;font-size:15px;font-weight:600;display:flex;justify-content:space-between;align-items:center}' +
    '.yzcw-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:0 4px}' +
    '.yzcw-msgs{flex:1;overflow-y:auto;padding:14px;background:#f7f5f2;display:flex;flex-direction:column;gap:8px}' +
    '.yzcw-m{max-width:82%;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word}' +
    '.yzcw-m.me{align-self:flex-end;background:' + COLOR + ';color:#fff;border-bottom-right-radius:4px}' +
    '.yzcw-m.bot{align-self:flex-start;background:#fff;color:#222;border:1px solid rgba(0,0,0,.08);border-bottom-left-radius:4px}' +
    '.yzcw-m.typing{color:#999;font-style:italic}' +
    '.yzcw-foot{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(0,0,0,.08);background:#fff}' +
    '.yzcw-input{flex:1;border:1px solid rgba(0,0,0,.15);border-radius:8px;padding:9px 11px;font-size:14px;outline:none;resize:none;font-family:inherit}' +
    '.yzcw-input:focus{border-color:' + COLOR + '}' +
    '.yzcw-send{border:none;border-radius:8px;background:' + COLOR + ';color:#fff;padding:0 16px;font-size:14px;cursor:pointer}' +
    '.yzcw-form{flex:1;display:none;flex-direction:column;gap:9px;padding:16px;overflow-y:auto;background:#fff}' +
    '.yzcw-panel.show-form .yzcw-form{display:flex}' +
    '.yzcw-panel.show-form .yzcw-msgs,.yzcw-panel.show-form .yzcw-foot{display:none}' +
    '.yzcw-form-intro{font-size:13px;line-height:1.7;color:#666;margin:0 0 4px}' +
    '.yzcw-form input{border:1px solid rgba(0,0,0,.16);border-radius:8px;padding:10px 12px;font-size:14px;outline:none;font-family:inherit}' +
    '.yzcw-form input:focus{border-color:' + COLOR + '}' +
    '.yzcw-form-err{font-size:12px;color:#c0392b;min-height:1em;line-height:1.4}' +
    '.yzcw-form-go{border:none;border-radius:8px;background:' + COLOR + ';color:#fff;padding:11px;font-size:14.5px;cursor:pointer;margin-top:2px}' +
    '.yzcw-send:disabled{opacity:.5;cursor:default}'
  var styleEl = document.createElement('style')
  styleEl.textContent = css
  document.head.appendChild(styleEl)

  // ── DOM ──
  var btn = document.createElement('button')
  btn.className = 'yzcw-btn'
  btn.setAttribute('aria-label', TITLE)
  btn.innerHTML = AVATAR ? '<img src="' + AVATAR + '" alt="">' : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/></svg>'

  var panel = document.createElement('div')
  panel.className = 'yzcw-panel'
  panel.innerHTML =
    '<div class="yzcw-head"><span></span><button class="yzcw-close" aria-label="關閉">✕</button></div>' +
    '<div class="yzcw-form">' +
      '<p class="yzcw-form-intro">留個聯絡方式，方便我們顧問後續為您安排與回覆。</p>' +
      '<input class="yzcw-f-name" type="text" autocomplete="name" placeholder="您的稱呼／姓名">' +
      '<input class="yzcw-f-phone" type="tel" autocomplete="tel" placeholder="聯絡電話">' +
      '<input class="yzcw-f-email" type="email" autocomplete="email" placeholder="Email">' +
      '<div class="yzcw-form-err"></div>' +
      '<button class="yzcw-form-go">開始諮詢</button>' +
    '</div>' +
    '<div class="yzcw-msgs"></div>' +
    '<div class="yzcw-foot"><textarea class="yzcw-input" rows="1" placeholder="輸入訊息…"></textarea><button class="yzcw-send">送出</button></div>'
  panel.querySelector('.yzcw-head span').textContent = TITLE

  document.body.appendChild(btn)
  document.body.appendChild(panel)

  var msgs = panel.querySelector('.yzcw-msgs')
  var input = panel.querySelector('.yzcw-input')
  var sendBtn = panel.querySelector('.yzcw-send')
  var greeted = false

  function addMsg(text, who) {
    var el = document.createElement('div')
    el.className = 'yzcw-m ' + who
    el.textContent = text
    msgs.appendChild(el)
    msgs.scrollTop = msgs.scrollHeight
    return el
  }

  // 開場白：後台「網站 Chatbox」設定的 bot_greeting、沒設才用預設句
  var DEFAULT_GREETING = '您好！有什麼可以幫您的嗎？'
  function showGreeting() {
    fetch(ENDPOINT + '?siteKey=' + encodeURIComponent(SITE_KEY))
      .then(function (r) {
        return r.ok ? r.json() : null
      })
      .then(function (data) {
        addMsg((data && data.greeting) || DEFAULT_GREETING, 'bot')
      })
      .catch(function () {
        addMsg(DEFAULT_GREETING, 'bot')
      })
  }

  var CONTACT_KEY = 'yz_chat_contact'
  function hasContact() {
    try {
      return !!localStorage.getItem(CONTACT_KEY)
    } catch (e) {
      return false
    }
  }
  function toggle(open) {
    panel.classList.toggle('open', open)
    if (!open) return
    if (!hasContact()) {
      // 還沒留聯絡方式 → 先出表單、填完才進對話
      panel.classList.add('show-form')
      var n = panel.querySelector('.yzcw-f-name')
      if (n) n.focus()
    } else {
      if (!greeted) {
        greeted = true
        showGreeting()
      }
      input.focus()
    }
  }
  function rememberClosed() {
    try {
      sessionStorage.setItem('yz_chat_closed', '1')
    } catch (e) {
      /* storage 被擋就算了 */
    }
  }
  btn.addEventListener('click', function () {
    var willOpen = !panel.classList.contains('open')
    toggle(willOpen)
    if (!willOpen) rememberClosed()
  })
  panel.querySelector('.yzcw-close').addEventListener('click', function () {
    toggle(false)
    rememberClosed()
  })

  // 預設展開：embed 帶 data-open 時自動打開；訪客本 session 關過就不再彈
  var closedBefore = false
  try {
    closedBefore = sessionStorage.getItem('yz_chat_closed') === '1'
  } catch (e) {
    /* 同上 */
  }
  if (AUTO_OPEN && !closedBefore) {
    setTimeout(function () {
      toggle(true)
    }, 600)
  }

  var busy = false
  function postMessage(text) {
    if (!text || busy) return
    addMsg(text, 'me')
    busy = true
    sendBtn.disabled = true
    var typing = addMsg('輸入中…', 'bot typing')
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid, message: text, siteKey: SITE_KEY }),
    })
      .then(function (r) {
        return r.json().catch(function () {
          return {}
        })
      })
      .then(function (data) {
        typing.remove()
        addMsg(data.reply || data.error || '抱歉、目前無法回覆、請稍後再試。', 'bot')
      })
      .catch(function () {
        typing.remove()
        addMsg('連線失敗、請稍後再試。', 'bot')
      })
      .then(function () {
        busy = false
        sendBtn.disabled = false
        input.focus()
      })
  }
  function send() {
    var text = input.value.trim()
    if (!text) return
    input.value = ''
    postMessage(text)
  }
  sendBtn.addEventListener('click', send)
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  })

  // ── 對話前表單：收姓名/電話/Email、填完當第一則訊息送進收件匣 ──
  var formGo = panel.querySelector('.yzcw-form-go')
  var errBox = panel.querySelector('.yzcw-form-err')
  function submitForm() {
    var name = panel.querySelector('.yzcw-f-name').value.trim()
    var phone = panel.querySelector('.yzcw-f-phone').value.trim()
    var email = panel.querySelector('.yzcw-f-email').value.trim()
    if (!name || !phone || !email) {
      errBox.textContent = '請完整留下姓名、電話與 Email。'
      return
    }
    if (phone.replace(/[^0-9]/g, '').length < 7) {
      errBox.textContent = '電話格式怪怪的、再確認一下。'
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errBox.textContent = 'Email 格式怪怪的、再確認一下。'
      return
    }
    errBox.textContent = ''
    try {
      localStorage.setItem(CONTACT_KEY, JSON.stringify({ name: name, phone: phone, email: email }))
    } catch (e) {
      /* storage 被擋也照常進對話 */
    }
    panel.classList.remove('show-form')
    greeted = true
    postMessage('您好，我想諮詢角落的行程。\n姓名：' + name + '\n電話：' + phone + '\nEmail：' + email)
  }
  formGo.addEventListener('click', submitForm)
  panel.querySelector('.yzcw-form').addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault()
      submitForm()
    }
  })
})()
