// ===== Theme Toggle =====
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const moonIcon = document.querySelector('.moon-icon');
  const sunIcon = document.querySelector('.sun-icon');
  if (moonIcon && sunIcon) {
    // ライトモード時は月アイコン（ダークモードへの切り替えを示す）
    // ダークモード時は太陽アイコン（ライトモードへの切り替えを示す）
    if (theme === 'light') {
      moonIcon.style.display = 'block';
      sunIcon.style.display = 'none';
    } else {
      moonIcon.style.display = 'none';
      sunIcon.style.display = 'block';
    }
  }
}

// ===== Common utils =====
function step(z){ return z >= 0 ? 1 : 0; }
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function setBit(el, v){
  el.textContent = v;
  el.classList.toggle('v1', v === 1);
}
function toHex(bytes){ return Array.from(bytes).map(b=>b.toString(16).padStart(2,'0')).join(''); }
function encUTF8(str){ return new TextEncoder().encode(str); }
function decUTF8(bytes){ try{ return new TextDecoder().decode(bytes); }catch{ return ''; } }

// ===== NAND logic primitives =====
function NAND(a,b){ return (a & b) ? 0 : 1; }
function NAND_NOT(a){ return NAND(a,a); }
function NAND_AND(a,b){ const t = NAND(a,b); return NAND(t,t); }
function NAND_OR(a,b){ return NAND(NAND(a,a), NAND(b,b)); }
function NAND_XOR(a,b){
  const m = NAND(a,b);
  return NAND(NAND(a,m), NAND(b,m));
}

// ===== Perceptron single-layer gates =====
function P_NOT(a){ const s = -1*a + 0.5; return {s, y:step(s)}; }
function P_AND(a,b){ const s = 1*a + 1*b - 1.5; return {s, y:step(s)}; }
function P_OR(a,b){  const s = 1*a + 1*b - 0.5;  return {s, y:step(s)}; }
function P_NAND(a,b){const s = -1*a + -1*b + 1.5; return {s, y:step(s)}; }

// ===== Perceptron XOR (2-layer) =====
function OR_unit(x1,x2){ const s = 1*x1 + 1*x2 - 0.5; return {s, y:step(s)}; }
function NAND_unit(x1,x2){ const s = -1*x1 + -1*x2 + 1.5; return {s, y:step(s)}; }
function AND_unit(h1,h2){ const s = 1*h1 + 1*h2 - 1.5; return {s, y:step(s)}; }

