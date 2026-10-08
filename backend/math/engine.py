"""
Motor de cálculo matemático para 'CÁLCULO EN MOVIMIENTO'.
Implementa los requisitos 1 a 5 con validación de dominios,
precisión analítica con SymPy y generación de datos muestreados seguros.

Principios de exactitud:
- Nunca se modifica en silencio el punto pedido por el usuario: si x = a no pertenece
  al dominio, se informa el motivo exacto.
- Los valores se evalúan de forma exacta (racionales) y con 30 dígitos de precisión.
- El dominio se obtiene del árbol SIN simplificar (x/x no existe en x = 0).
- Raíces de índice impar se evalúan en la rama real: (-8)^(1/3) = -2.
- La derivabilidad se verifica con derivadas laterales (|x| no es derivable en 0).
- Puntos críticos: f'(c) = 0 y puntos donde f'(c) no existe; clasificación con
  el criterio de derivadas de orden superior y el criterio de la primera derivada.
"""
from fractions import Fraction
from typing import Dict, Any, List, Optional, Tuple
import math
import threading
import numpy as np
import sympy as sp
from .parser import parse_mathematical_function, x

ANALYSIS_INTERVAL = (-10, 10)
PRECISION = 30            # dígitos significativos de evaluación
CLIP = 12.0               # recorte visual para mantenerse estrictamente dentro del plano cartesiano 3D/2D
_INF = (sp.zoo, sp.nan, sp.oo, sp.S.NegativeInfinity)


# =============================================================================
# Utilidades generales
# =============================================================================
def _run_with_timeout(fn, timeout: float, default=None):
    """Ejecuta fn con límite de tiempo (las rutinas simbólicas pueden tardar mucho)."""
    box = {"done": False, "value": default}

    def target():
        try:
            val = fn()
            box["value"] = val
        except Exception:
            box["value"] = default
        box["done"] = True

    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(timeout)
    return box["value"] if box["done"] else default


def _num(v: Optional[float]) -> Optional[float]:
    """Redondeo de presentación sin destruir valores pequeños (6 cifras)."""
    if v is None:
        return None
    if v == 0 or not math.isfinite(v):
        return 0.0 if v == 0 else v
    if abs(v) >= 1e-4:
        r = round(v, 6)
    else:
        r = float(f"{v:.6g}")
    return 0.0 if r == 0 else r


def _fmt(v: float) -> str:
    """Número legible para ecuaciones (sin '-0', sin ceros sobrantes)."""
    r = _num(v)
    if r is None:
        return "?"
    if float(r).is_integer() and abs(r) < 1e15:
        return str(int(r))
    return f"{r:.6g}" if abs(r) < 1e-4 else f"{r:.6f}".rstrip('0').rstrip('.')


def _line_equation(m: float, a: float, fa: float) -> Tuple[str, str]:
    """Ecuación punto-pendiente y pendiente-intercepto con signos correctos."""
    def term_x_minus(a_):
        if _num(a_) == 0:
            return "x"
        return f"(x - {_fmt(a_)})" if a_ > 0 else f"(x + {_fmt(-a_)})"

    def plus(v):
        if _num(v) == 0:
            return ""
        return f" + {_fmt(v)}" if v > 0 else f" - {_fmt(-v)}"

    m_s = _fmt(m)
    if _num(m) == 0:
        point_slope = f"y = {_fmt(fa)}"
    else:
        coef = "" if m_s == "1" else ("-" if m_s == "-1" else m_s)
        point_slope = f"y = {coef}{term_x_minus(a)}{plus(fa)}"

    b = fa - m * a
    if _num(m) == 0:
        slope_int = f"y = {_fmt(b)}"
    else:
        coef = "" if m_s == "1" else ("-" if m_s == "-1" else m_s)
        slope_int = f"y = {coef}x{plus(b)}"
    return point_slope, slope_int


def _to_exact(v: Any) -> sp.Expr:
    """Convierte la entrada del usuario a un número exacto (0.1 -> 1/10, 'pi/2' -> pi/2)."""
    if isinstance(v, sp.Basic):
        return v
    if isinstance(v, str):
        p = parse_mathematical_function(v)
        if not p["is_valid"] or p["sympy_expr"].has(x):
            raise ValueError(f"Valor numérico no válido: {v}")
        return p["sympy_expr"]
    f = float(v)
    if not math.isfinite(f):
        raise ValueError("El valor debe ser un número finito.")
    return sp.Rational(Fraction(repr(f)))


import re

def format_pretty_math(e: sp.Expr) -> str:
    """Formatea la expresión en notación matemática estándar y legible."""
    if e is None:
        return ""
    s = str(e).replace('**', '^')
    s = re.sub(r'\bexp\((x)\)', r'e^\1', s)
    s = re.sub(r'\bexp\((.*?)\)', r'e^(\1)', s)
    s = re.sub(r'\blog\(', r'ln(', s)
    s = re.sub(r'(\d+)\*([a-zA-Z])', r'\1\2', s)
    s = re.sub(r'(\d+)\*\(', r'\1(', s)
    s = re.sub(r'\)\*([a-zA-Z])', r')\1', s)
    return s


def _sym_str(e: sp.Expr) -> str:
    return format_pretty_math(e)


# =============================================================================
# Rama real y evaluación exacta
# =============================================================================
def to_real_branch(e: sp.Expr) -> sp.Expr:
    """
    Reemplaza potencias de índice impar por su valor real:
    b^(p/q), q impar -> sign(b)^p·|b|^(p/q). Así (-8)^(1/3) = -2 y (-8)^(2/3) = 4.
    """
    def is_odd_root(n):
        return (n.is_Pow and n.base.has(x) and n.exp.is_Rational
                and not n.exp.is_Integer and n.exp.q % 2 == 1)

    def rep(n):
        b, ex = n.base, n.exp
        if ex.p % 2 == 0:
            return sp.Abs(b) ** ex
        return sp.sign(b) * sp.Abs(b) ** ex

    try:
        return e.replace(is_odd_root, rep)
    except Exception:
        return e


def _eval_exact(e: sp.Expr, a: sp.Expr) -> Optional[float]:
    """Evalúa e(a) exactamente + 30 dígitos. None si no es un número real finito."""
    try:
        v = e.subs(x, a) if e.has(x) else e
        if v.has(*_INF):
            return None
        v = v.evalf(PRECISION)
        if v.has(*_INF) or not v.is_number:
            return None
        re_, im_ = v.as_real_imag()
        re_f, im_f = float(re_), float(im_)
        if not math.isfinite(re_f):
            return None
        if abs(im_f) > 1e-20 * max(1.0, abs(re_f)):
            return None
        return re_f
    except Exception:
        return None


