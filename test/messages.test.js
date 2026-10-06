import test from 'node:test';
import assert from 'node:assert/strict';
import { read, load, core } from './load.js';

const { MESSAGES, GLOSSARY, t } = load('js/messages.js').PotpMessages;
const C = core();
// かな・カタカナ・漢字・全角の記号
const JAPANESE = new RegExp('[' + [[0x3000, 0x303f], [0x3040, 0x30ff], [0x3400, 0x9fff], [0xff00, 0xffef]]
  .map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']');

const placeholders = (s) => [...s.matchAll(/\{([a-zA-Z0-9]+)\}/g)].map((m) => m[1]).sort();

test('日本語と英語の辞書は同じキーを持ち、置き場所 {name} と太字の数もそろう', () => {
  assert.deepEqual(Object.keys(MESSAGES.en).sort(), Object.keys(MESSAGES.ja).sort());
  assert.ok(Object.keys(MESSAGES.ja).length >= 180, String(Object.keys(MESSAGES.ja).length));
  for (const k of Object.keys(MESSAGES.ja)) {
    assert.deepEqual([...new Set(placeholders(MESSAGES.en[k]))], [...new Set(placeholders(MESSAGES.ja[k]))], k);
    for (const lang of ['ja', 'en']) assert.equal((MESSAGES[lang][k].match(/\*\*/g) || []).length % 2, 0, `${lang} ${k}`);
  }
});

test('英語の辞書に日本語の文字がない（言語の切り替えボタンの「日本語」を除く）', () => {
  for (const [k, v] of Object.entries(MESSAGES.en)) {
    if (k === 'ui.langButton' || k === 'ui.langLabel') continue;
    assert.doesNotMatch(v, JAPANESE, k);
  }
});

test('日本語の文言は、日本語と英数字のあいだに半角空白を入れない。長音をそろえ、「わかる」はひらがな', () => {
  const bad = new RegExp(`(${JAPANESE.source} [A-Za-z0-9(])|([A-Za-z0-9)] ${JAPANESE.source})`);
  for (const [k, v] of Object.entries(MESSAGES.ja)) {
    assert.doesNotMatch(v, bad, k);
    assert.doesNotMatch(v, /ブラウザ(?!ー)|フォルダ(?!ー)|リポジトリ(?!ー)|ディレクトリ(?!ー)|サーバ(?!ー)|エディタ(?!ー)|ユーザ(?!ー)|カテゴリ(?!ー)/, k);
    assert.doesNotMatch(v, /(?<![自0-9０-９])分か(?!れ)/, k);
    assert.doesNotMatch(v, new RegExp(`${JAPANESE.source}:`), k);
    assert.doesNotMatch(v, /復号化|全て/, k);
  }
});

