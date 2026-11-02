// Eclipse Auto-Update Notifier & Markdown Changelog Viewer
// Checks GitHub Releases (valzevox/eclipse-mobile) for newer semantic version vX.Y.Z
(() => {
  const build = window.ECLIPSE_BUILD || window.MURIEL_BUILD || {};
  const REPO = build.repo || 'valzevox/eclipse-mobile';
  const CURRENT_VER = String(build.version || '1.0.8').replace(/^v/i, '');
  const CHECK_EVERY = 30 * 60 * 1000;
  const SNOOZE = 24 * 3600 * 1000;

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  function parseVer(v) {
    return String(v || '').replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  }

  function isNewerVer(remote, local) {
    const r = parseVer(remote);
    const l = parseVer(local);
    const len = Math.max(r.length, l.length);
    for (let i = 0; i < len; i++) {
      if ((r[i] || 0) > (l[i] || 0)) return true;
      if ((r[i] || 0) < (l[i] || 0)) return false;
    }
    return false;
  }

  function renderMarkdown(md) {
    if (!md) return '<p>Performance improvements and bug fixes.</p>';
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const inline = (s) => esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:5px;font-size:0.92em;">$1</code>');
    return String(md).split(/\r?\n/).map((line) => {
      const t = line.trim();
      if (!t || t.startsWith('<!--')) return '';
      if (t.startsWith('### ')) return '<h4 style="margin:10px 0 4px;color:#fff;font-size:14px;">' + inline(t.slice(4)) + '</h4>';
      if (t.startsWith('## ')) return '<h3 style="margin:12px 0 6px;color:#fff;font-size:15px;">' + inline(t.slice(3)) + '</h3>';
      if (t.startsWith('# ')) return '<h3 style="margin:12px 0 6px;color:#fff;font-size:16px;">' + inline(t.slice(2)) + '</h3>';
      if (t.startsWith('- ') || t.startsWith('* ')) {
        return '<div style="display:flex;gap:8px;margin:4px 0;line-height:1.45;"><span style="color:var(--md-sys-color-primary,#B69DF8);">•</span><span>' + inline(t.slice(2)) + '</span></div>';
      }
      return '<p style="margin:4px 0;line-height:1.45;">' + inline(t) + '</p>';
    }).join('');
  }

  async function fetchLatestRelease() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: ctrl.signal
      });
      if (res.ok) return await res.json();
      const listRes = await fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=5', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: ctrl.signal
      });
      if (!listRes.ok) return null;
      const list = await listRes.json();
      return Array.isArray(list) && list.length ? list[0] : null;
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  function describe(rel) {
    if (!rel) return null;
    const tag = String(rel.tag_name || '').trim();
    const body = String(rel.body || '');
    const verMatch = tag.match(/^v?(\d+\.\d+\.\d+)/) || body.match(/eclipse-version:\s*([0-9][\w.-]*)/i) || body.match(/muriel-version:\s*([0-9][\w.-]*)/i);
    const remoteVer = verMatch ? verMatch[1] : tag.replace(/^v/i, '');
    const newerVer = remoteVer && /^\d+\.\d+/.test(remoteVer) && isNewerVer(remoteVer, CURRENT_VER);
    if (!newerVer) return null;

    const assets = Array.isArray(rel.assets) ? rel.assets : [];
    const apkAsset = assets.find((a) => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk'));
    const exeAsset = assets.find((a) => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.exe'));
    const isWin = navigator.userAgent.includes('Windows') && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const chosen = isWin ? (exeAsset || apkAsset) : (apkAsset || exeAsset);
    const downloadUrl = (chosen && chosen.browser_download_url) || ('https://github.com/' + REPO + '/releases/download/' + tag + '/Eclipse-' + tag + '.apk');

    return {
      tag,
      version: remoteVer,
      notes: body,
      url: downloadUrl,
      page: rel.html_url || ('https://github.com/' + REPO + '/releases/tag/' + tag)
    };
  }

  function openExternal(url) {
    if (window.MurielNative && typeof window.MurielNative.openUrl === 'function') {
      window.MurielNative.openUrl(url);
      return;
    }
    window.open(url, '_system');
    location.href = url;
  }

  let modalEl = null;
  function showUpdateModal(update) {
    if (modalEl) modalEl.remove();
    modalEl = document.createElement('div');
    modalEl.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.68);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;';
    modalEl.innerHTML = `
      <div style="width:100%;max-width:420px;max-height:82vh;background:var(--md-sys-color-surface-container-high,#1A1922);border:1px solid rgba(255,255,255,0.12);border-radius:26px;padding:22px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 50px rgba(0,0,0,0.6);color:var(--md-sys-color-on-surface,#fff);">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:44px;height:44px;border-radius:22px;background:rgba(182,157,248,0.18);display:flex;align-items:center;justify-content:center;color:var(--md-sys-color-primary,#B69DF8);flex-shrink:0;">
            <svg viewBox="0 0 512 512" width="26" height="26" fill="currentColor"><path d="M256 36C134.497 36 36 134.497 36 256C36 377.503 134.497 476 256 476C330.185 476 395.816 439.298 435.691 383.105C411.519 401.181 381.471 411.9 348.9 411.9C268.819 411.9 203.9 346.981 203.9 266.9C203.9 186.819 268.819 121.9 348.9 121.9C381.471 121.9 411.519 132.619 435.691 150.695C395.816 94.502 330.185 36 256 36ZM372 204C364.268 204 358 210.268 358 218V316C358 323.732 364.268 330 372 330C379.732 330 386 323.732 386 316V218C386 210.268 379.732 204 372 204ZM424 176C416.268 176 410 182.268 410 190V344C410 351.732 416.268 358 424 358C431.732 358 438 351.732 438 344V190C438 182.268 431.732 176 424 176ZM320 236C312.268 236 306 242.268 306 250V284C306 291.732 312.268 298 320 298C327.732 298 334 291.732 334 284V250C334 242.268 327.732 236 320 236Z"/></svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:17px;letter-spacing:-0.3px;">Update Available</div>
            <div style="font-size:13px;opacity:0.7;">Eclipse v${update.version} • Latest Build</div>
          </div>
        </div>
        <div style="overflow-y:auto;max-height:50vh;padding:14px;background:rgba(0,0,0,0.22);border-radius:18px;font-size:13px;color:#D4D4D8;">
          ${renderMarkdown(update.notes)}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:4px;">
          <button type="button" id="eclipse-upd-later" style="padding:10px 18px;border-radius:999px;background:rgba(255,255,255,0.08);color:#D4D4D8;font-weight:600;font-size:13px;cursor:pointer;">Later</button>
          <button type="button" id="eclipse-upd-go" style="padding:10px 20px;border-radius:999px;background:var(--md-sys-color-primary,#B69DF8);color:#121214;font-weight:700;font-size:13px;cursor:pointer;">Download Update</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
    modalEl.querySelector('#eclipse-upd-later').addEventListener('click', () => {
      store.set('eclipse_update_snooze', { ver: update.version, until: Date.now() + SNOOZE });
      modalEl.remove();
      modalEl = null;
    });
    modalEl.querySelector('#eclipse-upd-go').addEventListener('click', () => {
      openExternal(update.url);
      modalEl.remove();
      modalEl = null;
    });
  }

  let banner = null;
  function hideBanner() {
    if (!banner) return;
    const b = banner; banner = null;
    b.classList.remove('show');
    setTimeout(() => b.remove(), 400);
  }
  function showBanner(update) {
    if (banner) return;
    const snooze = store.get('eclipse_update_snooze');
    if (snooze && snooze.ver === update.version && snooze.until > Date.now()) return;
    banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <svg class="update-banner-star" viewBox="0 0 512 512" aria-hidden="true"><path d="M256 36C134.497 36 36 134.497 36 256C36 377.503 134.497 476 256 476C330.185 476 395.816 439.298 435.691 383.105C411.519 401.181 381.471 411.9 348.9 411.9C268.819 411.9 203.9 346.981 203.9 266.9C203.9 186.819 268.819 121.9 348.9 121.9C381.471 121.9 411.519 132.619 435.691 150.695C395.816 94.502 330.185 36 256 36ZM372 204C364.268 204 358 210.268 358 218V316C358 323.732 364.268 330 372 330C379.732 330 386 323.732 386 316V218C386 210.268 379.732 204 372 204ZM424 176C416.268 176 410 182.268 410 190V344C410 351.732 416.268 358 424 358C431.732 358 438 351.732 438 344V190C438 182.268 431.732 176 424 176ZM320 236C312.268 236 306 242.268 306 250V284C306 291.732 312.268 298 320 298C327.732 298 334 291.732 334 284V250C334 242.268 327.732 236 320 236Z"/></svg>
      <div class="update-banner-text"><b data-i18n>Update available</b><span>Eclipse v${update.version} is ready</span></div>
      <button type="button" class="update-banner-later" data-i18n>Details</button>
      <button type="button" class="update-banner-go" data-i18n>Download</button>`;
    banner.querySelector('.update-banner-go').addEventListener('click', () => { openExternal(update.url); hideBanner(); });
    banner.querySelector('.update-banner-later').addEventListener('click', () => { hideBanner(); showUpdateModal(update); });
    document.body.appendChild(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner && banner.classList.add('show')));
  }

  const statusEl = document.getElementById('update-status');
  const checkBtn = document.getElementById('btn-check-updates');
  const aboutVerEl = document.getElementById('about-version');
  if (aboutVerEl) aboutVerEl.textContent = 'Version ' + CURRENT_VER;
  const creditsVerEl = document.querySelector('.settings-version-tag');
  if (creditsVerEl) creditsVerEl.textContent = 'v' + CURRENT_VER;

  const setStatus = (text, update) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle('has-update', !!update);
    if (checkBtn) checkBtn.textContent = update ? 'Update Now' : 'Check now';
  };
  let current = null;

  async function check(manual) {
    if (manual) setStatus('Checking GitHub releases…');
    const rel = await fetchLatestRelease();
    if (!rel) {
      if (manual) setStatus("Couldn't reach GitHub, try again later");
      return;
    }
    store.set('eclipse_update_last', Date.now());
    current = describe(rel);
    if (current) {
      setStatus('Eclipse v' + current.version + ' is available', current);
      if (manual) showUpdateModal(current);
      else showBanner(current);
    } else {
      setStatus("You're up to date (v" + CURRENT_VER + ')');
    }
  }

  if (checkBtn) checkBtn.addEventListener('click', () => (current ? showUpdateModal(current) : check(true)));
  if (statusEl) setStatus('Eclipse v' + CURRENT_VER + ' • Checks for updates automatically');

  setTimeout(() => check(false), 3500);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const last = store.get('eclipse_update_last') || 0;
      if (Date.now() - last > CHECK_EVERY) check(false);
    }
  });
  window.MurielUpdates = { check: () => check(true) };
})();
