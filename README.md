<!--
---
title: Perceptron OTP Visualizer
category: genai
difficulty: 3
description: Educational tool visualizing NAND-based logic, perceptron gates, multi-layer XOR, and OTP through perceptron analogy.
tags: [nand, perceptron, xor, otp, cryptography, education]
demo: https://ipusiron.github.io/perceptron-otp-visualizer/
---
-->

# Perceptron OTP Visualizer - パーセプトン疑似OTPツール

![GitHub Repo stars](https://img.shields.io/github/stars/ipusiron/perceptron-otp-visualizer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/perceptron-otp-visualizer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/perceptron-otp-visualizer)
![GitHub license](https://img.shields.io/github/license/ipusiron/perceptron-otp-visualizer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/perceptron-otp-visualizer/)


**Day057 - 生成AIで作るセキュリティツール100**

**Perceptron OTP Visualizer**は、NANDがすべての論理ゲートを構成できる「普遍ゲート」であることを出発点に、パーセプトロンを用いて論理ゲートを再現し、さらに多層化によってXORを実現できることを示します。
その上で、XORが基盤となるワンタイムパッド（OTP）の仕組みをアナロジー的に体験でき、暗号としての安全性や高速性について「なぜ使える／使えないのか」を事実ベースで理解できます。

教育用の可視化ツールとして、暗号学・ニューラルネットワーク・論理回路の橋渡しを目指しています。

---

## 🌐 デモページ

👉 **[https://ipusiron.github.io/perceptron-otp-visualizer/](https://ipusiron.github.io/perceptron-otp-visualizer/)**

ブラウザーで直接お試しいただけます。

---

## 📸 スクリーンショット

>![ダミー](assets/screenshot.png)
>
>*ダミー*

---

## 📝 説明

本ツールは、**事実ベースかつビジュアルベースの教育ツール**です。  
以下の5点を学ぶことを目的としています。

1. **NAND** からすべての論理ゲートを構成できること。  
2. **パーセプトロン**でも論理ゲートを構成できること。  
3. **パーセプトロンXOR**の構成と特徴。  
4. **OTP暗号のXORをアナロジー**してパーセプトロンOTPを作ったらどうなるか（暗号として使えるか／使えない理由／安全性や高速性）。  
5. 今後の課題・拡張例・発展の方向性。  

---

## 📚 現仕様 (v2)

### 画面構成（4タブ）
1. **NANDユニバーサル**  
   - NANDだけでNOT, AND, OR, XORを構成。式と真理値表を可視化。  

2. **パーセプトロンでゲート**  
   - 単層パーセプトロン（固定重み）でNOT/AND/OR/NANDを再現。  

3. **パーセプトロンXOR**  
   - OR・NAND（第1層）＋AND（第2層）でXORを構成。  
   - 真理値表とユニットごとの出力を可視化。  

4. **パーセプトロンOTP（アナロジー）**  
   - 平文と鍵（同じ長さ必須）を入力。  
   - 各ビットをパーセプトロンXORで計算。  
   - 出力テキスト、HEX、ビットごとのOR/NAND/XORを可視化。  
   - 評価（事実ベース）：  
     - 鍵が真に乱数・一度きりなら安全性はXOR-OTPと同等。  
     - 鍵の性質を満たさない場合、完全秘匿性は失われる。  
     - ネイティブXORに比べパフォーマンスは劣る。  

### 共通仕様
- **ステップ関数**: `step(z) = 1 (z ≥ 0), 0 (z < 0)`  
- **ビット順**: MSB→LSB  
- **エラー処理**: 鍵長不一致 → エラーメッセージ  
- **非UTF-8復元**: テキスト出力は空、HEXは常に表示  
- **目的**: 教育用（実運用の暗号としては使用不可）  
- **依存**: バニラJS（`TextEncoder` / `TextDecoder`）、モダンブラウザ  

---

## ▶️ パーセプトロンで論理ゲートを作ろう

### 実験ノートブック

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](
  https://colab.research.google.com/github/ipusiron/perceptron-otp-visualizer/blob/main/notebooks/logic_gate_of_perceptron.ipynb
)
[![View on GitHub](https://img.shields.io/badge/View%20on-GitHub-black?logo=github)](
  https://github.com/ipusiron/perceptron-otp-visualizer/blob/main/notebooks/logic_gate_of_perceptron.ipynb
)

### 本ツールで試す

本ツールの「② パーセプトロンでゲート」タブで実践できます。

---

Perceptron OTP Visualizer 仕様（v2）
目的（本ツールで学ぶ5点）

NANDのみから各論理ゲートを構成できること。

パーセプトロンでも基本論理ゲート（NOT/AND/OR/NAND）が実装できること。

パーセプトロンXORの構成（多層合成が必要）と特徴。

XORのOTPをアナロジーして「パーセプトロンOTP」を作ったらどうなるか（暗号として使えるか／使えないなら理由／安全性と高速性の比較）。

今後の課題・拡張例・発展の整理。

画面構成（5タブ）

NANDユニバーサル

入力：a,b ∈ {0,1} のトグル。

出力：NANDだけを使って NOT, AND, OR, XOR を構成（式と真理値表を同時表示）。

例：

NOT a = a NAND a

AND(a,b) = (a NAND b) NAND (a NAND b)

OR(a,b) = (a NAND a) NAND (b NAND b)

XOR(a,b) = (a NAND m) NAND (b NAND m)（m = a NAND b）

可視化：NANDブロックの配線図（点灯アニメ）、逐次評価のハイライト。

パーセプトロンでゲート

単層パーセプトロンで NOT/AND/OR/NAND を再現（固定重み＋しきい値、step(z)=1[z≥0]）。

代表的な重み（例）：

AND: y=step(1·a + 1·b − 1.5)

OR: y=step(1·a + 1·b − 0.5)

NAND: y=step(−1·a − 1·b + 1.5)

NOT: y=step(−1·a + 0.5)

各ユニットで 総入力 s と 出力 y を表示。真理値表ボタンあり。

パーセプトロンXOR

OR と NAND を第1層、AND を第2層にして XOR を合成。
XOR(a,b) = AND( OR(a,b), NAND(a,b) )

a,b を切り替えると、各ユニットの s値 と y値 が更新。

真理値表表示。

ポイント表示：「XORは線形分離不可→単層では不可、2層（非線形合成）で実現」。

パーセプトロンOTP（XORのアナロジー）

入力：平文Pと鍵K（同じバイト長必須、UTF-8）。

「暗号化：C = P ⊕ K」「復号：P = C ⊕ K」

各ビットのXORを“パーセプトロンXOR”で計算し、P[i], K[i], OR, NAND, XOR を MSB→LSB で可視化。

出力：テキスト（復元可能時）＋HEX。

事実ベースの評価（固定表示テキスト）

数学的に パーセプトロンXORはXORと同じ関数を返す。したがって

鍵Kが「真に乱数・平文と同長・一回限り・秘匿」なら OTPの完全秘匿性の要件は満たされ、安全性は“鍵”に依存する。

逆に、鍵が疑似乱数・使い回し・短い・漏洩のいずれでも 完全秘匿は失われる（これはXOR実装の如何によらず事実）。

高速性：

ネイティブXOR＝CPU/GPUの基本命令（1命令/ビット相当）。

パーセプトロンXOR＝OR/NAND/ANDの3ユニット、各ユニットで加算・比較（乗算は1/0なので実質スキップ可だが、評価回数は増加）。

実用暗号としては 明確に遅い。教育目的に限定。

今後の課題・拡張例・発展

学習過程の可視化：重み可変／誤差逆伝播（BP）アニメーション、決定境界の変化。

回路 vs ニューラル比較：ゲート合成（ブール回路）と多層パーセプトロンの等価性・違いを並列表示。

鍵生成の論点整理：

完全秘匿に必要な条件（Shannon）を図示。

疑似乱数（PRNG）や短鍵展開（ストリーム暗号）と情報理論的安全性との非同一性を明示。

性能ベンチ：文字列長を変えてネイティブXORとパーセプトロンXORの処理時間を比較（ブラウザ内計測）。

マルチバイトの注意：UTF-8のビット列可視化、絵文字・結合文字の扱い。

共通仕様

ステップ関数：step(z)=1 (z≥0), 0 (z<0)（境界含む）。

ビット順：MSB→LSB 固定。

鍵長不一致：エラーメッセージ表示。

非UTF-8復元：テキスト出力は空、HEXは常に表示。

目的：ビジュアルベース・事実ベースの教育用（実運用の暗号用途は対象外）。

依存：バニラJS（TextEncoder/TextDecoder）。モダンブラウザ想定。

検証観点（事実ベース）

NANDのみで論理完全（NOT/AND/OR/XOR 構成可）。

単層パーセプトロンでXORは不可（線形分離不可能）。

2層合成（OR/NAND→AND）でXOR実現。

C=P⊕K の安全性は XORの実装ではなく鍵性質に依存。

ネイティブXOR ≫ パーセプトロンXOR（速度・実装コスト）。

---

## 🛠 使い方

1. [GitHub Pages デモ](https://ipusiron.github.io/perceptron-otp-visualizer/) を開く。  
2. タブを切り替えて学習する：  
   - NANDによるゲート構成  
   - パーセプトロンによるゲート再現  
   - 多層パーセプトロンによるXOR  
   - OTPアナロジーとしてのパーセプトロンOTP  
3. 平文と鍵（同じ長さ）を入力して、暗号化／復号を体験する。  

---

## 🎯 ターゲット層

- **情報セキュリティや暗号に興味がある初学者**  
  XORやワンタイムパッドの基礎を、ビジュアルで直感的に理解したい人。  

- **コンピューターサイエンスや論理回路を学ぶ学生**  
  NANDの普遍性やパーセプトロンによる論理ゲート構成を、実際に体験的に確認したい人。  

- **機械学習の基礎に触れたい学習者**  
  「単層ではXORは表現できない」という非線形問題を、手を動かしながら理解したい人。  

- **教育者や講師**  
  授業やワークショップで、暗号・論理回路・ニューラルネットワークをつなぐデモとして使いたい人。  

- **セキュリティツール100プロジェクトの読者**  
  プロジェクトの一部として、他のツールとの関連性を知りたい人。  

---

## 🚀 活用シナリオ

1. **教育現場でのデモ教材**  
   情報工学や暗号学入門の授業において、NANDの普遍性やパーセプトロンXORを実演するツールとして活用できます。  
   抽象的な数式や理論を、ビジュアル表示とインタラクションで直感的に学習できます。  

2. **CTFトレーニングの補助**  
   CTFの暗号問題では「XOR」や「ワンタイムパッド」が頻出します。  
   本ツールを用いれば、XOR処理の仕組みや鍵長一致の重要性を即座に確認でき、問題解法の理解が深まります。  

3. **自主学習や研究の可視化支援**  
   個人の学習や研究の中で、論理回路・機械学習・暗号の接点を試す実験ツールとして利用できます。  
   ネイティブXORとパーセプトロンXORの性能差を比較するなど、発展的な探究にも役立ちます。  

4. **講演・ワークショップでのデモ**  
   セキュリティやAI関連の講演において、聴衆に視覚的インパクトを与える教材として使用できます。  
   NANDからOTPまでを一気にデモすることで、専門外の人にも「暗号とAIの接点」をわかりやすく伝えられます。

---

## 🔒 セキュリティ対策

GitHub Pages公開にあたり、以下のセキュリティ対策を実施しています：

### Content Security Policy (CSP)
- XSS攻撃を防止するため、外部スクリプトは信頼できるCDN（jsDeliver）のみ許可
- インラインスタイルは教育ツールの可読性確保のため最小限で許可

### セキュリティヘッダー
- **X-Content-Type-Options**: MIME type sniffing攻撃を防止
- **X-Frame-Options**: クリックジャッキング攻撃を防止  
- **Referrer-Policy**: リファラー情報の漏洩を制限

### 外部リンク保護
- すべての外部リンクに`rel="noopener noreferrer"`を設定
- tabnabbing攻撃やリファラー漏洩を防止

### 外部リソース検証
- MathJax CDNにSubresource Integrity (SRI)を適用
- スクリプトの改ざんを検出し、安全性を確保

---

## 今後の課題・拡張例

- 重み学習や誤差逆伝播の可視化。  
- ブール回路とニューラルの比較。  
- OTP完全秘匿の条件とPRNGとの差異の明示。  
- ネイティブXOR vs パーセプトロンXORの性能比較。  
- UTF-8やマルチバイト文字の扱い。  

---

## 📄 ライセンス

MIT License – 詳細は [LICENSE](LICENSE) を参照してください。

---

## 🛠 このツールについて

本ツールは、「生成AIで作るセキュリティツール100」プロジェクトの一環として開発されました。  
このプロジェクトでは、AIの支援を活用しながら、セキュリティに関連するさまざまなツールを100日間にわたり制作・公開していく取り組みを行っています。

プロジェクトの詳細や他のツールについては、以下のページをご覧ください。  

🔗 [https://akademeia.info/?page_id=42163](https://akademeia.info/?page_id=42163)
