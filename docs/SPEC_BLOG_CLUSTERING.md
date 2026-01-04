# Technical Specification: Blog Post Clustering & Visualization Pipeline

## 1. Project Context

* **Target System**: Astro (SSG) hosted on Cloudflare Pages.
* **Local Environment**: Python 3.x with NVIDIA RTX 4070 (CUDA 11.8+).
* **Goal**: Implement a "Local Pre-computation -> Static Deployment" pipeline to visualize blog posts as a 2D interactive galaxy map using K-Means clustering.

## 2. Architecture Overview

1. **Data Ingestion**: Parse Markdown files with Front Matter.
2. **Vectorization (Local)**: Use `BAAI/bge-m3` on GPU to generate high-dimensional embeddings.
3. **Dimensionality Reduction**: Apply K-Means (Clustering) and t-SNE (2D Projection).
4. **Serialization**: Export processed data to a static JSON file.
5. **Visualization**: Render the JSON using Apache ECharts in an Astro component.

## 3. Directory Structure Requirements

Ensure the generated code adheres to this structure:

```text
/
├── scripts/
│   └── generate_embeddings.py  # (New) Python script for local processing
├── src/
│   ├── content/
│   │   └── posts/              # (Existing) Markdown source files
│   ├── data/
│   │   └── clusters.json       # (Generated) Static data for Astro
│   └── components/
│       └── BlogGalaxy.astro    # (New) Visualization component
└── package.json                # (Modified) Add scripts

```

## 4. Implementation Details

### Part A: Python Processing Script (`scripts/generate_embeddings.py`)

**Dependencies**: `sentence-transformers`, `torch`, `scikit-learn`, `numpy`, `python-frontmatter`.

**Functional Logic**:

1. **Device Setup**: Explicitly check for and assign `device = 'cuda'` to utilize the RTX 4070.
2. **File Scanning**:
* Iterate through `src/content/posts/*.md`.
* Use `python-frontmatter` to separate metadata from content.
* Extract `title`, `slug` (or filename), and `date`.
* Extract content body (remove Markdown syntax if possible, but raw text is acceptable).


3. **Embedding Generation**:
* Load Model: `BAAI/bge-m3`.
* Encode content with `normalize_embeddings=True`.
* *Note*: Ensure batch processing is used for efficiency on GPU.


4. **Math Processing**:
* **Clustering**: `KMeans(n_clusters=5)` (Configurable).
* **Reduction**: `TSNE(n_components=2, init='pca', learning_rate='auto')`.


5. **Output Generation**:
* Map the resulting [x, y] coordinates and [cluster_label] back to the post metadata.
* Write to `src/data/clusters.json`.



**JSON Schema (`src/data/clusters.json`)**:

```json
[
  {
    "title": "Post Title",
    "slug": "post-slug-url",
    "date": "YYYY-MM-DD",
    "cluster": 0,    // Integer (0-4)
    "x": 12.34,      // Float (t-SNE coord)
    "y": -5.67       // Float (t-SNE coord)
  }
]

```

### Part B: Astro Visualization Component (`src/components/BlogGalaxy.astro`)

**Dependencies**: `echarts`.

**Functional Logic**:

1. **Server-Side**: Import `clusters.json` at build time.
2. **Client-Side**:
* Initialize an ECharts instance on a `<div>`.
* **Color Mapping**: Define a palette of 5 distinct colors corresponding to cluster IDs.
* **Series Configuration**: Use type `scatter`. Map `x` and `y` from JSON to the chart axes.
* **Tooltip**: Show Post Title and Date on hover.
* **Interactivity**:
* Hide standard X/Y axes for a "Galaxy" look.
* Enable `roam` (zoom/pan).
* Bind a `click` event listener: `window.location.href = '/posts/' + params.data.slug`.




3. **Responsiveness**: Add a `resize` event listener to handle window resizing.

### Part C: Workflow Integration (`package.json`)

**Task**:

1. Define a new script `update-graph` that runs `python scripts/generate_embeddings.py`.
2. (Optional) Chain this script before the build command or creating a manual deployment command.