// ===== Tabs =====
$$('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    $$('.tab').forEach(s=>s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// -----------------------------------------------------
// 1) NAND UNIVERSAL
// -----------------------------------------------------
// NANDゲートの構成は静的な真理値表で表示（動的な更新は不要）
// 全体の真理値表は引き続き利用可能
const nandTruthBody = $('#nand_truth_body');

// 全体真理値表の初期化（detailsが開かれた時に自動表示）
if(nandTruthBody) {
  [[0,0],[0,1],[1,0],[1,1]].forEach(([a,b])=>{
    const row = nandTruthBody.insertRow();
    [a,b,NAND_NOT(a),NAND_AND(a,b),NAND_OR(a,b),NAND_XOR(a,b)].forEach(v=>{
      const cell = row.insertCell();
      cell.textContent = v;
      if(v===1)cell.classList.add('v1');
    });
  });
}

// Interactive Gate Visualization
function initGateVisualization() {
  const interactiveTables = $$('.interactive-table');
  
  interactiveTables.forEach(table => {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    
    rows.forEach(row => {
      row.addEventListener('click', () => {
        // Remove highlight from all rows in this table
        rows.forEach(r => r.classList.remove('highlighted'));
        // Highlight clicked row
        row.classList.add('highlighted');
        
        // Get pattern and result from data attributes
        const pattern = row.getAttribute('data-pattern').split(',');
        const result = row.getAttribute('data-result');
        
        // Update gate display based on gate type
        const gateType = table.getAttribute('data-gate');
        updateGateDisplay(gateType, pattern, result, row);
      });
    });
    
    // Initialize with first row
    if(rows.length > 0) {
      rows[0].click();
    }
  });
}

function updateGateDisplay(gateType, pattern, result, row) {
  const card = row.closest('.neuron-card');
  
  if(gateType === 'not') {
    const a1 = $('#value-a1', card);
    const a2 = $('#value-a2', card);
    const z = $('#value-z', card);
    
    if(a1) a1.textContent = `a=${pattern[0]}`;
    if(a2) a2.textContent = `a=${pattern[0]}`;
    if(z) z.textContent = `z=${result}`;
  }
  
  if(gateType === 'and') {
    const a = $('#and-value-a', card);
    const b = $('#and-value-b', card);
    const t = $('#and-value-t', card);
    const z = $('#and-value-z', card);
    const intermediate = row.getAttribute('data-intermediate');
    
    if(a) a.textContent = `a=${pattern[0]}`;
    if(b) b.textContent = `b=${pattern[1]}`;
    if(t) t.textContent = `t=${intermediate}`;
    if(z) z.textContent = `z=${result}`;
  }
  
  if(gateType === 'or') {
    const a = $('#or-value-a', card);
    const b = $('#or-value-b', card);
    const t = $('#or-value-t', card);
    const s = $('#or-value-s', card);
    const z = $('#or-value-z', card);
    const intermediate1 = row.getAttribute('data-intermediate1');
    const intermediate2 = row.getAttribute('data-intermediate2');
    
    if(a) a.textContent = `a=${pattern[0]}`;
    if(b) b.textContent = `b=${pattern[1]}`;
    if(t) t.textContent = `t=${intermediate1}`;
    if(s) s.textContent = `s=${intermediate2}`;
    if(z) z.textContent = `z=${result}`;
  }
  
  if(gateType === 'xor') {
    const a = $('#xor-value-a', card);
    const b = $('#xor-value-b', card);
    const s = $('#xor-value-s', card);
    const t = $('#xor-value-t', card);
    const u = $('#xor-value-u', card);
    const z = $('#xor-value-z', card);
    const intermediate1 = row.getAttribute('data-intermediate1');
    const intermediate2 = row.getAttribute('data-intermediate2');
    const intermediate3 = row.getAttribute('data-intermediate3');
    
    if(a) a.textContent = `a=${pattern[0]}`;
    if(b) b.textContent = `b=${pattern[1]}`;
    if(s) s.textContent = `s=${intermediate1}`;
    if(t) t.textContent = `t=${intermediate2}`;
    if(u) u.textContent = `u=${intermediate3}`;
    if(z) z.textContent = `z=${result}`;
  }
}

// Helper function for scoped querySelector (already defined at top of file)

// -----------------------------------------------------
// 2) PERCEPTRON GATES
// -----------------------------------------------------
const pg_a = $('#pg_a'), pg_b = $('#pg_b');
const pgTruthBody = $('#pg_truth_body');

// New element IDs for individual gate visualizations
const pNotSum = $('#p-not-sum'), pNotOutput = $('#p-not-output');
const pAndSum = $('#p-and-sum'), pAndOutput = $('#p-and-output');
const pOrSum = $('#p-or-sum'), pOrOutput = $('#p-or-output');
const pNandSum = $('#p-nand-sum'), pNandOutput = $('#p-nand-output');

function updatePerceptronGates(){
  const a = parseInt(pg_a.value,10), b = parseInt(pg_b.value,10);

  // Update NOT gate
  const n = P_NOT(a);
  if(pNotSum) pNotSum.textContent = `s=${n.s.toFixed(1)}`;
  if(pNotOutput) pNotOutput.textContent = `z=${n.y}`;

  // Update AND gate
  const and = P_AND(a,b);
  if(pAndSum) pAndSum.textContent = `s=${and.s.toFixed(1)}`;
  if(pAndOutput) pAndOutput.textContent = `z=${and.y}`;

  // Update OR gate
  const o = P_OR(a,b);
  if(pOrSum) pOrSum.textContent = `s=${o.s.toFixed(1)}`;
  if(pOrOutput) pOrOutput.textContent = `z=${o.y}`;

  // Update NAND gate
  const nd = P_NAND(a,b);
  if(pNandSum) pNandSum.textContent = `s=${nd.s.toFixed(1)}`;
  if(pNandOutput) pNandOutput.textContent = `z=${nd.y}`;
  
  // Update interactive truth tables highlighting
  updatePerceptronTruthTables(a, b);
  
  // Update summary truth table
  renderPGTruth();
}

function updatePerceptronTruthTables(a, b) {
  // Update P-NOT truth table highlighting and diagram values
  const pNotTable = $('[data-gate="p-not"]');
  if (pNotTable) {
    const rows = pNotTable.querySelectorAll('tbody tr');
    rows.forEach(row => row.classList.remove('highlighted'));
    
    const targetPattern = `${a}`;
    const targetRow = pNotTable.querySelector(`[data-pattern="${targetPattern}"]`);
    if (targetRow) {
      targetRow.classList.add('highlighted');
      updatePerceptronDiagramValues('p-not', a, null);
    }
  }

  // Update P-AND truth table highlighting and diagram values
  const pAndTable = $('[data-gate="p-and"]');
  if (pAndTable) {
    const rows = pAndTable.querySelectorAll('tbody tr');
    rows.forEach(row => row.classList.remove('highlighted'));
    
    const targetPattern = `${a},${b}`;
    const targetRow = pAndTable.querySelector(`[data-pattern="${targetPattern}"]`);
    if (targetRow) {
      targetRow.classList.add('highlighted');
      updatePerceptronDiagramValues('p-and', a, b);
    }
  }

  // Update P-OR truth table highlighting and diagram values
  const pOrTable = $('[data-gate="p-or"]');
  if (pOrTable) {
    const rows = pOrTable.querySelectorAll('tbody tr');
    rows.forEach(row => row.classList.remove('highlighted'));
    
    const targetPattern = `${a},${b}`;
    const targetRow = pOrTable.querySelector(`[data-pattern="${targetPattern}"]`);
    if (targetRow) {
      targetRow.classList.add('highlighted');
      updatePerceptronDiagramValues('p-or', a, b);
    }
  }

  // Update P-NAND truth table highlighting and diagram values
  const pNandTable = $('[data-gate="p-nand"]');
  if (pNandTable) {
    const rows = pNandTable.querySelectorAll('tbody tr');
    rows.forEach(row => row.classList.remove('highlighted'));
    
    const targetPattern = `${a},${b}`;
    const targetRow = pNandTable.querySelector(`[data-pattern="${targetPattern}"]`);
    if (targetRow) {
      targetRow.classList.add('highlighted');
      updatePerceptronDiagramValues('p-nand', a, b);
    }
  }
}

function updatePerceptronDiagramValues(gateType, a, b) {
  if (gateType === 'p-not') {
    const n = P_NOT(a);
    const inputA = $('#p-not-value-a');
    const sumEl = $('#p-not-sum');
    const outputEl = $('#p-not-output');
    const valueZ = $('#p-not-value-z');
    
    if (inputA) inputA.textContent = `a=${a}`;
    if (sumEl) sumEl.textContent = `s=${n.s.toFixed(1)}`;
    if (outputEl) outputEl.textContent = `z=${n.y}`;
    if (valueZ) valueZ.textContent = `z=${n.y}`;
  }
  
  if (gateType === 'p-and') {
    const and = P_AND(a, b);
    const inputA = $('#p-and-value-a');
    const inputB = $('#p-and-value-b');
    const sumEl = $('#p-and-sum');
    const outputEl = $('#p-and-output');
    const valueZ = $('#p-and-value-z');
    
    if (inputA) inputA.textContent = `a=${a}`;
    if (inputB) inputB.textContent = `b=${b}`;
    if (sumEl) sumEl.textContent = `s=${and.s.toFixed(1)}`;
    if (outputEl) outputEl.textContent = `z=${and.y}`;
    if (valueZ) valueZ.textContent = `z=${and.y}`;
  }
  
  if (gateType === 'p-or') {
    const or = P_OR(a, b);
    const inputA = $('#p-or-value-a');
    const inputB = $('#p-or-value-b');
    const sumEl = $('#p-or-sum');
    const outputEl = $('#p-or-output');
    const valueZ = $('#p-or-value-z');
    
    if (inputA) inputA.textContent = `a=${a}`;
    if (inputB) inputB.textContent = `b=${b}`;
    if (sumEl) sumEl.textContent = `s=${or.s.toFixed(1)}`;
    if (outputEl) outputEl.textContent = `z=${or.y}`;
    if (valueZ) valueZ.textContent = `z=${or.y}`;
  }
  
  if (gateType === 'p-nand') {
    const nand = P_NAND(a, b);
    const inputA = $('#p-nand-value-a');
    const inputB = $('#p-nand-value-b');
    const sumEl = $('#p-nand-sum');
    const outputEl = $('#p-nand-output');
    const valueZ = $('#p-nand-value-z');
    
    if (inputA) inputA.textContent = `a=${a}`;
    if (inputB) inputB.textContent = `b=${b}`;
    if (sumEl) sumEl.textContent = `s=${nand.s.toFixed(1)}`;
    if (outputEl) outputEl.textContent = `z=${nand.y}`;
    if (valueZ) valueZ.textContent = `z=${nand.y}`;
  }
}

[pg_a, pg_b].forEach(el => {
  if (el) {
    el.addEventListener('change', updatePerceptronGates);
  }
});
if (pg_a && pg_b) {
  updatePerceptronGates();
}

// Add click event handlers for perceptron truth table rows
function addPerceptronTableClickHandlers() {
  // P-NOT table click handler
  const pNotTable = $('[data-gate="p-not"]');
  if (pNotTable) {
    const rows = pNotTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const pattern = row.getAttribute('data-pattern');
        const a = parseInt(pattern, 10);
        
        // Remove highlighting from all rows
        rows.forEach(r => r.classList.remove('highlighted'));
        row.classList.add('highlighted');
        
        // Update diagram values
        updatePerceptronDiagramValues('p-not', a, null);
      });
    });
  }

  // P-AND table click handler
  const pAndTable = $('[data-gate="p-and"]');
  if (pAndTable) {
    const rows = pAndTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const pattern = row.getAttribute('data-pattern').split(',');
        const a = parseInt(pattern[0], 10);
        const b = parseInt(pattern[1], 10);
        
        // Remove highlighting from all rows
        rows.forEach(r => r.classList.remove('highlighted'));
        row.classList.add('highlighted');
        
        // Update diagram values
        updatePerceptronDiagramValues('p-and', a, b);
      });
    });
  }

  // P-OR table click handler
  const pOrTable = $('[data-gate="p-or"]');
  if (pOrTable) {
    const rows = pOrTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const pattern = row.getAttribute('data-pattern').split(',');
        const a = parseInt(pattern[0], 10);
        const b = parseInt(pattern[1], 10);
        
        // Remove highlighting from all rows
        rows.forEach(r => r.classList.remove('highlighted'));
        row.classList.add('highlighted');
        
        // Update diagram values
        updatePerceptronDiagramValues('p-or', a, b);
      });
    });
  }

  // P-NAND table click handler
  const pNandTable = $('[data-gate="p-nand"]');
  if (pNandTable) {
    const rows = pNandTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const pattern = row.getAttribute('data-pattern').split(',');
        const a = parseInt(pattern[0], 10);
        const b = parseInt(pattern[1], 10);
        
        // Remove highlighting from all rows
        rows.forEach(r => r.classList.remove('highlighted'));
        row.classList.add('highlighted');
        
        // Update diagram values
        updatePerceptronDiagramValues('p-nand', a, b);
      });
    });
  }
}

