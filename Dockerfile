# Use an official Python runtime as a parent image
FROM python:3.8-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE=config.settings

# Set the working directory in the container
WORKDIR /app

# Install uv for faster package installation
RUN apt-get update && apt-get install -y curl && \
    curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy the requirements file and install dependencies
COPY requirements.txt /app/
RUN uv pip install --no-cache-dir --system -r requirements.txt

# Copy the entire project into the container
COPY . /app/

# Ensure staticfiles directory exists and run Django management commands
RUN mkdir -p /app/staticfiles
RUN python manage.py compress --force
RUN python manage.py collectstatic --noinput

# Expose the port the app runs on
EXPOSE 8000

# Run the application with uvicorn
# Gunicorn is also a good option for production, but uvicorn is simpler for a single worker.
# The host 0.0.0.0 makes the server accessible from outside the container.
CMD ["uvicorn", "config.asgi:application", "--host", "0.0.0.0", "--port", "8000"] 