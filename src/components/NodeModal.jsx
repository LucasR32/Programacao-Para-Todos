import { useEffect, useRef } from 'react';
import NodeModalLib from '../lib/node-modal.js';

export default function NodeModal({ nodes }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !Array.isArray(nodes)) {
      return undefined;
    }

    const modal = new NodeModalLib(containerRef.current, nodes);

    return () => {
      modal.destroy();
    };
  }, [nodes]);

  return <div ref={containerRef} />;
}