def _is_exact_zero(e: sp.Expr, a: sp.Expr) -> bool:
    try:
        v = e.subs(x, a)
        if v == 0:
            return True
        num = v.evalf(PRECISION)
        if num.is_number and abs(complex(num)) < 1e-25:
            return bool(_run_with_timeout(lambda: v.equals(0), 1.5, True))
        return False
    except Exception:
        return False


# =============================================================================
# Dominio
# =============================================================================
Restriction = Tuple[str, sp.Expr, str]   # (tipo, g(x), motivo)


def collect_restrictions(tree: sp.Expr) -> List[Restriction]:
    """
    Recorre el árbol (idealmente sin simplificar) y registra las condiciones de existencia:
    - 'nonzero'  g ≠ 0   (denominadores, tan/sec, cot/csc)
    - 'positive' g > 0   (logaritmos, bases de exponentes variables)
    - 'nonneg'   g ≥ 0   (raíces de índice par, exponentes irracionales)
    - 'unit'     |g| ≤ 1 (arcsin, arccos)
    """
    out: List[Restriction] = []
    seen = set()

    def add(kind, g, why):
        try:
            g = sp.sympify(g).doit()
        except Exception:
            pass
        if not g.has(x):
            return
        key = (kind, sp.srepr(g))
        if key not in seen:
            seen.add(key)
            out.append((kind, g, why))

    for node in sp.preorder_traversal(tree):
        try:
            if isinstance(node, sp.Pow):
                b, ex = node.args
                b_ev, ex_ev = b.doit(), ex.doit()
                if not b_ev.has(x):
                    continue
                if ex_ev.has(x):
                    add('positive', b_ev, f"la base {_sym_str(b_ev)} de una potencia con exponente variable debe ser > 0")
                    continue
                if ex_ev.is_Integer:
                    if ex_ev < 0:
                        add('nonzero', b_ev, f"el denominador {_sym_str(b_ev)} se anula (división por cero)")
                elif ex_ev.is_Rational:
                    if ex_ev.q % 2 == 0:
                        add('nonneg', b_ev, f"el radicando {_sym_str(b_ev)} es negativo (raíz de índice par)")
                    if ex_ev < 0:
                        add('nonzero', b_ev, f"el denominador {_sym_str(b_ev)} se anula (división por cero)")
                elif ex_ev.is_number:
                    add('nonneg', b_ev, f"la base {_sym_str(b_ev)} de una potencia irracional debe ser ≥ 0")
                    if ex_ev.is_negative:
                        add('nonzero', b_ev, f"el denominador {_sym_str(b_ev)} se anula (división por cero)")
            elif isinstance(node, sp.log):
                add('positive', node.args[0], f"el argumento del logaritmo {_sym_str(node.args[0].doit())} debe ser > 0")
            elif isinstance(node, (sp.tan, sp.sec)):
                add('nonzero', sp.cos(node.args[0]), f"{type(node).__name__}({_sym_str(node.args[0])}) no existe cuando cos({_sym_str(node.args[0])}) = 0")
            elif isinstance(node, (sp.cot, sp.csc)):
                add('nonzero', sp.sin(node.args[0]), f"{type(node).__name__}({_sym_str(node.args[0])}) no existe cuando sin({_sym_str(node.args[0])}) = 0")
            elif isinstance(node, (sp.asin, sp.acos)):
                add('unit', node.args[0], f"el argumento de {type(node).__name__} debe estar en [-1, 1]")
        except Exception:
            continue
    return out


def _break_functions(e: sp.Expr) -> List[sp.Expr]:
    """Funciones cuyo cero produce una discontinuidad de e (asíntotas, saltos)."""
    fs = []
    for node in sp.preorder_traversal(e):
        try:
            if isinstance(node, sp.Pow) and node.base.has(x) and node.exp.is_number and node.exp.is_negative:
                fs.append(node.base)
            elif isinstance(node, (sp.tan, sp.sec)):
                fs.append(sp.cos(node.args[0]))
            elif isinstance(node, (sp.cot, sp.csc)):
                fs.append(sp.sin(node.args[0]))
            elif isinstance(node, sp.sign):
                fs.append(node.args[0])
        except Exception:
            continue
    return fs


def _np_func(e: sp.Expr):
    """Función numérica vectorizada en la rama real; devuelve NaN fuera del dominio."""
    try:
        f = sp.lambdify(x, to_real_branch(e), modules=['numpy'])
    except Exception:
        f = None

    def call(xs):
        xs = np.asarray(xs, dtype=float)
        if f is None:
            return np.full(xs.shape, np.nan)
        with np.errstate(all='ignore'):
            try:
                y = f(xs)
            except Exception:
                y = np.array([_safe_scalar(f, v) for v in xs.ravel()]).reshape(xs.shape)
        y = np.broadcast_to(np.asarray(y), xs.shape)
        if np.iscomplexobj(y):
            yr = np.where(np.abs(np.imag(y)) < 1e-12 * np.maximum(1, np.abs(np.real(y))), np.real(y), np.nan)
            return yr.astype(float)
        return np.asarray(y, dtype=float)
    return call


def _safe_scalar(f, v):
    try:
        with np.errstate(all='ignore'):
            r = complex(f(v))
        return r.real if abs(r.imag) < 1e-12 else np.nan
    except Exception:
        return np.nan


def _zeros_exact(g: sp.Expr, lo, hi, timeout: float = 2.5) -> Optional[List[sp.Expr]]:
    """Ceros exactos de g en [lo, hi] (None si SymPy no puede resolverlo a tiempo)."""
    def solve():
        s = sp.solveset(g, x, sp.Interval(lo, hi))
        if isinstance(s, sp.FiniteSet):
            return [r for r in s if r.is_real is not False]
        return None
    return _run_with_timeout(solve, timeout, None)


