/**
 * Tiny, dependency-free SVG chart helpers. No CDN, no build step — these render
 * crisp charts that work even from a file:// page with no network.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  /** Donut chart. data = [{label, value, color}] */
  function donut(container, data, { size = 180, thickness = 26, centerLabel = '' } = {}) {
    container.innerHTML = '';
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = (size - thickness) / 2;
    const cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const svg = el('svg', { viewBox: `0 0 ${size} ${size}`, class: 'chart-donut', role: 'img' });
    let offset = 0;
    data.forEach((d) => {
      const frac = d.value / total;
      const seg = el('circle', {
        cx, cy, r, fill: 'none', stroke: d.color, 'stroke-width': thickness,
        'stroke-dasharray': `${frac * circ} ${circ}`,
        'stroke-dashoffset': -offset * circ,
        transform: `rotate(-90 ${cx} ${cy})`,
      });
      seg.appendChild(el('title')).textContent = `${d.label}: ${d.value}`;
      svg.appendChild(seg);
      offset += frac;
    });
    const t1 = el('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', class: 'donut-total' });
    t1.textContent = total.toLocaleString();
    const t2 = el('text', { x: cx, y: cy + 16, 'text-anchor': 'middle', class: 'donut-sub' });
    t2.textContent = centerLabel;
    svg.append(t1, t2);
    container.appendChild(svg);

    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    data.forEach((d) => {
      const item = document.createElement('span');
      item.className = 'legend-item';
      item.innerHTML = `<i style="background:${d.color}"></i>${d.label} <b>${d.value.toLocaleString()}</b>`;
      legend.appendChild(item);
    });
    container.appendChild(legend);
  }

  /** Bar chart. data = [{label, value}] */
  function bars(container, data, { height = 180, color = '#5b8def', barLabelRotate = false } = {}) {
    container.innerHTML = '';
    const max = Math.max(1, ...data.map((d) => d.value));
    const w = Math.max(container.clientWidth || 480, data.length * 40);
    const padB = barLabelRotate ? 54 : 26, padL = 30, padT = 10;
    const innerH = height - padB - padT;
    const bw = (w - padL) / data.length;
    const svg = el('svg', { viewBox: `0 0 ${w} ${height}`, class: 'chart-bars', preserveAspectRatio: 'none' });
    // gridlines
    for (let g = 0; g <= 4; g++) {
      const y = padT + innerH - (innerH * g) / 4;
      svg.appendChild(el('line', { x1: padL, y1: y, x2: w, y2: y, class: 'grid' }));
      const lbl = el('text', { x: padL - 6, y: y + 3, 'text-anchor': 'end', class: 'axis' });
      lbl.textContent = Math.round((max * g) / 4);
      svg.appendChild(lbl);
    }
    data.forEach((d, i) => {
      const h = (d.value / max) * innerH;
      const x = padL + i * bw + bw * 0.15;
      const y = padT + innerH - h;
      const rect = el('rect', { x, y, width: bw * 0.7, height: h, rx: 3, fill: color, class: 'bar' });
      rect.appendChild(el('title')).textContent = `${d.label}: ${d.value}`;
      svg.appendChild(rect);
      const tx = x + bw * 0.35;
      const tl = el('text', {
        x: barLabelRotate ? tx : tx, y: height - padB + 14,
        'text-anchor': barLabelRotate ? 'end' : 'middle', class: 'axis',
        transform: barLabelRotate ? `rotate(-40 ${tx} ${height - padB + 14})` : '',
      });
      tl.textContent = d.label;
      svg.appendChild(tl);
    });
    container.appendChild(svg);
  }

  /** Sparkline-ish area line. data = [{label, value}] */
  function line(container, data, { height = 180, color = '#34c759' } = {}) {
    container.innerHTML = '';
    if (!data.length) return;
    const w = Math.max(container.clientWidth || 480, 480);
    const padL = 30, padB = 24, padT = 10, padR = 8;
    const max = Math.max(1, ...data.map((d) => d.value));
    const innerH = height - padB - padT;
    const innerW = w - padL - padR;
    const x = (i) => padL + (innerW * i) / Math.max(1, data.length - 1);
    const y = (v) => padT + innerH - (v / max) * innerH;
    const svg = el('svg', { viewBox: `0 0 ${w} ${height}`, class: 'chart-line', preserveAspectRatio: 'none' });
    for (let g = 0; g <= 4; g++) {
      const gy = padT + innerH - (innerH * g) / 4;
      svg.appendChild(el('line', { x1: padL, y1: gy, x2: w - padR, y2: gy, class: 'grid' }));
      const lbl = el('text', { x: padL - 6, y: gy + 3, 'text-anchor': 'end', class: 'axis' });
      lbl.textContent = Math.round((max * g) / 4);
      svg.appendChild(lbl);
    }
    const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
    const area = `${padL},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`;
    svg.appendChild(el('polygon', { points: area, fill: color, 'fill-opacity': '0.12', stroke: 'none' }));
    svg.appendChild(el('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2 }));
    data.forEach((d, i) => {
      const c = el('circle', { cx: x(i), cy: y(d.value), r: 2.5, fill: color });
      c.appendChild(el('title')).textContent = `${d.label}: ${d.value}`;
      svg.appendChild(c);
      if (i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) {
        const t = el('text', { x: x(i), y: height - 8, 'text-anchor': 'middle', class: 'axis' });
        t.textContent = d.label;
        svg.appendChild(t);
      }
    });
    container.appendChild(svg);
  }

  window.IslandCharts = { donut, bars, line };
})();
