import { theme, type ThemeConfig } from 'antd';

/**
 * Tema Ejecutivo VIP - Estética Uber Black / High-Tech Titanium
 * Mapeo de tokens Seed, Map, Alias y Component Overrides para Ant Design v5.
 */
export const uberBlackTheme: ThemeConfig = {
  // 1. Algoritmo base Dark para cálculo armónico de estados disabled, hover y sombras
  algorithm: theme.darkAlgorithm,

  token: {
    // ═════════════════════════════════════════════════════════════════
    // SEED TOKENS GLOBALES
    // ═════════════════════════════════════════════════════════════════
    colorPrimary: '#FFFFFF', // Blanco platino para botones y llamados a la acción
    colorBgBase: '#0A0A0C',   // Negro asfalto puro de fondo
    colorTextBase: '#F5F5F7', // Blanco platino para máxima legibilidad de títulos
    borderRadius: 6,          // Bordes rectos y elegantes, estilo corporativo
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",

    // ═════════════════════════════════════════════════════════════════
    // MAP & ALIAS TOKENS (Superficies, Contornos y Tipografía Secundaria)
    // ═════════════════════════════════════════════════════════════════
    colorBgContainer: '#141418',       // Gris antracita para tarjetas, inputs y filas de tablas
    colorBgElevated: '#1C1C22',        // Gris ligeramente más claro para menús desplegables y modales
    colorBgLayout: '#0A0A0C',          // Fondo global de la plataforma
    colorTextDescription: '#8E8E93',   // Gris titanio para subtítulos, datos secundarios y placeholders
    colorTextPlaceholder: '#636366',   // Placeholder atenuado
    colorBorder: '#2C2C32',            // Líneas sutiles de separación para no saturar el backoffice
    colorBorderSecondary: '#1C1C22',   // Separadores secundarios
    colorSplit: '#1C1C22',             // Divisores de listas y dropdowns

    // Control de sombras de lujo (difusas y oscuras, sin bordes toscos)
    boxShadowSecondary: '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
    boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.35)',

    // Estados funcionales armónicos
    colorSuccess: '#30D158', // Verde radar / chofer en línea
    colorWarning: '#FF9F0A', // Ámbar ejecutivo / abordaje
    colorError: '#FF453A',   // Rojo alerta / cancelación o SOS
    colorInfo: '#0A84FF',    // Azul telemetría
  },

  components: {
    // ═════════════════════════════════════════════════════════════════
    // COMPONENT OVERRIDES (Sobrescritura de componentes críticos)
    // ═════════════════════════════════════════════════════════════════

    // 1. Table: Fondo de cabecera en #1C1C22, texto en #F5F5F7, bordes delgados antifatiga
    Table: {
      headerBg: '#1C1C22',
      headerColor: '#F5F5F7',
      headerSplitColor: 'transparent',
      colorBgContainer: '#141418',
      rowHoverBg: 'rgba(255, 255, 255, 0.04)',
      borderColor: '#2C2C32',
      headerBorderRadius: 6,
      fontSize: 13,
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    // 2. Button: Botón primario blanco con texto negro asfalto (#0A0A0C) y hover #E5E5EA
    Button: {
      colorPrimary: '#FFFFFF',
      colorPrimaryHover: '#E5E5EA',       // Efecto metálico cromado suave al pasar el cursor
      colorPrimaryActive: '#D1D1D6',      // Estado presionado
      primaryColor: '#0A0A0C',            // Texto negro para contraste absoluto
      fontWeight: 600,
      defaultBg: '#141418',
      defaultBorderColor: '#2C2C32',
      defaultColor: '#F5F5F7',
      defaultHoverBg: '#1C1C22',
      defaultHoverBorderColor: '#3A3A42',
      defaultHoverColor: '#FFFFFF',
      controlHeight: 38,
      controlHeightLG: 46,
      controlHeightSM: 30,
    },

    // 3. Menu / Layout: Menú lateral hereda fondo #0A0A0C y estados activos en blanco
    Layout: {
      bodyBg: '#0A0A0C',
      headerBg: '#0A0A0C',
      siderBg: '#0A0A0C',
      footerBg: '#0A0A0C',
    },
    Menu: {
      darkItemBg: '#0A0A0C',
      itemBg: '#0A0A0C',
      itemColor: '#8E8E93',               // Titanio apagado en reposo
      itemHoverColor: '#FFFFFF',          // Blanco platino al pasar el cursor
      itemHoverBg: 'rgba(255, 255, 255, 0.05)',
      itemSelectedColor: '#0A0A0C',       // Texto en contraste negro
      itemSelectedBg: '#FFFFFF',          // Píldora activa blanco puro
      itemBorderRadius: 6,
      itemMarginInline: 8,
      iconSize: 16,
      fontSize: 13,
    },

    // 4. Inputs & Formularios
    Input: {
      colorBgContainer: '#141418',
      colorBorder: '#2C2C32',
      colorText: '#F5F5F7',
      colorTextPlaceholder: '#636366',
      activeBorderColor: '#FFFFFF',       // Focus ring cromado
      hoverBorderColor: '#8E8E93',
      controlHeight: 38,
    },
    Select: {
      colorBgContainer: '#141418',
      colorBgElevated: '#1C1C22',
      colorBorder: '#2C2C32',
      colorText: '#F5F5F7',
      colorPrimary: '#FFFFFF',
      optionSelectedBg: 'rgba(255, 255, 255, 0.08)',
      controlHeight: 38,
    },

    // 5. Modales y Diálogos
    Modal: {
      contentBg: '#1C1C22',
      headerBg: '#1C1C22',
      footerBg: '#1C1C22',
      titleColor: '#F5F5F7',
    },

    // 6. Tarjetas (Cards)
    Card: {
      colorBgContainer: '#141418',
      colorBorderSecondary: '#2C2C32',
      headerHeight: 52,
    },

    // 7. Badges y Tags
    Tag: {
      borderRadiusSM: 4,
      defaultBg: '#1C1C22',
      defaultColor: '#8E8E93',
    },
  },
};