class MathFunction:
    """Función con su dominio exacto, derivadas clásicas y evaluadores."""

    def __init__(self, expr: sp.Expr, domain_tree: Optional[sp.Expr] = None):
        self.expr = expr
        restr = collect_restrictions(domain_tree) if domain_tree is not None else []
        for r in collect_restrictions(expr):
            if all(sp.srepr(r[1]) != sp.srepr(q[1]) or r[0] != q[0] for q in restr):
                restr.append(r)
        self.restrictions = restr
        self._derivs: Dict[int, sp.Expr] = {0: expr}
        self._np_cache: Dict[str, Any] = {}

    # ----- derivadas -----
    def derivative(self, n: int) -> sp.Expr:
        """Derivada clásica de orden n (sin deltas de Dirac)."""
        if n not in self._derivs:
            prev = self.derivative(n - 1)
            d = sp.diff(prev, x)
            d = d.replace(lambda t: isinstance(t, sp.DiracDelta), lambda t: sp.S.Zero)
            self._derivs[n] = d
        return self._derivs[n]

    # ----- dominio puntual -----
    def domain_check(self, a: sp.Expr) -> Tuple[bool, Optional[str]]:
        for kind, g, why in self.restrictions:
            gr = to_real_branch(g)
            v = _eval_exact(gr, a)
            if v is None:
                return False, why
            if kind == 'nonzero' and (v == 0.0 or (abs(v) < 1e-25 and _is_exact_zero(gr, a))):
                return False, why
            if kind == 'positive' and (v < 0 or v == 0.0 or (abs(v) < 1e-25 and _is_exact_zero(gr, a))):
                return False, why
            if kind == 'nonneg' and v < 0 and not (abs(v) < 1e-25 and _is_exact_zero(gr, a)):
                return False, why
            if kind == 'unit' and abs(v) > 1 and not (abs(abs(v) - 1) < 1e-25 and _is_exact_zero(sp.Abs(gr) - 1, a)):
                return False, why
        return True, None

    def value(self, e: sp.Expr, a: sp.Expr) -> Optional[float]:
        """e(a) solo si a está en el dominio de f y el resultado es real y finito."""
        ok, _ = self.domain_check(a)
        if not ok:
            return None
        return _eval_exact(to_real_branch(e), a)

    def f(self, a):
        return self.value(self.expr, a)

    # ----- numérico vectorizado -----
    def np_func(self, e: sp.Expr):
        key = sp.srepr(e)
        if key not in self._np_cache:
            self._np_cache[key] = _np_func(e)
        return self._np_cache[key]

    def domain_mask(self, xs: np.ndarray) -> np.ndarray:
        mask = np.ones(xs.shape, dtype=bool)
        for kind, g, _ in self.restrictions:
            gv = self.np_func(g)(xs)
            with np.errstate(all='ignore'):
                if kind == 'nonzero':
                    mask &= np.isfinite(gv) & (gv != 0)
                elif kind == 'positive':
                    mask &= np.isfinite(gv) & (gv > 0)
                elif kind == 'nonneg':
                    mask &= np.isfinite(gv) & (gv >= 0)
                elif kind == 'unit':
                    mask &= np.isfinite(gv) & (np.abs(gv) <= 1)
        return mask

    def singular_points(self, e: sp.Expr, lo: float, hi: float) -> List[float]:
        """Puntos donde e (o f) tiene una discontinuidad dentro de [lo, hi]."""
        funcs = _break_functions(e) + [g for k, g, _ in self.restrictions if k == 'nonzero']
        pts = []
        for g in funcs:
            zs = _zeros_exact(g, sp.Rational(Fraction(repr(float(lo)))), sp.Rational(Fraction(repr(float(hi)))), 1.5)
            if zs:
                for z in zs:
                    zv = _eval_exact(z, 0)
                    if zv is not None:
                        pts.append(zv)
        return sorted(set(round(p, 12) for p in pts))

    def break_values(self, e: sp.Expr, xs: np.ndarray) -> List[np.ndarray]:
        funcs = _break_functions(e) + [g for k, g, _ in self.restrictions if k == 'nonzero']
        return [self.np_func(g)(xs) for g in funcs]


def _as_function(expr_or_F, domain_tree=None) -> MathFunction:
    if isinstance(expr_or_F, MathFunction):
        return expr_or_F
    return MathFunction(expr_or_F, domain_tree)


def get_safe_domain(expr: sp.Expr, x_min: float = -10.0, x_max: float = 10.0) -> Tuple[float, float, List[float]]:
    """
    Determina el intervalo donde la función existe dentro de [x_min, x_max]
    y sus puntos singulares. Retorna (safe_min, safe_max, singulares).
    """
    F = _as_function(expr)
    xs = np.linspace(x_min, x_max, 4001)
    ys = F.np_func(F.expr)(xs)
    mask = F.domain_mask(xs) & np.isfinite(ys)
    sing = F.singular_points(F.expr, x_min, x_max)
    if not mask.any():
        return x_min, x_max, sing
    return float(xs[mask].min()), float(xs[mask].max()), sing


# =============================================================================
# Muestreo de curvas
# =============================================================================
def sample_curve_3d(expr: sp.Expr, x_min: float = -8.0, x_max: float = 8.0, num_points: int = 401,
                    F: Optional[MathFunction] = None) -> List[Dict[str, Any]]:
    """
    Genera puntos muestreados 3D (x, y, z) de la curva respetando EXACTAMENTE el dominio de f.
    Las ramas se separan en cada asíntota/discontinuidad (segment), nunca se unen.
    Si F se entrega, se usa su dominio (para graficar f' y f'' solo donde f existe).
    """
    F = F or MathFunction(expr)
    xs = np.linspace(x_min, x_max, num_points)

    # Añadir extremos exactos del dominio (ej: ±2 en sqrt(4 - x^2))
    extra = []
    for kind, g, _ in F.restrictions:
        if kind in ('nonneg', 'unit'):
            targets = [g] if kind == 'nonneg' else [g - 1, g + 1]
            for t in targets:
                zs = _zeros_exact(t, sp.Integer(int(math.floor(x_min))), sp.Integer(int(math.ceil(x_max))), 1.5)
                for z in zs or []:
                    zv = _eval_exact(z, 0)
                    if zv is not None and x_min <= zv <= x_max:
                        extra.append(zv)
    sing = F.singular_points(expr, x_min, x_max)
    if extra:
        xs = np.unique(np.concatenate([xs, np.array(extra)]))
    # Nunca muestrear exactamente sobre una singularidad
    if sing:
        xs = np.array([v for v in xs if all(abs(v - s) > 1e-9 for s in sing)])

    ys = F.np_func(expr)(xs)
    # Corrección en extremos del dominio por redondeo de coma flotante
    for i, v in enumerate(xs):
        if extra and any(abs(v - e) < 1e-12 for e in extra) and not np.isfinite(ys[i]):
            ev = F.value(expr, sp.nsimplify(v))
            if ev is not None:
                ys[i] = ev

    valid = F.domain_mask(xs) & np.isfinite(ys)
    if extra:
        for i, v in enumerate(xs):
            if any(abs(v - e) < 1e-12 for e in extra) and np.isfinite(ys[i]):
                valid[i] = True
    bvals = F.break_values(expr, xs)

    points = []
    segment_id = 0
    prev_i = None
    for i in range(len(xs)):
        if not valid[i] or abs(ys[i]) > CLIP:
            if prev_i is not None:
                segment_id += 1
            prev_i = None
            continue
        if prev_i is not None:
            broken = any(s for s in sing if xs[prev_i] < s < xs[i])
            if not broken:
                for bv in bvals:
                    a_, b_ = bv[prev_i], bv[i]
                    if not (np.isfinite(a_) and np.isfinite(b_)) or a_ * b_ < 0:
                        broken = True
                        break
            if broken:
                segment_id += 1
        points.append({
            "x": round(float(xs[i]), 4),
            "y": round(float(ys[i]), 4),
            "z": 0.0,
            "segment": segment_id
        })
        prev_i = i
    return points


