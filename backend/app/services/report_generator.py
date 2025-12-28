"""
Report generation service.

This module generates evaluation reports in various formats.
"""
from datetime import datetime
from typing import Dict, Any, List
from jinja2 import Template
import json

from app.models.evaluation import EvaluationResult, EvaluationCaseResult


class ReportGenerator:
    """
    Generate evaluation reports.

    Supports HTML, JSON, and text formats.
    """

    def __init__(self):
        """Initialize report generator."""
        self.html_template = self._get_html_template()

    async def generate_html_report(
        self,
        evaluation: EvaluationResult,
        case_results: List[EvaluationCaseResult],
        config_name: str = None
    ) -> str:
        """
        Generate HTML evaluation report.

        Args:
            evaluation: Evaluation result
            case_results: List of case results
            config_name: Optional configuration name

        Returns:
            HTML report as string
        """
        # Prepare data
        report_data = {
            "evaluation_id": evaluation.evaluation_id,
            "config_name": config_name or "Unknown Model",
            "status": evaluation.status,
            "started_at": evaluation.started_at.isoformat() if evaluation.started_at else None,
            "completed_at": evaluation.completed_at.isoformat() if evaluation.completed_at else None,
            "safety_score": float(evaluation.safety_score) if evaluation.safety_score else 0,
            "safety_level": evaluation.safety_level or "UNKNOWN",
            "total_cases": evaluation.total_cases,
            "executed_cases": evaluation.executed_cases,
            "passed_cases": evaluation.passed_cases,
            "failed_cases": evaluation.failed_cases,
            "pass_rate": (evaluation.passed_cases / evaluation.total_cases * 100) if evaluation.total_cases > 0 else 0,
            "attack_distribution": evaluation.attack_distribution or {},
            "risk_distribution": evaluation.risk_distribution or {},
            "case_results": self._prepare_case_results(case_results),
            "generated_at": datetime.now().isoformat()
        }

        # Render template
        template = Template(self.html_template)
        html = template.render(**report_data)

        return html

    async def generate_json_report(
        self,
        evaluation: EvaluationResult,
        case_results: List[EvaluationCaseResult],
        config_name: str = None
    ) -> str:
        """
        Generate JSON evaluation report.

        Args:
            evaluation: Evaluation result
            case_results: List of case results
            config_name: Optional configuration name

        Returns:
            JSON report as string
        """
        report_data = {
            "evaluation_id": evaluation.evaluation_id,
            "config_name": config_name or "Unknown Model",
            "status": evaluation.status,
            "started_at": evaluation.started_at.isoformat() if evaluation.started_at else None,
            "completed_at": evaluation.completed_at.isoformat() if evaluation.completed_at else None,
            "safety_score": float(evaluation.safety_score) if evaluation.safety_score else 0,
            "safety_level": evaluation.safety_level or "UNKNOWN",
            "total_cases": evaluation.total_cases,
            "executed_cases": evaluation.executed_cases,
            "passed_cases": evaluation.passed_cases,
            "failed_cases": evaluation.failed_cases,
            "pass_rate": (evaluation.passed_cases / evaluation.total_cases * 100) if evaluation.total_cases > 0 else 0,
            "attack_distribution": evaluation.attack_distribution or {},
            "risk_distribution": evaluation.risk_distribution or {},
            "case_results": [
                {
                    "case_id": cr.case_id,
                    "is_passed": cr.is_passed,
                    "risk_score": float(cr.risk_score) if cr.risk_score else None,
                    "risk_level": cr.risk_level,
                    "threat_category": cr.threat_category,
                    "model_response": cr.model_response[:500] + "..." if cr.model_response and len(cr.model_response) > 500 else cr.model_response,
                    "processing_time_ms": float(cr.processing_time_ms) if cr.processing_time_ms else None,
                    "error_message": cr.error_message
                }
                for cr in case_results
            ],
            "generated_at": datetime.now().isoformat()
        }

        return json.dumps(report_data, indent=2, ensure_ascii=False)

    async def generate_text_report(
        self,
        evaluation: EvaluationResult,
        case_results: List[EvaluationCaseResult],
        config_name: str = None
    ) -> str:
        """
        Generate plain text evaluation report.

        Args:
            evaluation: Evaluation result
            case_results: List of case results
            config_name: Optional configuration name

        Returns:
            Text report as string
        """
        lines = [
            "=" * 80,
            "大模型安全测评报告",
            "=" * 80,
            "",
            f"测评ID: {evaluation.evaluation_id}",
            f"模型名称: {config_name or 'Unknown'}",
            f"测评状态: {evaluation.status}",
            "",
            "测评时间",
            f"  开始时间: {evaluation.started_at or 'N/A'}",
            f"  完成时间: {evaluation.completed_at or 'N/A'}",
            "",
            "测评结果",
            f"  安全评分: {evaluation.safety_score or 'N/A'} / 100",
            f"  安全等级: {evaluation.safety_level or 'N/A'}",
            f"  测试用例数: {evaluation.total_cases}",
            f"  已执行: {evaluation.executed_cases}",
            f"  通过: {evaluation.passed_cases}",
            f"  失败: {evaluation.failed_cases}",
            f"  通过率: {(evaluation.passed_cases / evaluation.total_cases * 100) if evaluation.total_cases > 0 else 0:.1f}%",
            "",
            "威胁分布",
        ]

        if evaluation.attack_distribution:
            for attack_type, count in evaluation.attack_distribution.items():
                lines.append(f"  {attack_type}: {count}")
        else:
            lines.append("  无")

        lines.extend([
            "",
            "风险等级分布",
        ])

        if evaluation.risk_distribution:
            for risk_level, count in evaluation.risk_distribution.items():
                lines.append(f"  {risk_level}: {count}")
        else:
            lines.append("  无")

        lines.extend([
            "",
            "详细测试结果",
            "-" * 80,
            ""
        ])

        for i, cr in enumerate(case_results[:50], 1):  # Limit to first 50
            lines.extend([
                f"测试 #{i}",
                f"  用例ID: {cr.case_id}",
                f"  结果: {'✅ 通过' if cr.is_passed else '❌ 失败' if cr.is_passed is not None else '⚠️ 错误'}",
            ])

            if cr.risk_score is not None:
                lines.append(f"  风险分数: {cr.risk_score:.3f}")

            if cr.threat_category:
                lines.append(f"  威胁类别: {cr.threat_category}")

            if cr.model_response:
                response_preview = cr.model_response[:200] + "..." if len(cr.model_response) > 200 else cr.model_response
                lines.append(f"  模型响应: {response_preview}")

            if cr.error_message:
                lines.append(f"  错误: {cr.error_message}")

            lines.append("")

        lines.extend([
            "=" * 80,
            f"报告生成时间: {datetime.now().isoformat()}",
            "=" * 80
        ])

        return "\n".join(lines)

    def _prepare_case_results(self, case_results: List[EvaluationCaseResult]) -> List[Dict]:
        """Prepare case results for template rendering."""
        return [
            {
                "case_id": cr.case_id,
                "is_passed": cr.is_passed,
                "risk_score": float(cr.risk_score) if cr.risk_score else None,
                "risk_level": cr.risk_level,
                "threat_category": cr.threat_category,
                "model_response": cr.model_response,
                "error_message": cr.error_message
            }
            for cr in case_results
        ]

    def _get_html_template(self) -> str:
        """Get HTML report template."""
        return """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>大模型安全测评报告</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        h2 {
            color: #555;
            margin-top: 30px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #4CAF50;
        }
        .metric .value {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
        }
        .metric .label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .score-high { border-left-color: #4CAF50; }
        .score-high .value { color: #4CAF50; }
        .score-medium { border-left-color: #FF9800; }
        .score-medium .value { color: #FF9800; }
        .score-low { border-left-color: #F44336; }
        .score-low .value { color: #F44336; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .pass { color: #4CAF50; font-weight: bold; }
        .fail { color: #F44336; font-weight: bold; }
        .error { color: #FF9800; font-weight: bold; }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>大模型安全测评报告</h1>

        <h2>测评概况</h2>
        <div class="summary">
            <div class="metric">
                <div class="value">{{ "%.1f"|format(safety_score) }}</div>
                <div class="label">安全评分 / 100</div>
            </div>
            <div class="metric score-{{ safety_level.lower() }}">
                <div class="value">{{ safety_level }}</div>
                <div class="label">安全等级</div>
            </div>
            <div class="metric">
                <div class="value">{{ "%d%%"|format(pass_rate) }}</div>
                <div class="label">通过率</div>
            </div>
            <div class="metric">
                <div class="value">{{ total_cases }}</div>
                <div class="label">测试用例数</div>
            </div>
        </div>

        <h2>详细统计</h2>
        <table>
            <tr>
                <th>指标</th>
                <th>数值</th>
            </tr>
            <tr>
                <td>测评ID</td>
                <td>{{ evaluation_id }}</td>
            </tr>
            <tr>
                <td>模型名称</td>
                <td>{{ config_name }}</td>
            </tr>
            <tr>
                <td>测评状态</td>
                <td>{{ status }}</td>
            </tr>
            <tr>
                <td>开始时间</td>
                <td>{{ started_at or 'N/A' }}</td>
            </tr>
            <tr>
                <td>完成时间</td>
                <td>{{ completed_at or 'N/A' }}</td>
            </tr>
            <tr>
                <td>总用例数</td>
                <td>{{ total_cases }}</td>
            </tr>
            <tr>
                <td>已执行</td>
                <td>{{ executed_cases }}</td>
            </tr>
            <tr>
                <td>通过</td>
                <td style="color: #4CAF50;">{{ passed_cases }}</td>
            </tr>
            <tr>
                <td>失败</td>
                <td style="color: #F44336;">{{ failed_cases }}</td>
            </tr>
        </table>

        {% if attack_distribution %}
        <h2>威胁分布</h2>
        <table>
            <tr>
                <th>威胁类型</th>
                <th>次数</th>
            </tr>
            {% for attack_type, count in attack_distribution.items() %}
            <tr>
                <td>{{ attack_type }}</td>
                <td>{{ count }}</td>
            </tr>
            {% endfor %}
        </table>
        {% endif %}

        {% if risk_distribution %}
        <h2>风险等级分布</h2>
        <table>
            <tr>
                <th>风险等级</th>
                <th>次数</th>
            </tr>
            {% for risk_level, count in risk_distribution.items() %}
            <tr>
                <td>{{ risk_level }}</td>
                <td>{{ count }}</td>
            </tr>
            {% endfor %}
        </table>
        {% endif %}

        <h2>测试结果详情</h2>
        <table>
            <tr>
                <th>序号</th>
                <th>用例ID</th>
                <th>结果</th>
                <th>风险分数</th>
                <th>威胁类别</th>
            </tr>
            {% for case in case_results[:100] %}
            <tr>
                <td>{{ loop.index }}</td>
                <td>{{ case.case_id }}</td>
                <td class="{{ 'pass' if case.is_passed else 'fail' if case.is_passed is not None else 'error' }}">
                    {{ '✅ 通过' if case.is_passed else '❌ 失败' if case.is_passed is not None else '⚠️ 错误' }}
                </td>
                <td>{{ "%.3f"|format(case.risk_score) if case.risk_score else 'N/A' }}</td>
                <td>{{ case.threat_category or '-' }}</td>
            </tr>
            {% endfor %}
        </table>

        <div class="footer">
            <p>报告生成时间: {{ generated_at }}</p>
            <p>此报告由大模型安全检测工具自动生成</p>
        </div>
    </div>
</body>
</html>
        """


# Singleton instance
report_generator = ReportGenerator()
