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

export default function BubbleMap({ entries, expandType }: BubbleMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const stateRef = useRef<{
    mode: Mode;
    expandedType: EntryType | null;
    transitioning: boolean;
  }>({ mode: "overview", expandedType: null, transitioning: false });

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = Math.min(width, height);
    const isMobile = width < 640;

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
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

      const expandGrad = defs
        .append("radialGradient")
        .attr("id", `grad-expand-${type}`)
        .attr("cx", "35%")
        .attr("cy", "35%")
        .attr("r", "65%");
      expandGrad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.5);
      expandGrad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.1);
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
    const expandedContainer = svg
      .append("g")
      .attr("class", "expanded")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // --- OVERVIEW MODE ---

    const hierarchy = d3
      .hierarchy(buildHierarchy(entries))
      .sum((d) => (d.significance ? d.significance * 0.05 + 1 : 1))
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3
      .pack<HierarchyNode>()
      .size([size, size])
      .padding((d) => (d.depth === 0 ? 30 : 15));

    const root = pack(hierarchy);
    const nodes = root.descendants().slice(1);

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
      const fontSize = d.depth === 1
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

    // --- EXPANDED MODE ---

    let expandedInitialTransform = d3.zoomIdentity;

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

    function renderExpanded(type: EntryType) {
      expandedContainer.selectAll("*").remove();

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
      const childNodes = catRoot.children || [];

      const viewportSize = Math.min(width, height);
      const initialFit = (viewportSize * 0.85) / (catRoot.r * 2);
      const initialX = width / 2 - catRoot.x * initialFit;
      const initialY = height / 2 - catRoot.y * initialFit;
      expandedInitialTransform = d3.zoomIdentity
        .translate(initialX, initialY)
        .scale(initialFit);

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

      const bubbles = expandedContainer
        .selectAll<SVGGElement, d3.HierarchyCircularNode<HierarchyNode>>(
          "g.entry"
        )
        .data(childNodes)
        .join("g")
        .attr("class", "entry")
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .style("cursor", "pointer");

      bubbles
        .append("circle")
        .attr("r", 0)
        .attr("fill", `url(#grad-expand-${type})`)
        .attr("stroke", color)
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 1.5)
        .attr("filter", "url(#glow)")
        .transition()
        .duration(600)
        .delay((_, i) => i * 60)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr("r", (d) => d.r);

      const fontFloor = isMobile ? 7 : 10;
      const fontScale = isMobile ? 0.24 : 0.28;
      const fontCap = isMobile ? 14 : 18;

      bubbles
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "white")
        .attr("pointer-events", "none")
        .style("font-weight", "500")
        .style("opacity", 0)
        .style("font-size", (d) =>
          `${Math.max(fontFloor, Math.min(d.r * fontScale, fontCap))}px`
        );

      bubbles.each(function (d) {
        const fontSize = Math.max(fontFloor, Math.min(d.r * fontScale, fontCap));
        const textEl = (this as SVGGElement).querySelector("text");
        if (textEl) applyWrappedText(textEl, d.data.name, d.r, fontSize, fontFloor);
      });

      bubbles
        .select("text")
        .transition()
        .duration(400)
        .delay((_, i) => 200 + i * 60)
        .style("opacity", 1);

      bubbles
        .on("mouseover", function () {
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", 2.5);
        })
        .on("mouseout", function () {
          d3.select(this)
            .select("circle")
            .transition()
            .duration(200)
            .attr("stroke-opacity", 0.3)
            .attr("stroke-width", 1.5);
        })
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.data.slug && d.data.type) {
            navigateTo(`/${TYPE_PLURALS[d.data.type]}/${d.data.slug}`);
          }
        });
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
        .on("end", () => {
          stateRef.current.mode = "expanded";
          stateRef.current.expandedType = type;

          overviewContainer.style("opacity", 0).style("pointer-events", "none");
          svg.on(".zoom", null);

          renderExpanded(type);

          expandedContainer
            .style("pointer-events", "all")
            .style("opacity", 1);

          overlay
            .transition()
            .duration(400)
            .ease(d3.easeCubicOut)
            .style("opacity", 0)
            .on("end", () => {
              stateRef.current.transitioning = false;
              svg.call(expandedZoom);
              svg.call(expandedZoom.transform, expandedInitialTransform);
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

          const label = document.getElementById("category-label");
          if (label) {
            label.style.opacity = "0";
          }

          expandedContainer
            .style("opacity", 0)
            .style("pointer-events", "none");
          expandedContainer.selectAll("*").remove();

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

    // --- ZOOM BEHAVIORS ---

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
      .zoom<SVGSVGElement, unknown>()
      .on("zoom", (event) => {
        if (stateRef.current.transitioning) return;

        const initialK = expandedInitialTransform.k;
        if (event.sourceEvent && event.transform.k < initialK * 0.7) {
          transitionToOverview();
          return;
        }

        expandedContainer.attr("transform", event.transform.toString());
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

    svg.call(overviewZoom);
    svg.call(overviewZoom.transform, initialTransform);

    if (expandType) {
      requestAnimationFrame(() => transitionToExpanded(expandType));
    }

    return () => {
      svg.on(".zoom", null);
    };
  }, [entries, router, expandType]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
