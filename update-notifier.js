// Eclipse Auto-Update Notifier & Markdown Changelog Viewer (Mobile)
// Enterprise Auto-Update System conforming to Chrome/VS Code standard
(() => {
  const build = window.ECLIPSE_BUILD || {};
  const REPO = build.repo || 'valzevox/eclipse-mobile';
  const CURRENT_VER = String(build.version || '1.0.8').replace(/^v/i, '');
  const CHECK_MIN_INTERVAL = 3 * 3600 * 1000; // 3 hours minimum check on resume
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
    if (!md) return '<p>See full release details on GitHub Release page.</p>';
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
        return '<div style="display:flex;gap:8px;margin:4px 0;line-height:1.45;"><span style="color:var(--md-sys-color-primary,#B69DF8);">&bull;</span><span>' + inline(t.slice(2)) + '</span></div>';
      }
      return '<p style="margin:4px 0;line-height:1.45;">' + inline(t) + '</p>';
    }).join('');
  }

  // 1. Static CDN manifest (Bypasses GitHub 60 req/h rate limit) with API fallback
  async function fetchManifest() {
    const staticUrl = 'https://github.com/' + REPO + '/releases/latest/download/latest.json';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(staticUrl, {
        headers: { Accept: 'application/json' },
        signal: ctrl.signal
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) return data;
      }
    } catch (_) {}
    finally {
      clearTimeout(timer);
    }

    // Fallback: GitHub Releases API
    const apiCtrl = new AbortController();
    const apiTimer = setTimeout(() => apiCtrl.abort(), 10000);
    try {
      const res = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
        headers: { Accept: 'application/vnd.github+json' },
        signal: apiCtrl.signal
      });
      if (res.ok) {
        const rel = await res.json();
        const tag = String(rel.tag_name || '').trim();
        const verMatch = tag.match(/^v?(\d+\.\d+\.\d+)/);
        const remoteVer = verMatch ? verMatch[1] : tag.replace(/^v/i, '');
        const assets = Array.isArray(rel.assets) ? rel.assets : [];
        const apkAsset = assets.find((a) => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk'));
        return {
          version: remoteVer,
          tag: tag,
          notes: rel.body || '',
          url: apkAsset ? apkAsset.browser_download_url : ('https://github.com/' + REPO + '/releases/download/' + tag + '/Eclipse-' + tag + '.apk'),
          page: rel.html_url || ('https://github.com/' + REPO + '/releases/tag/' + tag),
          blocked: [],
          minSupported: '0.0.0'
        };
      }
      return null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(apiTimer);
    }
  }

  function openExternal(url) {
    if (window.EclipseNative && typeof window.EclipseNative.openUrl === 'function') {
      window.EclipseNative.openUrl(url);
      return;
    }
    window.open(url, '_system');
    location.href = url;
  }

  function persistPlaybackState() {
    try {
      const audio = document.querySelector('audio');
      const nowPlayingTitle = document.querySelector('.now-playing-title, #track-title');
      const nowPlayingArtist = document.querySelector('.now-playing-artist, #track-artist');
      const state = {
        savedAt: Date.now(),
        currentTime: audio ? audio.currentTime : 0,
        paused: audio ? audio.paused : true,
        volume: audio ? audio.volume : 1,
        title: nowPlayingTitle ? nowPlayingTitle.textContent : '',
        artist: nowPlayingArtist ? nowPlayingArtist.textContent : '',
        trackId: window.currentTrackId || null,
        queue: window.currentQueue || []
      };
      localStorage.setItem('eclipse_playback_resume', JSON.stringify(state));

      // Native commit() to disk via SharedPreferences (Spec v3)
      if (window.EclipseNative && typeof window.EclipseNative.persistPlaybackStateSync === 'function') {
        window.EclipseNative.persistPlaybackStateSync(state);
      }
    } catch (_) {}
  }

  let modalEl = null;
  function showUpdateModal(update, options = {}) {
    if (modalEl) modalEl.remove();
    modalEl = document.createElement('div');
    modalEl.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.72);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:20px;';
    
    const isChangelogOnly = !!options.isChangelogOnly;
    const isBlocked = !!options.isBlocked;
    const isMandatory = !!options.isMandatory;
    const isNoSafeTarget = !!options.isNoSafeTarget;

    let title = "Update Available";
    let subtitle = "Eclipse v" + update.version + " &bull; Latest Build";
    let actionBtnText = 'Download & Install';

    if (isChangelogOnly) {
      title = "What's New in Eclipse";
      subtitle = "Eclipse v" + update.version + " &bull; Just Updated";
      actionBtnText = 'Got it';
    } else if (isNoSafeTarget) {
      title = "Cảnh Báo Thu Hồi Bản Phát Hành";
      subtitle = "Phiên bản hiện tại (v" + CURRENT_VER + ") đã bị thu hồi";
      actionBtnText = 'Đã Hiểu';
    } else if (isBlocked) {
      title = "Cảnh Báo Phiên Bản Lỗi";
      subtitle = "Bản hiện tại (v" + CURRENT_VER + ") đã bị thu hồi do lỗi nghiêm trọng.";
      actionBtnText = 'Cập Nhật Bản Vá Ngay';
    } else if (isMandatory) {
      title = "Bắt Buộc Cập Nhật";
      subtitle = "Phiên bản hiện tại không còn được hỗ trợ.";
      actionBtnText = 'Cập Nhật Ngay';
    }

    let html = '<div style="width:100%;max-width:440px;max-height:85vh;background:var(--md-sys-color-surface-container-high,#1A1922);border:1px solid ' + (isBlocked ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.14)') + ';border-radius:28px;padding:24px;display:flex;flex-direction:column;gap:16px;box-shadow:0 24px 60px rgba(0,0,0,0.7);color:var(--md-sys-color-on-surface,#fff);animation:popupFadeIn 0.25s cubic-bezier(0.2, 0, 0, 1);">';
    html += '<div style="display:flex;align-items:center;gap:14px;">';
    html += '<div style="width:48px;height:48px;border-radius:24px;background:' + (isBlocked ? 'rgba(239,68,68,0.2)' : 'rgba(182,157,248,0.2)') + ';display:flex;align-items:center;justify-content:center;color:' + (isBlocked ? '#EF4444' : 'var(--md-sys-color-primary,#B69DF8)') + ';flex-shrink:0;">';
    html += '<svg viewBox="0 0 512 512" width="28" height="28" fill="currentColor"><path d="M256 36C134.497 36 36 134.497 36 256C36 377.503 134.497 476 256 476C330.185 476 395.816 439.298 435.691 383.105C411.519 401.181 381.471 411.9 348.9 411.9C268.819 411.9 203.9 346.981 203.9 266.9C203.9 186.819 268.819 121.9 348.9 121.9C381.471 121.9 411.519 132.619 435.691 150.695C395.816 94.502 330.185 36 256 36ZM372 204C364.268 204 358 210.268 358 218V316C358 323.732 364.268 330 372 330C379.732 330 386 323.732 386 316V218C386 210.268 379.732 204 372 204ZM424 176C416.268 176 410 182.268 410 190V344C410 351.732 416.268 358 424 358C431.732 358 438 351.732 438 344V190C438 182.268 431.732 176 424 176ZM320 236C312.268 236 306 242.268 306 250V284C306 291.732 312.268 298 320 298C327.732 298 334 291.732 334 284V250C334 242.268 327.732 236 320 236Z"/></svg>';
    html += '</div>';
    html += '<div style="flex:1;min-width:0;">';
    html += '<div style="font-weight:700;font-size:18px;letter-spacing:-0.3px;">' + title + '</div>';
    html += '<div style="font-size:13px;opacity:0.75;">' + subtitle + '</div>';
    html += '</div></div>';
    html += '<div style="overflow-y:auto;max-height:48vh;padding:16px;background:rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.06);border-radius:20px;font-size:13px;color:#D4D4D8;line-height:1.5;">' + renderMarkdown(update.notes) + '</div>';
    html += '<div id="eclipse-upd-progress-wrap" style="display:none;flex-direction:column;gap:6px;">';
    html += '<div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.8;"><span id="eclipse-upd-status-text">Downloading update&hellip;</span><span id="eclipse-upd-pct-text">0%</span></div>';
    html += '<div style="height:6px;width:100%;background:rgba(255,255,255,0.12);border-radius:3px;overflow:hidden;"><div id="eclipse-upd-bar" style="height:100%;width:0%;background:' + (isBlocked ? '#EF4444' : 'var(--md-sys-color-primary,#B69DF8)') + ';transition:width 0.2s ease;"></div></div>';
    html += '</div>';
    html += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">';
    if (!isChangelogOnly && !isBlocked && !isMandatory) {
      html += '<button type="button" id="eclipse-upd-later" style="padding:11px 20px;border-radius:999px;background:rgba(255,255,255,0.08);color:#D4D4D8;font-weight:600;font-size:13px;cursor:pointer;border:none;">Later</button>';
    }
    html += '<button type="button" id="eclipse-upd-go" style="padding:11px 22px;border-radius:999px;background:' + (isBlocked ? '#EF4444' : 'var(--md-sys-color-primary,#B69DF8)') + ';color:' + (isBlocked ? '#fff' : '#121214') + ';font-weight:700;font-size:13px;cursor:pointer;border:none;">' + actionBtnText + '</button>';
    html += '</div></div>';
    modalEl.innerHTML = html;
    document.body.appendChild(modalEl);

    const laterBtn = modalEl.querySelector('#eclipse-upd-later');
    if (laterBtn) {
      laterBtn.addEventListener('click', () => {
        store.set('eclipse_update_snooze', { ver: update.version, until: Date.now() + SNOOZE });
        modalEl.remove();
        modalEl = null;
      });
    }

    const goBtn = modalEl.querySelector('#eclipse-upd-go');
    goBtn.addEventListener('click', async () => {
      if (isChangelogOnly || isNoSafeTarget) {
        modalEl.remove();
        modalEl = null;
        return;
      }

      // Check if playback is active
      if (window.EclipseNative && typeof window.EclipseNative.isPlaybackRunning === 'function') {
        const pb = await window.EclipseNative.isPlaybackRunning();
        if (pb && pb.running) {
          const proceed = confirm('Nhạc đang phát. Bạn có muốn tạm dừng nhạc để tiếp tục cài đặt bản cập nhật không?');
          if (!proceed) return;
          const audio = document.querySelector('audio');
          if (audio) audio.pause();
        }
      }

      // Persist state before update
      persistPlaybackState();

      const progWrap = modalEl.querySelector('#eclipse-upd-progress-wrap');
      const bar = modalEl.querySelector('#eclipse-upd-bar');
      const statusTxt = modalEl.querySelector('#eclipse-upd-status-text');
      const pctTxt = modalEl.querySelector('#eclipse-upd-pct-text');

      if (window.EclipseNative && typeof window.EclipseNative.downloadAndInstall === 'function' && String(update.url || '').endsWith('.apk')) {
        goBtn.disabled = true;
        goBtn.style.opacity = '0.5';
        if (laterBtn) laterBtn.style.display = 'none';
        progWrap.style.display = 'flex';

        window.EclipseNative.downloadAndInstall(update.url, (p) => {
          const pct = Math.max(0, Math.min(100, (p && p.percent) || 0));
          if (bar) bar.style.width = pct + '%';
          if (pctTxt) pctTxt.textContent = pct + '%';
          if (pct >= 100 && statusTxt) statusTxt.textContent = 'Verifying APK security & launching...';
        }).catch((err) => {
          const errMsg = String((err && err.message) || err || '');
          if (errMsg.includes('PERMISSION_NEEDED')) {
            if (statusTxt) statusTxt.textContent = 'Cần cấp quyền Cài đặt ứng dụng không rõ nguồn, sau đó bấm Tải lại';
          } else if (errMsg.includes('PLAYBACK_ACTIVE')) {
            if (statusTxt) statusTxt.textContent = 'Vui lòng dừng phát nhạc trước khi cài đặt.';
          } else {
            openExternal(update.url);
          }
          goBtn.disabled = false;
          goBtn.style.opacity = '1';
          if (laterBtn) laterBtn.style.display = 'inline-block';
        });
      } else {
        openExternal(update.url);
        modalEl.remove();
        modalEl = null;
      }
    });
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
    if (manual) setStatus('Checking updates...');
    const manifest = await fetchManifest();
    if (!manifest) {
      if (manual) setStatus("Couldn't reach update server, try again later");
      return;
    }
    store.set('eclipse_update_last', Date.now());

    // 1. Check if current version is in blocked list
    const blockedList = Array.isArray(manifest.blocked) ? manifest.blocked : [];
    const isCurrentBlocked = blockedList.includes(CURRENT_VER);
    const isTargetBlocked = blockedList.includes(manifest.version);

    // Case: Both current and target versions are blocked -> no safe target
    if (isCurrentBlocked && isTargetBlocked) {
      setStatus('Bản vá đang được chuẩn bị');
      showUpdateModal({
        version: CURRENT_VER,
        notes: '### Cảnh Báo Bản Thu Hồi\n\nPhiên bản hiện tại gặp lỗi nghiêm trọng đã bị thu hồi. Bản vá đang được chuẩn bị, vui lòng quay lại sau.',
        page: manifest.page || ('https://github.com/' + REPO + '/releases')
      }, { isNoSafeTarget: true });
      return;
    }

    // Case 1: Current version is revoked/blocked
    if (isCurrentBlocked) {
      setStatus('Phiên bản v' + CURRENT_VER + ' bị thu hồi');
      showUpdateModal({
        version: manifest.version,
        notes: '### Cảnh Báo Bản Thu Hồi\nPhiên bản hiện tại gặp lỗi nghiêm trọng đã bị thu hồi. Vui lòng cập nhật bản vá ngay.',
        url: manifest.url,
        page: manifest.page
      }, { isBlocked: true });
      return;
    }

    // 2. Check if current version is below minSupported
    if (manifest.minSupported && isNewerVer(manifest.minSupported, CURRENT_VER)) {
      setStatus('Bản v' + CURRENT_VER + ' hết hạn hỗ trợ');
      showUpdateModal({
        version: manifest.version,
        notes: '### Yêu Cầu Cập Nhật\nPhiên bản hiện tại đã ngừng hỗ trợ. Vui lòng nâng cấp lên phiên bản mới nhất.',
        url: manifest.url,
        page: manifest.page
      }, { isMandatory: true });
      return;
    }

    // 3. Target version in blocked list guard
    if (isTargetBlocked) {
      setStatus("You're up to date (v" + CURRENT_VER + ')');
      return;
    }

    // 4. Normal update check
    if (manifest.version && isNewerVer(manifest.version, CURRENT_VER)) {
      current = {
        version: manifest.version,
        notes: manifest.notes || '',
        url: manifest.url,
        page: manifest.page || ('https://github.com/' + REPO + '/releases/latest')
      };
      setStatus('Eclipse v' + current.version + ' is available', current);
      showUpdateModal(current);
    } else {
      setStatus("You're up to date (v" + CURRENT_VER + ')');
    }
  }

  if (checkBtn) checkBtn.addEventListener('click', () => (current ? showUpdateModal(current) : check(true)));
  if (statusEl) setStatus('Eclipse v' + CURRENT_VER + ' &bull; Checks for updates automatically');

  // "Just Updated" modal on fresh launch
  const lastSeenVer = store.get('eclipse_last_seen_version');
  if (lastSeenVer && isNewerVer(CURRENT_VER, lastSeenVer)) {
    store.set('eclipse_last_seen_version', CURRENT_VER);
    showUpdateModal({
      version: CURRENT_VER,
      notes: '### Cập nhật thành công v' + CURRENT_VER + '\nChào mừng bạn đến với phiên bản mới nhất của Eclipse!',
      page: 'https://github.com/' + REPO + '/releases/latest'
    }, { isChangelogOnly: true });
  } else if (!lastSeenVer) {
    store.set('eclipse_last_seen_version', CURRENT_VER);
  }

  setTimeout(() => check(false), 2000);

  // Resume check with 3h throttle to save battery and rate limits
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      const last = store.get('eclipse_update_last') || 0;
      if (Date.now() - last > CHECK_MIN_INTERVAL) check(false);
    }
  });

  window.EclipseUpdates = { check: () => check(true) };
})();