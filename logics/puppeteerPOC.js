const fs = require('fs');
const puppeteer = require('puppeteer');
const { createCanvas, registerFont } = require('canvas');


async function takeScreenshot(template) {
    const imageBuffer1 = fs.readFileSync('C:\\Project\\POC_NodeJS\\testimage.jpg');
    const imageSrc1 = `data:image/jpeg;base64,${imageBuffer1.toString('base64')}`;    
    var modifiedTemplate = await template.replace('./testimage.jpg', imageSrc1);

    const imageBuffer2 = fs.readFileSync('C:\\Project\\POC_NodeJS\\transparentImage.png');
    const imageSrc2 = `data:image/png;base64,${imageBuffer2.toString('base64')}`;    
    modifiedTemplate = await modifiedTemplate.replace('./transparentImage.png', imageSrc2);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(modifiedTemplate);

    await page.screenshot({ path: 'screenshot.jpg', clip: { x: 10, y: 10, width: 1276, height: 716 } });
    await browser.close();
    return;
}

async function createTransparentImg() {
    registerFont('./fontfile.ttf', { family: 'FontFamilyName' });

    const canvas = createCanvas(1280, 720);

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.font = '150px "FontFamilyName"';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'red';

    context.fillText('RUNNING', canvas.width / 2, canvas.height / 2);

    const imageBuffer = canvas.toBuffer('image/png');
    fs.writeFileSync('transparentImage.png', imageBuffer);
    return;
}

async function getHtmlString() {
    var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Merged Image</title>
      <style>
        .image-container {
          position: relative;
          width: 1280px;
          height: 720px;
        }
    
        .image-container img {
          position: absolute;
          top: 0;
          left: 0;
        }
      </style>
    </head>
    <body>
      <div class="image-container">
        <img src="./testimage.jpg" alt="Image 1">
        <img src="./transparentImage.png" alt="Image 2">
      </div>
    </body>
    </html>
    `;

    const htmlFilePath = 'temp.html';
    fs.writeFileSync(htmlFilePath, htmlContent);
    return htmlContent;
}

module.exports = {
    takeScreenshot,
    createTransparentImg,
    getHtmlString
};