// Initialize click handlers after DOM is loaded
addPerceptronTableClickHandlers();

// Add click event handler for MLP XOR table
function addMLPXORTableClickHandler() {
  const mlpXorTable = $('[data-gate="mlp-xor"]');
  if (mlpXorTable) {
    const rows = mlpXorTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const pattern = row.getAttribute('data-pattern').split(',');
        const a = parseInt(pattern[0], 10);
        const b = parseInt(pattern[1], 10);
        const orResult = parseInt(row.getAttribute('data-or'), 10);
        const nandResult = parseInt(row.getAttribute('data-nand'), 10);
        const xorResult = parseInt(row.getAttribute('data-result'), 10);
        
        // Remove highlighting from all rows
        rows.forEach(r => r.classList.remove('highlighted'));
        row.classList.add('highlighted');
        
        // Update MLP XOR diagram values
        updateMLPXORValues(a, b, orResult, nandResult, xorResult);
      });
    });
  }
}

function updateMLPXORValues(a, b, orResult, nandResult, xorResult) {
  // Calculate intermediate values using perceptron functions
  const orCalc = OR_unit(a, b);
  const nandCalc = NAND_unit(a, b);
  const andCalc = AND_unit(orResult, nandResult);
  
  // Update input values
  const inputA = $('#mlp-xor-value-a');
  const inputB = $('#mlp-xor-value-b');
  if (inputA) inputA.textContent = `a=${a}`;
  if (inputB) inputB.textContent = `b=${b}`;
  
  // Update intermediate values (Layer 1)
  const orSum = $('#mlp-or-sum');
  const orOutput = $('#mlp-or-output');
  const nandSum = $('#mlp-nand-sum');
  const nandOutput = $('#mlp-nand-output');
  
  if (orSum) orSum.textContent = `s1=${orCalc.s.toFixed(1)}`;
  if (orOutput) orOutput.textContent = `h1=${orResult}`;
  if (nandSum) nandSum.textContent = `s2=${nandCalc.s.toFixed(1)}`;
  if (nandOutput) nandOutput.textContent = `h2=${nandResult}`;
  
  // Update final layer (Layer 2)
  const andSum = $('#mlp-and-sum');
  const andOutput = $('#mlp-and-output');
  
  if (andSum) andSum.textContent = `s3=${andCalc.s.toFixed(1)}`;
  if (andOutput) andOutput.textContent = `z=${xorResult}`;
  
  // Update gate values display
  const valueOR = $('#mlp-xor-value-or');
  const valueNAND = $('#mlp-xor-value-nand');
  const valueZ = $('#mlp-xor-value-z');
  
  if (valueOR) valueOR.textContent = `OR=${orResult}`;
  if (valueNAND) valueNAND.textContent = `NAND=${nandResult}`;
  if (valueZ) valueZ.textContent = `XOR=${xorResult}`;
}

