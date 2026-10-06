import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { read, load, core } from './load.js';

const C = core();
const { GLOSSARY } = load('js/messages.js').PotpMessages;
const ROOT = fileURLToPath(new URL('..', import.meta.url));

const DOCS = {
  ja: {
    file: 'README.md', switcher: '[English](README.en.md) · 日本語', day: '**Day057 - 生成AIで作るセキュリティツール100**',
    h1: '# Perceptron OTP Visualizer - パーセプトロンOTP可視化ツール', shots: /^assets\/screenshot\d*\.png$/,
    h2: ['🌐 デモページ', '📸 スクリーンショット', '✨ 機能', '📖 使い方', '🔑 ワンタイムパッドの条件', '🎯 ユースケース', '🔬 技術的な説明',
      '🔒 セキュリティ', '⚠️ 注意と限界', '🧪 テスト', '🔗 参考文献', '🔄 今後の拡張予定', '📁 ディレクトリー構造', '💻 動作環境', '📄 ライセンス',
      '🛠️ このツールについて'],
    head: { weights: '| ゲート | 重み | バイアス | 式 |', nand: '| ゲート | NANDの個数 | 式 |', mlp: '| a | b | h1 = OR(a, b) |', otp: '| | テキスト | 16進数 |' },
    otpRows: ['平文P', '鍵K', '暗号文C = P ⊕ K'],
    facts: ['そのうち14個です', 'XORとXNORの2つです', '65,536バイトまで', '先頭の16バイトまで', '用語集', '29語', '10,000バイトの乱数どうし', '0.1秒以上'],
    project: 'https://akademeia.info/?page_id=42163',
    // 長音のない表記・「わかる」の漢字書き（分ける・分かれるは漢字のまま）・事実と食い違う古い記述
    forbidden: new RegExp(['ブラウザ(?!ー)', 'フォルダ(?!ー)', 'ディレクトリ(?!ー)', 'リポジトリ(?!ー)', 'ライブラリ(?!ー)', 'エディタ(?!ー)',
      'サーバ(?!ー)', 'ユーザ(?!ー)', 'カテゴリ(?!ー)', '(?<![自0-9０-９])分か(?!れ)', '全て', '既に', '復号化', 'MathJax', 'Subresource Integrity',
      'X-Content-Type-Options', '組み込みシステムに最適', '理論的に最大', 'settings\\.local\\.json', 'words\\.json', 'script\\.js'].join('|'))
  },
  en: {
    file: 'README.en.md', switcher: 'English · [日本語](README.md)', day: '**Day057 - 100 Security Tools with Generative AI**',
    h1: '# Perceptron OTP Visualizer - Perceptron-based OTP Encryption Visualizer', shots: /^assets\/en\/screenshot\d*\.png$/,
    h2: ['🌐 Demo', '📸 Screenshots', '✨ Features', '📖 How to use', '🔑 One-time pad conditions', '🎯 Use cases', '🔬 Technical notes',
      '🔒 Security', '⚠️ Notes and limitations', '🧪 Tests', '🔗 References', '🔄 Planned extensions', '📁 Directory structure', '💻 Requirements',
      '📄 License', '🛠️ About this tool'],
    head: { weights: '| Gate | Weights | Bias | Formula |', nand: '| Gate | NAND gates | Formula |', mlp: '| a | b | h1 = OR(a, b) |',
      otp: '| | Text | Hex |' },
    otpRows: ['Plaintext P', 'Key K', 'Ciphertext C = P ⊕ K'],
    facts: ['express 14 of them', 'are XOR and XNOR', 'limited to 65,536 bytes', 'shows the first 16 bytes', '29 terms', 'two random 10,000-byte inputs',
      'at least 0.1 seconds'],
    project: 'https://akademeia.info/?page_id=42163',
    forbidden: /MathJax|Subresource Integrity|X-Content-Type-Options|ideal for embedded|theoretically maximal|settings\.local\.json|words\.json|script\.js/i
  }
};
for (const d of Object.values(DOCS)) d.text = read(d.file);

const noCode = (md) => md.replace(/```[\s\S]*?```/g, '');
const headings = (md) => noCode(md).split('\n').filter((l) => /^#{1,4} /.test(l));
const h2 = (md) => headings(md).filter((l) => l.startsWith('## ')).map((l) => l.slice(3));
const sec = (d, emoji) => d.h2.find((x) => x.startsWith(emoji));

function section(text, heading) {
  const i = text.indexOf(`\n## ${heading}\n`);
  assert.ok(i >= 0, heading);
  const rest = text.slice(i + 1);
  const end = rest.indexOf('\n## ', 3);
  return end < 0 ? rest : rest.slice(0, end);
}

function table(text, firstHeader) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(firstHeader));
  assert.ok(start >= 0, firstHeader);
  const rows = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith('|'); i++) rows.push(lines[i].replace(/^\| ?| \|$/g, '').split(' | ').map((c) => c.trim()));
  return rows;
}

