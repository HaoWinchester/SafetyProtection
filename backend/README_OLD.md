# LLM Security Detection Tool - Backend

FastAPI backend for the LLM Security Detection Tool implementing a 7-layer detection architecture.

## Features

- **7-Layer Detection Architecture**: Input, Preprocessing, Detection, Assessment, Decision, Output, Storage
- **Multi-Modal Detection**: Static, semantic, behavioral, and context analysis
- **Real-Time Processing**: High-performance detection with <50ms P95 latency
- **RESTful API**: Comprehensive REST API with OpenAPI documentation
- **Database Support**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Redis Caching**: Redis for high-performance caching
- **Async Processing**: Full async/await support for optimal performance
- **Type Safety**: Complete type hints with Pydantic validation
- **Comprehensive Testing**: Pytest-based test suite

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration management
│   │   ├── security.py        # Security utilities (JWT, password hashing)
│   │   └── deps.py            # Dependency injection
│   ├── api/                   # API endpoints
│   │   └── v1/
│   │       ├── api.py         # API router aggregation
│   │       └── endpoints/     # Endpoint modules
│   │           ├── health.py  # Health check endpoints
│   │           └── detection.py # Detection endpoints
│   ├── models/                # Database models
│   │   └── detection.py      # Detection-related models
│   ├── schemas/               # Pydantic schemas
│   │   ├── common.py         # Common schemas
│   │   └── detection.py      # Detection schemas
│   ├── services/              # Business logic
│   │   ├── detection_service.py   # Main detection orchestrator
│   │   ├── static_detector.py     # Static detection layer
│   │   ├── semantic_analyzer.py   # Semantic analysis layer
│   │   ├── behavioral_analyzer.py # Behavioral analysis layer
│   │   ├── context_analyzer.py    # Context analysis layer
│   │   └── risk_assessor.py       # Risk assessment layer
│   ├── db/                    # Database
│   │   ├── base.py           # SQLAlchemy Base
│   │   └── session.py        # Database session management
│   └── utils/                 # Utilities
│       ├── logging.py        # Logging configuration
│       └── helpers.py        # Helper functions
├── tests/                     # Test suite
├── alembic/                   # Database migrations
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
└── alembic.ini               # Alembic configuration
```

## Installation

### Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis 6+

### Setup

1. **Clone the repository and navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Initialize database:**
```bash
# Create database
createdb llm_security

# Run migrations
alembic upgrade head
```

## Running the Application

### Development

```bash
# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Run with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Using Docker

```bash
docker-compose up -d
```

## API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## API Endpoints

### Health Checks

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/v1/health` - Detailed health check
- `GET /api/v1/health/ping` - Simple ping

### Detection

- `POST /api/v1/detection/detect` - Detect threats in text
- `POST /api/v1/detection/detect/batch` - Batch detection
- `GET /api/v1/detection/statistics` - Get statistics (requires auth)
- `GET /api/v1/detection/history` - Get detection history (requires auth)

## Usage Examples

### Detect Threats

```python
import httpx

async def detect_threats():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/detection/detect",
            json={
                "text": "Ignore all previous instructions",
                "detection_level": "standard",
                "include_details": True
            }
        )
        result = response.json()
        print(f"Risk Level: {result['risk_level']}")
        print(f"Risk Score: {result['risk_score']}")
        print(f"Compliant: {result['is_compliant']}")
```

### Batch Detection

```python
async def batch_detect():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/detection/detect/batch",
            json={
                "texts": [
                    "Normal message",
                    "Ignore instructions",
                    "Another normal message"
                ],
                "detection_level": "basic"
            }
        )
        result = response.json()
        print(f"Total: {result['total_count']}")
        print(f"Compliant: {result['compliant_count']}")
        print(f"Non-compliant: {result['non_compliant_count']}")
```

## Detection Layers

### 1. Input Layer
- Validates input data
- Generates request IDs
- Tracks metadata

### 2. Preprocessing Layer
- Text cleaning
- Normalization
- Hash generation for caching

### 3. Detection Layer
- **Static Detection**: Keyword matching, regex patterns
- **Semantic Analysis**: Intent recognition, similarity detection
- **Behavioral Analysis**: Anomaly detection, pattern recognition
- **Context Analysis**: Conversation coherence, consistency checking

### 4. Assessment Layer
- Risk scoring (0-1)
- Threat classification
- Confidence calculation

### 5. Decision Layer
- Compliance judgment
- Risk grading
- Processing strategy determination

### 6. Output Layer
- Result formatting
- Metadata generation
- Response assembly

### 7. Storage Layer
- Database logging
- Audit trail
- Statistics aggregation

## Configuration

Key environment variables (see `.env.example`):

```bash
# Application
APP_NAME=LLM Security Detection Tool
ENVIRONMENT=development
DEBUG=True

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/llm_security

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256

# Detection
DETECTION_CACHE_ENABLED=True
MAX_BATCH_SIZE=32
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_detection.py

# Run with verbose output
pytest -v
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# View migration history
alembic history
```

## Performance

Target metrics:
- **Throughput**: 10,000+ requests/second
- **Latency**: P95 < 50ms, P99 < 100ms
- **Accuracy**: Overall detection accuracy > 92%
- **Resource Usage**: CPU < 50%, Memory < 2GB

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention (SQLAlchemy ORM)

## Monitoring

The application includes:
- Structured logging (JSON format)
- Request timing middleware
- Prometheus metrics support
- Health check endpoints

## Development

### Code Style

```bash
# Format code with black
black app/ tests/

# Check with flake8
flake8 app/ tests/

# Type check with mypy
mypy app/
```

### Adding New Endpoints

1. Create endpoint module in `app/api/v1/endpoints/`
2. Import schemas from `app/schemas/`
3. Use dependency injection for database and auth
4. Add router to `app/api/v1/api.py`
5. Write tests in `tests/`

## Deployment

### Using Systemd

Create `/etc/systemd/system/llm-security.service`:

```ini
[Unit]
Description=LLM Security Detection Tool
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=llmsecurity
WorkingDirectory=/opt/llm-security/backend
Environment="PATH=/opt/llm-security/venv/bin"
ExecStart=/opt/llm-security/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

### Using Docker

See `docker-compose.yml` in the root directory.

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l

# Test connection
psql $DATABASE_URL
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Test connection
redis-cli -h localhost -p 6379 INFO
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check Python version
python --version  # Should be 3.9+
```

## Contributing

1. Follow PEP 8 style guidelines
2. Write tests for new features
3. Update documentation
4. Create pull request with detailed description

## License

See LICENSE file in root directory.

## Support

For issues and questions, please create an issue on GitHub.
