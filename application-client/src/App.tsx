import { useState, useEffect } from "react";
import { Room, RoomEvent } from "livekit-client";
import { useParams } from "react-router-dom";
import LiveClass from "./components/LiveClass";
import PreviewScreen from "./components/PreviewScreen";
import { MediaProvider, useMedia } from "./context/MediaContext";
import { updateLiveClassStatus } from "./utils/statusUpdate";

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
  const { classId } = useParams();
  const [room, setRoom] = useState<Room | undefined>(undefined);
  const [remoteTracks, setRemoteTracks] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(true);
  const [classDetails, setClassDetails] = useState<any>({});
  const [teacherDetails, setTeacherDetails] = useState<any>({});

  const { localVideoTrack, localAudioTrack, isCameraOn, isMicOn, toggleCamera, toggleMicrophone } = useMedia();

  useEffect(() => {
    fetchTeacherDetails();
    if (classId) {
      fetchClassDetails(classId);
    }
  }, [classId]);

  async function fetchTeacherDetails() {
    try {
      setAuthenticating(true);
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_TEACHER_PROFILE}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setIsAuthenticated(true);
        setTeacherDetails(await response.json());
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setAuthenticating(false);
    }
  }

  async function fetchClassDetails(id: string) {
    try {
      const response = await fetch(`${import.meta.env.VITE_EK_ACADEMY_LIVE_CLASS_DETAILS}?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
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

      await updateLiveClassStatus(roomName, "ongoing");
    } catch (error) {
      console.log("Error connecting to the room:", (error as Error).message);
      await updateLiveClassStatus(roomName, "scheduled");
      await leaveRoom();
    }
  }

  async function leaveRoom() {
    await room?.disconnect();
    setRoom(undefined);
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
          authenticating={authenticating}
          isAuthenticated={isAuthenticated}
          classDetails={classDetails}
          teacherDetails={teacherDetails}
          updateLiveClassStatus={updateLiveClassStatus}
        />
      ) : (
        <LiveClass
          classDetails={classDetails}
          teacherDetails={teacherDetails}
          leaveRoom={leaveRoom}
          localVideoTrack={localVideoTrack}
          remoteTracks={remoteTracks}
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          toggleCamera={toggleCamera}
          toggleMicrophone={toggleMicrophone}
        />
      )}
    </>
  );
}

export default App;
