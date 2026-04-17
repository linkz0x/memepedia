"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { Entry, EntryType, TYPE_LABELS, TYPE_COLORS } from "@/lib/types";

interface BubbleMapProps {
  entries: Entry[];
  expandType?: EntryType | null;
}

interface HierarchyNode {
  name: string;
  type?: EntryType;
  slug?: string;
  significance?: number;
  children?: HierarchyNode[];
}

function buildHierarchy(entries: Entry[]): HierarchyNode {
  const types: EntryType[] = ["token", "character", "moment", "meme"];
  return {
    name: "root",
    children: types.map((type) => ({
      name: TYPE_LABELS[type],
      type,
      children: entries
        .filter((e) => e.type === type)
        .map((e) => ({
          name: e.name,
          type: e.type,
          slug: e.slug,
          significance: e.significance,
        })),
    })),
  };
}

function buildCategoryHierarchy(
  entries: Entry[],
  type: EntryType
): HierarchyNode {
  return {
    name: TYPE_LABELS[type],
    type,
    children: entries
      .filter((e) => e.type === type)
      .map((e) => ({
        name: e.name,
        type: e.type,
        slug: e.slug,
        significance: e.significance,
      })),
  };
}

const TYPE_PLURALS: Record<EntryType, string> = {
  token: "tokens",
  character: "characters",
  moment: "moments",
  meme: "memes",
};

type Mode = "overview" | "expanded";

function wrapIntoLines(name: string, charsPerLine: number): string[] {
  if (charsPerLine < 1) return [name];
  if (name.length <= charsPerLine) return [name];

  const lines: string[] = [];
  const words = name.split(/\s+/);
  let currentLine = "";

  for (const word of words) {
    if (word.length > charsPerLine) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let remaining = word;
      while (remaining.length > charsPerLine) {
        lines.push(remaining.slice(0, charsPerLine));
        remaining = remaining.slice(charsPerLine);
      }
      currentLine = remaining;
    } else {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (test.length > charsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function applyWrappedText(
  textEl: SVGTextElement,
  name: string,
  radius: number,
  maxFontSize: number,
  minFontSize: number = 7
) {
  const text = d3.select(textEl);
  const maxWidth = radius * 1.75;
  const maxHeight = radius * 1.75;

  let chosenLines: string[] = [name];
  let chosenFontSize = minFontSize;
  const startSize = Math.max(minFontSize, Math.floor(maxFontSize));

  for (let fs = startSize; fs >= minFontSize; fs -= 1) {
    const charWidth = fs * 0.6;
    const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));
    const lines = wrapIntoLines(name, charsPerLine);
    const totalHeight = lines.length * fs * 1.15;

    if (totalHeight <= maxHeight) {
      chosenLines = lines;
      chosenFontSize = fs;
      break;
    }

    if (fs === minFontSize) {
      chosenLines = lines;
      chosenFontSize = fs;
    }
  }

  text.text(null).style("font-size", `${chosenFontSize}px`);
  const lineHeight = chosenFontSize * 1.15;
  const startY = -((chosenLines.length - 1) * lineHeight) / 2;

  chosenLines.forEach((line, i) => {
    text
      .append("tspan")
      .attr("x", 0)
      .attr("dy", i === 0 ? startY : lineHeight)
      .text(line);
  });
}

function wrapForCanvas(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxWidth: number
): string[] {
  if (ctx.measureText(name).width <= maxWidth) return [name];

  const lines: string[] = [];
  const words = name.split(/\s+/);
  let currentLine = "";

  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      let remaining = word;
      while (ctx.measureText(remaining).width > maxWidth) {
        let cut = remaining.length;
        while (
          cut > 1 &&
          ctx.measureText(remaining.slice(0, cut)).width > maxWidth
        ) {
          cut--;
        }
        if (cut < 1) cut = 1;
        lines.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut);
      }
      currentLine = remaining;
    } else {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function fitTextForCanvas(
  ctx: CanvasRenderingContext2D,
  name: string,
  radius: number,
  maxFontSize: number,
  minFontSize: number
): { lines: string[]; fontSize: number } {
  const maxWidth = radius * 1.75;
  const maxHeight = radius * 1.75;
  const startSize = Math.max(minFontSize, Math.floor(maxFontSize));

  let chosenLines: string[] = [name];
  let chosenFontSize = minFontSize;

  for (let fs = startSize; fs >= minFontSize; fs -= 1) {
    ctx.font = `500 ${fs}px Inter, system-ui, sans-serif`;
    const lines = wrapForCanvas(ctx, name, maxWidth);
    const totalHeight = lines.length * fs * 1.15;

    if (totalHeight <= maxHeight) {
      chosenLines = lines;
      chosenFontSize = fs;
      break;
    }

    if (fs === minFontSize) {
      chosenLines = lines;
      chosenFontSize = fs;
    }
  }

  return { lines: chosenLines, fontSize: chosenFontSize };
}

function hexAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

const BAKE_RADIUS = 200;
const BAKE_PAD = 40;
const BAKE_EXTENT = BAKE_RADIUS + BAKE_PAD;

type BakedBubble = ImageBitmap | HTMLCanvasElement;

async function bakeBubbleBitmap(
  color: string,
  dpr: number
): Promise<BakedBubble> {
  const size = Math.round(BAKE_EXTENT * 2 * dpr);

  let canvas: OffscreenCanvas | HTMLCanvasElement;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(size, size);
  } else {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    canvas = c;
  }

  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) return canvas as HTMLCanvasElement;

  ctx.scale(dpr, dpr);
  ctx.translate(BAKE_EXTENT, BAKE_EXTENT);

  ctx.shadowBlur = 24;
  ctx.shadowColor = color;

  const grad = ctx.createRadialGradient(
    -BAKE_RADIUS * 0.3,
    -BAKE_RADIUS * 0.3,
    0,
    0,
    0,
    BAKE_RADIUS
  );
  grad.addColorStop(0, hexAlpha(color, 0.5));
  grad.addColorStop(1, hexAlpha(color, 0.1));
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.arc(0, 0, BAKE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = hexAlpha(color, 0.3);
  ctx.lineWidth = 2;
  ctx.stroke();

  if (canvas instanceof OffscreenCanvas) {
    try {
      return canvas.transferToImageBitmap();
    } catch {
      return canvas as unknown as HTMLCanvasElement;
    }
  }
  return canvas;
}