test('YAML メタデータの構造（キーの順、ブロック形式のリスト、固定の値）。YAML は README.md だけに置く', () => {
  const m = DOCS.ja.text.match(/^<!--\n---\n([\s\S]*?)\n---\n-->\n/);
  assert.ok(m, 'YAML block');
  const keys = [...m[1].matchAll(/^([a-z_]+):/gm)].map((x) => x[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en', 'category_ja', 'category_en',
    'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  for (const k of ['category_ja', 'category_en', 'tags']) assert.match(m[1], new RegExp(`^${k}:\\n  - `, 'm'), k);
  assert.match(m[1], /^id: day057$/m);
  assert.match(m[1], /^slug: perceptron-otp-visualizer$/m);
  assert.match(m[1], /^repo_url: "https:\/\/github.com\/ipusiron\/perceptron-otp-visualizer"$/m);
  assert.match(m[1], /^demo_url: "https:\/\/ipusiron.github.io\/perceptron-otp-visualizer\/"$/m);
  assert.match(m[1], /^hub: true$/m);
  assert.doesNotMatch(DOCS.en.text, /^<!--\n---/);
});

test('冒頭の形（言語の切り替え・H1・バッジ5種・Dayの行）と、H2の並び。日英で見出しの数と階層がそろう', () => {
  for (const d of Object.values(DOCS)) {
    assert.ok(d.text.includes(`\n${d.switcher}\n`) || d.text.startsWith(`${d.switcher}\n`), d.file);
    assert.ok(d.text.includes(`\n${d.h1}\n`), d.file);
    assert.ok(d.text.includes(`\n${d.day}\n`), d.file);
    for (const b of ['stars', 'forks', 'last-commit', 'license', 'GitHub%20Pages']) assert.ok(d.text.includes(b), `${d.file} ${b}`);
    assert.deepEqual(h2(d.text), d.h2, d.file);
    assert.ok(d.text.includes(`🔗 [${d.project}](${d.project})`), d.file);
  }
  const level = (md) => headings(md).map((l) => l.match(/^#+/)[0].length);
  assert.deepEqual(level(DOCS.en.text), level(DOCS.ja.text));
  assert.ok(headings(DOCS.ja.text).length >= 30, String(headings(DOCS.ja.text).length));
});

test('画像: README から参照する画像はすべて実在し300KB以下。assets の PNG は README から参照されているものだけ', () => {
  for (const d of Object.values(DOCS)) {
    const refs = [...d.text.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map((m) => m[1]);
    assert.equal(refs.length, 7, d.file);
    for (const r of refs) {
      assert.match(r, d.shots, r);
      const st = fs.statSync(path.join(ROOT, r));
      assert.ok(st.size <= 300 * 1024, `${r} ${st.size}`);
    }
    const dir = d.file === 'README.md' ? 'assets' : 'assets/en';
    const pngs = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.png')).map((f) => `${dir}/${f}`).sort();
    assert.deepEqual(pngs, [...refs].sort(), dir);
  }
});

test('パーセプトロンの重みの表は、計算部の PERCEPTRONS と同じ', () => {
  for (const d of Object.values(DOCS)) {
    const rows = table(section(d.text, sec(d, '🔬')), d.head.weights);
    assert.deepEqual(rows.map((r) => r[0]), C.GATES, d.file);
    for (const [name, w, b, formula] of rows) {
      const p = C.PERCEPTRONS[name];
      assert.deepEqual(w.split(', ').map(Number), p.w, `${d.file} ${name}`);
      assert.equal(Number(b), p.b, `${d.file} ${name}`);
      // 式に書いた重みとバイアスで、4通りの出力が計算部と同じになる
      for (const [a, x] of C.PAIRS) {
        const z = Function('a', 'b', `return ${formula.replace(/^step\(|\)$/g, '')};`)(a, x);
        assert.equal(C.step(z), C.gate(name, a, x).y, `${d.file} ${name} ${a}${x}`);
      }
    }
  }
});

test('NAND で組むゲートの表と、2層の XOR の真理値表は、計算部と同じ', () => {
  for (const d of Object.values(DOCS)) {
    const s = section(d.text, sec(d, '🔬'));
    const nand = table(s, d.head.nand);
    assert.deepEqual(nand.map((r) => [r[0], Number(r[1])]), [['NOT', 1], ['AND', 2], ['OR', 3], ['XOR', 4]], d.file);
    const mlp = table(s, d.head.mlp).map((r) => r.map(Number));
    assert.deepEqual(mlp, C.mlpSummary(), d.file);
  }
});

test('ワンタイムパッドの例（HELLO ⊕ XMCKL と café ⊕ kkkkk）は、計算部の結果と同じ', () => {
  const p = C.utf8(C.SAMPLE.plain);
  const k = C.utf8(C.SAMPLE.key);
  const c = C.xorPerceptron(p, k);
  const cafe = C.utf8('café');
  const kk = C.utf8('kkkkk');
  const cc = C.xorPerceptron(cafe, kk);
  for (const d of Object.values(DOCS)) {
    const s = section(d.text, sec(d, '🔬'));
    const rows = table(s, d.head.otp);
    assert.deepEqual(rows.map((r) => r[0]), d.otpRows, d.file);
    assert.deepEqual(rows.map((r) => r[2]), [C.toHex(p), C.toHex(k), C.toHex(c)], d.file);
    assert.deepEqual(rows.slice(0, 2).map((r) => r[1]), [C.SAMPLE.plain, C.SAMPLE.key], d.file);
    assert.ok(s.includes(`\`café\`（\`${C.toHex(cafe)}\`）を鍵\`kkkkk\`で暗号化すると\`${C.toHex(cc)}\``)
      || s.includes(`\`café\` (\`${C.toHex(cafe)}\`) with the key \`kkkkk\` gives \`${C.toHex(cc)}\``), d.file);
    assert.deepEqual(C.textSafety(cc).valid, false);
    assert.ok(cc.includes(0x0d));
    // スクリーンショットのキャプションの暗号文も同じ
    assert.ok(section(d.text, sec(d, '📸')).includes(C.toHex(c)), d.file);
  }
});

test('README に書いた数（14個・65,536バイト・16バイト・29語・10,000バイト・0.1秒）は、計算部と画面の値に合う', () => {
  for (const d of Object.values(DOCS)) for (const f of d.facts) assert.ok(d.text.includes(f), `${d.file}: ${f}`);
  assert.equal(C.MAX_BYTES, 65536);
  assert.equal(C.VIZ_BYTES, 16);
  assert.equal(GLOSSARY.length, 29);
  assert.match(read('js/app.js'), /C\.bench\(\{ n: 10000, budgetMs: 100,/);
});

function files(dir = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['.git', '.claude', 'node_modules'].includes(e.name)) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(`${rel}/`, ...files(rel));
    else out.push(rel);
  }
  return out;
}

test('ディレクトリー構造: すべてのファイルとディレクトリーが載り、全行に説明があり、# の桁がそろう', () => {
  const all = files();
  for (const d of Object.values(DOCS)) {
    const tree = d.text.match(/```text\nperceptron-otp-visualizer\/\n([\s\S]*?)```/)[1].split('\n').filter(Boolean);
    const cols = new Set();
    const listed = [];
    const stack = [];
    for (const line of tree) {
      const m = line.match(/^((?:│ {3}| {4})*)[├└]── (\S+)\s+# \S/);
      assert.ok(m, `${d.file}: ${line}`);
      cols.add([...line].indexOf('#'));
      const depth = [...m[1]].length / 4;
      stack.length = depth;
      stack.push(m[2]);
      listed.push(stack.join(''));
    }
    assert.equal(cols.size, 1, d.file);
    assert.deepEqual([...listed].sort(), [...all].sort(), d.file);
  }
});

test('表記: 禁止語がない。強調は1節に2カ所まで、箇条書きの先頭を太字にしない。日本語と英数字のあいだに半角空白を入れない', () => {
  for (const d of Object.values(DOCS)) {
    const body = noCode(d.text);
    assert.doesNotMatch(body, d.forbidden, d.file);
    for (const h of d.h2) {
      const n = (section(body, h).match(/\*\*/g) || []).length / 2;
      assert.ok(n <= 2, `${d.file} ${h}: ${n}`);
    }
    assert.doesNotMatch(body, /^\s*- \*\*/m, d.file);
  }
  const J = '[\\u3040-\\u30ff\\u3400-\\u9fff\\uff00-\\uffef]';
  const bad = new RegExp(`${J} [A-Za-z0-9(\`]|[A-Za-z0-9)\`] ${J}`);
  for (const line of noCode(DOCS.ja.text).split('\n')) assert.doesNotMatch(line, bad, line);
});

test('ノートブックの書名の誤記と、AND の関数名を直してある', () => {
  const nb = read('notebooks/logic_gate_of_perceptron.ipynb');
  assert.doesNotMatch(nb, /ディープラーイング|perceptron_add/);
  assert.match(nb, /ディープラーニングのしくみ/);
  assert.equal((nb.match(/perceptron_and/g) || []).length, 4);
  JSON.parse(nb);
});
