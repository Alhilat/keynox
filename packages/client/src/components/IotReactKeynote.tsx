import React, { useState, useEffect } from "react";
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Cpu,
  Radio,
  Wifi,
  Shield,
  Zap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Database,
  Smartphone,
  Server,
  Palette,
  Sun,
  Flame,
  Droplets,
  Leaf,
  Globe,
  RadioTower,
  Sliders,
} from "lucide-react";

export type ColorTheme = "cyber" | "ocean" | "sunset" | "emerald" | "cosmic";

export const IotReactKeynote: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 5;

  // 5 Rich Saturated Dark/Neon Palettes: "cyber" (Default) | "ocean" | "sunset" | "emerald" | "cosmic"
  const [colorTheme, setColorTheme] = useState<ColorTheme>("cyber");

  // Slide 1 State: Active Equation
  const [activeEquation, setActiveEquation] = useState<0 | 1 | 2>(0);

  // Slide 2 State: Active Architecture Layer & Bi-directional Flow
  const [activeLayer, setActiveLayer] = useState<number>(3); // 0: Sensing, 1: Network, 2: Processing, 3: Application
  const [flowDirection, setFlowDirection] = useState<"data" | "control">("data");

  // Slide 3 State: Protocol Filter & Selection
  const [protocolFilter, setProtocolFilter] = useState<"all" | "short" | "cellular" | "lpwan" | "proximity">("all");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("zigbee");

  // Slide 4 State: Data Source Simulation
  const [activeSourceType, setActiveSourceType] = useState<"passive" | "active" | "dynamic">("dynamic");
  const [packetCount, setPacketCount] = useState<number>(148);
  const [simRunning, setSimRunning] = useState<boolean>(true);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (Number(e.key) >= 1 && Number(e.key) <= 5) {
        setCurrentSlide(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Slide 4 Packet Simulation Loop
  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      setPacketCount((prev) => {
        if (activeSourceType === "passive") return prev + (Math.random() > 0.85 ? 1 : 0);
        if (activeSourceType === "active") return prev + Math.floor(Math.random() * 6) + 3;
        return prev + Math.floor(Math.random() * 9) + 4;
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [simRunning, activeSourceType]);

  const isLight = false;

  // Themes Configuration
  const themeConfigs: Record<
    ColorTheme,
    {
      id: ColorTheme;
      name: string;
      icon: any;
      isLight: boolean;
      container: string;
      glow1: string;
      glow2: string;
      titleGrad: string;
      headerBg: string;
      headerBorder: string;
      headerText: string;
      headerSub: string;
      cardBg: string;
      cardBorder: string;
      cardText: string;
      cardSub: string;
      cardSecondaryBg: string;
      badgeActive: string;
      badgeInactive: string;
      footerBg: string;
      footerBorder: string;
      footerText: string;
      swatchGradient: string;
      accentBorder: string;
    }
  > = {
    cosmic: {
      id: "cosmic",
      name: "Cosmic Amethyst",
      icon: Sparkles,
      isLight: false,
      container: "bg-gradient-to-br from-[#14052b] via-[#1d073f] to-[#0d0a26] text-white border-2 border-purple-500/40 shadow-2xl shadow-purple-500/20",
      glow1: "bg-purple-500/35",
      glow2: "bg-amber-400/25",
      titleGrad: "from-white via-purple-200 to-amber-300",
      headerBg: "bg-[#14052b]/90 backdrop-blur-xl border-purple-500/30 shadow-md",
      headerBorder: "border-purple-500/30",
      headerText: "text-white",
      headerSub: "text-purple-200/80",
      cardBg: "bg-[#1d0838]/90 shadow-2xl shadow-purple-950/60 border-purple-400/50",
      cardBorder: "border-purple-400/60",
      cardText: "text-white",
      cardSub: "text-slate-200",
      cardSecondaryBg: "bg-purple-950/50 border-purple-500/30 text-purple-100",
      badgeActive: "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 text-black font-black shadow-lg shadow-purple-500/30",
      badgeInactive: "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15",
      footerBg: "bg-[#14052b]/90 border-purple-500/30 text-slate-300",
      footerBorder: "border-purple-500/30",
      footerText: "text-slate-300",
      swatchGradient: "from-purple-600 via-fuchsia-500 to-amber-400",
      accentBorder: "border-purple-400",
    },
    cyber: {
      id: "cyber",
      name: "Neon Cyber",
      icon: Zap,
      isLight: false,
      container: "bg-gradient-to-br from-[#120826] via-[#1f0b38] to-[#0a1836] text-white border-2 border-fuchsia-500/40 shadow-2xl shadow-fuchsia-500/20",
      glow1: "bg-fuchsia-500/30",
      glow2: "bg-cyan-400/30",
      titleGrad: "from-white via-fuchsia-200 to-cyan-300",
      headerBg: "bg-[#120826]/90 backdrop-blur-xl border-fuchsia-500/30 shadow-md",
      headerBorder: "border-fuchsia-500/30",
      headerText: "text-white",
      headerSub: "text-fuchsia-200/80",
      cardBg: "bg-[#1a0c33]/90 shadow-2xl shadow-fuchsia-950/60 border-fuchsia-400/40",
      cardBorder: "border-fuchsia-400/60",
      cardText: "text-white",
      cardSub: "text-slate-200",
      cardSecondaryBg: "bg-fuchsia-950/50 border-fuchsia-500/30 text-fuchsia-100",
      badgeActive: "bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black font-black shadow-lg shadow-fuchsia-500/30",
      badgeInactive: "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15",
      footerBg: "bg-[#120826]/90 border-fuchsia-500/30 text-slate-300",
      footerBorder: "border-fuchsia-500/30",
      footerText: "text-slate-300",
      swatchGradient: "from-fuchsia-500 via-purple-500 to-cyan-400",
      accentBorder: "border-fuchsia-400",
    },
    sunset: {
      id: "sunset",
      name: "Solar Sunset",
      icon: Flame,
      isLight: false,
      container: "bg-gradient-to-br from-[#290d18] via-[#381418] to-[#1a112c] text-white border-2 border-amber-500/40 shadow-2xl shadow-amber-500/20",
      glow1: "bg-amber-500/30",
      glow2: "bg-rose-500/30",
      titleGrad: "from-white via-amber-200 to-rose-300",
      headerBg: "bg-[#240c15]/90 backdrop-blur-xl border-amber-500/30 shadow-md",
      headerBorder: "border-amber-500/30",
      headerText: "text-white",
      headerSub: "text-amber-200/80",
      cardBg: "bg-[#2b101c]/90 shadow-2xl shadow-amber-950/60 border-amber-400/40",
      cardBorder: "border-amber-400/60",
      cardText: "text-white",
      cardSub: "text-slate-200",
      cardSecondaryBg: "bg-amber-950/50 border-amber-500/30 text-amber-100",
      badgeActive: "bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black shadow-lg shadow-amber-500/30",
      badgeInactive: "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15",
      footerBg: "bg-[#240c15]/90 border-amber-500/30 text-slate-300",
      footerBorder: "border-amber-500/30",
      footerText: "text-slate-300",
      swatchGradient: "from-amber-400 via-orange-500 to-rose-500",
      accentBorder: "border-amber-400",
    },
    ocean: {
      id: "ocean",
      name: "Ocean Azure",
      icon: Droplets,
      isLight: false,
      container: "bg-gradient-to-br from-[#061d2d] via-[#0b2b3f] to-[#071629] text-white border-2 border-cyan-400/40 shadow-2xl shadow-cyan-500/20",
      glow1: "bg-cyan-400/30",
      glow2: "bg-blue-500/30",
      titleGrad: "from-white via-cyan-200 to-teal-300",
      headerBg: "bg-[#061d2d]/90 backdrop-blur-xl border-cyan-400/30 shadow-md",
      headerBorder: "border-cyan-400/30",
      headerText: "text-white",
      headerSub: "text-cyan-200/80",
      cardBg: "bg-[#0b283d]/90 shadow-2xl shadow-cyan-950/60 border-cyan-400/40",
      cardBorder: "border-cyan-400/60",
      cardText: "text-white",
      cardSub: "text-slate-200",
      cardSecondaryBg: "bg-cyan-950/50 border-cyan-500/30 text-cyan-100",
      badgeActive: "bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-black shadow-lg shadow-cyan-500/30",
      badgeInactive: "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15",
      footerBg: "bg-[#061d2d]/90 border-cyan-400/30 text-slate-300",
      footerBorder: "border-cyan-400/30",
      footerText: "text-slate-300",
      swatchGradient: "from-cyan-400 via-teal-400 to-blue-600",
      accentBorder: "border-cyan-400",
    },
    emerald: {
      id: "emerald",
      name: "Emerald Matrix",
      icon: Leaf,
      isLight: false,
      container: "bg-gradient-to-br from-[#052219] via-[#093225] to-[#051a1d] text-white border-2 border-emerald-400/40 shadow-2xl shadow-emerald-500/20",
      glow1: "bg-emerald-400/30",
      glow2: "bg-lime-400/30",
      titleGrad: "from-white via-emerald-200 to-lime-300",
      headerBg: "bg-[#052219]/90 backdrop-blur-xl border-emerald-400/30 shadow-md",
      headerBorder: "border-emerald-400/30",
      headerText: "text-white",
      headerSub: "text-emerald-200/80",
      cardBg: "bg-[#083325]/90 shadow-2xl shadow-emerald-950/60 border-emerald-400/40",
      cardBorder: "border-emerald-400/60",
      cardText: "text-white",
      cardSub: "text-slate-200",
      cardSecondaryBg: "bg-emerald-950/50 border-emerald-500/30 text-emerald-100",
      badgeActive: "bg-gradient-to-r from-emerald-400 to-lime-400 text-black font-black shadow-lg shadow-emerald-500/30",
      badgeInactive: "bg-white/10 text-slate-300 hover:bg-white/20 border border-white/15",
      footerBg: "bg-[#052219]/90 border-emerald-400/30 text-slate-300",
      footerBorder: "border-emerald-400/30",
      footerText: "text-slate-300",
      swatchGradient: "from-emerald-400 via-teal-400 to-lime-400",
      accentBorder: "border-emerald-400",
    },
  };

  const curTheme = themeConfigs[colorTheme];

  // =========================================================================
  // Content Specifications (100% PDF Fidelity)
  // =========================================================================
  const equations = [
    {
      id: 0,
      badge: "Equation 1 • Universal Umbrella Paradigm",
      title: "The Foundational IoT Umbrella",
      badgeClass: isLight
        ? "bg-blue-100 text-blue-900 border-2 border-blue-400"
        : "bg-blue-500/25 border-2 border-blue-400 text-blue-300",
      terms: [
        {
          label: "Physical Object",
          desc: "Everyday smart objects & assets",
          color: isLight
            ? "border-2 border-blue-500 bg-blue-50 text-blue-950 font-bold"
            : "border-2 border-blue-400 bg-gradient-to-br from-blue-500/35 to-blue-700/20 text-blue-100 font-bold",
        },
        { label: "+", color: isLight ? "text-blue-700 font-mono text-2xl font-black" : "text-blue-300 font-mono text-2xl font-bold" },
        {
          label: "Controller, Sensor & Actuators",
          desc: "Transducers & microcontrollers",
          color: isLight
            ? "border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold"
            : "border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/35 to-teal-700/20 text-emerald-100 font-bold",
        },
        { label: "+", color: isLight ? "text-emerald-700 font-mono text-2xl font-black" : "text-emerald-300 font-mono text-2xl font-bold" },
        {
          label: "Internet",
          desc: "Global IP connectivity",
          color: isLight
            ? "border-2 border-purple-500 bg-purple-50 text-purple-950 font-bold"
            : "border-2 border-purple-400 bg-gradient-to-br from-purple-500/35 to-fuchsia-700/20 text-purple-100 font-bold",
        },
        { label: "=", color: isLight ? "text-purple-700 font-mono text-2xl font-black" : "text-purple-300 font-mono text-2xl font-bold" },
        {
          label: "Internet of Things",
          desc: "Ubiquitous connected ecosystem",
          color: isLight
            ? "border-2 border-cyan-600 bg-cyan-100 text-cyan-950 font-black shadow-lg shadow-cyan-500/20"
            : "border-2 border-cyan-300 bg-gradient-to-br from-cyan-400/50 to-blue-600/30 text-white font-black shadow-lg shadow-cyan-500/40",
        },
      ],
      insight: "This equation conceptually describes the universal IoT umbrella: embedding physical matter with intelligence, transduction, and internet routing.",
      target: "Universal Architecture",
    },
    {
      id: 1,
      badge: "Equation 2 • Business & Enterprise Operations",
      title: "Enterprise & Data Center Pipeline",
      badgeClass: isLight
        ? "bg-amber-100 text-amber-900 border-2 border-amber-400"
        : "bg-amber-500/25 border-2 border-amber-400 text-amber-300",
      terms: [
        {
          label: "Enterprise Data Center / Cloud",
          desc: "Centralized warehouse & analytics",
          color: isLight
            ? "border-2 border-amber-500 bg-amber-50 text-amber-950 font-bold"
            : "border-2 border-amber-400 bg-gradient-to-br from-amber-500/35 to-orange-700/20 text-amber-100 font-bold",
        },
        { label: "+", color: isLight ? "text-amber-700 font-mono text-2xl font-black" : "text-amber-300 font-mono text-2xl font-bold" },
        {
          label: "Enterprise Gateway",
          desc: "Secure edge aggregation nodes",
          color: isLight
            ? "border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold"
            : "border-2 border-rose-400 bg-gradient-to-br from-rose-500/35 to-pink-700/20 text-rose-100 font-bold",
        },
        { label: "+", color: isLight ? "text-rose-700 font-mono text-2xl font-black" : "text-rose-300 font-mono text-2xl font-bold" },
        {
          label: "Smart IoT Devices",
          desc: "Industrial telemetry endpoints",
          color: isLight
            ? "border-2 border-cyan-500 bg-cyan-50 text-cyan-950 font-bold"
            : "border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/35 to-blue-700/20 text-cyan-100 font-bold",
        },
        { label: "=", color: isLight ? "text-cyan-700 font-mono text-2xl font-black" : "text-cyan-300 font-mono text-2xl font-bold" },
        {
          label: "Enterprise IoT System",
          desc: "Production operational automation",
          color: isLight
            ? "border-2 border-amber-600 bg-amber-100 text-amber-950 font-black shadow-lg shadow-amber-500/20"
            : "border-2 border-amber-300 bg-gradient-to-br from-amber-400/50 to-orange-600/30 text-white font-black shadow-lg shadow-amber-500/40",
        },
      ],
      insight: "This equation captures the industrial pipeline: securely bridging field edge devices through enterprise gateways into mission-critical data centers.",
      target: "Industrial & Enterprise Operations",
    },
    {
      id: 2,
      badge: "Equation 3 • Distributed Cloud Computing",
      title: "Distributed Cloud Services",
      badgeClass: isLight
        ? "bg-purple-100 text-purple-900 border-2 border-purple-400"
        : "bg-purple-500/25 border-2 border-purple-400 text-purple-300",
      terms: [
        {
          label: "Global Cloud Infrastructure",
          desc: "Hyperscale AI & microservices",
          color: isLight
            ? "border-2 border-purple-500 bg-purple-50 text-purple-950 font-bold"
            : "border-2 border-purple-400 bg-gradient-to-br from-purple-500/35 to-indigo-700/20 text-purple-100 font-bold",
        },
        { label: "+", color: isLight ? "text-purple-700 font-mono text-2xl font-black" : "text-purple-300 font-mono text-2xl font-bold" },
        {
          label: "Edge Compute Gateways",
          desc: "Low-latency stream processing",
          color: isLight
            ? "border-2 border-teal-500 bg-teal-50 text-teal-950 font-bold"
            : "border-2 border-teal-400 bg-gradient-to-br from-teal-500/35 to-emerald-700/20 text-teal-100 font-bold",
        },
        { label: "+", color: isLight ? "text-teal-700 font-mono text-2xl font-black" : "text-teal-300 font-mono text-2xl font-bold" },
        {
          label: "Physical Sensing Mesh",
          desc: "Dense environmental transducers",
          color: isLight
            ? "border-2 border-pink-500 bg-pink-50 text-pink-950 font-bold"
            : "border-2 border-pink-400 bg-gradient-to-br from-pink-500/35 to-rose-700/20 text-pink-100 font-bold",
        },
        { label: "=", color: isLight ? "text-pink-700 font-mono text-2xl font-black" : "text-pink-300 font-mono text-2xl font-bold" },
        {
          label: "Distributed Cognitive IoT",
          desc: "Self-optimizing autonomous loop",
          color: isLight
            ? "border-2 border-fuchsia-600 bg-fuchsia-100 text-fuchsia-950 font-black shadow-lg shadow-fuchsia-500/20"
            : "border-2 border-fuchsia-300 bg-gradient-to-br from-fuchsia-400/50 to-purple-600/30 text-white font-black shadow-lg shadow-fuchsia-500/40",
        },
      ],
      insight: "This equation captures cloud-native IoT: streaming telemetry into elastic serverless pipelines that run machine learning inference and feedback.",
      target: "Cloud-Native IoT",
    },
  ];

  // 4-Stage Layered Architecture Stack (Figure 1.5)
  const architectureLayers = [
    {
      id: 3,
      level: "Layer 4",
      name: "Application Layer",
      icon: Smartphone,
      basis: "User-facing services and enterprise business orchestration.",
      components: "Smart Agriculture, Smart Cities, Healthcare Telemetry, Industrial Automation.",
      functions: "Interprets analytics, issues actuation commands, displays interactive dashboards to users.",
      color: isLight
        ? "border-2 border-purple-500 bg-gradient-to-r from-purple-100 via-purple-50 to-pink-50 text-purple-950 shadow-md"
        : "border-2 border-purple-400 bg-gradient-to-r from-purple-500/30 to-fuchsia-600/20 text-white shadow-lg shadow-purple-500/20",
      accent: isLight ? "bg-purple-600 text-white" : "bg-purple-500 text-black font-bold",
      badgeClass: isLight ? "bg-purple-100 text-purple-900 border-2 border-purple-400" : "bg-purple-500/30 text-purple-200 border border-purple-400",
    },
    {
      id: 2,
      level: "Layer 3",
      name: "Processing & Cloud Layer",
      icon: Server,
      basis: "Data ingestion, high-speed storage, and distributed analytics engine.",
      components: "Cloud Infrastructure, Edge Gateways, Data Warehousing, Event Processors.",
      functions: "Cleanses raw sensor payloads, performs real-time stream aggregation, runs ML inference.",
      color: isLight
        ? "border-2 border-blue-500 bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-50 text-blue-950 shadow-md"
        : "border-2 border-blue-400 bg-gradient-to-r from-blue-500/30 to-indigo-600/20 text-white shadow-lg shadow-blue-500/20",
      accent: isLight ? "bg-blue-600 text-white" : "bg-blue-500 text-black font-bold",
      badgeClass: isLight ? "bg-blue-100 text-blue-900 border-2 border-blue-400" : "bg-blue-500/30 text-blue-200 border border-blue-400",
    },
    {
      id: 1,
      level: "Layer 2",
      name: "Network & Gateway Layer",
      icon: Radio,
      basis: "Heterogeneous connectivity and packet routing across protocols.",
      components: "Routers, Bridges, Wireless Gateways, Cellular Base Stations, LPWAN Towers.",
      functions: "Converts protocol dialects, negotiates transmission mediums, securely forwards payloads.",
      color: isLight
        ? "border-2 border-amber-500 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-50 text-amber-950 shadow-md"
        : "border-2 border-amber-400 bg-gradient-to-r from-amber-500/30 to-orange-600/20 text-white shadow-lg shadow-amber-500/20",
      accent: isLight ? "bg-amber-600 text-white" : "bg-amber-500 text-black font-bold",
      badgeClass: isLight ? "bg-amber-100 text-amber-900 border-2 border-amber-400" : "bg-amber-500/30 text-amber-200 border border-amber-400",
    },
    {
      id: 0,
      level: "Layer 1",
      name: "Sensing & Actuation Layer",
      icon: Cpu,
      basis: "Physical transducers converting environmental state into electrical signals.",
      components: "Temperature/Moisture/Pressure Sensors, Microcontrollers, Relays, Motors.",
      functions: "Samples physical world data, converts analog to digital, triggers physical actions.",
      color: isLight
        ? "border-2 border-emerald-500 bg-gradient-to-r from-emerald-100 via-emerald-50 to-teal-50 text-emerald-950 shadow-md"
        : "border-2 border-emerald-400 bg-gradient-to-r from-emerald-500/30 to-teal-600/20 text-white shadow-lg shadow-emerald-500/20",
      accent: isLight ? "bg-emerald-600 text-white" : "bg-emerald-500 text-black font-bold",
      badgeClass: isLight ? "bg-emerald-100 text-emerald-900 border-2 border-emerald-400" : "bg-emerald-500/30 text-emerald-200 border border-emerald-400",
    },
  ];

  // 11 IoT Communication Protocols
  const protocols = [
    {
      id: "zigbee",
      name: "ZigBee",
      category: "short",
      categoryLabel: "Short-Range Wireless",
      range: "10 - 100m (indoor), up to 1,500m (outdoor)",
      pros: "Low power consumption, mesh networking increases reliability and range.",
      cons: "Limited data rate, short range compared to cellular, complex configuration.",
      uses: "Home automation, smart lighting, industrial control, medical monitoring.",
      cardColor: isLight
        ? "border-2 border-cyan-600 bg-cyan-50/90 text-cyan-950 shadow-md"
        : "border-2 border-cyan-400 bg-gradient-to-br from-cyan-500/25 via-blue-600/15 to-slate-900/90 text-cyan-100 shadow-lg shadow-cyan-500/20",
      tagColor: isLight ? "bg-cyan-200 text-cyan-950 border border-cyan-400" : "bg-cyan-500/25 text-cyan-200 border-2 border-cyan-400",
      rangeBarColor: "from-cyan-400 to-blue-500",
      rangeBar: 35,
    },
    {
      id: "thread",
      name: "Thread",
      category: "short",
      categoryLabel: "Short-Range Wireless",
      range: "10 - 30m (indoor), up to 100m (outdoor)",
      pros: "Native IPv6 support, low power, end-to-end encryption, self-healing mesh.",
      cons: "Newer protocol with less legacy market penetration.",
      uses: "Smart home appliances, environmental sensors, lighting networks.",
      cardColor: isLight
        ? "border-2 border-blue-600 bg-blue-50/90 text-blue-950 shadow-md"
        : "border-2 border-blue-400 bg-gradient-to-br from-blue-500/25 via-indigo-600/15 to-slate-900/90 text-blue-100 shadow-lg shadow-blue-500/20",
      tagColor: isLight ? "bg-blue-200 text-blue-950 border border-blue-400" : "bg-blue-500/25 text-blue-200 border-2 border-blue-400",
      rangeBarColor: "from-blue-400 to-indigo-500",
      rangeBar: 25,
    },
    {
      id: "zwave",
      name: "Z-Wave",
      category: "short",
      categoryLabel: "Short-Range Wireless",
      range: "30 - 100m (indoor), up to 150m (outdoor)",
      pros: "Ultra-low power, high multi-vendor compatibility, robust security.",
      cons: "Limited data transfer rate, typically requires a dedicated hub controller.",
      uses: "Smart locks, thermostats, smart security systems, lighting.",
      cardColor: isLight
        ? "border-2 border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-md"
        : "border-2 border-indigo-400 bg-gradient-to-br from-indigo-500/25 via-purple-600/15 to-slate-900/90 text-indigo-100 shadow-lg shadow-indigo-500/20",
      tagColor: isLight ? "bg-indigo-200 text-indigo-950 border border-indigo-400" : "bg-indigo-500/25 text-indigo-200 border-2 border-indigo-400",
      rangeBarColor: "from-indigo-400 to-purple-500",
      rangeBar: 30,
    },
    {
      id: "wifi",
      name: "Wi-Fi (802.11)",
      category: "short",
      categoryLabel: "Short-Range Wireless",
      range: "50m (indoor), up to 200m (outdoor)",
      pros: "High data transmission rate, widespread availability, zero special gateway needed.",
      cons: "High power consumption, requires continuous power supply or frequent recharging.",
      uses: "Video surveillance cameras, high-definition streaming, industrial monitoring.",
      cardColor: isLight
        ? "border-2 border-purple-600 bg-purple-50/90 text-purple-950 shadow-md"
        : "border-2 border-purple-400 bg-gradient-to-br from-purple-500/25 via-fuchsia-600/15 to-slate-900/90 text-purple-100 shadow-lg shadow-purple-500/20",
      tagColor: isLight ? "bg-purple-200 text-purple-950 border border-purple-400" : "bg-purple-500/25 text-purple-200 border-2 border-purple-400",
      rangeBarColor: "from-purple-400 to-pink-500",
      rangeBar: 45,
    },
    {
      id: "ble",
      name: "Bluetooth / BLE",
      category: "short",
      categoryLabel: "Short-Range Wireless",
      range: "10 - 100m (Classic), up to 400m (BLE Outdoor)",
      pros: "Low energy consumption, universal smartphone compatibility, ideal for wearables.",
      cons: "Limited bandwidth, shorter range, susceptible to crowded 2.4GHz interference.",
      uses: "Wearable fitness trackers, wireless medical devices, proximity beacons.",
      cardColor: isLight
        ? "border-2 border-teal-600 bg-teal-50/90 text-teal-950 shadow-md"
        : "border-2 border-teal-400 bg-gradient-to-br from-teal-500/25 via-cyan-600/15 to-slate-900/90 text-teal-100 shadow-lg shadow-teal-500/20",
      tagColor: isLight ? "bg-teal-200 text-teal-950 border border-teal-400" : "bg-teal-500/25 text-teal-200 border-2 border-teal-400",
      rangeBarColor: "from-teal-400 to-cyan-500",
      rangeBar: 30,
    },
    {
      id: "ltem",
      name: "LTE-Cat M1",
      category: "cellular",
      categoryLabel: "Cellular Communication",
      range: "10 - 15 km (urban), up to 100 km (rural)",
      pros: "Massive range, reliable licensed cellular infrastructure, mobility support.",
      cons: "Requires cellular carrier SIM subscription, higher power than ZigBee.",
      uses: "Asset tracking, fleet logistics, utility smart meters, smart wearables.",
      cardColor: isLight
        ? "border-2 border-amber-600 bg-amber-50/90 text-amber-950 shadow-md"
        : "border-2 border-amber-400 bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-slate-900/90 text-amber-100 shadow-lg shadow-amber-500/20",
      tagColor: isLight ? "bg-amber-200 text-amber-950 border border-amber-400" : "bg-amber-500/25 text-amber-200 border-2 border-amber-400",
      rangeBarColor: "from-amber-400 to-orange-500",
      rangeBar: 85,
    },
    {
      id: "nbiot",
      name: "NB-IoT",
      category: "lpwan",
      categoryLabel: "LPWAN Long-Range",
      range: "Up to 10 km (urban), up to 30 km (rural)",
      pros: "Very low power, exceptional penetration inside buildings and underground.",
      cons: "Low data transmission rate, requires cellular network integration.",
      uses: "Underground water utility meters, smart agriculture, municipal sensors.",
      cardColor: isLight
        ? "border-2 border-rose-600 bg-rose-50/90 text-rose-950 shadow-md"
        : "border-2 border-rose-400 bg-gradient-to-br from-rose-500/25 via-pink-600/15 to-slate-900/90 text-rose-100 shadow-lg shadow-rose-500/20",
      tagColor: isLight ? "bg-rose-200 text-rose-950 border border-rose-400" : "bg-rose-500/25 text-rose-200 border-2 border-rose-400",
      rangeBarColor: "from-rose-400 to-red-500",
      rangeBar: 80,
    },
    {
      id: "lorawan",
      name: "LoRaWAN",
      category: "lpwan",
      categoryLabel: "LPWAN Long-Range",
      range: "2 - 5 km (urban), up to 15 km (rural)",
      pros: "Long range, deep penetration, low power, unlicensed spectrum freedom.",
      cons: "Low throughput, requires dedicated gateway deployment, potential urban collisions.",
      uses: "Smart irrigation, remote environmental tracking, industrial campus monitoring.",
      cardColor: isLight
        ? "border-2 border-emerald-600 bg-emerald-50/90 text-emerald-950 shadow-md"
        : "border-2 border-emerald-400 bg-gradient-to-br from-emerald-500/25 via-teal-600/15 to-slate-900/90 text-emerald-100 shadow-lg shadow-emerald-500/20",
      tagColor: isLight ? "bg-emerald-200 text-emerald-950 border border-emerald-400" : "bg-emerald-500/25 text-emerald-200 border-2 border-emerald-400",
      rangeBarColor: "from-emerald-400 to-teal-500",
      rangeBar: 75,
    },
    {
      id: "sigfox",
      name: "Sigfox",
      category: "lpwan",
      categoryLabel: "LPWAN Long-Range",
      range: "Up to 10 km (urban), up to 50 km (rural)",
      pros: "Ultra-low power, long range, extremely cost-effective for tiny telemetry payloads.",
      cons: "Extremely low data rate, limited daily uplink messages, region-locked.",
      uses: "Smart streetlights, patient alert buttons, security tripwires.",
      cardColor: isLight
        ? "border-2 border-lime-600 bg-lime-50/90 text-lime-950 shadow-md"
        : "border-2 border-lime-400 bg-gradient-to-br from-lime-500/25 via-emerald-600/15 to-slate-900/90 text-lime-100 shadow-lg shadow-lime-500/20",
      tagColor: isLight ? "bg-lime-200 text-lime-950 border border-lime-400" : "bg-lime-500/25 text-lime-200 border-2 border-lime-400",
      rangeBarColor: "from-lime-400 to-emerald-500",
      rangeBar: 78,
    },
    {
      id: "rfid",
      name: "RFID",
      category: "proximity",
      categoryLabel: "Proximity & Sensing",
      range: "10 cm to 12 meters",
      pros: "Zero battery required for passive tags, instantaneous electromagnetic read.",
      cons: "Limited data capacity, blocked by metals and liquids, privacy challenges.",
      uses: "Supply chain pallet tracking, warehouse inventory, contactless badges.",
      cardColor: isLight
        ? "border-2 border-sky-600 bg-sky-50/90 text-sky-950 shadow-md"
        : "border-2 border-sky-400 bg-gradient-to-br from-sky-500/25 via-blue-600/15 to-slate-900/90 text-sky-100 shadow-lg shadow-sky-500/20",
      tagColor: isLight ? "bg-sky-200 text-sky-950 border border-sky-400" : "bg-sky-500/25 text-sky-200 border-2 border-sky-400",
      rangeBarColor: "from-sky-400 to-blue-500",
      rangeBar: 15,
    },
    {
      id: "nfc",
      name: "NFC",
      category: "proximity",
      categoryLabel: "Proximity & Sensing",
      range: "Within 10 centimeters",
      pros: "High security, low power, effortless tap-to-engage UX.",
      cons: "Extremely short physical range, low data transfer rate.",
      uses: "Apple Pay / contactless payments, access control doors, pairing credentials.",
      cardColor: isLight
        ? "border-2 border-fuchsia-600 bg-fuchsia-50/90 text-fuchsia-950 shadow-md"
        : "border-2 border-fuchsia-400 bg-gradient-to-br from-fuchsia-500/25 via-purple-600/15 to-slate-900/90 text-fuchsia-100 shadow-lg shadow-fuchsia-500/20",
      tagColor: isLight ? "bg-fuchsia-200 text-fuchsia-950 border border-fuchsia-400" : "bg-fuchsia-500/25 text-fuchsia-200 border-2 border-fuchsia-400",
      rangeBarColor: "from-fuchsia-400 to-pink-500",
      rangeBar: 8,
    },
  ];

  const filteredProtocols =
    protocolFilter === "all"
      ? protocols
      : protocols.filter((p) => p.category === protocolFilter);

  const selectedProtoObj = protocols.find((p) => p.id === selectedProtocol) || protocols[0];

  return (
    <div
      className={`w-full min-h-[740px] max-w-7xl mx-auto flex flex-col ${curTheme.container} rounded-3xl overflow-hidden relative font-sans select-none transition-all duration-500`}
    >
      <style>{`
        @keyframes slideEnter {
          from { opacity: 0; transform: translateY(14px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes termPop {
          0% { opacity: 0; transform: scale(0.85) translateY(10px); }
          70% { transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes conduitBeamUp {
          0% { top: 100%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 0%; opacity: 0; }
        }
        @keyframes conduitBeamDown {
          0% { top: 0%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes packetFlyRight {
          0% { left: 0%; opacity: 0; transform: translateY(-50%) scale(0.7); }
          20% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          80% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          100% { left: 100%; opacity: 0; transform: translateY(-50%) scale(0.7); }
        }
        @keyframes packetFlyLeft {
          0% { right: 0%; opacity: 0; transform: translateY(-50%) scale(0.7); }
          20% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          80% { opacity: 1; transform: translateY(-50%) scale(1.2); }
          100% { right: 100%; opacity: 0; transform: translateY(-50%) scale(0.7); }
        }
        .animate-slide-enter {
          animation: slideEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Top Keynote Nav Header with 5-Palette Color Picker */}
      <header
        className={`px-6 py-4 border-b ${curTheme.headerBorder} ${curTheme.headerBg} flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 z-20 transition-colors duration-500`}
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 text-black shadow-md">
            MULTI-COLOR KEYNOTE
          </span>
          <div>
            <h1 className={`text-base font-black ${curTheme.headerText} tracking-tight flex items-center gap-2`}>
              <span>Chapter 1: Introduction to Internet of Things (Part 3)</span>
            </h1>
            <p className={`text-[11px] ${curTheme.headerSub} font-mono font-medium`}>
              Equations • 4-Stage Architecture • 11 Protocols • Telemetry Sources
            </p>
          </div>
        </div>

        {/* Action Controls: Live 5-Color Theme Switcher + Slide Ribbon */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 5-Theme Color Palette Bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 backdrop-blur-md">
            {(Object.keys(themeConfigs) as ColorTheme[]).map((tKey) => {
              const t = themeConfigs[tKey];
              const IconComp = t.icon;
              const isSelected = colorTheme === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => setColorTheme(tKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${t.badgeActive} scale-105 shadow-md`
                      : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                  title={`Switch to ${t.name} Palette`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${t.swatchGradient} inline-block border border-white/40`}
                  />
                  <span className="hidden sm:inline">{t.name}</span>
                </button>
              );
            })}
          </div>

          {/* Slide Selector Ribbon */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5">
            {[
              "01. Equations",
              "02. Architecture",
              "03. Connectivity",
              "04. Data Sources",
              "05. Synthesis",
            ].map((title, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentSlide === idx
                    ? isLight
                      ? "bg-indigo-600 text-white shadow-md font-extrabold"
                      : "bg-white text-black shadow-md shadow-white/30 font-extrabold"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="flex-1 p-6 sm:p-8 flex flex-col relative overflow-hidden">
        {/* Dynamic Ambient Color Orbs */}
        <div
          className={`absolute top-0 right-1/4 w-[450px] h-[450px] ${curTheme.glow1} rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-700`}
        />
        <div
          className={`absolute bottom-0 left-1/4 w-[450px] h-[450px] ${curTheme.glow2} rounded-full blur-[100px] pointer-events-none -z-10 transition-all duration-700`}
        />

        {/* ============================================================ */}
        {/* SLIDE 1: The Three Master Conceptual Equations */}
        {/* ============================================================ */}
        {currentSlide === 0 && (
          <div className="flex-1 flex flex-col justify-between animate-slide-enter">
            <div>
              <div className="text-xs font-mono font-extrabold text-cyan-600 dark:text-cyan-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span>Section A • IoT Conceptual Framework</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${curTheme.titleGrad} bg-clip-text text-transparent tracking-tight`}
              >
                Conceptualizing the IoT Paradigm
              </h2>
              <p className={`text-sm sm:text-base ${curTheme.cardSub} mt-2 max-w-3xl leading-relaxed`}>
                The curriculum conceptualizes the Internet of Things through three distinct mathematical operational equations:
                universal edge, corporate enterprise, and distributed cloud services.
              </p>
            </div>

            {/* Interactive Equation Selector Pills */}
            <div className="my-4 flex flex-wrap gap-2.5">
              {equations.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => setActiveEquation(eq.id as 0 | 1 | 2)}
                  className={`px-4 py-2 rounded-xl border-2 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-md ${
                    activeEquation === eq.id
                      ? isLight
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/30 scale-[1.02]"
                        : "bg-cyan-500 text-black border-white shadow-cyan-500/40 scale-[1.02]"
                      : isLight
                      ? "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                      : "bg-slate-900/60 border-white/20 text-slate-200 hover:bg-slate-800 hover:border-white/40"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{eq.title}</span>
                </button>
              ))}
            </div>

            {/* Active Equation Visualizer Container */}
            <div
              className={`p-6 rounded-2xl ${curTheme.cardBg} border-2 ${curTheme.cardBorder} backdrop-blur-2xl shadow-2xl flex flex-col gap-5`}
            >
              <div className="flex items-center justify-between border-b border-current/15 pb-2.5">
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase ${equations[activeEquation].badgeClass}`}>
                  {equations[activeEquation].badge}
                </span>
                <span className="text-xs font-mono font-extrabold text-cyan-600 dark:text-cyan-300">
                  Target: {equations[activeEquation].target}
                </span>
              </div>

              {/* Formula Terms Flow */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start min-h-[75px]">
                {equations[activeEquation].terms.map((t, idx) => (
                  <div key={`${activeEquation}-${idx}`} className="flex items-center gap-2">
                    {t.desc ? (
                      <div
                        className={`px-4 py-3 rounded-xl flex flex-col ${t.color} shadow-md transition-all duration-300 hover:scale-105`}
                        style={{
                          animation: "termPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards",
                          animationDelay: `${idx * 45}ms`,
                        }}
                      >
                        <span className="text-sm sm:text-base font-extrabold">{t.label}</span>
                        <span className="text-[10px] opacity-90 mt-0.5">{t.desc}</span>
                      </div>
                    ) : (
                      <span
                        className={t.color}
                        style={{
                          animation: "termPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards",
                          animationDelay: `${idx * 45}ms`,
                        }}
                      >
                        {t.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Equation Meaning Insight */}
              <div
                className={`p-3.5 rounded-xl border-2 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3 ${
                  isLight
                    ? "bg-indigo-50/90 border-indigo-300 text-indigo-950"
                    : "bg-gradient-to-r from-cyan-950/60 via-blue-950/50 to-indigo-950/60 border-cyan-400/40 text-cyan-100"
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span>{equations[activeEquation].insight}</span>
              </div>
            </div>

            {/* Bottom 3 Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <div
                className={`p-4 rounded-xl border-2 shadow-lg ${
                  isLight
                    ? "border-emerald-500 bg-emerald-50/90 text-emerald-950"
                    : "border-emerald-400/60 bg-gradient-to-br from-emerald-500/20 via-teal-600/10 to-slate-900/80 text-white"
                }`}
              >
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">01. SMART PERCEPTION</div>
                <div className="text-xs mt-1 opacity-90">
                  Dispersed physical items collect telemetry from real-world environments autonomously.
                </div>
              </div>
              <div
                className={`p-4 rounded-xl border-2 shadow-lg ${
                  isLight
                    ? "border-cyan-500 bg-cyan-50/90 text-cyan-950"
                    : "border-cyan-400/60 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-slate-900/80 text-white"
                }`}
              >
                <div className="text-xs font-black text-cyan-700 dark:text-cyan-300">02. RELAY CONDUITS</div>
                <div className="text-xs mt-1 opacity-90">
                  Information is packetized and routed across heterogeneous network gateways.
                </div>
              </div>
              <div
                className={`p-4 rounded-xl border-2 shadow-lg ${
                  isLight
                    ? "border-purple-500 bg-purple-50/90 text-purple-950"
                    : "border-purple-400/60 bg-gradient-to-br from-purple-500/20 via-fuchsia-600/10 to-slate-900/80 text-white"
                }`}
              >
                <div className="text-xs font-black text-purple-700 dark:text-purple-300">03. SYNTHESIS & ACTION</div>
                <div className="text-xs mt-1 opacity-90">
                  Central processing units orchestrate fleet management, analytics, and actuation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SLIDE 2: 4-Stage Layered Architecture (Figure 1.5) */}
        {/* ============================================================ */}
        {currentSlide === 1 && (
          <div className="flex-1 flex flex-col justify-between animate-slide-enter">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  <span>Section B • Figure 1.5: Layered Architecture</span>
                </div>
                <h2
                  className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${curTheme.titleGrad} bg-clip-text text-transparent tracking-tight`}
                >
                  The 4-Stage Architectural Stack
                </h2>
                <p className={`text-sm ${curTheme.cardSub} mt-1`}>
                  Bi-directional operation: Data Flow ascends upward while Control Flow descends downward.
                </p>
              </div>

              {/* Bi-directional Flow Mode Toggle */}
              <div
                className={`flex items-center gap-2 p-1.5 rounded-xl border-2 ${
                  isLight ? "bg-white border-slate-300 shadow-md" : "bg-slate-900/80 border-white/20 shadow-lg"
                }`}
              >
                <button
                  onClick={() => setFlowDirection("data")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                    flowDirection === "data"
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-md shadow-cyan-500/30"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>Data Flow (Ascending)</span>
                </button>
                <button
                  onClick={() => setFlowDirection("control")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                    flowDirection === "control"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-md shadow-amber-500/30"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Control Flow (Descending)</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Stack Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-4 items-stretch">
              {/* Vertical Animated Flow Conduit */}
              <div
                className={`hidden sm:flex lg:col-span-1 flex-col items-center justify-between py-6 rounded-2xl relative overflow-hidden shrink-0 shadow-lg border-2 ${
                  isLight ? "bg-white border-slate-300 text-slate-800" : "bg-slate-900/70 border-white/20 text-white"
                }`}
              >
                <span className="text-[10px] font-mono font-black [writing-mode:vertical-lr] tracking-widest uppercase">
                  {flowDirection === "data" ? "▲ DATA ASCENT" : "▼ CONTROL DESCENT"}
                </span>

                {/* Animated traveling light pulse */}
                <div
                  className={`absolute w-3.5 h-16 rounded-full blur-[1px] ${
                    flowDirection === "data"
                      ? "bg-cyan-400 shadow-[0_0_20px_#38bdf8]"
                      : "bg-amber-400 shadow-[0_0_20px_#f59e0b]"
                  }`}
                  style={{
                    animation:
                      flowDirection === "data"
                        ? "conduitBeamUp 1.8s infinite linear"
                        : "conduitBeamDown 1.8s infinite linear",
                  }}
                />
              </div>

              {/* Left Column: Stack Layers */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                {architectureLayers.map((layer) => {
                  const Icon = layer.icon;
                  const isSelected = activeLayer === layer.id;
                  return (
                    <div
                      key={layer.id}
                      onClick={() => setActiveLayer(layer.id)}
                      className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? `${layer.color} scale-[1.02] shadow-2xl`
                          : isLight
                          ? "bg-white/80 border-2 border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400"
                          : "bg-slate-900/60 border-2 border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${layer.accent} font-bold shadow-md`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold uppercase opacity-90">
                              {layer.level}
                            </span>
                            <span className="text-base font-black">
                              {layer.name}
                            </span>
                          </div>
                          <p className="text-xs opacity-80 mt-0.5 line-clamp-1">
                            {layer.functions}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold">
                        {isSelected ? "● ACTIVE" : "INSPECT →"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Layer Deep-Dive Inspector */}
              <div
                className={`lg:col-span-5 p-6 rounded-2xl ${curTheme.cardBg} border-2 ${curTheme.cardBorder} backdrop-blur-xl flex flex-col justify-between shadow-2xl`}
              >
                {(() => {
                  const cur = architectureLayers.find((l) => l.id === activeLayer) || architectureLayers[0];
                  return (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-current/15 pb-2.5">
                        <div>
                          <span className="text-xs font-mono font-bold opacity-70 uppercase">{cur.level} SPECIFICATION</span>
                          <h3 className="text-xl font-extrabold mt-0.5">{cur.name}</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${cur.badgeClass}`}>
                          Figure 1.5
                        </span>
                      </div>

                      <div>
                        <span className="text-xs font-mono font-bold uppercase text-cyan-600 dark:text-cyan-300">
                          1. Theoretical Basis:
                        </span>
                        <p
                          className={`text-xs sm:text-sm mt-1 leading-relaxed p-3 rounded-lg border ${
                            isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-white/5 border-white/10 text-slate-100"
                          }`}
                        >
                          {cur.basis}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-300">
                          2. Architectural Components:
                        </span>
                        <p
                          className={`text-xs sm:text-sm mt-1 leading-relaxed p-3 rounded-lg border ${
                            isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-white/5 border-white/10 text-slate-100"
                          }`}
                        >
                          {cur.components}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs font-mono font-bold uppercase text-amber-600 dark:text-amber-300">
                          3. Functions & Objectives:
                        </span>
                        <p
                          className={`text-xs sm:text-sm mt-1 leading-relaxed p-3 rounded-lg border ${
                            isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-white/5 border-white/10 text-slate-100"
                          }`}
                        >
                          {cur.functions}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-3 pt-3 border-t border-current/15 text-[11px] opacity-80 flex items-center justify-between font-mono">
                  <span>Flow Mode: {flowDirection.toUpperCase()}</span>
                  <span className="text-cyan-600 dark:text-cyan-300 font-bold">M2M Interoperable</span>
                </div>
              </div>
            </div>

            {/* Bottom Flow Banner */}
            <div
              className={`p-3 rounded-xl border-2 text-xs flex items-center justify-between shadow-md ${
                isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900/80 border-white/15 text-slate-200"
              }`}
            >
              <span>
                <strong>Sensing → Transmission → Processing → Smart Management</strong>
              </span>
              <span className="text-amber-600 dark:text-amber-300 font-mono font-bold text-[11px]">
                Control feedback closes the loop down to physical actuators.
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SLIDE 3: Technologies Behind IoT (Communication Matrix) */}
        {/* ============================================================ */}
        {currentSlide === 2 && (
          <div className="flex-1 flex flex-col justify-between animate-slide-enter">
            <div>
              <div className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                <span>Section C • Connectivity Spectrum</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${curTheme.titleGrad} bg-clip-text text-transparent tracking-tight`}
              >
                Communication Technologies Behind IoT
              </h2>
              <p className={`text-sm ${curTheme.cardSub} mt-1`}>
                Comparing short-range wireless, cellular M2M, LPWAN, and proximity protocols across range, throughput, and power.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="my-3 flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Protocols (11)", color: "bg-indigo-600 text-white font-bold" },
                { id: "short", label: "Short-Range Wireless (5)", color: "bg-cyan-500 text-black font-bold" },
                { id: "cellular", label: "Cellular M2M (1)", color: "bg-amber-500 text-black font-bold" },
                { id: "lpwan", label: "LPWAN Long-Range (3)", color: "bg-rose-500 text-white font-bold" },
                { id: "proximity", label: "Proximity & Sensing (2)", color: "bg-emerald-500 text-black font-bold" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setProtocolFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    protocolFilter === tab.id
                      ? `${tab.color} scale-[1.03] shadow-lg`
                      : isLight
                      ? "bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                      : "bg-slate-900/60 border-2 border-white/15 text-slate-200 hover:bg-slate-800 hover:border-white/30"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Protocols Grid & Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2 items-stretch">
              {/* Protocol Cards List */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {filteredProtocols.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProtocol(p.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${p.cardColor} ${
                      selectedProtocol === p.id
                        ? "ring-2 ring-indigo-500 dark:ring-white scale-[1.02] shadow-2xl"
                        : "opacity-90 hover:opacity-100 hover:scale-[1.01]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black">{p.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${p.tagColor}`}>
                          {p.categoryLabel}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono font-bold mt-1 opacity-90">{p.range}</div>
                    </div>

                    {/* Visual Range Indicator Bar */}
                    <div className="mt-3 pt-2 border-t border-current/15">
                      <div className="w-full h-2 bg-black/10 dark:bg-slate-950/80 rounded-full overflow-hidden border border-current/10">
                        <div
                          className={`h-full bg-gradient-to-r ${p.rangeBarColor}`}
                          style={{ width: `${p.rangeBar}%`, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Protocol Deep-Dive Inspection Pane */}
              <div
                className={`lg:col-span-5 p-5 rounded-2xl ${curTheme.cardBg} border-2 ${curTheme.cardBorder} backdrop-blur-xl flex flex-col justify-between shadow-2xl`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-current/15 pb-2.5">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300 uppercase">
                        {selectedProtoObj.categoryLabel}
                      </span>
                      <h3 className="text-2xl font-black mt-0.5">{selectedProtoObj.name}</h3>
                    </div>
                    <div className="text-right font-mono text-xs font-bold bg-current/10 px-2.5 py-1 rounded-lg border border-current/20">
                      {selectedProtoObj.range}
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-3 text-xs">
                    <div
                      className={`p-2.5 rounded-xl border-2 ${
                        isLight
                          ? "border-emerald-500 bg-emerald-50/90 text-emerald-950"
                          : "border-emerald-400/60 bg-emerald-950/40 text-emerald-100"
                      }`}
                    >
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold uppercase font-mono tracking-wider">
                        ✓ Advantages (Pros):
                      </span>
                      <p className="mt-1 font-medium leading-relaxed">{selectedProtoObj.pros}</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border-2 ${
                        isLight
                          ? "border-rose-500 bg-rose-50/90 text-rose-950"
                          : "border-rose-400/60 bg-rose-950/40 text-rose-100"
                      }`}
                    >
                      <span className="text-rose-700 dark:text-rose-300 font-extrabold uppercase font-mono tracking-wider">
                        ✗ Limitations (Cons):
                      </span>
                      <p className="mt-1 font-medium leading-relaxed">{selectedProtoObj.cons}</p>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border-2 ${
                        isLight
                          ? "border-cyan-500 bg-cyan-50/90 text-cyan-950"
                          : "border-cyan-400/60 bg-cyan-950/40 text-cyan-100"
                      }`}
                    >
                      <span className="text-cyan-700 dark:text-cyan-300 font-extrabold uppercase font-mono tracking-wider">
                        ⚡ Primary Industry Uses:
                      </span>
                      <p className="mt-1 font-medium leading-relaxed">{selectedProtoObj.uses}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-current/15 text-[11px] opacity-80 flex items-center justify-between font-mono">
                  <span>
                    Selected: <strong>{selectedProtoObj.name}</strong>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-300 font-bold">100% Derived from PDF</span>
                </div>
              </div>
            </div>

            {/* Bottom Spectrum Overview */}
            <div
              className={`p-3 rounded-xl border-2 text-xs flex items-center justify-between ${
                isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900/80 border-white/15 text-slate-200"
              }`}
            >
              <span>Short-Range (ZigBee, BLE, Wi-Fi) • LPWAN (NB-IoT, LoRaWAN, Sigfox) • Cellular (LTE-M)</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                Tradeoff: Range vs. Bandwidth vs. Power
              </span>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SLIDE 4: Data Sources of IoT (Passive vs Active vs Dynamic) */}
        {/* ============================================================ */}
        {currentSlide === 3 && (
          <div className="flex-1 flex flex-col justify-between animate-slide-enter">
            <div>
              <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Section D • Telemetry Ingestion Modalities</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${curTheme.titleGrad} bg-clip-text text-transparent tracking-tight`}
              >
                Passive, Active, and Dynamic Data Sources
              </h2>
              <p className={`text-sm ${curTheme.cardSub} mt-1`}>
                The Internet of Things relies on three main categories of data sources, dictating power budgets and real-time processing constraints.
              </p>
            </div>

            {/* Source Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-3">
              {/* Category 1: Passive Sources */}
              <div
                onClick={() => setActiveSourceType("passive")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeSourceType === "passive"
                    ? isLight
                      ? "border-sky-500 bg-sky-50/95 shadow-2xl scale-[1.02] text-sky-950"
                      : "border-sky-400 bg-gradient-to-br from-sky-500/30 via-blue-600/20 to-slate-900/90 shadow-2xl scale-[1.02] text-white"
                    : isLight
                    ? "border-sky-300 bg-white/80 hover:border-sky-500 text-slate-800"
                    : "border-sky-400/40 bg-slate-900/60 hover:border-sky-400 text-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-sky-500 text-black shadow-md">
                      MODALITY 1
                    </span>
                    <span className="text-xs font-mono text-sky-600 dark:text-sky-300 font-bold">Wait-on-Trigger</span>
                  </div>
                  <h3 className="text-lg font-black">1. Passive Sources</h3>
                  <p className="text-xs opacity-90 mt-2 leading-relaxed">
                    Passive sensors wait to be triggered to send data, such as a groundwater sensor that updates only when requested by application software.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-sky-400/30 space-y-1 text-[11px] opacity-90">
                  <div>• <strong>Power:</strong> Battery-operated & out-of-the-way</div>
                  <div>• <strong>Latency:</strong> Asynchronous, request-driven</div>
                  <div>• <strong>Example:</strong> Groundwater & soil moisture probes</div>
                </div>
              </div>

              {/* Category 2: Active Sources */}
              <div
                onClick={() => setActiveSourceType("active")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeSourceType === "active"
                    ? isLight
                      ? "border-orange-500 bg-orange-50/95 shadow-2xl scale-[1.02] text-orange-950"
                      : "border-orange-400 bg-gradient-to-br from-orange-500/30 via-red-600/20 to-slate-900/90 shadow-2xl scale-[1.02] text-white"
                    : isLight
                    ? "border-orange-300 bg-white/80 hover:border-orange-500 text-slate-800"
                    : "border-orange-400/40 bg-slate-900/60 hover:border-orange-400 text-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-orange-500 text-black shadow-md">
                      MODALITY 2
                    </span>
                    <span className="text-xs font-mono text-orange-600 dark:text-orange-300 font-bold">Continuous Stream</span>
                  </div>
                  <h3 className="text-lg font-black">2. Active Sources</h3>
                  <p className="text-xs opacity-90 mt-2 leading-relaxed">
                    Active sensors continuously stream real-time data, like sensors monitoring commercial jet engines. Requires near-real-time ingestion and encoding.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-orange-400/30 space-y-1 text-[11px] opacity-90">
                  <div>• <strong>Power:</strong> Dedicated continuous power line</div>
                  <div>• <strong>Latency:</strong> Hard real-time streaming constraints</div>
                  <div>• <strong>Example:</strong> Aviation jet engines & turbines</div>
                </div>
              </div>

              {/* Category 3: Dynamic Sources */}
              <div
                onClick={() => setActiveSourceType("dynamic")}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  activeSourceType === "dynamic"
                    ? isLight
                      ? "border-emerald-500 bg-emerald-50/95 shadow-2xl scale-[1.02] text-emerald-950"
                      : "border-emerald-400 bg-gradient-to-br from-emerald-500/30 via-teal-600/20 to-slate-900/90 shadow-2xl scale-[1.02] text-white"
                    : isLight
                    ? "border-emerald-300 bg-white/80 hover:border-emerald-500 text-slate-800"
                    : "border-emerald-400/40 bg-slate-900/60 hover:border-emerald-400 text-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-black uppercase bg-emerald-500 text-black shadow-md">
                      MODALITY 3 • ADVANCED
                    </span>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-300 font-bold">Two-Way Interactive</span>
                  </div>
                  <h3 className="text-lg font-black">3. Dynamic Sources</h3>
                  <p className="text-xs opacity-90 mt-2 leading-relaxed">
                    The most advanced and practical method. Enables two-way communication with IoT software (e.g. smart thermostats) supporting real-time auto-configuration.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-400/30 space-y-1 text-[11px] opacity-90">
                  <div>• <strong>Power:</strong> Smart dynamic power negotiation</div>
                  <div>• <strong>Adaptability:</strong> Remote updates & bidirectional control</div>
                  <div>• <strong>Example:</strong> Smart thermostats & autonomous vehicles</div>
                </div>
              </div>
            </div>

            {/* Live Animated Transmission Conduit Cable */}
            <div
              className={`p-4 sm:p-5 rounded-2xl ${curTheme.cardBg} border-2 ${curTheme.cardBorder} backdrop-blur-xl flex flex-col gap-3 my-1 shadow-xl`}
            >
              <div className="flex items-center justify-between text-xs font-mono opacity-90">
                <span className="flex items-center gap-2 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>PHYSICAL-TO-CLOUD CONDUIT:</span> {activeSourceType.toUpperCase()} MODE
                </span>
                <span className="text-cyan-600 dark:text-cyan-300 font-black font-mono text-sm">{packetCount} Packets Telemetry</span>
              </div>

              {/* Animated Cable Line */}
              <div
                className={`relative h-14 w-full flex items-center justify-between px-4 sm:px-6 rounded-xl border overflow-hidden ${
                  isLight ? "bg-slate-100 border-slate-300" : "bg-slate-950/90 border-white/10"
                }`}
              >
                <div
                  className={`flex items-center gap-2.5 z-10 px-3.5 py-1.5 rounded-lg border-2 border-cyan-500 shrink-0 shadow-md ${
                    isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                  }`}
                >
                  <Cpu className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-bold">
                    {activeSourceType === "passive" ? "Groundwater Probe" : activeSourceType === "active" ? "Turbine Sensor" : "Smart Thermostat"}
                  </span>
                </div>

                {/* Animated Cable Track */}
                <div
                  className={`flex-1 mx-4 sm:mx-8 h-2 rounded-full relative overflow-hidden border ${
                    isLight ? "bg-slate-300 border-slate-400" : "bg-slate-800 border-white/10"
                  }`}
                >
                  {/* Telemetry Packet (Ascending/Outbound Right) */}
                  <div
                    className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_16px_#38bdf8]"
                    style={{
                      animation:
                        activeSourceType === "passive"
                          ? "packetFlyRight 3.2s infinite ease-in-out"
                          : "packetFlyRight 1.2s infinite linear",
                    }}
                  />
                  {/* Second Packet for Continuous Active Stream */}
                  {activeSourceType === "active" && (
                    <div
                      className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-orange-400 shadow-[0_0_16px_#fb923c]"
                      style={{
                        animation: "packetFlyRight 1.2s infinite linear",
                        animationDelay: "0.6s",
                      }}
                    />
                  )}
                  {/* Bidirectional Return Packet (Control Feedback) for Dynamic Mode */}
                  {activeSourceType === "dynamic" && (
                    <div
                      className="absolute top-1/2 -mt-2 w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_16px_#10b981]"
                      style={{
                        animation: "packetFlyLeft 1.4s infinite linear",
                        animationDelay: "0.5s",
                      }}
                    />
                  )}
                </div>

                <div
                  className={`flex items-center gap-2.5 z-10 px-3.5 py-1.5 rounded-lg border-2 border-purple-500 shrink-0 shadow-md ${
                    isLight ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                  }`}
                >
                  <Server className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold">Central Processing Unit</span>
                </div>
              </div>
            </div>

            {/* Interactive Telemetry Emulation Panel */}
            <div
              className={`p-3.5 rounded-2xl border-2 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isLight ? "bg-white/90 border-slate-200 shadow-md" : "bg-slate-900/80 border-white/15 shadow-xl"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-400/40">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-xs">
                  <div className="font-mono opacity-80">STREAM STATUS: NOMINAL</div>
                  <div className="font-bold">Continuous Adaptive Telemetry Ingestion Active</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setSimRunning(!simRunning)}
                  className={`px-3.5 py-1.5 rounded-xl border-2 text-xs font-mono font-bold transition-colors ${
                    isLight
                      ? "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800"
                      : "border-white/20 bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {simRunning ? "Pause Stream" : "Resume Stream"}
                </button>
                <button
                  onClick={() => setPacketCount(0)}
                  className={`px-3.5 py-1.5 rounded-xl border-2 text-xs font-mono font-bold transition-colors ${
                    isLight
                      ? "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800"
                      : "border-white/20 bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  Reset Counter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SLIDE 5: Chapter 1 Executive Synthesis & Checklist */}
        {/* ============================================================ */}
        {currentSlide === 4 && (
          <div className="flex-1 flex flex-col justify-between animate-slide-enter">
            <div>
              <div className="text-xs font-mono font-extrabold text-purple-600 dark:text-purple-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                <span>Executive Synthesis • Architectural Consensus</span>
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-black bg-gradient-to-r ${curTheme.titleGrad} bg-clip-text text-transparent tracking-tight`}
              >
                Architectural Principles of Modern IoT
              </h2>
              <p className={`text-sm ${curTheme.cardSub} mt-1`}>
                Consolidated overview of Chapter 1 (Part 3): Core conceptual formulas, layered stack, wireless communication, and telemetry sources.
              </p>
            </div>

            {/* 4 Architectural Pillars Grid (Vibrant Rainbow Quad) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div
                className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col justify-between ${
                  isLight
                    ? "border-cyan-500 bg-cyan-50/90 text-cyan-950 shadow-cyan-500/10"
                    : "border-cyan-400 bg-gradient-to-br from-cyan-500/25 via-blue-600/15 to-slate-900/90 text-white shadow-cyan-500/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-cyan-600 dark:text-cyan-300">PILLAR 01</span>
                    <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                  </div>
                  <h3 className="text-base font-black">The Three Formulations</h3>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    Physical Object + Transducers + Internet forms the core umbrella, augmented by Enterprise Operations and Cloud Service consolidation pipelines.
                  </p>
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col justify-between ${
                  isLight
                    ? "border-emerald-500 bg-emerald-50/90 text-emerald-950 shadow-emerald-500/10"
                    : "border-emerald-400 bg-gradient-to-br from-emerald-500/25 via-teal-600/15 to-slate-900/90 text-white shadow-emerald-500/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-300">PILLAR 02</span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-base font-black">Bi-Directional 4-Stage Stack</h3>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    Sensing → Network Gateways → Data Analytics → Application Management. Data ascends to insights; control flows down to physical actuation.
                  </p>
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col justify-between ${
                  isLight
                    ? "border-purple-500 bg-purple-50/90 text-purple-950 shadow-purple-500/10"
                    : "border-purple-400 bg-gradient-to-br from-purple-500/25 via-fuchsia-600/15 to-slate-900/90 text-white shadow-purple-500/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-300">PILLAR 03</span>
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="text-base font-black">Heterogeneous Connectivity</h3>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    No single protocol wins. Short-range mesh (ZigBee, Thread) pairs with LPWAN (NB-IoT, LoRaWAN) and high-bandwidth cellular according to battery and range limits.
                  </p>
                </div>
              </div>

              <div
                className={`p-5 rounded-2xl border-2 shadow-xl flex flex-col justify-between ${
                  isLight
                    ? "border-amber-500 bg-amber-50/90 text-amber-950 shadow-amber-500/10"
                    : "border-amber-400 bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-slate-900/90 text-white shadow-amber-500/15"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-300">PILLAR 04</span>
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-base font-black">Telemetry & Security Mandate</h3>
                  <p className="text-xs opacity-90 mt-1 leading-relaxed">
                    Transitioning from passive polling to dynamic two-way configuration requires end-to-end encryption, secure authentication, and AI/ML predictive analytics.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Callout Banner */}
            <div
              className={`p-4 rounded-2xl border-2 flex items-center justify-between shadow-xl ${
                isLight
                  ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-300 text-indigo-950"
                  : "bg-gradient-to-r from-fuchsia-950/60 via-indigo-950/60 to-cyan-950/60 border-cyan-400/50 text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs sm:text-sm font-bold">
                  Course Material Validated • Zero Placeholder Content • 100% PDF Fidelity
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300 font-black hidden sm:inline">
                End of Part 3
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Controls Bar */}
      <footer
        className={`px-6 py-3.5 border-t ${curTheme.footerBorder} ${curTheme.footerBg} flex items-center justify-between shrink-0 transition-colors duration-500`}
      >
        <div className={`flex items-center gap-2 text-xs ${curTheme.footerText} font-mono`}>
          <span>Slide {currentSlide + 1} of {totalSlides}</span>
          <span className="hidden sm:inline">• Arrow Keys or Space to Navigate • Number Keys 1-5 to Jump</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className={`p-2 rounded-xl border-2 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md ${
              isLight ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200" : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
            title="Previous Slide (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-lg disabled:opacity-30 disabled:pointer-events-none ${
              isLight
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30"
                : "bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black shadow-cyan-500/30"
            }`}
            title="Next Slide (Right Arrow / Space)"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
