const fs = require('fs');
const cv = require('opencv4nodejs');
const sharp = require('sharp');
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


// async function trackObject(req) {

//     const drawRedRect = (img, x, y, width, height) => {
//         const rect = new cv.Rect(x, y, width, height);
//         img.drawRectangle(
//             rect,
//             new cv.Vec(0, 0, 255),
//             2
//         );
//     };

//     regionToErase = {
//         x: req.x,
//         y: req.y,
//         width: req.width,
//         height: req.height
//     }

//     if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir);
//     }
//     const video = new cv.VideoCapture('./test.mp4');
//     const fps = video.get(cv.CAP_PROP_FPS);


//     let frame = video.read();
//     const initialBoundingBox = new cv.Rect(regionToErase.x, regionToErase.y, regionToErase.width, regionToErase.height);
//     const tracker = new cv.TrackerCSRT();
//     tracker.init(frame, initialBoundingBox);

//     let frameCount = 0;
//     while ((frame = video.read())) {
//         if (frame.empty == true)
//             break;

//         let boundingBox = tracker.update(frame);
//         // if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0 && boundingBox.x > 0 && boundingBox.y > 0)
//         //     drawRedRect(frame, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
//         if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0 && boundingBox.x >= 0 && boundingBox.y >= 0) {
//             let cropAngle = {
//                 x: boundingBox.x,
//                 y: boundingBox.y,
//                 width: boundingBox.width,
//                 height: boundingBox.height
//             }
//             if (boundingBox.width + boundingBox.x >= frame.cols)
//                 cropAngle.width = frame.cols - boundingBox.x
//             if (boundingBox.height + boundingBox.y >= frame.rows)
//                 cropAngle.height = frame.rows - boundingBox.y

//             frame = await performInpainting(frame, cropAngle);
//         }

//         const framePath = `${tempDir}/frame_${frameCount}.png`;
//         cv.imwrite(framePath, frame);
//         frameCount++;
//     }


//     const outputVideoPath = './output.mp4';

//     const command = ffmpeg();
//     command.input(`${tempDir}/frame_%d.png`);
//     command.outputOptions(['-r', 30]);
//     command.outputOptions(['-c:v', 'libx264']);
//     command.outputOptions('-pix_fmt yuv420p');
//     command.output(outputVideoPath);

//     function createOutputVideo() {
//         return new Promise((resolve, reject) => {
//             command.on('error', (err) => {
//                 console.error('Error creating the output video:', err);
//                 reject(err);
//             }).on('end', () => {
//                 console.log('Output video created successfully.');
//                 resolve();
//             }).run();
//         });
//     }
//     await createOutputVideo();

//     return;
// }


// async function trackObject(req) {
//     regionToErase = {
//         x: req.x,
//         y: req.y,
//         width: req.width,
//         height: req.height
//     }
//     if (!fs.existsSync(tempDir)) {
//         fs.mkdirSync(tempDir);
//     }

//     const videoCapture = new cv.VideoCapture('./test.mp4');
//     let frame = videoCapture.read();

//     let initialBoundingBox = new cv.Rect(regionToErase.x, regionToErase.y, regionToErase.width, regionToErase.height);
//     let tracker = new cv.TrackerCSRT();
//     tracker.init(frame, initialBoundingBox);

//     let frameCount = 0;

//     while (true) {
//         frame = videoCapture.read();
//         if (frame.empty) {
//             break;
//         }
//         let boundingBox = tracker.update(frame);
//         if (boundingBox && boundingBox.width > 0 && boundingBox.height > 0 && boundingBox.x > 0 && boundingBox.y > 0) {
//             let cropAngle = {
//                 x: boundingBox.x,
//                 y: boundingBox.y,
//                 width: boundingBox.width,
//                 height: boundingBox.height
//             }
//             if (boundingBox.width + boundingBox.x >= frame.cols)
//                 cropAngle.width = frame.cols - boundingBox.x
//             if (boundingBox.height + boundingBox.y >= frame.rows)
//                 cropAngle.height = frame.rows - boundingBox.y

