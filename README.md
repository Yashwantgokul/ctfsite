<div align="center">
  <h1>🎯 Dynamic CTF Testing Platform</h1>
  <p>A sleek, on-demand Capture The Flag (CTF) hosting platform built with Node.js and Docker.</p>
</div>

---


## ✨ Features

- **On-Demand Isolated Containers:** Every challenge spins up instantly in its own isolated Docker container with zero port collisions.
- **Integrated Web CLI (Multi-Tab):** Play directly from the browser! Features a built-in Kali Linux terminal panel powered by `ttyd`, complete with a modern **multi-tab interface** to run concurrent sessions.
- **Automated Lifecycle Management:** Seamlessly Start, Restart, or Terminate challenge instances via the intuitive UI.
- **Categorized Dashboard:** Challenges are cleanly grouped by their domains (e.g., 🛡️ Privilege Escalation, 🌐 Web Exploitation, ⚙️ Binary Exploitation, 🧮 Cryptography, 🔗 Blockchain).
- **Smart Connection Drawer:** Automatically provides exact connection commands (`ssh`, `nc`, `curl`) alongside generated dynamic credentials once a workspace is deployed.
- **Flag Validation:** Automated flag-checking API to track solve validations (`/submit`).

## 🗃️ Included Challenges

The platform comes pre-loaded with **6 diverse cybersecurity challenges**:

1. **Linux Privilege Escalation** (Medium): Find common local Linux misconfigurations to reach `/root/flag.txt`.
2. **Hidden in Plain Sight** (Easy): Reconnaissance web challenge exploring obscured server files.
3. **Stack Smash Starter** (Easy): A classic `gets()` buffer overflow exploit targeting a local binary.
4. **Two is Prime** (Easy): A flawed RSA cryptographic setup. Factor a weak configuration to decrypt the flag.
5. **pwfeedback Overflow (CVE-2019-18634)** (Medium): Exploit a real-world Sudo vulnerability.
6. **Secure Vault** (Medium): A blockchain smart contract exploitation task requiring you to deploy a smart-contract reentrancy attack against a vulnerable vault node.

---

## 🚀 Setup Guide

### Prerequisites
- **Node.js** (v16+)
- **Docker Engine** (Must be actively running in the background)

### 1. Installation

Clone the repository and install the backend controller dependencies:
```bash
git clone https://github.com/Yashwantgokul/ctfsite.git
cd ctfsite

npm install
```

### 2. Build the Challenge Images

Before spawning challenges on the web interface, your local Docker daemon needs to build the target images. Run the following commands to compile all the challenge architectures and the Web CLI image:

```bash
docker build -t privesc-walter ./challenge
docker build -t robots-txt ./challenge2
docker build -t pwn-stack-smash ./challenge3
docker build -t rsa-two-is-prime ./challenge4
docker build -t sudo-baron-samedit ./challenge5
docker build -t secure-vault-sc ./challenge6

# Build the Web CLI module
docker build -t web-kali ./kali
```

*(Note: Building `web-kali` and the challenges might take a few minutes as it pulls down required base packages.)*

### 3. Start the Platform

Launch the backend controller API:

```bash
npm start
```

The CTF Platform should now securely listen on **[http://localhost:3000](http://localhost:3000)**. 

---

### 🛡️ How It Works (Architecture)

1. The Node server operates as a manager over the Docker socket.
2. An isolated bridged network (`ctf_net`) is created.
3. Upon clicking **"Deploy & Start"**, a unique flag is generated securely and injected cleanly into the target container's environment (`FLAG`).
4. Docker dynamically maps the required service ports (22, 1337, 8545, 80) and reports the live connections back to the Node API.
5. The UI dynamically renders the exact connection strings mapping back to your host network or internal Docker gateway without exposing hardcoded ports. 

> *Disclaimer: Intended for local or VPN-based (e.g. Wireguard) educational deployments. If hosting publicly on a VPS, ensure proper Docker firewall rules and rate limiting.*
