import "dotenv/config";
import express from "express";
import cors from "cors";
import { AccessToken, WebhookReceiver } from "livekit-server-sdk";
import axios from "axios";

const SERVER_PORT = process.env.SERVER_PORT || 6080;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5080", "http://localhost:6080", "http://192.168.69.129:5080"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.options('*', cors());
app.use(express.json());
app.use(express.raw({ type: "application/webhook+json" }));

app.post("/check-token", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ errorMessage: "Authorization header is required" });
    return;
  }
  const accessToken = authHeader.split(" ")[1];
  let userId = '1234'

  const { classId, className, classStartTime, courseName } = req.body;
  if (!classId || !className || !classStartTime) {
    res.status(400).json({ errorMessage: "classId, className, classStartTime and courseName are required" });
    return;
  }

  try {
    // const verifyToken = axios.post("http://localhost:8080/verify-token", {
    //   accessToken,
    // });
    const verifyToken = true;

    if (!verifyToken) {
      console.log("Invalid token");
      return res.status(401).json({ errorMessage: "Invalid token" });
    }

    
    return res.status(200).json({ classId, userId });
  } catch (error) {
    throw new Error("Error verifying token");
  }
});

app.post("/token", async (req, res) => {
  const roomName = req.body.roomName;
  const participantName = req.body.participantName;

  if (!roomName || !participantName) {
    res.status(400).json({ errorMessage: "roomName and participantName are required" });
    return;
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  });
  at.addGrant({ roomJoin: true, room: roomName });
  const token = await at.toJwt();
  res.json({ token });
});

const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

app.post("/livekit/webhook", async (req, res) => {
  try {
    const event = await webhookReceiver.receive(req.body, req.get("Authorization"));
    console.log(event);
  } catch (error) {
    console.error("Error validating webhook event", error);
  }
  res.status(200).send();
});

app.listen(SERVER_PORT, () => {
  console.log("Server started on port:", SERVER_PORT);
});
