type PromiseStatus = 'waiting' | 'loading' | 'ready' | 'failed';

interface PromiseState<T> {
    status: PromiseStatus;
    data?: T;
    error?: Error;
    index: number;
}


async function trackPromises<T>(
    promises: Promise<T>[],
    onProgress: (states: PromiseState<T>[]) => void
): Promise<T[]> {
    // Inicjalizuj wszystkie jako 'waiting'
    const states: PromiseState<T>[] = promises.map((_, index) => ({
        status: 'waiting',
        index
    }));

    onProgress([...states]);

    // Zawijamy każdy promise z obsługą statusów
    const trackedPromises = promises.map((promise, index) => {
        // Zmień na 'loading' gdy promise zaczyna się wykonywać
        states[index].status = 'loading';
        onProgress([...states]);

        return promise
            .then(result => {
                states[index] = {
                    status: 'ready',
                    data: result,
                    index
                };
                onProgress([...states]);
                return result;
            })
            .catch(error => {
                states[index] = {
                    status: 'failed',
                    error,
                    index
                };
                onProgress([...states]);
                throw error;
            });
    });

    return Promise.allSettled(trackedPromises).then(results =>
        results
            .filter((r): r is PromiseFulfilledResult<T> => r.status === 'fulfilled')
            .map(r => r.value)
    );
}

type PromiseStatus = 'waiting' | 'loading' | 'ready' | 'failed';

interface PromiseState<T> {
    status: PromiseStatus;
    data?: T;
    error?: Error;
    index: number;
}

function usePromiseProgress<T>(promises: Promise<T>[]) {
    const [states, setStates] = useState<PromiseState<T>[]>(
        promises.map((_, index) => ({ status: 'waiting', index }))
    );

    useEffect(() => {
        trackPromises(promises, setStates);
    }, []);

    const progress = {
        waiting: states.filter(s => s.status === 'waiting').length,
        loading: states.filter(s => s.status === 'loading').length,
        ready: states.filter(s => s.status === 'ready').length,
        failed: states.filter(s => s.status === 'failed').length,
        total: states.length,
        percentage: (states.filter(s => s.status === 'ready').length / states.length) * 100
    };

    return { states, progress };
}

// Komponent
function ProgressBar() {
    const tasks = useMemo(() => [
        fetchData1(),
        fetchData2(),
        fetchData3()
    ], []);

    const { states, progress } = usePromiseProgress(tasks);

    return (
        <div>
            <div className="progress-bar" style={{ width: `${progress.percentage}%` }} />
    <div>
    Waiting: {progress.waiting} |
    Loading: {progress.loading} |
    Ready: {progress.ready} |
    Failed: {progress.failed}
    </div>

    {states.map(state => (
        <div key={state.index}>
            Task {state.index}: {state.status}
        </div>
    ))}
    </div>
);
}

function trackPromisesInstant<T>(
    promises: Promise<T>[],
    onProgress: (states: PromiseState<T>[]) => void
) {
    const states: PromiseState<T>[] = promises.map((_, index) => ({
        status: 'loading', // od razu loading
        index
    }));

    onProgress([...states]);

    const tracked = promises.map((promise, index) =>
        promise
            .then(result => {
                states[index] = { status: 'ready', data: result, index };
                onProgress([...states]);
                return result;
            })
            .catch(error => {
                states[index] = { status: 'failed', error, index };
                onProgress([...states]);
                throw error;
            })
    );

    return Promise.allSettled(tracked);
}
