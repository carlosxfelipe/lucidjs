# SolidJS TypeScript Source

Esta pasta contém todos os arquivos TypeScript fonte do SolidJS organizados em
uma estrutura limpa para facilitar navegação e estudo do código.

## Estrutura

```
solid-js/
├── index.ts        # Documentação geral da estrutura
├── core/           # Exportações principais do SolidJS (src/index.ts)
│   └── index.ts    # Entry point principal
├── reactive/       # Sistema de reatividade
│   ├── signal.ts   # Implementação dos signals (1809 linhas!)
│   ├── array.ts    # Utilitários para arrays reativos
│   ├── observable.ts # Sistema de observables
│   ├── scheduler.ts  # Agendador de tarefas
│   └── index.ts    # Barrel export
├── render/         # Sistema de renderização
│   ├── component.ts  # Lógica de componentes
│   ├── Suspense.ts   # Componente Suspense
│   ├── flow.ts       # Componentes de controle de fluxo
│   ├── hydration.ts  # Sistema de hidratação
│   ├── index.ts      # Entry point original
│   └── barrel-index.ts # Barrel export customizado
├── server/         # Renderização no servidor (SSR)
│   ├── index.ts      # API do servidor
│   ├── reactive.ts   # Reatividade no servidor
│   └── rendering.ts  # Renderização SSR
├── store/          # Sistema de gerenciamento de estado
│   ├── index.ts      # API principal do store
│   ├── store.ts      # Implementação do store
│   ├── modifiers.ts  # Modificadores (produce, reconcile)
│   ├── mutable.ts    # Stores mutáveis
│   ├── server.ts     # Store no servidor
│   └── barrel-index.ts # Barrel export customizado
└── web/            # Funcionalidades específicas do navegador
    ├── index.ts      # API web principal
    ├── client.ts     # Funcionalidades do cliente
    ├── core.ts       # Núcleo web
    ├── jsx.ts        # Runtime JSX
    ├── server-mock.ts # Mock para servidor
    ├── server.ts     # Funcionalidades do servidor web
    └── barrel-index.ts # Barrel export customizado
```

## Arquivos Principais

### Core (`signal.ts`)

O coração do SolidJS com 1809 linhas! Contém:

- Implementação dos signals
- Sistema de reatividade
- Scheduling de updates
- Context management

### Render System

- **component.ts**: Lógica de criação e lifecycle de componentes
- **Suspense.ts**: Implementação do componente Suspense
- **flow.ts**: For, Show, Switch e outros componentes de controle
- **hydration.ts**: Sistema de hidratação client-side

### Store System

- **store.ts**: Implementação principal do store reativo
- **modifiers.ts**: `produce()` e `reconcile()` helpers
- **mutable.ts**: Stores mutáveis para casos específicos

## Como foi gerado o build

Estes arquivos TypeScript são transpilados para JavaScript usando:

1. **Rollup** com configuração em `rollup.config.js`
2. **Babel** com preset TypeScript
3. **Pontos de entrada**:
   - `src/index.ts` → `dist/solid.js` (ES) e `dist/solid.cjs` (CDN)
   - `src/server/index.ts` → `dist/server.js`
   - `store/src/index.ts` → `store/dist/store.js`
   - `web/src/index.ts` → `web/dist/web.js`

## Para estudar o código

1. Comece pelo `index.ts` na raiz para ver a visão geral da estrutura
2. Veja `core/index.ts` para as exportações principais do SolidJS
3. Dive into `reactive/signal.ts` para entender o sistema de reatividade (1809 linhas!)
4. Explore `render/component.ts` para ver como componentes funcionam
5. Veja `store/store.ts` para entender o sistema de estado
6. Os arquivos `barrel-index.ts` contêm exports customizados de cada módulo

## Nota sobre imports

Os arquivos mantêm suas importações originais, então alguns podem ter
referências a caminhos relativos que não existem nesta estrutura reorganizada.
Esta pasta é puramente para estudo e referência do código fonte.
