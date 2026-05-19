// Componente de modal para exibir detalhes de um nó do roadmap.
// Sem dependências externas, gera todo o HTML via JavaScript.

const LEVEL_BADGES = {
  iniciante: { label: 'Iniciante', color: '#4CAF50' },
  intermediario: { label: 'Intermediário', color: '#FFC107' },
  avancado: { label: 'Avançado', color: '#F44336' }
};

const TYPE_BADGES = {
  video: 'Vídeo',
  artigo: 'Artigo',
  documentacao: 'Documentação',
  curso: 'Curso'
};

const ESC_KEY = 'Escape';

export default class NodeModal {
  /**
   * @param {HTMLElement} root Container onde o modal será anexado.
   * @param {Map<string, Object>|Array<Object>} data Fonte de dados do node.
   */
  constructor(root, data) {
    if (!(root instanceof HTMLElement)) {
      throw new Error('Root inválido para NodeModal.');
    }
    this.root = root;
    this.dataMap = this.normalizeData(data);
    this.activeTrigger = null;
    this.modal = null;
    this.backdrop = null;
    this.focusableElements = [];
    this.firstFocusable = null;
    this.lastFocusable = null;
    this.onNodeSelected = this.onNodeSelected.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBackdropClick = this.onBackdropClick.bind(this);

    this.init();
  }

  /**
   * Normaliza a fonte de dados em um Map para busca rápida por id.
   * @param {Map<string, Object>|Array<Object>} data
   * @returns {Map<string, Object>}
   */
  normalizeData(data) {
    if (data instanceof Map) {
      return data;
    }
    if (Array.isArray(data)) {
      const map = new Map();
      data.forEach((item) => {
        if (item && item.id) {
          map.set(item.id, item);
        }
      });
      return map;
    }
    throw new Error('Data deve ser Map ou Array de nodes.');
  }

  /**
   * Inicializa o listener do evento customizado.
   */
  init() {
    document.addEventListener('no-selecionado', this.onNodeSelected);
  }

  /**
   * Trata o evento de seleção de nó e abre o modal correspondente.
   * @param {CustomEvent} event
   */
  onNodeSelected(event) {
    const nodeId = event.detail?.id;
    if (!nodeId) return;

    const node = this.dataMap.get(nodeId);
    if (!node) return;

    this.activeTrigger = event.target instanceof HTMLElement ? event.target : null;
    this.open(node);
  }

  /**
   * Abre o modal com os dados do node.
   * @param {Object} node
   */
  open(node) {
    this.createModal(node);
    this.root.appendChild(this.backdrop);
    this.root.appendChild(this.modal);
    document.addEventListener('keydown', this.onKeyDown);
    this.trapFocus();
  }

