import React, { useContext, useState } from 'react';

// 
import * as serviceWorker from '../serviceWorker';

// Context
const SwContext = React.createContext();

// useContext
export function useSw() {
    return useContext(SwContext);
}

// Provider
function SwProvider(props) {
    // 
    const [waitingServiceWorker, setWaitingServiceWorker] = useState(null);
    const [isUpdateAvailable, setUpdateAvailable] = useState(false);
    // 
    React.useEffect(() => {
        serviceWorker.register({
            onUpdate: registration => {
                setWaitingServiceWorker(registration.waiting);
                setUpdateAvailable(true);
            }
        });
    }, []);
    //   
    React.useEffect(() => {
        if (waitingServiceWorker) {
            waitingServiceWorker.addEventListener('statechange', event => {
                if (event.target.state === 'activated') {
                    window.location.reload();
                }
            });
        }
    }, [waitingServiceWorker]);
    // 
    const value = React.useMemo(() => ({
        isUpdateAvailable,
        updateAssets: () => {
            if (waitingServiceWorker) {
                waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
            }
        }
    }), [isUpdateAvailable, waitingServiceWorker]);
    // 
    return (
        <SwContext.Provider value={value} >
            {props.children}
        </SwContext.Provider>
    )
}

export default SwProvider;