// Initialize MLP XOR click handler
addMLPXORTableClickHandler();

function renderPGTruth(){
  const rows = [];
  for(const a of [0,1]){
    for(const b of [0,1]){
      rows.push(`<tr>
        <td>${a}</td><td>${b}</td>
        <td>${P_NOT(a).y}</td>
        <td>${P_AND(a,b).y}</td>
        <td>${P_OR(a,b).y}</td>
        <td>${P_NAND(a,b).y}</td>
      </tr>`);
    }
  }
  pgTruthBody.innerHTML = rows.join('');
}

// -----------------------------------------------------
// 3) PERCEPTRON XOR (2-layer)
// -----------------------------------------------------
const elX1 = $('#x1'), elX2 = $('#x2');
const s_or = $('#s_or'), s_nand = $('#s_nand'), s_and = $('#s_and');
const h_or = $('#h_or'), h_nand = $('#h_nand'), y_xor = $('#y_xor');
const xorTruthBtn = $('#xorTruthBtn'), xorTruthBody = $('#xor_truth_body');

function updateXOR(){
  const x1 = parseInt(elX1.value,10), x2 = parseInt(elX2.value,10);
  const or = OR_unit(x1,x2), nd = NAND_unit(x1,x2), out = AND_unit(or.y, nd.y);

  s_or.textContent   = or.s.toFixed(1);
  s_nand.textContent = nd.s.toFixed(1);
  s_and.textContent  = out.s.toFixed(1);

  setBit(h_or, or.y);
  setBit(h_nand, nd.y);
  setBit(y_xor, out.y);
  
  // 真理値表を自動更新
  renderXORTruth();
}
[elX1, elX2].forEach(el => {
  if (el) {
    el.addEventListener('change', updateXOR);
  }
});
if (elX1 && elX2) {
  updateXOR();
}

