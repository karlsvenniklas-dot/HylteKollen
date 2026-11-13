"""Regression check: response bodies must be consumed before urlopen closes."""
import ast
import re
from pathlib import Path
from types import SimpleNamespace

path = Path(__file__).with_name("import-meetings.py")
parsed = ast.parse(path.read_text(encoding="utf-8"))
names = {"fetch", "fetch_pdf", "public_pages"}
funcs = [node for node in parsed.body if isinstance(node, ast.FunctionDef) and node.name in names]


class Response:
    status = 200
    open = False

    def __enter__(self):
        self.open = True
        return self

    def __exit__(self, *_):
        self.open = False

    def read(self, size):
        assert self.open, "read attempted after closing the HTTP response"
        assert size == 20_000_000
        return self.payload


response = Response()
request = SimpleNamespace(Request=lambda url, **_: url, urlopen=lambda *_a, **_k: response)
scope = {"urllib": SimpleNamespace(request=request), "re": re}
exec(compile(ast.Module(body=funcs, type_ignores=[]), str(path), "exec"), scope)
response.payload = b"%PDF-1.7"
assert scope["fetch_pdf"]("https://example.invalid/valid.pdf") == response.payload
assert not response.open
response.payload = b"<html>fallback</html>"
try:
    scope["fetch_pdf"]("https://example.invalid/fallback.pdf")
except ValueError as error:
    assert str(error) == "Not a PDF"
else:
    raise AssertionError("HTML fallback accepted as PDF")
assert scope["public_pages"]("3807720bb351c692d0ae2afd", ["kontakt@example.invalid"]) == ["[e-postadress utelämnad]"]
assert scope["public_pages"]("another-document", ["Text"]) == ["Text"]
print("PASS: MeetingPlus response read in context; non-PDF rejected.")
