"""Rewrite D:\\ai-hub\\orchestrator\\app\\routers\\image.py with history + delete + style endpoints."""
from pathlib import Path

TARGET = Path(r"D:\ai-hub\orchestrator\app\routers\image.py")
STYLES_JSON = Path(r"D:\ai-hub\orchestrator\styles.json")

CONTENT = '''"""Image generation via ComfyUI + multi-style LoRA support.

Endpoints:
  GET  /api/image/styles         -> list of registered styles
  GET  /api/image/history        -> list all generated images
  POST /api/image/generate       -> generate an image
  POST /api/image/delete         -> delete one generated image
"""
from __future__ import annotations

import asyncio
import json
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..config import get_config

router = APIRouter(prefix="/api/image", tags=["image"])


STYLES_FILE = Path(r"D:\\ai-hub\\orchestrator\\styles.json")


def _load_styles() -> list[dict]:
    if not STYLES_FILE.exists():
        return []
    try:
        return json.loads(STYLES_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _render(node: Any, params: dict[str, Any]) -> Any:
    if isinstance(node, str):
        s = node.strip()
        if s.startswith("{{") and s.endswith("}}"):
            key = s[2:-2].strip()
            if key not in params:
                raise KeyError(f"missing param: {key}")
            return params[key]
        out = node
        for k, v in params.items():
            out = out.replace("{{" + k + "}}", str(v))
        return out
    if isinstance(node, list):
        return [_render(x, params) for x in node]
    if isinstance(node, dict):
        return {k: _render(v, params) for k, v in node.items()}
    return node


class ImageRequest(BaseModel):
    prompt: str
    style: str = "realistic"          # key into styles.json
    seed: int = -1
    batch_size: int = 1


@router.get("/styles")
async def list_styles():
    styles = _load_styles()
    # check readiness (file existence)
    tdir = Path(get_config()["paths"]["comfyui_templates"])
    for s in styles:
        wf = tdir / s["workflow"]
        lora_ok = True
        if s.get("lora"):
            lora_path = Path(r"D:\\ComfyUI\\models\\loras") / s["lora"]
            lora_ok = lora_path.exists()
        s["ready"] = wf.exists() and lora_ok
    return {"styles": styles}


@router.get("/history")
async def history(limit: int = 60, offset: int = 0):
    out_dir = Path(get_config()["paths"]["outputs_images"])
    if not out_dir.exists():
        return {"images": [], "total": 0}
    files = [p for p in out_dir.rglob("*.png") if p.is_file()]
    files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    total = len(files)
    window = files[offset: offset + limit]
    items = []
    for p in window:
        rel = p.relative_to(out_dir).as_posix()
        stat = p.stat()
        items.append({
            "url": f"/outputs/{rel}",
            "filename": p.name,
            "path": str(p),
            "size_kb": round(stat.st_size / 1024, 1),
            "mtime": stat.st_mtime,
        })
    return {"images": items, "total": total}


@router.post("/delete")
async def delete_image(body: dict):
    path = body.get("path", "")
    out_dir = Path(get_config()["paths"]["outputs_images"]).resolve()
    try:
        target = Path(path).resolve()
        target.relative_to(out_dir)
    except Exception:
        raise HTTPException(400, detail="path not in outputs dir")
    if target.exists():
        target.unlink()
        return {"ok": True}
    raise HTTPException(404, detail="not found")


@router.post("/generate")
async def generate(body: ImageRequest):
    cfg = get_config()
    base = cfg["services"]["comfyui"]["base_url"]
    tdir = Path(cfg["paths"]["comfyui_templates"])
    styles = {s["key"]: s for s in _load_styles()}
    if body.style not in styles:
        raise HTTPException(400, detail=f"unknown style: {body.style}")
    s = styles[body.style]

    tmpl_path = tdir / s["workflow"]
    if not tmpl_path.exists():
        raise HTTPException(500, detail=f"workflow template missing: {s['workflow']}")

    seed = body.seed if body.seed != -1 else int(time.time() * 1000) & 0x7FFFFFFF
    params = {
        "prompt": body.prompt,
        "seed": seed,
        "batch_size": max(1, min(4, body.batch_size)),
        "filename_prefix": f"hub_{body.style}",
        "lora_name": s.get("lora") or "",
        "lora_strength": s.get("lora_strength", 1.0),
        "width": s.get("width", 1024),
        "height": s.get("height", 1024),
        "steps": s.get("steps", 20),
        "cfg": s.get("cfg", 1.0),
        "sampler_name": s.get("sampler", "euler"),
        "scheduler": s.get("scheduler", "simple"),
        "extra_prompt_prefix": s.get("prompt_prefix", ""),
        "extra_prompt_suffix": s.get("prompt_suffix", ""),
    }
    # apply prefix/suffix to prompt
    params["prompt"] = f"{params['extra_prompt_prefix']}{body.prompt}{params['extra_prompt_suffix']}"

    workflow = _render(json.loads(tmpl_path.read_text(encoding="utf-8")), params)

    client_id = uuid.uuid4().hex
    async with httpx.AsyncClient(timeout=30.0) as c:
        try:
            r = await c.post(base + "/prompt",
                             json={"prompt": workflow, "client_id": client_id})
            r.raise_for_status()
            prompt_id = r.json()["prompt_id"]
        except Exception as e:
            raise HTTPException(503, detail=f"ComfyUI submit failed: {e}")

    started = time.time()
    deadline = started + 600
    outputs: list[str] = []
    async with httpx.AsyncClient(timeout=15.0) as c:
        while time.time() < deadline:
            await asyncio.sleep(2.0)
            try:
                r = await c.get(base + f"/history/{prompt_id}")
                data = r.json() or {}
                entry = data.get(prompt_id)
                if entry and entry.get("status", {}).get("completed"):
                    for node in entry.get("outputs", {}).values():
                        for img in node.get("images", []):
                            fn = img.get("filename")
                            sub = img.get("subfolder", "")
                            out_dir = Path(cfg["paths"]["outputs_images"])
                            p = out_dir / sub / fn if sub else out_dir / fn
                            outputs.append(str(p))
                    break
                if entry and entry.get("status", {}).get("status_str") == "error":
                    raise HTTPException(500, detail=f"ComfyUI error: {entry.get('status')}")
            except HTTPException:
                raise
            except Exception:
                pass
    if not outputs:
        raise HTTPException(504, detail="ComfyUI timed out")
    return {
        "prompt_id": prompt_id,
        "style": body.style,
        "seed_used": seed,
        "outputs": outputs,
        "elapsed_seconds": round(time.time() - started, 1),
    }
'''

TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(CONTENT, encoding="utf-8")
print(f"wrote {TARGET} ({len(CONTENT)} bytes)")
