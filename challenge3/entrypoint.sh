#!/bin/bash

# Create flag file (strictly owned by root)
echo "$FLAG" > /home/ctf/flag.txt
chown root:root /home/ctf/flag.txt
chmod 400 /home/ctf/flag.txt

# Start SSH daemon in the foreground
/usr/sbin/sshd -D