function renderXORTruth(){
  const rows = [];
  for(const a of [0,1]){
    for(const b of [0,1]){
      const o = OR_unit(a,b).y, n = NAND_unit(a,b).y, y = AND_unit(o,n).y;
      rows.push(`<tr><td>${a}</td><td>${b}</td><td>${o}</td><td>${n}</td><td>${AND_unit(o,n).y}</td><td>${y}</td></tr>`);
    }
  }
  xorTruthBody.innerHTML = rows.join('');
}
if (xorTruthBtn) {
  xorTruthBtn.addEventListener('click', renderXORTruth);
}

// Initialize XOR truth table on load
if (xorTruthBody) {
  renderXORTruth();
}

// -----------------------------------------------------
// 4) OTP ANALOGY
// -----------------------------------------------------
const elPT = $('#pt'), elKEY = $('#key'), elOutText = $('#outText'), elOutHex = $('#outHex'), elBitViz = $('#bitviz');
const elPTHex = $('#ptHex'), elKEYHex = $('#keyHex');
const elNonPrintableWarning = $('#nonPrintableWarning');
const btnEncrypt = $('#btnEncrypt'), btnDecrypt = $('#btnDecrypt'), btnSample = $('#btnSample'), btnBench = $('#btnBench');
const benchlog = $('#benchlog');

