#!/usr/bin/env python3
"""Run the AdSource Radar local workspace."""
import argparse
import json
import re
import secrets
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image, UnidentifiedImageError

from radar.analysis import (LABELS, PINNED_LOCAL, bounded_box, digest, enabled, image_from,
                            inspect_element, jpeg, scan)

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
MAX_IMAGE = 20 * 1024 * 1024
MAX_STATE = 64 * 1024 * 1024
STATIC = {"/": ("index.html", "text/html; charset=utf-8"), "/index.html": ("index.html", "text/html; charset=utf-8"),
          "/app.js": ("app.js", "text/javascript; charset=utf-8"), "/examples.js": ("examples.js", "text/javascript; charset=utf-8"),
          "/styles.css": ("styles.css", "text/css; charset=utf-8")}
KEY = re.compile(r"[0-9a-f]{64}")
CLIENT_LINES = {"fizzo": "kj", "arcana": "game", "sonique": "kj", "lumi": "kj", "stridex": "kj", "pocketgo": "game"}


class RequestError(Exception):
    def __init__(self, text, code=400):
        super().__init__(text)
        self.code = code


class RadarServer(ThreadingHTTPServer):
    def __init__(self, address, data_dir):
        super().__init__(address, Handler)
        self.folder = data_dir
        self.assets = data_dir / "images"
        self.references = data_dir / "references"
        self.proofs = data_dir / "proofs"
        for folder in (self.assets, self.references, self.proofs):
            folder.mkdir(parents=True, exist_ok=True)
        self.state_path = data_dir / "workspace.json"
        self.state_lock = threading.Lock()
        self.work_lock = threading.BoundedSemaphore(4)
        self.token = secrets.token_urlsafe(24)
        port = self.server_address[1]
        self.hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}

    def read_state(self):
        with self.state_lock:
            return self._read_state()

    def _read_state(self):
        if self.state_path.exists():
            return json.loads(self.state_path.read_text("utf-8"))
        return {"revision": 0, "workspace": None}

    def save(self, update):
        data = update.get("workspace")
        if not isinstance(data, dict) or not all(k in data for k in
                ("materials", "clients", "users", "rules", "licenses", "dictionary", "configLog", "ledgerConfig")):
            raise RequestError("工作区数据格式错误")
        with self.state_lock:
            previous = self._read_state()
            if previous["revision"] != update.get("revision"):
                raise RequestError("另一个标签页已修改工作区，请刷新后重试。", 409)
            out = {"revision": previous["revision"] + 1, "workspace": data}
            atomic(self.state_path, json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode())
            return out["revision"]

    def policy(self, material_id, user_id, roles):
        state = self.read_state()["workspace"] or {}
        material = next((m for m in state.get("materials", []) if m["id"] == material_id and not m.get("demo")), None)
        if not material:
            raise RequestError("素材尚未保存或已不存在", 404)
        client = material.get("client")
        asset = str(material.get("asset", ""))
        config = state.get("clients", {}).get(client, {})
        user = next((u for u in state.get("users", []) if u["id"] == user_id), None)
        if client not in CLIENT_LINES:
            raise RequestError("未知使用方")
        if not user or user["role"] not in roles or (user["role"] != "legal" and CLIENT_LINES[client] not in user["lines"]):
            raise RequestError("当前演示身份无权处理该业务线的素材", 403)
        local_only = client in PINNED_LOCAL or any(m.get("asset") == asset and m.get("client") in PINNED_LOCAL
                                                   for m in state.get("materials", []))
        engines = ["local"] if local_only else [e for e in config.get("engines", []) if e in {"google", "gemini", "hy4", "local"}]
        return asset, engines


