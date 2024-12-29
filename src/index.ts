import { join } from "path";
import express from "express";
import { readFileSync } from "fs";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import shopify from "./shopify.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const backendPort = process.env.BACKEND_PORT as string;
const envPort = process.env.PORT as string;
const PORT = parseInt(backendPort || envPort, 10);

const prisma = new PrismaClient();
const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

app.use(express.json());

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

/** API Endpoints **/

// Save cart endpoint
app.post("/api/save-cart", async (req, res) => {
  const { customer_id, items } = req.body;

  try {
    await prisma.savedCart.upsert({
      where: { customerId: customer_id },
      update: { items },
      create: { customerId: customer_id, items },
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error saving cart:", error);
    res.status(500).send({ success: false, error: "Failed to save cart." });
  }
});

// Retrieve cart endpoint
app.get("/api/retrieve-cart", async (req, res) => {
  const { customer_id } = req.query;

  try {
    const cart = await prisma.savedCart.findUnique({
      where: { customerId: customer_id },
    });
    if (cart) {
      res.status(200).send({ items: cart.items });
    } else {
      res.status(404).send({ items: [] });
    }
  } catch (error) {
    console.error("Error retrieving cart:", error);
    res.status(500).send({ success: false, error: "Failed to retrieve cart." });
  }
});

/** Static and fallback routes **/
app.use(serveStatic(`${process.cwd()}/frontend/`, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  const htmlContent = readFileSync(
    join(`${process.cwd()}/frontend/`, "index.html"),
    "utf-8"
  );
  const transformedHtml = htmlContent.replace(
    /%SHOPIFY_API_KEY%/g,
    process.env.SHOPIFY_API_KEY || ""
  );

  res.status(200).set("Content-Type", "text/html").send(transformedHtml);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