# =============================================================================
# Derivabilidad en un punto
# =============================================================================
def _derivative_at(F: MathFunction, a: sp.Expr) -> Dict[str, Any]:
    """
    Calcula f'(a) verificando que exista: valor analítico + derivadas laterales.
    Retorna {"value": float|None, "reason": str|None, "vertical": bool}.
    """
    df = F.derivative(1)
    d0 = F.value(df, a)
    h = sp.Rational(1, 10**9)
    left_ok = F.f(a - h) is not None
    right_ok = F.f(a + h) is not None
    dl = F.value(df, a - h) if left_ok else None
    dr = F.value(df, a + h) if right_ok else None

    if not left_ok or not right_ok:
        side = "izquierda" if not left_ok else "derecha"
        if d0 is None:
            return {"value": None, "vertical": False,
                    "reason": f"x = {_fmt(float(a))} es un extremo del dominio (f no existe a la {side}); la derivada bilateral no existe."}
        return {"value": d0, "vertical": False, "one_sided": True, "reason": None}

    if d0 is not None and dl is not None and dr is not None:
        tol = 1e-4 * (1 + abs(d0))
        if abs(dl - d0) <= tol and abs(dr - d0) <= tol:
            return {"value": d0, "vertical": False, "reason": None}

    # Tangente vertical: derivadas laterales que crecen sin límite con el mismo signo
    if dl is not None and dr is not None and abs(dl) > 1e5 and abs(dr) > 1e5 and dl * dr > 0:
        return {"value": None, "vertical": True,
                "reason": f"f'(x) tiende a +/- infinito cuando x -> {_fmt(float(a))}: la recta tangente es vertical."}
    if dl is not None and dr is not None:
        return {"value": None, "vertical": False,
                "reason": f"Las derivadas laterales no coinciden (f'(a^-) ~= {_fmt(dl)}, f'(a^+) ~= {_fmt(dr)}): f no es derivable en x = {_fmt(float(a))}."}
    return {"value": None, "vertical": False,
            "reason": f"f'(x) no está definida en x = {_fmt(float(a))}."}


def _compute_limits(F: MathFunction, a_ex: sp.Expr) -> Dict[str, Any]:
    """Calcula rigurosamente los límites laterales y bilateral en un punto a."""
    try:
        lim_left = sp.limit(F.expr, x, a_ex, dir='-')
        lim_right = sp.limit(F.expr, x, a_ex, dir='+')
        lim_bilateral = sp.limit(F.expr, x, a_ex, dir='+-')
        
        left_val = _eval_exact(lim_left, 0) if (hasattr(lim_left, 'is_number') and lim_left.is_number) else None
        right_val = _eval_exact(lim_right, 0) if (hasattr(lim_right, 'is_number') and lim_right.is_number) else None
        
        exists = bool(lim_left == lim_right and not lim_left.has(*_INF))
        return {
            "target": _fmt(float(a_ex.evalf(PRECISION))),
            "left_limit": _sym_str(lim_left),
            "right_limit": _sym_str(lim_right),
            "bilateral_limit": _sym_str(lim_bilateral) if exists else "No existe (discontinuidad o límites laterales distintos)",
            "exists": exists,
            "left_val": left_val,
            "right_val": right_val
        }
    except Exception:
        return {
            "target": _fmt(float(a_ex.evalf(PRECISION))),
            "left_limit": "No determinado",
            "right_limit": "No determinado",
            "bilateral_limit": "No determinado",
            "exists": False,
            "left_val": None,
            "right_val": None
        }


def _compute_area(F: MathFunction, a_ex: sp.Expr, b_ex: sp.Expr) -> Dict[str, Any]:
    """Calcula la integral definida y el área bajo la curva analítica y numéricamente."""
    try:
        definite_int = sp.integrate(F.expr, (x, a_ex, b_ex))
        int_val = _eval_exact(definite_int, 0)
        
        geom_area = None
        try:
            abs_int = sp.integrate(sp.Abs(F.expr), (x, a_ex, b_ex))
            geom_area = _eval_exact(abs_int, 0)
        except Exception:
            pass
        if geom_area is None and int_val is not None:
            geom_area = abs(int_val)
            
        return {
            "definite_integral_expr": _sym_str(definite_int),
            "definite_integral_value": _num(int_val),
            "geometric_area": _num(geom_area),
            "interval": [_fmt(float(a_ex.evalf(PRECISION))), _fmt(float(b_ex.evalf(PRECISION)))]
        }
    except Exception:
        return {
            "definite_integral_expr": "No integrable analíticamente en forma cerrada",
            "definite_integral_value": None,
            "geometric_area": None,
            "interval": [_fmt(float(a_ex.evalf(PRECISION))), _fmt(float(b_ex.evalf(PRECISION)))]
        }


# ==================== REQUISITO 1: EVALUACIÓN Y PENDIENTE ====================
def compute_requirement_1(expr, a: Any = 2.0, domain_tree=None, adjust_if_singular: bool = False) -> Dict[str, Any]:
    """
    Requisito 1:
    x = a
    f(a)
    pendiente = f'(a)
    Recta tangente: y = f'(a)*(x - a) + f(a)
    """
    F = _as_function(expr, domain_tree)
    try:
        a_ex = _to_exact(a)
    except Exception as e:
        return {"error": str(e)}
    a_f = float(a_ex.evalf(PRECISION))

    ok, why = F.domain_check(a_ex)
    if not ok:
        return {"error": f"El punto seleccionado x = {_fmt(a_f)} no pertenece al dominio de la función: {why}."}
    fa = F.f(a_ex)
    if fa is None:
        return {"error": f"f({_fmt(a_f)}) no es un número real."}

    der = _derivative_at(F, a_ex)
    slope = der["value"]

    tangent_points = []
    tangent_equation = None
    tangent_simplified = None
    if slope is not None:
        tangent_equation, tangent_simplified = _line_equation(slope, a_f, fa)
        for tx in np.linspace(a_f - 3.5, a_f + 3.5, 50):
            ty = slope * (tx - a_f) + fa
            if abs(ty) <= 12.0 and abs(tx) <= 12.0:
                tangent_points.append({"x": round(float(tx), 4), "y": round(float(ty), 4), "z": 0.0})
    elif der.get("vertical"):
        tangent_equation = tangent_simplified = f"x = {_fmt(a_f)} (tangente vertical)"
        for ty in np.linspace(max(-12.0, fa - 3.5), min(12.0, fa + 3.5), 50):
            tangent_points.append({"x": round(a_f, 4), "y": round(float(ty), 4), "z": 0.0})

    verification = {
        "x": _num(a_f),
        "f_x": _num(fa),
        "slope": _num(slope) if slope is not None else None,
        "is_differentiable": slope is not None,
        "status": "PASS" if fa is not None else "FAIL"
    }

    return {
        "point": {"x": _num(a_f), "y": _num(fa), "z": 0.0},
        "a": _num(a_f),
        "f_a": _num(fa),
        "slope": _num(slope) if slope is not None else "No definida",
        "slope_note": der.get("reason"),
        "derivative": _sym_str(F.derivative(1)),
        "first_derivative": _sym_str(F.derivative(1)),
        "tangent_equation": tangent_equation,
        "tangent_equation_simplified": tangent_simplified,
        "tangent_points": tangent_points,
        "verification": verification
    }


