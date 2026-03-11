#!/bin/sh
set -e

echo "🔄 Running database migrations..."
python manage.py migrate --noinput

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "🚀 Starting Gunicorn..."
exec gunicorn website.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120
