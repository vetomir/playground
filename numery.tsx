import {useParams} from 'react-router-dom';
import {selectorFamily, Suspense, useRecoilValue} from 'recoil';

// ============================================
// TYPES
// ============================================

interface OrchestratorConfig<TMain, TDerived, TFinal> {
    mainRequests: Array<{
        key: string;
        url: (id: string, type: string) => string;
        method?: 'GET' | 'POST';
        body?: (id: string, type: string) => any;
    }>;

    derivedRequestsMapper: (
        mainResponses: Record<string, TMain>,
        id: string,
        type: string
    ) => Array<{
        key: string;
        url: string;
        method?: 'GET' | 'POST';x
        body?: any;
        priority?: number;
    }>;

    finalMapper?: (
        mainResponses: Record<string, TMain>,
        derivedResponses: Record<string, TDerived>,
        id: string,
        type: string
    ) => TFinal;

    concurrency?: number;
    batchDelay?: number;
}

interface OrchestratorParams {
    id: string;
    type: string;
}

// ============================================
// CORE ENGINE
// ============================================

class OrchestratorEngine<TMain, TDerived, TFinal> {
    private config: OrchestratorConfig<TMain, TDerived, TFinal>;
    private id: string;
    private type: string;

    constructor(
        config: OrchestratorConfig<TMain, TDerived, TFinal>,
        id: string,
        type: string
    ) {
        this.config = config;
        this.id = id;
        this.type = type;
    }

    async execute(): Promise<TFinal> {
        const {
            mainRequests,
            derivedRequestsMapper,
            finalMapper,
            concurrency = 3,
            batchDelay = 30,
        } = this.config;

        // ============================================
        // PHASE 1: Main requests (full parallel)
        // ============================================

        const mainPromises = mainRequests.map(async (req) => {
            const url = req.url(this.id, this.type);
            const body = req.body ? req.body(this.id, this.type) : undefined;

            const response = await fetch(url, {
                method: req.method || 'GET',
                headers: {'Content-Type': 'application/json'},
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(`${req.key} failed: ${response.status}`);
            }

            return {key: req.key, data: await response.json()};
        });

        const mainResults = await Promise.all(mainPromises);
        const mainData = mainResults.reduce(
            (acc, {key, data}) => ({...acc, [key]: data}),
            {} as Record<string, TMain>
        );

        // ============================================
        // PHASE 2: Derive requests config
        // ============================================

        const derivedConfigs = derivedRequestsMapper(mainData, this.id, this.type);

        if (derivedConfigs.length === 0) {
            return (finalMapper
                    ? finalMapper(mainData, {} as Record<string, TDerived>, this.id, this.type)
                    : {main: mainData, derived: {}} as TFinal
            );
        }

        // Sort by priority (1 = highest)
        const sortedConfigs = [...derivedConfigs].sort(
            (a, b) => (a.priority || 999) - (b.priority || 999)
        );

        // ============================================
        // PHASE 3: Batched derived requests
        // ============================================

        const derivedData: Record<string, TDerived> = {};

        for (let i = 0; i < sortedConfigs.length; i += concurrency) {
            const batch = sortedConfigs.slice(i, i + concurrency);

            const batchPromises = batch.map(async (req) => {
                const response = await fetch(req.url, {
                    method: req.method || 'GET',
                    headers: {'Content-Type': 'application/json'},
                    body: req.body ? JSON.stringify(req.body) : undefined,
                });

                if (!response.ok) {
                    throw new Error(`${req.key} failed: ${response.status}`);
                }

                return {key: req.key, data: await response.json()};
            });

            const batchResults = await Promise.all(batchPromises);
            batchResults.forEach(({key, data}) => {
                derivedData[key] = data;
            });

            // Micro-delay between batches
            if (i + concurrency < sortedConfigs.length) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        }

        // ============================================
        // PHASE 4: Final mapping
        // ============================================

        return finalMapper
            ? finalMapper(mainData, derivedData, this.id, this.type)
            : ({main: mainData, derived: derivedData} as TFinal);
    }
}

// ============================================
// RECOIL SELECTOR - AUTOMATIC EXECUTION
// ============================================

interface SelectorKey<TMain, TDerived, TFinal> {
    config: OrchestratorConfig<TMain, TDerived, TFinal>;
    id: string;
    type: string;
}

export const orchestratorSelector = selectorFamily<any, SelectorKey<any, any, any>>({
    key: 'orchestratorSelector',
    get: ({config, id, type}) => async () => {
        const engine = new OrchestratorEngine(config, id, type);
        return await engine.execute();
    },
});

// ============================================
// MAIN ORCHESTRATOR COMPONENT
// ============================================

interface OrchestratorProps<TMain, TDerived, TFinal> {
    config: OrchestratorConfig<TMain, TDerived, TFinal>;
    children: (data: TFinal, id: string, type: string) => React.ReactNode;
    fallback?: React.ReactNode;
}

function OrchestratorInner<TMain, TDerived, TFinal>({
                                                        config,
                                                        children,
                                                    }: Omit<OrchestratorProps<TMain, TDerived, TFinal>, 'fallback'>) {
    const {id, type} = useParams<OrchestratorParams>();

    if (!id || !type) {
        throw new Error('Missing id or type in URL params');
    }

    // Immediate execution on render
    const data = useRecoilValue(
        orchestratorSelector({config, id, type})
    );

    return <>{children(data, id, type)}</>;
}

export function Orchestrator<TMain, TDerived, TFinal>(
    props: OrchestratorProps<TMain, TDerived, TFinal>
) {
    return (
        <Suspense fallback={props.fallback || <div>⚡ Ładowanie...</div>}>
            <OrchestratorInner {...props} />
        </Suspense>
    );
}

// ============================================
// EXAMPLE TYPES
// ============================================

interface MainResponse {
    id: string;
    dependencies: string[];
    metadata: any;
}

interface DerivedResponse {
    itemId: string;
    result: any;
}

interface FinalData {
    orderId: string;
    orderType: string;
    mainData: MainResponse;
    dependenciesData: DerivedResponse[];
    timestamp: number;
}

// ============================================
// EXAMPLE CONFIGURATION
// ============================================

const exampleConfig: OrchestratorConfig<MainResponse, DerivedResponse, FinalData> = {
    // Main requests - execute in parallel
    mainRequests: [
        {
            key: 'order',
            url: (id, type) => `https://foo.pl/mas/${id}?type=${type}`,
            method: 'GET',
        },
        {
            key: 'additional',
            url: (id, type) => `https://foo.pl/additional/${id}`,
            method: 'POST',
            body: (id, type) => ({itemId: id, itemType: type}),
        },
    ],

    // Map main responses => derived requests
    derivedRequestsMapper: (mainResponses, id, type) => {
        const order = mainResponses.order;

        return order.dependencies.map((depId, index) => ({
            key: `dep_${depId}`,
            url: `https://foo.pl/dependent/${depId}`,
            method: 'POST',
            body: {
                orderId: order.id,
                itemId: id,
                itemType: type,
                metadata: order.metadata,
            },
            priority: index < 5 ? 1 : 2, // First 5 have priority
        }));
    },

    // Final data transformation
    finalMapper: (mainResponses, derivedResponses, id, type) => ({
        orderId: id,
        orderType: type,
        mainData: mainResponses.order,
        dependenciesData: Object.values(derivedResponses),
        timestamp: Date.now(),
    }),

    // Performance settings
    concurrency: 3,
    batchDelay: 30,
};