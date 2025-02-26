import VideoComponent from "./VideoComponent";
import AudioComponent from "./AudioComponent";

type LiveClassProps = {
  classDetails: any;
  teacherDetails: any;
  leaveRoom: () => void;
  localVideoTrack?: any;
  remoteTracks: any[];
};

const LiveClass = ({ classDetails, teacherDetails, leaveRoom, localVideoTrack, remoteTracks }: LiveClassProps) => {
  return (
    <div id="room">
      <div id="room-header">
        <h2 id="room-title">{classDetails?.classTitle}</h2>
        <button className="btn btn-danger" id="leave-room-button" onClick={leaveRoom}>
          Leave Room
        </button>
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
    </div>
  );
};

export default LiveClass;
