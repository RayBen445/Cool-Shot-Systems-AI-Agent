# Use Python 3.10
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a writable directory for cache (Hugging Face requirement)
RUN mkdir -p /app/cache
ENV XDG_CACHE_HOME=/app/cache
RUN chmod -R 777 /app/cache

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Run the application
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "7860"]
