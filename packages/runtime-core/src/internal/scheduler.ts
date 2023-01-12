/**
 * 调度器，调度执行异步任务
 * 参考文档: https://juejin.cn/post/7123182938790821918
 */

import { isArray } from '@meils/vue-shared';

export interface SchedulerJob extends Function {
  id?: number;
}

export type SchedulerJobs = SchedulerJob | SchedulerJob[];

const queue: SchedulerJob[] = []; // 组件更新任务队列

// 组件更新前置任务队列
const pendingPreFlushCbs: SchedulerJob[] = []; // 存储处在 pending 中的 pre 任务
let activePreFlushCbs: SchedulerJob[] | null = null; // 存储处于激活中的 pre 任务
let preFlushIndex = 0;

// 组件更新后置任务队列
const pendingPostFlushCbs: SchedulerJob[] = []; // 存储处在 pending 中的 post 任务
let activePostFlushCbs: SchedulerJob[] | null = null; // 存储处于激活中的 post 任务
let postFlushIndex = 0;

const resolvedPromise = /*#__PURE__*/ Promise.resolve() as Promise<any>; // 立即执行的 promise
let currentFlushPromise: Promise<void> | null = null; // 当前正在刷新的 Promise 对象

let isFlushing = false; // 刷新中
let isFlushPending = false; // 刷新等待中

/**
 * 组件更新任务入队
 * @param job
 */
export function queueJob(job: SchedulerJob) {
  if (!queue.includes(job)) {
    if (!job?.id) {
      queue.push(job);
    }
    queueFlush();
  }
}

// 前置 pre 任务队列入队
export function queuePreFlushCb(cb: SchedulerJob) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
}

// 后置 post 任务队列入队
export function queuePostFlushCb(cb: SchedulerJobs) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
}

function queueCb(
  cb: SchedulerJobs,
  activeQueue: SchedulerJob[] | null,
  pendingQueue: SchedulerJob[],
  index = 0
) {
  // 非数组形式
  if (!isArray(cb)) {
    // 激活队列为空
    // cb 不在激活队列中，需要将 cb 添加到对应队列中
    if (!activeQueue || !activeQueue.includes(cb, index)) {
      pendingQueue.push(cb);
    }
  } else {
    // 数组形式
    pendingQueue.push(...cb);
  }
  queueFlush();
}

/**
 * 刷新队列
 */
export function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true; // 标志着开始刷新，但是正处于 pending 中
    // 异步执行刷新任务
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}

export function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    pendingPreFlushCbs.length = 0;

    for (
      preFlushIndex = 0;
      preFlushIndex < activePreFlushCbs.length;
      preFlushIndex++
    ) {
      activePreFlushCbs[preFlushIndex]();
    }

    activePreFlushCbs = null;
    preFlushIndex = 0;

    flushPreFlushCbs();
  }
}

export function flushPostFlushCbs() {
  if (pendingPostFlushCbs.length) {
    activePostFlushCbs = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;

    for (
      postFlushIndex = 0;
      postFlushIndex < activePostFlushCbs.length;
      postFlushIndex++
    ) {
      activePostFlushCbs[postFlushIndex]();
    }

    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}

/**
 * 真正刷新队列中的任务
 */
function flushJobs() {
  isFlushPending = false;
  isFlushing = true;
  try {
    // 执行组件更新前的任务
    flushPreFlushCbs();

    // 对组件更新任务做排序
    // 这里的目的是为了确保组件从父级到子组件的顺序
    queue.sort((a, b) => (a.id || Infinity) - (b.id || Infinity));
    console.log('更新任务执行', queue);
    // 执行组件更新任务
    for (let index = 0; index < queue.length; index++) {
      const job = queue[index];
      job();
    }
  } catch (e) {
    console.error('Failed to flushJobs', e);
  } finally {
    queue.length = 0;
    // 执行组件更新后的任务
    flushPostFlushCbs();

    isFlushing = false;
    currentFlushPromise = null;

    // 如果还有待执行任务，继续刷新
    if (
      queue.length ||
      pendingPreFlushCbs.length ||
      pendingPostFlushCbs.length
    ) {
      flushJobs();
    }
  }
}

export function nextTick<T = void>(
  this: T,
  fn?: (this: T) => void
): Promise<void> {
  // 如果当前没正在刷新，则重新使用一个新的 resolvedPromise
  const p = currentFlushPromise || resolvedPromise;
  return fn ? p.then(this ? fn.bind(this) : fn) : p;
}
