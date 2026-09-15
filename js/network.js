let networkGraphInitialized = false;

function initNetworkGraph() {
  if (networkGraphInitialized) return;
  networkGraphInitialized = true;

  fetch('network_data.json')
    .then(response => {
      if (!response.ok) throw new Error("Network data not found");
      return response.json();
    })
    .then(data => {
      document.getElementById('network-loading').style.display = 'none';
      const svgElement = document.getElementById('network-svg');
      svgElement.style.display = 'block';
      renderNetwork(data, svgElement);
      renderNetworkLegend(data);
    })
    .catch(error => {
      console.error("Failed to load network data:", error);
      const el = document.getElementById('network-loading');
      el.innerText = "Network data could not be loaded.";
      el.style.color = "#ef4444";
    });
}

function renderNetworkLegend(data) {
  const container = document.getElementById('network-container');
  if (!container) return;

  // Build group → label map
  const groupMap = {};
  data.nodes.forEach(n => {
    if (n.group >= 0) groupMap[n.group] = n.groupLabel;
  });

  // Color scale shared with the graph
  const colorScale = buildColorScale();

  const legend = document.createElement('div');
  legend.id = 'network-legend';
  legend.style.cssText = `
    position: absolute; bottom: 12px; left: 12px;
    background: rgba(255,255,255,0.92);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.72rem;
    line-height: 1.8;
    color: #475569;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    max-width: 180px;
  `;

  let html = `<div style="font-weight:600; color:#0f172a; margin-bottom:6px; font-size:0.73rem; letter-spacing:0.04em; text-transform:uppercase;">Groups</div>`;
  Object.entries(groupMap).forEach(([grp, label]) => {
    const color = colorScale(parseInt(grp));
    html += `<div style="display:flex;align-items:center;gap:6px;">
      <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block;"></span>
      <span>${label}</span>
    </div>`;
  });
  // Self node
  html += `<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
    <span style="width:14px;height:14px;border-radius:50%;background:#0284c7;flex-shrink:0;display:inline-block;"></span>
    <span style="font-weight:600;color:#0284c7;">Self</span>
  </div>`;

  legend.innerHTML = html;
  container.appendChild(legend);
}

function buildColorScale() {
  const palette = [
    "#10b981", // ZIB Berlin – teal
    "#f59e0b", // Charité – amber
    "#8b5cf6", // Graz/Joanneum – purple
    "#06b6d4", // MedShapeNet – cyan
    "#f43f5e", // BraTS – rose
    "#84cc16", // CVPR 2023 – lime
    "#fb923c", // Other – orange
    "#64748b", // AutoImplant TMI – slate
    "#a78bfa", // AutoImplant 2021 – violet
    "#34d399", // Clinical – emerald
    "#fbbf24", // Other2 – yellow
    "#60a5fa", // Aorta – blue
  ];
  return (group) => palette[group % palette.length];
}

