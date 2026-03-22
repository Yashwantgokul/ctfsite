#!/bin/bash

# Output the dynamic flag securely
echo "${FLAG:-ctf{default_baron_samedit_flag}}" > /root/flag.txt
chown root:root /root/flag.txt
chmod 400 /root/flag.txt

# Strip FLAG from environment variables so the unprivileged user cannot see it
unset FLAG

# Start SSH daemon
exec /usr/sbin/sshd -D
