export class MemoryCache {
  constructor() { this.values = new Map(); }
  get(key) { return this.values.get(key); }
  set(key, value) { this.values.set(key, value); return value; }
  has(key) { return this.values.has(key); }
  clear() { this.values.clear(); }
}

export class RequestLimiter {
  constructor(limit = 4) {
    this.limit = limit;
    this.active = 0;
    this.pending = [];
  }

  run(task) {
    return new Promise((resolve, reject) => {
      this.pending.push({ task, resolve, reject });
      this.#drain();
    });
  }

  #drain() {
    while (this.active < this.limit && this.pending.length) {
      const job = this.pending.shift();
      this.active += 1;
      Promise.resolve().then(job.task).then(job.resolve, job.reject).finally(() => {
        this.active -= 1;
        this.#drain();
      });
    }
  }
}
