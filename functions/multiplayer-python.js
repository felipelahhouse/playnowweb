const functions = require('firebase-functions');
const { spawn } = require('child_process');
const path = require('path');

exports.multiplayerPython = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '512MB',
  })
  .https.onRequest((req, res) => {
    const pythonPath = path.join(__dirname, 'python-server', 'servidor.py');
    const python = spawn('python3', [pythonPath]);

    python.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
    });

    python.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
    });

    res.send('Python multiplayer server starting...');
  });
