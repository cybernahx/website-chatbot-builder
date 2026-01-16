
import os
import csv
import datetime
from pathlib import Path
from typing import List, Dict, Any

import tkinter as tk
from tkinter import ttk, messagebox, filedialog

from dotenv import dotenv_values
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

# ------------------------------
# Project-aware paths
# ------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / "backend" / ".env"
EXPORTS_DIR = Path(__file__).resolve().parent / "exports"
EXPORTS_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------
# Configuration of variables
# ------------------------------
CONFIG: List[Dict[str, Any]] = [
    # Core (Required)
    {"category": "Core", "service": "Server", "var": "PORT", "required": False, "desc": "Backend port (default 5000)"},
    {"category": "Core", "service": "MongoDB", "var": "MONGODB_URI", "required": True, "desc": "Database connection string"},
    {"category": "Core", "service": "JWT", "var": "JWT_SECRET", "required": True, "desc": "Auth token signing secret"},
    {"category": "Core", "service": "Environment", "var": "NODE_ENV", "required": False, "desc": "development / production"},
    {"category": "Core", "service": "Frontend", "var": "FRONTEND_URL", "required": False, "desc": "URL for CORS (e.g. https://myapp.com)"},

    # AI (Required)
    {"category": "AI", "service": "OpenAI", "var": "OPENAI_API_KEY", "required": True, "desc": "OpenAI API Key"},
    {"category": "AI", "service": "OpenAI", "var": "OPENAI_MODEL", "required": False, "desc": "Model (e.g. gpt-4o-mini)"},
    {"category": "AI", "service": "OpenAI", "var": "OPENAI_EMBEDDING_MODEL", "required": False, "desc": "Embedding model"},

    # Billing (Optional)
    {"category": "Billing", "service": "Stripe", "var": "STRIPE_SECRET_KEY", "required": False, "desc": "Stripe Secret Key"},
    {"category": "Billing", "service": "Stripe", "var": "STRIPE_WEBHOOK_SECRET", "required": False, "desc": "Stripe Webhook Secret"},

    # Email (Optional)
    {"category": "Email", "service": "SMTP", "var": "EMAIL_SERVICE", "required": False, "desc": "Service (e.g. gmail)"},
    {"category": "Email", "service": "SMTP", "var": "EMAIL_USER", "required": False, "desc": "Email username"},
    {"category": "Email", "service": "SMTP", "var": "EMAIL_PASSWORD", "required": False, "desc": "Email password"},
    {"category": "Email", "service": "SMTP", "var": "EMAIL_FROM", "required": False, "desc": "Sender address"},

    # WhatsApp (Optional)
    {"category": "WhatsApp", "service": "Twilio", "var": "TWILIO_ACCOUNT_SID", "required": False, "desc": "Twilio Account SID"},
    {"category": "WhatsApp", "service": "Twilio", "var": "TWILIO_AUTH_TOKEN", "required": False, "desc": "Twilio Auth Token"},
    {"category": "WhatsApp", "service": "Twilio", "var": "WHATSAPP_PHONE_NUMBER", "required": False, "desc": "Sender number"},
]

CATEGORIES = ["All"] + sorted(list({item["category"] for item in CONFIG}))

# ------------------------------
# Helpers
# ------------------------------

