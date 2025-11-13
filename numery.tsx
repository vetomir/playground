import {useEffect, useRef, useState} from 'react';
import {useParams} from 'react-router-dom';
import {atom, selectorFamily, useRecoilCallback, useRecoilValue} from 'recoil';

// ============================================
// TYPES
// ============================================
interface MainResponse {
    id: string;
    data: Record<string, any>;
    dependencies: string[];
}

interface DependentResponse {
    id: string;
    result: any;
}

// ============================================
// RECOIL STATE
// ============================================

// Main request state
export const mainDataState = atom<MainResponse | null>({
    key: 'mainDataState',
    default: null,
});

// Dependent requests selector family
export const dependentDataSelector = selectorFamily<any, string>({
    key: 'dependentDataSelector',
    get: (requestId: string) => async ({get}) => {
        const mainData = get(mainDataState);

        if (!mainData) {
            throw new Error('Main data not loaded');
        }

        const response = await fetch(
            `https://foo.pl/dependent/${requestId}`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mainData: mainData.data}),
            }
        );

        if (!response.ok) throw new Error(`Failed to fetch ${requestId}`);
        return response.json();
    },
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Batched concurrent requests with Cranker limit
async function batchedFetch<T>(
    requests: Array<() => Promise<T>>,
    concurrency: number = 3,
    delayMs: number = 50
): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < requests.length; i += concurrency) {
        const batch = requests.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(req => req().catch(err => {
                console.error('Request failed:', err);
                return null;
            }))
        );
        results.push(...batchResults.filter(Boolean) as T[]);

        // Small delay between batches to avoid Cranker throttling
        if (i + concurrency < requests.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

// Component prefetching
const prefetchComponents = () => {
    const components = [
        () => import('./HeavyComponent1'),
        () => import('./HeavyComponent2'),
        () => import('./DataGrid'),
        // Add your components here
    ];

    components.forEach(loader =>
        loader().catch(err => console.warn('Prefetch failed:', err))
    );
};

// Single-spa app preloading
const prefetchSingleSpaApps = async () => {
    if (typeof window !== 'undefined' && (window as any).System) {
        const apps = [
            '@org/app1',
            '@org/app2',
            // Add your single-spa apps here
        ];

        apps.forEach(app => {
            (window as any).System.import(app).catch((err: Error) =>
                console.warn(`Failed to prefetch ${app}:`, err)
            );
        });
    }
};

// ============================================
// MAIN COMPONENT
// ============================================

export const OptimizedDataLoader = () => {
    const {itemId} = useParams<{ itemId: string }>();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<Error | null>(null);
    const prefetchTriggered = useRef(false);

    // Recoil callback for updating state without causing re-renders
    const loadData = useRecoilCallback(({set}) => async (id: string) => {
        try {
            setStatus('loading');

            // ============================================
            // PHASE 1: Parallel execution during main request
            // ============================================

            const mainRequestPromise = fetch(`https://foo.pl/mas/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Main request failed');
                    return res.json();
                });

            // Additional request (parallel with main)
            const additionalRequestPromise = fetch('https://foo.pl/additional-data')
                .then(res => res.ok ? res.json() : null)
                .catch(() => null);

            // Trigger prefetching immediately (no await)
            if (!prefetchTriggered.current) {
                prefetchTriggered.current = true;
                prefetchComponents();
                prefetchSingleSpaApps();
            }

            // Wait for main request (4 seconds)
            const [mainData, additionalData] = await Promise.all([
                mainRequestPromise,
                additionalRequestPromise,
            ]);

            // Update Recoil state
            set(mainDataState, mainData);

            // ============================================
            // PHASE 2: Dependent requests (batched)
            // ============================================

            const dependentRequests = mainData.dependencies.map(
                (depId: string) => () =>
                    fetch(`https://foo.pl/dependent/${depId}`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            mainData: mainData.data,
                            itemId: id
                        }),
                    }).then(res => res.json())
            );

            // Execute in batches of 3 with 50ms delay
            const dependentResults = await batchedFetch(
                dependentRequests,
                3,
                50
            );

            console.log('All data loaded:', {
                main: mainData,
                additional: additionalData,
                dependent: dependentResults,
            });

            setStatus('success');

        } catch (err) {
            console.error('Data loading error:', err);
            setError(err as Error);
            setStatus('error');
        }
    }, []);

    // Trigger loading on mount
    useEffect(() => {
        if (itemId && status === 'idle') {
            loadData(itemId);
        }
    }, [itemId, status, loadData]);

    // ============================================
    // RENDER
    // ============================================

    if (status === 'loading') {
        return <LoadingSpinner/>;
    }

    if (status === 'error') {
        return <ErrorDisplay error={error}/>;
    }

    if (status === 'success') {
        return <DataDisplay/>;
    }

    return null;
};

// ============================================
// CHILD COMPONENTS (examples)
// ============================================

const LoadingSpinner = () => (
    <div className="loading-container">
        <div className="spinner"/>
        <p>Ładowanie danych...</p>
    </div>
);

const ErrorDisplay = ({error}: { error: Error | null }) => (
    <div className="error-container">
        <h2>Błąd podczas ładowania</h2>
        <p>{error?.message}</p>
    </div>
);

const DataDisplay = () => {
    const mainData = useRecoilValue(mainDataState);

    return (
        <div className="data-container">
            <h1>Załadowane dane</h1>
            <pre>{JSON.stringify(mainData, null, 2)}</pre>
        </div>
    );
};
