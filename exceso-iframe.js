/* ============================================================
   exceso-iframe.js · complemento de exceso.html
   El widget Integrar de Experience Builder carga la página en un
   iframe sin el permiso "allow-downloads", así que el navegador
   bloquea las descargas. Este script:
   1) Dentro del iframe: al pulsar "Generar archivo" avisa y abre
      el módulo en una pestaña nueva con la consulta ya cargada.
   2) En la pestaña nueva: reconstruye la consulta (ubicaciones,
      meses, tramos horarios, tramos de exceso, formatos y opciones)
      y ofrece "Descargar ahora".
   Se carga después del script principal:
   <script src="exceso-iframe.js"></script>  (justo antes de </body>)
   ============================================================ */
(function () {
  "use strict";
  const D = window.__demo;
  if (!D) return;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const FRAMED = window.top !== window.self;

  /* ---------- utilidades ---------- */
  const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4))));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function modal(title, html, actions) {
    $("#mdT").textContent = title;
    $("#mdB").innerHTML = html;
    $("#mdP").hidden = true;
    const box = $("#mdA");
    box.innerHTML = "";
    actions.forEach(([txt, fn, sec]) => {
      const b = document.createElement("button");
      b.className = "btn" + (sec ? " sec" : "");
      b.textContent = txt;
      b.onclick = fn;
      box.appendChild(b);
    });
    $("#modal").hidden = false;
  }
  const closeModal = () => { $("#modal").hidden = true; };

  /* ---------- 1. serializar la consulta actual ---------- */
  function snapshot() {
    const S = D.S;
    return {
      v: 1,
      locs: S.locs.filter(l => l.status === "ok" || l.status === "warn")
        .map(l => ({ id: l.id, lat: l.lat, lon: l.lon, rumbo: l.rumbo, lim: l.lim })),
      months: [...S.months],
      hMode: $("#hMode").value, hDur: $("#hDur").value, hCustom: $("#hCustom").value,
      bins: S.bins.map(b => b.slice()),
      fmts: $$("#fmts input:checked").map(i => i.value),
      lanes: $("#oLanes").checked, types: $("#oTypes").checked,
      mail: $("#oMail").value.trim()
    };
  }
  function urlWith(q) {
    const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
    hp.set("q", q);
    return location.href.split("#")[0] + "#" + hp.toString();
  }

  /* ---------- 2. dentro del iframe: reemplazar "Generar archivo" ---------- */
  if (FRAMED) {
    const btn = $("#go");
    btn.textContent = "Generar y descargar (pestaña nueva)";
    btn.onclick = () => {
      const { errs } = D.buildQuery();
      if (errs.length) {
        modal("Revise la consulta", `<p>${errs.map(esc).join("<br>")}</p>`, [["Cerrar", closeModal]]);
        return;
      }
      const q = b64e(JSON.stringify(snapshot()));
      const url = urlWith(q);
      modal("Descarga en pestaña nueva",
        `<p>El visor de ArcGIS no permite descargar archivos desde este panel.</p>
         <p>Abriremos el módulo en una <b>pestaña nueva</b> con su consulta ya cargada; ahí solo debe pulsar <b>Descargar ahora</b>.</p>`,
        [["Cancelar", closeModal, true],
         ["Abrir y descargar", () => {
           closeModal();
           window.open(url, "_blank", "noopener");
         }]]);
    };
    const note = $("#framed");
    if (note) note.innerHTML = "Las descargas se abren en una pestaña nueva. <a href='#' id='openTab2'>Abrir el módulo completo</a>";
    const a2 = document.getElementById("openTab2");
    if (a2) a2.onclick = e => { e.preventDefault(); window.open(location.href, "_blank", "noopener"); };
    return;
  }

  /* ---------- 3. en la pestaña nueva: reconstruir y ofrecer la descarga ---------- */
  const hp = new URLSearchParams(location.hash.replace(/^#/, ""));
  const qs = hp.get("q");
  if (!qs) return;
  hp.delete("q");
  history.replaceState(null, "", location.href.split("#")[0] + "#" + hp.toString());

  let st;
  try { st = JSON.parse(b64d(qs)); } catch (e) { return; }
  if (!st || st.v !== 1) return;

  (async () => {
    const S = D.S;
    modal("Cargando la consulta…", "<p>Ubicando los puntos en la red de tramos.</p>", []);

    // meses
    const clr = document.querySelector('.quick [data-q="clear"]');
    if (clr) clr.click();
    (st.months || []).forEach(k => { const b = document.querySelector(`#months button[data-k="${k}"]`); if (b && !b.disabled) b.click(); });

    // tramos horarios
    $("#hMode").value = st.hMode || "fixed";
    $("#hDur").value = st.hDur || "1";
    $("#hCustom").value = st.hCustom || "";
    ["#hMode", "#hDur", "#hCustom"].forEach(s => $(s).dispatchEvent(new Event("input", { bubbles: true })));

    // tramos de exceso (se fuerza el redibujado agregando y quitando una fila)
    if (Array.isArray(st.bins) && st.bins.length) {
      S.bins = st.bins.map(b => b.slice());
      $("#binAdd").click();
      const rows = $$("#bins tbody .rm");
      if (rows.length) rows[rows.length - 1].click();
    }

    // formatos y opciones
    $$("#fmts input").forEach(i => { i.checked = (st.fmts || []).includes(i.value); i.dispatchEvent(new Event("change")); });
    $("#oLanes").checked = !!st.lanes; $("#oLanes").dispatchEvent(new Event("change"));
    $("#oTypes").checked = !!st.types; $("#oTypes").dispatchEvent(new Event("change"));
    $("#oMail").value = st.mail || "";

    // ubicaciones
    S.locs.length = 0;
    for (const l of st.locs || []) {
      const loc = await D.addLocation({ id: l.id, lat: l.lat, lon: l.lon, rumbo: l.rumbo });
      if (l.lim) loc.lim = l.lim;
    }
    D.renderLocs();

    const { errs, rows } = D.buildQuery();
    if (errs.length) {
      modal("Revise la consulta", `<p>${errs.map(esc).join("<br>")}</p>`, [["Cerrar", closeModal]]);
      return;
    }
    modal("Consulta lista",
      `<p>${st.locs.length} ubicación(es) · ${st.months.length} mes(es) · ${Number(rows).toLocaleString("es-CL")} registros.</p>
       <p>Formatos: ${(st.fmts || []).map(f => f.toUpperCase()).join(", ")}</p>`,
      [["Cerrar", closeModal, true], ["Descargar ahora", () => { closeModal(); $("#go").click(); }]]);
  })();
})();