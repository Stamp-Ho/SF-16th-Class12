"use client";

import { useState, useEffect } from "react";
import { searchSongAtYouTube, startTopSongRecord } from "./actions";
import YouTube from "react-youtube";

export default function SearchModal({
  targetRecordId, // 업데이트할 현재 1순위 DB 레코드 ID (UUID)
  onClose
}: {
  targetRecordId: string;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // Server Action에서 이미 파싱된 배열을 받아옴
      const results = await searchSongAtYouTube(searchQuery);
      setSearchResults(results);
      setSelectedSong(null); // 새로운 검색 시 기존 선택 초기화
    } catch (err) {
      console.error(err);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSong || !targetRecordId) return;
    try {
      const { error } = await startTopSongRecord({
        id: targetRecordId,
        songName: selectedSong.title,
        youtubeVideoId: selectedSong.id,
        youtubeUrl: selectedSong.youtubeUrl
      });
      if (error) {
        throw new Error("노래 기록 업데이트 실패");
      }
      onClose();
    } catch (err) {
      setError("노래 시작 처리 중 오류가 발생했습니다.");
    }
  };

  //모달 생성시 input에 포커스

  useEffect(() => {
    const inputElement = document.getElementById(
      "song-search-input"
    ) as HTMLInputElement | null;
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]">
        {/* 모달 제목 */}
        <h2 className="text-xl font-bold mb-4 text-slate-800">
          노래 검색 및 선택
        </h2>

        {/* 검색 입력 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2 mb-4"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="가수나 노래 제목을 입력하세요 (예: 윤하 사건의 지평선)"
            id="song-search-input"
            className="flex-grow border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ssafy-blue"
          />
          <button
            type="submit"
            className="bg-ssafy-blue text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-ssafy-blue/80 transition-colors"
          >
            검색
          </button>
        </form>

        {/* 선택한 영상 미리보기 영역 */}
        {selectedSong && (
          <div className="mb-4 p-3 bg-slate-100 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              🎵 선택된 노래 미리보기
            </p>
            <div className="aspect-video w-full rounded-lg overflow-hidden shadow-inner">
              <YouTube
                videoId={selectedSong.id}
                opts={{
                  width: "100%",
                  height: "100%",
                  playerVars: {
                    autoplay: 1,
                    // 현재 웹사이트의 도메인을 명시 (로컬 테스트 시 http://localhost:3000)
                    origin:
                      typeof window !== "undefined"
                        ? window.location.origin
                        : ""
                  }
                }}
                className="w-full h-full"
              />
            </div>
            <p className="text-sm font-medium mt-2 line-clamp-1 text-slate-800">
              {selectedSong.title}
            </p>
          </div>
        )}

        {/* 검색 결과 리스트 */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-center py-8 text-gray-500 text-sm">검색 중...</p>
          ) : error ? (
            <p className="text-center py-8 text-red-500 text-sm">{error}</p>
          ) : (
            <ul className="space-y-2">
              {searchResults.length === 0 ? (
                <li className="text-center py-8 text-gray-400 text-sm">
                  검색 결과가 없습니다.
                </li>
              ) : (
                searchResults.map((song) => {
                  const isSelected = selectedSong?.id === song.id;
                  return (
                    <li
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-blue-50 border-ssafy-blue ring-1 ring-ssafy-blue"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {/* 썸네일 */}
                      <img
                        src={song.thumbnailUrl}
                        alt={song.title}
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      {/* 제목 */}
                      <p
                        className="text-sm font-medium text-slate-800 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: song.title }}
                      />
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

        {/* 모달 하단 버튼 */}
        <div className="mt-4 pt-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSong}
            className={`px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-xl shadow transition-colors ${
              !selectedSong
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-green-700"
            }`}
          >
            이 노래로 시작
          </button>
        </div>
      </div>
    </div>
  );
}
