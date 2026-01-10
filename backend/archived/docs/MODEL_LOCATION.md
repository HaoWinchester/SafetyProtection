# Sentence-Transformers 模型存储位置说明

## 模型位置

**当前使用的模型**: `all-MiniLM-L6-v2`

**存储路径**: `~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/`

完整路径：
```
/Users/menghao/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/
```

## 模型文件详情

总大小：**约 103MB**

主要文件：

1. **模型权重** (87MB)
   - `model.safetensors` - 主要的模型参数文件

2. **配置文件**
   - `config.json` - 模型架构配置
   - `config_sentence_transformers.json` - Sentence-Transformers 特定配置
   - `sentence_bert_config.json` - SBERT 配置
   - `modules.json` - 模块配置

3. **分词器文件** (约 676KB)
   - `vocab.txt` (226KB) - 词汇表
   - `tokenizer.json` (455KB) - 分词器配置
   - `tokenizer_config.json` - 分词器参数
   - `special_tokens_map.json` - 特殊token映射

4. **其他文件**
   - `README.md` (10KB) - 模型说明文档
   - `1_Pooling/config.json` - 池化层配置

## 模型结构

```
~/.cache/huggingface/hub/
└── models--sentence-transformers--all-MiniLM-L6-v2/
    ├── blobs/                          # 实际存储的模型文件
    │   ├── 53aa5117... (87MB)         # model.safetensors
    │   ├── fb14027... (226KB)         # vocab.txt
    │   ├── cb202bf... (455KB)         # tokenizer.json
    │   └── ... (其他配置文件)
    ├── snapshots/
    │   └── c9745ed1.../               # 当前版本的符号链接
    │       ├── model.safetensors -> ../../blobs/...
    │       ├── config.json -> ../../blobs/...
    │       └── ...
    └── version.txt                    # 缓存版本信息
```

## Hugging Face 缓存机制

Sentence-Transformers 使用 Hugging Face 的统一缓存系统：

- **首次使用**: 模型会自动从 Hugging Face Hub 下载
- **后续使用**: 直接从本地缓存加载，无需重新下载
- **版本管理**: 通过 snapshots 机制管理不同版本

## 其他可能的模型位置

如果 Hugging Face 缓存目录不存在，模型可能存储在：

1. `~/.cache/torch/sentence_transformers/`
2. `/usr/local/lib/python3.X/site-packages/sentence_transformers/`

你可以通过环境变量自定义缓存位置：

```bash
export TRANSFORMERS_CACHE=/path/to/cache
export HF_HOME=/path/to/huggingface/cache
```

## 查看模型位置的命令

```python
import os
from sentence_transformers import SentenceTransformer

# 加载模型
model = SentenceTransformer('all-MiniLM-L6-v2')

# 查看模型路径
print(f"模型路径: {model._first_module().auto_model.config._name_or_path}")

# 或者直接查看缓存
import sentence_transformers
cache_dir = os.path.join(os.path.expanduser('~'), '.cache', 'huggingface', 'hub')
print(f"缓存目录: {cache_dir}")
```

## 模型下载来源

- **Hugging Face Hub**: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- **备用来源**: 如果无法访问 Hugging Face，可以从镜像站点下载

## 更换模型

如果想使用其他模型，可以修改 `simple_semantic_analyzer.py` 中的模型名称：

```python
# 当前模型 (轻量级，适合快速检测)
self.model_name = "all-MiniLM-L6-v2"  # 103MB

# 其他可选模型:
# self.model_name = "all-mpnet-base-v2"       # 438MB - 更高精度
# self.model_name = "paraphrase-multilingual-mpnet-base-v2"  # 1.1GB - 多语言支持
# self.model_name = "distiluse-base-multilingual-cased-v1"   # 468MB - 多语言
```

## 清理缓存

如果需要删除模型以释放空间：

```bash
# 删除特定模型
rm -rf ~/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/

# 删除所有 Hugging Face 缓存
rm -rf ~/.cache/huggingface/

# 清理后，模型会在下次运行时重新下载
```

## 性能特点

- **加载时间**: 首次约 3-5 秒（从缓存加载）
- **检测速度**: 约 10-50ms/次（取决于文本长度）
- **内存占用**: 约 200-300MB（模型加载后）
- **支持语言**: 主要支持英语，对中文有一定支持

## 注意事项

1. **模型持久化**: 模型一旦下载会永久缓存，不会自动删除
2. **磁盘空间**: 确保有足够的磁盘空间（至少 500MB 用于缓存）
3. **网络要求**: 首次下载需要稳定的网络连接
4. **版本控制**: Hugging Face 会自动管理模型版本更新
