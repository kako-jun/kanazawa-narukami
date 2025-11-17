// 金沢は今日も鳴雷 - ゲームロジック

class KanazawaNarukami {
    constructor() {
        // ゲーム状態
        this.score = 1000;
        this.betAmount = 100;
        this.selectedArea = null;
        this.roundTime = 300; // 5分 = 300秒
        this.currentRound = 0;
        this.isRoundActive = true;
        this.history = [];

        // エリアグリッド (4x4 = 16エリア)
        this.gridSize = 4;
        this.areas = this.initializeAreas();
        this.lightningProbabilities = {};

        // DOM要素
        this.elements = {
            countdown: document.getElementById('countdown'),
            score: document.getElementById('score'),
            betAmount: document.getElementById('bet-amount'),
            confirmBtn: document.getElementById('confirm-bet'),
            clearBtn: document.getElementById('clear-bet'),
            gridOverlay: document.getElementById('grid-overlay'),
            oddsList: document.getElementById('odds-list'),
            historyList: document.getElementById('history-list'),
            resultOverlay: document.getElementById('result-overlay'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            resultPoints: document.getElementById('result-points'),
            lightningFlash: document.getElementById('lightning-flash'),
            canvas: document.getElementById('map-canvas')
        };

        this.init();
    }

    // エリア初期化
    initializeAreas() {
        const areas = [];
        const rows = ['A', 'B', 'C', 'D'];

        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                areas.push({
                    id: `${rows[i]}${j + 1}`,
                    row: i,
                    col: j,
                    probability: 0
                });
            }
        }

