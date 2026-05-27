import { useEffect, useRef } from "react";

const TableauEmbed = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Load the official modern Tableau Embedding API v3 script dynamically
    const script = document.createElement("script");
    script.src =
      "https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js";
    script.type = "module";
    document.head.appendChild(script);

    script.onload = () => {
      if (containerRef.current) {
        // Clear any old instances to prevent duplicate rendering on hot-reloads
        containerRef.current.innerHTML = "";

        // 2. Create the web component instance programmatically
        // @ts-ignore (Tableau embeds expose a custom element globally once loaded)
        const viz = document.createElement("tableau-viz");

        // Your specific dashboard identification parameters
        viz.setAttribute(
          "src",
          "https://public.tableau.com/views/LatePredictorEDA/Dashboard1",
        );
        viz.setAttribute("toolbar", "bottom");
        viz.setAttribute("hide-tabs", "true");

        // 3. Set the custom layout sizes
        viz.style.width = "100%";
        // Maintain standard responsive aspect ratio or standard desktop container layout
        viz.style.height = "600px";

        containerRef.current.appendChild(viz);
      }
    };

    return () => {
      // Cleanup script tag on component unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px", // Keeps it clean and centered on wider displays
        margin: "0 auto",
        padding: "16px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", // Subtle modern border depth
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          minHeight: "900px",
          overflow: "hidden",
          borderRadius: "8px",
        }}
      />
    </div>
  );
};

export default TableauEmbed;
