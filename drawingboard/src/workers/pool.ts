export class WorkerPool {
  poolSize: number;
  taskQueue: WorkerTask[];
  workerQueue: WorkerThread[];
  constructor(size = window.navigator.hardwareConcurrency) {
    this.poolSize = size;
    this.taskQueue = [];
    this.workerQueue = [];
    this.init();
  }
  init() {
    for (let i = 0; i < this.poolSize; i++) {
      this.workerQueue.push(new WorkerThread(this));
    }
  }
  addTask(workerTask: WorkerTask) {
    if (this.workerQueue.length > 0) {
      // get the worker from the front of the queue
      const workerThread = this.workerQueue.shift();
      workerThread?.run(workerTask);
    } else {
      // no free workers,
      this.taskQueue.push(workerTask);
    }
  }
  releaseWorkerThread(workerThread: WorkerThread) {
    if (this.taskQueue.length > 0) {
      // if has remaining tasks, directly excute the task.
      const workerTask = this.taskQueue.shift();
      if (workerTask) {
        workerThread.run(workerTask);
      }
    } else {
      // if no more tasks to do push the thread back to the pool.
      this.workerQueue.push(workerThread);
    }
  }
}

class WorkerThread {
  pool: WorkerPool;
  workerTask: WorkerTask | null;
  run: (workerTask: WorkerTask) => void;
  constructor(pool: WorkerPool) {
    this.pool = pool;
    this.workerTask = null;
    this.run = (workerTask) => {
      this.workerTask = workerTask;
      // create a new web worker
      if (this.workerTask !== null) {
        var worker = new Worker(workerTask.url);
        worker.addEventListener("message", this.callback);
        worker.postMessage(workerTask.message);
      }
    };
    this.callback = this.callback.bind(this);
  }
  callback(e: any) {
    this.workerTask?.callback(e);
    this.pool.releaseWorkerThread(this);
  }
}

export class WorkerTask {
  url: string;
  callback: Function;
  message: any;
  constructor(url: string, message: any, callback: Function) {
    this.url = url;
    this.callback = callback;
    this.message = message;
  }
}