// HEX表示を1バイトごとに空白区切りで表示する関数
function toHexWithSpaces(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

// リアルタイムHEX表示の更新
function updateHexDisplays() {
  try {
    const ptBytes = encUTF8(elPT.value || '');
    const keyBytes = encUTF8(elKEY.value || '');
    
    elPTHex.value = toHexWithSpaces(ptBytes);
    elKEYHex.value = toHexWithSpaces(keyBytes);
  } catch (e) {
    elPTHex.value = '';
    elKEYHex.value = '';
  }
}

// 入力欄の変更を監視
elPT.addEventListener('input', updateHexDisplays);
elKEY.addEventListener('input', updateHexDisplays);

// 初期表示
updateHexDisplays();

// 印字できない文字をチェックする関数
function checkNonPrintableChars(bytes) {
  let hasNonPrintable = false;
  
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // 印字可能なASCII文字 (32-126) 以外、または制御文字をチェック
    if (byte < 32 || byte > 126) {
      hasNonPrintable = true;
      break;
    }
  }
  
  if (hasNonPrintable) {
    elNonPrintableWarning.style.display = 'block';
  } else {
    elNonPrintableWarning.style.display = 'none';
  }
}

btnSample.addEventListener('click', ()=>{
  const isEncryptMode = document.querySelector('input[name="otpMode"]:checked').value === 'encrypt';
  if (isEncryptMode) {
    elPT.value = 'HELLO';
    elKEY.value = 'XMCKL';
  } else {
    // 復号モード用のサンプル（HELLOをXMCKLで暗号化した結果）
    elPT.value = '\x10\x08\x0F\x0F\x1B';  // 暗号文
    elKEY.value = 'XMCKL';
  }
  // サンプル投入後にHEX表示を更新
  updateHexDisplays();
});

