export class CounterDO {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    let count = parseInt(await this.state.storage.get("count") || "0");

    if (url.pathname === "/increment") {
      count++;
      await this.state.storage.put("count", count);
    } else if (url.pathname === "/reset") {
      count = 0;
      await this.state.storage.put("count", count);
    }

    return new Response(JSON.stringify({ count }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Send a message to the queue
    if (url.pathname === "/queue") {
      await env.QUEUE.send({ message: "Hello from hum Worker!", timestamp: Date.now() });
      return new Response(JSON.stringify({ status: "Message sent to queue" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Route everything else to the Durable Object
    const id = env.CounterDO.idFromName("global");
    const stub = env.CounterDO.get(id);
    return stub.fetch(request);
