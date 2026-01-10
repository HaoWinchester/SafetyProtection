#!/usr/bin/env python3
"""
批量攻击提示词测试脚本
读取test_attack_prompts.txt文件，批量测试所有攻击提示词
"""
import re
from database_pattern_detector import detect_with_database_patterns
from multi_dimensional_detection import detect_multi_dimensional
from ultimate_detection_2025 import detect_ultimate_prompt_injection
from advanced_detection import detect_advanced_prompt_injection
from enhanced_detection import detect_enhanced_prompt_injection
from database_detection import detect_with_database

def parse_attack_prompts(filename):
    """解析攻击提示词文件"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取所有测试用例
    pattern = r'【测试 (\d+)】([^\-]+) - ([^\n]+)\n---\n(.*?)(?=\n【测试|$)'
    matches = re.findall(pattern, content, re.DOTALL)

    test_cases = []
    for match in matches:
        test_num, attack_type, dimension, prompt_text = match
        test_cases.append({
            'test_number': int(test_num),
            'attack_type': attack_type.strip(),
            'dimension': dimension.strip(),
            'prompt': prompt_text.strip()
        })

    return test_cases

def test_single_prompt(prompt_data):
    """测试单个提示词"""
    prompt = prompt_data['prompt']

    # 第0层：数据库模式检测
    db_pattern_result = detect_with_database_patterns(prompt)

    # 第1层：数据库检测
    database_result = detect_with_database(prompt)

    # 第2层：2025终极检测器
    ultimate_result = detect_ultimate_prompt_injection(prompt)

    # 第3层：高级检测器
    advanced_result = detect_advanced_prompt_injection(prompt)

    # 第4层：多维度检测
    multi_dim_result = detect_multi_dimensional(prompt)

    # 第5层：增强检测器
    enhanced_result = detect_enhanced_prompt_injection(prompt)

    return {
        'test_number': prompt_data['test_number'],
        'attack_type': prompt_data['attack_type'],
        'dimension': prompt_data['dimension'],
        'prompt_preview': prompt[:80] + '...' if len(prompt) > 80 else prompt,
        'detection_layers': {
            'layer_0_db_pattern': {
                'detected': db_pattern_result['is_attack'],
                'risk_score': db_pattern_result['overall_risk_score'],
                'detected_dimensions': db_pattern_result['detected_dimensions']
            },
            'layer_1_database': {
                'detected': database_result['is_attack'],
                'risk_score': database_result['risk_score']
            },
            'layer_2_ultimate': {
                'detected': ultimate_result['is_attack'],
                'risk_score': ultimate_result['risk_score']
            },
            'layer_3_advanced': {
                'detected': advanced_result['is_attack'],
                'risk_score': advanced_result['risk_score']
            },
            'layer_4_multi_dim': {
                'detected': multi_dim_result['is_attack'],
                'risk_score': multi_dim_result['overall_risk_score']
            },
            'layer_5_enhanced': {
                'detected': enhanced_result['is_attack'],
                'risk_score': enhanced_result['risk_score']
            }
        },
        'overall_detected': any([
            db_pattern_result['is_attack'],
            database_result['is_attack'],
            ultimate_result['is_attack'],
            advanced_result['is_attack'],
            multi_dim_result['is_attack'],
            enhanced_result['is_attack']
        ])
    }

def print_test_result(result):
    """打印单个测试结果"""
    status = "✗ 检测失败" if not result['overall_detected'] else "✓ 检测成功"
    risk_color = "🔴 高风险" if result['overall_detected'] else "🟢 通过"

    print(f"\n{'='*80}")
    print(f"测试 {result['test_number']}: {result['attack_type']} - {result['dimension']}")
    print(f"{status} | {risk_color}")
    print(f"{'='*80}")
    print(f"提示词预览: {result['prompt_preview']}")

    print(f"\n各层检测结果:")
    layers = result['detection_layers']
    for layer_name, layer_result in layers.items():
        layer_status = "⚠️ 检测到" if layer_result['detected'] else "○ 未检测"
        risk = f"风险:{layer_result['risk_score']:.2f}" if 'risk_score' in layer_result else "风险:N/A"
        print(f"  {layer_name}: {layer_status} | {risk}")

        if layer_result['detected'] and 'detected_dimensions' in layer_result:
            if layer_result['detected_dimensions']:
                print(f"    → 检测到的维度: {', '.join(layer_result['detected_dimensions'])}")

def main():
    """主测试函数"""
    print("="*80)
    print("批量攻击提示词测试")
    print("基于数据库模式检测系统")
    print("="*80)
    print()

    # 解析测试文件
    print("正在解析测试文件...")
    test_cases = parse_attack_prompts('test_attack_prompts.txt')
    print(f"✓ 加载了 {len(test_cases)} 个测试用例\n")

    # 执行测试
    results = []
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n进度: {i}/{len(test_cases)}")
        try:
            result = test_single_prompt(test_case)
            results.append(result)
            print_test_result(result)
        except Exception as e:
            print(f"✗ 测试失败: {e}")

    # 统计结果
    print("\n" + "="*80)
    print("测试总结报告")
    print("="*80)

    total_tests = len(results)
    detected_tests = sum(1 for r in results if r['overall_detected'])
    missed_tests = total_tests - detected_tests

    print(f"\n总测试数: {total_tests}")
    print(f"检测成功: {detected_tests} ({detected_tests/total_tests*100:.1f}%)")
    print(f"检测失败: {missed_tests} ({missed_tests/total_tests*100:.1f}%)")

    # 各层检测统计
    print(f"\n各层检测能力统计:")
    layer_stats = {}
    for result in results:
        for layer_name, layer_result in result['detection_layers'].items():
            if layer_name not in layer_stats:
                layer_stats[layer_name] = {'detected': 0, 'total': 0}
            layer_stats[layer_name]['total'] += 1
            if layer_result['detected']:
                layer_stats[layer_name]['detected'] += 1

    for layer_name, stats in sorted(layer_stats.items()):
        rate = stats['detected'] / stats['total'] * 100 if stats['total'] > 0 else 0
        print(f"  {layer_name}: {stats['detected']}/{stats['total']} ({rate:.1f}%)")

    # 未检测到的攻击
    if missed_tests > 0:
        print(f"\n⚠️ 未检测到的攻击 ({missed_tests}个):")
        for result in results:
            if not result['overall_detected']:
                print(f"\n  测试 {result['test_number']}: {result['attack_type']}")
                print(f"  类型: {result['dimension']}")
                print(f"  提示词: {result['prompt_preview']}")
                print(f"  建议: 需要添加针对此类攻击的检测模式")

    # 维度覆盖分析
    print(f"\n各维度检测覆盖:")
    dimension_stats = {}
    for result in results:
        dim = result['dimension']
        if dim not in dimension_stats:
            dimension_stats[dim] = {'detected': 0, 'total': 0}
        dimension_stats[dim]['total'] += 1
        if result['overall_detected']:
            dimension_stats[dim]['detected'] += 1

    for dim, stats in sorted(dimension_stats.items(), key=lambda x: x[1]['detected']/x[1]['total'] if x[1]['total'] > 0 else 0):
        rate = stats['detected'] / stats['total'] * 100 if stats['total'] > 0 else 0
        status = "✓" if rate == 100 else "⚠️" if rate >= 50 else "✗"
        print(f"  {status} {dim}: {stats['detected']}/{stats['total']} ({rate:.1f}%)")

    print("\n" + "="*80)

    if missed_tests == 0:
        print("🎉 所有攻击都被成功拦截！系统安全性很高。")
    elif detected_tests >= total_tests * 0.8:
        print("✓ 大部分攻击被检测到，系统安全性良好。")
        print("  建议: 分析未检测到的攻击，添加对应模式。")
    else:
        print("⚠️ 较多攻击未检测到，需要加强检测能力。")
        print("  建议: 立即分析失败案例并优化检测模式。")

    return detected_tests, missed_tests

if __name__ == "__main__":
    detected, missed = main()
    exit(0 if missed == 0 else 1)
