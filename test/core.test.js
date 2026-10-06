import test from 'node:test';
import assert from 'node:assert/strict';
import { core, seeded } from './load.js';

const C = core();
const bytes = (...xs) => Uint8Array.from(xs);
// 種つきの乱数で crypto.getRandomValues の代わり
const fakeFill = (seed) => {
  const r = seeded(seed);
  return (arr) => {
    for (let i = 0; i < arr.length; i++) arr[i] = r(256);
    return arr;
  };
};

test('ステップ関数は z ≥ 0 で 1、z < 0 で 0', () => {
  assert.equal(C.step(0), 1);
  assert.equal(C.step(0.5), 1);
  assert.equal(C.step(-0.5), 0);
  assert.equal(C.step(-1e-9), 0);
});

test('NAND だけで組んだ NOT・AND・OR・XOR は、論理演算子の結果と同じ（途中の値も画面の表と同じ）', () => {
  for (const [a, b] of C.PAIRS) {
    assert.equal(C.nandNot(a).z, 1 - a);
    assert.equal(C.nandAnd(a, b).z, a & b);
    assert.equal(C.nandOr(a, b).z, a | b);
    assert.equal(C.nandXor(a, b).z, a ^ b);
    assert.equal(C.nandAnd(a, b).t, 1 - (a & b));
    assert.deepEqual([C.nandOr(a, b).t, C.nandOr(a, b).s], [1 - a, 1 - b]);
  }
  // XOR の途中の値（a=1, b=1 の行: s=0, t=1, u=1, z=0）
  assert.deepEqual(C.nandXor(1, 1), { s: 0, t: 1, u: 1, z: 0 });
  assert.deepEqual(C.nandXor(0, 1), { s: 1, t: 1, u: 0, z: 1 });
});

test('単層パーセプトロンの重みとバイアスは画面の式どおり（NOT=step(-a+0.5) ほか）', () => {
  assert.deepEqual(C.PERCEPTRONS, {
    NOT: { w: [-1], b: 0.5 },
    AND: { w: [1, 1], b: -1.5 },
    OR: { w: [1, 1], b: -0.5 },
    NAND: { w: [-1, -1], b: 1.5 }
  });
  assert.deepEqual(C.GATES, ['NOT', 'AND', 'OR', 'NAND']);
  assert.throws(() => C.gate('XOR', 0, 1), /unknown gate/);
});

test('単層パーセプトロンの総和 s と出力は、画面の真理値表の数と同じ', () => {
  // 画面の表の「-a + 0.5」「a + b - 1.5」「a + b - 0.5」「-a - b + 1.5」の列
  assert.deepEqual([0, 1].map((a) => C.gate('NOT', a).s), [0.5, -0.5]);
  assert.deepEqual(C.PAIRS.map(([a, b]) => C.gate('AND', a, b).s), [-1.5, -0.5, -0.5, 0.5]);
  assert.deepEqual(C.PAIRS.map(([a, b]) => C.gate('OR', a, b).s), [-0.5, 0.5, 0.5, 1.5]);
  assert.deepEqual(C.PAIRS.map(([a, b]) => C.gate('NAND', a, b).s), [1.5, 0.5, 0.5, -0.5]);
  for (const [a, b] of C.PAIRS) {
    assert.equal(C.gate('NOT', a).y, 1 - a);
    assert.equal(C.gate('AND', a, b).y, a & b);
    assert.equal(C.gate('OR', a, b).y, a | b);
    assert.equal(C.gate('NAND', a, b).y, 1 - (a & b));
  }
});

test('2層の XOR は第1層 OR・NAND、第2層 AND で、4通りとも a ^ b と同じ', () => {
  for (const [a, b] of C.PAIRS) {
    const r = C.mlpXor(a, b);
    assert.equal(r.h1.y, a | b);
    assert.equal(r.h2.y, 1 - (a & b));
    assert.equal(r.y, a ^ b);
    assert.equal(r.out.y, r.y);
  }
  // 画面の図の初期値（a=0, b=0）: s1=-0.5, h1=0, s2=1.5, h2=1, s3=-0.5, z=0
  const r = C.mlpXor(0, 0);
  assert.deepEqual([r.h1.s, r.h1.y, r.h2.s, r.h2.y, r.out.s, r.y], [-0.5, 0, 1.5, 1, -0.5, 0]);
});