function renderNetwork(data, svgElement) {
  const container = svgElement.parentElement;
  const width  = container.clientWidth  || 860;
  const height = container.clientHeight || 560;

  const colorScale = buildColorScale();

  const svg = d3.select(svgElement)
    .attr("viewBox", [0, 0, width, height]);

  // ── Arrowhead marker for directed feel (decorative)
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -4 8 8")
    .attr("refX", 20).attr("refY", 0)
    .attr("markerWidth", 6).attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-4L8,0L0,4")
    .attr("fill", "#94a3b8")
    .attr("opacity", 0.5);

  // ── Background rect to capture zoom on empty space
  svg.append("rect")
    .attr("width", width).attr("height", height)
    .attr("fill", "transparent");

  // ── Zoom wrapper
  const g = svg.append("g");
  const zoom = d3.zoom()
    .scaleExtent([0.2, 5])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoom);

  // ── Zoom controls
  addZoomControls(svg, zoom, width, height);

  // ── Force simulation
  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(d => {
      // Longer distance for weak ties, shorter for strong
      const base = 110;
      return base + (5 - Math.min(d.value, 5)) * 14;
    }))
    .force("charge", d3.forceManyBody().strength(d => d.isCenter ? -600 : -180))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius(d => nodeRadius(d) + 8));

  // ── Links
  const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke", "#cbd5e1")
    .attr("stroke-opacity", 0.7)
    .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 1.4));

  // ── Node groups (circle + label together)
  const nodeGroup = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(data.nodes)
    .join("g")
    .attr("cursor", d => d.scholar_url ? "pointer" : "default")
    .call(drag(simulation));

  // Circle
  nodeGroup.append("circle")
    .attr("r", d => nodeRadius(d))
    .attr("fill", d => d.isCenter ? "#0284c7" : colorScale(d.group))
    .attr("stroke", "#ffffff")
    .attr("stroke-width", d => d.isCenter ? 3 : 2)
    .attr("filter", d => d.isCenter ? "drop-shadow(0 0 6px rgba(2,132,199,0.4))" : "none");

  // Label
  nodeGroup.append("text")
    .text(d => d.name)
    .attr("font-size", d => d.isCenter ? "13px" : "10px")
    .attr("font-weight", d => d.isCenter ? "700" : "500")
    .attr("fill", "#1e293b")
    .attr("dx", d => nodeRadius(d) + 5)
    .attr("dy", "0.35em")
    .attr("pointer-events", "none");

  // ── Tooltip
  const tooltip = d3.select("#network-tooltip");

  nodeGroup
    .on("mouseover", function(event, d) {
      // Highlight node
      d3.select(this).select("circle")
        .attr("stroke", "#0284c7")
        .attr("stroke-width", 3);

      // Highlight connected links
      link
        .attr("stroke", l =>
          (l.source.id === d.id || l.target.id === d.id) ? "#0284c7" : "#cbd5e1"
        )
        .attr("stroke-opacity", l =>
          (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.25
        )
        .attr("stroke-width", l =>
          (l.source.id === d.id || l.target.id === d.id)
            ? Math.max(2, Math.sqrt(l.value) * 1.8)
            : Math.max(1, Math.sqrt(l.value) * 1.4)
        );

      // Build tooltip
      const paperList = d.papers && d.papers.length > 0
        ? `<ul style="margin:6px 0 0; padding-left:1.1em; list-style:disc;">${
            d.papers.slice(0, 5).map(p => `<li style="margin-bottom:2px;">${p}</li>`).join('')
          }${d.papers.length > 5 ? `<li style="color:#94a3b8;">+${d.papers.length - 5} more</li>` : ''}</ul>`
        : '';

      const scholarLink = d.scholar_url
        ? `<div style="margin-top:8px;"><a href="${d.scholar_url}" target="_blank" style="color:#0284c7;font-size:0.78rem;text-decoration:none;">View Scholar Profile →</a></div>`
        : '';

      tooltip.html(`
        <strong style="font-size:0.9rem;color:#0f172a;">${d.name}</strong>
        <div style="color:#64748b;font-size:0.78rem;margin:2px 0 6px;">${d.affiliation || d.groupLabel || ''}</div>
        <div style="font-size:0.8rem;"><span style="background:#e0f2fe;color:#0369a1;padding:2px 7px;border-radius:12px;font-weight:600;">${d.paperCount} paper${d.paperCount !== 1 ? 's' : ''}</span></div>
        ${paperList}
        ${scholarLink}
      `)
      .style("opacity", 1)
      .style("left", (event.offsetX + 14) + "px")
      .style("top",  (event.offsetY - 10) + "px")
      .style("max-width", "240px");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.offsetX + 14) + "px")
        .style("top",  (event.offsetY - 10) + "px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", d.isCenter ? 3 : 2);

      link
        .attr("stroke", "#cbd5e1")
        .attr("stroke-opacity", 0.7)
        .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value) * 1.4));

      tooltip.style("opacity", 0);
    })
    .on("click", function(event, d) {
      if (d.scholar_url) window.open(d.scholar_url, '_blank');
    });

  // ── Tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => clamp(d.source.x, 20, width - 20))
      .attr("y1", d => clamp(d.source.y, 20, height - 20))
      .attr("x2", d => clamp(d.target.x, 20, width - 20))
      .attr("y2", d => clamp(d.target.y, 20, height - 20));

    nodeGroup.attr("transform", d =>
      `translate(${clamp(d.x, 20, width - 20)},${clamp(d.y, 20, height - 20)})`
    );
  });

  // ── Initial zoom to fit
  simulation.on("end", () => {
    const bounds = g.node().getBBox();
    const dx = bounds.width, dy = bounds.height;
    const x = bounds.x + dx / 2, y = bounds.y + dy / 2;
    const scale = Math.min(0.9, 0.9 / Math.max(dx / width, dy / height));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];
    svg.transition().duration(600).call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  });
}

function nodeRadius(d) {
  if (d.isCenter) return 28;
  return Math.max(12, Math.sqrt(d.paperCount) * 7);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function addZoomControls(svg, zoom, width, height) {
  const controls = svg.append("g")
    .attr("class", "zoom-controls")
    .attr("transform", `translate(${width - 56}, 12)`);

  const btnStyle = (g, y) => {
    g.attr("transform", `translate(0, ${y})`);
    g.append("rect")
      .attr("width", 32).attr("height", 32)
      .attr("rx", 6)
      .attr("fill", "white")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1)
      .style("cursor", "pointer");
    return g;
  };

  // Zoom In
  const zIn = controls.append("g").call(g => btnStyle(g, 0));
  zIn.append("text").text("+")
    .attr("x", 16).attr("y", 21)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px").attr("fill", "#475569")
    .attr("pointer-events", "none");
  zIn.on("click", () => svg.transition().duration(250).call(zoom.scaleBy, 1.4));

  // Zoom Out
  const zOut = controls.append("g").call(g => btnStyle(g, 40));
  zOut.append("text").text("−")
    .attr("x", 16).attr("y", 21)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px").attr("fill", "#475569")
    .attr("pointer-events", "none");
  zOut.on("click", () => svg.transition().duration(250).call(zoom.scaleBy, 0.7));

  // Reset
  const zReset = controls.append("g").call(g => btnStyle(g, 80));
  zReset.append("text").text("⌖")
    .attr("x", 16).attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px").attr("fill", "#475569")
    .attr("pointer-events", "none");
  zReset.on("click", () => svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity));
}

// Drag behaviour
function drag(simulation) {
  return d3.drag()
    .on("start", (event) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on("drag", (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", (event) => {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}
