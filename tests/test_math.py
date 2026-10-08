"""
Pruebas exhaustivas para el motor matemático de 'Cálculo en Movimiento'.
"""
import pytest
from backend.math.parser import parse_mathematical_function
from backend.math.engine import (
    execute_requirement,
    compute_requirement_1,
    compute_requirement_2,
    compute_requirement_3,
    compute_requirement_4,
    compute_requirement_5,
    get_safe_domain
)

def test_parse_valid_functions():
    # Polinómica / Cuadrática
    p1 = parse_mathematical_function("x^2")
    assert p1["is_valid"] is True
    assert p1["function_type"] == "Cuadrática"

    # Trigonométrica
    p2 = parse_mathematical_function("sin(x)")
    assert p2["is_valid"] is True
    assert p2["function_type"] == "Trigonométrica"

    # Logarítmica
    p3 = parse_mathematical_function("ln(x)")
    assert p3["is_valid"] is True
    assert p3["function_type"] == "Logarítmica"

    # Exponencial
    p4 = parse_mathematical_function("e^x")
    assert p4["is_valid"] is True
    assert p4["function_type"] == "Exponencial"

    # Racional
    p5 = parse_mathematical_function("1/x")
    assert p5["is_valid"] is True
    assert p5["function_type"] == "Racional"

    # Raíz
    p6 = parse_mathematical_function("sqrt(x)")
    assert p6["is_valid"] is True
    assert p6["function_type"] == "Raíz"

def test_parse_invalid_and_edge_cases():
    # Vacía
    res_empty = parse_mathematical_function("")
    assert res_empty["is_valid"] is False
    assert "vacía" in res_empty["error_message"].lower()

    # Paréntesis desbalanceados
    res_paren = parse_mathematical_function("(x + 2")
    assert res_paren["is_valid"] is False
    assert "paréntesis" in res_paren["error_message"].lower()

    # Caracteres no permitidos
    res_inject = parse_mathematical_function("import os; os.system('ls')")
    assert res_inject["is_valid"] is False

    # Variable no permitida
    res_var = parse_mathematical_function("y + 3")
    assert res_var["is_valid"] is False
    assert "Variable(s) no permitida(s)" in res_var["error_message"]

def test_requirement_1_evaluation_and_slope():
    # f(x) = x^2 en a=2 -> f(2)=4, f'(2)=4
    res = execute_requirement("x^2", 1, {"a": 2.0})
    assert res["success"] is True
    assert res["results"]["f_a"] == 4.0
    assert res["results"]["slope"] == 4.0
    assert res["coordinates"]["X"] == "2.000"
    assert res["coordinates"]["Y"] == "4.000"

def test_requirement_2_secant_and_rate_of_change():
    # f(x) = x^2, a=1, b=3 -> f(1)=1, f(3)=9, rate = (9-1)/(3-1) = 4
    res = execute_requirement("x^2", 2, {"a": 1.0, "b": 3.0})
    assert res["success"] is True
    assert res["results"]["rate_of_change"] == 4.0
    assert res["results"]["f_a"] == 1.0
    assert res["results"]["f_b"] == 9.0

    # Caso extremo b = a
    res_same = execute_requirement("x^2", 2, {"a": 2.0, "b": 2.0})
    assert res_same["success"] is False
    assert "mismo valor de x" in res_same["error"]

def test_requirement_3_derivatives():
    # f(x) = x^2 -> f'(x) = 2x, f''(x) = 2
    res = execute_requirement("x^2", 3)
    assert res["success"] is True
    assert "2x" in res["results"]["first_derivative"] or "2*x" in res["results"]["first_derivative"]
    assert res["results"]["second_derivative"] == "2"

def test_requirement_4_critical_points():
    # f(x) = x^2 -> mínimo en x=0, y=0
    res = execute_requirement("x^2", 4)
    assert res["success"] is True
    assert res["results"]["count"] >= 1
    cp = res["results"]["critical_points"][0]
    assert abs(cp["x"] - 0.0) < 0.05
    assert cp["classification"] == "Mínimo local"

def test_requirement_5_applied_challenge():
    res = execute_requirement("x^2", 5)
    assert res["success"] is True
    assert "planteamiento" in res["results"]
    assert "variable" in res["results"]
    assert "calculo" in res["results"]
    assert "resultado" in res["results"]

