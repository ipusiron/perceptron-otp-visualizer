import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './load.js';

const css = read('style.css');

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.ok(start >= 0, selector);
  return css.slice(start, css.indexOf('}', start));
}

const tokens = (selector) => Object.fromEntries([...block(selector).matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]));

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// 文字の色と背景の色の組（画面で実際に重なるもの）。4.5:1 以上
const TEXT = [
  ['text', 'bg'], ['text', 'panel'], ['text', 'card'], ['text', 'field-bg'], ['text', 'hover-bg'], ['text', 'code-bg'], ['text', 'btn-bg'],
  ['muted', 'bg'], ['muted', 'panel'], ['muted', 'card'], ['muted', 'code-bg'],
  ['accent-text', 'bg'], ['accent-text', 'panel'], ['accent-text', 'card'], ['accent-text', 'hover-bg'],
  // 選んだタブ・強調した行・出力の値・主ボタン（hover では背景が accent-text になる）・選んだ分野
  ['on-accent', 'accent'], ['on-accent', 'accent-text'],
  ['mid-text', 'mid-bg'], ['mid-label', 'card'], ['warn-text', 'warn-bg'], ['error-text', 'error-bg'], ['error-text', 'card'],
  ['bit-zero-text', 'bit-zero'], ['bit-one-text', 'bit-one'],
  ['tag-crypto', 'tag-crypto-bg'], ['tag-logic', 'tag-logic-bg'], ['tag-ml', 'tag-ml-bg'], ['tag-bit', 'tag-bit-bg']
];
// 入力欄の枠・選択中のタブの色・フォーカスの枠。3:1 以上（WCAG 1.4.11）
const GRAPHICS = [
  ['field-border', 'card'], ['field-border', 'bg'], ['field-border', 'field-bg'], ['field-border', 'panel'],
  ['accent', 'card'], ['accent', 'bg'], ['accent', 'panel']
];

test('ライトとダークの配色は、文字と背景が4.5:1以上、枠と選択の色が3:1以上', () => {
  for (const [name, set] of [['light', tokens(':root')], ['dark', tokens(':root[data-theme="dark"]')]]) {
    for (const [fg, bg] of TEXT) assert.ok(ratio(set[fg], set[bg]) >= 4.5, `${name} ${fg} on ${bg}: ${ratio(set[fg], set[bg]).toFixed(2)}`);
    for (const [fg, bg] of GRAPHICS) assert.ok(ratio(set[fg], set[bg]) >= 3, `${name} ${fg} on ${bg}: ${ratio(set[fg], set[bg]).toFixed(2)}`);
  }
});

test('OS の設定によるダークと、手動のダークは同じ値。ライトとダークは同じトークンを持つ', () => {
  const read2 = (sel) => Object.fromEntries([...block(sel).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const os = read2(':root:not([data-theme="light"])');
  assert.equal(Object.keys(os).length, 34);
  assert.deepEqual(os, read2(':root[data-theme="dark"]'));
  assert.deepEqual(Object.keys(read2(':root')).sort(), Object.keys(os).sort());
});

test('style.css が使う色のトークンは、すべて定義されている（未定義の変数を参照しない）', () => {
  const defined = new Set(Object.keys(tokens(':root')).concat(['shadow']));
  const used = new Set([...css.matchAll(/var\(--([a-z0-9-]+)/g)].map((m) => m[1]));
  for (const k of used) assert.ok(defined.has(k), k);
  // HTML の SVG が使うのは --text だけ
  const html = read('index.html');
  assert.deepEqual([...new Set([...html.matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]))], ['text']);
  // 白字の直書き（color: white など）をしない。色はトークンで
  assert.doesNotMatch(css, /color:\s*(white|#fff\b|#ffffff)/);
});

test('入力欄・選択欄・検索欄の文字は16px（iPhone で自動で拡大しない）、ボタンは高さ44px 以上', () => {
  assert.match(css, /select,\ntextarea,\ninput\[type="search"\] \{\n {2}font-size: 16px;/);
  for (const sel of ['.tab-btn', '.header-btn', '.controls button', '.filter-btn', '.mode-label', '\nselect']) {
    const b = block(sel);
    assert.match(b, /min-height: 44px;/, sel);
  }
});
