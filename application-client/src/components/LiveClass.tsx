import VideoComponent from "./VideoComponent";
import AudioComponent from "./AudioComponent";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa6";

type LiveClassProps = {
  classDetails: any;
  teacherDetails: any;
  leaveRoom: () => void;
  localVideoTrack?: any;
  remoteTracks: any[];
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
};

const LiveClass = ({
  classDetails,
  teacherDetails,
  leaveRoom,
  localVideoTrack,
  remoteTracks,
  isCameraOn,
  isMicOn,
  toggleCamera,
  toggleMicrophone,
}: LiveClassProps) => {
  return (
    <div id="room">
      <div id="room-header">
        <h2 id="room-title">{classDetails?.title}</h2>
      </div>

      <div id="layout-container">
        {localVideoTrack && (
          <VideoComponent track={localVideoTrack} participantIdentity={teacherDetails.name} local={true} />
        )}

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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <button onClick={toggleCamera} className={`icon-btn ${isCameraOn ? "active" : "off"}`}>
          {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button onClick={toggleMicrophone} className={`icon-btn ${isMicOn ? "active" : "off"}`}>
          {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        <button className="btn btn-danger" id="leave-room-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default LiveClass;
