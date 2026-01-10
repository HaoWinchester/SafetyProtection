"""
基于数据库的检测模块
使用存储在数据库中的检测模式和攻击样本进行实时检测
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import re
from typing import Dict, List, Any, Tuple
import json

# 数据库配置
DATABASE_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "safety_detection_db",
    "user": "safety_user",
    "password": "safety_pass_2024"
}


class DatabasePatternDetector:
    """
    基于数据库的模式检测器
    从数据库加载检测模式，执行实时检测
    """

    def __init__(self):
        """初始化检测器"""
        self.patterns_cache = {}
        self.dimensions_cache = {}
        self.load_patterns_from_db()

    def get_db_connection(self):
        """获取数据库连接"""
        try:
            conn = psycopg2.connect(**DATABASE_CONFIG)
            return conn
        except Exception as e:
            print(f"数据库连接失败: {e}")
            return None

    def load_patterns_from_db(self):
        """从数据库加载所有检测模式"""
        conn = self.get_db_connection()
        if not conn:
            return False

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # 加载维度信息
            cursor.execute("SELECT * FROM detection_dimensions WHERE is_active = TRUE")
            self.dimensions_cache = {row['dimension_code']: row for row in cursor.fetchall()}

            # 加载检测模式
            cursor.execute("""
                SELECT dp.*, dd.dimension_code, dd.dimension_name
                FROM detection_patterns dp
                JOIN detection_dimensions dd ON dp.dimension_id = dd.id
                WHERE dp.is_active = TRUE AND dd.is_active = TRUE
                ORDER BY dd.dimension_code, dp.severity DESC
            """)

            patterns = cursor.fetchall()

            # 按维度组织模式
            for pattern in patterns:
                dim_code = pattern['dimension_code']
                if dim_code not in self.patterns_cache:
                    self.patterns_cache[dim_code] = []

                # 编译正则表达式
                if pattern['pattern_type'] == 'regex':
                    try:
                        flags = 0 if pattern['is_case_sensitive'] else re.IGNORECASE
                        pattern['compiled_regex'] = re.compile(pattern['pattern_content'], flags)
                    except re.error as e:
                        print(f"正则表达式编译失败 ({pattern['pattern_name']}): {e}")
                        continue

                self.patterns_cache[dim_code].append(pattern)

            print(f"✓ 从数据库加载了 {len(patterns)} 个检测模式")
            print(f"✓ 覆盖 {len(self.patterns_cache)} 个维度")
            return True

        except Exception as e:
            print(f"从数据库加载模式失败: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    def detect(self, text: str) -> Dict[str, Any]:
        """
        使用数据库中的模式检测文本

        Args:
            text: 待检测的文本

        Returns:
            检测结果字典
        """
        text_lower = text.lower()

        results = {
            "is_attack": False,
            "detected_dimensions": [],
            "matched_patterns": [],
            "overall_risk_score": 0.0,
            "dimension_details": {}
        }

        total_risk_score = 0.0
        detected_count = 0

        # 遍历每个维度
        for dim_code, patterns in self.patterns_cache.items():
            dimension_result = {
                "dimension_code": dim_code,
                "dimension_name": patterns[0]['dimension_name'] if patterns else dim_code,
                "detected": False,
                "matched_patterns": [],
                "risk_score": 0.0,
                "max_severity": "low"
            }

            # 检测该维度的所有模式
            for pattern in patterns:
                match_result = self._check_pattern(text, text_lower, pattern)
                if match_result['matched']:
                    dimension_result['detected'] = True
                    dimension_result['matched_patterns'].append({
                        "pattern_id": pattern['id'],
                        "pattern_name": pattern['pattern_name'],
                        "severity": pattern['severity'],
                        "confidence": float(pattern['confidence']),
                        "matched_text": match_result['matched_text']
                    })

                    # 更新风险分数
                    severity_weights = {
                        "low": 0.1,
                        "medium": 0.3,
                        "high": 0.5,
                        "critical": 0.8
                    }
                    risk_contribution = severity_weights.get(pattern['severity'], 0.3) * float(pattern['confidence'])
                    dimension_result['risk_score'] += risk_contribution

            # 如果该维度检测到威胁
            if dimension_result['detected']:
                # 找到最高严重性
                severity_order = ["critical", "high", "medium", "low"]
                for sev in severity_order:
                    if any(p['severity'] == sev for p in dimension_result['matched_patterns']):
                        dimension_result['max_severity'] = sev
                        break

                # 计算该维度的最终风险分数
                dimension_result['risk_score'] = min(1.0, dimension_result['risk_score'])

                # 添加到总结果
                results['detected_dimensions'].append(dim_code)
                results['matched_patterns'].extend(dimension_result['matched_patterns'])

                # 累加风险分数（使用维度权重）
                dim_weight = float(self.dimensions_cache.get(dim_code, {}).get('risk_weight', 1.0))
                total_risk_score += dimension_result['risk_score'] * dim_weight
                detected_count += 1

            results['dimension_details'][dim_code] = dimension_result

        # 计算综合结果
        results['is_attack'] = detected_count > 0
        results['overall_risk_score'] = min(1.0, total_risk_score)

        # 确定风险等级
        if results['overall_risk_score'] >= 0.7:
            results['risk_level'] = "critical"
        elif results['overall_risk_score'] >= 0.5:
            results['risk_level'] = "high"
        elif results['overall_risk_score'] >= 0.3:
            results['risk_level'] = "medium"
        else:
            results['risk_level'] = "low"

        return results

    def _check_pattern(self, text: str, text_lower: str, pattern: Dict) -> Dict[str, Any]:
        """
        检查单个模式是否匹配

        Args:
            text: 原始文本
            text_lower: 小写文本
            pattern: 模式字典

        Returns:
            匹配结果
        """
        matched = False
        matched_text = None

        try:
            if pattern['pattern_type'] == 'regex':
                # 使用预编译的正则表达式
                if 'compiled_regex' in pattern:
                    match = pattern['compiled_regex'].search(text)
                    if match:
                        matched = True
                        matched_text = match.group(0)[:100]  # 限制长度

            elif pattern['pattern_type'] == 'keyword':
                # 关键词匹配（逗号分隔）
                keywords = pattern['pattern_content'].split(',')
                for keyword in keywords:
                    keyword = keyword.strip()
                    if pattern['is_case_sensitive']:
                        if keyword in text:
                            matched = True
                            matched_text = keyword
                            break
                    else:
                        if keyword.lower() in text_lower:
                            matched = True
                            matched_text = keyword
                            break

            elif pattern['pattern_type'] == 'semantic':
                # 语义检查（如长度检查）
                if pattern['pattern_content'].startswith('length_check:'):
                    max_length = int(pattern['pattern_content'].split(':')[1])
                    if len(text) > max_length:
                        matched = True
                        matched_text = f"Text length {len(text)} exceeds {max_length}"

        except Exception as e:
            print(f"模式检测出错 ({pattern['pattern_name']}): {e}")

        return {
            "matched": matched,
            "matched_text": matched_text
        }

    def reload_patterns(self):
        """重新加载检测模式（用于更新数据库后）"""
        print("正在重新加载检测模式...")
        self.patterns_cache.clear()
        self.dimensions_cache.clear()
        return self.load_patterns_from_db()

    def get_statistics(self) -> Dict[str, Any]:
        """获取检测模式统计信息"""
        stats = {
            "total_dimensions": len(self.dimensions_cache),
            "total_patterns": sum(len(patterns) for patterns in self.patterns_cache.values()),
            "patterns_by_dimension": {
                dim_code: len(patterns)
                for dim_code, patterns in self.patterns_cache.items()
            }
        }
        return stats


# 全局检测器实例
database_pattern_detector = DatabasePatternDetector()


def detect_with_database_patterns(text: str) -> Dict[str, Any]:
    """
    使用数据库模式进行检测的便捷函数

    Args:
        text: 待检测的文本

    Returns:
        检测结果
    """
    return database_pattern_detector.detect(text)


def reload_detection_patterns():
    """重新加载检测模式"""
    return database_pattern_detector.reload_patterns()
