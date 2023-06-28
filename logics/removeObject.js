const fs = require('fs');
const path = require('path');
const cv = require('opencv4nodejs');
const ffmpeg = require('fluent-ffmpeg');

const tempDir = './temp/';
let regionToErase = {};


async function eraseObject(req) {
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


module.exports = {
    eraseObject
};
