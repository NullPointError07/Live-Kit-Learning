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
import { useParams } from "react-router-dom";
import LiveClass from "./components/LiveClass";
import PreviewScreen from "./components/PreviewScreen";

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

function App() {
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | undefined>(undefined);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | undefined>(undefined);
  const [remoteTracks, setRemoteTracks] = useState<TrackInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [classDetails, setClassDetails] = useState<any>({});
  const [teacherDetails, setTeacherDetails] = useState<any>({});
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
    try {
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_TEACHER_PROFILE}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // "x-access-token":
          //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzQ1YWE4MGU4ZjdhMjg5NTIzZjRmZTQiLCJ1c2VyVHlwZSI6InRlYWNoZXIiLCJpYXQiOjE3NDA1NDgzOTksImV4cCI6MTc0MDU2MTM5OX0.0tYsvZ1C8A327ZrIbuK8oF5sF5RgUPspPZlEQQ8n5yU",
        },
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
        setTeacherDetails(await response.json());
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  }

  console.log("classDetails", classDetails);
  console.log("teacherDetails", teacherDetails);

  async function fetchClassDetails(id: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_LIVE_CLASS_DETAILS}?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          // "x-access-token":
          //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzQ1YWE4MGU4ZjdhMjg5NTIzZjRmZTQiLCJ1c2VyVHlwZSI6InRlYWNoZXIiLCJpYXQiOjE3NDA1NDgzOTksImV4cCI6MTc0MDU2MTM5OX0.0tYsvZ1C8A327ZrIbuK8oF5sF5RgUPspPZlEQQ8n5yU",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch class details");
      }

      const data = await response.json();
      setClassDetails(data?.data[0]);
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
        <PreviewScreen
          localVideoTrack={localVideoTrack}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          toggleCamera={toggleCamera}
          toggleMicrophone={toggleMicrophone}
          joinRoom={joinRoom}
          isAuthenticated={isAuthenticated}
          classDetails={classDetails}
          teacherDetails={teacherDetails}
        />
      ) : (
        <LiveClass
          classDetails={classDetails}
          teacherDetails={teacherDetails}
          leaveRoom={leaveRoom}
          localVideoTrack={localVideoTrack}
          remoteTracks={remoteTracks}
        />
      )}
    </>
  );
}

export default App;
