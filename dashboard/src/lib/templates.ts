import type { WorkspaceConfig } from "./types";

export type TemplateKey = "esim" | "ecommerce" | "blank";

const baseEscalation: WorkspaceConfig["escalation"] = {
  slackWebhookUrl: "",
  minConfidence: 0.75,
  alwaysEscalateTopics: [],
  escalateWhenVeryUpset: true,
  responseTime: "about 30 minutes",
};

const baseIntegrations: WorkspaceConfig["integrations"] = {
  orderLookupUrl: "",
  orderLookupToken: "",
  statusFeedUrl: "",
  statusFeedLabel: "Provider incident",
};

const baseAgent = (name: string, businessContext: string): WorkspaceConfig["agent"] => ({
  elevenlabsAgentId: "",
  businessContext,
  languages: "English by default; reply in the customer's language",
  greeting: `Hi! I'm the ${name} assistant. How can I help?`,
  extraRules: "",
});

export const TEMPLATES: Record<TemplateKey, { label: string; description: string; industry: string; build: (name: string) => WorkspaceConfig }> = {
  esim: {
    label: "eSIM / Telecom",
    description: "Activation, validity, connectivity and carriers",
    industry: "eSIM",
    build: (name) => ({
      agent: {
        ...baseAgent(name, `${name} sells data eSIMs for travellers in Japan, on the IIJ and KDDI carriers.`),
        greeting: `Hi! I'm the ${name} eSIM assistant. How can I help?`,
      },
      classification: {
        topics: [
          { value: "activation", label: "Activation", icon: "lightning", tone: "brand", description: "Installing or activating the eSIM, QR code, iPhone/Android steps" },
          { value: "validity", label: "Validity", icon: "calendar", tone: "info", description: "When the plan starts or ends, days left" },
          { value: "no_connection", label: "No connection", icon: "wifi-off", tone: "warn", description: "No data, can't connect, APN, roaming" },
          { value: "refund", label: "Refund", icon: "receipt", tone: "bad", description: "Getting money back, cancelling a purchase" },
          { value: "plan_change", label: "Plan change", icon: "swap", tone: "neutral", description: "More data, switching or extending the plan" },
          { value: "other", label: "Other", icon: "question", tone: "neutral", description: "Anything else" },
        ],
        fields: [
          {
            key: "carrier",
            label: "Carrier",
            icon: "broadcast",
            options: [
              { value: "IIJ", label: "IIJ", tone: "info", description: "The customer has an IIJ eSIM (Docomo network)" },
              { value: "KDDI", label: "KDDI", tone: "brand", description: "The customer has a KDDI eSIM (au network)" },
              { value: "unknown", label: "Unknown", tone: "neutral", description: "The carrier is not known" },
            ],
          },
        ],
      },
      escalation: { ...baseEscalation, alwaysEscalateTopics: ["refund"] },
      integrations: { ...baseIntegrations, statusFeedLabel: "IIJ maintenance" },
    }),
  },
  ecommerce: {
    label: "E-commerce",
    description: "Shipping, returns, payments and products",
    industry: "E-commerce",
    build: (name) => ({
      agent: baseAgent(name, `${name} is an online store.`),
      classification: {
        topics: [
          { value: "shipping", label: "Shipping", icon: "truck", tone: "info", description: "Where is my order, delays, tracking" },
          { value: "return", label: "Return", icon: "package", tone: "bad", description: "Returning a product, exchanges, refunds" },
          { value: "payment", label: "Payment", icon: "card", tone: "warn", description: "Charges, declined cards, invoices" },
          { value: "product", label: "Product", icon: "cart", tone: "brand", description: "Sizes, stock, features" },
          { value: "account", label: "Account", icon: "user", tone: "neutral", description: "Login, password, personal details" },
          { value: "other", label: "Other", icon: "question", tone: "neutral", description: "Anything else" },
        ],
        fields: [],
      },
      escalation: { ...baseEscalation, alwaysEscalateTopics: ["return"] },
      integrations: baseIntegrations,
    }),
  },
  blank: {
    label: "Blank",
    description: "Generic topics to start with",
    industry: "General",
    build: (name) => ({
      agent: baseAgent(name, `${name}.`),
      classification: {
        topics: [
          { value: "question", label: "Question", icon: "chat", tone: "brand", description: "General questions about the service" },
          { value: "problem", label: "Problem", icon: "wrench", tone: "warn", description: "Something isn't working" },
          { value: "billing", label: "Billing", icon: "receipt", tone: "bad", description: "Charges, invoices, refunds" },
          { value: "other", label: "Other", icon: "question", tone: "neutral", description: "Anything else" },
        ],
        fields: [],
      },
      escalation: baseEscalation,
      integrations: baseIntegrations,
    }),
  },
};
