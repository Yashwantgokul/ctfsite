#!/bin/bash

# Write flag from env to /root/flag.txt
echo "$FLAG" > /root/flag.txt
chmod 600 /root/flag.txt

# Start SSH daemon in foreground
exec /usr/sbin/sshd -D
