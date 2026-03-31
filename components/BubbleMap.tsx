"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const focusRef = useRef<d3.HierarchyCircularNode<HierarchyNode> | null>(null);

  const zoomTo = useCallback(
    (
      v: [number, number, number],
      focusNode: d3.HierarchyCircularNode<HierarchyNode> | null,
      svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
      width: number,
      height: number
    ) => {
      const k = Math.min(width, height) / v[2];

      svg
        .selectAll<SVGCircleElement, d3.HierarchyCircularNode<HierarchyNode>>(
          "circle"
        )
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr("cx", (d) => (d.x - v[0]) * k + width / 2)
        .attr("cy", (d) => (d.y - v[1]) * k + height / 2)
        .attr("r", (d) => d.r * k);

      svg
        .selectAll<SVGTextElement, d3.HierarchyCircularNode<HierarchyNode>>(
          "text"
        )
        .transition()
        .duration(750)
        .ease(d3.easeCubicInOut)
        .attr("x", (d) => (d.x - v[0]) * k + width / 2)
        .attr("y", (d) => (d.y - v[1]) * k + height / 2)
        .style("opacity", function (d) {
          if (d.depth === 0) return 0;
          if (d.depth === 1) {
            return d === focusNode
              ? 0
              : d.parent === focusNode || !focusNode
                ? 1
                : 0;
          }
          return d.parent === focusNode ? 1 : 0;
        })
        .style("font-size", function (d) {
          if (d.depth === 1) {
            const size = d.r * k * 0.25;
            return `${Math.max(12, Math.min(size, 28))}px`;
          }
          const size = d.r * k * 0.3;
          return `${Math.max(10, Math.min(size, 16))}px`;
        });
    },
    []
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = window.innerWidth;
    const height = window.innerHeight;

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
        .attr("stop-opacity", 0.4);
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.08);

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
        .attr("stop-opacity", 0.6);
      childGrad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.15);
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
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const hierarchy = d3
      .hierarchy(buildHierarchy(entries))
      .sum((d) => d.significance || 1)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const pack = d3
      .pack<HierarchyNode>()
      .size([width * 0.85, height * 0.85])
      .padding(20);

    const root = pack(hierarchy);
    root.x = width / 2;
    root.y = height / 2;

    root.children?.forEach((child) => {
      child.x += (width - width * 0.85) / 2;
      child.y += (height - height * 0.85) / 2;
      child.descendants().forEach((d) => {
        if (d !== child) {
          d.x += (width - width * 0.85) / 2;
          d.y += (height - height * 0.85) / 2;
        }
      });
    });

    focusRef.current = null;

    const nodes = root.descendants().slice(1);

    const svgTyped = svg as d3.Selection<
      SVGSVGElement,
      unknown,
      null,
      undefined
    >;

    const node = svg
      .selectAll<SVGGElement, d3.HierarchyCircularNode<HierarchyNode>>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer");

    node
      .append("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
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
      .attr("stroke-opacity", (d) => (d.depth === 1 ? 0.2 : 0.3))
      .attr("stroke-width", (d) => (d.depth === 1 ? 1.5 : 1))
      .attr("filter", "url(#glow)")
      .style("opacity", (d) => (d.depth === 2 ? 0.8 : 1))
      .on("mouseover", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 2);
      })
      .on("mouseout", function (_, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", d.depth === 1 ? 0.2 : 0.3)
          .attr("stroke-width", d.depth === 1 ? 1.5 : 1);
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.depth === 1) {
          if (focusRef.current === d) {
            focusRef.current = null;
            zoomTo(
              [root.x, root.y, root.r * 2.4],
              null,
              svgTyped,
              width,
              height
            );
          } else {
            focusRef.current = d;
            zoomTo([d.x, d.y, d.r * 2.2], d, svgTyped, width, height);
          }
        } else if (d.depth === 2 && d.data.slug) {
          const type = d.data.type;
          if (type) {
            router.push(`/${TYPE_PLURALS[type]}/${d.data.slug}`);
          }
        }
      });

    node
      .append("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
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
        return `${Math.max(10, Math.min(d.r * 0.3, 16))}px`;
      })
      .text((d) => d.data.name);

    svg.on("click", () => {
      focusRef.current = null;
      zoomTo([root.x, root.y, root.r * 2.4], null, svgTyped, width, height);
    });

    zoomTo([root.x, root.y, root.r * 2.4], null, svgTyped, width, height);
  }, [entries, router, zoomTo]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
