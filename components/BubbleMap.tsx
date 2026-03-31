"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { Entry, EntryType, TYPE_LABELS, TYPE_COLORS } from "@/lib/types";

interface BubbleMapProps {
  entries: Entry[];
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

const TYPE_PLURALS: Record<EntryType, string> = {
  token: "tokens",
  character: "characters",
  moment: "moments",
  meme: "memes",
};

export default function BubbleMap({ entries }: BubbleMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const size = Math.min(width, height);

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

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

    const hierarchy = d3
      .hierarchy(buildHierarchy(entries))
      .sum((d) => d.significance || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3
      .pack<HierarchyNode>()
      .size([size, size])
      .padding((d) => (d.depth === 0 ? 30 : 15));

    const root = pack(hierarchy);

    const container = svg.append("g");

    const nodes = root.descendants().slice(1);

    const nodeGroups = container
      .selectAll<SVGGElement, d3.HierarchyCircularNode<HierarchyNode>>("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    nodeGroups
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

    nodeGroups
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
      })
      .text((d) => d.data.name);

    function updateVisibility(transform: d3.ZoomTransform) {
      const k = transform.k;

      nodeGroups.each(function (d) {
        const g = d3.select(this);
        const apparentR = d.r * k;

        if (d.depth === 2) {
          const circleOpacity = Math.min(
            1,
            Math.max(0, (apparentR - 12) / 18)
          );
          g.select("circle").style("opacity", circleOpacity);

          const textOpacity = apparentR > 30 ? 1 : 0;
          g.select("text").style("opacity", textOpacity);
        }

        if (d.depth === 1) {
          const labelOpacity = Math.min(
            1,
            Math.max(0, 1 - (apparentR - 180) / 150)
          );
          g.select("text").style("opacity", labelOpacity);
        }
      });
    }

    const initialScale = size * 0.9 / (root.r * 2);
    const initialX = width / 2 - root.x * initialScale;
    const initialY = height / 2 - root.y * initialScale;
    const initialTransform = d3.zoomIdentity
      .translate(initialX, initialY)
      .scale(initialScale);

    function zoomToNode(node: d3.HierarchyCircularNode<HierarchyNode>) {
      const targetScale = (size * 0.85) / (node.r * 2);
      const tx = width / 2 - node.x * targetScale;
      const ty = height / 2 - node.y * targetScale;
      const target = d3.zoomIdentity.translate(tx, ty).scale(targetScale);

      svg
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, target);
    }

    function resetZoom() {
      svg
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .call(zoom.transform, initialTransform);
    }

    let focusedNode: d3.HierarchyCircularNode<HierarchyNode> | null = null;

    nodeGroups.style("cursor", "pointer").on("click", (event, d) => {
      event.stopPropagation();
      if (d.depth === 1) {
        if (focusedNode === d) {
          focusedNode = null;
          resetZoom();
        } else {
          focusedNode = d;
          zoomToNode(d);
        }
      } else if (d.depth === 2 && d.data.slug && d.data.type) {
        router.push(`/${TYPE_PLURALS[d.data.type]}/${d.data.slug}`);
      }
    });

    nodeGroups
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

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([initialScale * 0.8, initialScale * 25])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString());
        updateVisibility(event.transform);
        if (event.sourceEvent) {
          focusedNode = null;
        }
      });

    svg.call(zoom);
    svg.on("click", () => {
      focusedNode = null;
      resetZoom();
    });
    svg.call(zoom.transform, initialTransform);

    return () => {
      svg.on(".zoom", null);
    };
  }, [entries, router]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
