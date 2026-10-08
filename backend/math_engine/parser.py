"""
Parser matemático seguro utilizando SymPy.
Prohibido el uso de eval() directo sobre la entrada del usuario.

Garantías:
- Lista blanca estricta de caracteres e identificadores (no se exponen nombres de SymPy ni de Python).
- Multiplicación implícita robusta: "2xsin(x)", "xe^x", "sinx", "3(x+1)".
- Decimales convertidos a racionales exactos (0.5 -> 1/2) para evitar errores de redondeo.
- log(x) = logaritmo base 10 (convención escolar); ln(x) = logaritmo natural; log(x, b) = base b.
- Se conserva un árbol SIN simplificar para conocer el dominio real exacto
  (ej: x/x no está definida en x = 0, sqrt(x)^2 solo existe para x >= 0).
"""
import re
from functools import lru_cache
from typing import Dict, Any, List, Optional, Tuple
import sympy as sp
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
    convert_xor,
    rationalize,
)

# Símbolo estándar de la variable independiente
x = sp.Symbol('x', real=True)

# Transformaciones seguras para interpretar notaciones usuales (ej: 2x, x^2, 0.5)
TRANSFORMATIONS = (
    standard_transformations +
    (implicit_multiplication_application, convert_xor, rationalize)
)


def _log(arg, base=10, **_kwargs):
    """log(x) -> log base 10; log(x, b) -> log base b."""
    return sp.log(arg, base)


def _ln(arg, **_kwargs):
    return sp.log(arg)


# Nombre escrito por el usuario -> nombre canónico usado internamente
ALIASES = {
    'sen': 'sin', 'arcsin': 'asin', 'arcsen': 'asin', 'asen': 'asin',
    'arccos': 'acos', 'arctan': 'atan', 'arctg': 'atan', 'tg': 'tan',
    'cosec': 'csc', 'ctg': 'cot', 'cotg': 'cot', 'senh': 'sinh',
}

# Nombres canónicos permitidos -> objeto SymPy
CANONICAL = {
    'x': x,
    't': x,  # Soporte para variable temporal t
    'e': sp.E,
    'pi': sp.pi,
    'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan,
    'sec': sp.sec, 'csc': sp.csc, 'cot': sp.cot,
    'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
    'sinh': sp.sinh, 'cosh': sp.cosh, 'tanh': sp.tanh,
    'ln': _ln, 'log': _log,
    'exp': sp.exp, 'sqrt': sp.sqrt, 'cbrt': sp.cbrt, 'abs': sp.Abs,
}

FUNCTION_NAMES = {k for k in CANONICAL if k not in ('x', 't', 'e', 'pi')}
ALL_TOKENS = sorted(set(CANONICAL) | set(ALIASES), key=len, reverse=True)

# Mantener compatibilidad con código que importaba ALLOWED_FUNCTIONS
ALLOWED_FUNCTIONS = dict(CANONICAL)

# Solo se permite este conjunto de caracteres (tras normalización)
_ALLOWED_CHARS = re.compile(r'^[0-9a-z\s\+\-\*/\^\(\)\.,]*$')

# Diccionario global mínimo: nada de SymPy ni builtins accesibles desde la entrada
_GLOBAL_DICT = {
    '__builtins__': {},
    'Integer': sp.Integer,
    'Float': sp.Float,
    'Rational': sp.Rational,
    'Symbol': sp.Symbol,
    # Constructores necesarios para el árbol sin evaluar (evaluate=False)
    'Add': sp.Add,
    'Mul': sp.Mul,
    'Pow': sp.Pow,
}


def _expand_function_powers(s: str) -> str:
    """Notación escolar: cos^2(x) -> (cos(x))^2, sin^3(2x) -> (sin(2x))^3."""
    names = sorted(set(CANONICAL) | set(ALIASES), key=len, reverse=True)
    names = [n for n in names if n not in ('x', 'e', 'pi')]
    pat = re.compile(rf'\b({"|".join(names)})\s*\^\s*(\d+|\(\s*\d+\s*\))\s*\(')
    while True:
        m = pat.search(s)
        if not m:
            return s
        start_arg = m.end() - 1
        depth = 0
        end = None
        for i in range(start_arg, len(s)):
            if s[i] == '(':
                depth += 1
            elif s[i] == ')':
                depth -= 1
                if depth == 0:
                    end = i
                    break
        if end is None:
            return s
        func, power = m.group(1), m.group(2)
        s = s[:m.start()] + f"({func}{s[start_arg:end + 1]})^{power}" + s[end + 1:]


