import Typesense from "typesense";

export const typesense = new Typesense.Client({
    nodes: [
        {
            host: "y5apuifswvrl74bhp-1.a1.typesense.net",  // Replace with your Typesense server URL
            port: '443', // Default Typesense Cloud port
            protocol: 'https',                  // Use https if applicable
        }
    ],
    apiKey: "w48GsJQ9cgHRtngNKCXeg4uPuSHv1dVR",
    connectionTimeoutSeconds: 2
});
