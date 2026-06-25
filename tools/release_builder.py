from __future__ import annotations

import json
import re
import shutil
import tkinter as tk
import unicodedata
from pathlib import Path
from tkinter import filedialog, messagebox, ttk


ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "img"
OUTPUT_FILE = ROOT / "tools" / "generated-release.txt"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.lower().strip())
    value = "".join(character for character in value if not unicodedata.combining(character))
    value = re.sub(r"[^a-z0-9]+", "_", value)
    value = re.sub(r"_+", "_", value)
    return value.strip("_") or "release"


def js_string(value: str) -> str:
    return json.dumps(value.strip(), ensure_ascii=False)


def paragraphs(value: str) -> list[str]:
    parts = re.split(r"\n\s*\n", value.strip())
    return [re.sub(r"\s+", " ", part).strip() for part in parts if part.strip()]


class ReleaseBuilder(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("CORROSION LABS Release Builder")
        self.geometry("1180x820")
        self.minsize(1040, 720)
        self.configure(bg="#171717")

        self.cover_source = tk.StringVar()
        self.thumbnail_source = tk.StringVar()
        self.status_message = tk.StringVar()

        self.vars = {
            "project": tk.StringVar(value="sacro"),
            "title": tk.StringVar(),
            "label": tk.StringVar(value="Álbum 02"),
            "year": tk.StringVar(value="2026"),
            "status": tk.StringVar(),
            "cover": tk.StringVar(value="img/projects/proyecto/releases/nuevo-registro/cover.jpg"),
            "thumbnail": tk.StringVar(value="img/projects/proyecto/releases/nuevo-registro/thumb.jpg"),
            "coverAlt": tk.StringVar(),
            "featuredTitle": tk.StringVar(),
            "listenUrl": tk.StringVar(),
            "downloadUrl": tk.StringVar(),
            "featured": tk.BooleanVar(value=True),
        }

        self._style()
        self._build()
        self._bind_updates()
        self.update_output()

    def _style(self) -> None:
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure(".", background="#171717", foreground="#d6d2ca", fieldbackground="#202020")
        style.configure("TFrame", background="#171717")
        style.configure("Panel.TFrame", background="#1d1d1d", bordercolor="#343434", relief="solid")
        style.configure("TLabel", background="#171717", foreground="#c9c4bb")
        style.configure("Panel.TLabel", background="#1d1d1d", foreground="#c9c4bb")
        style.configure("TButton", background="#2a2a2a", foreground="#ded9d0", bordercolor="#4a4a4a", focusthickness=0)
        style.map("TButton", background=[("active", "#343434")], bordercolor=[("active", "#666666")])
        style.configure("TEntry", fieldbackground="#222222", foreground="#e7e1d8", insertcolor="#e7e1d8")
        style.configure("TCombobox", fieldbackground="#222222", foreground="#e7e1d8", arrowcolor="#d6d2ca")
        style.configure("TCheckbutton", background="#1d1d1d", foreground="#d6d2ca")

    def _build(self) -> None:
        outer = ttk.Frame(self, padding=24)
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x", pady=(0, 16))
        tk.Label(
            header,
            text="Release Builder",
            bg="#171717",
            fg="#e7e1d8",
            font=("Segoe UI", 26),
        ).pack(anchor="w")
        tk.Label(
            header,
            text="Genera un bloque para js/releases.js y copia las imagenes a su carpeta dentro de img/projects/.",
            bg="#171717",
            fg="#a9a39a",
            font=("Segoe UI", 11),
        ).pack(anchor="w", pady=(4, 0))

        body = ttk.Frame(outer)
        body.pack(fill="both", expand=True)
        body.columnconfigure(0, weight=1)
        body.columnconfigure(1, weight=1)
        body.rowconfigure(0, weight=1)

        form_panel = ttk.Frame(body, style="Panel.TFrame", padding=20)
        form_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        output_panel = ttk.Frame(body, style="Panel.TFrame", padding=20)
        output_panel.grid(row=0, column=1, sticky="nsew", padx=(10, 0))
        output_panel.rowconfigure(1, weight=1)
        output_panel.columnconfigure(0, weight=1)

        self._form(form_panel)
        self._output(output_panel)

    def _form(self, parent: ttk.Frame) -> None:
        for column in range(2):
            parent.columnconfigure(column, weight=1)

        row = 0
        self._field(parent, "Proyecto", "project", row, 0, kind="combo", values=("sacro", "zero", "corpus"))
        self._field(parent, "Etiqueta", "label", row, 1)
        row += 1
        self._field(parent, "Titulo", "title", row, 0)
        self._field(parent, "Año", "year", row, 1)
        row += 1
        self._field(parent, "Estado", "status", row, 0)
        self._field(parent, "Alt portada", "coverAlt", row, 1)
        row += 1
        self._file_field(parent, "Portada", "cover", self.cover_source, row)
        row += 1
        self._file_field(parent, "Miniatura", "thumbnail", self.thumbnail_source, row)
        row += 1
        self._field(parent, "Titulo novedad", "featuredTitle", row, 0, columnspan=2)
        row += 1

        self._text_area(parent, "Texto corto de novedad", "featuredText", row, height=4)
        row += 1
        self._text_area(parent, "Descripcion larga", "descriptions", row, height=7)
        row += 1

        self._field(parent, "URL escuchar", "listenUrl", row, 0)
        self._field(parent, "URL descargar", "downloadUrl", row, 1)
        row += 1

        check = ttk.Checkbutton(parent, text="Marcar como destacado", variable=self.vars["featured"], command=self.update_output)
        check.grid(row=row, column=0, columnspan=2, sticky="w", pady=(12, 4))
        row += 1

        actions = ttk.Frame(parent, style="Panel.TFrame")
        actions.grid(row=row, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        ttk.Button(actions, text="Copiar imagenes + guardar bloque", command=self.copy_assets_and_save).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Copiar bloque", command=self.copy_block).pack(side="left", padx=(0, 8))
        ttk.Button(actions, text="Limpiar", command=self.clear).pack(side="left")
        row += 1

        ttk.Label(parent, textvariable=self.status_message, style="Panel.TLabel").grid(
            row=row, column=0, columnspan=2, sticky="ew", pady=(12, 0)
        )

    def _field(
        self,
        parent: ttk.Frame,
        label: str,
        key: str,
        row: int,
        column: int,
        *,
        columnspan: int = 1,
        kind: str = "entry",
        values: tuple[str, ...] = (),
    ) -> None:
        frame = ttk.Frame(parent, style="Panel.TFrame")
        frame.grid(row=row, column=column, columnspan=columnspan, sticky="ew", padx=6, pady=7)
        frame.columnconfigure(0, weight=1)
        ttk.Label(frame, text=label.upper(), style="Panel.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 4))
        if kind == "combo":
            widget = ttk.Combobox(frame, textvariable=self.vars[key], values=values, state="readonly")
        else:
            widget = ttk.Entry(frame, textvariable=self.vars[key])
        widget.grid(row=1, column=0, sticky="ew")

    def _file_field(self, parent: ttk.Frame, label: str, key: str, source_var: tk.StringVar, row: int) -> None:
        frame = ttk.Frame(parent, style="Panel.TFrame")
        frame.grid(row=row, column=0, columnspan=2, sticky="ew", padx=6, pady=7)
        frame.columnconfigure(1, weight=1)
        ttk.Label(frame, text=label.upper(), style="Panel.TLabel").grid(row=0, column=0, columnspan=3, sticky="w", pady=(0, 4))
        ttk.Button(frame, text="Elegir", command=lambda: self.pick_file(key, source_var)).grid(row=1, column=0, sticky="w", padx=(0, 8))
        ttk.Entry(frame, textvariable=self.vars[key]).grid(row=1, column=1, sticky="ew")
        ttk.Label(frame, textvariable=source_var, style="Panel.TLabel").grid(row=2, column=0, columnspan=3, sticky="w", pady=(4, 0))

    def _text_area(self, parent: ttk.Frame, label: str, key: str, row: int, *, height: int) -> None:
        frame = ttk.Frame(parent, style="Panel.TFrame")
        frame.grid(row=row, column=0, columnspan=2, sticky="nsew", padx=6, pady=7)
        frame.columnconfigure(0, weight=1)
        ttk.Label(frame, text=label.upper(), style="Panel.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 4))
        text = tk.Text(
            frame,
            height=height,
            bg="#222222",
            fg="#e7e1d8",
            insertbackground="#e7e1d8",
            relief="solid",
            bd=1,
            padx=8,
            pady=8,
            wrap="word",
        )
        text.grid(row=1, column=0, sticky="ew")
        setattr(self, key, text)
        text.bind("<<Modified>>", lambda event, widget=text: self._text_modified(widget))

    def _output(self, parent: ttk.Frame) -> None:
        ttk.Label(parent, text="BLOQUE GENERADO", style="Panel.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 8))
        self.output = tk.Text(
            parent,
            bg="#202020",
            fg="#e7e1d8",
            insertbackground="#e7e1d8",
            relief="solid",
            bd=1,
            padx=10,
            pady=10,
            wrap="none",
        )
        self.output.grid(row=1, column=0, sticky="nsew")

    def _bind_updates(self) -> None:
        for variable in self.vars.values():
            variable.trace_add("write", lambda *_: self.update_output())

    def _text_modified(self, widget: tk.Text) -> None:
        if widget.edit_modified():
            widget.edit_modified(False)
            self.update_output()

    def pick_file(self, key: str, source_var: tk.StringVar) -> None:
        path = filedialog.askopenfilename(
            title="Seleccionar imagen",
            filetypes=(("Imagenes", "*.jpg *.jpeg *.png *.webp"), ("Todos los archivos", "*.*")),
        )
        if not path:
            return
        source = Path(path)
        source_var.set(str(source))
        prefix = self.vars["project"].get()
        title = slugify(self.vars["title"].get() or source.stem)
        suffix = "thumb" if key == "thumbnail" else "cover"
        self.vars[key].set(f"img/projects/{prefix}/releases/{title}/{suffix}{source.suffix.lower()}")

    def build_release(self) -> str:
        title = self.vars["title"].get() or "Nuevo Registro"
        cover = self.vars["cover"].get() or "img/projects/proyecto/releases/nuevo-registro/cover.jpg"
        thumbnail = self.vars["thumbnail"].get() or cover
        cover_alt = self.vars["coverAlt"].get() or f"{title} - portada"
        featured_title = self.vars["featuredTitle"].get() or f"Album {title}"
        featured_text = self.featuredText.get("1.0", "end").strip() or "Texto breve para anunciar el lanzamiento."
        description_text = self.descriptions.get("1.0", "end").strip() or "Descripcion breve del material."
        description_parts = paragraphs(description_text)

        lines = [
            "{",
            f"  title: {js_string(title)},",
            f"  label: {js_string(self.vars['label'].get() or 'Álbum 02')},",
            f"  year: {js_string(self.vars['year'].get() or '2026')},",
            f"  status: {js_string(self.vars['status'].get() or 'Registro activo')},",
            f"  cover: {js_string(cover)},",
            f"  thumbnail: {js_string(thumbnail)},",
            f"  coverAlt: {js_string(cover_alt)},",
            f"  featuredTitle: {js_string(featured_title)},",
            f"  featuredText: {js_string(featured_text)},",
            "  descriptions: [",
        ]
        for index, paragraph in enumerate(description_parts):
            comma = "," if index < len(description_parts) - 1 else ""
            lines.append(f"    {js_string(paragraph)}{comma}")
        lines.extend(
            [
                "  ],",
                f"  listenUrl: {js_string(self.vars['listenUrl'].get() or 'https://archive.org/details/...')},",
                f"  downloadUrl: {js_string(self.vars['downloadUrl'].get() or 'https://archive.org/details/...')},",
                f"  featured: {str(self.vars['featured'].get()).lower()}",
                "}",
            ]
        )
        return "\n".join(lines)

    def update_output(self) -> None:
        block = self.build_release()
        self.output.delete("1.0", "end")
        self.output.insert("1.0", block)

    def copy_assets_and_save(self) -> None:
        IMG_DIR.mkdir(exist_ok=True)
        copied: list[str] = []
        for source_var, target_var in (
            (self.cover_source, self.vars["cover"]),
            (self.thumbnail_source, self.vars["thumbnail"]),
        ):
            source_value = source_var.get().strip()
            if not source_value:
                continue
            source = Path(source_value)
            if not source.exists():
                messagebox.showerror("Archivo no encontrado", f"No existe: {source}")
                return
            target = ROOT / target_var.get()
            if target.exists() and not messagebox.askyesno("Sobrescribir", f"{target.name} ya existe. ¿Sobrescribir?"):
                return
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            copied.append(str(target.relative_to(ROOT)))

        OUTPUT_FILE.write_text(self.build_release(), encoding="utf-8")
        copied_text = ", ".join(copied) if copied else "sin imagenes copiadas"
        self.status_message.set(f"Guardado en {OUTPUT_FILE.relative_to(ROOT)} ({copied_text}).")

    def copy_block(self) -> None:
        self.clipboard_clear()
        self.clipboard_append(self.build_release())
        self.status_message.set("Bloque copiado al portapapeles.")

    def clear(self) -> None:
        for key, variable in self.vars.items():
            if isinstance(variable, tk.BooleanVar):
                variable.set(key == "featured")
            else:
                variable.set("")
        self.vars["project"].set("sacro")
        self.vars["label"].set("Álbum 02")
        self.vars["year"].set("2026")
        self.vars["cover"].set("img/projects/proyecto/releases/nuevo-registro/cover.jpg")
        self.vars["thumbnail"].set("img/projects/proyecto/releases/nuevo-registro/thumb.jpg")
        self.cover_source.set("")
        self.thumbnail_source.set("")
        self.featuredText.delete("1.0", "end")
        self.descriptions.delete("1.0", "end")
        self.status_message.set("")
        self.update_output()


if __name__ == "__main__":
    app = ReleaseBuilder()
    app.mainloop()
