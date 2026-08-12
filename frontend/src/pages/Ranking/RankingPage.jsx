import { useEffect, useState } from "react";
import RetroWindow from "../../components/RetroWindow.jsx";
import { rankingApi } from "../../api/ranking.js";
import "./RankingPage.css";

function formatAccuracy(accuracy) {
  return `${Math.round(accuracy * 100)}%`;
}

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRanking() {
      try {
        const records = await rankingApi.getRanking();
        if (isMounted) setRanking(records);
      } catch {
        if (isMounted) setError("랭킹을 불러오지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRanking();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page ranking-page">
      <RetroWindow titleColor="#9b7bd4">
        <section className="ranking-page__content" aria-labelledby="ranking-title">
          <h1 id="ranking-title" className="window-heading">
            <span className="sparkle">✨</span>
            통합 랭킹
            <span className="sparkle">✨</span>
          </h1>
          <p className="ranking-page__intro">사용자별 역대 최고 공식 기록 기준 · Top 5</p>

          {isLoading && <p className="state-msg">랭킹을 불러오는 중...</p>}
          {!isLoading && error && <p className="state-msg state-msg--error">{error}</p>}
          {!isLoading && !error && ranking.length === 0 && (
            <p className="state-msg">아직 랭킹 기록이 없습니다.</p>
          )}
          {!isLoading && !error && ranking.length > 0 && (
            <ol className="ranking-list">
              {ranking.map((item) => (
                <li key={item.rank} className="ranking-list__item">
                  <span className="ranking-list__rank">{item.rank}위</span>
                  <span className="ranking-list__nickname" title={item.nickname}>
                    {item.nickname}
                  </span>
                  <span className="ranking-list__score">
                    <b>{item.correct_count}</b>/{item.total_count}
                  </span>
                  <span className="ranking-list__accuracy">{formatAccuracy(item.accuracy)}</span>
                  <span className="ranking-list__time">{item.elapsed_seconds}초</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </RetroWindow>
    </div>
  );
}
