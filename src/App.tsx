import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Area = {
  id: string;
  row: number;
  col: number;
  probability: number;
  odds: number;
};

type HistoryEntry = {
  round: number;
  isWin: boolean;
  selectedArea: string;
  hitArea: string;
  amount: number;
  timestamp: string;
};

type ResultState = {
  visible: boolean;
  isWin: boolean;
  hitArea: string;
  points: number;
};

type FlashMode = "win" | "loss" | "none";

const GRID_SIZE = 4;
const ROWS = ["A", "B", "C", "D"];
const ROUND_SECONDS = 300;

const createInitialAreas = (): Area[] =>
  Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return {
      id: `${ROWS[row]}${col + 1}`,
      row,
      col,
      probability: 0.1,
      odds: 9,
    };
  });

const determineLightningStrike = (areas: Area[]): string => {
  const totalProbability = areas.reduce(
    (sum, area) => sum + area.probability,
    0,
  );
  let random = Math.random();
  let cumulative = 0;

  for (const area of areas) {
    cumulative += area.probability / totalProbability;
    if (random <= cumulative) {
      return area.id;
    }
  }
  return areas[0]?.id ?? "A1";
};

function App() {
  const [score, setScore] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [lockedBet, setLockedBet] = useState<number | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [roundTime, setRoundTime] = useState<number>(ROUND_SECONDS);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isRoundActive, setIsRoundActive] = useState<boolean>(true);
  const [areas, setAreas] = useState<Area[]>(createInitialAreas);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [result, setResult] = useState<ResultState>({
    visible: false,
    isWin: false,
    hitArea: "",
    points: 0,
  });
  const [flashMode, setFlashMode] = useState<FlashMode>("none");
  const [hitHighlight, setHitHighlight] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const refreshProbabilities = useCallback(() => {
    const centerRow = Math.floor(Math.random() * GRID_SIZE);
    const centerCol = Math.floor(Math.random() * GRID_SIZE);

    setAreas((prev) =>
      prev.map((area) => {
        const distance = Math.sqrt(
          Math.pow(area.row - centerRow, 2) + Math.pow(area.col - centerCol, 2),
        );
        const baseProbability = 0.25 - distance * 0.05;
        const probability = Math.max(
          0.05,
          Math.min(0.25, baseProbability + Math.random() * 0.05),
        );
        const odds = Math.round((1 / probability) * 0.9 * 10) / 10;
        return { ...area, probability, odds };
      }),
    );
  }, []);

  const getOdds = useCallback(
    (areaId: string) =>
      areas.find((area) => area.id === areaId)?.odds?.toFixed(1) ?? "1.0",
    [areas],
  );

  const triggerLightning = useCallback((mode: FlashMode = "win") => {
    setFlashMode(mode);
    setTimeout(() => setFlashMode("none"), mode === "loss" ? 1000 : 500);
  }, []);

  const showResult = useCallback(
    (isWin: boolean, hitArea: string, points: number) => {
      setResult({
        visible: true,
        isWin,
        hitArea,
        points,
      });

      setTimeout(() => {
        setResult((prev) => ({ ...prev, visible: false }));
      }, 3000);
    },
    [],
  );

  const addHistory = useCallback(
    (isWin: boolean, selected: string, hitArea: string, amount: number) => {
      const entry: HistoryEntry = {
        round: currentRound,
        isWin,
        selectedArea: selected,
        hitArea,
        amount,
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => [entry, ...prev].slice(0, 10));
    },
    [currentRound],
  );

  const handleRoundEnd = useCallback(() => {
    const hitArea = determineLightningStrike(areas);
    const wager = lockedBet ?? betAmount;

    setHitHighlight(hitArea);
    setTimeout(() => setHitHighlight(""), 2000);

    if (selectedArea) {
      const isWin = selectedArea === hitArea;
      const odds = parseFloat(getOdds(selectedArea));
      const winAmount = isWin ? Math.floor(wager * odds) : 0;

      if (isWin) {
        setScore((prev) => prev + winAmount);
        triggerLightning("win");
      } else {
        triggerLightning("loss");
      }

      addHistory(isWin, selectedArea, hitArea, isWin ? winAmount : -wager);
      showResult(isWin, hitArea, isWin ? winAmount : -wager);
    } else {
      triggerLightning("win");
    }

    setSelectedArea(null);
    setLockedBet(null);
    setIsRoundActive(true);
    setRoundTime(ROUND_SECONDS);
    setCurrentRound((prev) => prev + 1);
    refreshProbabilities();
  }, [
    addHistory,
    areas,
    betAmount,
    getOdds,
    lockedBet,
    refreshProbabilities,
    selectedArea,
    showResult,
    triggerLightning,
  ]);

  useEffect(() => {
    refreshProbabilities();
  }, [refreshProbabilities]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoundTime((prev) => {
        if (prev <= 1) {
          handleRoundEnd();
          return ROUND_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [handleRoundEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    const gradient = ctx.createLinearGradient(0, 0, 800, 500);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(0.5, "#764ba2");
    gradient.addColorStop(1, "#667eea");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 500);

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "bold 60px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("金沢市", 400, 250);
  }, [areas]);

  const roundTimeText = useMemo(() => {
    const minutes = Math.floor(roundTime / 60);
    const seconds = roundTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [roundTime]);

  const sortedOdds = useMemo(
    () => [...areas].sort((a, b) => a.odds - b.odds),
    [areas],
  );

  const handleSelectArea = (areaId: string) => {
    if (!isRoundActive) return;
    setSelectedArea(areaId);
  };

  const handleBetChange = (amount: number) => {
    if (!isRoundActive) return;
    if (amount <= score) {
      setBetAmount(amount);
    }
  };

  const handleConfirmBet = () => {
    if (!selectedArea || !isRoundActive) return;
    if (score < betAmount) {
      alert("スコアが不足しています！");
      return;
    }

    setScore((prev) => prev - betAmount);
    setLockedBet(betAmount);
    setIsRoundActive(false);
  };

  const handleClear = () => {
    if (!isRoundActive) return;
    setSelectedArea(null);
    setLockedBet(null);
  };

  const confirmDisabled = !selectedArea || !isRoundActive || score < betAmount;
  const confirmLabel = isRoundActive ? "ベット確定" : "判定待ち...";
  const lightningStyle: React.CSSProperties | undefined =
    flashMode === "loss" ? { background: "rgba(0, 0, 0, 0.8)" } : undefined;
  const lightningClass = flashMode !== "none" ? "flash" : "";

  return (
    <div className="page">
      <div
        id="lightning-flash"
        className={lightningClass}
        style={lightningStyle}
      />

      <div className="container">
        <h1 className="title">金沢は今日も鳴雷</h1>

        <div className="game-info">
          <div className="round-timer">
            <span className="label">次のラウンドまで</span>
            <span className="timer">{roundTimeText}</span>
          </div>
          <div className="score-display">
            <span className="label">スコア</span>
            <span className="score">{score}</span>
          </div>
          <div className="bet-display">
            <span className="label">ベット額</span>
            <span className="bet">{lockedBet ?? betAmount}</span>
          </div>
          <div className="bet-display">
            <span className="label">ラウンド</span>
            <span className="bet">#{currentRound}</span>
          </div>
        </div>

        <div className="map-container">
          <canvas id="map-canvas" ref={canvasRef}></canvas>
          <div id="grid-overlay">
            {areas.map((area) => (
              <div
                key={area.id}
                className={[
                  "grid-cell",
                  selectedArea === area.id ? "selected" : "",
                  hitHighlight === area.id ? "hit" : "",
                ].join(" ")}
                data-area-id={area.id}
                onClick={() => handleSelectArea(area.id)}
              >
                <span className="area-label">{area.id}</span>
                <span className="odds-badge">×{getOdds(area.id)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="controls">
          <div className="bet-controls">
            {[50, 100, 250, 500].map((amount) => (
              <button
                key={amount}
                className={[
                  "bet-btn",
                  betAmount === amount ? "active" : "",
                ].join(" ")}
                onClick={() => handleBetChange(amount)}
              >
                {amount}pt
              </button>
            ))}
          </div>
          <div className="action-controls">
            <button
              id="confirm-bet"
              className="action-btn confirm"
              onClick={handleConfirmBet}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </button>
            <button
              id="clear-bet"
              className="action-btn clear"
              onClick={handleClear}
            >
              クリア
            </button>
          </div>
        </div>

        <div className="odds-panel">
          <h3>エリア別オッズ</h3>
          <div id="odds-list">
            {sortedOdds.map((area) => (
              <div className="odds-item" key={area.id}>
                <span className="area">{area.id}</span>
                <span className="odds">×{area.odds.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="history-panel">
          <h3>履歴</h3>
          <div id="history-list">
            {history.map((item) => {
              const time = new Date(item.timestamp).toLocaleTimeString(
                "ja-JP",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              const sign = item.amount >= 0 ? "+" : "";
              return (
                <div
                  className={["history-item", item.isWin ? "win" : "lose"].join(
                    " ",
                  )}
                  key={`${item.round}-${item.timestamp}`}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>
                      #{item.round} [{time}]
                    </span>
                    <span>
                      {item.isWin ? "✓" : "✗"} {item.selectedArea} →{" "}
                      {item.hitArea}
                    </span>
                    <span
                      style={{
                        color: item.isWin ? "#27ae60" : "#e74c3c",
                        fontWeight: "bold",
                      }}
                    >
                      {sign}
                      {item.amount}pt
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {result.visible && (
        <div id="result-overlay" className="result-overlay">
          <div className={`result-content ${result.isWin ? "win" : "lose"}`}>
            <h2>{result.isWin ? "🎉 的中！" : "⚡ 外れ..."}</h2>
            <p>雷はエリア {result.hitArea} に落ちました</p>
            <p>
              {result.isWin
                ? `獲得ポイント: +${result.points}pt`
                : `損失: ${result.points}pt`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