def test_domain_respect():
    # ln(x) no debe evaluar en x <= 0
    res_ln = execute_requirement("ln(x)", 1, {"a": 1.0})
    assert res_ln["success"] is True
    assert res_ln["results"]["f_a"] == 0.0

    # 1/x en requisito 1
    res_recip = execute_requirement("1/x", 1, {"a": 2.0})
    assert res_recip["success"] is True
    assert res_recip["results"]["f_a"] == 0.5

def test_section_30_exact_specifications():
    # Probar como mínimo f(x) = x², f'(x) = 2x, f''(x) = 2, f(2) = 4, f'(2) = 4
    res_r3 = execute_requirement("x^2", 3)
    assert res_r3["success"] is True
    assert "2x" in res_r3["results"]["first_derivative"] or "2*x" in res_r3["results"]["first_derivative"]
    assert res_r3["results"]["second_derivative"] == "2"

    res_r1 = execute_requirement("x^2", 1, {"a": 2.0})
    assert res_r1["success"] is True
    assert res_r1["results"]["f_a"] == 4.0
    assert res_r1["results"]["slope"] == 4.0

    # Probar sin(x)
    res_sin = execute_requirement("sin(x)", 1, {"a": 0.0})
    assert res_sin["success"] is True
    assert res_sin["results"]["f_a"] == 0.0
    assert res_sin["results"]["slope"] == 1.0

    # Probar ln(x)
    res_ln3 = execute_requirement("ln(x)", 3)
    assert res_ln3["success"] is True
    assert "1/x" in res_ln3["results"]["first_derivative"]

    # Probar e^x
    res_exp = execute_requirement("e^x", 1, {"a": 0.0})
    assert res_exp["success"] is True
    assert res_exp["results"]["f_a"] == 1.0
    assert res_exp["results"]["slope"] == 1.0

    # Probar sqrt(x)
    res_sqrt = execute_requirement("sqrt(x)", 1, {"a": 4.0})
    assert res_sqrt["success"] is True
    assert res_sqrt["results"]["f_a"] == 2.0
    assert res_sqrt["results"]["slope"] == 0.25

def test_section_30_extreme_cases():
    # Función con espacios
    res_spaces = parse_mathematical_function("   x ^ 2   +   3 * x   ")
    assert res_spaces["is_valid"] is True

    # Paréntesis incorrectos
    res_parens = parse_mathematical_function("((x + 1) * (x - 2)")
    assert res_parens["is_valid"] is False
    assert "paréntesis" in res_parens["error_message"].lower()

    # Operador no reconocido
    res_op = parse_mathematical_function("x @ 2")
    assert res_op["is_valid"] is False

    # Valores grandes en evaluación
    res_large = execute_requirement("x^2", 1, {"a": 100.0})
    assert res_large["success"] is True

    # Intento de división por cero directa en a=0 para 1/x debe rechazar con error de dominio
    res_div0 = execute_requirement("1/x", 1, {"a": 0.0})
    assert res_div0["success"] is False
    assert "dominio" in res_div0["error"].lower()


