FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Update and install tools including ttyd
RUN apt-get update && \
    apt-get install -y ttyd bash openssh-client nmap netcat-traditional curl wget python3 python3-pip gdb git \
    nano vim tmux unzip tar iputils-ping iproute2 jq strace ltrace file less && \
    python3 -m pip install --upgrade pip pwntools && \
    apt-get clean

EXPOSE 7681

# -W allows writing/interacting with the terminal
# -p 7681 specifies the port
ENTRYPOINT ["ttyd", "-W", "-p", "7681", "bash"]
