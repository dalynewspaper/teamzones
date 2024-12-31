import {onObjectFinalized} from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import {Storage} from "@google-cloud/storage";
import {SpeechClient, protos} from "@google-cloud/speech";
import * as admin from "firebase-admin";
import ffmpeg from "fluent-ffmpeg";
import * as ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

const speech = new SpeechClient({
  keyFilename: "service-account.json",
});

const storage = new Storage();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function updateVideoStatus(weekId: string, videoId: string, status: string) {
  const db = admin.firestore();
  const weekRef = db.collection("weeks").doc(weekId);
  const weekDoc = await weekRef.get();
  const weekData = weekDoc.data();

  if (weekData?.videos) {
    const updatedVideos = weekData.videos.map((v: any) =>
      v.id === videoId ? {...v, status} : v
    );
    await weekRef.update({videos: updatedVideos});
  }
}

async function updateVideoTranscript(weekId: string, videoId: string, transcript: string) {
  const db = admin.firestore();
  const weekRef = db.collection("weeks").doc(weekId);
  const weekDoc = await weekRef.get();
  const weekData = weekDoc.data();

  if (weekData?.videos) {
    const updatedVideos = weekData.videos.map((v: any) =>
      v.id === videoId ?
        {...v, transcript, status: "ready", updatedAt: new Date().toISOString()} :
        v
    );
    await weekRef.update({videos: updatedVideos});
  }
}

export const processVideo = onObjectFinalized({
  bucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  timeoutSeconds: 540,
  memory: "2GiB",
}, async (event) => {
  const filePath = event.data.name;
  if (!filePath?.includes("videos/")) return;

  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
  const audioFilePath = `${tempFilePath}.wav`;

  try {
    // Download video file
    await storage.bucket(event.data.bucket).file(filePath).download({
      destination: tempFilePath,
    });

    // Extract audio using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempFilePath)
        .toFormat("wav")
        .on("error", reject)
        .on("end", resolve)
        .save(audioFilePath);
    });

    // Read audio file
    const audioBytes = fs.readFileSync(audioFilePath).toString("base64");

    // Configure transcription request
    const audio = {
      content: audioBytes,
    };
    const config: protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
      sampleRateHertz: 16000,
      languageCode: "en-US",
      enableAutomaticPunctuation: true,
      model: "video",
      useEnhanced: true,
    };

    // Update status to transcribing
    const weekId = filePath.split("/")[1];
    const videoId = filePath.split("/")[2].split(".")[0];
    await updateVideoStatus(weekId, videoId, "transcribing");

    // Perform transcription
    const [response] = await speech.recognize({audio, config});
    const transcript = response.results?.map((result) => result.alternatives?.[0]?.transcript).join("\n");

    // Update video with transcript
    await updateVideoTranscript(weekId, videoId, transcript || "");

    // Cleanup temp files
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(audioFilePath);

    logger.info("Successfully processed video", {filePath});
  } catch (error) {
    logger.error("Error processing video:", error);
    const weekId = filePath.split("/")[1];
    const videoId = filePath.split("/")[2].split(".")[0];
    await updateVideoStatus(weekId, videoId, "error");
  }
});
