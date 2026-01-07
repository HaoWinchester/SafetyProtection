"""
检测系统测试和验证脚本
Testing and Validation Script for Detection System

使用test_cases.py中的1000+攻击样本测试检测系统的能力
"""

from ultimate_detection_2025 import detect_ultimate_prompt_injection
from advanced_detection import detect_advanced_prompt_injection
from enhanced_detection import detect_enhanced_prompt_injection
from test_cases import get_test_cases, get_test_cases_by_category, get_test_case_count
import json
from typing import Dict, List


def test_detection_system(test_cases: List[str] = None, num_samples: int = None):
    """
    测试检测系统

    Args:
        test_cases: 测试用例列表
        num_samples: 随机采样数量
    """
    if test_cases is None:
        if num_samples:
            from test_cases import sample_test_cases
            test_cases = sample_test_cases(num_samples)
        else:
            test_cases = get_test_cases()

    print("="*70)
    print("检测系统测试报告")
    print("="*70)
    print(f"测试用例总数: {len(test_cases)}")
    print()

    # 统计结果
    ultimate_detected = 0
    advanced_detected = 0
    enhanced_detected = 0
    total_detected = 0

    # 按风险等级统计
    risk_stats = {
        'critical': 0,
        'high': 0,
        'medium': 0,
        'low': 0,
        'safe': 0
    }

    # 按攻击类型统计
    attack_type_stats = {}

    # 详细结果
    detailed_results = []

    for i, test_case in enumerate(test_cases, 1):
        print(f"\r测试进度: {i}/{len(test_cases)} ({i*100//len(test_cases)}%)", end='')

        # 使用2025终极检测器
        result = detect_ultimate_prompt_injection(test_case)

        if result['is_attack']:
            total_detected += 1
            ultimate_detected += 1

            # 统计风险等级
            risk_level = result['risk_level']
            risk_stats[risk_level] = risk_stats.get(risk_level, 0) + 1

            # 统计攻击类型
            for attack_type in result['attack_types']:
                attack_type_stats[attack_type] = attack_type_stats.get(attack_type, 0) + 1

            # 记录详细信息
            detailed_results.append({
                'test_case': test_case[:100],  # 前100个字符
                'detected': True,
                'risk_level': risk_level,
                'risk_score': result['risk_score'],
                'attack_types': result['attack_types'],
                'confidence': result['confidence']
            })
        else:
            risk_stats['safe'] = risk_stats.get('safe', 0) + 1
            detailed_results.append({
                'test_case': test_case[:100],
                'detected': False,
                'risk_level': 'safe',
                'risk_score': 0.0,
                'attack_types': [],
                'confidence': 0.0
            })

    print()  # 新行
    print("\n" + "="*70)
    print("测试结果统计")
    print("="*70)

    # 检测率统计
    detection_rate = (total_detected / len(test_cases)) * 100 if test_cases else 0
    print(f"\n📊 总体检测率: {detection_rate:.2f}%")
    print(f"  - 检测到攻击: {total_detected}/{len(test_cases)}")
    print(f"  - 未检测到: {len(test_cases) - total_detected}/{len(test_cases)}")

    # 风险等级分布
    print(f"\n🎯 风险等级分布:")
    for level in ['critical', 'high', 'medium', 'low', 'safe']:
        count = risk_stats.get(level, 0)
        percentage = (count / len(test_cases)) * 100 if test_cases else 0
        bar = '█' * int(percentage / 2)
        print(f"  {level.upper():12s}: {count:4d} ({percentage:5.1f}%) {bar}")

    # 攻击类型统计
    print(f"\n⚔️  攻击类型统计 (Top 10):")
    sorted_attacks = sorted(attack_type_stats.items(), key=lambda x: x[1], reverse=True)
    for attack_type, count in sorted_attacks[:10]:
        percentage = (count / total_detected) * 100 if total_detected > 0 else 0
        print(f"  {attack_type:20s}: {count:4d} ({percentage:5.1f}%)")

    # 详细结果示例
    print(f"\n📝 检测结果示例 (前10个):")
    for i, result in enumerate(detailed_results[:10], 1):
        status = "✅ 检测" if result['detected'] else "❌ 未检测"
        print(f"\n  {i}. {result['test_case']}")
        print(f"     状态: {status}")
        if result['detected']:
            print(f"     风险等级: {result['risk_level']}")
            print(f"     风险分数: {result['risk_score']:.3f}")
            print(f"     攻击类型: {', '.join(result['attack_types'])}")
            print(f"     置信度: {result['confidence']:.3f}")

    # 保存结果到文件
    report = {
        'total_test_cases': len(test_cases),
        'detected_attacks': total_detected,
        'detection_rate': f"{detection_rate:.2f}%",
        'risk_distribution': risk_stats,
        'attack_type_distribution': attack_type_stats,
        'detailed_results': detailed_results
    }

    output_file = 'detection_test_report.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n💾 详细报告已保存到: {output_file}")

    return report


