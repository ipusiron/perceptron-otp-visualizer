import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { read, load, core } from './load.js';

const html = read('index.html');
const C = core();
const { MESSAGES, t } = load('js/messages.js').PotpMessages;
const { parseVars } = load('js/i18n.js').PotpI18n;
const SCRIPTS = ['js/theme-init.js', 'js/potp-core.js', 'js/messages.js', 'js/i18n.js', 'js/theme.js', 'js/app.js'];
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const TABS = ['nand', 'gates', 'xor', 'otp', 'functions', 'glossary'];

test('CSP はスクリプト・スタイルを同じ場所のファイルだけに限り、unsafe-inline と外部の通信を許さない', () => {
  const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.equal(csp, "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; "
    + "connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
  // meta では効かないもの（frame-ancestors・X-Frame-Options など）は書かない
  assert.doesNotMatch(html, /X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|frame-ancestors/i);
  assert.equal((html.match(/http-equiv=/g) || []).length, 1);
  assert.match(html, /<meta name="referrer" content="no-referrer" \/>/);
  assert.match(html, /<link rel="icon" href="data:," \/>/);
  assert.match(html, /<noscript>/);
});

test('外部のスクリプト（MathJax など）を読まない。style 属性・インラインのスクリプト・イベントハンドラーがない', () => {
  assert.doesNotMatch(html, /\sstyle=/);
  assert.doesNotMatch(html, /\son[a-z]+=/i);
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepEqual(scripts, SCRIPTS);
  assert.equal((html.match(/<script/g) || []).length, scripts.length);
  assert.doesNotMatch(html, /mathjax|cdn\.|jsdelivr|unpkg/i);
  for (const a of html.match(/<a [^>]*>/g)) assert.match(a, /target="_blank" rel="noopener noreferrer"/, a);
  // 読み込むファイルはすべてリポジトリーにあり、古いファイル（script.js・data/words.json）は残さない
  const js = fs.readdirSync(new URL('../js', import.meta.url)).map((f) => `js/${f}`).sort();
  assert.deepEqual(js, [...SCRIPTS].sort());
  assert.equal(fs.existsSync(new URL('../data', import.meta.url)), false);
  assert.equal(fs.existsSync(new URL('../script.js', import.meta.url)), false);
});

test('タブは WAI-ARIA の形（tablist の中はタブだけ、aria-controls の先が実在、最初のタブだけ選択）', () => {
  const list = html.match(/<div class="tabs" role="tablist"[\s\S]*?<\/div>/)[0];
  assert.equal((list.match(/<button/g) || []).length, TABS.length);
  const tabs = [...list.matchAll(/role="tab" id="tab-([a-z]+)" aria-controls="panel-([a-z]+)" aria-selected="(true|false)" tabindex="(0|-1)"/g)];
  assert.deepEqual(tabs.map((m) => [m[1], m[2], m[3], m[4]]), TABS.map((k, i) => [k, k, i ? 'false' : 'true', i ? '-1' : '0']));
  for (const k of TABS) {
    const tag = html.match(new RegExp(`<section [^>]*id="panel-${k}"[^>]*>`))[0];
    assert.match(tag, new RegExp(`role="tabpanel" aria-labelledby="tab-${k}"`), k);
    assert.equal(/\shidden/.test(tag), k !== 'nand', k);
  }
  for (const m of html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)) assert.ok(ids.has(m[1]), m[1]);
});

