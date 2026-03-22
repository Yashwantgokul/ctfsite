FROM ubuntu:18.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y openssh-server gcc make wget python3 nano vim && \
    apt-get clean

# Download and install vulnerable sudo version 1.8.21p2 (vulnerable to pwfeedback CVE-2019-18634)
RUN wget http://archive.ubuntu.com/ubuntu/pool/main/s/sudo/sudo_1.8.21p2-3ubuntu1_amd64.deb -O /tmp/sudo.deb && \
    dpkg -i /tmp/sudo.deb && \
    rm /tmp/sudo.deb

# Create player user
RUN useradd -m -d /home/player -s /bin/bash player && \
    echo "player:player" | chpasswd

# Enable pwfeedback so asterisks are shown during password input
RUN echo "Defaults pwfeedback" >> /etc/sudoers

# Optional Misdirection: Allow player to run less as root without password
RUN echo "player ALL=(ALL) NOPASSWD: /usr/bin/less" > /etc/sudoers.d/player && \
    chmod 0440 /etc/sudoers.d/player

# SSH configuration
RUN mkdir -p /var/run/sshd
RUN echo "PasswordAuthentication yes" >> /etc/ssh/sshd_config

WORKDIR /home/player

# Install entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 22

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
