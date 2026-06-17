import { api } from './api.js';

const state = {
  catalog: [],
  recoMeta: {},
  selected: new Map(),
  applied: new Set(),
  analysis: null,
  phase: 1,
  profileId: null,
  user: null,
};

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 2800);
}

function devicePayload() {
  return [...state.selected.entries()].map(([id, d]) => ({
    device_id: id,
    hours: d.h,
  }));
}

function costPreview(d) {
  const kwh = (d.w / 1000) * d.h * 30;
  return (kwh * 2.4).toFixed(0);
}

function setStep(n) {
  ['st0', 'st1', 'st2'].forEach((id, i) => {
    const e = $(id);
    e.classList.remove('cur', 'done');
    if (i < n) e.classList.add('done');
    if (i === n) e.classList.add('cur');
  });
}

function showPhase(n) {
  state.phase = n;
  $('wrap').classList.toggle('wide', n === 3);
  document.querySelectorAll('.phase').forEach((p) => p.classList.remove('active'));
  $(`p${n}`).classList.add('active');
  setStep(n - 1);
}

function renderPicker() {
  $('picker').innerHTML = state.catalog
    .map(
      (c) => `
    <div class="pick ${state.selected.has(c.id) ? 'on' : ''}" data-id="${c.id}">
      <div class="ic">${c.icon}</div><div class="nm">${c.name}</div>
      <div class="def">${c.w}W tipik</div>
    </div>`
    )
    .join('');
  $('picker').querySelectorAll('.pick').forEach((el) => {
    el.onclick = () => togglePick(el.dataset.id);
  });
  $('toP2').disabled = state.selected.size === 0;
}

function togglePick(id) {
  const c = state.catalog.find((x) => x.id === id);
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.set(id, { ...c, h: c.h });
  renderPicker();
}

function renderDevlist() {
  const list = $('devlist');
  list.innerHTML = '';
  state.selected.forEach((d, id) => {
    const el = document.createElement('div');
    el.className = 'dev';
    el.innerHTML = `
      <div class="ic">${d.icon}</div>
      <div>
        <div class="nm">${d.name}</div>
        <div class="meta">${d.w}W · günde <b id="hl-${id}">${d.h}</b> saat</div>
        <input type="range" min="0.5" max="${d.max_hours || 12}" step="0.5" value="${d.h}" data-id="${id}">
      </div>
      <div class="cost"><b id="co-${id}">${costPreview(d)}</b><span style="font-size:10px;color:var(--muted)">TL/ay</span></div>`;
    list.appendChild(el);
    el.querySelector('input').oninput = (e) => setHours(id, e.target.value);
  });
}

function setHours(id, val) {
  const d = state.selected.get(id);
  d.h = parseFloat(val);
  state.selected.set(id, d);
  $('hl-' + id).textContent = d.h;
  $('co-' + id).textContent = costPreview(d);
}

async function fetchAnalysis() {
  if (!state.selected.size) return null;
  const data = await api.analyze(devicePayload(), [...state.applied]);
  state.analysis = data;
  return data;
}

function renderDashboard(data) {
  const s = data.summary;
  $('vTL').textContent = Math.round(s.total_tl);
  $('vKwh').textContent = Math.round(s.total_kwh);
  $('vPot').textContent = Math.round(s.potential_tl);
  $('vCo2').textContent = Math.round(s.co2_kg);
  $('vScore').textContent = s.score;
  $('vYear').textContent = Math.round(s.annual_potential_tl);
  $('vScoreD').textContent = s.score_diff_label;
  $('vScoreD').className = 'd ' + s.score_diff_direction;
  $('benchPill').textContent = s.bench_label;

  const stops = data.donut_stops.map((x) => `${x.color} ${x.start}deg ${x.end}deg`).join(',');
  $('donut').style.background = `conic-gradient(${stops})`;
  $('donutTL').textContent = Math.round(s.total_tl);

  $('legend').innerHTML = data.chart
    .slice(0, 5)
    .map(
      (x) => `
    <div><span class="left"><span class="sw" style="background:${x.color}"></span>${x.icon} ${x.name}</span>
    <b>${Math.round(x.pct)}%</b></div>`
    )
    .join('');

  const maxC = data.chart[0]?.cost || 1;
  $('barChart').innerHTML = data.chart
    .map(
      (x) => `
    <div class="bar-row">
      <span class="nm">${x.icon} ${x.name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(x.cost / maxC) * 100}%;background:${x.color}"></div></div>
      <span class="val">${Math.round(x.cost)}₺</span>
    </div>`
    )
    .join('');

  $('ringVal').textContent = s.score;
  $('ring').style.background = `conic-gradient(${s.ring_color} ${s.score * 3.6}deg,#272c35 0deg)`;
  $('scoreLbl').textContent = s.score_label;
  $('badgeRow').innerHTML = data.badges.map((b) => `<span class="bge">${b.text}</span>`).join('');

  $('recos').innerHTML =
    data.recommendations
      .map((r) => {
        const m = r.meta;
        const on = state.applied.has(r.id);
        return `
      <div class="reco ${on ? 'on' : ''}" data-id="${r.id}">
        <div class="chk">${on ? '✓' : ''}</div>
        <div class="ric">${m.icon}</div>
        <div class="body">
          <div class="t">${r.title} <span class="badge ${m.badge}">${m.badge_t}</span></div>
          <div class="d">${m.desc}</div>
          <div class="impact"><i style="width:${r.pct}%"></i></div>
        </div>
        <div class="save"><b>${Math.round(r.save)}</b><span>TL/ay</span></div>
      </div>`;
      })
      .join('') || '<p style="color:var(--muted);font-size:13px">Daha fazla cihaz ekleyince öneriler artar.</p>';

  $('recos').querySelectorAll('.reco').forEach((el) => {
    el.onclick = () => toggleReco(el.dataset.id);
  });

  renderSim(data.simulation);
}

