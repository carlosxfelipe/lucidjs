# Mapa dos Arquivos SolidJS TypeScript

## 📊 Estatísticas

- **Total de arquivos**: 29 arquivos TypeScript
- **Arquivo maior**: `reactive/signal.ts` (1809 linhas - o coração do SolidJS!)
- **Pastas**: 6 módulos organizados + 1 arquivo raiz

## 📁 Estrutura Detalhada

### `/` - Arquivo Raiz

- **`index.ts`** - Documentação e visão geral da estrutura da pasta solid-js

### `/core` - Entry Point Principal

- **`index.ts`** - Exportações principais do SolidJS, ponto de entrada único

### `/reactive` - Sistema de Reatividade ⚡

- **`signal.ts`** - 🔥 **ARQUIVO PRINCIPAL** (1809 linhas) - Implementação
  completa dos signals, o coração do SolidJS
- **`array.ts`** - Utilitários para arrays reativos e patches de atualização
- **`observable.ts`** - Sistema de observables e integração externa
- **`scheduler.ts`** - Agendador de tarefas e batching de atualizações
- **`index.ts`** - Barrel export do sistema reativo

### `/render` - Sistema de Renderização 🎨

- **`component.ts`** - Lógica de criação, lifecycle e props de componentes
- **`Suspense.ts`** - Implementação do componente Suspense para carregamento
  assíncrono
- **`flow.ts`** - Componentes de controle de fluxo (For, Show, Switch, etc.)
- **`hydration.ts`** - Sistema de hidratação client-side e SSR
- **`index.ts`** - Entry point original do sistema de renderização
- **`barrel-index.ts`** - Barrel export customizado

### `/server` - Renderização no Servidor 🖥️

- **`index.ts`** - API principal para renderização server-side
- **`reactive.ts`** - Adaptações do sistema reativo para o servidor
- **`rendering.ts`** - Lógica de renderização SSR e stream

### `/store` - Gerenciamento de Estado 📦

- **`index.ts`** - API principal do store e exportações
- **`store.ts`** - Implementação principal do store reativo com proxies
- **`modifiers.ts`** - Helpers `produce()` e `reconcile()` para updates
  imutáveis
- **`mutable.ts`** - Stores mutáveis para casos específicos de performance
- **`server.ts`** - Adaptação do store para renderização server-side
- **`barrel-index.ts`** - Barrel export customizado

### `/web` - Funcionalidades Web 🌐

- **`index.ts`** - API principal para funcionalidades web
- **`client.ts`** - Funcionalidades específicas do cliente/navegador
- **`core.ts`** - Núcleo das funcionalidades web compartilhadas
- **`jsx.ts`** - Runtime JSX e transformações
- **`server-mock.ts`** - Mocks para funcionalidades web no servidor
- **`server.ts`** - Funcionalidades web no contexto servidor
- **`barrel-index.ts`** - Barrel export customizado

## 🎯 Arquivos Chave para Estudo

1. **`reactive/signal.ts`** - **COMECE AQUI!** O arquivo mais importante, contém
   toda a magia da reatividade
2. **`render/component.ts`** - Como os componentes são criados e gerenciados
3. **`store/store.ts`** - Sistema de estado reativo com proxies
4. **`web/jsx.ts`** - Como o JSX é processado
5. **`render/flow.ts`** - Componentes de controle como `<For>`, `<Show>`,
   `<Switch>`

## 🔄 Fluxo de Transpilação

Estes arquivos TypeScript são convertidos para JavaScript através de:

```
TypeScript → Babel → Rollup → dist/solid.js (ES) / dist/solid.cjs (CDN)
```

## 📝 Notas

- Os imports mantêm caminhos originais (podem não funcionar nesta estrutura
  reorganizada)
- Esta organização é puramente para estudo e referência
- O arquivo `signal.ts` sozinho tem mais código que muitas bibliotecas inteiras!
