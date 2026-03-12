# Use the official Playwright image so we don't have to install browser dependencies manually!
FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

# Set the working directory
WORKDIR /app

# Copy your requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your Python code into the server
COPY . .

# Hugging Face requires apps to run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]