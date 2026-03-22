#!/bin/sh

# Write the platform-generated flag to /flag.txt (for reference)
echo "$FLAG" > /flag.txt
chmod 444 /flag.txt

# Start the Node.js server
node server.js
