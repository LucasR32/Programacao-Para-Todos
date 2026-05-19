/**
 * @typedef {Object} RoadmapNode
 * @property {string} id - Slug único do nó (ex: "html-basico").
 * @property {string} titulo - Título do tópico.
 * @property {string} descricao - Descrição breve do recurso (máximo 280 caracteres).
 * @property {"frontend"|"backend"|"banco-de-dados"} trilha - Identificador da trilha.
 * @property {"iniciante"|"intermediario"|"avancado"} nivel - Nível do conteúdo.
 * @property {"video"|"artigo"|"documentacao"|"curso"} tipo - Tipo de recurso.
 * @property {string} url - URL do recurso externo.
 * @property {string|null} url_backup - Segundo link para o mesmo conteúdo.
 * @property {string} plataforma - Plataforma ou fonte do conteúdo.
 * @property {string} verificado_em - Data ISO do último check (ex: "2026-05-01").
 * @property {"ativo"|"deprecado"|"em-revisao"} status - Status de publicação.
 * @property {string[]} proximos - IDs dos nós seguintes.
 * @property {string[]} anteriores - IDs dos nós anteriores.
 * @property {boolean} [fork] - true se este nó é ponto de ramificação.
 * @property {string|null} [fork_grupo] - Identificador do grupo de forks.
 * @property {string|null} [observacao] - Nota interna da equipe.
 */

/**
 * @typedef {Object} TrailMetadata
 * @property {string} id - Identificador da trilha.
 * @property {string} titulo - Título da trilha.
 * @property {string} descricao - Descrição resumida da trilha.
 * @property {string} icone - Emoji ou ícone representando a trilha.
 * @property {string} cor - Cor principal da trilha em hexadecimal.
 * @property {string} arquivo - Nome do arquivo JSON que contém os nós da trilha.
 */

export {}; // Arquivo apenas para documentação JSDoc
