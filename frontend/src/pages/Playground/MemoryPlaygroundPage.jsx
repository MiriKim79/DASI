import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client.js";
import CategoryCard from "../../components/CategoryCard.jsx";
import RetroWindow from "../../components/RetroWindow.jsx";

// 추억 놀이터 분야 선택 화면
export default function MemoryPlaygroundPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    api
      .getCategories()
      .then((data) => {
        if (alive) setCategories(data);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSelect = (category) => {
    navigate(`/play/${category.code}`);
  };

  return (
    <div className="page page--centered">
      <RetroWindow titleColor="#9b7bd4">
        <h1 className="window-heading">
          <span className="sparkle">✨</span>
          어떤 분야의 추억을 꺼내볼까?
          <span className="sparkle">✨</span>
        </h1>

        {loading && <p className="state-msg">추억을 불러오는 중… ⏳</p>}
        {error && <p className="state-msg state-msg--error">⚠️ {error}</p>}
        {!loading && !error && categories.length === 0 && (
          <p className="state-msg">아직 분야가 없어요.</p>
        )}

        {!loading && !error && categories.length > 0 && (
          <>
            <div className="category-grid">
              {categories.map((c) => (
                <CategoryCard key={c.id} category={c} onClick={handleSelect} />
              ))}
            </div>
            <button
              type="button"
              className="challenge-cta"
              onClick={() => navigate("/challenge")}
            >
              🏆 20문제 챌린지 도전하고 랭킹 등록하기
            </button>
          </>
        )}
      </RetroWindow>

      <p className="page-footer">
        1990~2020년대 우리의 추억을 소환하는 시간 여행! 🎵
      </p>
    </div>
  );
}