def get_merged_config(env_values: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Merges the hardcoded CONFIG with any extra keys found in the .env file.
    """
    known_vars = {item["var"] for item in CONFIG}
    merged = list(CONFIG)

    # Add any keys found in .env that aren't in CONFIG
    for key in env_values:
        if key not in known_vars:
            merged.append({
                "category": "Custom",
                "service": "Detected",
                "var": key,
                "required": False,
                "desc": "Auto-detected from .env"
            })
    
    return merged

def load_env() -> Dict[str, str]:
    if ENV_PATH.exists():
        return {k: str(v) for k, v in dotenv_values(ENV_PATH).items() if k}
    return {}


def mask_value(val: str) -> str:
    if not val:
        return ""
    v = str(val)
    if len(v) <= 8:
        return "*" * len(v)
    return f"{v[:4]}***{v[-4:]}"


def write_env(updates: Dict[str, str]):
    ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    existing_lines: List[str] = []
    existing_map: Dict[str, int] = {}

    if ENV_PATH.exists():
        content = ENV_PATH.read_text(encoding="utf-8")
        existing_lines = content.splitlines()
        for idx, line in enumerate(existing_lines):
            if not line or line.strip().startswith("#"):
                continue
            if "=" in line:
                key = line.split("=", 1)[0].strip()
                existing_map[key] = idx

    # Apply updates
    for key, value in updates.items():
        if value is None:
            continue
        line_val = value
        # Always quote for safety
        if not (line_val.startswith('"') and line_val.endswith('"')):
            line_val = f'"{line_val}"'
        new_line = f"{key}={line_val}"
        if key in existing_map:
            existing_lines[existing_map[key]] = new_line
        else:
            existing_lines.append(new_line)

    # Ensure file ends with newline
    final_text = "\n".join(existing_lines) + "\n"
    ENV_PATH.write_text(final_text, encoding="utf-8")


def export_csv(rows: List[Dict[str, Any]], out_path: Path):
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Category", "Service", "Var", "Required", "Present", "Value (masked)"])
        for r in rows:
            writer.writerow([
                r["category"], r["service"], r["var"],
                "Yes" if r["required"] else "No",
                "Yes" if r.get("present") else "No",
                r.get("masked", "")
            ])


def export_pdf(rows: List[Dict[str, Any]], out_path: Path):
    doc = SimpleDocTemplate(str(out_path), pagesize=A4, title="API Keys Status")
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("API Keys Status - Chatbot Builder", styles["Title"]))
    story.append(Spacer(1, 12))

    data = [["Category", "Service", "Var", "Required", "Present", "Value (masked)"]]
    for r in rows:
        data.append([
            r["category"], r["service"], r["var"],
            "Yes" if r["required"] else "No",
            "Yes" if r.get("present") else "No",
            r.get("masked", "")
        ])

    table = Table(data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
    ]))
    story.append(table)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Note: Values are masked for safety. Use the GUI to view/edit actual values.",
        styles["Normal"]
    ))

    doc.build(story)


# ------------------------------
# GUI
# ------------------------------

class ApiManagerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Chatbot Builder - API Manager")
        self.geometry("980x640")

        self.env_values: Dict[str, str] = {}
        self.entries: Dict[str, tk.Entry] = {}
        self.current_config: List[Dict[str, Any]] = CONFIG

        self.create_widgets()
        self.refresh_env()

    def create_widgets(self):
        # Top controls
        top = ttk.Frame(self)
        top.pack(fill=tk.X, padx=10, pady=10)

        ttk.Label(top, text="Category:").pack(side=tk.LEFT)
        self.category_var = tk.StringVar(value="All")
        self.category_cb = ttk.Combobox(top, textvariable=self.category_var, values=CATEGORIES, state="readonly", width=20)
        self.category_cb.pack(side=tk.LEFT, padx=(6, 12))
        self.category_cb.bind("<<ComboboxSelected>>", lambda e: self.render_form())

        self.required_only = tk.BooleanVar(value=False)
        ttk.Checkbutton(top, text="Required only", variable=self.required_only, command=self.render_form).pack(side=tk.LEFT, padx=6)

        ttk.Button(top, text="Load from Project", command=self.refresh_env).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Save to Project", command=self.save_to_env).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Export CSV", command=self.do_export_csv).pack(side=tk.LEFT, padx=6)
        ttk.Button(top, text="Export PDF", command=self.do_export_pdf).pack(side=tk.LEFT, padx=6)

        # Info label for path
        self.path_label = ttk.Label(self, text=f".env: {ENV_PATH}")
        self.path_label.pack(fill=tk.X, padx=10)

        # Canvas for form (scrollable)
        self.canvas = tk.Canvas(self, borderwidth=0)
        self.form_frame = ttk.Frame(self.canvas)
        self.v_scroll = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.v_scroll.set)

        self.v_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.canvas_window = self.canvas.create_window((0, 0), window=self.form_frame, anchor="nw")
        self.form_frame.bind("<Configure>", self.on_frame_configure)
        self.canvas.bind('<Configure>', self.on_canvas_configure)

        self.render_form()

    def on_frame_configure(self, event):
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))

    def on_canvas_configure(self, event):
        self.canvas.itemconfig(self.canvas_window, width=event.width)

    def filter_config(self) -> List[Dict[str, Any]]:
        cat = self.category_var.get()
        req_only = self.required_only.get()
        items = self.current_config
        if cat and cat != "All":
            items = [i for i in items if i["category"] == cat]
        if req_only:
            items = [i for i in items if i["required"]]
        return items

    def refresh_env(self):
        self.env_values = load_env()
        
        # Update config with detected keys
        self.current_config = get_merged_config(self.env_values)
        
        # Update categories dropdown
        current_cats = sorted(list({item["category"] for item in self.current_config}))
        self.category_cb['values'] = ["All"] + current_cats
        
        self.render_form()
        # Only show popup if it's an explicit user action, otherwise it pops up on init
        # messagebox.showinfo("Loaded", "Environment values loaded from backend/.env")

    def render_form(self):
        for child in list(self.form_frame.children.values()):
            child.destroy()
        self.entries.clear()

        header = ttk.Frame(self.form_frame)
        header.grid(row=0, column=0, columnspan=3, sticky="ew", pady=(0, 8))
        ttk.Label(header, text="Service", width=24).grid(row=0, column=0, sticky="w")
        ttk.Label(header, text="Variable", width=28).grid(row=0, column=1, sticky="w")
        ttk.Label(header, text="Value", width=60).grid(row=0, column=2, sticky="w")

        for idx, item in enumerate(self.filter_config(), start=1):
            row = ttk.Frame(self.form_frame)
            row.grid(row=idx, column=0, columnspan=3, sticky="ew", pady=4)

            label_text = f"[{item['category']}] {item['service']}{' *' if item['required'] else ''}"
            ttk.Label(row, text=label_text, width=24).grid(row=0, column=0, sticky="w")
            ttk.Label(row, text=item["var"], width=28).grid(row=0, column=1, sticky="w")

            val = self.env_values.get(item["var"], "")
            entry = ttk.Entry(row, width=60)
            entry.insert(0, val)
            entry.grid(row=0, column=2, sticky="ew")
            self.entries[item["var"]] = entry

            if item.get("desc"):
                desc = ttk.Label(self.form_frame, text=f"  \u2192 {item['desc']}", foreground="#666666")
                desc.grid(row=idx+1, column=0, columnspan=3, sticky="w")

    def save_to_env(self):
        updates = {}
        missing_required = []
        for item in self.filter_config():
            v = self.entries[item["var"]].get().strip()
            if item["required"] and not v:
                missing_required.append(item["var"])
            updates[item["var"]] = v

        if missing_required:
            if not messagebox.askyesno("Missing Required", f"Missing required values: {', '.join(missing_required)}\nProceed anyway?"):
                return
        try:
            write_env(updates)
            self.refresh_env()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to write .env: {e}")

    def collect_rows(self) -> List[Dict[str, Any]]:
        rows = []
        env_now = load_env()
        # Use merged config to include custom keys in export
        full_config = get_merged_config(env_now)
        
        for item in full_config:
            raw = env_now.get(item["var"], "")
            rows.append({
                **item,
                "present": bool(raw),
                "masked": mask_value(raw)
            })
        return rows

    def do_export_csv(self):
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = EXPORTS_DIR / f"apis_{ts}.csv"
        try:
            export_csv(self.collect_rows(), out_path)
            messagebox.showinfo("Exported", f"CSV exported to:\n{out_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export CSV: {e}")

    def do_export_pdf(self):
        ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = EXPORTS_DIR / f"apis_{ts}.pdf"
        try:
            export_pdf(self.collect_rows(), out_path)
            messagebox.showinfo("Exported", f"PDF exported to:\n{out_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export PDF: {e}")


if __name__ == "__main__":
    app = ApiManagerApp()
    app.mainloop()
