import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { VideoInfo, YouTubeApiResponse } from '@/types/datatypes';
import { YOUTUBE_CATEGORIES } from '@/utils/utils';

export const dynamic = 'force-dynamic'; // Ensure this is a dynamic route

type CategoryKey = keyof typeof YOUTUBE_CATEGORIES;

export async function GET(request: Request): Promise<NextResponse<VideoInfo |{error: string}>> {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');

  if (!videoId) {
    return NextResponse.json(
      { error: 'Missing video ID' },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get<YouTubeApiResponse>(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    // console.log("response", response.data.items[0].snippet)

    if (!response.data.items || response.data.items.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const video = response.data.items[0].snippet;
    const category = YOUTUBE_CATEGORIES[video.categoryId as CategoryKey] || 'Unknown';

    const result: VideoInfo = {
      title: video.title,
      description: video.description,
      category,
      thumbnails: video.thumbnails,
      publishedAt: video.publishedAt,
      channelTitle: video.channelTitle,
    };

    return NextResponse.json(result);
  } catch (err) {
    const error = err as AxiosError<YouTubeApiResponse>;
    
    console.error('YouTube API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        {
          error: 'YouTube API error',
          details: error.response.data.error || error.response.statusText
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        {
          error: 'No response from YouTube API',
          details: error.request
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        {
          error: 'Request setup error',
          details: error.message
        },
        { status: 500 }
      );
    }
  }
}