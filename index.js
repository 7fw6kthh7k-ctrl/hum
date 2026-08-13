
// Durable Object definition
export class CounterDO {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const count = parseInt((await this.state.storage.get("count")) || "0") + 1;
    await this.state.storage.put("count", count);
    return new Response(JSON.stringify({ count }));
  }git checkout origin/main -- index.js

}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // D1 — SQL database
    if (url.pathname === "/db") {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, ts TEXT DEFAULT CURRENT_TIMESTAMP)").run();
      await env.DB.prepare("INSERT INTO visits DEFAULT VALUES").run();
      const result = await env.DB.prepare("SELECT COUNT(*) as count FROM visits").first();
      return new Response(JSON.stringify({ visits: result.count }));
    }

    // KV — key-value store
    if (url.pathname === "/kv") {
      let visits = parseInt((await env.KV.get("visits")) || "0") + 1;
      await env.KV.put("visits", visits.toString());
      return new Response(JSON.stringify({ visits }));
    }

    // R2 — object storage
    if (url.pathname === "/r2" && request.method === "POST") {
      const file = await request.arrayBuffer();
      await env.R2.put("upload.bin", file);
      return new Response(JSON.stringify({ message: "File uploaded to R2" }));
    }
    if (url.pathname === "/r2" && request.method === "GET") {
      const file = await env.R2.get("upload.bin");
      if (!file) return new Response(JSON.stringify({ message: "No file found" }));
      return new Response(file.body);
    }

    // Queues — async task processing
    if (url.pathname === "/queue") {
      await env.QUEUE.send({ task: "process", timestamp: Date.now() });
      return new Response(JSON.stringify({ message: "Task sent to queue" }));
    }

    // Durable Objects — real-time stateful coordination
    if (url.pathname === "/counter") {
      const id = env.COUNTER.idFromName("global");
      const stub = env.COUNTER.get(id);
      const response = await stub.fetch(request);
      return new Response(await response.text());
    }

    // Default
    return new Response(JSON.stringify({
      message: "hum Worker is running",
      endpoints: ["/db", "/kv", "/r2", "/queue", "/counter"]
    }), { headers: { "Content-Type": "application/json" } });
  },

  // Queue consumer handler
  async queue(batch, env) {
    for (const message of 
