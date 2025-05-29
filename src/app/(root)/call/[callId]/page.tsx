// app/meeting/[callId]/page.tsx
'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { 
  StreamVideo, 
  StreamVideoClient,
  StreamCall,
  Call,
  CallControls,
  // SpeakerLayout,
  useCallStateHooks,
  ParticipantView,
  CallParticipantsList,
  useCall
} from '@stream-io/video-react-sdk';
import { Button, Tooltip, Layout, Badge } from 'antd';
import { 
  AudioOutlined, 
  AudioMutedOutlined, 
  VideoCameraOutlined, 
  VideoCameraFilled, 
  UserOutlined,
  CloseOutlined
} from '@ant-design/icons';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import 'antd/dist/reset.css';

const { Content, Sider } = Layout;

const MeetingRoom = ({ params }: { params: Promise<{ callId: string }>}) => {
  const { callId } = use(params);
  const { user, isLoaded } = useUser();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Setup Stream client and call
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

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

    const newCall = client.call('default', callId);
    newCall.join({ create: true });

    setVideoClient(client);
    setCall(newCall);

    return () => {
      newCall.leave();
      client.disconnectUser();
    };
  }, [user, isLoaded, callId]);

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

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading user...</div>;
  }

  if (!videoClient || !call) {
    return <div className="flex items-center justify-center h-screen">Starting meeting...</div>;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <div className="flex flex-col h-screen bg-gray-900 text-white">
          <ParticipantsHeader callId={callId} />
          
          <Layout className="flex-1 bg-gray-900">
            <Content className="flex flex-col">
              <OtherParticipantsStrip />
              <MainSpeakerView />
            </Content>
            
            {showParticipants && (
              <Sider 
                width={300} 
                theme="dark" 
                className="bg-gray-800 border-l border-gray-700 !overflow-auto"
              >
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Participants</h2>
                    <Button 
                      type="text" 
                      icon={<CloseOutlined />} 
                      onClick={() => setShowParticipants(false)}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CallParticipantsList onClose={() => setShowParticipants(false)} />
                  </div>
                </div>
              </Sider>
            )}
          </Layout>
          
          <ControlBar 
            isMicOn={isMicOn} 
            isCameraOn={isCameraOn} 
            toggleMic={toggleMic} 
            toggleCamera={toggleCamera} 
            showParticipants={showParticipants}
            toggleParticipants={() => setShowParticipants(!showParticipants)}
          />
        </div>
      </StreamCall>
    </StreamVideo>
  );
};

const ParticipantsHeader = ({ callId }: { callId: string }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const call = useCall();
  
  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Meeting Room: {callId}</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <UserOutlined className="mr-2" />
            <span>{participants.length} participants</span>
          </div>
          <Button 
            type="primary" 
            onClick={() => call?.camera.flip()}
          >
            Flip Camera
          </Button>
        </div>
      </div>
    </div>
  );
};

const OtherParticipantsStrip = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const dominantSpeaker = participants.find(p => p.isDominantSpeaker);
  
  // Filter out the dominant speaker and local participant
  const otherParticipants = participants.filter(p => 
    !p.isLocalParticipant && p.sessionId !== dominantSpeaker?.sessionId
  );

  if (otherParticipants.length === 0) return null;

  return (
    <div className="h-24 bg-gray-800 border-b border-gray-700">
      <div className="flex overflow-x-auto space-x-4 p-2 h-full">
        {otherParticipants.map(participant => (
          <div 
            key={participant.sessionId} 
            className="w-40 h-full flex-shrink-0 rounded-lg overflow-hidden"
          >
            <div className="w-full h-full relative bg-gray-700">
              <ParticipantView 
                participant={participant} 
                muteAudio
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 text-xs truncate">
                {participant.name || 'Unknown'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MainSpeakerView = () => {
  const { useParticipants, useCallCallingState } = useCallStateHooks();
  const participants = useParticipants();
  const callingState = useCallCallingState();
  const dominantSpeaker = participants.find(p => p.isDominantSpeaker);
  const localParticipant = participants.find(p => p.isLocalParticipant);
  const mainParticipant = dominantSpeaker || localParticipant;
  
  if (callingState !== 'joined') {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="bg-gray-800 rounded-full p-8 mb-4 inline-block">
            <UserOutlined className="text-5xl" />
          </div>
          <p>Joining meeting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center relative bg-gray-900">
      {mainParticipant ? (
        <div className="w-full h-full relative">
          <ParticipantView 
            participant={mainParticipant} 
          />
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 p-2 rounded">
            {mainParticipant.name || 'Unknown'} {mainParticipant.isLocalParticipant && '(You)'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <div className="bg-gray-800 rounded-full p-8 mb-4">
            <UserOutlined className="text-5xl" />
          </div>
          <p>Waiting for participants to join...</p>
        </div>
      )}
    </div>
  );
};

const ControlBar = ({ 
  isMicOn, 
  isCameraOn, 
  toggleMic, 
  toggleCamera,
  showParticipants,
  toggleParticipants
}: { 
  isMicOn: boolean; 
  isCameraOn: boolean; 
  toggleMic: () => void; 
  toggleCamera: () => void;
  showParticipants: boolean;
  toggleParticipants: () => void;
}) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

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
        
        <Tooltip title={showParticipants ? "Hide participants" : "Show participants"}>
          <Badge count={participants.length} overflowCount={99}>
            <Button
              shape="circle"
              size="large"
              icon={<UserOutlined />}
              onClick={toggleParticipants}
              className={showParticipants ? 'bg-blue-500' : ''}
            />
          </Badge>
        </Tooltip>
        
        <CallControls onLeave={() => window.location.href = '/'} />
      </div>
    </div>
  );
};

export default MeetingRoom;