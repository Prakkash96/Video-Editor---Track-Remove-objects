const { exec } = require('child_process');

async function writeTextAboveObjInVideo() {
    const ffmpegCommand = `ffmpeg -i testimage.jpg -vf "drawtext=text='RUNNING':fontfile='./fontfile.ttf':fontcolor=red:fontsize=150:x=(W-tw)/2:y=(H/2)-th" output.jpg -y`;
    await exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing FFmpeg command: ${error}`);
            return;
        }
        const ffmpegCommand2 = `ffmpeg -i test2.mp4 -i output.jpg -filter_complex "[0:v][1:v]scale2ref=iw:ih[video][bg];[video]chromakey=green:0.1:0.0[fg];[bg][fg]overlay[out]" -map "[out]" -map 0:a? -c:a copy output_video.mp4 -y`;
        exec(ffmpegCommand2, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing FFmpeg command: ${error}`);
                return;
            }
            console.log('FFmpeg command executed successfully:' + stdout);
        });
    });

    return;
}

async function writeTextBehindObjInVideo() {
    const ffmpegCommand2 = `ffmpeg -i test3.mp4 -i screenshot.jpg -filter_complex "[0:v][1:v]scale2ref=iw:ih[video][bg];[video]chromakey=green:0.1:0.0[fg];[bg][fg]overlay[out]" -map "[out]" -map 0:a? -c:a copy output_video.mp4 -y`;
    exec(ffmpegCommand2, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing FFmpeg command: ${error}`);
            return;
        }
        console.log('FFmpeg command executed successfully:' + stdout);
    });

    return;
}

module.exports = {
    writeTextAboveObjInVideo,
    writeTextBehindObjInVideo
};