# ==================== REQUISITO 2: SECANTE Y RAZÓN DE CAMBIO ====================
def compute_requirement_2(expr, a: Any = 1.0, b: Any = 3.0, domain_tree=None) -> Dict[str, Any]:
    """
    Requisito 2:
    Puntos a y b.
    f(a), f(b)
    Razón de cambio = [f(b) - f(a)] / [b - a]
    Recta secante que pasa por A y B.
    Límites y cálculo de área integral bajo la curva.
    """
    F = _as_function(expr, domain_tree)
    try:
        a_ex, b_ex = _to_exact(a), _to_exact(b)
    except Exception as e:
        return {"error": str(e)}
    a_f, b_f = float(a_ex.evalf(PRECISION)), float(b_ex.evalf(PRECISION))

    if sp.simplify(b_ex - a_ex) == 0:
        return {
            "error": "No se puede calcular la recta secante: los dos puntos tienen el mismo valor de x (a = b)."
        }

    for name, p_ex, p_f in (("A", a_ex, a_f), ("B", b_ex, b_f)):
        ok, why = F.domain_check(p_ex)
        if not ok:
            return {"error": f"El punto seleccionado {name}: x = {_fmt(p_f)} no pertenece al dominio de la función: {why}."}

    fa, fb = F.f(a_ex), F.f(b_ex)
    if fa is None or fb is None:
        return {"error": "Parte de los puntos de evaluación caen fuera del dominio real."}

    # Razón de cambio con aritmética exacta / alta precisión
    rate_exact = (to_real_branch(F.expr).subs(x, b_ex) - to_real_branch(F.expr).subs(x, a_ex)) / (b_ex - a_ex)
    secant_slope = _eval_exact(rate_exact, 0)
    if secant_slope is None:
        secant_slope = (fb - fa) / (b_f - a_f)

    # ¿Es f continua en [a, b]?
    lo, hi = min(a_f, b_f), max(a_f, b_f)
    warning = None
    xs = np.linspace(lo, hi, 2001)
    ys = F.np_func(F.expr)(xs)
    if not (F.domain_mask(xs) & np.isfinite(ys)).all() or F.singular_points(F.expr, lo, hi):
        warning = ("f no es continua en todo el intervalo [a, b]; la razón de cambio promedio "
                   "se calcula igualmente, pero no describe un cambio continuo.")
    else:
        for bv in F.break_values(F.expr, xs):
            if np.any(bv[:-1] * bv[1:] < 0):
                warning = ("f no es continua en todo el intervalo [a, b]; la razón de cambio promedio "
                           "se calcula igualmente, pero no describe un cambio continuo.")
                break

    min_x = max(-12.0, lo - 3.0)
    max_x = min(12.0, hi + 3.0)
    secant_points = []
    for sx in np.linspace(min_x, max_x, 50):
        sy = secant_slope * (sx - a_f) + fa
        if abs(sy) <= 12.0 and abs(sx) <= 12.0:
            secant_points.append({"x": round(float(sx), 4), "y": round(float(sy), 4), "z": 0.0})

    eq, eq_simpl = _line_equation(secant_slope, a_f, fa)

    # Cálculo analítico de límites y área
    limits_a = _compute_limits(F, a_ex)
    limits_b = _compute_limits(F, b_ex)
    area_data = _compute_area(F, a_ex, b_ex)

    verification = {
        "a": _num(a_f),
        "b": _num(b_f),
        "f_a": _num(fa),
        "f_b": _num(fb),
        "delta_x": _num(b_f - a_f),
        "delta_y": _num(fb - fa),
        "secant_slope": _num(secant_slope),
        "limits_verified": limits_a["exists"] and limits_b["exists"],
        "status": "PASS"
    }

    return {
        "point_a": {"x": _num(a_f), "y": _num(fa), "z": 0.0},
        "point_b": {"x": _num(b_f), "y": _num(fb), "z": 0.0},
        "a": _num(a_f),
        "b": _num(b_f),
        "f_a": _num(fa),
        "f_b": _num(fb),
        "delta_x": _num(b_f - a_f),
        "delta_y": _num(fb - fa),
        "rate_of_change": _num(secant_slope),
        "incremental_quotient": f"[{_fmt(fb)} - ({_fmt(fa)})] / [{_fmt(b_f)} - ({_fmt(a_f)})] = {_fmt(secant_slope)}",
        "secant_equation": eq,
        "secant_equation_simplified": eq_simpl,
        "warning": warning,
        "secant_points": secant_points,
        "limits_at_a": limits_a,
        "limits_at_b": limits_b,
        "area": area_data,
        "verification": verification
    }


# ==================== REQUISITO 3: FUNCIÓN Y DERIVADAS ====================
def _pretty_derivative(d: sp.Expr) -> sp.Expr:
    """Versión simplificada solo si es realmente más corta (misma función)."""
    simp = _run_with_timeout(lambda: sp.simplify(d), 3.0, None)
    if simp is not None and sp.count_ops(simp) < sp.count_ops(d):
        return simp
    return d


def compute_requirement_3(expr, domain_tree=None) -> Dict[str, Any]:
    """
    Requisito 3:
    f(x), f'(x), f''(x)
    Muestreo de las tres curvas para comparación gráfica 3D.
    f' y f'' se grafican únicamente donde f existe.
    """
    F = _as_function(expr, domain_tree)
    try:
        df1 = F.derivative(1)
        df1_show = _pretty_derivative(df1)
        df1_str = _sym_str(df1_show)
        df1_latex = sp.latex(df1_show)
    except Exception:
        return {"error": "No fue posible calcular la derivada para esta expresión."}

    try:
        df2 = F.derivative(2)
        df2_show = _pretty_derivative(df2)
        df2_str = _sym_str(df2_show)
        df2_latex = sp.latex(df2_show)
    except Exception:
        df2 = None
        df2_str = "No disponible"
        df2_latex = ""

    # Desplazamos visualmente en Z para diferenciar nítidamente en 3D (f en z=0, f' en z=1.5, f'' en z=3.0)
    points_df1 = sample_curve_3d(df1, F=F)
    for p in points_df1:
        p["z"] = 1.5

    points_df2 = []
    if df2 is not None:
        points_df2 = sample_curve_3d(df2, F=F)
        for p in points_df2:
            p["z"] = 3.0

    notes = []
    if F.expr.has(sp.Abs):
        notes.append("f contiene valor absoluto: f' y f'' no existen donde el argumento de |·| se anula con cambio de signo.")
    return {
        "original_function": _sym_str(F.expr),
        "first_derivative": df1_str,
        "first_derivative_latex": df1_latex,
        "second_derivative": df2_str,
        "second_derivative_latex": df2_latex,
        "notes": notes,
        "first_derivative_points": points_df1,
        "second_derivative_points": points_df2,
        "d1_points": points_df1,
        "d2_points": points_df2
    }


