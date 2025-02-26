import VideoComponent from "./VideoComponent";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";

type PreviewScreenProps = {
  localVideoTrack?: any;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  joinRoom: (roomName: string, participantName: string) => void;
  isAuthenticated: boolean;
  classDetails: any;
  teacherDetails: any;
};

const PreviewScreen = ({
  localVideoTrack,
  isCameraOn,
  isMicOn,
  toggleCamera,
  toggleMicrophone,
  joinRoom,
  isAuthenticated,
  classDetails,
  teacherDetails,
}: PreviewScreenProps) => {
  return (
    <div id="join">
      <div id="join-dialog">
        <h2>ED ROOM</h2>
        <h5>Video Meeting By Sheba Innovators</h5>

        {/* Video Preview with Mic & Camera Icons */}
        <div className="video-preview-container">
          {localVideoTrack && (
            <VideoComponent track={localVideoTrack} participantIdentity={teacherDetails.name} local={true} />
          )}

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

        <button className="btn btn-lg btn-success" onClick={() => joinRoom(classDetails.title, teacherDetails._id)}>
          {isAuthenticated ? "Start Class" : "Authentication Failed"}
        </button>
      </div>
    </div>
  );
};

export default PreviewScreen;