//         }
//         frameCount++;
//     }


//     videoCapture.release();
// }

async function trackObject(req) {
    regionToErase = {
        x: req.x,
        y: req.y,
        width: req.width,
        height: req.height
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
        const backgroundFrames = [];

        for (let i = 1; i < frames.length; i++) {
            const frame = frames[i];
            const objectMask = objectMasks[i];
            let bgAvailableCheck = false;

            const background = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC3, new cv.Vec3(0, 0, 0));
            const backgroundMask = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC1, 255);

            for(let j = i-1; j > 0; j--) {
                const nextFrame = frames[j];
                const nextMask = objectMasks[j];

                const overlapImage = (objectMask).bitwiseAnd(nextMask);
                const hasOverlap = overlapImage.countNonZero() > 0;
                if(!hasOverlap) {
                    bgAvailableCheck = true;
                    console.log(i + ":" +j);
                }
            }

            for(let j = i+1; j < frames.length; j++) {
                const nextFrame = frames[j];
                const nextMask = objectMasks[j];

                const overlapImage = (objectMask).bitwiseAnd(nextMask);
                const hasOverlap = overlapImage.countNonZero() > 0;
                if(!hasOverlap) {
                    bgAvailableCheck = true;
                    console.log(i + ":" +j);
                }
            }

            // for (let j = i+1; j < frames.length; j++) {
            //     const prevFrame = frames[j];
            //     const prevObjectMask = objectMasks[j];
            //     cv.imwrite(`${tempDir}/a_${j}.png`, prevObjectMask);
            //     cv.imwrite(`${tempDir}/b_${j}.png`, prevObjectMask.bitwiseNot());
            //     prevFrame.copyTo(background, prevObjectMask.bitwiseNot());
            //     cv.imwrite(`${tempDir}/c_${j}.png`, background);
            //     prevObjectMask.bitwiseAnd(backgroundMask, backgroundMask);
            //     cv.imwrite(`${tempDir}/aa_${j}.png`, prevObjectMask);
            //     cv.imwrite(`${tempDir}/d_${j}.png`, backgroundMask);
            // }

            // frame.copyTo(background, objectMask.bitwiseNot());
            // objectMask.bitwiseAnd(backgroundMask, backgroundMask);

            backgroundFrames.push(background);
        }

        return backgroundFrames;
    }

    async function removeObject(frames, objectMasks, backgroundFrames) {
        const outputFrames = [];
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const objectMask = objectMasks[i];
            const foregroundMask = objectMask.bitwiseNot();
            const foreground = new cv.Mat(frame.rows, frame.cols, cv.CV_8UC3);
            frame.copyTo(foreground, foregroundMask);
            const backgroundFrame = backgroundFrames[i];
            const outputFrame = backgroundFrame.copy();
            const foregroundRegion = foreground.getRegion(new cv.Rect(0, 0, frame.cols, frame.rows));
            foregroundRegion.copyTo(outputFrame.getRegion(new cv.Rect(0, 0, frame.cols, frame.rows)), foregroundMask);
            outputFrames.push(outputFrame);
        }
        return outputFrames;
    }

    async function saveUpdatedFrames(images) {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        for (var i = 0; i < images.length; i++) {
            cv.imwrite(`${tempDir}/frame_${i}.png`, images[i]);
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

    const frames = await extractFrames('./test.mp4');
    const objectCoordinates = new cv.Rect(regionToErase.x, regionToErase.y, regionToErase.width, regionToErase.height);
    const objectMasks = await detectAndTrackObject(frames, objectCoordinates);
    const background = await extractBackground(frames, objectMasks);
    const outputFrames = await removeObject(frames, objectMasks, background);
    await saveUpdatedFrames(outputFrames);
    await reconstructVideo('./output.mp4');
    return;
}


module.exports = {
    eraseStaticObject,
    trackObject
};
