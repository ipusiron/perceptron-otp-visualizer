# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perceptron OTP Visualizer is an educational tool that visualizes logic gates built from NAND, the same gates built from perceptrons, XOR from a two-layer perceptron, and a one-time pad (OTP) computed with that perceptron XOR. The project is part of the "100 Security Tools with Generative AI" series (Day 057).

## Architecture

A single static page with plain scripts (no build, no dependencies, no CDN):

```
index.html            # Six tabs (NAND universality, Perceptron gates, Perceptron XOR, Perceptron OTP, 16 functions and OTP, Glossary); meta CSP is 'self' only
style.css             # Color tokens for light/dark (OS setting or manual), layout, mobile rules
js/potp-core.js       # PotpCore: NAND gates, perceptrons (PERCEPTRONS, gate, mlpXor), byte XOR (xorPerceptron, xorNative),
                      #   hex/UTF-8 input (parseHex, parseInput, decodeUtf8, byteOwners, textSafety), randomBytes, bench,
                      #   the 16 two-input functions (FUNCTIONS, applyFunction, recoverWithKey, leakWithoutKey)
js/messages.js        # PotpMessages: ja/en dictionary (t), glossary order (GLOSSARY, 29 terms)
js/i18n.js            # PotpI18n: language detection (?lang= → stored → navigator), data-i18n / data-i18n-attr
js/theme.js           # PotpTheme: light/dark toggle
js/theme-init.js      # Applies the saved theme before drawing
js/app.js             # UI only: APG tabs, truth-table rows (click/keys), OTP form and result, bit view, benchmark, 16-function table and input plane, glossary
notebooks/            # Jupyter notebook (Python version of the gates and decision boundaries)
test/                 # node --test (core, html, messages, i18n, contrast, format, readme)
```

## Key Implementation Details

- Perceptron weights: NOT `step(-a + 0.5)`, AND `step(a + b - 1.5)`, OR `step(a + b - 0.5)`, NAND `step(-a - b + 1.5)`; step(z) = 1 if z ≥ 0
- XOR: layer 1 h1 = OR(a, b), h2 = NAND(a, b); layer 2 AND(h1, h2)
- OTP output is computed with the perceptron XOR (`xorPerceptron`) and checked against the operator `^` for every byte
- Inputs and keys can be text (UTF-8) or hex. Ciphertext is passed to decryption in hex, because text loses CR (textarea turns it into LF) and invalid UTF-8 (U+FFFD)
- Example: HELLO ⊕ XMCKL = `10 08 0F 07 03` (the key is an example, not random). "Make a random key" uses `crypto.getRandomValues`
- Limits: 65,536 bytes per input; the bit view shows the first 16 bytes
- 16 functions: f(p, k) with the truth table [f(0,0), f(0,1), f(1,0), f(1,1)] = the 4 bits of n. Decryptable = f(0,k) ≠ f(1,k) for both k; perfectly secret = P(C=1) does not depend on P for a uniform key. 14 are single-layer; only XOR and XNOR are both decryptable and perfectly secret (exactly the two that are not linearly separable). This is checked for 2 inputs only
- Benchmark repeats each method for at least 100 ms and divides by repetitions (performance.now() resolution is 0.1 ms in Chromium, 1 ms in Firefox/Safari)
- Static text is in `js/messages.js`; HTML holds the Japanese defaults with `data-i18n`. Rendering uses textContent only (no innerHTML)
- localStorage (language, theme) is read and written inside try/catch

## Development Commands

```bash
npm test                      # node --test, Node.js 22+, no dependencies
python -m http.server 8000    # then open http://localhost:8000/ (file:// also works)
```

## Testing Approach

- `test/core.test.js`: gates, perceptron sums, XOR for all 256×256 byte pairs, the HELLO example, hex parsing, UTF-8 checks, round trips, random keys, benchmark with a fake clock
- `test/html.test.js`: CSP, scripts, ARIA tabs, labels, static truth tables and SVG weights against the core, data-i18n defaults
- `test/messages.test.js`: ja/en keys, no Japanese in English, writing rules, facts checked against primary sources
- `test/contrast.test.js`: 4.5:1 for text, 3:1 for borders, in light and dark
- `test/readme.test.js`: README structure and tables against the core

## Important Notes

- Educational tool, not for production cryptography. Weights are fixed by hand (no training)
- An OTP is perfectly secret only with a uniformly random key at least as long as the plaintext, used once and kept secret; it does not stop tampering
- GitHub Pages cannot set response headers; frame-ancestors and X-Frame-Options do not work in a meta element
- Deployed via GitHub Pages: https://ipusiron.github.io/perceptron-otp-visualizer/
