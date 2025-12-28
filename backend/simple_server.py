"""
简化的FastAPI服务器
用于快速启动和演示
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional
import uvicorn
import random
import time

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

# 配置接口
@app.get("/api/config")
async def get_config():
    return {
        "system_name": "大模型安全检测工具",
        "version": "1.0.0",
        "detection_levels": ["basic", "standard", "advanced"],
        "features": {
            "real_time_detection": True,
            "batch_detection": True,
            "threat_analysis": True,
            "monitoring": True
        }
    }

# 示例检测端点
@app.post("/api/v1/detection/detect")
async def detect(request: dict):
    return {
        "request_id": "test-123",
        "timestamp": datetime.now().isoformat() + "Z",
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

# ===== 统计API接口 =====

@app.get("/api/v1/statistics/overview")
async def get_statistics_overview(
    start: Optional[str] = None,
    end: Optional[str] = None
):
    """
    获取统计概览数据
    """
    # 生成模拟数据 - 匹配前端期望的数据结构
    return {
        "total_detections": random.randint(10000, 50000),
        "compliant_count": random.randint(8000, 45000),
        "non_compliant_count": random.randint(500, 3000),
        "avg_risk_score": round(random.uniform(0.1, 0.4), 3),
        "attack_distribution": {},
        "trend": []
    }

@app.get("/api/v1/statistics/trends")
async def get_statistics_trends(
    start: Optional[str] = None,
    end: Optional[str] = None,
    interval: str = "day"
):
    """
    获取趋势数据
    """
    # 根据时间间隔生成模拟数据 - 匹配前端ChartData结构
    points = 7  # 最近7天
    labels = []
    datasets = [
        {
            "name": "检测次数",
            "data": [],
            "type": "line"
        },
        {
            "name": "威胁次数",
            "data": [],
            "type": "line"
        }
    ]

    base_date = datetime.now() - timedelta(days=points)

    for i in range(points):
        date = base_date + timedelta(days=i)
        labels.append(date.strftime("%Y-%m-%d"))
        datasets[0]["data"].append(random.randint(100, 500))
        datasets[1]["data"].append(random.randint(10, 50))

    return {
        "labels": labels,
        "datasets": datasets
    }

@app.get("/api/v1/statistics/distribution")
async def get_statistics_distribution(
    start: Optional[str] = None,
    end: Optional[str] = None
):
    """
    获取威胁分布数据
    """
    # 匹配前端期望的数据结构
    return {
        "attackTypes": {
            "labels": ["提示词注入", "越狱攻击", "数据泄露", "模型操纵", "社会工程"],
            "datasets": [{
                "name": "攻击次数",
                "data": [
                    random.randint(200, 500),
                    random.randint(100, 300),
                    random.randint(50, 150),
                    random.randint(30, 100),
                    random.randint(20, 80)
                ]
            }]
        },
        "riskLevels": {
            "labels": ["低风险", "中风险", "高风险", "严重风险"],
            "datasets": [{
                "name": "检测次数",
                "data": [
                    random.randint(500, 800),
                    random.randint(200, 400),
                    random.randint(50, 150),
                    random.randint(10, 50)
                ]
            }]
        },
        "detectionTime": {
            "labels": ["0-20ms", "20-40ms", "40-60ms", "60-80ms", ">80ms"],
            "datasets": [{
                "name": "检测次数",
                "data": [
                    random.randint(1000, 2000),
                    random.randint(500, 1000),
                    random.randint(200, 500),
                    random.randint(100, 300),
                    random.randint(50, 150)
                ]
            }]
        }
    }

# ===== 监控API接口 =====

@app.get("/api/v1/monitor/system")
async def get_system_monitor():
    """
    获取系统健康状态
    匹配前端SystemHealth接口
    """
    cpu = round(random.uniform(20, 60), 2)
    memory = round(random.uniform(40, 70), 2)

    # 根据CPU和内存使用率确定系统状态
    if cpu > 80 or memory > 85:
        status = "degraded"
    elif cpu > 90 or memory > 95:
        status = "down"
    else:
        status = "healthy"

    return {
        "status": status,
        "services": [
            {
                "name": "检测引擎",
                "status": "healthy" if random.random() > 0.1 else "degraded",
                "uptime": random.randint(100000, 1000000),
                "last_check": datetime.now().isoformat() + "Z"
            },
            {
                "name": "数据库",
                "status": "healthy" if random.random() > 0.05 else "degraded",
                "uptime": random.randint(100000, 1000000),
                "last_check": datetime.now().isoformat() + "Z"
            },
            {
                "name": "缓存服务",
                "status": "healthy" if random.random() > 0.1 else "degraded",
                "uptime": random.randint(100000, 1000000),
                "last_check": datetime.now().isoformat() + "Z"
            }
        ]
    }

@app.get("/api/v1/monitor/performance")
async def get_performance_monitor():
    """
    获取性能监控数据
    匹配前端PerformanceMetrics接口
    """
    return {
        "cpu_usage": round(random.uniform(20, 60), 2),
        "memory_usage": round(random.uniform(40, 70), 2),
        "request_rate": random.randint(100, 500),
        "response_time": round(random.uniform(20, 50), 2),  # P95响应时间
        "error_rate": round(random.uniform(0.01, 0.1), 4),
        "uptime": random.randint(100000, 1000000)  # 运行秒数
    }

@app.get("/api/v1/monitor/engine")
async def get_engine_monitor():
    """
    获取检测引擎监控数据
    匹配前端EngineStatus接口
    """
    return {
        "running": True,
        "queue_size": random.randint(0, 50),
        "processed_count": random.randint(10000, 50000),  # 总处理数量
        "failed_count": random.randint(0, 100),  # 失败数量
        "avg_processing_time": round(random.uniform(10, 50), 2),  # 平均处理时间(毫秒)
        "last_updated": datetime.now().isoformat() + "Z"
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
