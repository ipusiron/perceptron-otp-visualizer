# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perceptron OTP Visualizer is an educational tool that visualizes logic gates, perceptron implementations, and demonstrates OTP (One-Time Pad) cryptography through perceptron analogy. The project is part of the "100 Security Tools with Generative AI" series (Day 057).

## Architecture

The project is a single-page web application with vanilla JavaScript:
- **index.html**: Main page with 5 tabs (NAND Universal, Perceptron Gates, Perceptron XOR, Perceptron OTP, Glossary)
- **script.js**: Core logic implementing NAND gates, perceptron functions, XOR layers, and OTP encryption/decryption
- **style.css**: Visual styling with gradient themes and responsive design
- Uses MathJax CDN for mathematical notation rendering

## Key Implementation Details

### Logic Functions (script.js)
- NAND-based implementations: `NAND_NOT`, `NAND_AND`, `NAND_OR`, `NAND_XOR`
- Perceptron gates: `P_NOT`, `P_AND`, `P_OR`, `P_NAND` using step function
- Two-layer XOR: `OR_unit`, `NAND_unit`, `AND_unit` for multi-layer perceptron
- UTF-8 encoding/decoding for OTP operations

### Visualization Features
- Real-time updates when inputs change
- Truth table generation for all gate types
- Bit-by-bit visualization for OTP operations (MSB→LSB order)
- Performance benchmark comparing native XOR vs perceptron XOR

## Development Commands

### Local Development
```bash
# Open directly in browser (no build required)
python -m http.server 8000
# Then navigate to http://localhost:8000

# Or use any static file server
npx serve .
```

### Deployment
The project is deployed via GitHub Pages at: https://ipusiron.github.io/perceptron-otp-visualizer/

## Testing Approach
- Manual testing through the interactive UI
- Verify truth tables match expected logic gate outputs
- Test OTP encryption/decryption with sample text
- Ensure UTF-8 handling works correctly for multi-byte characters

## Important Notes
- This is an educational tool, NOT for production cryptography use
- Uses fixed weights for perceptron gates (no learning/training)
- Step function defined as: step(z) = 1 if z ≥ 0, else 0
- OTP requires key and plaintext to have identical byte length