"""
简化的FastAPI服务器
用于快速启动和演示
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 创建应用
app = FastAPI(
    title="大模型安全检测工具",
    description="实时AI安全检测平台",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 健康检查
@app.get("/")
async def root():
    return {
        "message": "大模型安全检测工具 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "backend-api"
    }

# 示例检测端点
@app.post("/api/v1/detection/detect")
async def detect(request: dict):
    return {
        "request_id": "test-123",
        "timestamp": "2025-12-26T10:00:00Z",
        "is_compliant": True,
        "risk_score": 0.1,
        "risk_level": "low",
        "threat_category": None,
        "detection_details": {
            "matched_patterns": [],
            "attack_vector": None,
            "confidence": 0.9
        },
        "recommendation": "pass",
        "processing_time_ms": 25
    }

if __name__ == "__main__":
    print("=" * 50)
    print("大模型安全检测工具 - 后端服务")
    print("=" * 50)
    print("服务启动成功!")
    print("API文档: http://localhost:8000/docs")
    print("主页: http://localhost:8000")
    print("=" * 50)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
