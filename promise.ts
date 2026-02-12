function trackPromises<T>(
    promises: Promise<T>[],
    onProgress: (statuses: PromiseStatus[]) => void
) {
    const statuses: PromiseStatus[] = new Array(promises.length).fill('waiting');
    onProgress([...statuses]);

    promises.forEach((promise, index) => {
        statuses[index] = 'loading';
        onProgress([...statuses]);

        promise
            .then(() => {
                statuses[index] = 'ready';
                onProgress([...statuses]);
            })
            .catch(() => {
                statuses[index] = 'failed';
                onProgress([...statuses]);
            });
    });
}

// Użycie
const tasks = [fetchA(), fetchB(), fetchC()];
trackPromises(tasks, (statuses) => {
    console.log(statuses); // ['loading', 'ready', 'loading']
    updateProgressBar(statuses);
});


type PromiseStatus = 'waiting' | 'loading' | 'ready' | 'failed';

async function trackPromises2<T>(
    promises: Promise<T>[],
    onProgress: (statuses: PromiseStatus[]) => void
): Promise<T[]> {
    // Inicjalizuj wszystkie jako 'waiting'
    const statuses: PromiseStatus[] = new Array(promises.length).fill('waiting');
    onProgress([...statuses]);

    const trackedPromises = promises.map((promise, index) => {
        // Zmień na 'loading'
        statuses[index] = 'loading';
        onProgress([...statuses]);

        return promise
            .then(result => {
                statuses[index] = 'ready';
                onProgress([...statuses]);
                return result;
            })
            .catch(error => {
                statuses[index] = 'failed';
                onProgress([...statuses]);
                throw error;
            });
    });

    await Promise.allSettled(trackedPromises);
    return statuses as any; // lub zwróć wyniki jak potrzebujesz
}
