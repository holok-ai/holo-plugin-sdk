export class AsyncEventQueue<T> implements AsyncIterable<T> {
    private q: T[] = [];
    private pending: ((v: IteratorResult<T>) => void)[] = [];
    private ended = false;
    private err: any = null;

    push(item: T) {
        if (this.ended) return;
        const r = this.pending.shift();
        if (r) r({value: item, done: false});
        else this.q.push(item);
    }

    end() {
        this.ended = true;
        while (this.pending.length) this.pending.shift()!({value: undefined as any, done: true});
    }

    fail(e: any) {
        this.err = e;
        this.end();
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return {
            next: () => {
                if (this.err) return Promise.reject(this.err);
                if (this.q.length) return Promise.resolve({value: this.q.shift()!, done: false});
                if (this.ended) return Promise.resolve({value: undefined as any, done: true});
                return new Promise<IteratorResult<T>>(resolve => this.pending.push(resolve));
            },
        };
    }
}
