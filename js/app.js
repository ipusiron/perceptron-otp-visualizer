// Perceptron OTP Visualizer の画面（DOM の処理だけ。計算は potp-core.js、文言は messages.js）
(() => {
  'use strict';

  const C = globalThis.PotpCore;
  const I = globalThis.PotpI18n;
  const Theme = globalThis.PotpTheme;
  const M = globalThis.PotpMessages;
  const t = (key, vars) => M.t(key, vars);
  const $ = (id) => document.getElementById(id);

  // 画面に出す数（負の数はマイナス記号 U+2212 で。表の見出しの「−a」とそろえる）
  const num = (x) => x.toFixed(1).replace('-', '−');
  const setText = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };

  // ---- タブ（WAI-ARIA APG: 矢印キー・Home・End、選ぶとすぐ表示、選んでいるタブだけ tabindex=0） ----
  const TABS = ['nand', 'gates', 'xor', 'otp', 'glossary'];

  function selectTab(name, focus) {
    for (const n of TABS) {
      const on = n === name;
      const tab = $(`tab-${n}`);
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.toggle('active', on);
      $(`panel-${n}`).hidden = !on;
    }
    if (focus) $(`tab-${name}`).focus();
  }

  function initTabs() {
    for (const n of TABS) {
      const tab = $(`tab-${n}`);
      tab.addEventListener('click', () => selectTab(n, false));
      tab.addEventListener('keydown', (e) => {
        const i = TABS.indexOf(n);
        const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        selectTab(TABS[(next + TABS.length) % TABS.length], true);
      });
    }
  }

  // ---- 真理値表の行を選ぶと、図の値を計算部で計算して出す ----
  const GATE_VIEWS = {
    not: ([a]) => {
      setText('not-value-a1', `a=${a}`);
      setText('not-value-a2', `a=${a}`);
      setText('not-value-z', `z=${C.nandNot(a).z}`);
    },
    and: ([a, b]) => {
      const r = C.nandAnd(a, b);
      setText('and-value-a', `a=${a}`);
      setText('and-value-b', `b=${b}`);
      setText('and-value-t', `t=${r.t}`);
      setText('and-value-z', `z=${r.z}`);
    },
    or: ([a, b]) => {
      const r = C.nandOr(a, b);
      setText('or-value-a', `a=${a}`);
      setText('or-value-b', `b=${b}`);
      setText('or-value-t', `t=${r.t}`);
      setText('or-value-s', `s=${r.s}`);
      setText('or-value-z', `z=${r.z}`);
    },
    xor: ([a, b]) => {
      const r = C.nandXor(a, b);
      setText('xor-value-a', `a=${a}`);
      setText('xor-value-b', `b=${b}`);
      setText('xor-value-s', `s=${r.s}`);
      setText('xor-value-t', `t=${r.t}`);
      setText('xor-value-u', `u=${r.u}`);
      setText('xor-value-z', `z=${r.z}`);
    },
    'mlp-xor': ([a, b]) => {
      const r = C.mlpXor(a, b);
      setText('mlp-xor-value-a', `a=${a}`);
      setText('mlp-xor-value-b', `b=${b}`);
      setText('mlp-or-sum', `s1=${num(r.h1.s)}`);
      setText('mlp-or-output', `h1=${r.h1.y}`);
      setText('mlp-nand-sum', `s2=${num(r.h2.s)}`);
      setText('mlp-nand-output', `h2=${r.h2.y}`);
      setText('mlp-and-sum', `s3=${num(r.out.s)}`);
      setText('mlp-and-output', `z=${r.y}`);
      setText('mlp-xor-value-or', `OR=${r.h1.y}`);
      setText('mlp-xor-value-nand', `NAND=${r.h2.y}`);
      setText('mlp-xor-value-z', `XOR=${r.y}`);
    }
  };
  // 単層パーセプトロン（p-not・p-and・p-or・p-nand）は同じ形
  for (const name of C.GATES) {
    const id = `p-${name.toLowerCase()}`;
    GATE_VIEWS[id] = ([a, b]) => {
      const r = C.gate(name, a, b);
      setText(`${id}-value-a`, `a=${a}`);
      if (name !== 'NOT') setText(`${id}-value-b`, `b=${b}`);
      setText(`${id}-sum`, `s=${num(r.s)}`);
      setText(`${id}-output`, `z=${r.y}`);
      setText(`${id}-value-z`, `z=${r.y}`);
    };
  }

  // 表の中で選んでいる行だけ tabindex=0（表ごとに Tab で1回止まり、上下の矢印キーで行を移る）
  function selectRow(table, row, focus) {
    const rows = [...table.tBodies[0].rows];
    for (const r of rows) {
      const on = r === row;
      r.classList.toggle('highlighted', on);
      r.tabIndex = on ? 0 : -1;
      if (on) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    }
    GATE_VIEWS[table.dataset.gate](row.dataset.pattern.split(',').map(Number));
    if (focus) row.focus();
  }

  function initTables() {
    for (const table of document.querySelectorAll('.interactive-table')) {
      const rows = [...table.tBodies[0].rows];
      rows.forEach((row, i) => {
        row.addEventListener('click', () => selectRow(table, row, false));
        row.addEventListener('keydown', (e) => {
          const next = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: rows.length - 1 }[e.key];
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectRow(table, row, false);
          } else if (next !== undefined) {
            e.preventDefault();
            selectRow(table, rows[Math.max(0, Math.min(rows.length - 1, next))], true);
          }
        });
      });
      selectRow(table, rows[0], false);
    }
  }

  // まとめの表（計算部の値で描く）
  function fillSummary(id, rows) {
    const body = $(id);
    body.replaceChildren();
    for (const values of rows) {
      const tr = body.insertRow();
      for (const v of values) {
        const td = tr.insertCell();
        td.textContent = String(v);
        if (v === 1) td.className = 'v1';
      }
    }
  }

  // ---- ④ OTP ----
  const otp = {
    status: null, // { key, vars, field, kind } 言語を切り替えたら描き直す
    result: null // 最後の結果 { mode, input, key, out }
  };

  const mode = () => document.querySelector('input[name="otp-mode"]:checked').value;
  const inputField = () => (mode() === 'encrypt' ? 'field.plain' : 'field.cipher');

  function renderStatus() {
    const el = $('otp-status');
    const s = otp.status;
    el.className = s && s.kind === 'error' ? 'status error' : 'status';
    el.textContent = s ? t(s.key, { ...s.vars, field: t(s.field || inputField()) }) : '';
  }

  function setStatus(key, vars = {}, kind = 'info', field) {
    otp.status = key ? { key, vars, kind, field } : null;
    renderStatus();
  }

  function parseError(r, field) {
    if (r.error === 'hexChar') return { key: 'err.hexChar', vars: { pos: r.pos, char: r.char }, field };
    if (r.error === 'hexOdd') return { key: 'err.hexOdd', vars: {}, field };
    return { key: 'err.tooLong', vars: { n: r.length, max: C.MAX_BYTES }, field };
  }

  // 入力欄の下に、バイト数と16進数（先頭32バイト）を出す。読めないときは誤りを出す
  function renderInfo(which) {
    const box = $(`otp-${which}`);
    const fmt = $(`otp-${which}-format`).value;
    const info = $(`otp-${which}-info`);
    const r = C.parseInput(box.value, fmt);
    if (!r.ok) {
      const e = parseError(r, which === 'key' ? 'field.key' : inputField());
      info.className = 'field-info error';
      info.textContent = t(e.key, { ...e.vars, field: t(e.field) });
      return;
    }
    info.className = 'field-info';
    const head = r.bytes.subarray(0, 32);
    info.textContent = r.bytes.length ? t(r.bytes.length > 32 ? 'otp.infoLong' : 'otp.info', { n: r.bytes.length, hex: C.toHex(head) }) : '';
  }

  function renderMode() {
    const enc = mode() === 'encrypt';
    setText('otp-input-label', t(enc ? 'otp.inputPlain' : 'otp.inputCipher'));
    setText('otp-run', t(enc ? 'otp.runEncrypt' : 'otp.runDecrypt'));
    renderInfo('input');
    renderInfo('key');
  }

  // 結果を隠すときは中身も消す（隠れた欄に前の言語・前の結果を残さない）
  function clearResult() {
    otp.result = null;
    $('otp-result').hidden = true;
    $('otp-out-hex').value = '';
    $('otp-out-text').value = '';
    $('otp-warnings').replaceChildren();
    $('otp-bitviz').replaceChildren();
    setText('otp-check', '');
    setText('otp-viz-more', '');
    setText('otp-result-title', t(mode() === 'encrypt' ? 'otp.resultEncrypt' : 'otp.resultDecrypt'));
  }

  // 1バイトの説明（16進数と、UTF-8 として読んだときの文字）
  function describeByte(bytes, owners, i) {
    const hex = C.toHex([bytes[i]]);
    const o = owners[i];
    if (o.char === null) return t('byte.invalid', { hex });
    if (o.size > 1) return t('byte.part', { hex, ch: o.char, part: o.part, size: o.size });
    if (C.isControl(o.cp)) return t('byte.control', { hex, cp: o.cp.toString(16).toUpperCase().padStart(4, '0') });
    if (o.cp === 0x20) return t('byte.space', { hex });
    return t('byte.ascii', { hex, ch: o.char });
  }

  function bitRow(label, bits, cls) {
    const tr = document.createElement('tr');
    if (cls) tr.className = cls;
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = label;
    tr.append(th);
    for (const b of bits) {
      const td = document.createElement('td');
      td.textContent = String(b);
      td.className = b ? 'bit b1' : 'bit';
      tr.append(td);
    }
    return tr;
  }

  function renderViz(res) {
    const box = $('otp-bitviz');
    box.replaceChildren();
    const enc = res.mode === 'encrypt';
    const [xs, ys] = enc ? ['P', 'C'] : ['C', 'P'];
    const inOwners = C.byteOwners(res.input);
    const keyOwners = C.byteOwners(res.key);
    const outOwners = C.byteOwners(res.out);
    const shown = Math.min(res.input.length, C.VIZ_BYTES);
    for (let i = 0; i < shown; i++) {
      const tr = C.byteTrace(res.input[i], res.key[i]);
      const fig = document.createElement('figure');
      fig.className = 'byte-viz';
      const cap = document.createElement('figcaption');
      cap.textContent = t('otp.vizByte', {
        i: i + 1, x: describeByte(res.input, inOwners, i), k: describeByte(res.key, keyOwners, i), y: describeByte(res.out, outOwners, i)
      });
      const table = document.createElement('table');
      table.className = 'bit-table';
      table.setAttribute('aria-label', t('otp.vizTableLabel', { i: i + 1 }));
      const body = table.createTBody();
      body.append(
        bitRow(`${xs}[${i}]`, tr.bits.map((b) => b.x)),
        bitRow(`K[${i}]`, tr.bits.map((b) => b.k)),
        bitRow('h1 = OR', tr.bits.map((b) => b.h1), 'hidden-layer'),
        bitRow('h2 = NAND', tr.bits.map((b) => b.h2), 'hidden-layer'),
        bitRow(`${ys}[${i}] = AND`, tr.bits.map((b) => b.y), 'output-layer')
      );
      fig.append(cap, table);
      box.append(fig);
    }
    setText('otp-viz-more', res.input.length > shown ? t('otp.vizMore', { shown, n: res.input.length }) : '');
  }

  function renderResult() {
    const res = otp.result;
    if (!res) {
      clearResult();
      return;
    }
    const enc = res.mode === 'encrypt';
    $('otp-result').hidden = false;
    setText('otp-result-title', t(enc ? 'otp.resultEncrypt' : 'otp.resultDecrypt'));
    $('otp-out-hex').value = C.toHex(res.out);
    const safety = C.textSafety(res.out);
    $('otp-out-text').value = safety.text;
    const warnings = $('otp-warnings');
    warnings.replaceChildren();
    const warn = (text) => {
      const li = document.createElement('li');
      li.textContent = text;
      warnings.append(li);
    };
    if (!safety.valid) warn(t('otp.warnInvalid'));
    if (safety.controls) warn(t('otp.warnControl', { n: safety.controls }));
    const diff = res.out.reduce((acc, v, i) => acc + (v !== res.native[i] ? 1 : 0), 0);
    setText('otp-check', diff ? t('otp.checkNg', { n: res.out.length, m: diff }) : t('otp.check', { n: res.out.length }));
    $('otp-to-decrypt').hidden = !enc;
    renderViz(res);
  }

  function readInputs() {
    const input = C.parseInput($('otp-input').value, $('otp-input-format').value);
    if (!input.ok) return { error: parseError(input, inputField()) };
    const key = C.parseInput($('otp-key').value, $('otp-key-format').value);
    if (!key.ok) return { error: parseError(key, 'field.key') };
    return { input: input.bytes, key: key.bytes };
  }

  function runOtp() {
    clearResult();
    const r = readInputs();
    if (r.error) return setStatus(r.error.key, r.error.vars, 'error', r.error.field);
    if (!r.input.length) return setStatus('err.empty', {}, 'error');
    if (r.input.length !== r.key.length) return setStatus('err.lengthMismatch', { a: r.input.length, b: r.key.length }, 'error');
    setStatus(null);
    otp.result = { mode: mode(), input: r.input, key: r.key, out: C.xorPerceptron(r.input, r.key), native: C.xorNative(r.input, r.key) };
    renderResult();
  }

  function setFormat(which, fmt) {
    $(`otp-${which}-format`).value = fmt;
  }

  function makeRandomKey() {
    clearResult();
    const input = C.parseInput($('otp-input').value, $('otp-input-format').value);
    if (!input.ok) {
      const e = parseError(input, inputField());
      return setStatus(e.key, e.vars, 'error', e.field);
    }
    if (!input.bytes.length) return setStatus('err.randomNeedsInput', {}, 'error');
    const key = C.randomBytes(input.bytes.length, (a) => crypto.getRandomValues(a));
    setFormat('key', 'hex');
    $('otp-key').value = C.toHex(key);
    renderInfo('key');
    setStatus('otp.keyMade', { n: key.length });
  }

  function loadSample() {
    clearResult();
    const enc = mode() === 'encrypt';
    const p = C.utf8(C.SAMPLE.plain);
    const k = C.utf8(C.SAMPLE.key);
    if (enc) {
      setFormat('input', 'text');
      $('otp-input').value = C.SAMPLE.plain;
    } else {
      setFormat('input', 'hex');
      $('otp-input').value = C.toHex(C.xorPerceptron(p, k));
    }
    setFormat('key', 'text');
    $('otp-key').value = C.SAMPLE.key;
    renderMode();
    setStatus(enc ? 'otp.sampleSet' : 'otp.sampleSetDecrypt');
  }

  // 暗号化の結果を、16進数のまま復号の入力へ（テキストでコピーすると壊れるバイトがあるため）
  function moveToDecrypt() {
    const res = otp.result;
    if (!res) return;
    document.querySelector('input[name="otp-mode"][value="decrypt"]').checked = true;
    setFormat('input', 'hex');
    $('otp-input').value = C.toHex(res.out);
    setFormat('key', 'hex');
    $('otp-key').value = C.toHex(res.key);
    clearResult();
    renderMode();
    setStatus('otp.movedToDecrypt');
    $('otp-run').focus();
  }

  function initOtp() {
    for (const radio of document.querySelectorAll('input[name="otp-mode"]')) {
      radio.addEventListener('change', () => {
        clearResult();
        setStatus(null);
        renderMode();
      });
    }
    for (const which of ['input', 'key']) {
      for (const ev of ['input', 'change']) {
        $(`otp-${which}`).addEventListener(ev, () => {
          clearResult();
          renderInfo(which);
        });
        $(`otp-${which}-format`).addEventListener(ev, () => {
          clearResult();
          renderInfo(which);
        });
      }
    }
    $('otp-run').addEventListener('click', runOtp);
    $('otp-random-key').addEventListener('click', makeRandomKey);
    $('otp-sample').addEventListener('click', loadSample);
    $('otp-to-decrypt').addEventListener('click', moveToDecrypt);
    renderMode();
  }

  // ---- 速度の比較 ----
  let benchResult = null;

  function renderBench() {
    const box = $('bench-result');
    box.replaceChildren();
    if (!benchResult) return;
    const r = benchResult;
    const table = document.createElement('table');
    table.className = 'bench-table';
    const head = table.createTHead().insertRow();
    for (const k of ['bench.colMethod', 'bench.colPerByte', 'bench.colReps']) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = t(k);
      head.append(th);
    }
    const body = table.createTBody();
    for (const [k, m] of [['bench.native', r.native], ['bench.perceptron', r.perceptron]]) {
      const tr = body.insertRow();
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = t(k);
      tr.append(th);
      tr.insertCell().textContent = t('bench.nsValue', { v: m.nsPerByte < 10 ? m.nsPerByte.toFixed(2) : m.nsPerByte.toFixed(1) });
      tr.insertCell().textContent = t('bench.repsValue', { n: m.reps.toLocaleString('en-US') });
    }
    const p1 = document.createElement('p');
    p1.textContent = t('bench.ratio', { x: r.ratio.toFixed(r.ratio < 10 ? 1 : 0) });
    const p2 = document.createElement('p');
    p2.textContent = r.equal ? t('bench.equal', { n: r.n.toLocaleString('en-US') }) : t('bench.notEqual');
    box.append(table, p1, p2);
  }

  function runBench() {
    const btn = $('bench-run');
    btn.disabled = true;
    setText('bench-run', t('bench.running'));
    // 文言を描いてから測る（測っている間は画面が止まる。合わせて約0.2秒）
    setTimeout(() => {
      benchResult = C.bench({ n: 10000, budgetMs: 100, now: () => performance.now(), fill: (a) => crypto.getRandomValues(a) });
      btn.disabled = false;
      setText('bench-run', t('bench.run'));
      renderBench();
    }, 30);
  }

  // ---- ⑤ 用語集 ----
  let category = 'all';

  function renderGlossary() {
    const q = $('glossary-search').value.trim().toLowerCase();
    const grid = $('glossary-grid');
    grid.replaceChildren();
    let n = 0;
    for (const g of M.GLOSSARY) {
      const term = t(`gl.${g.id}.term`);
      const desc = t(`gl.${g.id}.desc`);
      if (category !== 'all' && g.category !== category) continue;
      if (q && !term.toLowerCase().includes(q) && !desc.toLowerCase().includes(q)) continue;
      n++;
      const card = document.createElement('article');
      card.className = 'glossary-card';
      const head = document.createElement('div');
      head.className = 'term';
      const h3 = document.createElement('h3');
      h3.textContent = term;
      const tag = document.createElement('span');
      tag.className = `category-tag ${g.category}`;
      tag.textContent = t(`cat.${g.category}`);
      head.append(h3, tag);
      const p = document.createElement('p');
      p.className = 'definition';
      p.textContent = desc;
      card.append(head, p);
      if (g.link) {
        const a = document.createElement('a');
        a.className = 'ext-btn';
        a.href = g.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = t(`gl.${g.id}.link`);
        card.append(a);
      }
      grid.append(card);
    }
    setText('glossary-count', n ? t('gl.count', { n }) : t('gl.none'));
  }

  function initGlossary() {
    $('glossary-search').addEventListener('input', renderGlossary);
    for (const btn of document.querySelectorAll('.filter-btn')) {
      btn.addEventListener('click', () => {
        category = btn.dataset.category;
        for (const b of document.querySelectorAll('.filter-btn')) b.setAttribute('aria-pressed', String(b === btn));
        renderGlossary();
      });
    }
  }

  // ---- 言語とテーマ ----
  function applyLanguage() {
    I.applyStaticText();
    Theme.refresh($('btn-theme'));
    renderMode();
    renderStatus();
    renderResult();
    renderBench();
    renderGlossary();
    if (!$('bench-run').disabled) setText('bench-run', t('bench.run'));
  }

  function init() {
    I.init();
    initTabs();
    initTables();
    fillSummary('nand-summary', C.nandSummary());
    fillSummary('gates-summary', C.perceptronSummary());
    fillSummary('xor-summary', C.mlpSummary());
    initOtp();
    initGlossary();
    $('bench-run').addEventListener('click', runBench);
    $('btn-theme').addEventListener('click', () => Theme.toggle($('btn-theme')));
    $('btn-lang').addEventListener('click', () => {
      I.set(I.lang === 'ja' ? 'en' : 'ja');
      applyLanguage();
    });
    applyLanguage();
    selectTab('nand', false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