test('真理値表のまとめ（NAND・単層パーセプトロン・2層の XOR）', () => {
  assert.deepEqual(C.nandSummary(), [[0, 0, 1, 0, 0, 0], [0, 1, 1, 0, 1, 1], [1, 0, 0, 0, 1, 1], [1, 1, 0, 1, 1, 0]]);
  assert.deepEqual(C.perceptronSummary(), [[0, 0, 1, 0, 0, 1], [0, 1, 1, 0, 1, 1], [1, 0, 0, 0, 1, 1], [1, 1, 0, 1, 1, 0]]);
  assert.deepEqual(C.mlpSummary(), [[0, 0, 0, 1, 0, 0], [0, 1, 1, 1, 1, 1], [1, 0, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0]]);
});

test('パーセプトロンのバイトの XOR は、256×256 の全組でネイティブの ^ と同じ', () => {
  const a = new Uint8Array(65536);
  const b = new Uint8Array(65536);
  for (let i = 0; i < 65536; i++) {
    a[i] = i >> 8;
    b[i] = i & 255;
  }
  assert.ok(C.equalBytes(C.xorPerceptron(a, b), C.xorNative(a, b)));
});

test('例の HELLO ⊕ XMCKL は 10 08 0F 07 03 で、同じ鍵で戻すと HELLO（改修前の復号の例は 10 08 0F 0F 1B で HELDW だった）', () => {
  const p = C.utf8(C.SAMPLE.plain);
  const k = C.utf8(C.SAMPLE.key);
  const c = C.xorPerceptron(p, k);
  assert.equal(C.toHex(c), '10 08 0F 07 03');
  assert.equal(C.decodeUtf8(C.xorPerceptron(c, k)).text, 'HELLO');
  assert.equal(C.decodeUtf8(C.xorPerceptron(bytes(0x10, 0x08, 0x0f, 0x0f, 0x1b), k)).text, 'HELDW');
});

test('1バイトの計算の過程は MSB→LSB で、各ビットの h1・h2・出力が OR・NAND・AND', () => {
  const t = C.byteTrace(0x48, 0x58); // 'H' と 'X'
  assert.equal(t.y, 0x10);
  assert.deepEqual(t.bits.map((b) => b.x), [0, 1, 0, 0, 1, 0, 0, 0]);
  assert.deepEqual(t.bits.map((b) => b.k), [0, 1, 0, 1, 1, 0, 0, 0]);
  for (const b of t.bits) {
    assert.equal(b.h1, b.x | b.k);
    assert.equal(b.h2, 1 - (b.x & b.k));
    assert.equal(b.y, b.h1 & b.h2);
  }
});

test('16進数を読む: 区切り・0x・大文字小文字を受け付け、誤りは位置（1始まり）を返す', () => {
  assert.deepEqual(C.parseHex('10 08 0f 07 03'), { ok: true, bytes: bytes(0x10, 0x08, 0x0f, 0x07, 0x03) });
  assert.deepEqual(C.parseHex('0x10,0x08\n0F:07-03'), { ok: true, bytes: bytes(0x10, 0x08, 0x0f, 0x07, 0x03) });
  assert.deepEqual(C.parseHex(''), { ok: true, bytes: bytes() });
  assert.deepEqual(C.parseHex('10 0G'), { ok: false, error: 'hexChar', pos: 5, char: 'G' });
  assert.deepEqual(C.parseHex('あ0'), { ok: false, error: 'hexChar', pos: 1, char: 'あ' });
  assert.deepEqual(C.parseHex('10 0'), { ok: false, error: 'hexOdd' });
  assert.equal(C.toHex(bytes(0, 10, 255)), '00 0A FF');
  assert.equal(C.toHex(bytes(0, 10, 255), ''), '000AFF');
});