// OTP mode management
const modeRadios = document.querySelectorAll('input[name="otpMode"]');
const btnExecute = $('#btnExecute');
const inputLabel1 = $('#inputLabel1');
const outputLabel1 = $('#outputLabel1');
const resultTitle = $('#resultTitle');

function updateOTPMode() {
  const isEncryptMode = document.querySelector('input[name="otpMode"]:checked').value === 'encrypt';
  
  if (isEncryptMode) {
    btnExecute.textContent = '暗号化（C = P ⊕ K）';
    inputLabel1.textContent = '平文P（UTF-8）';
    outputLabel1.textContent = '暗号文テキスト';
    resultTitle.textContent = '暗号化結果';
    elPT.placeholder = '例) HELLO';
  } else {
    btnExecute.textContent = '復号（P = C ⊕ K）';
    inputLabel1.textContent = '暗号文C（UTF-8）';
    outputLabel1.textContent = '復号テキスト';
    resultTitle.textContent = '復号結果';
    elPT.placeholder = '例) 暗号文を入力';
  }
}

modeRadios.forEach(radio => radio.addEventListener('change', updateOTPMode));
btnExecute.addEventListener('click', ()=> {
  const isEncryptMode = document.querySelector('input[name="otpMode"]:checked').value === 'encrypt';
  runOTP(!isEncryptMode);
});

// Initialize mode
updateOTPMode();

function xorBitViaPerceptron(aBit, bBit){
  const o = OR_unit(aBit, bBit).y;
  const n = NAND_unit(aBit, bBit).y;
  const y = AND_unit(o, n).y;
  return {o, n, y};
}

function cell(bit, highlight=false){
  return `<span class="bit-cell ${bit? 'b1':''} ${highlight? 'h':''}">${bit}</span>`;
}

function runOTP(isDecrypt=false){
  const a = encUTF8(elPT.value || '');
  const b = encUTF8(elKEY.value || '');
  if(a.length !== b.length){
    alert('鍵は平文（または暗号文）と同じ長さにしてください。');
    return;
  }
  const out = new Uint8Array(a.length);
  const viz = [];

  for(let i=0;i<a.length;i++){
    const pb=a[i], kb=b[i], ob = pb ^ kb;
    out[i] = ob;

    // 文字とASCII値を取得
    const pChar = String.fromCharCode(pb);
    const kChar = String.fromCharCode(kb);
    
    // 復号モードかどうかでラベルを変更
    const inputLabel = isDecrypt ? 'C' : 'P';
    const outputLabel = isDecrypt ? 'P' : 'C';
    const labels = [inputLabel,'K','A','B',outputLabel];
    const streams = [[],[],[],[],[]];
    const explanations = [
      `'${pChar}' (ASCII: ${pb})`,
      `'${kChar}' (ASCII: ${kb})`,
      `A[${i}]←OR(${inputLabel}[${i}], K[${i}])`,
      `B[${i}]←NAND(${inputLabel}[${i}], K[${i}])`,
      `${outputLabel}[${i}]←XOR(A[${i}], B[${i}])`
    ];

    for(let bit=7; bit>=0; bit--){
      const pa=(pb>>bit)&1, ka=(kb>>bit)&1;
      const {o,n,y} = xorBitViaPerceptron(pa,ka);
      streams[0].push(cell(pa));
      streams[1].push(cell(ka));
      streams[2].push(cell(o, true));
      streams[3].push(cell(n, true));
      streams[4].push(cell(y, true));
    }
    const grid = labels.map((lab,idx)=>
      `<div class="bit-row">
         <div>${lab}[${i}]</div>
         <div class="bit-stream">${streams[idx].join('')}</div>
         <div class="bit-explanation">${explanations[idx]}</div>
       </div>`
    ).join('');
    viz.push(grid);
  }

  // 出力（復号フラグに関わらず XOR の結果を表示）
  const outputText = decUTF8(out);
  elOutText.value = outputText;
  elOutHex.value  = toHexWithSpaces(out);
  elBitViz.innerHTML = viz.join('<hr/>');
  
  // 印字できない文字があるかチェック
  checkNonPrintableChars(out);
}

