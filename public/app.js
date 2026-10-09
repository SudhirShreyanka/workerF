document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const emailForm = document.getElementById('emailForm');
  const toInput = document.getElementById('toInput');
  const subjectInput = document.getElementById('subjectInput');
  const textInput = document.getElementById('textInput');
  const htmlInput = document.getElementById('htmlInput');
  const sendBtn = document.getElementById('sendBtn');
  const presetPingBtn = document.getElementById('presetPingBtn');
  const presetStandardBtn = document.getElementById('presetStandardBtn');
  const presetHtmlBtn = document.getElementById('presetHtmlBtn');
  const clearLogBtn = document.getElementById('clearLogBtn');
  const resultContainer = document.getElementById('resultContainer');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const backendStatusBadge = document.getElementById('backendStatusBadge');
  const backendStatusText = document.getElementById('backendStatusText');
  const tabTextBtn = document.getElementById('tabTextBtn');
  const tabHtmlBtn = document.getElementById('tabHtmlBtn');
  const paneText = document.getElementById('paneText');
  const paneHtml = document.getElementById('paneHtml');
  const toastContainer = document.getElementById('toastContainer');

  let historyData = [];

  // 1. Tab Switching (Text vs HTML)
  tabTextBtn.addEventListener('click', () => {
    tabTextBtn.classList.add('active');
    tabHtmlBtn.classList.remove('active');
    paneText.classList.add('active');
    paneHtml.classList.remove('active');
  });

  tabHtmlBtn.addEventListener('click', () => {
    tabHtmlBtn.classList.add('active');
    tabTextBtn.classList.remove('active');
    paneHtml.classList.add('active');
    paneText.classList.remove('active');
  });

  // 2. Presets
  presetPingBtn.addEventListener('click', () => {
    const time = new Date().toLocaleTimeString();
    subjectInput.value = `⚡ Quick Ping [${time}]`;
    textInput.value = `Ping test dispatched via secure Railway BFF proxy at ${new Date().toISOString()}.\nStatus: Verified OK.`;
    tabTextBtn.click();
    showToast('Applied Quick Ping template', 'info');
  });

  presetStandardBtn.addEventListener('click', () => {
    const time = new Date().toLocaleTimeString();
    subjectInput.value = `Delivery Verification: Worker Dispatch [${time}]`;
    textInput.value = `Hello,\n\nThis is a delivery verification test dispatched through the Railway frontend and Render backend architecture.\n\nConnection Details:\n- Architecture: Railway BFF + Render Backend\n- SMTP: Google Gmail\n- Timestamp: ${new Date().toISOString()}\n\nPlease verify that this message reached your inbox.`;
    tabTextBtn.click();
    showToast('Applied Standard Test template', 'info');
  });

  presetHtmlBtn.addEventListener('click', () => {
    const time = new Date().toLocaleTimeString();
    subjectInput.value = `🎨 Rich HTML Delivery Test [${time}]`;
    textInput.value = `This is a test email sent using Google SMTP.`;
    htmlInput.value = `<div style="max-width: 580px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 28px 24px; color: #ffffff;">
    <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Delivery Verification Test</h1>
    <p style="margin: 6px 0 0; opacity: 0.85; font-size: 14px;">Railway Frontend &bull; Render Backend</p>
  </div>
  <div style="padding: 24px; color: #334155; line-height: 1.6;">
    <p style="font-size: 15px; margin-top: 0;">This email confirms that your isolated frontend/backend architecture successfully communicated and dispatched via Google SMTP.</p>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px;">
      <div style="margin-bottom: 6px;"><strong>Architecture:</strong> <code style="color: #4f46e5;">BFF Proxy &bull; Render API</code></div>
      <div><strong>Dispatched:</strong> <code>${new Date().toISOString()}</code></div>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you see this in your inbox, delivery pipelines are fully operational.</p>
  </div>
</div>`;
    tabHtmlBtn.click();
    showToast('Applied Rich HTML template', 'info');
  });

  // 3. Backend Health Polling via Same-Origin BFF Proxy
  async function checkBackendHealth() {
    try {
      const res = await fetch('/api/backend-health');
      const dot = backendStatusBadge.querySelector('.status-dot');

      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          dot.className = 'status-dot online';
          backendStatusText.textContent = 'Backend Online';
          return;
        }
      }
      markOffline();
    } catch {
      markOffline();
    }
  }

  function markOffline() {
    const dot = backendStatusBadge.querySelector('.status-dot');
    dot.className = 'status-dot offline';
    backendStatusText.textContent = 'Backend Offline';
  }

  checkBackendHealth();
  setInterval(checkBackendHealth, 15000);

  // 4. Keyboard Shortcut: Ctrl+Enter / Cmd+Enter
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      emailForm.requestSubmit();
    }
  });

  // 5. Clear Log Button
  clearLogBtn.addEventListener('click', () => {
    resultContainer.innerHTML = `
      <div class="placeholder-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect width="20" height="16" x="2" y="4" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </div>
      <h3 class="placeholder-title">Awaiting Dispatch</h3>
      <p class="placeholder-desc">Enter recipient details and click Send to inspect transmission status and message ID.</p>
    `;
    resultContainer.className = 'result-placeholder';
    showToast('Receipt reset', 'info');
  });

  // 6. Handle Form Submission (Calls Same-Origin /api/send-email)
  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const to = toInput.value.trim();
    const subject = subjectInput.value.trim();
    const text = textInput.value.trim();
    const html = htmlInput.value.trim();

    if (!to) {
      showToast('Please enter a recipient email.', 'error');
      toInput.focus();
      return;
    }

    if (!subject) {
      showToast('Please enter an email subject.', 'error');
      subjectInput.focus();
      return;
    }

    if (!text && !html) {
      showToast('Please enter either Plain Text or HTML content.', 'error');
      textInput.focus();
      return;
    }

    setLoading(true);

    const payload = { to, subject };
    if (text) payload.text = text;
    if (html) payload.html = html;

    try {
      // Browser talks strictly to same-origin /api/send-email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        renderSuccess(data);
        showToast('✓ Email accepted by SMTP server!', 'success');
        addHistory({
          recipient: to,
          subject: subject,
          time: new Date().toLocaleTimeString(),
          success: true,
          messageId: data.details?.messageId || 'Accepted',
        });
      } else {
        renderError(data, response.status);
        showToast(data.message || data.error || 'Failed to dispatch email', 'error');
        addHistory({
          recipient: to,
          subject: subject,
          time: new Date().toLocaleTimeString(),
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
        });
      }
    } catch (err) {
      renderError({
        error: 'Network Error',
        message: 'Could not connect to the frontend server.',
      }, 0);
      showToast('Network error connecting to service', 'error');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    const btnText = sendBtn.querySelector('.btn-text');
    const btnLoader = sendBtn.querySelector('.btn-loader');
    sendBtn.disabled = isLoading;

    if (isLoading) {
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';
    } else {
      btnText.style.display = 'inline-flex';
      btnLoader.style.display = 'none';
    }
  }

  function renderSuccess(data) {
    resultContainer.className = 'receipt-card-container';
    
    const recipient = data.details?.recipient || '';
    const messageId = data.details?.messageId || 'N/A';
    const timestampFormatted = new Date(data.timestamp).toLocaleString();
    const rawJson = JSON.stringify(data, null, 2);

    resultContainer.innerHTML = `
      <div class="receipt-hero-banner">
        <div class="hero-status-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="hero-status-text">
          <div class="hero-title">Accepted for Delivery</div>
          <div class="hero-subtitle">Queued by Google Mail Transport Agent (smtp.gmail.com)</div>
        </div>
        <span class="status-code-pill">200 OK</span>
      </div>

      <div class="transmission-pipeline">
        <div class="pipeline-step completed">
          <span class="step-check">✓</span>
          <span>BFF Proxy Relay</span>
        </div>
        <div class="pipeline-divider"></div>
        <div class="pipeline-step completed">
          <span class="step-check">✓</span>
          <span>Bearer Auth</span>
        </div>
        <div class="pipeline-divider"></div>
        <div class="pipeline-step completed">
          <span class="step-check">✓</span>
          <span>SMTP Queued</span>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Recipient</span>
            <button type="button" class="btn-copy-sm" data-copy="${escapeHtml(recipient)}">Copy</button>
          </div>
          <div class="metric-value font-mono text-truncate" title="${escapeHtml(recipient)}">
            ${escapeHtml(recipient)}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Message ID</span>
            <button type="button" class="btn-copy-sm" data-copy="${escapeHtml(messageId)}">Copy</button>
          </div>
          <div class="metric-value font-mono text-truncate" title="${escapeHtml(messageId)}">
            ${escapeHtml(messageId)}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Timestamp</span>
          </div>
          <div class="metric-value">
            ${escapeHtml(timestampFormatted)}
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Transport Route</span>
          </div>
          <div class="metric-value">
            <span class="security-chip">Railway &bull; Render API</span>
          </div>
        </div>
      </div>

      <div class="json-accordion">
        <button type="button" class="json-accordion-toggle" id="jsonToggleBtn">
          <span class="toggle-icon">▸</span>
          <span>Inspect Server Handshake JSON</span>
          <span class="toggle-tag">Diagnostic</span>
        </button>
        <div class="json-accordion-content" id="jsonAccordionContent" style="display: none;">
          <div class="json-box-header">
            <span>Payload Response</span>
            <button type="button" class="btn-copy-sm" data-copy="${escapeHtml(rawJson)}">Copy JSON</button>
          </div>
          <pre class="json-dump-code">${escapeHtml(rawJson)}</pre>
        </div>
      </div>
    `;

    resultContainer.querySelectorAll('.btn-copy-sm').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const text = e.currentTarget.getAttribute('data-copy');
        if (text) {
          navigator.clipboard.writeText(text);
          const original = e.currentTarget.textContent;
          e.currentTarget.textContent = 'Copied!';
          e.currentTarget.classList.add('copied');
          setTimeout(() => {
            e.currentTarget.textContent = original;
            e.currentTarget.classList.remove('copied');
          }, 1800);
        }
      });
    });

    const toggleBtn = resultContainer.querySelector('#jsonToggleBtn');
    const content = resultContainer.querySelector('#jsonAccordionContent');
    toggleBtn.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      toggleBtn.querySelector('.toggle-icon').textContent = isHidden ? '▾' : '▸';
    });
  }

  function renderError(data, statusCode) {
    resultContainer.className = 'receipt-card-container';
    const errTitle = data.error || `HTTP ${statusCode || 'Error'}`;
    const errMessage = data.message || (data.details ? data.details.join(', ') : 'Delivery failed');
    const rawJson = JSON.stringify(data, null, 2);

    resultContainer.innerHTML = `
      <div class="receipt-hero-banner error-banner">
        <div class="hero-status-icon error-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div class="hero-status-text">
          <div class="hero-title">${escapeHtml(errTitle)}</div>
          <div class="hero-subtitle">${escapeHtml(errMessage)}</div>
        </div>
        <span class="status-code-pill error-pill">${statusCode || 500}</span>
      </div>

      <div class="json-accordion" style="margin-top: 1rem;">
        <button type="button" class="json-accordion-toggle" id="jsonToggleBtn">
          <span class="toggle-icon">▸</span>
          <span>View Technical Error JSON</span>
        </button>
        <div class="json-accordion-content" id="jsonAccordionContent" style="display: none;">
          <pre class="json-dump-code">${escapeHtml(rawJson)}</pre>
        </div>
      </div>
    `;

    const toggleBtn = resultContainer.querySelector('#jsonToggleBtn');
    const content = resultContainer.querySelector('#jsonAccordionContent');
    toggleBtn.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'block' : 'none';
      toggleBtn.querySelector('.toggle-icon').textContent = isHidden ? '▾' : '▸';
    });
  }

  function addHistory(item) {
    historyData.unshift(item);
    if (historyData.length > 8) historyData.pop();

    historyCount.textContent = `${historyData.length} sent`;
    historyList.innerHTML = historyData.map((h) => `
      <div class="history-item">
        <div class="history-left">
          <span class="history-status-dot ${h.success ? 'ok' : 'err'}"></span>
          <div class="history-details">
            <span class="history-recipient" title="${escapeHtml(h.recipient)}">${escapeHtml(h.recipient)}</span>
            <span class="history-subject" title="${escapeHtml(h.subject || '')}">${escapeHtml(h.subject || 'No subject')}</span>
          </div>
        </div>
        <div class="history-right">
          <span class="history-time">${escapeHtml(h.time)}</span>
          <span class="history-pill ${h.success ? 'ok' : 'err'}">
            ${h.success ? 'ACCEPTED' : 'FAILED'}
          </span>
        </div>
      </div>
    `).join('');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
