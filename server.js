const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let activeContainerId = null;
let currentFlag = null;
let activeKaliId = null;
let activeChallengeId = null;

const DOCKER_NETWORK = 'ctf_net';
const KALI_IMAGE = 'web-kali';

const challenges = {
    '1': {
        image: 'privesc-walter',
        port: 22,
        type: 'ssh',
        username: 'walter',
        password: '12345678'
    },
    '2': {
        image: 'robots-txt',
        port: 80,
        type: 'http',
        username: '',
        password: ''
    },
    '3': {
        image: 'pwn-stack-smash',
        port: 22,
        type: 'ssh',
        username: 'ctf',
        password: 'ctf'
    },
    '4': {
        image: 'rsa-two-is-prime',
        port: 1337,
        type: 'nc',
        username: '',
        password: ''
    },
    '5': {
        image: 'sudo-baron-samedit',
        port: 22,
        type: 'ssh',
        username: 'player',
        password: 'player'
    },
    '6': {
        image: 'secure-vault-sc',
        port: 1337,
        rpcPort: 8545,
        type: 'nc',
        username: '',
        password: ''
    }
};

// Initialize network
exec(`docker network create ${DOCKER_NETWORK}`, () => {
    // Ignore error if it already exists
});

function generateFlag() {
    const uuid = crypto.randomUUID();
    const hash = crypto.createHash('md5').update(uuid).digest('hex');
    return `${hash}.yg`;
}

function stopContainer() {
    return new Promise((resolve) => {
        if (!activeContainerId) return resolve();
        console.log(`Stopping container ${activeContainerId}...`);
        exec(`docker rm -f ${activeContainerId}`, (err) => {
            if (err) console.error(`Error stopping container: ${err.message}`);
            activeContainerId = null;
            currentFlag = null;
            activeChallengeId = null;
            resolve();
        });
    });
}

function stopKaliContainer() {
    return new Promise((resolve) => {
        if (!activeKaliId) return resolve();
        console.log(`Stopping kali container ${activeKaliId}...`);
        exec(`docker rm -f ${activeKaliId}`, (err) => {
            if (err) console.error(`Error stopping kali container: ${err.message}`);
            activeKaliId = null;
            resolve();
        });
    });
}

function startContainer(hostIp, challengeId) {
    const config = challenges[challengeId];
    if (!config) return Promise.reject(new Error("Invalid challenge ID"));

    return new Promise((resolve, reject) => {
        const flag = generateFlag();
        const cmd = `docker run -d -P --network ${DOCKER_NETWORK} -e FLAG="${flag}" ${config.image}`;

        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(new Error(`Failed to start container: ${stderr || err.message}`));

            const containerId = stdout.trim();
            activeContainerId = containerId;
            activeChallengeId = challengeId;
            currentFlag = flag;

            exec(`docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ${containerId}`, (errIp, stdoutIp) => {
                let internalIp = 'Unknown';
                if (!errIp && stdoutIp) {
                    internalIp = stdoutIp.trim();
                }

                exec(`docker port ${containerId} ${config.port}`, (errPort, stdoutPort) => {
                    if (errPort) {
                        stopContainer();
                        return reject(new Error("Failed to get port mapping."));
                    }
                    const portMatch = stdoutPort.match(/:(\d+)$/m);
                    if (!portMatch) {
                        stopContainer();
                        return reject(new Error("Could not parse port mapping."));
                    }
                    const port = parseInt(portMatch[1], 10);

                    const result = {
                        challengeId: challengeId,
                        type: config.type,
                        ip: hostIp || 'localhost',
                        internalIp: internalIp,
                        port: port,
                        username: config.username,
                        password: config.password
                    };

                    if (config.rpcPort) {
                        exec(`docker port ${containerId} ${config.rpcPort}`, (errRpc, stdoutRpc) => {
                            if (!errRpc && stdoutRpc) {
                                const rpcMatch = stdoutRpc.match(/:(\d+)$/m);
                                if (rpcMatch) {
                                    result.rpcPort = parseInt(rpcMatch[1], 10);
                                }
                            }
                            resolve(result);
                        });
                    } else {
                        resolve(result);
                    }
                });
            });
        });
    });
}

function startKaliContainer(hostIp) {
    return new Promise((resolve, reject) => {
        const cmd = `docker run -d -P --network ${DOCKER_NETWORK} ${KALI_IMAGE}`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(new Error(`Failed to start kali container: ${stderr || err.message}`));

            const containerId = stdout.trim();
            activeKaliId = containerId;

            exec(`docker port ${containerId} 7681`, (errPort, stdoutPort) => {
                if (errPort) {
                    stopKaliContainer();
                    return reject(new Error("Failed to get kali port mapping."));
                }
                const portMatch = stdoutPort.match(/:(\d+)$/m);
                if (!portMatch) {
                    stopKaliContainer();
                    return reject(new Error("Could not parse kali port mapping."));
                }
                const port = parseInt(portMatch[1], 10);
                resolve({
                    url: `http://${hostIp || 'localhost'}:${port}`
                });
            });
        });
    });
}

app.post('/start', async (req, res) => {
    try {
        const challengeId = req.body.challengeId || '1';
        await stopContainer();
        let hostIp = req.hostname;
        if (hostIp === '::1' || hostIp === '127.0.0.1') hostIp = 'localhost';
        const details = await startContainer(hostIp, challengeId);
        res.json(details);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/restart', async (req, res) => {
    try {
        const challengeId = activeChallengeId || '1';
        await stopContainer();
        let hostIp = req.hostname;
        if (hostIp === '::1' || hostIp === '127.0.0.1') hostIp = 'localhost';
        const details = await startContainer(hostIp, challengeId);
        res.json(details);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/stop', async (req, res) => {
    try {
        await stopContainer();
        res.json({ status: "stopped" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/start-kali', async (req, res) => {
    try {
        await stopKaliContainer();
        let hostIp = req.hostname;
        if (hostIp === '::1' || hostIp === '127.0.0.1') hostIp = 'localhost';
        const details = await startKaliContainer(hostIp);
        res.json(details);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/submit', (req, res) => {
    const { flag } = req.body;
    if (!activeContainerId) {
        return res.status(400).json({ status: "wrong", message: "No active instance" });
    }
    if (flag && flag.trim() === currentFlag) {
        res.json({ status: "correct" });
    } else {
        res.json({ status: "wrong" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CTF MVP platform listening on http://localhost:${PORT}`);
});
