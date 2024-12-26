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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processVideo = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const bucket = admin.storage().bucket();
exports.processVideo = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    if (!(filePath === null || filePath === void 0 ? void 0 : filePath.startsWith('videos/')) || !filePath.endsWith('.webm')) {
        return;
    }
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const thumbnailPath = path.join(os.tmpdir(), `thumb_${path.basename(filePath)}.jpg`);
    try {
        // Download video file
        await bucket.file(filePath).download({ destination: tempFilePath });
        // Generate thumbnail
        await generateThumbnail(tempFilePath, thumbnailPath);
        // Get video duration
        const duration = await getVideoDuration(tempFilePath);
        // Upload thumbnail
        const thumbnailFileName = `thumbnails/${path.basename(filePath)}.jpg`;
        await bucket.upload(thumbnailPath, {
            destination: thumbnailFileName,
            metadata: {
                contentType: 'image/jpeg',
            },
        });
        // Get thumbnail URL
        const [thumbnailUrl] = await bucket
            .file(thumbnailFileName)
            .getSignedUrl({ action: 'read', expires: '03-01-2500' });
        // Update video metadata in Firestore
        const weekId = filePath.split('/')[1]; // videos/{weekId}/{filename}
        await updateVideoMetadata(weekId, filePath, {
            duration,
            thumbnailUrl,
            status: 'ready'
        });
        // Cleanup
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(thumbnailPath);
    }
    catch (error) {
        console.error('Error processing video:', error);
        const weekId = filePath.split('/')[1];
        await updateVideoMetadata(weekId, filePath, {
            duration: 0,
            thumbnailUrl: '',
            status: 'error'
        });
    }
});
async function generateThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .screenshots({
            timestamps: ['50%'],
            filename: 'thumbnail.jpg',
            folder: path.dirname(thumbnailPath),
            size: '320x180'
        })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
}
async function getVideoDuration(videoPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
            if (err)
                reject(err);
            resolve(metadata.format.duration || 0);
        });
    });
}
async function updateVideoMetadata(weekId, videoPath, metadata) {
    const db = admin.firestore();
    const weekRef = db.collection('weeks').doc(weekId);
    const weekDoc = await weekRef.get();
    if (!weekDoc.exists)
        return;
    const week = weekDoc.data();
    const videos = (week === null || week === void 0 ? void 0 : week.videos) || [];
    // Find and update the video metadata
    const updatedVideos = videos.map((video) => {
        if (video.id === path.basename(videoPath)) {
            return Object.assign(Object.assign({}, video), metadata);
        }
        return video;
    });
    await weekRef.update({ videos: updatedVideos });
}
//# sourceMappingURL=processVideo.js.map