const express = require('express');
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


async function removeObjInAVideo() {
    app.use(express.static(__dirname));
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });
    app.post('/button-click', async (req, res) => {
        try {
            await removeObjPOC.eraseObject(req.body);
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


async function main() {
    console.log("START");
    // await replaceGreenScreenWithtextedImage();
    await removeObjInAVideo();

}

main();