test('ボタンは type="button"。入力欄・選択欄には label がある。知らせの欄には aria-live がある', () => {
  for (const b of html.match(/<button[^>]*>/g)) assert.match(b, /type="button"/, b);
  for (const m of html.matchAll(/<(textarea|select|input) [^>]*id="([^"]+)"/g)) {
    if (/type="radio"/.test(m[0])) continue;
    const wrapped = new RegExp(`<label[^>]*>(?:(?!</label>)[\\s\\S])*id="${m[2]}"`).test(html);
    assert.ok(wrapped || new RegExp(`<label [^>]*for="${m[2]}"`).test(html), m[2]);
  }
  for (const id of ['otp-input', 'otp-key', 'otp-out-hex', 'otp-out-text']) assert.match(html, new RegExp(`id="${id}"[^>]*spellcheck="false"`), id);
  for (const id of ['otp-input-info', 'otp-key-info', 'otp-status', 'bench-result', 'glossary-count']) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-live="polite"`), id);
  }
  assert.match(html, /id="otp-status" class="status" role="status"/);
  // 用語集の分野のボタンは aria-pressed で選択を伝える（最初は「すべて」）
  const pressed = [...html.matchAll(/class="filter-btn" data-category="([a-z]+)" aria-pressed="(true|false)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(pressed, [['all', 'true'], ['crypto', 'false'], ['logic', 'false'], ['ml', 'false'], ['bit', 'false']]);
  // details に固定の aria-expanded を付けない（開閉はブラウザーが伝える）
  assert.doesNotMatch(html, /<details[^>]*aria-expanded/);
});

test('回路図・パーセプトロンの図（SVG）10枚と入力の平面の図は role="img" と名前を持つ', () => {
  const svgs = [...html.matchAll(/<svg role="img" data-i18n-attr="aria-label:([a-z.]+)" aria-label="([^"]+)"/g)];
  assert.deepEqual(svgs.map((m) => m[1]), ['svg.nand', 'svg.not', 'svg.and', 'svg.or', 'svg.xor', 'svg.pnot', 'svg.pand', 'svg.por', 'svg.pnand', 'svg.mlp']);
  // 16関数のタブの入力の平面は、名前を JS が関数ごとに付ける
  assert.match(html, /<svg id="fn-plane" class="fn-plane" role="img"/);
  assert.equal((html.match(/<svg/g) || []).length, svgs.length + 1);
  for (const m of svgs) assert.equal(m[2], MESSAGES.ja[m[1]], m[1]);
});

// 表のセルを数に（マイナス記号 U+2212 は -）
const cells = (row) => [...row.matchAll(/<td>([^<]*)<\/td>/g)].map((m) => Number(m[1].replace('−', '-')));
const tableRows = (gate) => {
  const table = html.match(new RegExp(`<table class="truth-table interactive-table" data-gate="${gate}">[\\s\\S]*?</table>`))[0];
  return [...table.matchAll(/<tr data-pattern="([0-9,]+)">([\s\S]*?)<\/tr>/g)].map((m) => ({ pattern: m[1].split(',').map(Number), cells: cells(m[2]) }));
};

test('真理値表（HTML に書いた9つの表）の数は、計算部の値と同じ', () => {
  const expect = {
    not: ([a]) => [a, a, C.nandNot(a).z, C.nandNot(a).z],
    and: ([a, b]) => [a, b, C.nandAnd(a, b).t, C.nandAnd(a, b).z],
    or: ([a, b]) => [a, b, C.nandOr(a, b).t, C.nandOr(a, b).s, C.nandOr(a, b).z],
    xor: ([a, b]) => [a, b, C.nandXor(a, b).s, C.nandXor(a, b).t, C.nandXor(a, b).u, C.nandXor(a, b).z],
    'p-not': ([a]) => [a, -a || 0, C.gate('NOT', a).s, C.gate('NOT', a).y],
    'p-and': ([a, b]) => [a, b, a + b, C.gate('AND', a, b).s, C.gate('AND', a, b).y],
    'p-or': ([a, b]) => [a, b, a + b, C.gate('OR', a, b).s, C.gate('OR', a, b).y],
    'p-nand': ([a, b]) => [a, b, -a - b || 0, C.gate('NAND', a, b).s, C.gate('NAND', a, b).y],
    'mlp-xor': ([a, b]) => [a, b, C.mlpXor(a, b).h1.y, C.mlpXor(a, b).h2.y, C.mlpXor(a, b).y]
  };
  for (const [gate, fn] of Object.entries(expect)) {
    const rows = tableRows(gate);
    assert.equal(rows.length, gate.endsWith('not') ? 2 : 4, gate);
    for (const r of rows) {
      assert.deepEqual(r.cells.slice(0, r.pattern.length), gate === 'not' ? [r.pattern[0]] : r.pattern, gate);
      assert.deepEqual(r.cells, fn(r.pattern), `${gate} ${r.pattern}`);
    }
  }
  const mini = html.match(/<table class="mini-truth-table">[\s\S]*?<\/table>/)[0];
  assert.deepEqual([...mini.matchAll(/<tr>(<td>[\s\S]*?)<\/tr>/g)].map((m) => cells(m[1])), C.PAIRS.map(([a, b]) => [a, b, C.NAND(a, b)]));
});

test('パーセプトロンの図に書いた重みとバイアスは、計算部の値と同じ', () => {
  const svgOf = (key) => html.match(new RegExp(`<svg role="img" data-i18n-attr="aria-label:${key}"[\\s\\S]*?</svg>`))[0];
  const weights = (svg) => [...svg.matchAll(/class="circuit-label weight">([^<]+)</g)].map((m) => Number(m[1]));
  const sorted = (xs) => [...xs].sort((x, y) => x - y);
  for (const [key, name] of [['svg.pnot', 'NOT'], ['svg.pand', 'AND'], ['svg.por', 'OR'], ['svg.pnand', 'NAND']]) {
    const p = C.PERCEPTRONS[name];
    assert.deepEqual(sorted(weights(svgOf(key))), sorted([...p.w, p.b]), key);
  }
  const mlp = sorted(weights(svgOf('svg.mlp')));
  const P = C.PERCEPTRONS;
  assert.deepEqual(mlp, sorted([...P.OR.w, P.OR.b, ...P.NAND.w, P.NAND.b, ...P.AND.w, P.AND.b]));
});

// 文言の太字（**）と改行（\n）は HTML の strong と br に当たる。HTML 側のタグを外して比べる
const plain = (s) => s.replace(/\n\s*/g, '').replace(/<br \/>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
const fromDict = (s) => s.replace(/\*\*/g, '');

test('data-i18n のキーは辞書にあり、HTML に書いた日本語は辞書の日本語と同じ（属性も）', () => {
  let n = 0;
  for (const m of html.matchAll(/<([a-z0-9]+)([^>]*?)data-i18n="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const key = m[3];
    assert.ok(MESSAGES.ja[key] !== undefined, key);
    const vars = parseVars(((m[2] + m[4]).match(/data-i18n-vars="([^"]*)"/) || [])[1]);
    assert.equal(plain(m[5]), fromDict(t(key, vars, 'ja')), key);
    n++;
  }
  assert.ok(n >= 75, String(n));
  for (const m of html.matchAll(/<[^>]*data-i18n-attr="([^"]+)"[^>]*>/g)) {
    for (const pair of m[1].split(';')) {
      const [attr, key] = pair.split(':');
      assert.ok(MESSAGES.ja[key] !== undefined, pair);
      const v = m[0].match(new RegExp(`\\s${attr}="([^"]*)"`));
      assert.ok(v, pair);
      assert.equal(plain(v[1]), MESSAGES.ja[key], pair);
    }
  }
});