function renderSim(sim) {
  $('simBefore').textContent = Math.round(sim.before_tl);
  $('simAfter').textContent = Math.round(sim.after_tl);
  if (sim.saved_tl > 0) {
    $('simDelta').innerHTML = `<b>${Math.round(sim.saved_tl)} TL/ay</b> · <b>${Math.round(sim.annual_saved_tl)} TL/yıl</b> tasarruf · Fatura <b>%${Math.round(sim.pct_reduction)}</b> düştü`;
  } else {
    $('simDelta').textContent = 'Öneri seç — fark burada görünür';
  }
}

async function toggleReco(id) {
  if (state.applied.has(id)) state.applied.delete(id);
  else state.applied.add(id);
  const data = await fetchAnalysis();
  renderDashboard(data);
}

async function goPhase3() {
  $('wrap').classList.add('loading');
  try {
    state.applied.clear();
    showPhase(3);
    const data = await fetchAnalysis();
    renderDashboard(data);
  } catch (e) {
    toast('Analiz hatası: ' + e.message);
    showPhase(2);
  } finally {
    $('wrap').classList.remove('loading');
  }
}

function resetAll() {
  state.selected.clear();
  state.applied.clear();
  state.analysis = null;
  showPhase(1);
  renderPicker();
}

async function saveProfile() {
  if (!state.selected.size) return toast('Önce cihaz seç');
  try {
    const body = {
      name: 'Evim',
      devices: devicePayload(),
      applied_reco_ids: [...state.applied],
    };
    let profile;
    if (state.profileId) profile = await api.updateProfile(state.profileId, body);
    else {
      profile = await api.saveProfile(body);
      state.profileId = profile.id;
    }
    toast('Profil kaydedildi #' + profile.id);
  } catch (e) {
    toast('Kayıt hatası: ' + e.message);
  }
}

async function executiveTour() {
  resetAll();
  const ids = ['ac', 'water', 'tv', 'light'];
  for (const id of ids) {
    const c = state.catalog.find((x) => x.id === id);
    if (!c) continue;
    state.selected.set(id, { ...c, h: id === 'ac' ? 6 : c.h });
    renderPicker();
    await sleep(350);
  }
  showPhase(2);
  renderDevlist();
  await sleep(500);
  if (state.selected.has('ac')) setHours('ac', 6);
  await sleep(800);
  await goPhase3();
  await sleep(1200);
  const water = state.analysis?.recommendations?.find((r) => r.id === 'sh-water');
  if (water) await toggleReco('sh-water');
}

function bindUI() {
  $('toP2').onclick = () => {
    showPhase(2);
    renderDevlist();
  };
  $('btnP1Back')?.remove;
  $('btnAnalyze').onclick = goPhase3;
  $('btnP2Back').onclick = () => showPhase(1);
  $('btnP3Back').onclick = () => {
    showPhase(2);
    renderDevlist();
  };
  $('btnReset').onclick = resetAll;
  $('btnTour').onclick = executiveTour;
  $('btnTour2').onclick = executiveTour;
  $('btnSave').onclick = saveProfile;
  $('btnAuth').onclick = () => $('authModal').classList.add('on');
  $('btnAuthClose').onclick = () => $('authModal').classList.remove('on');
  $('btnLogin').onclick = async () => {
    try {
      const email = $('authEmail').value;
      const password = $('authPass').value;
      const { access_token } = await api.login(email, password);
      api.setToken(access_token);
      state.user = await api.me();
      $('authModal').classList.remove('on');
      const lbl = $('userLabel');
      lbl.textContent = state.user.name || state.user.email;
      lbl.style.display = 'inline-block';
      toast('Giriş başarılı');
    } catch (e) {
      toast(e.message);
    }
  };
  $('btnRegister').onclick = async () => {
    try {
      const email = $('authEmail').value;
      const password = $('authPass').value;
      const { access_token } = await api.register(email, password, 'Kullanıcı');
      api.setToken(access_token);
      state.user = await api.me();
      $('authModal').classList.remove('on');
      const lbl = $('userLabel');
      lbl.textContent = state.user.email;
      lbl.style.display = 'inline-block';
      toast('Hesap oluşturuldu');
    } catch (e) {
      toast(e.message);
    }
  };

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input')) return;
    if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      executiveTour();
    }
    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      resetAll();
    }
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
  });
}

async function init() {
  bindUI();
  try {
    const health = await api.health();
    $('apiStatus').textContent = 'API ' + health.version;
    $('apiStatus').classList.add('ok');
    const cat = await api.catalog();
    state.catalog = cat.devices;
    state.recoMeta = cat.reco_meta;
    if (api.getToken()) {
      try {
      state.user = await api.me();
      const lbl = $('userLabel');
      lbl.textContent = state.user.name || state.user.email;
      lbl.style.display = 'inline-block';
      } catch {
        api.setToken(null);
      }
    }
    renderPicker();
  } catch (e) {
    $('apiStatus').textContent = 'API bağlantısı yok';
    $('apiStatus').classList.add('err');
    toast('Backend çalışmıyor — ./run.sh ile başlat');
  }
}

init();
