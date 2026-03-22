#!/bin/bash

# Start Anvil in the background, bound to all interfaces
anvil --host 0.0.0.0 --port 8545 > /dev/null 2>&1 &

# Wait for Anvil to start
sleep 2

# Start the Node.js TCP server
node server.js
