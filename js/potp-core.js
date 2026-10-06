// Perceptron OTP Visualizer の計算部（DOM を使わない）。globalThis.PotpCore に置く
// - NAND だけで組むゲート（途中の値つき）と、固定の重みの単層パーセプトロン（NOT・AND・OR・NAND）
// - 2層パーセプトロンの XOR（第1層 OR・NAND、第2層 AND）と、それをビットごとに使うバイト列の XOR
// - ワンタイムパッドの入出力（テキスト〔UTF-8〕と16進数）、乱数の鍵、UTF-8 として読めるかの判定、速度の比較
(() => {
  'use strict';

  // ステップ関数。このツールでは z ≥ 0 のとき 1（z = 0 の値は文献によって 0・1/2・1 と分かれる）
  const step = (z) => (z >= 0 ? 1 : 0);

  // 2入力の4通り（a, b）。真理値表の行の順
  const PAIRS = [[0, 0], [0, 1], [1, 0], [1, 1]];

  // ---- NAND だけで組むゲート ----
  const NAND = (a, b) => (a & b ? 0 : 1);

  // NOT(a) = NAND(a, a)
  function nandNot(a) {
    return { z: NAND(a, a) };
  }

  // AND(a, b) = NAND(t, t)、t = NAND(a, b)
  function nandAnd(a, b) {
    const t = NAND(a, b);
    return { t, z: NAND(t, t) };
  }

  // OR(a, b) = NAND(t, s)、t = NAND(a, a)、s = NAND(b, b)
  function nandOr(a, b) {
    const t = NAND(a, a);
    const s = NAND(b, b);
    return { t, s, z: NAND(t, s) };
  }

  // XOR(a, b) = NAND(t, u)、s = NAND(a, b)、t = NAND(a, s)、u = NAND(b, s)
  function nandXor(a, b) {
    const s = NAND(a, b);
    const t = NAND(a, s);
    const u = NAND(b, s);
    return { s, t, u, z: NAND(t, u) };
  }

  // ---- 単層パーセプトロン（重み w とバイアス b。出力 = step(w·x + b)） ----
  const PERCEPTRONS = {
    NOT: { w: [-1], b: 0.5 },
    AND: { w: [1, 1], b: -1.5 },
    OR: { w: [1, 1], b: -0.5 },
    NAND: { w: [-1, -1], b: 1.5 }
  };
  const GATES = Object.keys(PERCEPTRONS);

  // 重み付きの和 s と出力 y
  function neuron(p, inputs) {
    let s = p.b;
    p.w.forEach((w, i) => {
      s += w * inputs[i];
    });
    return { s, y: step(s) };
  }

  function gate(name, a, b) {
    const p = PERCEPTRONS[name];
    if (!p) throw new Error(`unknown gate: ${name}`);
    return neuron(p, name === 'NOT' ? [a] : [a, b]);
  }

  // 2層の XOR: 第1層 h1 = OR(a, b)、h2 = NAND(a, b)、第2層 out = AND(h1, h2)
  function mlpXor(a, b) {
    const h1 = gate('OR', a, b);
    const h2 = gate('NAND', a, b);
    const out = gate('AND', h1.y, h2.y);
    return { h1, h2, out, y: out.y };
  }

  // ---- 真理値表（まとめ）。各行は数値の配列 ----
  // NAND だけで組んだもの: a, b, NOT a, AND, OR, XOR
  const nandSummary = () => PAIRS.map(([a, b]) => [a, b, nandNot(a).z, nandAnd(a, b).z, nandOr(a, b).z, nandXor(a, b).z]);
  // 単層パーセプトロン: a, b, NOT a, AND, OR, NAND
  const perceptronSummary = () => PAIRS.map(([a, b]) => [a, b, gate('NOT', a).y, gate('AND', a, b).y, gate('OR', a, b).y, gate('NAND', a, b).y]);
  // 2層の XOR: a, b, h1（OR）, h2（NAND）, 出力（AND）, a ^ b（JavaScript の演算子で比べる）
  const mlpSummary = () => PAIRS.map(([a, b]) => {
    const r = mlpXor(a, b);
    return [a, b, r.h1.y, r.h2.y, r.y, a ^ b];
  });

  // ---- バイト列 ----
  // 1回に扱う入力の上限（バイト）
  const MAX_BYTES = 65536;
  // ビットの図に出すバイト数の上限
  const VIZ_BYTES = 16;

  const utf8 = (text) => new TextEncoder().encode(String(text));

  // UTF-8 として厳密に読めるか。読めないときは置換文字（U+FFFD）入りの文字列も返す。先頭の BOM も文字として残す
  function decodeUtf8(bytes) {
    try {
      return { ok: true, text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes) };
    } catch {
      return { ok: false, text: new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes) };
    }
  }

  // 16進数の表示（大文字、1バイトごとに空白）
  const toHex = (bytes, sep = ' ') => Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(sep);
  const toBits = (byte) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1);

  // 16進数を読む。空白・改行・コロン・カンマ・ハイフンは区切りとして読み飛ばす。先頭の 0x は付けてもよい（バイトごと）
  // 失敗したときは { ok: false, error: 'hexChar', pos（1始まりの文字の位置）, char } か { ok: false, error: 'hexOdd' }
  function parseHex(str) {
    const chars = [...String(str)];
    const digits = [];
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (/[\s:,-]/.test(c)) continue;
      if (c === '0' && (chars[i + 1] === 'x' || chars[i + 1] === 'X') && digits.length % 2 === 0) {
        i++;
        continue;
      }
      if (!/[0-9a-fA-F]/.test(c)) return { ok: false, error: 'hexChar', pos: i + 1, char: c };
      digits.push(c);
    }
    if (digits.length % 2) return { ok: false, error: 'hexOdd' };
    const bytes = new Uint8Array(digits.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(digits[2 * i] + digits[2 * i + 1], 16);
    return { ok: true, bytes };
  }

  // 入力欄の値をバイト列に。format は 'text'（UTF-8）か 'hex'
  function parseInput(value, format) {
    const r = format === 'hex' ? parseHex(value) : { ok: true, bytes: utf8(value) };
    if (r.ok && r.bytes.length > MAX_BYTES) return { ok: false, error: 'tooLong', length: r.bytes.length };
    return r;
  }

  const equalBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

  // JavaScript の演算子 ^ でのバイト列の XOR
  function xorNative(a, b) {
    const out = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
    return out;
  }

  // 2層パーセプトロンの XOR を、各バイトの8ビットに1つずつ使う
  function xorPerceptron(a, b) {
    const out = new Uint8Array(a.length);
    for (let i = 0; i < a.length; i++) {
      let byte = 0;
      for (let bit = 7; bit >= 0; bit--) byte |= mlpXor((a[i] >> bit) & 1, (b[i] >> bit) & 1).y << bit;
      out[i] = byte;
    }
    return out;
  }

  // 1バイトの計算の過程（MSB→LSB）。入力 x・鍵 k・第1層 h1（OR）・h2（NAND）・出力 y（AND）
  function byteTrace(x, k) {
    const bits = toBits(x).map((xb, i) => {
      const kb = (k >> (7 - i)) & 1;
      const r = mlpXor(xb, kb);
      return { x: xb, k: kb, h1: r.h1.y, h2: r.h2.y, y: r.y };
    });
    return { x, k, y: bits.reduce((acc, b) => (acc << 1) | b.y, 0), bits };
  }

  // 各バイトがどの文字の何バイト目か。UTF-8 として読めないバイトは char: null
  // 戻り値の要素: { char, part（1始まり）, size, cp }
  function byteOwners(bytes) {
    const owners = [];
    const strict = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      const size = b < 0x80 ? 1 : b >= 0xc2 && b <= 0xdf ? 2 : b >= 0xe0 && b <= 0xef ? 3 : b >= 0xf0 && b <= 0xf4 ? 4 : 0;
      let ch = null;
      if (size && i + size <= bytes.length) {
        try {
          ch = strict.decode(bytes.subarray(i, i + size));
        } catch {
          ch = null;
        }
      }
      if (ch === null) {
        owners.push({ char: null, part: 1, size: 1, cp: null });
        i++;
        continue;
      }
      for (let j = 0; j < size; j++) owners.push({ char: ch, part: j + 1, size, cp: ch.codePointAt(0) });
      i += size;
    }
    return owners;
  }

  // 制御文字（C0・DEL・C1）。テキストとしてコピーすると変わったり消えたりする
  const isControl = (cp) => cp !== null && (cp < 0x20 || (cp >= 0x7f && cp <= 0x9f));

  // 出力をテキストとして見せてよいか: UTF-8 として読めるか、制御文字の数、CR（textarea で LF に変わる）を含むか
  function textSafety(bytes) {
    const d = decodeUtf8(bytes);
    let controls = 0;
    for (const ch of d.text) if (isControl(ch.codePointAt(0))) controls++;
    return { valid: d.ok, controls, hasCR: bytes.includes(0x0d), text: d.text };
  }

  // 乱数の鍵（暗号論的に安全な乱数）。fill は crypto.getRandomValues と同じ形の関数。1回に 65,536 バイトまでなので分けて呼ぶ
  function randomBytes(n, fill) {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i += 65536) fill(out.subarray(i, Math.min(n, i + 65536)));
    return out;
  }

  // 例: 平文 HELLO と鍵 XMCKL（暗号文は 10 08 0F 07 03）。教材用の固定の鍵で、一様な乱数ではない
  const SAMPLE = { plain: 'HELLO', key: 'XMCKL' };

  // 速度の比較。同じ乱数の入力（n バイト）に対し、それぞれ budgetMs 以上くり返して、1バイトあたりの時間を出す
  // （1回だけ測ると、performance.now() の刻み〔Chromium 0.1ms、Firefox・Safari 1ms〕より短く 0 になる）
  function bench({ n = 10000, budgetMs = 100, now, fill }) {
    const a = randomBytes(n, fill);
    const b = randomBytes(n, fill);
    const run = (fn) => {
      let reps = 0;
      let out;
      const t0 = now();
      let t1 = t0;
      do {
        out = fn(a, b);
        reps++;
        t1 = now();
      } while (t1 - t0 < budgetMs);
      const ms = t1 - t0;
      return { out, reps, ms, nsPerByte: (ms * 1e6) / (reps * n) };
    };
    const native = run(xorNative);
    const perceptron = run(xorPerceptron);
    return { n, native, perceptron, ratio: perceptron.nsPerByte / native.nsPerByte, equal: equalBytes(native.out, perceptron.out) };
  }

  globalThis.PotpCore = {
    step, PAIRS, NAND, nandNot, nandAnd, nandOr, nandXor,
    PERCEPTRONS, GATES, neuron, gate, mlpXor, nandSummary, perceptronSummary, mlpSummary,
    MAX_BYTES, VIZ_BYTES, utf8, decodeUtf8, toHex, toBits, parseHex, parseInput, equalBytes,
    xorNative, xorPerceptron, byteTrace, byteOwners, isControl, textSafety, randomBytes, SAMPLE, bench
  };
})();
