FROM python:3.11-slim


WORKDIR /backend

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "backend.endpoint:app", "--host", "0.0.0.0", "--port", "8000"]