test('入力の読み取り: テキストは UTF-8、16進数は parseHex、上限を超えると tooLong', () => {
  assert.deepEqual(C.parseInput('café', 'text'), { ok: true, bytes: bytes(0x63, 0x61, 0x66, 0xc3, 0xa9) });
  assert.deepEqual(C.parseInput('63 61', 'hex'), { ok: true, bytes: bytes(0x63, 0x61) });
  assert.deepEqual(C.parseInput('a'.repeat(C.MAX_BYTES + 1), 'text'), { ok: false, error: 'tooLong', length: C.MAX_BYTES + 1 });
  assert.equal(C.parseInput('a'.repeat(C.MAX_BYTES), 'text').ok, true);
});

test('0x80 以上や CR を含む暗号文も、16進数で受け渡せば往復できる（テキストでは改修前に壊れた例）', () => {
  for (const [plain, key] of [['café', 'kkkkk'], ['é', 'ab'], ['あ', '\u0001\u0001\u0001'], ['😀', 'abcd']]) {
    const p = C.utf8(plain);
    const k = C.utf8(key);
    const c = C.xorPerceptron(p, k);
    const back = C.xorPerceptron(C.parseHex(C.toHex(c)).bytes, k);
    assert.equal(C.decodeUtf8(back).text, plain);
  }
  // café ⊕ kkkkk の暗号文は CR（0D）と、UTF-8 として読めない A8 C2 を含む
  const c = C.xorPerceptron(C.utf8('café'), C.utf8('kkkkk'));
  assert.equal(C.toHex(c), '08 0A 0D A8 C2');
  assert.deepEqual(C.textSafety(c), { valid: false, controls: 3, hasCR: true, text: '\b\n\r\ufffd\ufffd' });
});

test('UTF-8 の判定: 正しく読める日本語では警告の材料を出さない（改修前は「印字できない」と出た）', () => {
  assert.deepEqual(C.textSafety(C.utf8('あ')), { valid: true, controls: 0, hasCR: false, text: 'あ' });
  assert.deepEqual(C.textSafety(C.utf8('HELLO')), { valid: true, controls: 0, hasCR: false, text: 'HELLO' });
  // C1 制御文字（U+0085）と DEL も制御文字に数える
  assert.equal(C.textSafety(bytes(0xc2, 0x85, 0x7f)).controls, 2);
  assert.equal(C.decodeUtf8(bytes(0xef, 0xbb, 0xbf, 0x41)).text, '\ufeffA');
  assert.equal(C.decodeUtf8(bytes(0xff)).ok, false);
});

test('各バイトがどの文字の何バイト目か（読めないバイトは char: null）', () => {
  const o = C.byteOwners(C.utf8('aé😀'));
  assert.deepEqual(o.map((x) => [x.char, x.part, x.size]), [['a', 1, 1], ['é', 1, 2], ['é', 2, 2], ['😀', 1, 4], ['😀', 2, 4], ['😀', 3, 4], ['😀', 4, 4]]);
  assert.deepEqual(C.byteOwners(bytes(0xa8, 0xc2)).map((x) => x.char), [null, null]);
  // 途中で切れた文字（E3 81）と、続きのある正しい文字
  assert.deepEqual(C.byteOwners(bytes(0xe3, 0x81, 0x41)).map((x) => x.char), [null, null, 'A']);
  assert.deepEqual(C.byteOwners(bytes(0xc0, 0x80)).map((x) => x.char), [null, null]);
  assert.equal(C.byteOwners(bytes(0x0a))[0].cp, 10);
  assert.ok(C.isControl(10) && C.isControl(0x7f) && C.isControl(0x9f) && !C.isControl(0x20) && !C.isControl(null));
});

