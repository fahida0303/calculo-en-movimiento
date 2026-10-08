import sys
sys.path.insert(0, ".")
from backend.math.parser import parse_mathematical_function
from backend.math.engine import execute_requirement

exprs = [
    'x^2 - 4*x + 3',
    'x^2 - 4x + 3',
    '1/x',
    '(x+1)/(x-2)',
    'ln(x)',
    'e^x',
    'exp(x)',
    'sqrt(x)',
    'sqrt(x+4)',
    'sin(x)',
    'cos(x)',
    'tan(x)',
    'cos(2x)',
    '2x',
    'x',
    '3/2 * x + 1',
    '5',
]

print("=== PARSER TESTS ===")
for s in exprs:
    res = parse_mathematical_function(s)
    print(f"EXPR: {s:16} | VALID: {res['is_valid']!s:5} | TYPE: {res.get('function_type'):15} | CLEAN: {res.get('clean_repr')} | ERR: {res.get('error_message')}")
