  async queue(batch, env) {
    for (  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log(`Processing message: ${JSON.stringify(message.body)}`);
      message.ack();
    }
  },
};

      console.log(`Processing message: ${JSON.stringify(message.body)}`);
      message.ack();
    }
  },
};