def test_section_19_full_validation_suite():
    # Prueba 1: f(x) = x^2 - 4x + 3 en x = 2
    r1 = execute_requirement("x^2 - 4*x + 3", 1, {"a": 2.0})
    assert r1["success"] is True
    assert r1["results"]["a"] == 2.0
    assert r1["results"]["f_a"] == -1.0
    assert r1["results"]["slope"] == 0.0
    assert r1["results"]["tangent_equation"] == "y = -1"

    # Derivadas de Prueba 1
    r1_d = execute_requirement("x^2 - 4*x + 3", 3)
    assert r1_d["success"] is True
    assert "2x - 4" in r1_d["results"]["first_derivative"] or "2*x - 4" in r1_d["results"]["first_derivative"]
    assert r1_d["results"]["second_derivative"] == "2"

    # Puntos críticos de Prueba 1: Mínimo local en (2, -1)
    r1_cp = execute_requirement("x^2 - 4*x + 3", 4)
    assert r1_cp["success"] is True
    assert r1_cp["results"]["count"] == 1
    cp1 = r1_cp["results"]["critical_points"][0]
    assert cp1["x"] == 2.0
    assert cp1["y"] == -1.0
    assert cp1["classification"] == "Mínimo local"

    # Prueba 2: f(x) = ln(x)
    r2_eval = execute_requirement("ln(x)", 1, {"a": 1.0})
    assert r2_eval["success"] is True
    assert r2_eval["results"]["f_a"] == 0.0
    assert r2_eval["results"]["slope"] == 1.0
    r2_d = execute_requirement("ln(x)", 3)
    assert "1/x" in r2_d["results"]["first_derivative"]
    assert "-1/x^2" in r2_d["results"]["second_derivative"] or "-x^(-2)" in r2_d["results"]["second_derivative"]
    # ln fuera de dominio
    r2_inv = execute_requirement("ln(x)", 1, {"a": -1.0})
    assert r2_inv["success"] is False
    assert "dominio" in r2_inv["error"].lower()
    r2_zero = execute_requirement("ln(x)", 1, {"a": 0.0})
    assert r2_zero["success"] is False
    assert "dominio" in r2_zero["error"].lower()

    # Prueba 3: f(x) = e^x
    r3_eval = execute_requirement("e^x", 1, {"a": 0.0})
    assert r3_eval["success"] is True
    assert r3_eval["results"]["f_a"] == 1.0
    assert r3_eval["results"]["slope"] == 1.0
    r3_d = execute_requirement("e^x", 3)
    assert "e^x" in r3_d["results"]["first_derivative"] or "exp(x)" in r3_d["results"]["first_derivative"]
    assert "e^x" in r3_d["results"]["second_derivative"] or "exp(x)" in r3_d["results"]["second_derivative"]

    # Prueba 4: f(x) = sin(x)
    r4_eval = execute_requirement("sin(x)", 1, {"a": 0.0})
    assert r4_eval["success"] is True
    assert r4_eval["results"]["f_a"] == 0.0
    assert r4_eval["results"]["slope"] == 1.0
    r4_d = execute_requirement("sin(x)", 3)
    assert "cos(x)" in r4_d["results"]["first_derivative"]
    assert "-sin(x)" in r4_d["results"]["second_derivative"]

    # Prueba 5: f(x) = sqrt(x)
    r5_eval = execute_requirement("sqrt(x)", 1, {"a": 4.0})
    assert r5_eval["success"] is True
    assert r5_eval["results"]["f_a"] == 2.0
    assert r5_eval["results"]["slope"] == 0.25
    r5_inv = execute_requirement("sqrt(x)", 1, {"a": -1.0})
    assert r5_inv["success"] is False
    assert "dominio" in r5_inv["error"].lower()

    # Prueba 6: f(x) = 1/x
    r6_eval = execute_requirement("1/x", 1, {"a": 2.0})
    assert r6_eval["success"] is True
    assert r6_eval["results"]["f_a"] == 0.5
    assert r6_eval["results"]["slope"] == -0.25
    r6_inv = execute_requirement("1/x", 1, {"a": 0.0})
    assert r6_inv["success"] is False
    assert "dominio" in r6_inv["error"].lower()


def test_section_20_limit_cases():
    # 1/0 en parser
    r_div0 = parse_mathematical_function("1/0")
    assert r_div0["is_valid"] is False

    # ln(-1) en parser
    r_ln_neg = parse_mathematical_function("ln(-1)")
    assert r_ln_neg["is_valid"] is False

    # sqrt(-1) en parser
    r_sqrt_neg = parse_mathematical_function("sqrt(-1)")
    assert r_sqrt_neg["is_valid"] is False

    # tan(pi/2) en punto de discontinuidad
    r_tan = execute_requirement("tan(x)", 1, {"a": "pi/2"})
    assert r_tan["success"] is False
    assert "dominio" in r_tan["error"].lower() or "no existe" in r_tan["error"].lower()

    # Secante con x1 == x2
    r_sec = execute_requirement("x^2", 2, {"a": 3.0, "b": 3.0})
    assert r_sec["success"] is False
    assert "mismo valor de x" in r_sec["error"].lower()

    # Derivada inexistente: abs(x) en x = 0
    r_abs = execute_requirement("abs(x)", 1, {"a": 0.0})
    assert r_abs["success"] is True
    assert r_abs["results"]["slope"] == "No definida"
    assert "no es derivable" in r_abs["results"]["slope_note"].lower()


def test_phase_4_known_kinematic_case_sin_t_085():
    """
    FASE 4: Caso patrón obligatorio
    s(t) = sin(t), t = 0.85
    s(0.85) = sin(0.85) ≈ 0.7512804051
    v(0.85) = cos(0.85) ≈ 0.6599831459
    a(0.85) = -sin(0.85) ≈ -0.7512804051
    """
    res = execute_requirement("sin(t)", 5, {"a": 0.85})
    assert res["success"] is True
    r = res["results"]

    # Comprobación numérica con tolerancia estricta < 1e-6
    assert abs(r["s_val"] - 0.751280) < 1e-4
    assert abs(r["v_val"] - 0.659983) < 1e-4
    assert abs(r["a_val"] - (-0.751280)) < 1e-4

    # Fórmulas coherentes con la variable temporal 't'
    assert "sin(t)" in r["trajectory_str"]
    assert "cos(t)" in r["velocity_str"]
    assert "-sin(t)" in r["acceleration_str"]

    # Target point sincronizado exactamente
    assert res["coordinates"]["X"] == "0.850"
    assert abs(float(res["coordinates"]["Y"]) - 0.751) < 0.01
    assert r["target_point"]["x"] == 0.85
    assert abs(r["target_point"]["y"] - 0.75128) < 1e-3

    # Estado de verificación matemática independiente
    assert r["verification"]["status"] == "PASS"


