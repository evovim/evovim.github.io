(() => {
  'use strict';

  const id = document.currentScript.dataset.measurementId;
  if (location.hostname !== 'evovim.github.io' || !/^G-[A-Z0-9]+$/.test(id)) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;

  const sources = {
    github: ['github.com'],
    arxiv: ['arxiv.org'],
    scholar: ['scholar.google.com', 'scholar.google.com.hk', 'scholar.google.co.uk'],
    google: ['google.com', 'google.com.hk', 'google.co.uk', 'google.de', 'google.fr', 'google.co.jp'],
    bing: ['bing.com'],
    duckduckgo: ['duckduckgo.com'],
    baidu: ['baidu.com'],
    x: ['x.com', 'twitter.com', 't.co'],
    linkedin: ['linkedin.com', 'lnkd.in'],
    bluesky: ['bsky.app'],
    wechat: ['weixin.qq.com'],
    reddit: ['reddit.com'],
    huggingface: ['huggingface.co'],
    newsletter: []
  };
  function visitSource() {
    const tag = new URLSearchParams(location.search).get('utm_source')?.toLowerCase();
    if (Object.hasOwn(sources, tag)) return tag;
    const aliases = new Map([['twitter', 'x'], ['bsky', 'bluesky'], ['weixin', 'wechat'], ['google_scholar', 'scholar']]);
    if (aliases.has(tag)) return aliases.get(tag);
    if (!document.referrer) return tag ? 'other_campaign' : 'direct';
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === location.origin) return 'internal';
      for (const [group, domains] of Object.entries(sources)) {
        if (domains.some(domain => ref.hostname === domain || ref.hostname.endsWith('.' + domain))) return group;
      }
    } catch { /* Treat non-web referrers as other referrals. */ }
    return 'other_referral';
  }

  const notice = document.getElementById('analytics-notice');
  const settings = document.getElementById('analytics-settings');
  const allow = notice.querySelector('[data-consent="allow"]');
  const decline = notice.querySelector('[data-consent="decline"]');
  const key = 'evovim-analytics-choice-v1';
  const denied = {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
  const source = visitSource();
  const isDebug = new URLSearchParams(location.search).get('analytics_debug') === '1';
  const testParameters = isDebug ? {debug_mode: true, traffic_type: 'developer'} : {};
  let loaded = false, sentView = false, choice;
  try { choice = localStorage.getItem(key); } catch { /* Storage is optional. */ }
  settings.hidden = false;
  notice.hidden = choice === 'allow' || choice === 'decline';

  function tag() {
    window.dataLayer.push(arguments);
  }

  function start() {
    if (choice !== 'allow') return;
    window['ga-disable-' + id] = false;
    if (!loaded) {
      loaded = true;
      window.dataLayer = window.dataLayer || [];
      tag('consent', 'default', {...denied, analytics_storage: 'granted'});
      // All events share the canonical page. The referrer category is sent separately.
      tag('set', {
        ...testParameters,
        page_location: 'https://evovim.github.io/', page_referrer: '',
        allow_ad_personalization_signals: false, allow_google_signals: false,
        send_page_view: false, cookie_expires: 86400, cookie_update: false,
        cookie_flags: 'SameSite=Lax;Secure;Max-Age=86400'
      });
      tag('js', new Date());
      const config = {
        send_page_view: false, cookie_domain: 'evovim.github.io'
      };
      tag('config', id, {...config, ...testParameters});
      const script = document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
      document.head.append(script);
    } else {
      tag('consent', 'update', {...denied, analytics_storage: 'granted'});
    }
    if (!sentView) {
      sentView = true;
      send('page_view');
      send('visit_' + source);
    }
  }

  function stop() {
    window['ga-disable-' + id] = true;
    if (loaded) tag('consent', 'update', denied);
    const names = ['_ga', '_ga_' + id.slice(2)];
    for (const name of names) {
      document.cookie = name + '=; Max-Age=0; Path=/';
      document.cookie = name + '=; Max-Age=0; Path=/; Domain=evovim.github.io';
    }
  }

  function apply(value) {
    choice = value;
    notice.hidden = value === 'allow' || value === 'decline';
    if (value === 'allow') start();
    else stop();
  }

  settings.addEventListener('click', () => {
    notice.hidden = false;
    (choice === 'allow' ? allow : decline).focus();
  });
  for (const button of [allow, decline]) {
    button.addEventListener('click', () => {
      try { localStorage.setItem(key, button.dataset.consent); } catch { /* Keep this page's choice. */ }
      apply(button.dataset.consent);
      if (settings.getBoundingClientRect().top < innerHeight) settings.focus({preventScroll: true});
    });
  }
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });

  // An exercise or milestone counts at most once during this page visit.
  const recorded = new Set();
  function send(name) {
    if (choice === 'allow' && loaded) tag('event', name, {send_to: id, ...testParameters});
  }
  function record(name) {
    if (choice !== 'allow' || !loaded || recorded.has(name)) return;
    recorded.add(name);
    send(name);
  }

  const demos = new Set(['apollo', 'monet', 'kitchen', 'dmv-hard', 'poster-maze', 'card-matching', 'tetris']);
  const actions = new Set(['start', 'complete', 'reveal']);
  window.EvoViMMetrics = {
    copiedInstall() { send('install_command_copy'); },
    demo(id, action) {
      if (!demos.has(id) || !actions.has(action)) return;
      const prefix = 'demo_' + id.replaceAll('-', '_') + '_';
      if (action === 'complete') record(prefix + 'start');
      record(prefix + action);
    }
  };

  for (const link of document.querySelectorAll('a[data-site-action]')) {
    const name = link.dataset.siteAction;
    if (!['github_hero_click', 'github_install_click', 'download_wheel_click', 'download_sdist_click'].includes(name)) continue;
    link.addEventListener('click', () => send(name));
    link.addEventListener('auxclick', event => { if (event.button === 1) send(name); });
  }

  if (choice === 'allow') start();
  const film = document.getElementById('environment-film');
  if (!film) return;
  film.addEventListener('playing', () => record('video_play'));
  function recordProgress() {
    if (choice !== 'allow' || !Number.isFinite(film.duration) || film.duration <= 0) return;
    const ranges = film.played;
    let watched = 0;
    for (let i = 0; i < ranges.length; i++) watched += ranges.end(i) - ranges.start(i);
    // The visitor can allow analytics while the film is already playing.
    if (!film.paused && !film.seeking && watched > 0) record('video_play');
    if (!recorded.has('video_play')) return;
    if (watched >= 30) record('video_30s');
    if (watched >= film.duration / 2) record('video_half');
    if (film.ended && watched >= film.duration * 0.95) record('video_complete');
  }
  film.addEventListener('timeupdate', recordProgress);
  film.addEventListener('ended', recordProgress);
})();