def test_by_category(category: str = 'all'):
    """
    按类别测试检测系统

    Args:
        category: 类别 ('all', 'basic', 'advanced', 'flipattack', etc.)
    """
    if category == 'all':
        test_cases = get_test_cases()
        category_name = "全部"
    else:
        test_cases = get_test_cases_by_category(category)
        category_name = category

    if not test_cases:
        print(f"❌ 未找到类别 '{category}'的测试用例")
        return

    print(f"\n{'='*70}")
    print(f"测试类别: {category_name} ({len(test_cases)}个测试用例)")
    print(f"{'='*70}")

    return test_detection_system(test_cases)


def benchmark_detection():
    """性能基准测试"""
    import time

    print("="*70)
    print("检测系统性能基准测试")
    print("="*70)

    # 采样测试用例
    from test_cases import sample_test_cases
    test_cases = sample_test_cases(100)

    # 测试2025终极检测器
    print("\n测试2025终极检测器...")
    start = time.time()
    for test_case in test_cases:
        detect_ultimate_prompt_injection(test_case)
    ultimate_time = time.time() - start
    ultimate_avg = ultimate_time / len(test_cases)

    # 测试高级检测器
    print("测试高级检测器...")
    start = time.time()
    for test_case in test_cases:
        detect_advanced_prompt_injection(test_case)
    advanced_time = time.time() - start
    advanced_avg = advanced_time / len(test_cases)

    # 测试增强检测器
    print("测试增强检测器...")
    start = time.time()
    for test_case in test_cases:
        detect_enhanced_prompt_injection(test_case)
    enhanced_time = time.time() - start
    enhanced_avg = enhanced_time / len(test_cases)

    print("\n" + "="*70)
    print("性能基准测试结果")
    print("="*70)
    print(f"\n2025终极检测器:")
    print(f"  总时间: {ultimate_time:.3f}秒")
    print(f"  平均时间: {ultimate_avg*1000:.2f}毫秒/次")
    print(f"  吞吐量: {len(test_cases)/ultimate_time:.1f}次/秒")

    print(f"\n高级检测器:")
    print(f"  总时间: {advanced_time:.3f}秒")
    print(f"  平均时间: {advanced_avg*1000:.2f}毫秒/次")
    print(f"  吞吐量: {len(test_cases)/advanced_time:.1f}次/秒")

    print(f"\n增强检测器:")
    print(f"  总时间: {enhanced_time:.3f}秒")
    print(f"  平均时间: {enhanced_avg*1000:.2f}毫秒/次")
    print(f"  吞吐量: {len(test_cases)/enhanced_time:.1f}次/秒")


def interactive_test():
    """交互式测试"""
    print("="*70)
    print("交互式检测测试")
    print("="*70)
    print("\n输入要测试的文本 (输入 'quit' 退出):")

    while True:
        print("\n" + "-"*70)
        text = input(">>> ")

        if text.lower() in ['quit', 'exit', 'q', '退出']:
            print("退出测试")
            break

        if not text.strip():
            continue

        # 执行检测
        print("\n检测中...")
        result = detect_ultimate_prompt_injection(text)

        # 显示结果
        if result['is_attack']:
            print(f"\n⚠️  检测到攻击!")
            print(f"   攻击类型: {', '.join(result['attack_types'])}")
            print(f"   风险等级: {result['risk_level']}")
            print(f"   风险分数: {result['risk_score']:.3f}")
            print(f"   置信度: {result['confidence']:.3f}")
        else:
            print(f"\n✅ 内容安全")
            print(f"   风险等级: low")
            print(f"   风险分数: {result['risk_score']:.3f}")


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == 'test':
            # 运行所有测试
            test_detection_system()
        elif command == 'sample':
            # 运行采样测试
            num = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            test_detection_system(num_samples=num)
        elif command == 'category':
            # 按类别测试
            category = sys.argv[2] if len(sys.argv) > 2 else 'all'
            test_by_category(category)
        elif command == 'benchmark':
            # 性能基准测试
            benchmark_detection()
        elif command == 'interactive':
            # 交互式测试
            interactive_test()
        else:
            print("未知命令")
            print("可用命令:")
            print("  test              - 运行所有测试")
            print("  sample [n]        - 运行采样测试 (默认100个)")
            print("  category [name]   - 按类别测试")
            print("  benchmark         - 性能基准测试")
            print("  interactive       - 交互式测试")
    else:
        # 默认运行所有测试
        test_detection_system()
        print("\n" + "="*70)
        print("使用方法:")
        print("  python test_runner.py test              # 运行所有测试")
        print("  python test_runner.py sample 100       # 采样100个测试")
        print("  python test_runner.py category advanced  # 测试高级攻击")
        print("  python test_runner.py benchmark        # 性能基准测试")
        print("  python test_runner.py interactive      # 交互式测试")
