FROM python:3.11-slim

WORKDIR /app

COPY app.py .
COPY style.css .

RUN pip install --no-cache-dir flask pillow

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
