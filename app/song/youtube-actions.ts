"use server";

type YouTubeSearchResponse = {
  items?: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      thumbnails: { medium?: { url: string }; default?: { url: string } };
    };
  }[];
};

export async function searchSongAtYouTube(query: string) {
  const apiKey = process.env.GOOGLE_YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY가 설정되지 않았습니다.");
  }

  const searchQuery = `${query} 금영 노래방 KY Karaoke`;
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      searchQuery,
    )}&type=video&videoEmbeddable=true&key=${apiKey}&maxResults=30`,
  );
  const data = (await response.json()) as YouTubeSearchResponse;

  return (data.items ?? [])
    .filter((item) => {
      const title = item.snippet.title.toUpperCase();
      const channelTitle = item.snippet.channelTitle.toUpperCase();
      return !title.includes("TJ") && !channelTitle.includes("TJ");
    })
    .map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnailUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
    }));
}