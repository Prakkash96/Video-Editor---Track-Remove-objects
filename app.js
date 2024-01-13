const express = require('express');
const ffmpegConcat = require('ffmpeg-concat');
const app = express();
app.use(express.json());
const greenScreenPOC = require('./logics/greenScreenPOC');
const puppeteerPOC = require('./logics/puppeteerPOC');
const removeObjPOC = require('./logics/removeObject');

async function replaceGreenScreenWithtextedImage() {
    await puppeteerPOC.createTransparentImg();

    var htmlString = await puppeteerPOC.getHtmlString();
    await puppeteerPOC.takeScreenshot(htmlString);

    await greenScreenPOC.writeTextBehindObjInVideo();
    return 0;
}


async function removeStaticObject() {
    app.use(express.static(__dirname));
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });
    app.post('/button-click', async (req, res) => {
        try {
            await removeObjPOC.eraseStaticObject(req.body);
            console.log('DONE');
            const responseMessage = 'Video generated successfully';
            res.json({ message: responseMessage });
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('Error occurred while erasing object');
        }
    });

    app.listen(5100, () => {
        console.log('Server started on port 5100');
    });

    return;
}

async function objectTracking() {
    app.use(express.static(__dirname));
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });
    app.post('/button-click', async (req, res) => {
        try {
            await removeObjPOC.trackObject(req.body);
            console.log('DONE');
            const responseMessage = 'Video generated successfully';
            res.json({ message: responseMessage });
        } catch (error) {
            console.error('An error occurred:', error);
            res.status(500).send('Error occurred while erasing object');
        }
    });

    app.listen(5100, () => {
        console.log('Server started on port 5100');
    });
    return;
}

async function glTransition() {
    await ffmpegConcat({
        output: 'output.mp4',
        videos: [
            'f.mp4',
            'g.mp4'
        ],
        transition: {
            name: 'squeeze',
            duration: 1000
        }
    });
    return true;
}

async function main() {
    console.log("START");
    // await replaceGreenScreenWithtextedImage();
    // await removeStaticObject();
    await objectTracking();
    // await glTransition();
}

main();
