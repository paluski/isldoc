import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Permite que páginas registrem rótulos amigáveis para segmentos dinâmicos
// da rota (ex.: o id de um projeto -> nome do projeto) usados no breadcrumb.
const PageMetaContext = createContext(null);

export function PageMetaProvider({ children }) {
  const [labels, setLabels] = useState({});

  const setSegmentLabel = useCallback((key, label) => {
    if (!key || !label) return;
    setLabels((prev) => (prev[key] === label ? prev : { ...prev, [key]: label }));
  }, []);

  const value = useMemo(() => ({ labels, setSegmentLabel }), [labels, setSegmentLabel]);

  return <PageMetaContext.Provider value={value}>{children}</PageMetaContext.Provider>;
}

export function usePageMeta() {
  return useContext(PageMetaContext) ?? { labels: {}, setSegmentLabel: () => {} };
}
