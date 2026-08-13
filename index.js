export class CounterDO {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);
    let count = parseInt((await this.state.storage.get("count")) || "0");

    if (url.pathname === "/increment") {
      count++;
      await this.state.storage.put("count", count);
    } else if (url.pathname === "/reset") {
      count = 0;
      await this.state.storage.put("count", count);
    }

    return new Response(JSON.stringify({ count }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/queue") {
      await env.QUEUE.send({ message: "Hello from hum Worker!", timestamp: Date.now() });
      return new Response(JSON.stringify({ status: "Message sent to queue" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = env.CounterDO.idFromName("global");
    const stub = env.CounterDO.get(id);
    return stub.fetch(request);
  },

  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log(`Processing message: ${JSON.stringify(message.body)}`);
      message.ack();
    }
  },
};