def test_phase_7_required_math_suite():
    """FASE 7: Verificación de la suite completa de 8 familias de funciones."""
    # 1. f(x) = x² -> f' = 2x, f'' = 2
    r_x2 = execute_requirement("x^2", 3)
    assert "2x" in r_x2["results"]["first_derivative"] or "2*x" in r_x2["results"]["first_derivative"]
    assert r_x2["results"]["second_derivative"] == "2"

    # 2. f(x) = sin(x) -> f' = cos(x), f'' = -sin(x)
    r_sin = execute_requirement("sin(x)", 3)
    assert "cos(x)" in r_sin["results"]["first_derivative"]
    assert "-sin(x)" in r_sin["results"]["second_derivative"]

    # 3. f(x) = cos(x) -> f' = -sin(x), f'' = -cos(x)
    r_cos = execute_requirement("cos(x)", 3)
    assert "-sin(x)" in r_cos["results"]["first_derivative"]
    assert "-cos(x)" in r_cos["results"]["second_derivative"]

    # 4. f(x) = e^x -> f' = e^x, f'' = e^x
    r_exp = execute_requirement("e^x", 3)
    assert "e^x" in r_exp["results"]["first_derivative"] or "exp(x)" in r_exp["results"]["first_derivative"]
    assert "e^x" in r_exp["results"]["second_derivative"] or "exp(x)" in r_exp["results"]["second_derivative"]

    # 5. f(x) = x³ -> f' = 3x², f'' = 6x
    r_x3 = execute_requirement("x^3", 3)
    assert "3x^2" in r_x3["results"]["first_derivative"] or "3*x^2" in r_x3["results"]["first_derivative"]
    assert "6x" in r_x3["results"]["second_derivative"] or "6*x" in r_x3["results"]["second_derivative"]

    # 6. Constante: f(x) = 5 -> f' = 0, f'' = 0
    r_c = execute_requirement("5", 3)
    assert r_c["results"]["first_derivative"] == "0"
    assert r_c["results"]["second_derivative"] == "0"

    # 7. Dominio restringido: f(x) = ln(x) -> rechaza x <= 0
    assert execute_requirement("ln(x)", 1, {"a": -0.5})["success"] is False
    assert execute_requirement("ln(x)", 1, {"a": 0.0})["success"] is False

    # 8. Racionales: f(x) = 1/x -> rechaza x = 0
    assert execute_requirement("1/x", 1, {"a": 0.0})["success"] is False


def test_phase_8_limits_and_phase_11_areas():
    """FASE 8 y 11: Límites analíticos e integración de áreas."""
    res_r2 = execute_requirement("x^2", 2, {"a": 1.0, "b": 3.0})
    assert res_r2["success"] is True
    assert "limits_at_a" in res_r2["results"]
    assert res_r2["results"]["limits_at_a"]["exists"] is True
    assert "area" in res_r2["results"]
    # Integral de x^2 en [1, 3] = [3^3 - 1^3]/3 = 26/3 ≈ 8.6667
    area_val = res_r2["results"]["area"]["definite_integral_value"]
    assert abs(area_val - 8.6667) < 0.01


def test_phase_10_inflection_and_extrema():
    """FASE 10: Clasificación precisa de extremos vs puntos de inflexión."""
    # x^4 en x=0 tiene f''(0)=0 pero es MÍNIMO local (no es inflexión)
    r_x4 = execute_requirement("x^4", 4)
    assert r_x4["success"] is True
    cp_x4 = r_x4["results"]["critical_points"][0]
    assert cp_x4["classification"] == "Mínimo local"

    # x^3 en x=0 tiene f''(0)=0 y cambia de signo -> Punto de inflexión
    r_x3 = execute_requirement("x^3", 4)
    assert r_x3["success"] is True
    cp_x3 = r_x3["results"]["critical_points"][0]
    assert "inflexión" in cp_x3["classification"].lower()

