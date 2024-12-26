"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = void 0;
const functions = __importStar(require("firebase-functions"));
const storage_1 = require("@google-cloud/storage");
const speech_1 = require("@google-cloud/speech");
const firestore_1 = require("firebase-admin/firestore");
const admin = __importStar(require("firebase-admin"));
const ffmpeg = __importStar(require("fluent-ffmpeg"));
const ffmpegInstaller = __importStar(require("@ffmpeg-installer/ffmpeg"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
admin.initializeApp();
const speech = new speech_1.SpeechClient({
    keyFilename: 'service-account.json'
});
const storage = new storage_1.Storage();
const db = (0, firestore_1.getFirestore)();
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
exports.processVideo = functions.storage.object().onFinalize(async (object) => {
    var _a;
    const filePath = object.name;
    if (!(filePath === null || filePath === void 0 ? void 0 : filePath.includes('videos/')))
        return;
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const audioFilePath = `${tempFilePath}.wav`;
    try {
        // Download video file
        await storage.bucket(object.bucket).file(filePath).download({
            destination: tempFilePath
        });
        // Extract audio using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(tempFilePath)
                .toFormat('wav')
                .on('error', reject)
                .on('end', resolve)
                .save(audioFilePath);
        });
        // Read audio file
        const audioBytes = fs.readFileSync(audioFilePath).toString('base64');
        // Configure transcription request
        const audio = {
            content: audioBytes
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            model: 'video',
            useEnhanced: true
        };
        // Update status to transcribing
        const weekId = filePath.split('/')[1];
        const videoId = filePath.split('/')[2].split('.')[0];
        await updateVideoStatus(weekId, videoId, 'transcribing');
        // Perform transcription
        const [response] = await speech.recognize({ audio, config });
        const transcript = (_a = response.results) === null || _a === void 0 ? void 0 : _a.map(result => { var _a, _b; return (_b = (_a = result.alternatives) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript; }).join('\n');
        // Update video with transcript
        await updateVideoTranscript(weekId, videoId, transcript);
        // Cleanup temp files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(audioFilePath);
    }
    catch (error) {
        console.error('Error processing video:', error);
        const weekId = filePath.split('/')[1];
        const videoId = filePath.split('/')[2].split('.')[0];
        await updateVideoStatus(weekId, videoId, 'error');
    }
});
async function updateVideoStatus(weekId, videoId, status) {
    const weekRef = db.collection('weeks').doc(weekId);
    const weekDoc = await weekRef.get();
    const weekData = weekDoc.data();
    if (weekData === null || weekData === void 0 ? void 0 : weekData.videos) {
        const updatedVideos = weekData.videos.map((v) => v.id === videoId ? Object.assign(Object.assign({}, v), { status }) : v);
        await weekRef.update({ videos: updatedVideos });
    }
}
async function updateVideoTranscript(weekId, videoId, transcript) {
    const weekRef = db.collection('weeks').doc(weekId);
    const weekDoc = await weekRef.get();
    const weekData = weekDoc.data();
    if (weekData === null || weekData === void 0 ? void 0 : weekData.videos) {
        const updatedVideos = weekData.videos.map((v) => v.id === videoId
            ? Object.assign(Object.assign({}, v), { transcript, status: 'ready', updatedAt: new Date().toISOString() }) : v);
        await weekRef.update({ videos: updatedVideos });
    }
}
//# sourceMappingURL=index.js.map