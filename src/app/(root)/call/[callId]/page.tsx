// app/meeting/[callId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  StreamVideo, 
  StreamVideoClient,
  Call,
  SpeakerLayout,
  CallControls,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import { Button, Tooltip } from 'antd';
import { 
  AudioOutlined, 
  AudioMutedOutlined, 
  VideoCameraOutlined, 
  VideoCameraFilled, 
  PhoneOutlined,
  UserOutlined 
} from '@ant-design/icons';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'antd/dist/reset.css';

const MeetingRoom = ({ params }: { params: { callId: string }}) => {
  const { user } = useUser();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Setup Stream client and call
  useEffect(() => {
    if (!user?.id) return;

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
    const tokenProvider = async () => {
      const response = await fetch(`/api/get-stream-token?userId=${user.id}`);
      const { token } = await response.json();
      return token;
    };

    const client = new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        name: user.fullName || user.username || 'Unknown',
        image: user.imageUrl,
      },
      tokenProvider,
    });

    const newCall = client.call('default', params.callId);
    newCall.join({ create: true });

    setVideoClient(client);
    setCall(newCall);

    return () => {
      newCall.leave();
      client.disconnectUser();
    };
  }, [user, params.callId]);

  // Toggle microphone
  const toggleMic = () => {
    if (call) {
      call.microphone.toggle();
      setIsMicOn(!isMicOn);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (call) {
      call.camera.toggle();
      setIsCameraOn(!isCameraOn);
    }
  };

  if (!videoClient || !call) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <StreamVideo client={videoClient}>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <ParticipantsHeader callId={params.callId} />
        <div className="flex-1">
          <SpeakerLayout />
        </div>
        <ControlBar 
          isMicOn={isMicOn} 
          isCameraOn={isCameraOn} 
          toggleMic={toggleMic} 
          toggleCamera={toggleCamera} 
        />
      </div>
    </StreamVideo>
  );
};

const ParticipantsHeader = ({ callId }: { callId: string }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Meeting Room: {callId}</h1>
        <div className="flex items-center space-x-2 overflow-x-auto py-2">
          {participants.map((participant) => (
            <div key={participant.sessionId} className="flex flex-col items-center">
              <div className="bg-gray-700 rounded-full p-2">
                <UserOutlined className="text-lg" />
              </div>
              <span className="text-xs mt-1 truncate max-w-[80px]">
                {participant.name || 'Unknown'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ControlBar = ({ 
  isMicOn, 
  isCameraOn, 
  toggleMic, 
  toggleCamera 
}: { 
  isMicOn: boolean; 
  isCameraOn: boolean; 
  toggleMic: () => void; 
  toggleCamera: () => void; 
}) => {
  return (
    <div className="flex justify-center items-center p-4 bg-gray-800 border-t border-gray-700">
      <div className="flex space-x-6">
        <Tooltip title={isMicOn ? "Mute microphone" : "Unmute microphone"}>
          <Button
            shape="circle"
            size="large"
            icon={isMicOn ? <AudioOutlined /> : <AudioMutedOutlined />}
            onClick={toggleMic}
            className={!isMicOn ? 'bg-red-500' : ''}
          />
        </Tooltip>
        
        <Tooltip title={isCameraOn ? "Turn off camera" : "Turn on camera"}>
          <Button
            shape="circle"
            size="large"
            icon={isCameraOn ? <VideoCameraFilled /> : <VideoCameraOutlined />}
            onClick={toggleCamera}
            className={!isCameraOn ? 'bg-red-500' : ''}
          />
        </Tooltip>
        
        <CallControls onLeave={() => window.location.href = '/'} />
      </div>
    </div>
  );
};

export default MeetingRoom;