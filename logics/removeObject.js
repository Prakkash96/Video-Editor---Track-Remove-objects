const fs = require('fs');
const cv = require('opencv4nodejs');
const ffmpeg = require('fluent-ffmpeg');

const tempDir = './temp/';
let regionToErase = {};


async function eraseStaticObject(req) {
    regionToErase = {
        x: req.x,
        y: req.y,
        width: req.width,
        height: req.height
    }
    const videoCapture = new cv.VideoCapture('./test.mp4');
    const fps = videoCapture.get(cv.CAP_PROP_FPS);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    let frameCount = 0;
    let frame;
    console.log('Object removal and background In-Painting process started....');
    while ((frame = videoCapture.read())) {
        if (frame.empty == true)
            break;
        const inpaintedFrame = await performInpainting(frame, regionToErase);
        const framePath = `${tempDir}/frame_${frameCount}.png`;
        cv.imwrite(framePath, inpaintedFrame);
        frameCount++;
    }
    videoCapture.release();
    console.log('In-Painting completed for all the frame. \nGenerating the video using the In-Painted frames....');
    const outputVideoPath = './output.mp4';

    const command = ffmpeg();
    command.input(`${tempDir}/frame_%d.png`);
    command.outputOptions(['-r', fps]);
    command.outputOptions(['-c:v', 'libx264']);
    command.outputOptions('-pix_fmt yuv420p');
    command.output(outputVideoPath);
    function createOutputVideo() {
        return new Promise((resolve, reject) => {
            command.on('error', (err) => {
                console.error('Error creating the output video:', err);
                reject(err);
            }).on('end', () => {
                console.log('Output video created successfully.');
                resolve();
            }).run();
        });
    }
    await createOutputVideo();
    return;
}

async function performInpainting(frame, regionToErase) {
    const regionCoordinates = new cv.Rect(regionToErase.x, regionToErase.y, regionToErase.width, regionToErase.height);
    const mask = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC1, 0);
    mask.getRegion(regionCoordinates).setTo(255);
    const inpaintedImage = cv.inpaint(frame, mask, 1, cv.INPAINT_TELEA);
    return inpaintedImage;
}

async function extractFrames(videoPath) {
    const videoCapture = new cv.VideoCapture(videoPath);
    const frames = [];
    let frame;
    while ((frame = videoCapture.read())) {
        if (frame.empty == true)
            break;
        frames.push(frame);
    }
    return frames;
}

async function detectAndTrackObject(frames, objectCoordinates) {
    const firstFrame = frames[0];
    let objectTracker = new cv.TrackerCSRT();
    objectTracker.init(firstFrame, objectCoordinates);
    const objectMasks = [new cv.Mat(firstFrame.rows, firstFrame.cols, cv.CV_8UC1)];
    for (let i = 1; i < frames.length; i++) {
        const frame = frames[i];
        const objectMask = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC1);
        let boundingBox = objectTracker.update(frame);
        if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0 && boundingBox.x > 0 && boundingBox.y > 0) {
            let cropAngle = {
                x: boundingBox.x,
                y: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height
            }
            if (boundingBox.width + boundingBox.x >= frame.cols)
                cropAngle.width = frame.cols - boundingBox.x
            if (boundingBox.height + boundingBox.y >= frame.rows)
                cropAngle.height = frame.rows - boundingBox.y
            const { x, y, width, height } = cropAngle;
            objectMask.drawRectangle(new cv.Point2(x, y), new cv.Point2(x + width, y + height), new cv.Vec3(255, 255, 255), -1);
        }
        objectMasks.push(objectMask);
    }
    return objectMasks;
}

async function extractBackground(frames, objectMasks) {
    let futureFrame, futureObjectMask, diffMask, areaMask;
    let fullBGRecovered, frame, objectMask, background, backgroundMask;
    for (let i = 1; i < frames.length; i++) {
        fullBGRecovered = false;
        frame = frames[i];
        objectMask = objectMasks[i];
        background = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC3, new cv.Vec3(255, 255, 255));
        frame.copyTo(background, objectMask.bitwiseNot());
        backgroundMask = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC1, 255);
        backgroundMask = objectMask.bitwiseNot();
        for (let j = i; j > 0; j--) {
            futureFrame = frames[j];
            futureObjectMask = objectMasks[j];
            areaMask = objectMask.bitwiseXor(futureObjectMask);
            diffMask = areaMask.bitwiseAnd(futureObjectMask.bitwiseNot());
            backgroundMask = diffMask.bitwiseOr(backgroundMask);
            objectMask = backgroundMask.bitwiseNot();
            futureFrame.copyTo(background, diffMask);
            if (cv.countNonZero(objectMask) === 0) {
                fullBGRecovered = true;
                break;
            }
        }
        if (!fullBGRecovered) {
            for (let j = i; j < frames.length; j++) {
                futureFrame = frames[j];
                futureObjectMask = objectMasks[j];
                areaMask = objectMask.bitwiseXor(futureObjectMask);
                diffMask = areaMask.bitwiseAnd(futureObjectMask.bitwiseNot());
                backgroundMask = diffMask.bitwiseOr(backgroundMask);
                objectMask = backgroundMask.bitwiseNot();
                futureFrame.copyTo(background, diffMask);
                if (cv.countNonZero(objectMask) === 0) {
                    fullBGRecovered = true;
                    break;
                }
            }
        }
        if (!fullBGRecovered) {
            background = cv.inpaint(background, objectMask, 1, cv.INPAINT_TELEA);
        }
        cv.imwrite(`${tempDir}/frame_${i}.png`, background);
    }
    return;
}

async function reconstructVideo(outputPath) {
    const command = ffmpeg();
    command.input(`${tempDir}/frame_%d.png`);
    command.outputOptions(['-r', 30]);
    command.outputOptions(['-c:v', 'libx264']);
    command.outputOptions('-pix_fmt yuv420p');
    command.output(outputPath);
    function createOutputVideo() {
        return new Promise((resolve, reject) => {
            command.on('error', (err) => {
                console.error('Error creating the output video:', err);
                reject(err);
            }).on('end', () => {
                console.log('Output video created successfully.');
                resolve();
            }).run();
        });
    }
    await createOutputVideo();
    return;
}

async function trackObject(req) {
    regionToErase = {
        x: req.x,
        y: req.y,
        width: req.width,
        height: req.height
    }
    const frames = await extractFrames('./test.mp4');
    const objectCoordinates = new cv.Rect(regionToErase.x, regionToErase.y, regionToErase.width, regionToErase.height);
    const objectMasks = await detectAndTrackObject(frames, objectCoordinates);
    await extractBackground(frames, objectMasks);
    await reconstructVideo('./output.mp4');
    return;
}

module.exports = {
    eraseStaticObject,
    trackObject
};
