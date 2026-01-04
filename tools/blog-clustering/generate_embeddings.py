#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

import frontmatter
import numpy as np
import torch
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE


@dataclass
class PostRecord:
    title: str
    slug: str
    date: str
    content: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate clustering data for the blog galaxy visualization."
    )
    repo_root = Path(__file__).resolve().parents[2]
    parser.add_argument(
        "--input-dir",
        default=str(repo_root / "src" / "content" / "blog"),
        help="Path to blog content directory.",
    )
    parser.add_argument(
        "--output",
        default=str(repo_root / "src" / "data" / "clusters.json"),
        help="Output JSON path.",
    )
    parser.add_argument("--clusters", type=int, default=5, help="KMeans cluster count.")
    parser.add_argument(
        "--batch-size", type=int, default=4, help="Embedding batch size."
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    parser.add_argument(
        "--model",
        default="BAAI/bge-m3",
        help="SentenceTransformer model name.",
    )
    parser.add_argument(
        "--max-length",
        type=int,
        default=1024,
        help="Max sequence length for embeddings.",
    )
    parser.add_argument(
        "--device",
        choices=("auto", "cuda", "cpu"),
        default="auto",
        help="Embedding device selection.",
    )
    parser.add_argument(
        "--precision",
        choices=("fp16", "fp32"),
        default="fp16",
        help="Embedding precision for GPU.",
    )
    return parser.parse_args()


def normalize_date(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return ""
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%Y.%m.%d"):
            try:
                return datetime.strptime(raw, fmt).date().isoformat()
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(raw).date().isoformat()
        except ValueError:
            return raw
    return str(value)


def strip_markdown(text: str) -> str:
    cleaned = re.sub(r"```.*?```", " ", text, flags=re.S)
    cleaned = re.sub(r"`[^`]*`", " ", cleaned)
    cleaned = re.sub(r"!\[([^\]]*)\]\([^\)]*\)", r"\1", cleaned)
    cleaned = re.sub(r"\[([^\]]+)\]\([^\)]*\)", r"\1", cleaned)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"[#>*_~`]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def load_posts(content_dir: Path) -> list[PostRecord]:
    posts: list[PostRecord] = []
    for path in sorted(content_dir.rglob("*")):
        if path.suffix.lower() not in {".md", ".mdx"}:
            continue
        post = frontmatter.load(path)
        meta = post.metadata or {}
        if meta.get("draft") is True:
            continue
        title = str(meta.get("title") or path.stem)
        date_value = meta.get("pubDate") or meta.get("date")
        date_str = normalize_date(date_value)
        slug = path.relative_to(content_dir).with_suffix("").as_posix()
        body = strip_markdown(post.content)
        if not body:
            body = title
        posts.append(PostRecord(title=title, slug=slug, date=date_str, content=body))
    return posts


def compute_tsne(embeddings: np.ndarray, seed: int) -> np.ndarray:
    sample_count = embeddings.shape[0]
    if sample_count == 1:
        return np.array([[0.0, 0.0]], dtype=float)
    if sample_count == 2:
        return np.array([[-1.0, 0.0], [1.0, 0.0]], dtype=float)
    perplexity = min(30, max(5, (sample_count - 1) // 3))
    tsne = TSNE(
        n_components=2,
        init="pca",
        learning_rate="auto",
        perplexity=perplexity,
        random_state=seed,
    )
    return tsne.fit_transform(embeddings)


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    content_dir = Path(args.input_dir)
    output_path = Path(args.output)

    if not content_dir.exists():
        print(f"Input directory not found: {content_dir}", file=sys.stderr)
        return 1

    posts = load_posts(content_dir)
    if not posts:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text("[]\n", encoding="utf-8")
        print("No posts found. Wrote empty clusters.json.")
        return 0

    if args.device == "auto":
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device
        if device == "cuda" and not torch.cuda.is_available():
            print("CUDA requested but not available. Falling back to CPU.", file=sys.stderr)
            device = "cpu"

    if device != "cuda":
        print("CUDA not available. Falling back to CPU.", file=sys.stderr)

    precision = args.precision if device == "cuda" else "fp32"

    model_dir = repo_root / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    model_kwargs = {}
    if device == "cuda" and precision == "fp16":
        model_kwargs["dtype"] = torch.float16
    if model_kwargs:
        try:
            model = SentenceTransformer(
                args.model,
                device=device,
                cache_folder=str(model_dir),
                model_kwargs=model_kwargs,
            )
        except (TypeError, ValueError):
            legacy_kwargs = {"torch_dtype": model_kwargs["dtype"]}
            try:
                model = SentenceTransformer(
                    args.model,
                    device=device,
                    cache_folder=str(model_dir),
                    model_kwargs=legacy_kwargs,
                )
            except TypeError:
                model = SentenceTransformer(
                    args.model,
                    device=device,
                    cache_folder=str(model_dir),
                )
                model = model.to(model_kwargs["dtype"])
    else:
        model = SentenceTransformer(
            args.model,
            device=device,
            cache_folder=str(model_dir),
        )
    if args.max_length:
        model.max_seq_length = args.max_length
    embeddings = model.encode(
        [post.content for post in posts],
        batch_size=args.batch_size,
        normalize_embeddings=True,
        show_progress_bar=True,
    )
    embeddings = np.asarray(embeddings)

    cluster_count = min(args.clusters, len(posts))
    kmeans = KMeans(n_clusters=cluster_count, random_state=args.seed, n_init="auto")
    labels = kmeans.fit_predict(embeddings)

    coords = compute_tsne(embeddings, args.seed)

    output_records = []
    for idx, post in enumerate(posts):
        output_records.append(
            {
                "title": post.title,
                "slug": post.slug,
                "date": post.date,
                "cluster": int(labels[idx]),
                "x": float(coords[idx, 0]),
                "y": float(coords[idx, 1]),
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(output_records, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(f"Wrote {len(output_records)} posts to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
