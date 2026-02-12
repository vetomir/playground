import {
    atom,
    atomFamily,
    selector,
    useRecoilValue,
    useRecoilCallback,
    useSetRecoilState
} from 'recoil';
import { useState } from 'react';

// ============================================================================
// ATOMS & SELECTORS
// ============================================================================

// Atom bazowy z body
const bodyAtom = atom({
    key: 'bodyAtom',
    default: {
        // twoje początkowe dane
    }
});

// Selector 1 - pierwszy request zwraca array
const response1Selector = selector({
    key: 'response1Selector',
    get: async ({get}) => {
        const body = get(bodyAtom);

        const response = await fetch('/api/request1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        return data; // [{id: 1, ...}, {id: 2, ...}, ...]
    }
});

// Atom family do śledzenia statusu każdego itemu
const itemStatusState = atomFamily({
    key: 'itemStatusState',
    default: 'pending' // 'pending' | 'loading' | 'success' | 'error'
});

// Atom family do przechowywania wyników
const itemResultState = atomFamily({
    key: 'itemResultState',
    default: null
});

// Atom family do przechowywania błędów
const itemErrorState = atomFamily({
    key: 'itemErrorState',
    default: null
});

// Atom do przechowania finalnych wyników z s2
const s2ResultsAtom = atom({
    key: 's2ResultsAtom',
    default: null
});

// Selector 3 - finalny request z całym s2
const finalSelector = selector({
    key: 'finalSelector',
    get: async ({get}) => {
        const s2 = get(s2ResultsAtom);

        if (!s2) return null;

        const response = await fetch('/api/request3', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s2)
        });

        const finalData = await response.json();
        return finalData;
    }
});

// ============================================================================
// HOOKS
// ============================================================================

function useProcessItems() {
    const response1 = useRecoilValue(response1Selector);

    const processItems = useRecoilCallback(
        ({set}) => async () => {
            const results = [];

            // Resetuj statusy przed rozpoczęciem
            for (const item of response1) {
                set(itemStatusState(item.id), 'pending');
                set(itemResultState(item.id), null);
                set(itemErrorState(item.id), null);
            }

            // Sekwencyjne przetwarzanie (cranker)
            for (const item of response1) {
                const itemId = item.id;

                // Ustaw status: loading
                set(itemStatusState(itemId), 'loading');

                try {
                    const response = await fetch('/api/request2', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    // Ustaw status: success
                    set(itemStatusState(itemId), 'success');
                    set(itemResultState(itemId), data);
                    results.push(data);

                } catch (error) {
                    // Ustaw status: error
                    set(itemStatusState(itemId), 'error');
                    set(itemErrorState(itemId), error.message);
                    results.push(null);
                }
            }

            // Zapisz wyniki do atomu
            set(s2ResultsAtom, results.filter(r => r !== null));

            return results;
        },
        [response1]
    );

    return processItems;
}

// ============================================================================
// KOMPONENTY
// ============================================================================

function ItemStatus({ itemId }) {
    const status = useRecoilValue(itemStatusState(itemId));
    const error = useRecoilValue(itemErrorState(itemId));

    const statusConfig = {
        pending: { icon: '⏳', text: 'Czeka w kolejce', color: '#6b7280' },
        loading: { icon: '🔄', text: 'Ładuje się...', color: '#3b82f6' },
        success: { icon: '✅', text: 'Zakończone', color: '#10b981' },
        error: { icon: '❌', text: `Błąd: ${error}`, color: '#ef4444' }
    };

    const config = statusConfig[status];

    return (
        <div style={{
        padding: '8px 12px',
            margin: '4px 0',
            borderRadius: '4px',
            backgroundColor: status === 'loading' ? '#f3f4f6' : 'transparent',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
    }}>
    <span>{config.icon}</span>
    <span style={{ color: config.color, fontWeight: 500 }}>
    {config.text}
    </span>
    <span style={{ color: '#9ca3af', fontSize: '14px' }}>
    ID: {itemId}
    </span>
    </div>
);
}

function ItemStatusList() {
    const response1 = useRecoilValue(response1Selector);

    return (
        <div style={{ marginTop: '20px' }}>
    <h3>Status requestów:</h3>
    {response1.map(item => (
        <ItemStatus key={item.id} itemId={item.id} />
    ))}
    </div>
);
}

export default function MyComponent() {
    const body = useRecoilValue(bodyAtom);
    const response1 = useRecoilValue(response1Selector);
    const processItems = useProcessItems();
    const finalData = useRecoilValue(finalSelector);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async () => {
        setIsProcessing(true);
        try {
            await processItems();
            // Po zakończeniu s2, finalSelector automatycznie się uruchomi
        } catch (error) {
            console.error('Błąd przetwarzania:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
    <button
        onClick={handleProcess}
    disabled={isProcessing}
    style={{
        padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isProcessing ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isProcessing ? 'not-allowed' : 'pointer'
    }}
>
    {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij przetwarzanie'}
    </button>

    <ItemStatusList />

    {finalData && (
        <div style={{
        marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px'
    }}>
    <h3 style={{ color: '#10b981' }}>✅ Wszystkie requesty zakończone!</h3>
    <pre>{JSON.stringify(finalData, null, 2)}</pre>
    </div>
)}
    </div>
);
}
