# ใช้ Python base image ที่เล็ก
FROM python:3.12-slim

# ตั้งค่า Python ให้ทำงานสะดวกในคอนเทนเนอร์
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PIP_NO_CACHE_DIR=1

# โฟลเดอร์ทำงาน
WORKDIR /app

# ติดตั้ง dependency ของระบบที่มักจำเป็นกับ Postgres/psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  curl \
  && rm -rf /var/lib/apt/lists/*

# ติดตั้ง Python dependencies ล่วงหน้า (ถ้ามี requirements.txt)
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy your Django project code
COPY . .

# Copy and prepare entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

# migrate + collectstatic + gunicorn ทำใน entrypoint (runtime ไม่ใช่ build time)
ENTRYPOINT ["/entrypoint.sh"]
