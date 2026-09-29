// Free and Cheap Tokens — 客户端脚本
// 零外部依赖；渐进增强；语言默认英文，切换状态记在 localStorage
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var STORE_KEY = 'fact-lang';

  function applyLangTexts(lang) {
    var key = lang === 'zh' ? 'zh' : 'en';
    $$('[data-en][data-zh]').forEach(function (el) {
      var v = el.getAttribute('data-' + key);
      if (!v) return;
      if (el.tagName === 'OPTION') { el.textContent = v; return; }
      if (el.tagName === 'INPUT' && (el.type === 'search' || el.type === 'text')) { el.placeholder = v; return; }
      el.setAttribute('aria-label', v);
    });
  }

  window.setLang = function (lang) {
    var isZh = lang === 'zh';
    document.documentElement.lang = isZh ? 'zh-CN' : 'en';
    $$('.lang-en').forEach(function (el) { el.classList.toggle('hidden', isZh); });
    $$('.lang-zh').forEach(function (el) { el.classList.toggle('hidden', !isZh); });
    var enBtn = $('#enBtn');
    var zhBtn = $('#zhBtn');
    if (enBtn) enBtn.classList.toggle('active', !isZh);
    if (zhBtn) zhBtn.classList.toggle('active', isZh);
    applyLangTexts(isZh ? 'zh' : 'en');
    try { localStorage.setItem(STORE_KEY, isZh ? 'zh' : 'en'); } catch (e) { /* private mode */ }
  };

  // 默认英文；只有显式选过中文才切过去
  var saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* ignore */ }
  if (saved === 'zh') { window.setLang('zh'); } else { applyLangTexts('en'); }

  // Tabs (remote / local)
  $$('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-panel');
      $$('.tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
      $$('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + target); });
    });
  });

  // Copy buttons
  $$('.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('data-copy'));
      if (!panel) return;
      var text = (panel.querySelector('pre') || panel).textContent || '';
      var original = btn.textContent;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = original; }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { /* ignore */ });
      }
    });
  });

  // Filters
  var search = $('#search');
  var regionSel = $('#filter-region');
  var diffSel = $('#filter-difficulty');
  var noCard = $('#filter-no-card');
  var reset = $('#reset-btn');
  var cards = $$('.card');
  var emptyState = $('#empty-state');

  function applyFilters() {
    var q = (search && search.value ? search.value : '').trim().toLowerCase();
    var region = regionSel ? regionSel.value : '';
    var diff = diffSel ? diffSel.value : '';
    var noCardOnly = noCard ? noCard.checked : false;
    var visible = 0;
    cards.forEach(function (card) {
      var text = (card.textContent || '').toLowerCase();
      var matchQ = !q || text.indexOf(q) !== -1;
      var matchRegion = !region || (region === 'global' && card.dataset.regionAvailability === 'global') || text.indexOf(region.toLowerCase()) !== -1;
      var matchDiff = !diff || card.dataset.difficulty === diff;
      var matchNoCard = !noCardOnly || card.dataset.needsCard === '0';
      var show = matchQ && matchRegion && matchDiff && matchNoCard;
      card.classList.toggle('hidden', !show);
      if (show) visible++;
    });
    if (emptyState) emptyState.classList.toggle('hidden', visible !== 0);
  }

  if (search) search.addEventListener('input', applyFilters);
  if (regionSel) regionSel.addEventListener('change', applyFilters);
  if (diffSel) diffSel.addEventListener('change', applyFilters);
  if (noCard) noCard.addEventListener('change', applyFilters);
  if (reset) {
    reset.addEventListener('click', function () {
      if (search) search.value = '';
      if (regionSel) regionSel.value = '';
      if (diffSel) diffSel.value = '';
      if (noCard) noCard.checked = false;
      applyFilters();
    });
  }

  // Share
  var shareBtn = $('#share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var isEn = document.documentElement.lang !== 'zh-CN';
      var today = new Date().toISOString().slice(0, 10);
      var text = isEn
        ? 'Free AI tier catalog · Verified ' + today + '\nNo paid placements, no affiliate links. Each entry links straight to the vendor.\n'
        : '免费 AI 额度清单 · 数据核实于 ' + today + '\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\n';
      var shareUrl = location.href.split('?')[0] + '?ref=share&d=' + today;
      var restore = function () {
        shareBtn.textContent = isEn ? "Share today's list" : '分享今日清单';
      };
      if (navigator.share) {
        navigator.share({ title: 'Free and Cheap Tokens', text: text + shareUrl, url: location.href }).catch(function () { /* user cancelled */ });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + shareUrl).then(function () {
          shareBtn.textContent = isEn ? 'Share text copied' : '已复制分享文案';
          setTimeout(restore, 1500);
        }, function () { /* ignore */ });
      }
    });
  }

  // Report data issue
  $$('.report-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var id = link.getAttribute('data-report');
      var url = 'https://github.com/PanStories/free-and-cheap-tokens/issues/new?title=' +
        encodeURIComponent('[data-issue] ' + id) + '&labels=data-issue';
      window.open(url, '_blank', 'noopener');
    });
  });
})();