export default function BubbleMap({ entries, expandType }: BubbleMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const stateRef = useRef<{
    mode: Mode;
    expandedType: EntryType | null;
    transitioning: boolean;
  }>({ mode: "overview", expandedType: null, transitioning: false });

  useEffect(() => {
    if (!svgRef.current || !canvasRef.current) return;

    const svg = d3.select(svgRef.current);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = Math.min(width, height);
    const isMobile = width < 640;
    const dpr = window.devicePixelRatio || 1;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.display = "none";

    stateRef.current = {
      mode: "overview",
      expandedType: null,
      transitioning: false,
    };

    const defs = svg.append("defs");

    Object.entries(TYPE_COLORS).forEach(([type, color]) => {
      const grad = defs
        .append("radialGradient")
        .attr("id", `grad-${type}`)
        .attr("cx", "35%")
        .attr("cy", "35%")
        .attr("r", "65%");
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.35);
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.06);

      const childGrad = defs
        .append("radialGradient")
        .attr("id", `grad-child-${type}`)
        .attr("cx", "35%")
        .attr("cy", "35%")
        .attr("r", "65%");
      childGrad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.55);
      childGrad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.12);
    });

    const filter = defs
      .append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const overlay = svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "var(--bg-primary)")
      .style("opacity", 0)
      .style("pointer-events", "none");

    if (!document.getElementById("memepedia-spinner-style")) {
      const style = document.createElement("style");
      style.id = "memepedia-spinner-style";
      style.textContent =
        "@keyframes memepedia-spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    const spinnerFo = svg
      .append("foreignObject")
      .attr("x", width / 2 - 20)
      .attr("y", height / 2 - 20)
      .attr("width", 40)
      .attr("height", 40)
      .style("display", "none");

    spinnerFo
      .append("xhtml:div")
      .style("width", "32px")
      .style("height", "32px")
      .style("margin", "4px")
      .style("border", "2px solid rgba(255,255,255,0.15)")
      .style("border-top-color", "white")
      .style("border-radius", "50%")
      .style("animation", "memepedia-spin 0.6s linear infinite");

    function navigateTo(url: string) {
      spinnerFo.style("display", "block");
      router.push(url);
    }

    const overviewContainer = svg.append("g").attr("class", "overview");

    // --- OVERVIEW MODE (still SVG) ---

    const hierarchy = d3
      .hierarchy(buildHierarchy(entries))
      .sum((d) => (d.significance ? d.significance * 0.05 + 1 : 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3
      .pack<HierarchyNode>()
      .size([size, size])
      .padding((d) => (d.depth === 0 ? 30 : 15));

    const root = pack(hierarchy);
    const nodes = isMobile
      ? root.descendants().slice(1).filter((d) => d.depth === 1)
      : root.descendants().slice(1);

    const overviewNodes = overviewContainer
      .selectAll<SVGGElement, d3.HierarchyCircularNode<HierarchyNode>>("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    overviewNodes
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => {
        const type = d.data.type || (d.parent?.data.type as string);
        return d.depth === 1
          ? `url(#grad-${type})`
          : `url(#grad-child-${type})`;
      })
      .attr("stroke", (d) => {
        const type = d.data.type || (d.parent?.data.type as string);
        return TYPE_COLORS[type as EntryType] || "#fff";
      })
      .attr("stroke-opacity", (d) => (d.depth === 1 ? 0.2 : 0.25))
      .attr("stroke-width", (d) => (d.depth === 1 ? 1.5 : 1))
      .attr("filter", (d) => (d.depth === 1 ? "url(#glow)" : "none"))
      .style("opacity", (d) => (d.depth === 2 ? 0 : 1));

    overviewNodes.style(
      "pointer-events",
      (d) => (d.depth === 2 ? "none" : "all")
    );

    const overviewText = overviewNodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .style("font-weight", (d) => (d.depth === 1 ? "600" : "400"))
      .style("opacity", (d) => (d.depth === 1 ? 1 : 0))
      .style("font-size", (d) => {
        if (d.depth === 1) {
          return `${Math.max(12, Math.min(d.r * 0.25, 28))}px`;
        }
        return `${Math.max(8, Math.min(d.r * 0.35, 14))}px`;
      });

    overviewText.each(function (d) {
      const fontSize =
        d.depth === 1
          ? Math.max(12, Math.min(d.r * 0.25, 28))
          : Math.max(8, Math.min(d.r * 0.35, 14));
      applyWrappedText(this as SVGTextElement, d.data.name, d.r, fontSize);
    });

    const initialScale = (size * 0.9) / (root.r * 2);
    const initialX = width / 2 - root.x * initialScale;
    const initialY = height / 2 - root.y * initialScale;
    const initialTransform = d3.zoomIdentity
      .translate(initialX, initialY)
      .scale(initialScale);

    const EXPAND_THRESHOLD = 3.5;

    function updateOverviewVisibility(transform: d3.ZoomTransform) {
      const zoomRatio = transform.k / initialScale;

      overviewNodes.each(function (d) {
        const g = d3.select(this);

        if (d.depth === 2) {
          const circleOpacity = Math.min(
            1,
            Math.max(0, (zoomRatio - 2) / 1.5)
          );
          g.select("circle").style("opacity", circleOpacity);
          g.select("text").style("opacity", zoomRatio > 4 ? 1 : 0);
          g.style("pointer-events", circleOpacity > 0.3 ? "all" : "none");
        }

        if (d.depth === 1) {
          const labelOpacity = Math.min(
            1,
            Math.max(0, 1 - (zoomRatio - 2.5) / 1.5)
          );
          g.select("text").style("opacity", labelOpacity);
        }
      });
    }

    // --- EXPANDED MODE (canvas) ---

    const bubbleBitmaps = new Map<EntryType, BakedBubble>();

    let expandedChildNodes: d3.HierarchyCircularNode<HierarchyNode>[] = [];
    let expandedType: EntryType | null = null;
    let expandedTransform = d3.zoomIdentity;
    let expandedInitialTransform = d3.zoomIdentity;
    const animState = { start: 0, duration: 600 };

    const fontFloor = isMobile ? 7 : 10;
    const fontScale = isMobile ? 0.24 : 0.28;
    const fontCap = isMobile ? 14 : 18;

    function drawCanvas(progress = 1) {
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (!expandedType || expandedChildNodes.length === 0) {
        ctx.restore();
        return;
      }

      const bitmap = bubbleBitmaps.get(expandedType);

      ctx.translate(expandedTransform.x, expandedTransform.y);
      ctx.scale(expandedTransform.k, expandedTransform.k);

      if (bitmap) {
        for (let i = 0; i < expandedChildNodes.length; i++) {
          const node = expandedChildNodes[i];
          const delay = i * 0.035;
          let p = (progress - delay) / (1 - delay);
          p = Math.max(0, Math.min(1, p));
          const eased = p < 1 ? 1 - Math.pow(1 - p, 3) : 1;
          const r = node.r * eased;
          if (r <= 0.1) continue;
          const scale = r / BAKE_RADIUS;
          const halfSize = BAKE_EXTENT * scale;
          ctx.drawImage(
            bitmap as CanvasImageSource,
            node.x - halfSize,
            node.y - halfSize,
            halfSize * 2,
            halfSize * 2
          );
        }
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < expandedChildNodes.length; i++) {
        const node = expandedChildNodes[i];
        const delay = i * 0.035 + 0.2;
        let p = (progress - delay) / (1 - delay);
        p = Math.max(0, Math.min(1, p));
        if (p <= 0) continue;
        ctx.globalAlpha = p;

        const desiredSize = Math.max(
          fontFloor,
          Math.min(node.r * fontScale, fontCap)
        );
        const { lines, fontSize } = fitTextForCanvas(
          ctx,
          node.data.name,
          node.r,
          desiredSize,
          fontFloor
        );
        ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`;
        const lineHeight = fontSize * 1.15;
        const startY = -((lines.length - 1) * lineHeight) / 2;
        for (let j = 0; j < lines.length; j++) {
          ctx.fillText(lines[j], node.x, node.y + startY + j * lineHeight);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function animateEntry() {
      animState.start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - animState.start;
        const progress = Math.min(1, elapsed / animState.duration);
        drawCanvas(progress);
        if (progress < 1 && stateRef.current.mode === "expanded") {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }

    async function renderExpanded(type: EntryType) {
      expandedType = type;

      const catHierarchy = d3
        .hierarchy(buildCategoryHierarchy(entries, type))
        .sum((d) => (d.significance ? d.significance * 0.05 + 1 : 1))
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const childCount = catHierarchy.children?.length || 1;
      const canvasSize = Math.max(900, Math.sqrt(childCount) * 320);

      const expandPack = d3
        .pack<HierarchyNode>()
        .size([canvasSize, canvasSize])
        .padding(25);

      const catRoot = expandPack(catHierarchy);
      expandedChildNodes = catRoot.children || [];

      const viewportSize = Math.min(width, height);
      const initialFit = (viewportSize * 0.85) / (catRoot.r * 2);
      const initialTX = width / 2 - catRoot.x * initialFit;
      const initialTY = height / 2 - catRoot.y * initialFit;
      expandedInitialTransform = d3.zoomIdentity
        .translate(initialTX, initialTY)
        .scale(initialFit);
      expandedTransform = expandedInitialTransform;

      expandedZoom.scaleExtent([
        initialFit * 0.4,
        initialFit * (isMobile ? 7 : 4),
      ]);

      const color = TYPE_COLORS[type];

      const label = document.getElementById("category-label");
      if (label) {
        label.textContent = TYPE_LABELS[type];
        label.style.color = color;
        label.style.opacity = "1";
      }

      if (!bubbleBitmaps.has(type)) {
        const bitmap = await bakeBubbleBitmap(color, dpr);
        bubbleBitmaps.set(type, bitmap);
      }

      canvas.style.display = "block";
      animateEntry();
    }

    function findBubbleAtPoint(
      clientX: number,
      clientY: number
    ): d3.HierarchyCircularNode<HierarchyNode> | null {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const px = (x - expandedTransform.x) / expandedTransform.k;
      const py = (y - expandedTransform.y) / expandedTransform.k;

      for (const node of expandedChildNodes) {
        const dx = px - node.x;
        const dy = py - node.y;
        if (dx * dx + dy * dy <= node.r * node.r) return node;
      }
      return null;
    }

    function findClosestCategory(
      transform: d3.ZoomTransform
    ): d3.HierarchyCircularNode<HierarchyNode> | null {
      const k = transform.k;
      const viewCx = (width / 2 - transform.x) / k;
      const viewCy = (height / 2 - transform.y) / k;
      const categories = root.children || [];

      let closest: d3.HierarchyCircularNode<HierarchyNode> | null = null;
      let minDist = Infinity;

      for (const cat of categories) {
        const dx = cat.x - viewCx;
        const dy = cat.y - viewCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closest = cat;
        }
      }

      return closest;
    }

    function transitionToExpanded(type: EntryType) {
      if (stateRef.current.transitioning) return;
      stateRef.current.transitioning = true;

      const color = TYPE_COLORS[type];
      overlay.attr("fill", color);

      overlay
        .transition()
        .duration(350)
        .ease(d3.easeCubicIn)
        .style("opacity", 0.6)
        .on("end", async () => {
          stateRef.current.mode = "expanded";
          stateRef.current.expandedType = type;

          overviewContainer
            .style("opacity", 0)
            .style("pointer-events", "none");
          svg.on(".zoom", null);

          await renderExpanded(type);

          overlay
            .transition()
            .duration(400)
            .ease(d3.easeCubicOut)
            .style("opacity", 0)
            .on("end", () => {
              stateRef.current.transitioning = false;
              d3.select(canvas).call(expandedZoom);
              d3.select(canvas).call(
                expandedZoom.transform,
                expandedInitialTransform
              );
            });
        });
    }

    function transitionToOverview() {
      if (stateRef.current.transitioning) return;
      stateRef.current.transitioning = true;

      const type = stateRef.current.expandedType;
      const color = type ? TYPE_COLORS[type] : "#0a0a12";
      overlay.attr("fill", color);

      overlay
        .transition()
        .duration(350)
        .ease(d3.easeCubicIn)
        .style("opacity", 0.6)
        .on("end", () => {
          stateRef.current.mode = "overview";
          stateRef.current.expandedType = null;
          expandedType = null;
          expandedChildNodes = [];

          const label = document.getElementById("category-label");
          if (label) {
            label.style.opacity = "0";
          }

          d3.select(canvas).on(".zoom", null);
          canvas.style.display = "none";
          if (ctx) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }

          overviewContainer
            .style("opacity", 1)
            .style("pointer-events", "all");

          svg.on(".zoom", null);
          svg.call(overviewZoom);
          svg.call(overviewZoom.transform, initialTransform);
          updateOverviewVisibility(initialTransform);

          overlay
            .transition()
            .duration(400)
            .ease(d3.easeCubicOut)
            .style("opacity", 0)
            .on("end", () => {
              stateRef.current.transitioning = false;
            });
        });
    }

    const overviewZoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([initialScale * 0.8, initialScale * 25])
      .on("zoom", (event) => {
        if (stateRef.current.transitioning) return;
        overviewContainer.attr("transform", event.transform.toString());
        updateOverviewVisibility(event.transform);

        const zoomRatio = event.transform.k / initialScale;

        if (
          event.sourceEvent &&
          stateRef.current.mode === "overview" &&
          zoomRatio > EXPAND_THRESHOLD
        ) {
          const target = findClosestCategory(event.transform);
          if (target && target.data.type) {
            transitionToExpanded(target.data.type);
          }
        }
      });

    const expandedZoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .on("zoom", (event) => {
        if (stateRef.current.transitioning) return;

        const initialK = expandedInitialTransform.k;
        if (event.sourceEvent && event.transform.k < initialK * 0.7) {
          transitionToOverview();
          return;
        }

        expandedTransform = event.transform;
        drawCanvas(1);
      });

    overviewNodes.style("cursor", "pointer").on("click", (event, d) => {
      event.stopPropagation();
      if (stateRef.current.transitioning) return;

      if (d.depth === 1 && d.data.type) {
        transitionToExpanded(d.data.type);
      } else if (d.depth === 2 && d.data.slug && d.data.type) {
        navigateTo(`/${TYPE_PLURALS[d.data.type]}/${d.data.slug}`);
      }
    });

    overviewNodes
      .select("circle")
      .on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 2);
      })
      .on("mouseout", function (_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", d.depth === 1 ? 0.2 : 0.25)
          .attr("stroke-width", d.depth === 1 ? 1.5 : 1);
      });

    svg.on("click", () => {
      if (stateRef.current.transitioning) return;
      if (stateRef.current.mode === "overview") {
        svg
          .transition()
          .duration(750)
          .ease(d3.easeCubicInOut)
          .call(overviewZoom.transform, initialTransform);
      }
    });

    canvas.addEventListener("click", (event) => {
      if (stateRef.current.transitioning) return;
      if (stateRef.current.mode !== "expanded") return;
      const hit = findBubbleAtPoint(event.clientX, event.clientY);
      if (hit && hit.data.slug && hit.data.type) {
        navigateTo(`/${TYPE_PLURALS[hit.data.type]}/${hit.data.slug}`);
      }
    });

    canvas.style.cursor = "grab";
    canvas.addEventListener("mousemove", (event) => {
      if (stateRef.current.mode !== "expanded") return;
      const hit = findBubbleAtPoint(event.clientX, event.clientY);
      canvas.style.cursor = hit ? "pointer" : "grab";
    });

    svg.call(overviewZoom);
    svg.call(overviewZoom.transform, initialTransform);

    if (expandType) {
      requestAnimationFrame(() => transitionToExpanded(expandType));
    }

    return () => {
      svg.on(".zoom", null);
      d3.select(canvas).on(".zoom", null);
      bubbleBitmaps.forEach((bmp) => {
        if (bmp instanceof ImageBitmap) bmp.close();
      });
      bubbleBitmaps.clear();
    };
  }, [entries, router, expandType]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        style={{ background: "transparent" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
