import { bench, run } from 'mitata';

const PERSONAS = Array.from({ length: 16 }, (_, i) => ({
  slug: `persona-${i}`,
  name: `Persona ${i}`,
}));

const results = Array.from({ length: 1000 }, (_, i) => ({
  personaSlug: `persona-${i % 16}`,
  uxScore: 5,
  contentRelevance: 5,
  ctaCompelling: 5,
  recommendedAppsRelevant: 5,
}));

bench('Original O(N*M)', () => {
  const rows = results.map((r) => {
    const persona = PERSONAS.find((p) => p.slug === r.personaSlug);
    const name = persona ? persona.name : r.personaSlug;
    return name;
  });
});

const personaMap = new Map(PERSONAS.map(p => [p.slug, p]));

bench('Optimized O(N)', () => {
  const rows = results.map((r) => {
    const persona = personaMap.get(r.personaSlug);
    const name = persona ? persona.name : r.personaSlug;
    return name;
  });
});

run().catch(console.error);
