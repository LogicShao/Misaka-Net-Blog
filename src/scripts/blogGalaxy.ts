import * as echarts from 'echarts';

type ClusterItem = {
  x: number;
  y: number;
  title?: string;
  date?: string;
  slug?: string;
  cluster?: number;
};

let chart: echarts.ECharts | null = null;
let resizeBound = false;
let themeBound = false;
let retryCount = 0;
const MAX_RETRIES = 10;

const isFullBleed = (container: HTMLElement) =>
  container.dataset.fullBleed === 'true';

const applyFullBleedHeight = (container: HTMLElement) => {
  if (!isFullBleed(container)) {
    return;
  }
  const header = document.querySelector('header');
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const viewportHeight =
    window.visualViewport?.height ?? window.innerHeight ?? 0;
  const targetHeight = Math.max(viewportHeight - headerHeight, 240);
  container.style.height = `${targetHeight}px`;
};

const handleResize = () => {
  if (chart) {
    const container = chart.getDom() as HTMLElement;
    applyFullBleedHeight(container);
    chart.resize();
  }
};

const getPalette = () => {
  const rootStyles = getComputedStyle(document.documentElement);
  return [
    rootStyles.getPropertyValue('--misaka-blue').trim() || '#00bfff',
    rootStyles.getPropertyValue('--misaka-circuit').trim() || '#4ade80',
    rootStyles.getPropertyValue('--misaka-accent').trim() || '#38bdf8',
    rootStyles.getPropertyValue('--misaka-gray').trim() || '#64748b',
    '#f97316',
  ];
};

const buildSeriesData = (items: ClusterItem[], palette: string[]) =>
  items.map((item) => ({
    value: [item.x, item.y],
    title: item.title,
    date: item.date,
    slug: item.slug,
    cluster: item.cluster,
    itemStyle: {
      color: palette[(item.cluster ?? 0) % palette.length],
    },
  }));

const initGalaxy = () => {
  const container = document.getElementById('blog-galaxy-chart');
  const dataTag = document.getElementById('blog-galaxy-data');

  if (!container || !dataTag) {
    return;
  }

  applyFullBleedHeight(container);

  if (container.clientWidth === 0 || container.clientHeight === 0) {
    if (retryCount < MAX_RETRIES) {
      retryCount += 1;
      requestAnimationFrame(initGalaxy);
    }
    return;
  }

  retryCount = 0;

  let items: ClusterItem[] = [];
  try {
    items = JSON.parse(dataTag.textContent || '[]') as ClusterItem[];
  } catch (error) {
    console.error('[BlogGalaxy] Failed to parse clusters.json', error);
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const existing = echarts.getInstanceByDom(container);
    if (existing) existing.dispose();
    chart = null;
    return;
  }

  const existing = echarts.getInstanceByDom(container);
  if (existing) existing.dispose();

  const palette = getPalette();
  const seriesData = buildSeriesData(items, palette);

  chart = echarts.init(container, null, {renderer: 'canvas'});
  chart.setOption({
    animationDuration: 600,
    animationEasing: 'cubicOut',
    grid: {left: 0, right: 0, top: 0, bottom: 0},
    xAxis: {
      type: 'value',
      show: false,
      scale: true,
    },
    yAxis: {
      type: 'value',
      show: false,
      scale: true,
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const data = (params.data || {}) as ClusterItem;
        const title = data.title || '';
        const date = data.date || '';
        return date ? `${title}<br/>${date}` : title;
      },
    },
    dataZoom: [
      {type: 'inside', xAxisIndex: 0, filterMode: 'none'},
      {type: 'inside', yAxisIndex: 0, filterMode: 'none'},
    ],
    series: [
      {
        type: 'scatter',
        data: seriesData,
        symbolSize: 10,
        emphasis: {
          scale: true,
          itemStyle: {
            shadowBlur: 16,
            shadowColor: 'rgba(0, 191, 255, 0.35)',
          },
        },
      },
    ],
  });

  chart.on('click', (params) => {
    const slug = (params?.data as ClusterItem | undefined)?.slug;
    if (slug) {
      window.location.href = `/blog/${slug}`;
    }
  });
};

const bindGlobalHandlers = () => {
  if (!resizeBound) {
    window.addEventListener('resize', handleResize);
    resizeBound = true;
  }

  if (!themeBound) {
    window.addEventListener('theme-changed', initGalaxy);
    themeBound = true;
  }
};

const setup = () => {
  initGalaxy();
  bindGlobalHandlers();
};

setup();
document.addEventListener('astro:page-load', setup);