test('乱数の鍵: 指定のバイト数を、渡した乱数の関数で埋める（65,536 バイトずつ）', () => {
  const calls = [];
  const fill = (arr) => {
    calls.push(arr.length);
    arr.fill(7);
    return arr;
  };
  const k = C.randomBytes(70000, fill);
  assert.equal(k.length, 70000);
  assert.deepEqual(calls, [65536, 4464]);
  assert.ok(k.every((v) => v === 7));
  assert.equal(C.randomBytes(0, fill).length, 0);
});

test('速度の比較: 予算の時間までくり返し、1バイトあたりの時間と全バイトの一致を返す（0 で割らない）', () => {
  let t = 0;
  // 呼ぶたびに 0.25ms 進む時計（刻みより短い処理でも回数で割る）
  const now = () => {
    t += 0.25;
    return t;
  };
  const r = C.bench({ n: 64, budgetMs: 2, now, fill: fakeFill(1) });
  assert.equal(r.equal, true);
  assert.equal(r.n, 64);
  assert.ok(r.native.reps >= 8 && r.perceptron.reps >= 8, `${r.native.reps} ${r.perceptron.reps}`);
  assert.ok(r.native.ms >= 2 && r.perceptron.ms >= 2);
  assert.ok(Number.isFinite(r.ratio) && r.ratio > 0);
  assert.ok(Number.isFinite(r.native.nsPerByte) && r.native.nsPerByte > 0);
});

test('例の鍵の注意: XMCKL は英大文字だけで、一様な乱数の鍵ではない', () => {
  assert.match(C.SAMPLE.key, /^[A-Z]+$/);
  assert.equal(C.utf8(C.SAMPLE.plain).length, C.utf8(C.SAMPLE.key).length);
  assert.ok(C.VIZ_BYTES >= 8 && C.VIZ_BYTES <= 32);
});

test('2入力の論理関数16個: 番号と真理値表と名前が合う（f(0,0) が最上位の桁）', () => {
  assert.equal(C.FUNCTIONS.length, 16);
  assert.equal(new Set(C.FUNCTION_NAMES).size, 16);
  const ops = {
    FALSE: () => 0, AND: (p, k) => p & k, 'P∧¬K': (p, k) => p & (1 - k), P: (p) => p, '¬P∧K': (p, k) => (1 - p) & k, K: (p, k) => k,
    XOR: (p, k) => p ^ k, OR: (p, k) => p | k, NOR: (p, k) => 1 - (p | k), XNOR: (p, k) => 1 - (p ^ k), '¬K': (p, k) => 1 - k,
    'P∨¬K': (p, k) => p | (1 - k), '¬P': (p) => 1 - p, '¬P∨K': (p, k) => (1 - p) | k, NAND: (p, k) => 1 - (p & k), TRUE: () => 1
  };
  for (const f of C.FUNCTIONS) {
    assert.deepEqual(f.tt, C.PAIRS.map(([p, k]) => ops[f.name](p, k)), f.name);
    assert.equal(parseInt(f.tt.join(''), 2), f.n, f.name);
  }
  assert.deepEqual(C.truthTable(6), [0, 1, 1, 0]);
  assert.equal(C.fnValue([0, 1, 1, 0], 1, 0), 1);
});

test('単層で作れるのは14個で、重みとバイアスの例はどれも真理値表どおり。作れないのは XOR と XNOR だけ', () => {
  const sep = C.FUNCTIONS.filter((f) => f.separable);
  assert.equal(sep.length, 14);
  assert.deepEqual(C.FUNCTIONS.filter((f) => !f.separable).map((f) => f.name), ['XOR', 'XNOR']);
  for (const f of sep) {
    for (const [p, k] of C.PAIRS) assert.equal(C.step(f.weights.w[0] * p + f.weights.w[1] * k + f.weights.b), C.fnValue(f.tt, p, k), f.name);
  }
  // AND・OR・NAND の例は②のパーセプトロンと同じ重み
  const byName = Object.fromEntries(C.FUNCTIONS.map((f) => [f.name, f]));
  for (const g of ['AND', 'OR', 'NAND']) assert.deepEqual(byName[g].weights, C.PERCEPTRONS[g], g);
  // XOR はもっと広い範囲（-4〜4 の 0.25 刻み）の重みでも作れない
  const grid = Array.from({ length: 33 }, (_, i) => -4 + i * 0.25);
  let found = 0;
  for (const w1 of grid) for (const w2 of grid) for (const b of grid) {
    if (C.PAIRS.every(([p, k]) => C.step(w1 * p + w2 * k + b) === (p ^ k))) found++;
  }
  assert.equal(found, 0);
});

