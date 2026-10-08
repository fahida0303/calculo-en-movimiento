"""
Generador del Documento PDF Maestro de Arquitectura y Funcionamiento:
'CÁLCULO EN MOVIMIENTO - SISTEMA INTERACTIVO 3D Y VISIÓN ARTIFICIAL'
"""
import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas con numeración dinámica de páginas (Página X de Y) y encabezado elegante."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Portada sin encabezados repetitivos
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Encabezado superior
        self.drawString(54, 755, "CÁLCULO EN MOVIMIENTO — DOCUMENTO MAESTRO DEL SISTEMA")
        self.drawRightString(612 - 54, 755, "ARQUITECTURA & GUÍA TÉCNICA")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 748, 612 - 54, 748)

        # Pie de página inferior
        self.line(54, 45, 612 - 54, 45)
        self.drawString(54, 32, "Confidencial & Académico — Proyecto Prima")
        page_str = f"Página {self._pageNumber} de {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()


def create_master_pdf(output_filename="MANUAL_MAESTRO_CALCULO_EN_MOVIMIENTO.pdf"):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Paleta de colores institucional
    PRIMARY = colors.HexColor("#0f172a")      # Slate 900
    ACCENT_CYAN = colors.HexColor("#0284c7")  # Sky 600
    ACCENT_EMERALD = colors.HexColor("#059669")# Emerald 600
    ACCENT_PURPLE = colors.HexColor("#7c3aed") # Violet 600
    BG_LIGHT = colors.HexColor("#f8fafc")     # Slate 50
    BORDER_COLOR = colors.HexColor("#e2e8f0") # Slate 200
    TEXT_MUTED = colors.HexColor("#475569")   # Slate 600

    # Estilos tipográficos
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        alignment=0,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=ACCENT_CYAN,
        spaceAfter=24
    )

    h1_style = ParagraphStyle(
        'SectionHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=PRIMARY,
        spaceBefore=16,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=ACCENT_CYAN,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyMain',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=PRIMARY,
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        'BodyMainBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletMain',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=PRIMARY,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=6,
        spaceAfter=8
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=PRIMARY
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # ==========================================
    # 1. PORTADA EJECUTIVA
    # ==========================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("DOCUMENTO MAESTRO DE SISTEMA", ParagraphStyle(
        'PreTitle',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=ACCENT_CYAN,
        spaceAfter=8
    )))
    story.append(Paragraph("CÁLCULO EN MOVIMIENTO", title_style))
    story.append(Paragraph("Arquitectura de Software, Motor Matemático Simbólico, Visión Artificial por Gestos y Visualizador 3D Reactivo", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=3, color=ACCENT_CYAN, spaceAfter=20, spaceBefore=0))

    cover_meta = [
        [Paragraph("<b>Componente</b>", table_header_style), Paragraph("<b>Especificación</b>", table_header_style)],
        [Paragraph("Nombre del Software", table_cell_bold), Paragraph("Cálculo en Movimiento (Proyecto Prima)", table_cell_style)],
        [Paragraph("Tipo de Aplicación", table_cell_bold), Paragraph("Web Full-Stack Interactiva Científica (3D + Visión)", table_cell_style)],
        [Paragraph("Backend", table_cell_bold), Paragraph("Python 3.12, FastAPI, SymPy, NumPy, OpenCV, MediaPipe", table_cell_style)],
        [Paragraph("Frontend", table_cell_bold), Paragraph("React 18, TypeScript, Three.js, Vite, Lucide Icons", table_cell_style)],
        [Paragraph("Protocolos", table_cell_bold), Paragraph("REST API (HTTP/JSON) y WebSocket (/ws/vision)", table_cell_style)],
        [Paragraph("Modos de Entrada", table_cell_bold), Paragraph("Modo Cámara (visión de 1 a 5 dedos) y Modo Manual", table_cell_style)],
        [Paragraph("Fecha de Publicación", table_cell_bold), Paragraph(datetime.now().strftime("%d de %B de %Y"), table_cell_style)],
        [Paragraph("Estado Operativo", table_cell_bold), Paragraph("<font color='#059669'><b>ACTIVO Y EN PRODUCCIÓN LOCAL</b></font>", table_cell_style)],
    ]
    meta_table = Table(cover_meta, colWidths=[160, 344])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)

    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>Resumen de Propósito:</b> Esta aplicación trasciende las calculadoras gráficas tradicionales al conectar de forma bidireccional el análisis formal de cálculo diferencial con una representación volumétrica 3D inmersiva y un sistema de control gestual basado en visión artificial. El usuario puede ingresar funciones matemáticas de cualquier familia o utilizar su mano para transitar entre los 5 requisitos fundamentales del cálculo diferencial en tiempo real.", body_style))

    story.append(PageBreak())

    # ==========================================
    # 2. ÍNDICE Y RESUMEN GENERAL
    # ==========================================
    story.append(Paragraph("1. Visión General del Proyecto", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("<b>Cálculo en Movimiento</b> es una suite pedagógica y de ingeniería diseñada para materializar visualmente los conceptos abstractos del cálculo diferencial. La aplicación resuelve la brecha entre la definición simbólica rigurosa y su manifestación geométrica espacial.", body_style))
    story.append(Paragraph("El sistema ofrece dos modalidades de operación perfectamente orquestadas:", body_style))
    story.append(Paragraph("• <b>Modo Cámara:</b> Permite al usuario interactuar sin periféricos físicos. Al colocar la mano frente a la cámara web, MediaPipe y OpenCV reconocen los dedos extendidos (1 a 5) y conmutan automáticamente entre los 5 módulos temáticos del cálculo.", bullet_style))
    story.append(Paragraph("• <b>Modo Manual:</b> Permite un control fino mediante un selector de dedos interactivo en pantalla, controles deslizantes para parámetros como la abscisa x₀ o el intervalo [a, b], y un teclado científico de funciones para ingresar cualquier expresión algebraica.", bullet_style))

    story.append(Paragraph("2. Los 5 Requisitos Fundamentales del Cálculo", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    
    req_data = [
        [Paragraph("<b>Dedo</b>", table_header_style), Paragraph("<b>Requisito</b>", table_header_style), Paragraph("<b>Concepto Matemático y Visualización 3D</b>", table_header_style)],
        [
            Paragraph("<b>1</b>", table_cell_bold),
            Paragraph("<b>Evaluación y Pendiente</b>", table_cell_bold),
            Paragraph("Evalúa f(x₀), calcula f'(x₀) simbólicamente y grafica la <b>Recta Tangente</b> exacta. Dibuja un triángulo de pendiente (Δy/Δx), línea de proyección vertical al eje X y badge holográfico con la ecuación punto-pendiente.", table_cell_style)
        ],
        [
            Paragraph("<b>2</b>", table_cell_bold),
            Paragraph("<b>Secante y Razón de Cambio</b>", table_cell_bold),
            Paragraph("Traza la <b>Recta Secante</b> entre dos puntos A(a, f(a)) y B(b, f(b)). Calcula la razón de cambio promedio [f(b)-f(a)]/(b-a) e ilustra el proceso de paso al límite cuando Δx tiende a 0.", table_cell_style)
        ],
        [
            Paragraph("<b>3</b>", table_cell_bold),
            Paragraph("<b>Función y Derivadas</b>", table_cell_bold),
            Paragraph("Grafica simultáneamente en planos paralelos en el eje Z: la función base f(x) en z=0, la primera derivada f'(x) en z=1.5 y la segunda derivada f''(x) en z=3.0, permitiendo comparar visualmente concavidades y pendientes.", table_cell_style)
        ],
        [
            Paragraph("<b>4</b>", table_cell_bold),
            Paragraph("<b>Puntos Críticos</b>", table_cell_bold),
            Paragraph("Encuentra los ceros de la derivada f'(x)=0 mediante el <b>Teorema de Fermat</b>. Clasifica cada punto crítico como Máximo Local, Mínimo Local o Punto de Inflexión utilizando el criterio de la segunda derivada f''(c).", table_cell_style)
        ],
        [
            Paragraph("<b>5</b>", table_cell_bold),
            Paragraph("<b>Desafío Aplicado</b>", table_cell_bold),
            Paragraph("Modela un problema físico o de optimización real (como la cinemática de una partícula en movimiento: posición s(t), velocidad instantánea v(t) = s'(t) y aceleración a(t) = s''(t)).", table_cell_style)
        ]
    ]
    req_table = Table(req_data, colWidths=[40, 130, 334])
    req_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(req_table)

    story.append(PageBreak())

    # ==========================================
    # 3. STACK TECNOLÓGICO Y ARQUITECTURA
    # ==========================================
    story.append(Paragraph("3. Stack Tecnológico Detallado", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))

    tech_data = [
        [Paragraph("<b>Capa</b>", table_header_style), Paragraph("<b>Tecnología</b>", table_header_style), Paragraph("<b>Rol y Responsabilidad en el Sistema</b>", table_header_style)],
        [
            Paragraph("<b>Frontend Core</b>", table_cell_bold),
            Paragraph("React 18 + TypeScript", table_cell_style),
            Paragraph("Gestión del árbol de componentes, tipado estricto de datos matemáticos y de telemetría de visión, estado reactivo sincronizado.", table_cell_style)
        ],
        [
            Paragraph("<b>Gráficos 3D</b>", table_cell_bold),
            Paragraph("Three.js (WebGL)", table_cell_style),
            Paragraph("Renderizado volumétrico con TubeGeometry, CatmullRomCurve3, materiales metálicos, sistema de iluminación ACESFilmicToneMapping, sprites de texto en alta resolución y cámaras orbitales.", table_cell_style)
        ],
        [
            Paragraph("<b>Bundler / Servidor</b>", table_cell_bold),
            Paragraph("Vite 5", table_cell_style),
            Paragraph("Compilación y empaquetado de ultra-alta velocidad, Hot Module Replacement (HMR) y servidor de desarrollo en puerto 5173.", table_cell_style)
        ],
        [
            Paragraph("<b>Estilos UI</b>", table_cell_bold),
            Paragraph("Vanilla CSS Modular", table_cell_style),
            Paragraph("Variables de diseño (design tokens), tipografías monoespaciadas para fórmulas, modo oscuro técnico y glassmorphism.", table_cell_style)
        ],
        [
            Paragraph("<b>Backend API</b>", table_cell_bold),
            Paragraph("FastAPI (Python)", table_cell_style),
            Paragraph("Framework asíncrono de alto rendimiento, validación automática con Pydantic, endpoints REST y servidor WebSocket en puerto 8000.", table_cell_style)
        ],
        [
            Paragraph("<b>Cálculo Simbólico</b>", table_cell_bold),
            Paragraph("SymPy", table_cell_style),
            Paragraph("Diferenciación exacta, resolución analítica de ecuaciones f'(x)=0, simplificación algebraica de tangentes y secantes, conversión a LaTeX.", table_cell_style)
        ],
        [
            Paragraph("<b>Cálculo Numérico</b>", table_cell_bold),
            Paragraph("NumPy", table_cell_style),
            Paragraph("Discretización adaptativa de dominios [x_min, x_max] con generación de mallas de 200 a 400 puntos 3D libres de discontinuidades.", table_cell_style)
        ],
        [
            Paragraph("<b>Visión Artificial</b>", table_cell_bold),
            Paragraph("MediaPipe + OpenCV", table_cell_style),
            Paragraph("HandLandmarker con 21 keypoints anatómicos en 3D, inferencia en tiempo real sobre frames de webcam, buffer circular de estabilización y conteo de dedos.", table_cell_style)
        ],
    ]
    tech_table = Table(tech_data, colWidths=[100, 120, 284])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(tech_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph("4. Diagrama de Flujo y Comunicación del Sistema", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("La interacción entre capas sigue un modelo de desacoplamiento estricto:", body_style))
    
    flow_steps = [
        "<b>1. Entrada del Usuario:</b> El usuario escribe una función matemática en el panel izquierdo o la selecciona de la biblioteca de ejemplos (cuadráticas, trigonométricas, exponenciales, etc.).",
        "<b>2. Validación Inmediata:</b> El frontend envía la expresión a <code>/api/validate</code>. El parser limpia sintaxis (como <code>4x</code> a <code>4*x</code>), comprueba que sea matemáticamente analizable y clasifica su tipo sin calcular gráficas aún.",
        "<b>3. Selección de Modo:</b> Si se selecciona <i>Modo Cámara</i>, el backend enciende la webcam a través de DirectShow (índice 0) y transmite el video con landmarks dibujados por WebSocket (<code>/ws/vision</code>). Al detectar un número de dedos confirmado, se dispara el cálculo automático. En <i>Modo Manual</i>, el usuario pulsa directamente los botones de 1 a 5 dedos.",
        "<b>4. Cálculo y Generación Geométrica:</b> El motor en <code>/api/calculate</code> evalúa la derivada, la recta tangente o secante, los puntos críticos y genera los arrays de coordenadas tridimensionales <code>(x, y, z)</code>.",
        "<b>5. Renderizado 3D Reactivo:</b> Three.js recibe el payload JSON y actualiza la escena: traza el tubo de la curva en cian brillante, la recta en verde esmeralda, ubica el punto P con halo animado, añade el triángulo de pendiente y despliega badges de alta legibilidad."
    ]
    for step in flow_steps:
        story.append(Paragraph(f"• {step}", bullet_style))

    story.append(PageBreak())

    # ==========================================
    # 4. MOTOR MATEMÁTICO A FONDO
    # ==========================================
    story.append(Paragraph("5. El Motor Matemático Simbólico (`backend/math`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("El núcleo matemático fue construido siguiendo los más rigurosos estándares de rigor algebraico y cálculo analítico exacto:", body_style))

    story.append(Paragraph("<b>A. Parser Matemático Inteligente (`parser.py`):</b>", h2_style))
    story.append(Paragraph("Los usuarios ingresan expresiones de múltiples formas coloquiales. El parser implementa transformaciones léxicas antes de la compilación simbólica:", body_style))
    story.append(Paragraph("• <b>Multiplicación implícita:</b> Convierte patrones como <code>4x</code>, <code>2(x+1)</code> o <code>x sin(x)</code> en <code>4*x</code>, <code>2*(x+1)</code> y <code>x*sin(x)</code> mediante expresiones regulares precisas.", bullet_style))
    story.append(Paragraph("• <b>Manejo de potencias:</b> Convierte sintaxis <code>x^2</code> en <code>x**2</code> entendible por Python.", bullet_style))
    story.append(Paragraph("• <b>Constantes naturales:</b> Sustituye <code>e^x</code> por <code>exp(x)</code> preservando el número de Euler analítico.", bullet_style))
    story.append(Paragraph("• <b>Clasificación automática:</b> Clasifica la función en: Constante, Lineal, Cuadrática, Cúbica, Polinómica, Racional, Raíz, Trigonométrica, Exponencial o Logarítmica.", bullet_style))
    story.append(Paragraph("• <b>Seguridad (Sandbox):</b> Prohíbe llamadas a funciones peligrosas o builtins de Python, permitiendo únicamente el conjunto matemático de SymPy.", bullet_style))

    story.append(Paragraph("<b>B. Motor de Ejecución de Requisitos (`engine.py`):</b>", h2_style))
    story.append(Paragraph("Cada uno de los 5 requisitos cuenta con un ejecutor matemático dedicado:", body_style))

    story.append(Paragraph("• <b>Requisito 1 (f'(a) y Recta Tangente):</b> Utiliza diferenciación simbólica exacta <code>diff(f, x)</code>. Evalúa f(a) y la pendiente <code>m = f'(a)</code>. Construye la ecuación analítica <code>y = m*(x - a) + f(a)</code> y su forma simplificada <code>y = m*x + b</code>.", bullet_style))
    story.append(Paragraph("• <b>Requisito 2 (Recta Secante y Δx → 0):</b> Evalúa A(a, f(a)) y B(b, f(b)). Calcula la razón de cambio promedio <code>Δy/Δx = (f(b)-f(a))/(b-a)</code> y genera la recta secante extendida.", bullet_style))
    story.append(Paragraph("• <b>Requisito 3 (Función y Derivadas en 3D):</b> Obtiene f'(x) y f''(x). Genera puntos con desplazamiento en el eje Z: f(x) en z=0, f'(x) en z=1.5 y f''(x) en z=3.0.", bullet_style))
    story.append(Paragraph("• <b>Requisito 4 (Puntos Críticos y Criterio de Fermat):</b> Resuelve analíticamente <code>solve(f', x)</code> en los reales. Para cada raíz c, calcula f(c) y evalúa f''(c). Si f''(c) < 0, clasifica como <i>Máximo local</i>; si f''(c) > 0, como <i>Mínimo local</i>; si f''(c) = 0, analiza cambio de signo para puntos de inflexión.", bullet_style))
    story.append(Paragraph("• <b>Requisito 5 (Cinemática Aplicada):</b> Trata a x como el tiempo t, evaluando posición s(t₀), velocidad v(t₀) = s'(t₀) y aceleración a(t₀) = s''(t₀).", bullet_style))

    story.append(Paragraph("• <b>Muestreo Discreto Seguro (`get_safe_domain`):</b> Detecta singularidades y asintotas (por ejemplo en <code>1/x</code> o <code>tan(x)</code>) y segmenta la curva para evitar que Three.js trace líneas que atraviesen el infinito.", bullet_style))

    story.append(PageBreak())

    # ==========================================
    # 5. VISIÓN ARTIFICIAL Y CONEXIÓN
    # ==========================================
    story.append(Paragraph("6. El Módulo de Visión Artificial (`backend/vision`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("La visión artificial implementada permite un control gestual robusto y sin latencia perceptible:", body_style))

    story.append(Paragraph("<b>A. Inicialización Directa de Cámara:</b>", h2_style))
    story.append(Paragraph("En entornos Windows, iterar múltiples índices de cámaras desconocidas genera demoras por timeout de COM en DirectShow. El módulo fue optimizado para abrir de inmediato el dispositivo primario (índice 0) con <code>cv2.CAP_DSHOW</code> en milisegundos, garantizando que la cámara encienda al instante al pulsar 'Encender Cámara'.", body_style))

    story.append(Paragraph("<b>B. Modelo MediaPipe HandLandmarker:</b>", h2_style))
    story.append(Paragraph("El modelo neuronal localiza 21 marcas anatómicas tridimensionales de la mano (muñeca, nudillos MCP, articulaciones PIP/DIP y puntas de dedos TIP). El algoritmo analiza la extensión de cada dedo comparando la coordenada Y de la punta con su respectiva articulación PIP, y la posición relativa del pulgar respecto a la muñeca.", body_style))

    story.append(Paragraph("<b>C. Filtro de Estabilización Temporal:</b>", h2_style))
    story.append(Paragraph("Para evitar que fluctuaciones menores de luz o movimientos rápidos cambien involuntariamente de requisito, se implementó una cola circular (<code>deque</code> de longitud 7) con un umbral de confirmación de 5 lecturas consecutivas idénticas. Solo cuando el gesto es sostenido y estable se envía la orden de cálculo al frontend.", body_style))

    story.append(Paragraph("7. El Visualizador 3D con Three.js (`frontend/src/components/Graph3D.tsx`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("La escena 3D fue diseñada con estándares de alta fidelidad visual y contraste óptico:", body_style))
    story.append(Paragraph("• <b>Fondo y Luz de Alto Contraste:</b> Escena espacial en <code>#070b14</code> con niebla exponencial sutil e iluminación técnica tri-direccional (Key Light cian, Fill Light violeta y Rim Light esmeralda).", bullet_style))
    story.append(Paragraph("• <b>Grilla Dual Espacial:</b> Rejilla principal en y=0 con subdivisiones finas, sin planos horizontales opacos que intercepten las curvas con valores negativos.", bullet_style))
    story.append(Paragraph("• <b>Curvas Volumétricas:</b> Cada función matemática se renderiza como un tubo 3D brillante (<code>TubeGeometry</code>) con efecto de halo exterior mediante mezcla aditiva.", bullet_style))
    story.append(Paragraph("• <b>Callout Badges Holográficos:</b> Las etiquetas de puntos P(x₀, f(x₀)), rectas tangentes y extremos cuentan con líneas guía punteadas y cuadros con fondo oscuro sólido (<code>rgba(15, 23, 42, 0.95)</code>) y texto blanco nítido para asegurar legibilidad a cualquier distancia o ángulo de rotación.", bullet_style))
    story.append(Paragraph("• <b>Triángulo de Pendiente y Líneas Guía:</b> En el Requisito 1 se despliega el triángulo Δy/Δx que ilustra la razón geométrica de la derivada, junto con la proyección perpendicular hacia el eje X.", bullet_style))

    story.append(PageBreak())

    # ==========================================
    # 6. RESOLUCIÓN DE INCIDENCIAS TÉCNICAS
    # ==========================================
    story.append(Paragraph("8. Historial de Optimizaciones y Correcciones Críticas", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("Durante el desarrollo y calibración final del proyecto, se diagnosticaron y solucionaron aspectos clave para alcanzar la estabilidad total:", body_style))

    fixes_data = [
        [Paragraph("<b>Aspecto Reportado</b>", table_header_style), Paragraph("<b>Causa Raíz Técnica</b>", table_header_style), Paragraph("<b>Solución Implementada</b>", table_header_style)],
        [
            Paragraph("<b>Nombre de Cámara</b>", table_cell_bold),
            Paragraph("La interfaz mostraba 'Cámara IA', generando redundancia conceptual.", table_cell_style),
            Paragraph("Se simplificó la denominación en toda la aplicación a <b>'Cámara'</b> (y 'Cámara (Activo)').", table_cell_style)
        ],
        [
            Paragraph("<b>Encendido de la Cámara</b>", table_cell_bold),
            Paragraph("Bucle de prueba sobre 12 combinaciones de índices inexistentes [1, 0, 2, 3] provocaba timeouts de COM en Windows.", table_cell_style),
            Paragraph("Conexión directa inmediata al índice primario 0 con <code>cv2.CAP_DSHOW</code>. Inicio en menos de 200 ms.", table_cell_style)
        ],
        [
            Paragraph("<b>Exclusividad de Dedos en Modo Manual</b>", table_cell_bold),
            Paragraph("El selector manual de 1 a 5 dedos aparecía también en modo cámara, creando conflicto de control.", table_cell_style),
            Paragraph("Renderizado condicional en <code>App.tsx</code>: el selector manual solo se muestra en Modo Manual. En Modo Cámara se sustituye por una tarjeta de estado de visión.", table_cell_style)
        ],
        [
            Paragraph("<b>Contraste y Pantalla Blanca en 3D</b>", table_cell_bold),
            Paragraph("Una franja blanca translúcida duplicada a <code>top: 12px</code> en <code>Graph3D.tsx</code> tapaba las tarjetas de telemetría.", table_cell_style),
            Paragraph("Se eliminó la barra duplicada y se consolidó el HUD superior oscuro de 4 tarjetas de alto contraste.", table_cell_style)
        ],
        [
            Paragraph("<b>Plano 3D que se veía raro</b>", table_cell_bold),
            Paragraph("Existía un <code>PlaneGeometry</code> opaco a y=-0.02 que cortaba las curvas negativas.", table_cell_style),
            Paragraph("Se eliminó el plano y se reemplazó por rejillas vectoriales duales <code>GridHelper</code> limpias.", table_cell_style)
        ],
        [
            Paragraph("<b>Integridad Matemática</b>", table_cell_bold),
            Paragraph("Requisito estricto de no alterar la lógica matemática analítica.", table_cell_style),
            Paragraph("Se conservaron intactos <code>parser.py</code> y <code>engine.py</code>, validando su suite de 23 pruebas.", table_cell_style)
        ]
    ]
    fixes_table = Table(fixes_data, colWidths=[100, 190, 214])
    fixes_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(fixes_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("9. Guía de Ejecución y Comandos", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceAfter=8, spaceBefore=0))
    story.append(Paragraph("Para iniciar el entorno completo de desarrollo o producción local, ejecutar:", body_style))
    story.append(Paragraph("<b>1. Iniciar Servidor Backend (FastAPI + Visión + SymPy):</b>", body_style))
    story.append(Paragraph("<code>cd \"c:\\Users\\Fahida\\Desktop\\proyecto prima\"<br/>$env:OPENBLAS_NUM_THREADS=\"1\"; python run_backend.py</code>", code_style))
    story.append(Paragraph("<b>2. Iniciar Servidor Frontend (React + Vite + Three.js):</b>", body_style))
    story.append(Paragraph("<code>cd \"c:\\Users\\Fahida\\Desktop\\proyecto prima\\frontend\"<br/>npm run dev</code>", code_style))
    story.append(Paragraph("<b>3. Acceso en el Navegador Web:</b>", body_style))
    story.append(Paragraph("• Aplicación Principal: <b>http://localhost:5173</b><br/>• Documentación Interactiva API Swagger: <b>http://localhost:8000/docs</b>", body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado exitosamente en: {output_filename}")

if __name__ == "__main__":
    create_master_pdf()
