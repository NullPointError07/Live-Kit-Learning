import {
  LocalVideoTrack,
  LocalAudioTrack,
  RemoteAudioTrack,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  createLocalTracks,
  AudioTrack,
} from "livekit-client";
import "./App.css";
import { useState, useEffect } from "react";
import VideoComponent from "./components/VideoComponent";
import AudioComponent from "./components/AudioComponent";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa"; // Import Icons
import { useParams } from "react-router-dom";

type TrackInfo = {
  trackPublication: RemoteTrackPublication;
  participantIdentity: string;
};

let APPLICATION_SERVER_URL = "";
let LIVEKIT_URL = "";
configureUrls();

function configureUrls() {
  if (!APPLICATION_SERVER_URL) {
    APPLICATION_SERVER_URL =
      window.location.hostname === "localhost"
        ? "http://localhost:6080/"
        : "http://" + window.location.hostname + ":6080/";
  }
  if (!LIVEKIT_URL) {
    LIVEKIT_URL =
      window.location.hostname === "localhost" ? "ws://localhost:7880/" : "ws://" + window.location.hostname + ":7880/";
  }
}

let accessTokenFromCookies = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");

function App() {
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>(undefined);
  const [remoteTracks, setRemoteTracks] = useState<TrackInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [classDetails, setClassDetails] = useState<any>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const { classId } = useParams();


  useEffect(() => {
    startPreview();
    fetchTeacherDetails();
    if (classId) {
      fetchClassDetails(classId);
    }
  }, [classId]);

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

  function toggleCamera() {
    if (localVideoTrack) {
      isCameraOn ? localVideoTrack.mute() : localVideoTrack.unmute();
      setIsCameraOn(!isCameraOn);
    }
  }

  function toggleMicrophone() {
    if (localAudioTrack) {
      isMicOn ? localAudioTrack.mute() : localAudioTrack.unmute();
      setIsMicOn(!isMicOn);
    }
  }

  async function fetchTeacherDetails() {
    if (accessTokenFromCookies) {
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_TEACHER_PROFILE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": `${accessTokenFromCookies}`,
        },
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }

  async function fetchClassDetails(id: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_LIVE_CLASS_DETAILS}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch class details");
      }

      const data = await response.json();
      setClassDetails(data);
    } catch (error) {
      console.error("Error fetching class details:", error);
    }
  }

  async function joinRoom(roomName: string, participantName: string) {
    const room = new Room();
    setRoom(room);

    room.on(RoomEvent.TrackSubscribed, (_track, publication, participant) => {
      setRemoteTracks((prev) => [
        ...prev,
        {
          trackPublication: publication,
          participantIdentity: participant.identity,
        },
      ]);
    });

    room.on(RoomEvent.TrackUnsubscribed, (_track, publication) => {
      setRemoteTracks((prev) => prev.filter((track) => track.trackPublication.trackSid !== publication.trackSid));
    });

    try {
      const token = await getToken(roomName, participantName);
      await room.connect(LIVEKIT_URL, token);

      if (localVideoTrack) {
        await room.localParticipant.publishTrack(localVideoTrack);
      }
      if (localAudioTrack) {
        await room.localParticipant.publishTrack(localAudioTrack);
      }
    } catch (error) {
      console.log("Error connecting to the room:", (error as Error).message);
      await leaveRoom();
    }
  }

  async function leaveRoom() {
    await room?.disconnect();
    setRoom(undefined);
    setLocalVideoTrack(undefined);
    setLocalAudioTrack(undefined);
    setRemoteTracks([]);
  }

  async function getToken(roomName: string, participantName: string) {
    const response = await fetch(APPLICATION_SERVER_URL + "token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName, participantName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get token: ${error.errorMessage}`);
    }

    const data = await response.json();
    return data.token;
  }

  return (
    <>
      {!room ? (
        <div id="join">
          <div id="join-dialog">
            <h2>ED ROOM</h2>
            <h5>Video Meeting By Sheba Innovators</h5>

            {/* Video Preview with Mic & Camera Icons */}
            <div className="video-preview-container">
              {localVideoTrack && <VideoComponent track={localVideoTrack} participantIdentity="Preview" local={true} />}

              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button onClick={toggleCamera} className={`icon-btn ${isCameraOn ? "active" : "off"}`}>
                  {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
                </button>
                <button onClick={toggleMicrophone} className={`icon-btn ${isMicOn ? "active" : "off"}`}>
                  {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
              </div>
            </div>

            <button className="btn btn-lg btn-success" onClick={() => joinRoom("TestRoom", "User123")}>
              {isAuthenticated ? "Start Class" : "Authentication Failed"}
            </button>
          </div>
        </div>
      ) : (
        <div id="room">
          <div id="room-header">
            <h2 id="room-title">TestRoom</h2>
            <button className="btn btn-danger" id="leave-room-button" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>

          <div id="layout-container">
            {localVideoTrack && <VideoComponent track={localVideoTrack} participantIdentity="You" local={true} />}

            {remoteTracks.map((remoteTrack) =>
              remoteTrack.trackPublication.kind === "video" ? (
                <VideoComponent
                  key={remoteTrack.trackPublication.trackSid}
                  track={remoteTrack.trackPublication.videoTrack!}
                  participantIdentity={remoteTrack.participantIdentity}
                />
              ) : (
                <AudioComponent
                  key={remoteTrack.trackPublication.trackSid}
                  track={remoteTrack.trackPublication.audioTrack!}
                />
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
