import { createReactClient, studioProvider } from "@livepeer/react";

const LivepeerClient = createReactClient({
  provider: studioProvider({ apiKey: "5a8818e1-eaa7-4a78-91ec-b24ccba35a2a" }),
});

export default LivepeerClient;