  /**
   * Cria o HTML do modal e do backdrop.
   * @param {Object} node
   */
  createModal(node) {
    this.removeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'node-modal-backdrop';
    backdrop.addEventListener('click', this.onBackdropClick);

    const modal = document.createElement('div');
    modal.className = 'node-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'node-modal-title');

    const header = document.createElement('div');
    header.className = 'node-modal-header';

    const title = document.createElement('h2');
    title.id = 'node-modal-title';
    title.textContent = node.titulo;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'node-modal-close';
    closeButton.textContent = 'Fechar';
    closeButton.addEventListener('click', () => this.close());

    header.appendChild(title);
    header.appendChild(closeButton);

    const badges = document.createElement('div');
    badges.className = 'node-modal-badges';
    badges.appendChild(this.createBadge(LEVEL_BADGES[node.nivel]?.label || node.nivel, LEVEL_BADGES[node.nivel]?.color || '#607D8B'));
    badges.appendChild(this.createBadge(TYPE_BADGES[node.tipo] || node.tipo, '#2196F3'));

    const description = document.createElement('p');
    description.className = 'node-modal-description';
    description.textContent = node.descricao;

    const metadata = document.createElement('p');
    metadata.className = 'node-modal-meta';
    metadata.textContent = `${node.plataforma} • Verificado em ${node.verificado_em}`;

    const actions = document.createElement('div');
    actions.className = 'node-modal-actions';

    const primary = document.createElement('a');
    primary.className = 'node-modal-button node-modal-button-primary';
    primary.href = node.url;
    primary.target = '_blank';
    primary.rel = 'noopener noreferrer';
    primary.textContent = 'Acessar conteúdo';

    const secondary = document.createElement('a');
    secondary.className = 'node-modal-button node-modal-button-secondary';
    secondary.href = node.url_backup || '#';
    secondary.target = '_blank';
    secondary.rel = 'noopener noreferrer';
    secondary.textContent = 'Link alternativo';
    if (!node.url_backup) {
      secondary.style.display = 'none';
    }

    actions.appendChild(primary);
    actions.appendChild(secondary);

    const statusMessage = this.createStatusMessage(node.status);

    const observation = document.createElement('p');
    observation.className = 'node-modal-observacao';
    observation.textContent = node.observacao || '';
    if (!node.observacao) {
      observation.style.display = 'none';
    }

    modal.appendChild(header);
    modal.appendChild(badges);
    modal.appendChild(description);
    modal.appendChild(metadata);
    if (statusMessage) modal.appendChild(statusMessage);
    modal.appendChild(actions);
    modal.appendChild(observation);

    this.backdrop = backdrop;
    this.modal = modal;
  }

  /**
   * Cria um badge de texto colorido.
   * @param {string} text
   * @param {string} color
   * @returns {HTMLElement}
   */
  createBadge(text, color) {
    const badge = document.createElement('span');
    badge.className = 'node-modal-badge';
    badge.textContent = text;
    badge.style.backgroundColor = color;
    return badge;
  }

  /**
   * Cria aviso de status deprecado ou em revisão.
   * @param {string} status
   * @returns {HTMLElement|null}
   */
  createStatusMessage(status) {
    if (status === 'ativo') return null;

    const message = document.createElement('div');
    message.className = 'node-modal-status';
    if (status === 'deprecado') {
      message.textContent = 'Este conteúdo está deprecado e pode ser desatualizado.';
    } else if (status === 'em-revisao') {
      message.textContent = 'Este conteúdo está em revisão e pode ser atualizado em breve.';
    }
    return message;
  }

  /**
   * Define e trava o foco dentro do modal.
   */
  trapFocus() {
    this.focusableElements = Array.from(this.modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    this.firstFocusable = this.focusableElements[0] || this.modal;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || this.modal;
    setTimeout(() => {
      if (this.firstFocusable) {
        this.firstFocusable.focus();
      }
    }, 0);
  }

  /**
   * Fecha o modal e restaura o foco ao elemento que abriu.
   */
  close() {
    this.removeModal();
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.activeTrigger instanceof HTMLElement) {
      this.activeTrigger.focus();
    }
    this.activeTrigger = null;
  }

  /**
   * Remove o modal e o backdrop do DOM.
   */
  removeModal() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
      this.modal = null;
    }
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
      this.backdrop = null;
    }
  }

  /**
   * Fecha o modal ao clicar fora do conteúdo.
   * @param {MouseEvent} event
   */
  onBackdropClick(event) {
    if (event.target === this.backdrop) {
      this.close();
    }
  }

  /**
   * Manipula teclado para Escape e foco ciclado.
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (event.key === ESC_KEY) {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'Tab') {
      if (!this.firstFocusable || !this.lastFocusable) return;
      if (event.shiftKey && document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable.focus();
      } else if (!event.shiftKey && document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }

  /**
   * Remove listeners globais e libera recursos.
   */
  destroy() {
    document.removeEventListener('no-selecionado', this.onNodeSelected);
    document.removeEventListener('keydown', this.onKeyDown);
    this.removeModal();
  }
}