// ---- 簡易ベンチ（処理時間の目安） ----
btnBench.addEventListener('click', ()=>{
  const n = 10000;
  const a = new Uint8Array(n), b = new Uint8Array(n);
  crypto.getRandomValues(a); crypto.getRandomValues(b);

  // Native XOR
  let t0 = performance.now();
  const out1 = new Uint8Array(n);
  for(let i=0;i<n;i++){ out1[i] = a[i]^b[i]; }
  let t1 = performance.now();

  // Perceptron XOR（ビットごと）
  let t2 = performance.now();
  const out2 = new Uint8Array(n);
  for(let i=0;i<n;i++){
    let byte=0;
    for(let bit=7;bit>=0;bit--){
      const pa=(a[i]>>bit)&1, ka=(b[i]>>bit)&1;
      const {o,n,y} = xorBitViaPerceptron(pa,ka);
      byte |= (y & 1) << bit;
    }
    out2[i]=byte;
  }
  let t3 = performance.now();

  const same = toHex(out1.slice(0,32)) === toHex(out2.slice(0,32)); // 簡便一致確認（先頭部）
  const speedup = ((t3-t2)/(t1-t0)).toFixed(1);
  benchlog.textContent =
`📊 ベンチマーク結果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
データサイズ:     ${n.toLocaleString()} バイト
Native XOR:       ${(t1-t0).toFixed(3)} ms
Perceptron XOR:   ${(t3-t2).toFixed(3)} ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
速度比:           ${speedup}倍遅い（パーセプトロン）
結果の一致:       ${same ? '✓ 一致' : '⚠ 要確認'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 パーセプトロンXORは教育・可視化目的です
   実際の暗号処理には標準XORを使用してください`;
});

// -----------------------------------------------------
// Glossary Data Loading and Management
// -----------------------------------------------------
let glossaryData = [];

async function loadGlossaryData() {
  try {
    const response = await fetch('data/words.json');
    const data = await response.json();
    glossaryData = data.glossary;
    return glossaryData;
  } catch (error) {
    console.error('Error loading glossary data:', error);
    return [];
  }
}

function renderGlossary(words = glossaryData) {
  const glossaryGrid = $('#glossaryGrid');
  if (!glossaryGrid) return;

  glossaryGrid.innerHTML = words.map(word => `
    <div class="glossary-card" data-category="${word.category}">
      <div class="term">
        <h3>${word.term}</h3>
        <span class="category-tag ${word.category}">${word.categoryLabel}</span>
      </div>
      <div class="definition">
        ${word.definition}
      </div>
    </div>
  `).join('');
}

function filterCards(searchTerm = '', category = 'all') {
  const filteredWords = glossaryData.filter(word => {
    const matchesSearch = searchTerm === '' || 
      word.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
      word.definition.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === 'all' || word.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  renderGlossary(filteredWords);
}

async function initGlossary() {
  const searchInput = $('#glossarySearch');
  const filterBtns = $$('.filter-btn');

  if (!searchInput || !filterBtns.length) return;

  // Load glossary data and render initial view
  await loadGlossaryData();
  renderGlossary();

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const activeCategory = $('.filter-btn.active')?.dataset.category || 'all';
    filterCards(e.target.value, activeCategory);
  });

  // Category filter functionality
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterCards(searchInput.value, btn.dataset.category);
    });
  });
}

// -----------------------------------------------------
// Initialize Theme and Event Listeners
// -----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Initialize glossary functionality
  initGlossary();
  
  // Initialize gate visualization
  initGateVisualization();
  
  // Trigger MathJax to render all formulas
  if (window.MathJax) {
    MathJax.typesetPromise().catch((e) => console.log('MathJax error:', e));
  }
});
