FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    asyncpg==0.29.0 \
    pydantic==2.5.0

# Copy application
COPY main.py .

# Expose port
EXPOSE 3000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000"]