def atomic(path, data):
    tmp = path.with_name("." + path.name + "." + secrets.token_hex(6) + ".tmp")
    try:
        with tmp.open("xb") as f:
            f.write(data)
        tmp.replace(path)
    finally:
        if tmp.exists():
            tmp.unlink()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, _format, *args):
        if len(args) > 1 and str(args[1]).startswith("5"):
            super().log_message(_format, *args)

    def reply(self, data, kind, code=200, filename=None):
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        if filename:
            from urllib.parse import quote
            self.send_header("Content-Disposition", "attachment; filename*=UTF-8''" + quote(filename, safe=""))
        self.end_headers()
        self.wfile.write(data)

    def response(self, data, code=200):
        self.reply(json.dumps(data, ensure_ascii=False).encode(), "application/json; charset=utf-8", code)

    def raw(self, maximum):
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise RequestError("请求长度无效")
        if not 0 < size <= maximum:
            raise RequestError("文件为空或超过大小限制", 413)
        return self.rfile.read(size)

    def body(self, maximum=32768):
        if self.headers.get_content_type() != "application/json":
            raise RequestError("需要 JSON 请求", 415)
        body = json.loads(self.raw(maximum))
        if not isinstance(body, dict):
            raise RequestError("需要 JSON 对象")
        return body

    def handle_route(self):
        host = self.headers.get("Host")
        if host not in self.server.hosts:
            raise RequestError("仅接受本机工作区请求", 403)
        method = self.command
        origin = self.headers.get("Origin")
        if origin and origin != "http://" + host:
            raise RequestError("请求来源不匹配", 403)
        if method != "GET" and not secrets.compare_digest(self.headers.get("X-Radar-Token", ""), self.server.token):
            raise RequestError("请刷新工作台后重试", 403)
        path = urlsplit(self.path).path
        if method == "GET":
            if path in STATIC:
                name, kind = STATIC[path]
                return self.reply((WEB / name).read_bytes(), kind)
            if path == "/api/workspace":
                return self.response({**self.server.read_state(), "token": self.server.token, "capabilities": enabled()})
            if path.startswith("/image/"):
                key = path.removeprefix("/image/")
                if KEY.fullmatch(key):
                    return self.reply((self.server.assets / (key + ".jpg")).read_bytes(), "image/jpeg")
            if path.startswith("/proof/"):
                match = re.fullmatch(r"/proof/([0-9a-f]{64})/(pdf|png|jpg)/([^/]{1,2000})", path)
                if match:
                    key, ext, filename = match.groups()
                    return self.reply((self.server.proofs / f"{key}.{ext}").read_bytes(), "application/octet-stream", filename=unquote(filename))
            if path.startswith("/reference/"):
                name = unquote(path.removeprefix("/reference/"))
                if Path(name).name == name and Path(name).suffix.lower() in {".jpg", ".jpeg", ".png"}:
                    file = self.server.references / name
                    if file.is_file() and file.stat().st_size <= MAX_IMAGE:
                        return self.reply(jpeg(image_from(file.read_bytes()), 1000), "image/jpeg")
        if method == "PUT" and path == "/api/workspace":
            return self.response({"revision": self.server.save(self.body(MAX_STATE))})
        if method == "POST" and path in {"/api/images", "/api/proofs"}:
            data = self.raw(MAX_IMAGE)
            sha = digest(data)
            if path == "/api/proofs":
                if data.startswith(b"%PDF-"):
                    ext = "pdf"
                else:
                    image_from(data)
                    ext = "png" if data[:8] == b"\x89PNG\r\n\x1a\n" else "jpg"
                proof = self.server.proofs / f"{sha}.{ext}"
                if not proof.exists():
                    atomic(proof, data)
                return self.response({"key": sha, "extension": ext})
            image = image_from(data)
            raw_path = self.server.assets / (sha + ".source")
            preview_path = self.server.assets / (sha + ".jpg")
            if not preview_path.exists():
                atomic(raw_path, data)
                atomic(preview_path, jpeg(image, 1800))
            return self.response({"key": sha, "src": f"/image/{sha}", "w": image.width, "h": image.height})
        if method == "POST" and path in {"/api/analyze", "/api/research"}:
            p = self.body()
            research = path.endswith("research")
            key, engines = self.server.policy(p.get("material"), p.get("user"), {"audit", "legal"} if research else {"audit", "ops", "design"})
            if not KEY.fullmatch(key):
                raise RequestError("素材编号无效")
            with self.server.work_lock:
                data = (self.server.assets / (key + ".source")).read_bytes()
                image = image_from(data)
                if not research:
                    return self.response(scan(data, image, engines, self.server.references))

                def box(values):
                    if not isinstance(values, list) or len(values) != 4 or not all(type(n) is int for n in values):
                        return None
                    x, y, w, h = values
                    return bounded_box(x, y, x+w, y+h, image.width, image.height)
                bbox, label = box(p.get("bbox")), p.get("label")
                if not bbox or label not in LABELS:
                    raise RequestError("元素框或类型无效")
                boxes = [b for b in (box(values) for values in p.get("foreground", [])[:14]) if b]
                return self.response(inspect_element(image, {"label": label, "bbox": bbox}, engines, self.server.references, boxes))
        raise RequestError("未找到请求的资源", 404)

    def run_request(self):
        try:
            self.handle_route()
        except RequestError as exc:
            self.response({"error": str(exc)}, exc.code)
        except FileNotFoundError:
            self.response({"error": "本机文件已不存在"}, 404)
        except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as exc:
            if isinstance(exc, (BrokenPipeError, ConnectionResetError)):
                return
            self.response({"error": str(exc) if type(exc) is ValueError and not isinstance(exc, json.JSONDecodeError) else "无法读取文件或请求数据"}, 400)
        except Exception as exc:
            print(type(exc).__name__, file=sys.stderr)
            self.response({"error": "处理未完成，请重试"}, 500)

    do_GET = do_PUT = do_POST = run_request


def main():
    parser = argparse.ArgumentParser(description="启动素材版权雷达本地工作台")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data")
    args = parser.parse_args()
    with RadarServer(("127.0.0.1", args.port), args.data_dir.resolve()) as server:
        print(f"素材版权雷达 → http://127.0.0.1:{server.server_address[1]}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
