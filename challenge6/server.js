const net = require('net');
const ethers = require('ethers');
const fs = require('fs');
const solc = require('solc');

// Connect to local Anvil
const RPC_URL = "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Compile Contract Once on Startup
console.log("Compiling Vault.sol...");
const source = fs.readFileSync('Vault.sol', 'utf8');
const input = {
    language: 'Solidity',
    sources: {
        'Vault.sol': {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
if (output.errors) {
    output.errors.forEach(err => console.error(err.formattedMessage));
    const fatal = output.errors.filter(e => e.severity === 'error');
    if (fatal.length > 0) process.exit(1);
}

const contractFile = output.contracts['Vault.sol']['Vault'];
const abi = contractFile.abi;
const bytecode = contractFile.evm.bytecode.object;
console.log("Vault.sol compiled successfully.");

// Pre-funded deployer account from Anvil.
// Anvil Account 0 Default Private Key:
const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const deployerWallet = new ethers.Wallet(deployerPrivateKey, provider);

const PORT = 1337;

// Create the TCP Server
let deployerNonce = null;

const server = net.createServer(async (socket) => {
    socket.write("Bank initialization in progress...\n");

    try {
        if (deployerNonce === null) {
            deployerNonce = await provider.getTransactionCount(deployerWallet.address);
        }
        const currentNonce = deployerNonce;
        deployerNonce += 3; // We send 3 TXs per connection

        // Generate new random wallet for player
        const playerWallet = ethers.Wallet.createRandom().connect(provider);

        // Fund player wallet with 2 ETH from deployer
        let tx = await deployerWallet.sendTransaction({
            to: playerWallet.address,
            value: ethers.parseEther("2.0"),
            nonce: currentNonce
        });
        await tx.wait();

        // Deploy Vault Contract as deployer
        const VaultFactory = new ethers.ContractFactory(abi, bytecode, deployerWallet);
        const vaultContract = await VaultFactory.deploy({ nonce: currentNonce + 1 });
        await vaultContract.waitForDeployment();
        const vaultAddress = await vaultContract.getAddress();

        // Fund the Vault with 10 ETH
        const deployedVault = new ethers.Contract(vaultAddress, abi, deployerWallet);
        tx = await deployedVault.deposit({ value: ethers.parseEther("10.0"), nonce: currentNonce + 2 });
        await tx.wait();

        socket.write(`\n🏦 Welcome to Secure Vault\n\n`);
        socket.write(`We guaranteed your funds are safe.\n`);
        socket.write(`Can you break it?\n\n`);
        socket.write(`Goal: Drain the vault completely to retrieve the flag.\n\n`);
        socket.write(`Instance Details:\n`);
        socket.write(`RPC URL: http://<EXTERNAL_IP>:<EXTERNAL_RPC_PORT> (Check the challenge portal)\n`);
        socket.write(`Private Key: ${playerWallet.privateKey}\n`);
        socket.write(`Your Address: ${playerWallet.address}\n`);
        socket.write(`Vault Address: ${vaultAddress}\n\n`);
        socket.write(`Good luck.\n\n`);

        const showMenu = () => {
            socket.write(`1. View Vault Balance\n`);
            socket.write(`2. Check Flag\n`);
            socket.write(`3. Quit\n`);
            socket.write(`> `);
        };

        showMenu();

        let buffer = '';
        socket.on('data', async (data) => {
            buffer += data.toString();
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                let line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line === '1') {
                    const bal = await provider.getBalance(vaultAddress);
                    socket.write(`\n[+] Vault balance: ${ethers.formatEther(bal)} ETH\n\n`);
                    showMenu();
                } else if (line === '2') {
                    const bal = await provider.getBalance(vaultAddress);
                    if (bal === 0n) {
                        const flag = process.env.FLAG || 'md5string.yg';
                        socket.write(`\n🎉 Vault balance: 0\n`);
                        socket.write(`🎉 Flag: ${flag}\n\n`);
                    } else {
                        socket.write(`\n[-] Vault is not empty yet. Balance: ${ethers.formatEther(bal)} ETH\n\n`);
                    }
                    showMenu();
                } else if (line === '3') {
                    socket.write(`\nGoodbye.\n`);
                    socket.end();
                } else if (line !== '') {
                    socket.write(`\nInvalid choice.\n\n`);
                    showMenu();
                }
            }
        });

        socket.on('error', (err) => {
            console.log(`Socket error on connection: ${err.message}`);
        });

    } catch (e) {
        socket.write(`\nError initializing instance: ${e.message}\n`);
        socket.end();
        console.error(`Error initializing instance: ${e}`);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`TCP Challenge Server listening on port ${PORT}`);
});
