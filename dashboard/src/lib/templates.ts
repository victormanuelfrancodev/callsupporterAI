import type { WorkspaceConfig } from "./types";

export type TemplateKey = "esim" | "ecommerce" | "blank";

const baseEscalation: WorkspaceConfig["escalation"] = {
  slackWebhookUrl: "",
  minConfidence: 0.75,
  alwaysEscalateTopics: [],
  escalateWhenVeryUpset: true,
  responseTime: "unos 30 minutos",
};

const baseIntegrations: WorkspaceConfig["integrations"] = {
  orderLookupUrl: "",
  orderLookupToken: "",
  statusFeedUrl: "",
  statusFeedLabel: "Incidencia del proveedor",
};

export const TEMPLATES: Record<TemplateKey, { label: string; description: string; industry: string; build: (name: string) => WorkspaceConfig }> = {
  esim: {
    label: "eSIM / Telecom",
    description: "Activación, validez, conexión y carriers",
    industry: "eSIM",
    build: (name) => ({
      agent: {
        elevenlabsAgentId: "",
        businessContext: `${name} vende eSIM de datos para turistas en Japón. Trabaja con los carriers IIJ y KDDI.`,
        languages: "Inglés por defecto; responde en el idioma del cliente",
        greeting: `Hi! I'm the ${name} eSIM assistant. How can I help?`,
        extraRules: "",
      },
      classification: {
        topics: [
          { value: "activacion", label: "Activación", icon: "lightning", tone: "brand", description: "Instalar o activar la eSIM, QR, pasos en iPhone/Android" },
          { value: "validez", label: "Validez", icon: "calendar", tone: "info", description: "Cuándo empieza o termina el plan, días restantes" },
          { value: "sin_conexion", label: "Sin conexión", icon: "wifi-off", tone: "warn", description: "No hay datos, no conecta, APN, roaming" },
          { value: "reembolso", label: "Reembolso", icon: "receipt", tone: "bad", description: "Devolver dinero, cancelar compra" },
          { value: "cambio_plan", label: "Cambio de plan", icon: "swap", tone: "neutral", description: "Ampliar datos, cambiar o extender el plan" },
          { value: "otro", label: "Otro", icon: "question", tone: "neutral", description: "Cualquier otra consulta" },
        ],
        fields: [
          {
            key: "carrier",
            label: "Carrier",
            icon: "broadcast",
            options: [
              { value: "IIJ", label: "IIJ", tone: "info", description: "El cliente usa una eSIM de IIJ (red Docomo)" },
              { value: "KDDI", label: "KDDI", tone: "brand", description: "El cliente usa una eSIM de KDDI (red au)" },
              { value: "desconocido", label: "Desconocido", tone: "neutral", description: "No se sabe el carrier" },
            ],
          },
        ],
      },
      escalation: { ...baseEscalation, alwaysEscalateTopics: ["reembolso"] },
      integrations: { ...baseIntegrations, statusFeedLabel: "Mantención IIJ" },
    }),
  },
  ecommerce: {
    label: "E-commerce",
    description: "Envíos, devoluciones, pagos y productos",
    industry: "E-commerce",
    build: (name) => ({
      agent: {
        elevenlabsAgentId: "",
        businessContext: `${name} es una tienda online.`,
        languages: "Español; responde en el idioma del cliente",
        greeting: `¡Hola! Soy el asistente de ${name}. ¿En qué te ayudo?`,
        extraRules: "",
      },
      classification: {
        topics: [
          { value: "envio", label: "Envío", icon: "truck", tone: "info", description: "Dónde está mi pedido, retrasos, seguimiento" },
          { value: "devolucion", label: "Devolución", icon: "package", tone: "bad", description: "Devolver un producto, cambio, reembolso" },
          { value: "pago", label: "Pago", icon: "card", tone: "warn", description: "Cobros, tarjeta rechazada, facturas" },
          { value: "producto", label: "Producto", icon: "cart", tone: "brand", description: "Tallas, stock, características" },
          { value: "cuenta", label: "Cuenta", icon: "user", tone: "neutral", description: "Acceso, contraseña, datos personales" },
          { value: "otro", label: "Otro", icon: "question", tone: "neutral", description: "Cualquier otra consulta" },
        ],
        fields: [],
      },
      escalation: { ...baseEscalation, alwaysEscalateTopics: ["devolucion"] },
      integrations: baseIntegrations,
    }),
  },
  blank: {
    label: "En blanco",
    description: "Temas genéricos para empezar",
    industry: "General",
    build: (name) => ({
      agent: {
        elevenlabsAgentId: "",
        businessContext: `${name}.`,
        languages: "Español; responde en el idioma del cliente",
        greeting: `¡Hola! Soy el asistente de ${name}. ¿En qué te ayudo?`,
        extraRules: "",
      },
      classification: {
        topics: [
          { value: "consulta", label: "Consulta", icon: "chat", tone: "brand", description: "Preguntas generales sobre el servicio" },
          { value: "problema", label: "Problema", icon: "wrench", tone: "warn", description: "Algo no funciona" },
          { value: "facturacion", label: "Facturación", icon: "receipt", tone: "bad", description: "Cobros, facturas, reembolsos" },
          { value: "otro", label: "Otro", icon: "question", tone: "neutral", description: "Cualquier otra consulta" },
        ],
        fields: [],
      },
      escalation: baseEscalation,
      integrations: baseIntegrations,
    }),
  },
};
