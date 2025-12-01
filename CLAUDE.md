# 金沢は今日も鳴雷 開発者向けドキュメント

金沢の曇り空と落雷をテーマにしたリアルタイム雷予測ゲーム。

## コンセプト

- 金沢は日本でも曇りが多く、雷が発生しやすい気候
- 天気予報をゲーム化して気象への関心を高める
- ギャンブル要素とリアルタイムデータの組み合わせ

## プロジェクト構造

```
kanazawa-narukami/
├── index.html      # メインHTML
├── style.css       # スタイルシート
├── game.js         # ゲームロジック
└── README.md
```

## ゲームフロー

```
1. ゲーム開始（初期スコア: 1000pt）
   ↓
2. エリア選択（16エリアから1つ）
   ↓
3. ベット額決定（50/100/250/500pt）
   ↓
4. ベット確定
   ↓
5. カウントダウン待機（5分）
   ↓
6. 雷落下判定
   ↓
7. 結果表示（的中→オッズ×ベット額獲得、外れ→ベット額失う）
   ↓
8. 次のラウンドへ
```

## グリッドシステム

金沢市を4×4の16エリアに分割:

```
    1    2    3    4
A  [A1] [A2] [A3] [A4]  北部
B  [B1] [B2] [B3] [B4]  中央北
C  [C1] [C2] [C3] [C4]  中央南
D  [D1] [D2] [D3] [D4]  南部
```

## 確率計算アルゴリズム

### 雷雲の中心決定

```javascript
const centerRow = Math.floor(Math.random() * 4);
const centerCol = Math.floor(Math.random() * 4);
```

### 距離計算

```javascript
const distance = Math.sqrt(
  Math.pow(area.row - centerRow, 2) + Math.pow(area.col - centerCol, 2),
);
```

### 確率計算

```javascript
const baseProbability = 0.25 - distance * 0.05;
area.probability = Math.max(
  0.05,
  Math.min(0.25, baseProbability + Math.random() * 0.05),
);
```

### オッズ計算

```javascript
const rawOdds = (1 / area.probability) * 0.9;
area.odds = Math.round(rawOdds * 10) / 10;
```

0.9はハウスエッジ（運営側の取り分）

### 確率分布例

```
雷雲中心: B2
距離0 (B2): 確率 22-27% → オッズ ×1.2-1.5
距離1: 確率 17-22% → オッズ ×1.5-2.0
距離2: 確率 12-17% → オッズ ×2.0-2.7
距離3以上: 確率 5-12% → オッズ ×2.7-4.0
```

## クラス設計

### KanazawaNarukamiクラス

**プロパティ**:

- score: スコア
- betAmount: ベット額
- selectedArea: 選択エリア
- roundTime: 残り時間
- currentRound: ラウンド番号
- isRoundActive: ラウンド中フラグ
- history: 履歴
- areas: エリア配列

**主要メソッド**:

- init(): セットアップ
- selectArea(areaId): エリア選択
- setBetAmount(amount): ベット額設定
- confirmBet(): ベット確定
- updateLightningProbabilities(): 確率更新
- calculateOdds(): オッズ計算
- startRoundTimer(): タイマー開始
- endRound(): ラウンド終了
- determineLightningStrike(): 落雷位置決定
- triggerLightning(): 雷光エフェクト

### データ型

```typescript
interface Area {
  id: string; // "A1" - "D4"
  row: number; // 0-3
  col: number; // 0-3
  probability: number; // 0.05-0.25
  odds: number; // 1.0-4.0
}

interface HistoryItem {
  round: number;
  isWin: boolean;
  selectedArea: string;
  hitArea: string;
  amount: number;
  timestamp: Date;
}
```

## デザイン

### カラーパレット

```css
--bg-dark: #2c3e50; /* 背景 */
--primary-blue: #3498db; /* タイトル */
--accent-yellow: #f39c12; /* オッズ、スコア */
--accent-red: #e74c3c; /* タイマー、外れ */
```

### アニメーション

- **cloudMove**: 雲の移動（60秒周期）
- **lightning**: 雷光フラッシュ（0.5秒）
- **pulse**: ヒットエリアのパルス（0.5秒）

## 状態遷移

```
[初期状態] → [エリア未選択] → [エリア選択中] → [ベット確定済み]
    ↓                              ↓ クリア
[5分経過]                    [エリア未選択]
    ↓
[結果判定中] → [結果表示] → [エリア未選択]（新ラウンド）
```

## 実装済み機能

- ✅ UIレイアウト
- ✅ 16エリアグリッドシステム
- ✅ ベットシステム
- ✅ オッズ計算ロジック
- ✅ 5分間ラウンドタイマー
- ✅ スコアリングシステム
- ✅ 履歴表示
- ✅ 雷光エフェクト
- ✅ 結果判定と表示

## 開発予定

### Phase 2: データ統合

- [ ] 気象庁「雷ナウキャスト」画像取得
- [ ] Canvas画像解析による雷検出
- [ ] リアルタイム確率計算

### Phase 3: 機能拡張

- [ ] 雷音エフェクト（Web Audio API）
- [ ] ランキングシステム
- [ ] 過去の雷データ分析

### Phase 4: UI/UX改善

- [ ] より詳細な金沢地図
- [ ] モバイル対応強化
- [ ] ダークモード

## 気象庁データ統合設計（Phase 2）

```javascript
async function analyzeLightningData(imageUrl) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const areas = divideIntoAreas(imageData.data, canvas.width, canvas.height);
  return calculateProbabilities(areas);
}
```

## パフォーマンス目標

- 初期ロード: < 2秒
- インタラクション応答: < 100ms
- アニメーション: 60 FPS
