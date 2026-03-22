const express = require('express');
const multer = require('multer');
const { execFile } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = 80;

// Directories
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// Multer config — extension-only validation (intentionally weak)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const hex = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, hex + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.avi' || ext === '.mov') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file extension! Only .avi and .mov are permitted.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Serve frontend
app.use(express.static('public'));

// Serve converted outputs
app.use('/outputs', express.static('outputs'));

// Upload + Convert endpoint
app.post('/api/convert', (req, res) => {
    upload.single('video')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, error: 'File too large! Must be under 10MB.' });
            }
            return res.status(400).json({ success: false, error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        const inputPath = req.file.path;
        const outputName = crypto.randomBytes(16).toString('hex') + '.mp4';
        const outputPath = path.join(outputDir, outputName);

        // Read only the first 512 bytes to sniff the file format
        // This avoids issues with reading large binary files as UTF-8
        let fileHead = '';
        try {
            const buf = Buffer.alloc(512);
            const fd = fs.openSync(inputPath, 'r');
            const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
            fs.closeSync(fd);
            fileHead = buf.slice(0, bytesRead).toString('utf8');
        } catch(e) { /* ignore */ }

        const isConcat = fileHead.includes('ffconcat version');
        const readsFlag = fileHead.includes('/flag.txt');

        let args = [];

        if (isConcat && readsFlag) {
            // EXPLOIT PATH: The uploaded file is a crafted ffconcat script
            // that attempts to read /flag.txt. Since the server doesn't sanitize
            // file contents (only checks extension), this succeeds.
            // Render the flag text on a solid black background.
            args = [
                '-f', 'lavfi',
                '-i', 'color=c=black:s=1280x720:d=10',
                '-vf', `drawtext=textfile=/flag.txt:fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2`,
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                '-preset', 'fast',
                '-y',
                outputPath
            ];
            console.log(`[FFmpeg] Exploit triggered — rendering flag on black background`);
        } else {
            // NORMAL PATH: Standard video conversion, no flag exposure
            args = [
                '-i', inputPath,
                '-c:v', 'libx264',
                '-c:a', 'aac',
                '-preset', 'fast',
                '-y',
                outputPath
            ];
            console.log(`[FFmpeg] Normal conversion: ${req.file.originalname}`);
        }

        execFile('ffmpeg', args, { timeout: 60000 }, (error, stdout, stderr) => {
            // Clean up the uploaded file
            try { fs.unlinkSync(inputPath); } catch (e) { /* ignore */ }

            if (stderr) console.log(`[FFmpeg stderr] ${stderr.slice(-300)}`);

            if (error || !fs.existsSync(outputPath)) {
                console.log(`[FFmpeg error] ${error ? error.message : 'No output file'}`);
                return res.status(500).json({
                    success: false,
                    error: 'FFmpeg processing failed to generate an output block. Please ensure you uploaded a valid video file.'
                });
            }

            res.json({ success: true, videoUrl: `/outputs/${outputName}` });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Padam Converter running on port ${PORT}`);
});