def clean_expression_string(expr_str: str) -> str:
    """Limpia y normaliza caracteres de entrada comunes."""
    if not expr_str:
        return ""
    s = expr_str.strip()
    replacements = {
        '√': 'sqrt', '∛': 'cbrt', 'π': 'pi', '·': '*', '×': '*', '÷': '/',
        '−': '-', '–': '-', '²': '^2', '³': '^3', '**': '^',
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    return s.lower()


def _decompose_word(word: str) -> Optional[List[str]]:
    """
    Descompone una secuencia de letras en tokens permitidos
    (ej: 'xsin' -> ['x', 'sin'], 'sinx' -> ['sin', 'x'], 'ex' -> ['e', 'x']).
    Retorna None si no es posible.
    """
    @lru_cache(maxsize=None)
    def solve(i: int) -> Optional[Tuple[str, ...]]:
        if i == len(word):
            return ()
        for tok in ALL_TOKENS:
            if word.startswith(tok, i):
                rest = solve(i + len(tok))
                if rest is not None:
                    return (tok,) + rest
        return None

    res = solve(0)
    return list(res) if res is not None else None


def _tokenize_identifiers(s: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Reemplaza cada palabra por sus tokens canónicos separados por espacio
    (la multiplicación/aplicación implícita la resuelve SymPy).
    Retorna (cadena_resultante, mensaje_error).
    """
    unknown_vars: List[str] = []
    unknown_words: List[str] = []

    def repl(m: re.Match) -> str:
        word = m.group(0)
        toks = _decompose_word(word)
        if toks is None:
            if len(word) == 1:
                unknown_vars.append(word)
            else:
                unknown_words.append(word)
            return word
        return ' ' + ' '.join(ALIASES.get(t, t) for t in toks) + ' '

    out = re.sub(r'[a-z]+', repl, s)
    if unknown_vars and not unknown_words:
        uniq = sorted(set(unknown_vars))
        return None, f"Variable(s) no permitida(s): {', '.join(uniq)}. Solo se permiten 'x' o 't'."
    if unknown_words or unknown_vars:
        uniq = sorted(set(unknown_words + unknown_vars))
        return None, (
            f"Función o variable no reconocida: {', '.join(uniq)}. "
            "Use x y funciones como sin, cos, tan, ln, log, exp, sqrt, abs."
        )
    # Función sin paréntesis: se aplica solo al argumento simple inmediato
    # "sin x cos x" -> "sin(x) cos(x)", "sin 2x" -> "sin(2x)"
    func_alt = '|'.join(sorted(FUNCTION_NAMES, key=len, reverse=True))
    atom = r'(?:\d+(?:\.\d+)?\s*)?(?:x|pi|e)\b|\d+(?:\.\d+)?'
    pattern = re.compile(rf'\b({func_alt})\s+({atom})(?!\s*[\^\(\.\d])')
    prev = None
    while prev != out:
        prev = out
        out = pattern.sub(lambda m: f"{m.group(1)}({m.group(2)})", out)
    return out, None


def _parentheses_balanced(s: str) -> bool:
    depth = 0
    for ch in s:
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth < 0:
                return False
    return depth == 0


def classify_function(expr: sp.Expr) -> str:
    """
    Clasifica la función según su estructura matemática:
    Trigonométrica, Logarítmica, Exponencial, Cuadrática, Racional, Raíz, Mixta, Otra, o función compuesta.
    """
    try:
        types_found = set()
        funcs = expr.atoms(sp.Function)

        # Verificar funciones trigonométricas (incluye hiperbólicas)
        trig_classes = (sp.sin, sp.cos, sp.tan, sp.sec, sp.csc, sp.cot, sp.asin, sp.acos, sp.atan,
                        sp.sinh, sp.cosh, sp.tanh)
        if any(isinstance(a, trig_classes) for a in funcs):
            types_found.add("Trigonométrica")

        # Verificar logarítmica
        if any(isinstance(a, sp.log) and a.args[0].has(x) for a in funcs):
            types_found.add("Logarítmica")

        # Verificar exponencial (exp(...) o constante^x)
        if any(isinstance(a, sp.exp) and a.args[0].has(x) for a in funcs):
            types_found.add("Exponencial")
        for p in expr.atoms(sp.Pow):
            if p.exp.has(x):
                types_found.add("Exponencial")

        # Verificar raíz (Pow con exponente fraccionario)
        for p in expr.atoms(sp.Pow):
            if p.base.has(x) and isinstance(p.exp, sp.Rational) and not p.exp.is_integer:
                types_found.add("Raíz")

        if any(isinstance(a, sp.Abs) for a in funcs):
            types_found.add("Valor absoluto")

        # Verificar polinómica / cuadrática
        is_poly = expr.is_polynomial(x) is True
        if is_poly:
            try:
                deg = sp.Poly(expr, x).degree()
                if deg == 2:
                    types_found.add("Cuadrática")
                elif deg == 1:
                    types_found.add("Lineal")
                elif deg == 3:
                    types_found.add("Cúbica")
                elif deg > 3:
                    types_found.add("Polinómica")
                else:
                    types_found.add("Constante")
            except Exception:
                pass

        # Verificar racional (no polinómica pura, cociente de polinomios o potencias negativas de x)
        if not is_poly and (expr.is_rational_function(x) is True):
            types_found.add("Racional")

        if len(types_found) == 1:
            return next(iter(types_found))
        elif len(types_found) > 1:
            return "Mixta"
        else:
            return "Otra"
    except Exception:
        return "Tipo: función compuesta"


def _error(cleaned: str, msg: str) -> Dict[str, Any]:
    return {
        "is_valid": False,
        "expression_str": cleaned,
        "latex": "",
        "function_type": "",
        "error_message": msg,
        "sympy_expr": None,
        "domain_tree": None,
    }


def parse_mathematical_function(raw_input: str) -> Dict[str, Any]:
    """
    Valida y convierte de forma segura la entrada en una expresión SymPy.
    Retorna un diccionario estructurado con:
    - is_valid: bool
    - expression_str: str (limpia)
    - latex: str
    - function_type: str
    - error_message: Optional[str]
    - sympy_expr: Optional[sp.Expr]
    - domain_tree: Optional[sp.Expr]  (árbol sin simplificar, para el dominio exacto)
    """
    if not raw_input or not raw_input.strip():
        return _error("", "La expresión está vacía.")

    cleaned = clean_expression_string(raw_input)

    # Verificar caracteres sospechosos o no permitidos (lista blanca)
    if not _ALLOWED_CHARS.match(cleaned) or '__' in cleaned:
        return _error(cleaned, "Operador o carácter no reconocido en la expresión.")

    # Verificar balance y orden de paréntesis
    if not _parentheses_balanced(cleaned):
        return _error(cleaned, "Falta cerrar un paréntesis o hay paréntesis desbalanceados.")

    # Un punto solo puede formar parte de un número decimal
    if re.search(r'\.(?!\d)', cleaned) or re.search(r'\d*\.\d*\.', cleaned):
        return _error(cleaned, "Número decimal mal escrito.")

    tokenized, err = _tokenize_identifiers(_expand_function_powers(cleaned))
    if err:
        return _error(cleaned, err)

    local_dict = dict(CANONICAL)

    try:
        expr = parse_expr(
            tokenized,
            local_dict=local_dict,
            global_dict=dict(_GLOBAL_DICT),
            transformations=TRANSFORMATIONS,
            evaluate=True
        )
    except Exception as e:
        err = str(e)
        if "^" in cleaned:
            msg = f"No se pudo interpretar la potencia o formato de exponente: {err}"
        else:
            msg = f"Error de sintaxis matemática: {err}"
        return _error(cleaned, msg)

    if not isinstance(expr, sp.Expr) or isinstance(expr, sp.Tuple):
        return _error(cleaned, "La entrada no es una expresión matemática de una sola función.")

    # Funciones mal usadas (ej: "sin" sin argumento)
    if any(isinstance(a, sp.FunctionClass) for a in sp.preorder_traversal(expr)):
        return _error(cleaned, "Hay una función escrita sin su argumento, por ejemplo sin(x).")

    # Validar que los símbolos sean únicamente 'x' (o constantes numéricas)
    unrecognized = [s.name for s in expr.free_symbols if s.name != 'x']
    if unrecognized:
        return _error(cleaned, f"Variable(s) no permitida(s): {', '.join(unrecognized)}. Solo se permite 'x'.")

    # Valores no reales o indefinidos en la propia expresión (ej: 1/0, sqrt(-1))
    if expr.has(sp.zoo, sp.nan, sp.oo, sp.S.NegativeInfinity):
        return _error(cleaned, "La expresión contiene una operación indefinida (por ejemplo, una división por cero).")
    if expr.has(sp.I):
        return _error(cleaned, "La expresión produce números complejos; solo se admiten funciones reales.")

    # Árbol sin simplificar para el análisis de dominio exacto
    try:
        domain_tree = parse_expr(
            tokenized,
            local_dict=dict(CANONICAL),
            global_dict=dict(_GLOBAL_DICT),
            transformations=TRANSFORMATIONS,
            evaluate=False
        )
    except Exception:
        domain_tree = expr

    fn_type = classify_function(expr)

    # Expresión formateada limpia
    clean_repr = str(expr).replace('**', '^')
    try:
        latex_str = sp.latex(expr)
    except Exception:
        latex_str = clean_repr

    return {
        "is_valid": True,
        "expression_str": cleaned,
        "clean_repr": clean_repr,
        "latex": latex_str,
        "function_type": fn_type,
        "error_message": None,
        "sympy_expr": expr,
        "domain_tree": domain_tree,
    }
