// Módulo para renderizar um grafo de roadmap usando SVG nativo do browser.
// Este arquivo não depende de bibliotecas externas e funciona em dispositivos modestos.

const DEFAULT_CONFIG = {
  marginX: 40,
  marginY: 40,
  mainColumnWidth: 220,
  forkColumnWidth: 220,
  rowHeight: 140,
  nodeWidth: 200,
  nodeHeight: 80,
  textPadding: 12,
  forkLineColor: '#1976d2',
  mainLineColor: '#444',
  colorsByNivel: {
    iniciante: '#4CAF50',
    intermediario: '#FFC107',
    avancado: '#F44336'
  }
};

/**
 * Representa o gráfico de roadmap em SVG.
 */
export default class RoadmapGraph {
  /**
   * @param {HTMLElement} container Elemento DOM que recebe o gráfico.
   * @param {Array<Object>} nodes Array de nós do roadmap.
   */
  constructor(container, nodes) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('Container inválido para RoadmapGraph.');
    }
    if (!Array.isArray(nodes)) {
      throw new Error('Nodes deve ser um array.');
    }

    this.container = container;
    this.nodes = nodes;
    this.config = { ...DEFAULT_CONFIG };
    this.nodeMap = new Map();
    this.svg = null;
    this.resizeTimeout = null;

    this.buildNodeMap();
    this.createSvg();
    this.render();
    this.bindResize();
  }

  /**
   * Cria mapa de nós para lookup rápido por id.
   */
  buildNodeMap() {
    this.nodeMap.clear();
    this.nodes.forEach((node) => {
      this.nodeMap.set(node.id, { ...node });
    });
  }

  /**
   * Cria o elemento SVG e define atributos básicos.
   */
  createSvg() {
    this.container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Roadmap de aprendizado');
    svg.style.display = 'block';
    this.svg = svg;
    this.container.appendChild(svg);
  }

  /**
   * Renderiza o gráfico inteiro.
   */
  render() {
    if (!this.svg) return;
    this.clearSvg();

    const { width, height } = this.getContainerSize();
    const layout = this.calculateLayout(width, height);
    this.drawConnections(layout);
    this.drawNodes(layout);
  }

  /**
   * Limpa o SVG atual.
   */
  clearSvg() {
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild);
    }
  }

  /**
   * Lê as dimensões do container.
   * @returns {{width:number, height:number}}
   */
  getContainerSize() {
    const box = this.container.getBoundingClientRect();
    return {
      width: Math.max(320, box.width),
      height: Math.max(320, box.height)
    };
  }

  /**
   * Calcula a posição de cada nó e a lista de conexões.
   * @param {number} width
   * @param {number} height
   * @returns {{nodes:Array, connections:Array}}
   */
  calculateLayout(width, height) {
    const root = this.findRootNode();
    const mainChain = this.buildMainChain(root);
    const forkNodes = this.nodes.filter((node) => node.fork === true);
    const positions = new Map();

    mainChain.forEach((node, index) => {
      positions.set(node.id, {
        x: this.config.marginX,
        y: this.config.marginY + index * this.config.rowHeight
      });
    });

    const forkGroups = this.groupForksByParent(forkNodes);
    forkGroups.forEach((forkItems, parentId) => {
      const parentPos = positions.get(parentId);
      if (!parentPos) return;
      forkItems.forEach((node, forkIndex) => {
        positions.set(node.id, {
          x: parentPos.x + this.config.forkColumnWidth,
          y: parentPos.y + forkIndex * (this.config.nodeHeight + 12)
        });
      });
    });

    const connections = this.nodes.reduce((acc, node) => {
      return acc.concat(
        (node.proximos || []).map((nextId) => ({
          from: node.id,
          to: nextId,
          isFork: node.fork === true || (this.nodeMap.get(nextId)?.fork === true)
        }))
      );
    }, []);

    return { positions, connections };
  }

  /**
   * Identifica o nó raiz do roadmap (sem anteriores) ou primeiro nó do array.
   * @returns {Object}
   */
  findRootNode() {
    const root = this.nodes.find((node) => !Array.isArray(node.anteriores) || node.anteriores.length === 0);
    return root || this.nodes[0];
  }

  /**
   * Constrói a linha principal do roadmap seguindo a primeira próxima etapa não-fork.
   * @param {Object} root
   * @returns {Array<Object>}
   */
  buildMainChain(root) {
    const chain = [];
    const visited = new Set();
    let current = root;

    while (current && !visited.has(current.id)) {
      chain.push(current);
      visited.add(current.id);
      const nextId = (current.proximos || []).find((id) => {
        const nextNode = this.nodeMap.get(id);
        return nextNode && nextNode.fork !== true;
      });
      current = nextId ? this.nodeMap.get(nextId) : null;
    }

    return chain;
  }

  /**
   * Agrupa forks pelo nó pai de onde se originam.
   * @param {Array<Object>} forkNodes
   * @returns {Map<string, Array<Object>>}
   */
  groupForksByParent(forkNodes) {
    const groups = new Map();
    forkNodes.forEach((node) => {
      const parentId = Array.isArray(node.anteriores) && node.anteriores.length ? node.anteriores[0] : null;
      const key = parentId || 'unknown';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(node);
    });
    return groups;
  }

  /**
   * Desenha todas as conexões entre nós.
   * @param {{positions:Map, connections:Array}} layout
   */
  drawConnections(layout) {
    const pathLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pathLayer.setAttribute('aria-hidden', 'true');

    layout.connections.forEach((connection) => {
      const fromPos = layout.positions.get(connection.from);
      const toPos = layout.positions.get(connection.to);
      if (!fromPos || !toPos) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const startX = fromPos.x + this.config.nodeWidth;
      const startY = fromPos.y + this.config.nodeHeight / 2;
      const endX = toPos.x;
      const endY = toPos.y + this.config.nodeHeight / 2;
      const midX = startX + (endX - startX) * 0.5;

      path.setAttribute('d', `M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', connection.isFork ? this.config.forkLineColor : this.config.mainLineColor);
      path.setAttribute('stroke-width', '2');
      if (connection.isFork) {
        path.setAttribute('stroke-dasharray', '6 4');
      }
      pathLayer.appendChild(path);
    });

    this.svg.appendChild(pathLayer);
  }

  /**
   * Desenha os nós do roadmap como retângulos com texto.
   * @param {{positions:Map, connections:Array}} layout
   */
  drawNodes(layout) {
    this.nodes.forEach((node) => {
      const pos = layout.positions.get(node.id);
      if (!pos) return;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${node.titulo} - nível ${node.nivel} - status ${node.status}`);
      group.style.cursor = 'pointer';
      group.dataset.nodeId = node.id;
      group.addEventListener('click', () => this.emitNodeSelected(node.id));
      group.addEventListener('keydown', (event) => this.handleKeyboard(event, node.id));

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(pos.x));
      rect.setAttribute('y', String(pos.y));
      rect.setAttribute('width', String(this.config.nodeWidth));
      rect.setAttribute('height', String(this.config.nodeHeight));
      rect.setAttribute('rx', '12');
      rect.setAttribute('fill', this.config.colorsByNivel[node.nivel] || '#9E9E9E');
      rect.setAttribute('stroke', '#333');
      rect.setAttribute('stroke-width', '2');

      if (node.status === 'em-revisao') {
        rect.setAttribute('stroke-dasharray', '6 4');
        rect.setAttribute('stroke', '#FF9800');
      }
      if (node.status === 'deprecado') {
        rect.setAttribute('opacity', '0.55');
      }

      const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      titleText.setAttribute('x', String(pos.x + this.config.textPadding));
      titleText.setAttribute('y', String(pos.y + this.config.textPadding + 14));
      titleText.setAttribute('fill', '#111');
      titleText.setAttribute('font-size', '14');
      titleText.setAttribute('font-family', 'Arial, sans-serif');
      titleText.textContent = node.titulo;

      if (node.status === 'deprecado') {
        const warning = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        warning.setAttribute('x', String(pos.x + this.config.nodeWidth - this.config.textPadding));
        warning.setAttribute('y', String(pos.y + this.config.textPadding + 14));
        warning.setAttribute('fill', '#d84315');
        warning.setAttribute('font-size', '16');
        warning.setAttribute('text-anchor', 'end');
        warning.textContent = '⚠';
        group.appendChild(warning);
      }

      group.appendChild(rect);
      group.appendChild(titleText);
      this.svg.appendChild(group);
    });
  }

  /**
   * Dispara evento customizado quando um nó é selecionado.
   * @param {string} nodeId
   */
  emitNodeSelected(nodeId) {
    const event = new CustomEvent('no-selecionado', {
      detail: { id: nodeId },
      bubbles: true,
      composed: true
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Manipula teclado para seleção via Enter ou Space.
   * @param {KeyboardEvent} event
   * @param {string} nodeId
   */
  handleKeyboard(event, nodeId) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.emitNodeSelected(nodeId);
    }
  }

  /**
   * Vincula o redimensionamento da janela para refazer o layout.
   */
  bindResize() {
    const onResize = () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = window.setTimeout(() => this.render(), 200);
    };
    window.addEventListener('resize', onResize);
    this.resizeHandler = onResize;
  }

  /**
   * Remove listeners e limpa o SVG.
   */
  destroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.svg) {
      this.container.removeChild(this.svg);
      this.svg = null;
    }
  }
}
