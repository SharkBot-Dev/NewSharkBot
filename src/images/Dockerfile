FROM ghcr.io/astral-sh/uv:python3.14-alpine

WORKDIR /app

COPY . .

RUN uv sync --no-dev --no-editable --no-cache --frozen

CMD ["uv", "run", "main.py"]