/* ==========================================================
   PENGATURAN WARUNG - ubah bagian ini sesuai kondisi warung
   ========================================================== */
const NOMOR_WA = "628156819271";          // format: 62 + nomor tanpa 0 di depan
const LINK_INSTAGRAM = "https://instagram.com/";
const INFO_QRIS = "Kode QRIS dikirim lewat WhatsApp setelah pesanan diterima.";
const INFO_TRANSFER = "Rekening: BCA 1234567890 a.n. Bu Leni. Kirim bukti transfer lewat WhatsApp.";

// Stok & harga menu. Ubah angka "stok" saat stok berubah (0 = habis).
const menu = [
  { id: 1, nama: "Mie ayam biasa",     harga: 12000, stok: 25, desc: "Mie, ayam kecap, sawi, dan kuah kaldu." },
  { id: 2, nama: "Mie ayam bakso",     harga: 15000, stok: 8,  desc: "Mie ayam dengan dua butir bakso." },
  { id: 3, nama: "Mie ayam pangsit",   harga: 14000, stok: 3,  desc: "Mie ayam dengan pangsit goreng." },
  { id: 4, nama: "Bakso urat",         harga: 13000, stok: 20, desc: "Bakso urat kenyal dengan kuah sapi." },
  { id: 5, nama: "Bakso campur",       harga: 15000, stok: 5,  desc: "Bakso halus, urat, tahu, dan mie." },
  { id: 6, nama: "Es teh manis",       harga: 4000,  stok: 40, desc: "Teh dingin manis." },
  { id: 7, nama: "Es jeruk",           harga: 5000,  stok: 12, desc: "Jeruk peras dengan es batu." }
];

/* ==========================================================
   KODE PROGRAM
   ========================================================== */
const cart = {}; // { idMenu: jumlah }

const rupiah = (n) => "Rp" + n.toLocaleString("id-ID");
const $ = (id) => document.getElementById(id);

function statusStok(stok) {
  if (stok <= 0) return { kelas: "habis", label: "Habis" };
  if (stok <= 10) return { kelas: "sedikit", label: "Sisa " + stok };
  return { kelas: "ada", label: "Tersedia" };
}

function sisaStok(item) {
  return item.stok - (cart[item.id] || 0);
}

/* Papan stok di hero */
function renderBoard() {
  $("boardList").innerHTML = menu.map((m) => {
    const s = statusStok(sisaStok(m));
    return `<li><span class="board-name">${m.nama}</span><span class="badge ${s.kelas}">${s.label}</span></li>`;
  }).join("");

  const now = new Date();
  $("boardTime").textContent = "Per " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

/* Kartu menu */
function renderMenu() {
  $("menuGrid").innerHTML = menu.map((m) => {
    const sisa = sisaStok(m);
    const s = statusStok(sisa);
    return `
      <article class="menu-item ${sisa <= 0 ? "habis" : ""}">
        <div class="menu-top">
          <h3 class="menu-name">${m.nama}</h3>
          <span class="badge ${s.kelas}">${s.label}</span>
        </div>
        <p class="menu-desc">${m.desc}</p>
        <div class="menu-foot">
          <span class="menu-price">${rupiah(m.harga)}</span>
          <button class="add-btn" type="button" data-add="${m.id}" ${sisa <= 0 ? "disabled" : ""}>
            ${m.stok <= 0 ? "Habis" : sisa <= 0 ? "Maksimal" : "Tambah"}
          </button>
        </div>
      </article>`;
  }).join("");
}

/* Keranjang */
function renderCart() {
  const ids = Object.keys(cart).filter((id) => cart[id] > 0);
  let total = 0;

  $("cartList").innerHTML = ids.map((id) => {
    const m = menu.find((x) => x.id === Number(id));
    const qty = cart[id];
    total += m.harga * qty;
    return `
      <li>
        <div>
          <div class="cart-line-name">${m.nama}</div>
          <div class="cart-line-price">${rupiah(m.harga)} x ${qty}</div>
        </div>
        <div class="qty">
          <button type="button" data-dec="${m.id}" aria-label="Kurangi ${m.nama}">-</button>
          <span>${qty}</span>
          <button type="button" data-inc="${m.id}" aria-label="Tambah ${m.nama}" ${sisaStok(m) <= 0 ? "disabled" : ""}>+</button>
        </div>
      </li>`;
  }).join("");

  $("cartEmpty").hidden = ids.length > 0;
  $("cartTotal").textContent = rupiah(total);
  $("checkout").disabled = ids.length === 0;
}

function refreshAll() {
  renderBoard();
  renderMenu();
  renderCart();
}

/* Klik tambah / kurang */
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add], [data-inc]");
  const dec = e.target.closest("[data-dec]");

  if (add) {
    const id = Number(add.dataset.add || add.dataset.inc);
    const item = menu.find((m) => m.id === id);
    if (sisaStok(item) > 0) {
      cart[id] = (cart[id] || 0) + 1;
      refreshAll();
    }
  }
  if (dec) {
    const id = Number(dec.dataset.dec);
    cart[id] = Math.max(0, (cart[id] || 0) - 1);
    refreshAll();
  }
});

/* Form: alamat & info pembayaran */
const metodeAmbil = () => document.querySelector('input[name="metode"]:checked').value;
const metodeBayar = () => document.querySelector('input[name="bayar"]:checked').value;

function updateForm() {
  $("alamatWrap").hidden = metodeAmbil() !== "Antar";

  const info = { "QRIS": INFO_QRIS, "Transfer bank": INFO_TRANSFER }[metodeBayar()];
  $("payInfo").hidden = !info;
  $("payInfo").textContent = info || "";
}
document.querySelectorAll('input[name="metode"], input[name="bayar"]').forEach((el) =>
  el.addEventListener("change", updateForm)
);

/* Kirim pesanan lewat WhatsApp */
$("checkout").addEventListener("click", () => {
  const nama = $("nama").value.trim();
  const alamat = $("alamat").value.trim();
  const msg = $("formMsg");
  msg.textContent = "";

  if (!nama) { msg.textContent = "Isi nama pemesan dulu."; $("nama").focus(); return; }
  if (metodeAmbil() === "Antar" && !alamat) { msg.textContent = "Isi alamat antar dulu."; $("alamat").focus(); return; }

  let total = 0;
  const baris = Object.keys(cart).filter((id) => cart[id] > 0).map((id) => {
    const m = menu.find((x) => x.id === Number(id));
    total += m.harga * cart[id];
    return `- ${m.nama} x ${cart[id]} = ${rupiah(m.harga * cart[id])}`;
  });

  const teks = [
    "Halo,Saya mau pesan:",
    ...baris,
    `Total: ${rupiah(total)}`,
    "",
    `Nama: ${nama}`,
    `Pengambilan: ${metodeAmbil()}${metodeAmbil() === "Antar" ? " (" + alamat + ")" : ""}`,
    `Pembayaran: ${metodeBayar()}`
  ].join("\n");
 
 window.open(`https://wa.me/${NOMOR_WA}?text=${encodeURIComponent(teks)}`, "_blank");
});

/* Link kontak */
$("waLink").href = `https://wa.me/${NOMOR_WA}?text=${encodeURIComponent("Halo,Saya mau pesan")}`;
$("igLink").href = LINK_INSTAGRAM;

refreshAll();
updateForm();
