import { useEffect, useRef } from 'react';
import RoadmapGraphLib from '../lib/roadmap-graph.js';

export default function RoadmapGraph({ nodes }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !Array.isArray(nodes)) {
      return undefined;
    }

    const graph = new RoadmapGraphLib(containerRef.current, nodes);

    return () => {
      graph.destroy();
    };
  }, [nodes]);

  return <div ref={containerRef} className="roadmap-container" aria-live="polite" />;
}
