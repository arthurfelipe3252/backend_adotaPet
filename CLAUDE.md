# backandintegrador

## graphify

This project has a knowledge graph at `graphify-out/` (1228 nodes, 2034 edges, 80 communities).

**Rules — always follow before answering any codebase question:**

1. Run `graphify query "<question>"` first when `graphify-out/graph.json` exists.
   Do NOT read source files directly unless the graph query returns insufficient context.
2. Use `graphify path "<A>" "<B>"` to trace relationships between two concepts.
3. Use `graphify explain "<concept>"` for a focused explanation of a single node.
4. Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.
5. After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
