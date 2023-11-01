import type { NextApiRequest, NextApiResponse } from "next";
import * as LitJsSdk from "@lit-protocol/lit-node-client-nodejs";

interface Payload {
  baseUrl: string;
  path: string;
  orgId: string;
  iat: number;
  exp: number;
}

const handler = async (req, res) => {
  const { accessKey, webhookContext } = req.body;

  const { verified, header, payload } = LitJsSdk.verifyJwt({
    jwt,
  });

  if (!verified) {
    res.status(403).json({ message: "Access token is not correct" });
  } else if (
    webhookContext?.resourceId &&
    (webhookContext.resourceId.baseUrl !== payload.baseUrl ||
      webhookContext.resourceId.path !== payload.path ||
      webhookContext.resourceId.orgId !== payload.orgId)
  ) {
    res.status(403).json({ message: "ResourceId does not match" });
  } else {
    res.status(200).json({ message: "Success" });
  }
};

export default handler;
