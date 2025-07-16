import axios, { AxiosError } from 'axios';
import { VideoInfo, YouTubeApiResponse } from '@/types/datatypes';
import { YOUTUBE_CATEGORIES } from '@/utils/utils';

type CategoryKey = keyof typeof YOUTUBE_CATEGORIES;

export async function getYouTubeVideoInfo(videoId: string): Promise<VideoInfo> {
  if (!videoId) {
    throw new Error('Missing video ID');
  }

  try {
    const response = await axios.get<YouTubeApiResponse>(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = response.data.items[0].snippet;
    const category = YOUTUBE_CATEGORIES[video.categoryId as CategoryKey] || 'Unknown';

    return {
      title: video.title,
      description: video.description,
      category,
      thumbnails: video.thumbnails,
      publishedAt: video.publishedAt,
      channelTitle: video.channelTitle,
    };
  } catch (err) {
    const error = err as AxiosError;

    if (error.response) {
      throw new Error(
        `YouTube API error: ${error.response.status} - ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new Error('No response from YouTube API');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}
