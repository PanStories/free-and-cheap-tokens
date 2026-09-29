// Free and Cheap Tokens — 客户端脚本
// 零外部依赖；渐进增强；离线可用
// Bilingual: 文案由生成器决定，client 仅做筛选 / 分享 / 错误上报
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const search = $('#search');
  const regionSel = $('#filter-region');
  const diffSel = $('#filter-difficulty');
  const noCard = $('#filter-no-card');
  const reset = $('#reset-btn');
  const cards = $$('.card');
  const shareBtn = $('#share-btn');

  function applyFilters() {
    const q = (search.value || '').trim().toLowerCase();
    const region = regionSel.value;
    const diff = diffSel.value;
    const noCardOnly = noCard.checked;

    let visible = 0;
    for (const card of cards) {
      const haystack = (card.textContent || '').toLowerCase();
      const matchQ = !q || haystack.includes(q);
      const matchRegion =
        !region ||
        (region === 'global' && card.dataset.regionAvailability === 'global') ||
        card.dataset.provider === '' ||
        card.textContent.includes(region);
      const matchDiff = !diff || card.dataset.difficulty === diff;
      const matchNoCard = !noCardOnly || card.dataset.needsCard === '0';
      const show = matchQ && matchRegion && matchDiff && matchNoCard;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    }
    return visible;
  }

  if (search) search.addEventListener('input', applyFilters);
  if (regionSel) regionSel.addEventListener('change', applyFilters);
  if (diffSel) diffSel.addEventListener('change', applyFilters);
  if (noCard) noCard.addEventListener('change', applyFilters);
  if (reset)
    reset.addEventListener('click', () => {
      search.value = '';
      regionSel.value = '';
      diffSel.value = '';
      noCard.checked = false;
      applyFilters();
    });

  // 分享（含项目透明度声明 + 日期戳）
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const isEn = document.documentElement.lang === 'en';
      const today = new Date().toISOString().slice(0, 10);
      const text = isEn
        ? 'Free AI tier catalog · Verified ' + today +
          '\nNo paid placements, no affiliate links. Each entry links straight to the vendor.\n'
        : '免费 AI 额度清单 · 数据核实于 ' + today +
          '\n本站不接硬广、不挂联盟，每条 promo 直达厂商官方页面。\n';
      const shareUrl = location.href.split('?')[0] + '?ref=share&d=' + today;

      try {
        if (navigator.share) {
          await navigator.share({ title: 'Free and Cheap Tokens', text: text + shareUrl, url: location.href });
        } else {
          await navigator.clipboard.writeText(text + shareUrl);
          shareBtn.textContent = isEn ? 'Share text copied' : '已复制分享文案';
          setTimeout(() => {
            shareBtn.textContent = isEn ? "Share today's list" : '分享今日清单';
          }, 1500);
        }
      } catch (_) {
        /* 用户取消 */
      }
    });
  }

  // 报告数据错误
  for (const link of $$('.report-link')) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.dataset.report;
      const url =
        'https://github.com/PanStories/free-and-cheap-tokens/issues/new?title=' +
        encodeURIComponent('[data-issue] ' + id) +
        '&labels=data-issue';
      window.open(url, '_blank', 'noopener');
    });
  }
})();
