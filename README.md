# Programação Para Todos (PPT)

> Plataforma educacional de trilhas de aprendizado em tecnologia, voltada a jovens de escolas públicas. Desenvolvida pelo grupo PPT no âmbito da Extensão Universitária do Centro Universitário SENAI São Paulo — Campus Mariano Ferraz.

---

## Visão Geral

O PPT é um site no estilo **roadmap interativo** (referências: roadmap.sh, W3Schools, The Odin Project), inteiramente em **português brasileiro**, que guia o usuário por trilhas de aprendizado em desenvolvimento de software. O diferencial central é a acessibilidade: conteúdo curado, gratuito e diretamente vinculado à realidade de jovens sem infraestrutura própria.

A plataforma também integra um **mapa de pontos de Wi-Fi gratuito** na comunidade, permitindo que o aprendizado continue fora da escola.

---

## Escopo Inicial

Três trilhas disponíveis no lançamento:

| Trilha | Tecnologias cobertas |
|---|---|
| **Frontend** | HTML → CSS → JavaScript → (fork) React / Angular |
| **Backend** | Lógica de programação → (linguagem a definir) → APIs REST |
| **Banco de Dados** | Fundamentos → SQL → (fork) PostgreSQL / MySQL |

Cada trilha é representada como um **grafo dirigido**: linha principal contínua com forks em pontos de decisão (ex.: escolha de framework). O usuário visualiza o caminho completo e navega nó a nó.

---

## Arquitetura do Roadmap

### Modelo de grafo

```
Nó raiz
  └── Nó A
        ├── Nó B (sequencial)
        │     ├── Nó C
        │     └── Nó D (fork)
        │           ├── Nó E (ex: React)
        │           └── Nó F (ex: Angular)
        └── ...
```

- **Linha principal:** sequência obrigatória/recomendada
- **Forks:** ramificações opcionais ou de especialização
- **Nós:** unidades de conteúdo (tópico + recurso externo curado)

### Curadoria

- **Modelo fechado:** apenas administradores adicionam/editam conteúdo
- **Recursos:** links para plataformas externas (YouTube, MDN, Curso em Vídeo, etc.)
- **Mitigação de link quebrado:**
  - Campo `url_backup` por nó (segundo link para o mesmo conteúdo)
  - Campo `verificado_em` (data da última checagem manual)
  - Roadmap futuro: crawler periódico para detecção automática de links inativos

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (vanilla no MVP) |
| Backend | Node.js |
| BD (MVP) | JSON local (arquivos estáticos) |
| BD (futuro) | PostgreSQL |
| Mapeamento | Leaflet + OpenStreetMap |
| Editor/IDE | VS Code |
| Versionamento | Git + GitHub |
| Hospedagem | Vercel |

> **Nota:** O MVP serve os dados dos nós via JSON estático consumido pelo frontend. O backend Node.js entra na fase seguinte para gerenciar autenticação, painel admin e persistência no banco.

---

## Estrutura de Dados — Nó do Roadmap

Cada nó do grafo contém:

```json
{
  "id": "html-basico",
  "titulo": "HTML Básico",
  "descricao": "Estrutura de documentos, tags essenciais e semântica.",
  "trilha": "frontend",
  "nivel": "iniciante",
  "tipo": "video",
  "url": "https://...",
  "url_backup": "https://...",
  "plataforma": "Curso em Vídeo",
  "verificado_em": "2026-05-01",
  "status": "ativo",
  "proximos": ["css-basico"],
  "anteriores": []
}
```

---

## Funcionalidades Planejadas

### MVP (entrega acadêmica)
- [ ] Roadmap visual interativo (grafo SVG ou canvas)
- [ ] Três trilhas: Frontend, Backend, Banco de Dados
- [ ] Nós clicáveis com modal de conteúdo (título, descrição, link externo)
- [ ] Mapa de Wi-Fi gratuito (Leaflet + OpenStreetMap)
- [ ] Interface responsiva e leve (prioridade em redes lentas)

### Futuro
- [ ] Painel admin para gerenciamento de nós e links
- [ ] Segundo link de backup por nó
- [ ] Checker automático de links quebrados
- [ ] Hospedagem de conteúdo próprio (aulas da equipe / parceria SENAI)
- [ ] Autenticação e progresso do usuário
- [ ] Expansão de trilhas (DevOps, Mobile, etc.)

---

## Equipe

| Nome | Função no projeto |
|---|---|
| Lucas Rodrigues Daniel | Front-End (desenvolvimento web) |
| Murilo Abila Fernandes | Back-End (desenvolvimento do sistema) |
| Murilo Amorim Carneiro | Banco de Dados |
| Nícolas Silva Maciel | Back-End / Banco de Dados / Apresentação |
| Thiago Alberto Caetano dos Anjos | Front-End / Apresentação |

**Orientador:** Prof. Caio Silva  
**Instituição:** Centro Universitário SENAI São Paulo — Campus Mariano Ferraz  
**Curso:** Tecnologia em Análise e Desenvolvimento de Sistemas  
**Parceria:** Escola Estadual Tito Prates da Fonseca  
**Programa:** Conectados pela Comunidade (Extensão Universitária)

---

## Referências de Design e UX

- [roadmap.sh](https://roadmap.sh) — estrutura de grafo e navegação por trilhas
- [W3Schools](https://www.w3schools.com) — organização didática e simplicidade
- [The Odin Project](https://www.theodinproject.com) — foco em comunidade e progressão clara

---

## Decisões de Projeto Abertas

| Decisão | Status | Observação |
|---|---|---|
| Linguagem do backend | **Node.js** | Mantém JS como linguagem única no stack |
| Hospedagem do MVP | **Vercel** | Suporta projetos estáticos e Node.js nativamente, deploy via GitHub |
| Banco de dados do MVP | **JSON local** | Dados em arquivos `.json` até implementação do backend completo |
| Banco de dados futuro | **PostgreSQL** | A integrar junto ao painel admin |
| Checagem automática de links | Backlog | Prioridade após MVP funcional |
| Conteúdo próprio | Backlog | Dependente de parceria consolidada com SENAI/escola |
