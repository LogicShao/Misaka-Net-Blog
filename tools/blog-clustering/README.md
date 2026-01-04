# 博客聚类工具

本地预计算工具：为文章生成嵌入向量、聚类，并写出 2D 投影数据供 Astro 星系图使用。

## 依赖要求

- Python 3.x
- 建议使用支持 CUDA 的 GPU（适用于 `BAAI/bge-m3`）

安装依赖：

```
pip install -r tools/blog-clustering/requirements.txt
```

说明：如需 GPU 加速，请安装支持 CUDA 的 `torch`。模型下载缓存位于仓库根目录 `model/`（已在 git 中忽略）。

## 使用方式

```
python tools/blog-clustering/generate_embeddings.py
```

可选参数：

```
--input-dir   文章目录（默认：src/content/blog）
--output      输出 JSON 路径（默认：src/data/clusters.json）
--clusters    KMeans 聚类数量（默认：5）
--batch-size  批处理大小（默认：4）
--seed        随机种子（默认：42）
--model       SentenceTransformer 模型（默认：BAAI/bge-m3）
--max-length  最大序列长度（默认：1024）
--device      设备选择（auto|cuda|cpu，默认：auto）
--precision   GPU 精度（fp16|fp32，默认：fp16）
```

输出 JSON 由 `src/components/BlogGalaxy.astro` 使用。
