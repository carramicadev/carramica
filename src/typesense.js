import Typesense from "typesense";

export const typesense = new Typesense.Client({
    nodes: [
        {
            host: "localhost",  // Replace with your Typesense server URL
            port: "8108",                       // Replace with your server's port
            protocol: "http"                    // Use https if applicable
        }
    ],
    apiKey: "P5PvDYafEEIakAFBgxvxFWSEjkQ4diE2zF2Dn5vVgIkxluuK",
    connectionTimeoutSeconds: 2
});
