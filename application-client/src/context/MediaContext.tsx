import React, { createContext, useContext, useState, useEffect } from "react";
import { LocalAudioTrack, LocalVideoTrack, createLocalTracks } from "livekit-client";

type MediaContextType = {
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  localVideoTrack?: LocalVideoTrack;
  localAudioTrack?: LocalAudioTrack;
};

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>(undefined);

  useEffect(() => {
    async function startPreview() {
      try {
        const tracks = await createLocalTracks({ audio: true, video: true });

        const videoTrack = tracks.find((track) => track.kind === "video") as LocalVideoTrack;
        const audioTrack = tracks.find((track) => track.kind === "audio") as LocalAudioTrack;

        if (videoTrack) setLocalVideoTrack(videoTrack);
        if (audioTrack) setLocalAudioTrack(audioTrack);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }

    startPreview();
  }, []);

  const toggleCamera = () => {
    if (localVideoTrack) {
      isCameraOn ? localVideoTrack.mute() : localVideoTrack.unmute();
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMicrophone = () => {
    if (localAudioTrack) {
      isMicOn ? localAudioTrack.mute() : localAudioTrack.unmute();
      setIsMicOn(!isMicOn);
    }
  };

  return (
    <MediaContext.Provider
      value={{ isCameraOn, isMicOn, toggleCamera, toggleMicrophone, localVideoTrack, localAudioTrack }}
    >
      {children}
    </MediaContext.Provider>
  );
};

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
};
