# 金沢は今日も鳴雷（なるかみ）

金沢の曇り空と落雷をテーマにしたリアルタイム雷予測ゲーム。

## 遊び方

1. 16エリアから雷が落ちる場所を予測
2. ベット額を選択（50/100/250/500pt）
3. 5分後に結果判定
4. 的中でオッズ×ベット額を獲得

## 操作方法

1. 地図上のエリアをクリック
2. ベット額ボタンをクリック
3. 「ベット確定」をクリック
4. 「クリア」で選択解除

## オッズシステム

- 高確率エリア: 低オッズ（例: ×1.2）
- 低確率エリア: 高オッズ（例: ×3.5）

雷雲の中心からの距離で確率が変動。

## セットアップ

```bash
git clone https://github.com/kako-jun/kanazawa-narukami.git
cd kanazawa-narukami
open index.html
```

または:

```bash
python -m http.server 8000
# http://localhost:8000 を開く
```

## 技術スタック

- HTML5 / CSS3 / JavaScript（Vanilla）
- Canvas API
- Google Fonts（Klee One）

## ライセンス

MIT