        return areas;
    }

    // 初期化
    init() {
        this.setupCanvas();
        this.createGridCells();
        this.setupEventListeners();
        this.updateLightningProbabilities();
        this.calculateOdds();
        this.displayOdds();
        this.startRoundTimer();
        this.updateDisplay();

        // 定期的に雷光エフェクト
        setInterval(() => {
            if (Math.random() < 0.1) {
                this.triggerLightning();
            }
        }, 5000);
    }

    // Canvas設定
    setupCanvas() {
        const canvas = this.elements.canvas;
        const ctx = canvas.getContext('2d');

        canvas.width = 800;
        canvas.height = 500;

        // 金沢の簡易マップ背景
        const gradient = ctx.createLinearGradient(0, 0, 800, 500);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#667eea');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 500);

        // 金沢のランドマーク的な装飾
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('金沢市', 400, 250);
    }

    // グリッドセル作成
    createGridCells() {
        this.elements.gridOverlay.innerHTML = '';

        this.areas.forEach(area => {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.areaId = area.id;
            cell.innerHTML = `
                <span class="area-label">${area.id}</span>
                <span class="odds-badge">×${this.getOdds(area.id)}</span>
            `;

            cell.addEventListener('click', () => this.selectArea(area.id));
            this.elements.gridOverlay.appendChild(cell);
        });
    }

    // イベントリスナー設定
    setupEventListeners() {
        // ベット額選択
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.setBetAmount(amount);

                // アクティブ状態表示
                document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // ベット確定
        this.elements.confirmBtn.addEventListener('click', () => this.confirmBet());

        // クリア
        this.elements.clearBtn.addEventListener('click', () => this.clearSelection());
    }

    // エリア選択
    selectArea(areaId) {
        if (!this.isRoundActive) return;

        // 前の選択を解除
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected');
        });

        // 新しい選択
        this.selectedArea = areaId;
        const cell = document.querySelector(`[data-area-id="${areaId}"]`);
        cell.classList.add('selected');

        // ベット確定ボタンを有効化
        this.elements.confirmBtn.disabled = false;
    }

    // ベット額設定
    setBetAmount(amount) {
        if (amount <= this.score) {
            this.betAmount = amount;
            this.updateDisplay();
        }
    }

    // 選択クリア
    clearSelection() {
        this.selectedArea = null;
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        this.elements.confirmBtn.disabled = true;
    }

    // ベット確定
    confirmBet() {
        if (!this.selectedArea || !this.isRoundActive) return;

        if (this.score < this.betAmount) {
            alert('スコアが不足しています！');
            return;
        }

        this.score -= this.betAmount;
        this.isRoundActive = false;
        this.updateDisplay();

        // 待機状態を表示
        this.elements.confirmBtn.disabled = true;
        this.elements.confirmBtn.textContent = '判定待ち...';
    }

    // 雷の確率更新（シミュレーション）
    updateLightningProbabilities() {
        // ランダムに雷雲の中心を決定
        const centerRow = Math.floor(Math.random() * this.gridSize);
        const centerCol = Math.floor(Math.random() * this.gridSize);

        this.areas.forEach(area => {
            // 中心からの距離で確率を計算
            const distance = Math.sqrt(
                Math.pow(area.row - centerRow, 2) +
                Math.pow(area.col - centerCol, 2)
            );

            // 距離に応じて確率を設定（0.05〜0.25の範囲）
            const baseProbability = 0.25 - (distance * 0.05);
            area.probability = Math.max(0.05, Math.min(0.25, baseProbability + (Math.random() * 0.05)));
        });
    }

    // オッズ計算
    calculateOdds() {
        this.areas.forEach(area => {
            // オッズ = 1 / 確率 × 調整係数（0.9でハウスエッジを確保）
            const rawOdds = (1 / area.probability) * 0.9;
            area.odds = Math.round(rawOdds * 10) / 10; // 小数第1位まで
        });
    }

    // オッズ取得
    getOdds(areaId) {
        const area = this.areas.find(a => a.id === areaId);
        return area ? area.odds.toFixed(1) : '1.0';
    }

    // オッズ表示
    displayOdds() {
        this.elements.oddsList.innerHTML = '';

        // オッズの低い順（確率が高い順）にソート
        const sortedAreas = [...this.areas].sort((a, b) => a.odds - b.odds);

        sortedAreas.forEach(area => {
            const item = document.createElement('div');
            item.className = 'odds-item';
            item.innerHTML = `
                <span class="area">${area.id}</span>
                <span class="odds">×${area.odds.toFixed(1)}</span>
            `;
            this.elements.oddsList.appendChild(item);
        });
    }

    // ラウンドタイマー開始
    startRoundTimer() {
        this.timerInterval = setInterval(() => {
            this.roundTime--;

            if (this.roundTime <= 0) {
                this.endRound();
                this.roundTime = 300;
                this.currentRound++;
                this.isRoundActive = true;
                this.elements.confirmBtn.textContent = 'ベット確定';
                this.updateLightningProbabilities();
                this.calculateOdds();
                this.displayOdds();
                this.updateGridOdds();
            }

            this.updateTimer();
        }, 1000);
    }

    // タイマー更新
    updateTimer() {
        const minutes = Math.floor(this.roundTime / 60);
        const seconds = this.roundTime % 60;
        this.elements.countdown.textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // ラウンド終了
    endRound() {
        // 雷が落ちたエリアを決定（確率に基づく）
        const hitArea = this.determineLightningStrike();

        if (this.selectedArea) {
            const isWin = this.selectedArea === hitArea;
            const odds = parseFloat(this.getOdds(this.selectedArea));
            const winAmount = isWin ? Math.floor(this.betAmount * odds) : 0;

            if (isWin) {
                this.score += winAmount;
                this.showResult(true, hitArea, winAmount);
                this.triggerLightning();
            } else {
                this.showResult(false, hitArea, 0);
                this.triggerLightningLoss();
            }

            // 履歴に追加
            this.addHistory(isWin, this.selectedArea, hitArea, winAmount);

            this.clearSelection();
        } else {
            // ベットなしの場合、雷光のみ
            this.triggerLightning();
            this.highlightHitArea(hitArea);
        }
    }

    // 雷の落下エリア決定
    determineLightningStrike() {
        const random = Math.random();
        let cumulative = 0;

        // 確率の合計で正規化
        const totalProbability = this.areas.reduce((sum, area) => sum + area.probability, 0);

        for (const area of this.areas) {
            cumulative += area.probability / totalProbability;
            if (random <= cumulative) {
                return area.id;
            }
        }

        return this.areas[0].id;
    }

    // 雷光エフェクト（当たり）
    triggerLightning() {
        this.elements.lightningFlash.classList.add('flash');
        setTimeout(() => {
            this.elements.lightningFlash.classList.remove('flash');
        }, 500);

        // 雷音シミュレーション（実際の音は別途追加可能）
        console.log('⚡ ゴロゴロゴロ...');
    }

    // 雷光エフェクト（外れ時の暗転）
    triggerLightningLoss() {
        this.elements.lightningFlash.style.background = 'rgba(0, 0, 0, 0.8)';
        this.elements.lightningFlash.classList.add('flash');

        setTimeout(() => {
            this.elements.lightningFlash.style.background = 'rgba(255, 255, 255, 0)';
            this.elements.lightningFlash.classList.remove('flash');
        }, 1000);
    }

    // ヒットエリアハイライト
    highlightHitArea(areaId) {
        const cell = document.querySelector(`[data-area-id="${areaId}"]`);
        if (cell) {
            cell.classList.add('hit');
            setTimeout(() => cell.classList.remove('hit'), 2000);
        }
    }

    // 結果表示
    showResult(isWin, hitArea, winAmount) {
        const content = this.elements.resultOverlay.querySelector('.result-content');
        content.className = 'result-content ' + (isWin ? 'win' : 'lose');

        if (isWin) {
            this.elements.resultTitle.textContent = '🎉 的中！';
            this.elements.resultMessage.textContent = `エリア ${hitArea} に雷が落ちました！`;
            this.elements.resultPoints.textContent = `獲得ポイント: +${winAmount}pt`;
        } else {
            this.elements.resultTitle.textContent = '⚡ 外れ...';
            this.elements.resultMessage.textContent = `雷はエリア ${hitArea} に落ちました`;
            this.elements.resultPoints.textContent = `損失: -${this.betAmount}pt`;
        }

        this.elements.resultOverlay.classList.remove('hidden');

        // 3秒後に自動で閉じる
        setTimeout(() => {
            this.elements.resultOverlay.classList.add('hidden');
        }, 3000);

        this.highlightHitArea(hitArea);
    }

    // 履歴追加
    addHistory(isWin, selectedArea, hitArea, winAmount) {
        const historyItem = {
            round: this.currentRound,
            isWin,
            selectedArea,
            hitArea,
            amount: isWin ? winAmount : -this.betAmount,
            timestamp: new Date()
        };

        this.history.unshift(historyItem);

        // 最新10件のみ保持
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }

        this.displayHistory();
    }

    // 履歴表示
    displayHistory() {
        this.elements.historyList.innerHTML = '';

        this.history.forEach(item => {
            const div = document.createElement('div');
            div.className = `history-item ${item.isWin ? 'win' : 'lose'}`;

            const sign = item.amount >= 0 ? '+' : '';
            const time = item.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            });

            div.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <span>#${item.round} [${time}]</span>
                    <span>${item.isWin ? '✓' : '✗'} ${item.selectedArea} → ${item.hitArea}</span>
                    <span style="color: ${item.isWin ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                        ${sign}${item.amount}pt
                    </span>
                </div>
            `;

            this.elements.historyList.appendChild(div);
        });
    }

    // グリッドのオッズ更新
    updateGridOdds() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            const areaId = cell.dataset.areaId;
            const badge = cell.querySelector('.odds-badge');
            if (badge) {
                badge.textContent = `×${this.getOdds(areaId)}`;
            }
        });
    }

    // 表示更新
    updateDisplay() {
        this.elements.score.textContent = this.score;
        this.elements.betAmount.textContent = this.betAmount;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    const game = new KanazawaNarukami();

    // デバッグ用
    window.game = game;
});
