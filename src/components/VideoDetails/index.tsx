import { VideoInfo } from '@/types/datatypes';
import { YOUTUBE_CATEGORIES } from '@/utils/utils';
import { useState, useEffect } from 'react';

interface VideoDetailsProps {
  videoId: string;
  onError?: (error: string) => void;
}

// Category mapping (simplified)
const getCategoryName = (id: string): string => {
  return YOUTUBE_CATEGORIES[id] || `${id}`;
};

export default function VideoDetails({ videoId, onError }: VideoDetailsProps) {
  const [videoData, setVideoData] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!videoId.trim()) {
        setVideoData(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/video/getInfo?id=${videoId}`);
        const data: VideoInfo = await response.json();
        // console.log("youtube data", data)

        if (!data) {
          throw new Error('Video not found');
        }

        setVideoData(data);
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setVideoData(null);
        onError?.(error);
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [videoId, onError]);

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!videoData) return <div className="p-4 text-center">No video data</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold">{videoData.title}</h2>
      
      <div className="flex space-x-4 text-sm text-gray-600">
        <span>Category: {getCategoryName(videoData.category)}</span>
        <span>Channel: {videoData.channelTitle}</span>
      </div>

      {videoData.thumbnails.standard?.url && (
        <img
          src={videoData.thumbnails.standard.url}
          alt="Video thumbnail"
          className="w-full rounded-lg"
        />
      )}

      <div className="prose">
        <p className="whitespace-pre-line line-clamp-5">
          {videoData.description}
        </p>
      </div>
    </div>
  );
}