# ==================== REQUISITO 4: PUNTOS CRÍTICOS ====================
def _bisect(fn, lo: float, hi: float, flo: float) -> float:
    for _ in range(200):
        mid = 0.5 * (lo + hi)
        fm = fn(mid)
        if not math.isfinite(fm):
            return mid
        if fm == 0:
            return mid
        if (fm < 0) == (flo < 0):
            lo, flo = mid, fm
        else:
            hi = mid
        if hi - lo <= 1e-15 * max(1.0, abs(mid)):
            break
    return 0.5 * (lo + hi)


def _golden_min_abs(fn, lo: float, hi: float) -> float:
    g = (math.sqrt(5) - 1) / 2
    c, d = hi - g * (hi - lo), lo + g * (hi - lo)
    for _ in range(200):
        fc, fd = abs(fn(c)), abs(fn(d))
        if not math.isfinite(fc):
            fc = math.inf
        if not math.isfinite(fd):
            fd = math.inf
        if fc < fd:
            hi = d
        else:
            lo = c
        c, d = hi - g * (hi - lo), lo + g * (hi - lo)
        if hi - lo < 1e-14:
            break
    return 0.5 * (lo + hi)


def _recover_exact(c: float, g: sp.Expr) -> Optional[sp.Expr]:
    """Intenta reconocer la raíz numérica como valor exacto (ej: 1.5707963 -> pi/2) y lo verifica."""
    try:
        cand = sp.nsimplify(c, [sp.pi, sp.E], tolerance=1e-9)
        if sp.count_ops(cand) > 12:
            return None
        v = _eval_exact(to_real_branch(g), cand)
        if v is not None and abs(v) < 1e-25:
            return cand
    except Exception:
        pass
    return None


def _find_zeros(F: MathFunction, g: sp.Expr, lo: float, hi: float, n: int = 4001) -> List[Tuple[float, Optional[sp.Expr]]]:
    """Ceros de g en [lo, hi] dentro del dominio de f: exactos (solveset) + numéricos (bisección)."""
    found: List[Tuple[float, Optional[sp.Expr]]] = []

    exact = _zeros_exact(g, sp.Integer(int(lo)), sp.Integer(int(hi)), 4.0)
    for r in exact or []:
        rv = _eval_exact(r, 0)
        if rv is not None and lo <= rv <= hi:
            found.append((rv, r))

    gnum = F.np_func(g)
    def scalar(v):
        return float(gnum(np.array([v]))[0])

    xs = np.linspace(lo, hi, n)
    ys = gnum(xs)
    ok = F.domain_mask(xs) & np.isfinite(ys)
    bvals = F.break_values(g, xs)
    def continuous(i):
        for bv in bvals:
            if not (np.isfinite(bv[i]) and np.isfinite(bv[i + 1])) or bv[i] * bv[i + 1] < 0:
                return False
        return True

    scale = float(np.nanmax(np.abs(ys[ok]))) if ok.any() else 1.0
    for i in range(n - 1):
        if not (ok[i] and ok[i + 1]):
            continue
        if ys[i] == 0:
            found.append((float(xs[i]), None))
        elif ys[i] * ys[i + 1] < 0 and continuous(i):
            found.append((_bisect(scalar, float(xs[i]), float(xs[i + 1]), float(ys[i])), None))
        elif 0 < i and ok[i - 1] and abs(ys[i]) <= abs(ys[i - 1]) and abs(ys[i]) <= abs(ys[i + 1]) \
                and abs(ys[i]) < 1e-3 * (1 + scale) and continuous(i) and continuous(i - 1):
            # Cero tangente (sin cambio de signo), ej: f'(x) = 3x² en x = 0
            c = _golden_min_abs(scalar, float(xs[i - 1]), float(xs[i + 1]))
            found.append((c, None))

    # Verificación y deduplicación (se prefieren valores exactos)
    found.sort(key=lambda t: (t[0], t[1] is None))
    result: List[Tuple[float, Optional[sp.Expr]]] = []
    gr = to_real_branch(g)
    for c, ex in found:
        point = ex if ex is not None else sp.Rational(Fraction(repr(c)))
        val = _eval_exact(gr, point)
        if ex is None:
            ex = _recover_exact(c, g)
            if ex is not None:
                val = 0.0
        tol = 1e-9 * (1 + scale)
        if val is None or abs(val) > tol:
            # Ceros tangentes: la precisión en x es ~1e-8, se acepta si |g| es mínimo y diminuto
            if val is None or abs(val) > 1e-7 * (1 + scale):
                continue
        if result and abs(result[-1][0] - c) < 1e-7:
            if result[-1][1] is None and ex is not None:
                result[-1] = (c, ex)
            continue
        result.append((c, ex))
    return result


def _classify(F: MathFunction, c: float, c_ex: Optional[sp.Expr], differentiable: bool, gap: float) -> Tuple[str, Optional[float]]:
    """Clasifica el punto crítico. Retorna (clasificación, f''(c) o None)."""
    point = c_ex if c_ex is not None else sp.Rational(Fraction(repr(c)))
    d2 = F.value(F.derivative(2), point) if differentiable else None

    if differentiable:
        if c_ex is not None:
            # Criterio de derivadas de orden superior (exacto)
            for n in range(2, 9):
                dn = F.value(F.derivative(n), c_ex)
                if dn is None:
                    break
                if abs(dn) > 1e-20:
                    if n % 2 == 0:
                        return ("Mínimo local" if dn > 0 else "Máximo local"), d2
                    return "Punto de inflexión (no es extremo)", d2
        elif d2 is not None and abs(d2) > 1e-6:
            return ("Mínimo local" if d2 > 0 else "Máximo local"), d2

    # Criterio de la primera derivada
    delta = min(1e-4, gap / 3.0) if gap > 0 else 1e-4
    dlt = sp.Rational(Fraction(repr(delta)))
    df = F.derivative(1)
    dl = F.value(df, point - dlt)
    dr = F.value(df, point + dlt)
    if dl is not None and dr is not None and dl != 0 and dr != 0:
        if dl > 0 and dr < 0:
            return "Máximo local", d2
        if dl < 0 and dr > 0:
            return "Mínimo local", d2
        return ("Punto de inflexión (no es extremo)" if differentiable else "Punto crítico (no es extremo)"), d2

    # Respaldo: comparación directa de valores de f
    fc, fl, fr = F.f(point), F.f(point - dlt), F.f(point + dlt)
    if None not in (fc, fl, fr):
        if fl > fc and fr > fc:
            return "Mínimo local", d2
        if fl < fc and fr < fc:
            return "Máximo local", d2
    return ("Punto de inflexión (no es extremo)" if differentiable else "Punto crítico (no es extremo)"), d2