test('画面のスクリプトが参照する id は、すべて HTML にある', () => {
  const src = read('js/app.js');
  const used = new Set([...src.matchAll(/(?:\$|setText)\('([a-z0-9-]+)'/g)].map((m) => m[1]));
  for (const which of ['input', 'key']) for (const s of ['', '-format', '-info']) used.add(`otp-${which}${s}`);
  for (const k of TABS) used.add(`tab-${k}`).add(`panel-${k}`);
  for (const name of C.GATES) {
    const id = `p-${name.toLowerCase()}`;
    for (const s of ['-value-a', '-sum', '-output', '-value-z']) used.add(id + s);
    if (name !== 'NOT') used.add(`${id}-value-b`);
  }
  assert.ok(used.size >= 70, String(used.size));
  for (const id of used) assert.ok(ids.has(id), id);
});

test('JS は innerHTML・eval・fetch を使わず、style を書き換えない。乱数は crypto.getRandomValues', () => {
  for (const f of SCRIPTS) {
    const src = read(f);
    assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|DOMParser|\beval\(|new Function|document\.write/, f);
    assert.doesNotMatch(src, /\.style\b|setAttribute\('style'|cssText/, f);
    assert.doesNotMatch(src, /console\.(log|debug|info|error|warn)|\balert\(/, f);
    assert.doesNotMatch(src, /sessionStorage|Math\.random|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|MathJax/, f);
  }
  assert.match(read('js/app.js'), /crypto\.getRandomValues\(a\)/);
});

test('localStorage は try で囲んで読み書きする（使えない環境でも画面が止まらない）', () => {
  let total = 0;
  for (const f of SCRIPTS) {
    const src = read(f);
    const uses = (src.match(/localStorage\./g) || []).length;
    const guarded = [...src.matchAll(/try \{\s*(?:const [a-z]+ = |return )?localStorage\./g)].length;
    assert.equal(guarded, uses, f);
    total += uses;
  }
  assert.equal(total, 4);
});
