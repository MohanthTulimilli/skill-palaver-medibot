# Medibots ML Service - FastAPI + scikit-learn
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and data
COPY config.py main.py predict.py stats.py insights.py preprocess.py ./
COPY data/ ./data/

# Create model directory and train models (uses data/*.csv)
COPY train.py ./
RUN mkdir -p model && python train.py || echo "Training failed - backend will use fallbacks"

EXPOSE 8000

# Bind to 0.0.0.0 for container networking
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