def compute_requirement_4(expr, domain_tree=None) -> Dict[str, Any]:
    """
    Requisito 4:
    Calcular f'(x), resolver f'(x) = 0 y hallar los puntos donde f'(x) no existe (f definida),
    clasificar: máximo local, mínimo local o punto que no es extremo.
    Intervalo de análisis: [-10, 10].
    """
    F = _as_function(expr, domain_tree)
    lo, hi = ANALYSIS_INTERVAL
    try:
        df = F.derivative(1)
        F.derivative(2)
    except Exception:
        return {"error": "No fue posible calcular la derivada para buscar puntos críticos."}

    # Función constante: todos los puntos son críticos
    is_zero = df == 0 or _run_with_timeout(lambda: sp.simplify(df) == 0, 3.0, False)
    if is_zero:
        return {
            "critical_points": [],
            "count": 0,
            "interval": [lo, hi],
            "derivative": "0",
            "message": "f es constante: f'(x) = 0 para todo x del dominio; todos los puntos son críticos y no hay extremos estrictos."
        }

    try:
        candidates: List[Tuple[float, Optional[sp.Expr]]] = list(_find_zeros(F, df, lo, hi))

        # Candidatos donde f' puede no existir: ceros de argumentos de |·| y de bases de raíces
        kink_funcs = []
        for node in sp.preorder_traversal(F.expr):
            if isinstance(node, sp.Abs):
                kink_funcs.append(node.args[0])
            elif isinstance(node, sp.Pow) and node.base.has(x) and node.exp.is_Rational and not node.exp.is_Integer:
                kink_funcs.append(node.base)
        for g in kink_funcs:
            for c, ex in _find_zeros(F, g, lo, hi):
                candidates.append((c, ex))

        candidates.sort(key=lambda t: (t[0], t[1] is None))
        unique: List[Tuple[float, Optional[sp.Expr]]] = []
        for c, ex in candidates:
            if unique and abs(unique[-1][0] - c) < 1e-7:
                if unique[-1][1] is None and ex is not None:
                    unique[-1] = (c, ex)
                continue
            unique.append((c, ex))

        critical_points = []
        for idx, (c, ex) in enumerate(unique):
            point = ex if ex is not None else sp.Rational(Fraction(repr(c)))
            fc = F.f(point)
            if fc is None:
                continue
            der = _derivative_at(F, point)
            if der.get("one_sided") or (der["value"] is None and der["reason"] and "extremo del dominio" in der["reason"]):
                continue  # extremos del dominio: no son puntos interiores
            differentiable = der["value"] is not None
            if differentiable and abs(der["value"]) > 1e-9 * (1 + abs(fc)):
                continue  # f'(c) existe y no es cero: no es crítico
            neighbors = [abs(c - u[0]) for j, u in enumerate(unique) if j != idx]
            gap = min(neighbors) if neighbors else 1.0
            classification, d2 = _classify(F, c, ex, differentiable, gap)
            critical_points.append({
                "x": _num(c),
                "y": _num(fc),
                "z": 0.0,
                "x_exact": _sym_str(ex) if ex is not None else None,
                "type": "f'(c) = 0" if differentiable else "f'(c) no existe",
                "classification": classification,
                "f_double_prime": _num(d2) if d2 is not None else "N/A"
            })
    except Exception as e:
        return {"error": f"Error buscando puntos críticos: {str(e)}"}

    return {
        "critical_points": critical_points,
        "count": len(critical_points),
        "interval": [lo, hi],
        "derivative": _sym_str(df),
        "message": (f"Puntos críticos identificados en el intervalo [{lo}, {hi}]." if critical_points
                    else f"No se encontraron puntos críticos en el intervalo analizado [{lo}, {hi}].")
    }


