import Typesense from "typesense";

export const typesense = new Typesense.Client({
  nodes: [
    {
      host: "oi7fyl416pszmgv5p-1.a1.typesense.net", // Replace with your Typesense server URL
      port: "443", // Default Typesense Cloud port
      protocol: "https", // Use https if applicable
    },
  ],
  apiKey: "A6el9Z7ruU3dDbvsVROqzkaLId2wLuoJ",
  connectionTimeoutSeconds: 2,
});