test('画面のスクリプトが使う文言のキーは、すべて辞書にある', () => {
  const src = read('js/app.js');
  const keys = new Set([...src.matchAll(/\bt\('([a-zA-Z0-9.-]+)'/g)].map((m) => m[1]));
  for (const m of src.matchAll(/'((?:err|otp|field|bench|byte|gl|cat)\.[a-zA-Z0-9.]+)'/g)) keys.add(m[1]);
  assert.ok(keys.size >= 40, String(keys.size));
  for (const g of GLOSSARY) {
    keys.add(`gl.${g.id}.term`).add(`gl.${g.id}.desc`).add(`cat.${g.category}`);
    if (g.link) keys.add(`gl.${g.id}.link`);
  }
  for (const k of keys) for (const lang of ['ja', 'en']) assert.ok(MESSAGES[lang][k] !== undefined, `${lang} ${k}`);
});

test('用語集: 28語、分野は4つ、id は重ならず、辞書にない語がない', () => {
  assert.equal(GLOSSARY.length, 28);
  assert.equal(new Set(GLOSSARY.map((g) => g.id)).size, 28);
  assert.deepEqual([...new Set(GLOSSARY.map((g) => g.category))].sort(), ['bit', 'crypto', 'logic', 'ml']);
  const terms = Object.keys(MESSAGES.ja).filter((k) => /^gl\.[a-z]+\.term$/.test(k)).map((k) => k.split('.')[1]);
  assert.deepEqual(terms.sort(), GLOSSARY.map((g) => g.id).sort());
  for (const g of GLOSSARY.filter((x) => x.link)) assert.match(g.link, /^https:\/\/ipusiron\.github\.io\//);
});

test('一次資料に合わない古い言い方を使わない（完全秘匿の条件・OTP の実用性・パーセプトロンの説明）', () => {
  const ja = MESSAGES.ja;
  const en = MESSAGES.en;
  // Shannon の条件は「鍵の数が平文の数以上」。OTP では同じ長さ
  for (const k of ['gl.perfect.desc', 'otp.note']) {
    assert.match(ja[k], /平文以上の長さ（OTPでは同じ長さ）/, k);
    assert.match(en[k], /at least as long as the plaintext \(the same length in an OTP\)/, k);
  }
  assert.match(ja['gl.shannon.desc'], /鍵の数が平文の数以上/);
  // OTP は機密性だけ（改ざんは防げない）
  assert.match(ja['otp.note'], /改ざんは防げない/);
  assert.match(ja['gl.strength.desc'], /情報理論的に安全/);
  // 単層パーセプトロンは線形分類器。「しきい値（活性化関数）」と混同しない
  for (const lang of ['ja', 'en']) {
    const all = Object.values(MESSAGES[lang]).join('\n');
    assert.doesNotMatch(all, /しきい値（活性化関数）|理論的に最大|組み込みシステムに最適|threshold \(activation function\)/);
  }
  assert.match(ja['gl.linclass.desc'], /線形分類器/);
  // 2入力の論理関数16個のうち、線形分離できないのは XOR と XNOR の2つ
  assert.match(ja['gl.linsep.desc'], /16個のうち、XORとXNORの2つだけ/);
  // NAND の歴史: Sheffer の記号は NOR の意味
  assert.match(ja['gl.nand.desc'], /Shefferの記号はNORの意味/);
});

test('文言に書いた例の数は、計算部と合う（HELLO ⊕ XMCKL・ステップ関数・速度の比較の時間）', () => {
  const c = C.toHex(C.xorPerceptron(C.utf8(C.SAMPLE.plain), C.utf8(C.SAMPLE.key)));
  assert.equal(c, '10 08 0F 07 03');
  assert.match(MESSAGES.ja['otp.sampleSetDecrypt'], new RegExp(`暗号文${c}・鍵${C.SAMPLE.key}。復号すると${C.SAMPLE.plain}`));
  assert.match(MESSAGES.en['otp.sampleSetDecrypt'], new RegExp(`ciphertext ${c}, key ${C.SAMPLE.key}; it decrypts to ${C.SAMPLE.plain}`));
  assert.match(MESSAGES.ja['otp.note'], new RegExp(`例の鍵${C.SAMPLE.key}は英大文字だけ`));
  assert.equal(C.step(0), 1);
  assert.match(MESSAGES.ja['gates.lead'], /このツールは1/);
  assert.match(MESSAGES.ja['bench.lead'], /10,000バイト/);
  assert.match(read('js/app.js'), /C\.bench\(\{ n: 10000, budgetMs: 100,/);
});

test('t は {name} を置き換え、ない鍵はキーをそのまま返す', () => {
  assert.equal(t('otp.info', { n: 5, hex: '48 45' }, 'ja'), '5バイト　16進数：48 45');
  assert.equal(t('otp.info', { n: 5, hex: '48 45' }, 'en'), '5 bytes   hex: 48 45');
  assert.equal(t('err.lengthMismatch', { field: '平文', a: 5, b: 3 }, 'ja').startsWith('鍵は平文と同じバイト数'), true);
  assert.equal(t('no.such.key', {}, 'ja'), 'no.such.key');
});
