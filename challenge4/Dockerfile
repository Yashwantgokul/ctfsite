FROM python:3.10-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN pip install --no-cache-dir pycryptodome

RUN useradd -d /app -m -s /bin/bash ctf

WORKDIR /app

COPY server.py /app/server.py
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh && chmod +x /usr/local/bin/entrypoint.sh
RUN chown -R ctf:ctf /app

USER ctf
EXPOSE 1337

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