test('鍵で戻せるのは4個、完全秘匿は6個、両方を満たす（OTP に使える）のは XOR と XNOR だけ', () => {
  const names = (pred) => C.FUNCTIONS.filter(pred).map((f) => f.name);
  assert.deepEqual(names((f) => f.invertible), ['P', 'XOR', 'XNOR', '¬P']);
  assert.deepEqual(names((f) => f.secret), ['FALSE', 'K', 'XOR', 'XNOR', '¬K', 'TRUE']);
  assert.deepEqual(names((f) => f.otp), ['XOR', 'XNOR']);
  // OTP に使える2つは、単層で作れない2つと同じ
  assert.deepEqual(names((f) => f.otp), names((f) => !f.separable));
  // C = 1 となる確率（P = 0 のとき、P = 1 のとき）
  const byName = Object.fromEntries(C.FUNCTIONS.map((f) => [f.name, f]));
  assert.deepEqual(byName.AND.p1, [0, 0.5]);
  assert.deepEqual(byName.XOR.p1, [0.5, 0.5]);
  assert.deepEqual(byName.P.p1, [0, 1]);
});

test('16関数の実験: XOR は鍵で全部戻り鍵なしでは1ビットも決まらない。AND・P・K の例', () => {
  const byName = Object.fromEntries(C.FUNCTIONS.map((f) => [f.name, f]));
  const p = C.utf8('HELLO');
  const k = C.utf8(C.SAMPLE.key);
  const run = (name) => {
    const f = byName[name];
    const c = C.applyFunction(f.tt, p, k);
    return { c, rec: C.recoverWithKey(f.tt, c, k), leak: C.leakWithoutKey(f.tt, c) };
  };
  const x = run('XOR');
  assert.equal(C.toHex(x.c), '10 08 0F 07 03');
  assert.deepEqual([C.decodeUtf8(x.rec.bytes).text, x.rec.unknownBits, x.leak.knownBits], ['HELLO', 0, 0]);
  const xn = run('XNOR');
  assert.equal(C.toHex(xn.c), 'EF F7 F0 F8 FC');
  assert.deepEqual([C.decodeUtf8(xn.rec.bytes).text, xn.rec.unknownBits, xn.leak.knownBits], ['HELLO', 0, 0]);
  // C = P: 鍵がなくても40ビットすべて決まる
  const id = run('P');
  assert.deepEqual([C.decodeUtf8(id.c).text, id.leak.knownBits, C.decodeUtf8(id.leak.bytes).text], ['HELLO', 40, 'HELLO']);
  // C = K: 平文の情報は暗号文にないので、鍵があっても戻せない（40ビットとも決まらない）
  const kk = run('K');
  assert.deepEqual([C.toHex(kk.c), kk.rec.unknownBits, kk.leak.knownBits], [C.toHex(k), 40, 0]);
  // AND: 暗号文の1のビットは平文も1と決まる。鍵があっても、鍵が0のビットは戻せない
  const a = run('AND');
  const ones = (bytes) => [...bytes].reduce((s, v) => s + v.toString(2).split('').filter((ch) => ch === '1').length, 0);
  assert.equal(a.leak.knownBits, ones(a.c));
  assert.equal(a.rec.unknownBits, 40 - ones(k));
  assert.equal(ones(C.xorNative(a.leak.bytes, C.applyFunction(byName.AND.tt, a.leak.bytes, a.leak.known))), 0);
});
