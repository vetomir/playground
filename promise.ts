// types.ts
export const enum Status {
    WAITING = 'waiting',
    LOADING = 'loading',
    RETRY = 'retry',
    OK = 'ok',
    FAIL = 'fail'
}

export const enum ErrorReason {
    UNAUTHORIZED = 'unauthorized',
    FORBIDDEN = 'forbidden',
    NOT_FOUND = 'not_found',
    VALIDATION = 'validation',
    SERVER_ERROR = 'server_error',
    NETWORK_ERROR = 'network_error',
    RATE_LIMIT = 'rate_limit',
    TIMEOUT = 'timeout'
}

export type RequestConfig<T = any> = {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    attempts?: number;
    priority?: number;
    timeout?: number;
    fallback?: T;
};

export type Handlers = {
    waiting?: (position: number) => void;
    loading?: (attempt: number) => void;
    retry?: (attempt: number) => void;
    success?: (data: any) => void;
    error?: (reason: ErrorReason, message: string) => void;
};

// pool.ts
const pool = {
    slots: 1,
    active: 0,
    maxConcurrent: 6,
    queue: [] as Array<{ run: () => void; priority: number }>,
    timestamps: [] as number[],
    maxPerMinute: 100
};

export const canExecute = () => {
    pool.timestamps = pool.timestamps.filter(t => t > Date.now() - 60_000);
    return pool.timestamps.length < pool.maxPerMinute && pool.active < Math.min(pool.slots, pool.maxConcurrent);
};

export const processQueue = () => {
    while (pool.queue.length && canExecute()) {
        pool.queue.shift()!.run();
    }
};

export const addSlot = () => {
    pool.slots = Math.min(pool.slots + 1, 10);
    console.log(`[Pool] Slots: ${pool.slots}`);
};

export const enqueue = <T>(
    executor: () => Promise<T>,
    priority = 0,
    onWaiting?: (position: number) => void
): Promise<T> =>
    new Promise((resolve, reject) => {
        const run = async () => {
            pool.active++;
            pool.timestamps.push(Date.now());
            try {
                resolve(await executor());
            } catch (err) {
                reject(err);
            } finally {
                pool.active--;
                processQueue();
            }
        };

        if (canExecute()) {
            run();
        } else {
            onWaiting?.(pool.queue.length + 1);
            pool.queue.push({ run, priority });
            pool.queue.sort((a, b) => b.priority - a.priority);
        }
    });

export const configure = (config: { slots?: number; maxConcurrent?: number; maxPerMinute?: number }) => {
    if (config.slots) pool.slots = config.slots;
    if (config.maxConcurrent) pool.maxConcurrent = config.maxConcurrent;
    if (config.maxPerMinute) pool.maxPerMinute = config.maxPerMinute;
};

export const getStats = () => ({
    slots: pool.slots,
    active: pool.active,
    queued: pool.queue.length,
    timestamps: pool.timestamps.length
});

// utils.ts
export const buildUrl = (url: string, query?: Record<string, any>) => {
    if (!query) return url;
    const params = new URLSearchParams(
        Object.entries(query)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
    );
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
};

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// errors.ts
import { ErrorReason } from './types';

const errorMap: Record<number, ErrorReason> = {
    401: ErrorReason.UNAUTHORIZED,
    403: ErrorReason.FORBIDDEN,
    404: ErrorReason.NOT_FOUND,
    429: ErrorReason.RATE_LIMIT,
    400: ErrorReason.VALIDATION,
    422: ErrorReason.VALIDATION
};

export const getErrorReason = (status: number): ErrorReason =>
    errorMap[status] ?? (status >= 500 ? ErrorReason.SERVER_ERROR : ErrorReason.SERVER_ERROR);

export const shouldRetry = (status: number) => ![400, 401, 403, 404, 422].includes(status);

export const shouldAddSlot = (status: number, isLastAttempt: boolean) =>
    isLastAttempt && (status === 401 || status >= 500);

export const parseException = (error: any): { reason: ErrorReason; message: string } => {
    if (error.reason) return { reason: error.reason, message: error.message };
    if (error.name === 'AbortError') return { reason: ErrorReason.TIMEOUT, message: 'Request timeout' };
    if (!navigator.onLine) return { reason: ErrorReason.NETWORK_ERROR, message: 'Network error' };
    return { reason: ErrorReason.SERVER_ERROR, message: error.message || 'Unknown error' };
};

// request.ts
import { doLogin } from '@auth-microfrontend/core';
import type { RequestConfig, Handlers } from './types';
import { ErrorReason } from './types';
import { enqueue, addSlot } from './pool';
import { buildUrl, sleep } from './utils';
import { getErrorReason, shouldRetry, shouldAddSlot, parseException } from './errors';

const performFetch = async <T>(config: RequestConfig<T>, handlers: Handlers): Promise<T> => {
    const { url, method = 'GET', body, query, headers = {}, attempts = 3, timeout = 30_000, fallback } = config;
    const fullUrl = buildUrl(url, query);

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            (attempt === 1 ? handlers.loading : handlers.retry)?.(attempt);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(fullUrl, {
                method,
                headers: { 'Content-Type': 'application/json', ...headers },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });

            clearTimeout(timer);

            if (!response.ok) {
                const reason = getErrorReason(response.status);
                const message = `HTTP ${response.status}`;

                if (response.status === 401) {
                    await doLogin();
                    if (attempt < attempts) {
                        await sleep(500);
                        continue;
                    }
                }

                if (shouldAddSlot(response.status, attempt === attempts)) {
                    addSlot();
                }

                if (!shouldRetry(response.status)) {
                    throw { reason, message };
                }

                await sleep(Math.min(1000 * 2 ** (attempt - 1), 10_000) + Math.random() * 200);
                continue;
            }

            const data = await response.json();
            handlers.success?.(data);
            return data as T;
        } catch (error: any) {
            const { reason, message } = parseException(error);

            if (attempt === attempts) {
                handlers.error?.(reason, message);
                if (fallback !== undefined) return fallback;
                throw new Error(message);
            }

            await sleep(Math.min(1000 * 2 ** (attempt - 1), 10_000) + Math.random() * 200);
        }
    }

    throw new Error('Request failed');
};

export const createRequest = <T>(config: RequestConfig<T>) => {
    const handlers: Handlers = {};

    const chain = {
        waiting: (fn: (position: number) => void) => ((handlers.waiting = fn), chain),
        loading: (fn: (attempt: number) => void) => ((handlers.loading = fn), chain),
        retry: (fn: (attempt: number) => void) => ((handlers.retry = fn), chain),
        success: (fn: (data: T) => void) => ((handlers.success = fn), chain),
        error: (fn: (reason: ErrorReason, message: string) => void) => ((handlers.error = fn), chain),
        then: <R = T>(onSuccess?: any, onError?: any) => execute().then(onSuccess, onError),
        catch: <R = never>(onError?: any) => execute().catch(onError),
        finally: (onFinally?: any) => execute().finally(onFinally)
    };

    const execute = () => enqueue(() => performFetch(config, handlers), config.priority, handlers.waiting);

    return chain;
};

// index.ts
export { createRequest as request, configure, getStats } from './request';
export { Status, ErrorReason } from './types';
export type { RequestConfig } from './types';
