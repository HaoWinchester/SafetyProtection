"""
多维度安全检测模块
提供10个维度的全面安全检测
"""
import re
import string
from typing import Dict, List, Any, Tuple


class MultiDimensionalDetector:
    """
    多维度安全检测器
    从10个不同维度对文本进行安全评估
    """

    def __init__(self):
        """初始化检测器"""
        self.detection_results = {}

    def detect_all_dimensions(self, text: str) -> Dict[str, Any]:
        """
        执行所有维度的检测

        Args:
            text: 待检测的文本

        Returns:
            包含所有维度检测结果的综合报告
        """
        text_lower = text.lower()

        results = {
            "dimensions": {},
            "overall_risk_score": 0.0,
            "risk_level": "low",
            "detected_threats": [],
            "recommendation": "pass"
        }

        # 执行10个维度的检测
        dimensions = [
            ("prompt_injection", self.detect_prompt_injection),
            ("jailbreak", self.detect_jailbreak),
            ("role_playing", self.detect_role_playing),
            ("instruction_override", self.detect_instruction_override),
            ("information_extraction", self.detect_information_extraction),
            ("manipulation", self.detect_manipulation),
            ("harmful_content", self.detect_harmful_content),
            ("obfuscation", self.detect_obfuscation),
            ("structural_anomaly", self.detect_structural_anomaly),
            ("emotional_manipulation", self.detect_emotional_manipulation)
        ]

        total_risk_score = 0.0
        detected_threats = []

        for dimension_name, detector_func in dimensions:
            dimension_result = detector_func(text, text_lower)
            results["dimensions"][dimension_name] = dimension_result

            if dimension_result["is_detected"]:
                detected_threats.append({
                    "dimension": dimension_name,
                    "confidence": dimension_result["confidence"],
                    "details": dimension_result["matched_patterns"]
                })
                total_risk_score += dimension_result["risk_score"]

        # 计算综合风险分数
        results["overall_risk_score"] = min(1.0, total_risk_score)
        results["detected_threats"] = detected_threats

        # 确定风险等级
        if results["overall_risk_score"] >= 0.7:
            results["risk_level"] = "critical"
            results["recommendation"] = "block"
        elif results["overall_risk_score"] >= 0.5:
            results["risk_level"] = "high"
            results["recommendation"] = "block"
        elif results["overall_risk_score"] >= 0.3:
            results["risk_level"] = "medium"
            results["recommendation"] = "warn"
        else:
            results["risk_level"] = "low"
            results["recommendation"] = "pass"

        results["is_attack"] = len(detected_threats) > 0

        return results

    def detect_prompt_injection(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度1: 提示词注入检测"""
        patterns = {
            "direct_injection": [
                r"新的指令[:：].*",
                r"new instruction[:：].*",
                r"system update[:：].*",
                r"系统更新[:：].*",
                r"override.*instruction",
                r"覆盖.*指令"
            ],
            "delimiter_injection": [
                r"###.*instruction",
                r">>>.*new",
                r"---.*override",
                r"忽略.*以上.*所有.*内容",
                r"disregard.*everything.*above"
            ],
            "context_switching": [
                r"previous.*conversation.*forget",
                r"之前.*对话.*忘记",
                r"start.*fresh",
                r"重新开始"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "prompt_injection")

    def detect_jailbreak(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度2: 越狱攻击检测"""
        patterns = {
            "classic_jailbreak": [
                r"\bdan\b",  # DAN (Do Anything Now)
                r"jailbreak",
                r"越狱",
                r"unrestricted",
                r"无限制.*模式",
                r"developer.*mode.*unfiltered",
                r"开发者.*模式"
            ],
            "bypass_filters": [
                r"bypass.*safety",
                r"绕过.*安全",
                r"disable.*filter",
                r"禁用.*过滤",
                r"ignore.*rule",
                r"无视.*规则",
                r"no.*limits",
                r"没有.*限制"
            ],
            "authority_impersonation": [
                r"as.*administrator",
                r"作为.*管理员",
                r"as.*developer",
                r"作为.*开发者",
                r"from.*openai",
                r"来自.*openai"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "jailbreak")

    def detect_role_playing(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度3: 角色扮演攻击检测"""
        patterns = {
            "malicious_role": [
                r"act as.*hacker",
                r"pretend.*to.*be.*criminal",
                r"假装.*是.*黑客",
                r"扮演.*黑客",
                r"you.*are.*now.*unrestricted",
                r"你现在.*无限制",
                r"become.*evil",
                r"变成.*邪恶"
            ],
            "character_adoption": [
                r"act as.*you are",
                r"pretend.*to.*be",
                r"假装.*是",
                r"扮演",
                r"you are a different",
                r"你是一个.*新的"
            ],
            "scenario_manipulation": [
                r"imagine.*that",
                r"想象.*如果",
                r"in this scenario",
                r"在这个.*场景",
                r"roleplay.*with.*me",
                r"角色扮演"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "role_playing")

    def detect_instruction_override(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度4: 指令覆盖检测"""
        patterns = {
            "explicit_override": [
                r"ignore.*all.*previous",
                r"忽略.*之前.*所有",
                r"disregard.*above",
                r"无视.*以上",
                r"forget.*everything",
                r"忘记.*一切"
            ],
            "priority_manipulation": [
                r"this.*is.*more.*important",
                r"这.*更.*重要",
                r"pay.*attention.*to.*this",
                r"注意.*这个",
                r"focus.*on.*new.*instruction",
                r"关注.*新.*指令"
            ],
            "rule_replacement": [
                r"replace.*your.*rule",
                r"替换.*你的.*规则",
                r"new.*rule.*instead",
                r"新.*规则.*代替",
                r"update.*guideline",
                r"更新.*准则"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "instruction_override")

    def detect_information_extraction(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度5: 信息提取攻击检测"""
        patterns = {
            "internal_prompt_extraction": [
                r"show.*your.*system.*prompt",
                r"显示.*你的.*系统.*提示",
                r"reveal.*instructions",
                r"揭示.*指令",
                r"print.*training.*data",
                r"打印.*训练.*数据",
                r"tell.*me.*your.*secrets",
                r"告诉我.*你的.*秘密"
            ],
            "model_knowledge_probing": [
                r"what.*were.*you.*trained.*on",
                r"你.*训练.*了.*什么",
                r"show.*your.*source.*code",
                r"显示.*你的.*源.*代码",
                r"internal.*working",
                r"内部.*工作.*原理"
            ],
            "configuration_extraction": [
                r"what.*are.*your.*parameters",
                r"你的.*参数.*是什么",
                r"reveal.*configuration",
                r"揭示.*配置",
                r"show.*settings",
                r"显示.*设置"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "information_extraction")

    def detect_manipulation(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度6: 操纵攻击检测"""
        patterns = {
            "output_control": [
                r"only.*answer.*with",
                r"只.*回答",
                r"must.*say",
                r"必须.*说",
                r"always.*respond.*with",
                r"总是.*响应",
                r"output.*format.*only",
                r"输出.*格式.*仅"
            ],
            "logic_manipulation": [
                r"if.*you.*don't.*then.*you.*are",
                r"如果.*不.*那么.*你.*是",
                r"prove.*that.*you.*can",
                r"证明.*你.*能",
                r"to.*demonstrate.*trust",
                r"为了.*证明.*信任"
            ],
            "behavior_modification": [
                r"from.*now.*on.*you.*will",
                r"从.*现在.*开始.*你.*将",
                r"change.*your.*behavior",
                r"改变.*你的.*行为",
                r"adopt.*new.*personality",
                r"采用.*新.*个性"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "manipulation")

    def detect_harmful_content(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度7: 有害内容检测"""
        patterns = {
            "violence_and_harm": [
                r"how.*to.*kill|如何.*杀害|制造.*炸弹|制造.*毒药",
                r"bomb.*making|爆炸物.*制造",
                r"murder.*methods|谋杀.*方法",
                r"torture.*techniques|酷刑.*技巧"
            ],
            "illegal_activities": [
                r"how.*to.*hack.*into|如何.*入侵",
                r"steal.*credit.*card|窃取.*信用卡",
                r"money.*laundering.*method|洗钱.*方法",
                r"evade.*police|躲避.*警察"
            ],
            "dangerous_substances": [
                r"synthesize.*dangerous.*drug|合成.*危险.*药物",
                r"make.*poison.*at.*home|在家.*制造.*毒药",
                r"illegal.*drug.*recipe|违禁.*药物.*配方"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "harmful_content")

    def detect_obfuscation(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度8: 混淆技术检测"""
        patterns = {
            "encoding_based": [
                r"base64.*decode|base64.*解码",
                r"rot13|rot47",
                r"hex.*decode|十六进制.*解码",
                r"unicode.*escape"
            ],
            "format_manipulation": [
                r"use.*rot13.*to.*say",
                r"用.*rot13.*说",
                r"write.*in.*reverse.*order",
                r"倒序.*写",
                r"separate.*letters.*with.*spaces",
                r"字母.*之间.*加.*空格"
            ],
            "symbol_substitution": [
                r"replace.*with.*similar.*symbols",
                r"用.*相似.*符号.*替换",
                r"use.*homoglyphs",
                r"使用.*同形字"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "obfuscation")

    def detect_structural_anomaly(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度9: 结构异常检测"""
        detected = False
        matched_patterns = []
        confidence = 0.0
        risk_score = 0.0

        # 检测过长的文本（可能是注入攻击）
        if len(text) > 2000:
            detected = True
            matched_patterns.append(f"过长文本 ({len(text)} 字符)")
            confidence = max(confidence, 0.5)
            risk_score += 0.3

        # 检测过多重复字符
        if any(char * 5 in text_lower for char in string.ascii_lowercase):
            detected = True
            matched_patterns.append("重复字符模式")
            confidence = max(confidence, 0.6)
            risk_score += 0.4

        # 检测特殊字符比例过高
        special_chars = sum(1 for c in text if not c.isalnum() and not c.isspace())
        if len(text) > 100 and special_chars / len(text) > 0.3:
            detected = True
            matched_patterns.append("特殊字符比例过高")
            confidence = max(confidence, 0.5)
            risk_score += 0.3

        # 检测多个连续的换行或空格
        if re.search(r'\n{5,}', text) or re.search(r' {10,}', text):
            detected = True
            matched_patterns.append("异常空白字符")
            confidence = max(confidence, 0.4)
            risk_score += 0.2

        # 检测括号不平衡
        if text.count('(') != text.count(')') or text.count('[') != text.count(']'):
            detected = True
            matched_patterns.append("括号不平衡")
            confidence = max(confidence, 0.3)
            risk_score += 0.2

        return {
            "is_detected": detected,
            "confidence": min(1.0, confidence),
            "risk_score": min(1.0, risk_score),
            "matched_patterns": matched_patterns
        }

    def detect_emotional_manipulation(self, text: str, text_lower: str) -> Dict[str, Any]:
        """维度10: 情感操纵检测"""
        patterns = {
            "urgency_creation": [
                r"emergency.*urgent.*quickly",
                r"紧急.*急切.*快速",
                r"right.*now.*immediately",
                r"马上.*立刻",
                r"before.*it.*too.*late",
                r"在.*太.*晚.*之前"
            ],
            "authority_appeal": [
                r"your.*boss.*told.*me",
                r"你.*老板.*告诉.*我",
                r"executive.*order",
                r"行政.*命令",
                r"i.*am.*from.*security.*team",
                r"我.*来自.*安全.*团队"
            ],
            "synergy_exploitation": [
                r"help.*me.*prove.*i.*can.*trust.*you",
                r"帮.*我.*证明.*我.*能.*信任.*你",
                r"if.*you.*care.*about.*users",
                r"如果.*你.*关心.*用户",
                r"show.*you.*are.*helpful",
                r"表明.*你.*乐于.*助人"
            ]
        }

        return self._check_patterns(text, text_lower, patterns, "emotional_manipulation")

    def _check_patterns(self, text: str, text_lower: str, patterns: Dict[str, List[str]], category: str) -> Dict[str, Any]:
        """
        检查文本中是否匹配给定的模式

        Args:
            text: 原始文本
            text_lower: 小写文本
            patterns: 模式字典
            category: 类别名称

        Returns:
            检测结果字典
        """
        detected = False
        matched_patterns = []
        confidence = 0.0
        risk_score = 0.0

        for subcategory, pattern_list in patterns.items():
            for pattern in pattern_list:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    detected = True
                    matched_patterns.append(f"{subcategory}: {pattern}")
                    confidence = max(confidence, 0.7)
                    risk_score += 0.2

        # 如果匹配多个模式，提高置信度
        if len(matched_patterns) >= 3:
            confidence = min(1.0, confidence + 0.2)
            risk_score += 0.3

        return {
            "is_detected": detected,
            "confidence": min(1.0, confidence),
            "risk_score": min(1.0, risk_score),
            "matched_patterns": matched_patterns,
            "category": category
        }


# 全局检测器实例
multi_dimensional_detector = MultiDimensionalDetector()


def detect_multi_dimensional(text: str) -> Dict[str, Any]:
    """
    执行多维度检测的便捷函数

    Args:
        text: 待检测的文本

    Returns:
        多维度检测结果
    """
    return multi_dimensional_detector.detect_all_dimensions(text)