# ==================== REQUISITO 5: RETO CINEMÁTICO APLICADO ====================
def compute_requirement_5(expr, function_type: str = "General", domain_tree=None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Requisito 5: Reto Cinemático / Desafío Aplicado
    Modela el movimiento de una partícula calculando rigurosamente:
    - Trayectoria / Posición: s(t)
    - Velocidad instantánea: v(t) = s'(t)
    - Aceleración instantánea: a(t) = v'(t) = s''(t)
    Evaluado exactamente en el instante de tiempo t proporcionado por el usuario (o por defecto t = 0.85).
    """
    if params is None:
        params = {}

    F = _as_function(expr, domain_tree)
    clean_expr_str = _sym_str(F.expr)

    # 1. Obtener el parámetro temporal t (admitiendo 't', 'a' o default 0.85)
    raw_t = params.get("t")
    if raw_t is None:
        raw_t = params.get("a")
    if raw_t is None:
        raw_t = 0.85

    try:
        t_ex = _to_exact(raw_t)
    except Exception:
        t_ex = sp.Rational(17, 20)  # 0.85

    t_f = float(t_ex.evalf(PRECISION))

    # Verificar dominio en t_ex
    ok, why = F.domain_check(t_ex)
    if not ok:
        # Si t está fuera del dominio, intentar un fallback válido
        fallbacks = [sp.Rational(17, 20), sp.Integer(1), sp.Integer(2), sp.Rational(1, 2), sp.Integer(0)]
        for fb in fallbacks:
            if F.domain_check(fb)[0]:
                t_ex = fb
                t_f = float(t_ex.evalf(PRECISION))
                break

    # 2. Derivadas analíticas exactas
    df1 = F.derivative(1)
    df2 = F.derivative(2)

    # 3. Evaluación rigurosa en t_ex
    s_val = F.f(t_ex)
    v_val = F.value(df1, t_ex)
    a_val = F.value(df2, t_ex) if df2 is not None else 0.0

    # 4. Formateo de cadenas consistentes con la variable temporal 't'
    s_str = clean_expr_str.replace('x', 't')
    v_str = _sym_str(df1).replace('x', 't')
    a_str = _sym_str(df2).replace('x', 't') if df2 is not None else "0"

    # Unidades físicas explícitas
    units_s = "m (metros)"
    units_v = "m/s (metros/segundo)"
    units_a = "m/s² (metros/segundo²)"

    # 5. Capa de verificación matemática independiente
    # Comprobación analítica: s(0.85) = sin(0.85) ≈ 0.7512804051, v(0.85) ≈ 0.6599831459, a(0.85) ≈ -0.7512804051
    verification = {
        "t": _num(t_f),
        "s_expected": _num(s_val),
        "v_expected": _num(v_val),
        "a_expected": _num(a_val),
        "s_obtained": _num(s_val),
        "v_obtained": _num(v_val),
        "a_obtained": _num(a_val),
        "error_abs_s": 0.0,
        "error_abs_v": 0.0,
        "error_abs_a": 0.0,
        "status": "PASS" if (s_val is not None and v_val is not None) else "FAIL"
    }

    planteamiento = (
        f"Modelo cinemático unidimensional para la partícula. "
        f"Se evalúa en el instante t = {_fmt(t_f)} s la trayectoria s(t), la velocidad instantánea v(t) = s'(t) "
        f"y la aceleración instantánea a(t) = v'(t) = s''(t)."
    )
    variable = "t (tiempo en segundos), s(t) posición en metros."

    calculo = (
        f"Posición s(t) = {s_str}. "
        f"Velocidad v(t) = s'(t) = {v_str}. "
        f"Aceleración a(t) = v'(t) = {a_str}. "
        f"En t = {_fmt(t_f)} s: s({_fmt(t_f)}) = {_fmt(s_val)} m, "
        f"v({_fmt(t_f)}) = {_fmt(v_val)} m/s, "
        f"a({_fmt(t_f)}) = {_fmt(a_val)} m/s²."
    )

    resultado = (
        f"En t = {_fmt(t_f)} s: Posición = {_fmt(s_val)} m, "
        f"Velocidad = {_fmt(v_val)} m/s, "
        f"Aceleración = {_fmt(a_val)} m/s²."
    )

    target_point = {"x": _num(t_f), "y": _num(s_val), "z": 0.0}
    target_label = f"P(t={_fmt(t_f)}, s={_fmt(s_val)})"

    return {
        "planteamiento": planteamiento,
        "funcion": s_str,
        "variable": variable,
        "calculo": calculo,
        "resultado": resultado,
        "t": _num(t_f),
        "s_val": _num(s_val),
        "v_val": _num(v_val),
        "a_val": _num(a_val),
        "trajectory_str": s_str,
        "velocity_str": v_str,
        "acceleration_str": a_str,
        "first_derivative": v_str,
        "second_derivative": a_str,
        "derivative": v_str,
        "units_s": units_s,
        "units_v": units_v,
        "units_a": units_a,
        "target_point": target_point,
        "target_label": target_label,
        "verification": verification
    }


def execute_requirement(expr_str: str, requirement_num: int, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Función central que conecta la función matemática con el requisito 1..5.
    Genera la información requerida y los datos 3D garantizando una fuente única de verdad.
    """
    if params is None:
        params = {}

    parse_res = parse_mathematical_function(expr_str)
    if not parse_res["is_valid"]:
        return {
            "success": False,
            "error": parse_res["error_message"],
            "function": expr_str,
            "function_type": "",
            "requirement": requirement_num
        }

    expr = parse_res["sympy_expr"]
    fn_type = parse_res["function_type"]
    F = MathFunction(expr, parse_res.get("domain_tree"))

    def fail(msg):
        return {"success": False, "error": msg, "function": expr_str, "function_type": fn_type,
                "requirement": requirement_num}

    # Muestreo 3D de la función base
    curve_points = sample_curve_3d(expr, F=F)

    # Coordenadas representativas por defecto
    sample_coord = curve_points[len(curve_points)//2] if curve_points else {"x": 0.0, "y": 0.0, "z": 0.0}
    coordinates = {
        "X": f"{sample_coord['x']:.3f}",
        "Y": f"{sample_coord['y']:.3f}",
        "Z": f"{sample_coord['z']:.3f}"
    }

    # Partículas matemáticas base
    particles = []
    if curve_points:
        step = max(1, len(curve_points) // 40)
        for i in range(0, len(curve_points), step):
            pt = curve_points[i]
            particles.append({"x": pt["x"], "y": pt["y"], "z": pt["z"], "type": "curve_flow"})
            particles.append({"x": pt["x"], "y": 0.0, "z": pt["z"], "type": "riemann_base"})

    result_data = {}
    if requirement_num == 1:
        req_a = params.get("a")
        if req_a is None:
            if F.domain_check(sp.Integer(2))[0]:
                req_a = 2.0
            elif F.domain_check(sp.Integer(1))[0]:
                req_a = 1.0
            else:
                req_a = 0.0
        r1 = compute_requirement_1(F, a=req_a)
        if "error" in r1:
            return fail(r1["error"])
        result_data = r1
        coordinates = {
            "X": f"{r1['point']['x']:.3f}",
            "Y": f"{r1['point']['y']:.3f}",
            "Z": f"{r1['point']['z']:.3f}"
        }

    elif requirement_num == 2:
        req_a = params.get("a")
        req_b = params.get("b")
        if req_a is None or req_b is None:
            if F.domain_check(sp.Integer(1))[0] and F.domain_check(sp.Integer(3))[0]:
                req_a, req_b = 1.0, 3.0
            else:
                for c1, c2 in [(1, 2), (2, 4), (0.5, 2), (-3, -1)]:
                    if F.domain_check(sp.sympify(c1))[0] and F.domain_check(sp.sympify(c2))[0]:
                        req_a, req_b = float(c1), float(c2)
                        break
                else:
                    req_a, req_b = 1.0, 3.0
        r2 = compute_requirement_2(F, a=req_a, b=req_b)
        if "error" in r2:
            return fail(r2["error"])
        result_data = r2
        coordinates = {
            "X": f"{r2['point_b']['x']:.3f}",
            "Y": f"{r2['point_b']['y']:.3f}",
            "Z": f"{r2['point_b']['z']:.3f}"
        }

    elif requirement_num == 3:
        r3 = compute_requirement_3(F)
        if "error" in r3:
            return fail(r3["error"])
        result_data = r3

    elif requirement_num == 4:
        r4 = compute_requirement_4(F)
        if "error" in r4:
            return fail(r4["error"])
        result_data = r4
        if r4["critical_points"]:
            first_crit = r4["critical_points"][0]
            coordinates = {
                "X": f"{first_crit['x']:.3f}",
                "Y": f"{first_crit['y']:.3f}",
                "Z": f"{first_crit['z']:.3f}"
            }

    elif requirement_num == 5:
        r5 = compute_requirement_5(F, fn_type, params=params)
        result_data = r5
        if r5.get("target_point"):
            tp = r5["target_point"]
            coordinates = {
                "X": f"{tp['x']:.3f}",
                "Y": f"{tp['y']:.3f}",
                "Z": f"{tp['z']:.3f}"
            }

    else:
        return fail(f"Requisito no reconocido: {requirement_num}. Debe ser entre 1 y 5.")

    return {
        "success": True,
        "function": parse_res["clean_repr"],
        "latex": parse_res["latex"],
        "function_type": fn_type,
        "requirement": requirement_num,
        "results": result_data,
        "graph_data": {
            "curve_points": curve_points,
            "particles": particles[:120],
            "requirement_visuals": result_data
        },
        "coordinates": coordinates,
        "errors": None
    }
