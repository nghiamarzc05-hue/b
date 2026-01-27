/* Ứng dụng học từ vựng đa ngôn ngữ — 100% client-side */
(() => {
  "use strict";

  const KHOA = {
    DU_LIEU: "dnhv_du_lieu_v1",
    TIEN_DO: "dnhv_tien_do_v1",
    CAI_DAT: "dnhv_cai_dat_v1",
  };

  const TRANG_THAI = {
    CHUA_HOC: "chua-hoc",
    DANG_HOC: "dang-hoc",
    DA_THUOC: "da-thuoc",
  };

  const macDinhCaiDat = {
    packId: "en-US",
    giaoDien: "tu-dong", // tu-dong | sang | toi
    mode: "chu-de", // chu-de | ngau-nhien | tu-kho
    auto: false,
    intervalSec: 5,
    hienNghia: true,
    hienIpa: false,
    hienViDu: true,
  };

  // ====== Tiện ích ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const thongBao = (msg, kieu = "info") => {
    const nhatKy = $("#nhatKy");
    const prefix = kieu === "loi" ? "LỖI" : kieu === "ok" ? "OK" : "INFO";
    const dong = `[${new Date().toLocaleTimeString("vi-VN")}] ${prefix}: ${msg}\n`;
    nhatKy.textContent = dong + nhatKy.textContent;
  };

  const taiJson = async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`Không tải được dữ liệu: ${url}`);
    return await r.json();
  };

  const taiLocal = (khoa, macDinh) => {
    try {
      const raw = localStorage.getItem(khoa);
      if (!raw) return macDinh;
      return JSON.parse(raw);
    } catch {
      return macDinh;
    }
  };

  const luuLocal = (khoa, obj) => {
    localStorage.setItem(khoa, JSON.stringify(obj));
  };

  const taiCsv = async (file) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV trống hoặc không hợp lệ.");
    const header = parseCsvLine(lines[0]).map(s => s.trim());
    const rows = lines.slice(1).map(parseCsvLine);
    return { header, rows };
  };

  function parseCsvLine(line){
    // CSV tối giản: hỗ trợ dấu phẩy và dấu ngoặc kép
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i=0;i<line.length;i++){
      const ch = line[i];
      if (ch === '"'){
        if (inQ && line[i+1] === '"'){ cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ){
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  // ====== Trạng thái ứng dụng ======
  const state = {
    duLieu: null,        // {schemaVersion, packs:[...]}
    pack: null,          // pack hiện tại
    caiDat: taiLocal(KHOA.CAI_DAT, macDinhCaiDat),
    tienDo: taiLocal(KHOA.TIEN_DO, { byItem: {}, kho: {} }), // byItem[id]={status, difficult, lastSeen}
    boLoc: {
      q: "",
      topicId: "tat-ca",
      difficulty: "tat-ca",
      status: "tat-ca",
    },
    hoc: {
      danhSach: [], // mảng itemId theo thứ tự học
      index: 0,
      flipped: false,
      topicIdDangChon: null,
    },
    autoTimer: null,
  };

  // ====== DOM ======
  const dom = {
    oTim: $("#oTim"),
    btnXoaTim: $("#btnXoaTim"),
    btnCheDo: $("#btnCheDo"),
    btnCaiDat: $("#btnCaiDat"),
    btnHuongDan: $("#btnHuongDan"),
    dlgCheDo: $("#dlgCheDo"),
    dlgCaiDat: $("#dlgCaiDat"),
    dlgHuongDan: $("#dlgHuongDan"),
    chonGoi: $("#chonGoi"),
    chonGiaoDien: $("#chonGiaoDien"),

    dsChuDe: $("#dsChuDe"),
    dsTatCa: $("#dsTatCa"),
    locTrangThai: $("#locTrangThai"),
    locDoKho: $("#locDoKho"),
    locChuDe: $("#locChuDe"),

    btnOnTuKho: $("#btnOnTuKho"),
    btnOnChuaThuoc: $("#btnOnChuaThuoc"),

    tepTaiLen: $("#tepTaiLen"),
    btnNhapGop: $("#btnNhapGop"),
    btnNhapThay: $("#btnNhapThay"),
    btnXuatJson: $("#btnXuatJson"),
    btnKhoiPhucMacDinh: $("#btnKhoiPhucMacDinh"),
    btnXoaDuLieu: $("#btnXoaDuLieu"),

    chipChuDe: $("#chipChuDe"),
    chipGoi: $("#chipGoi"),
    dongChiMuc: $("#dongChiMuc"),

    flashcard: $("#flashcard"),
    oTerm: $("#oTerm"),
    oIpa: $("#oIpa"),
    oMeaning: $("#oMeaning"),
    oExample: $("#oExample"),
    oExampleVi: $("#oExampleVi"),

    btnDanhDauKho: $("#btnDanhDauKho"),
    btnTruoc: $("#btnTruoc"),
    btnLat: $("#btnLat"),
    btnTiep: $("#btnTiep"),
    btnTuDong: $("#btnTuDong"),
    oKhoang: $("#oKhoang"),
    lblGiay: $("#lblGiay"),
    anHienNghia: $("#anHienNghia"),
    anHienIpa: $("#anHienIpa"),
    anHienViDu: $("#anHienViDu"),
    chonTrangThai: $("#chonTrangThai"),
    chonDoKho: $("#chonDoKho"),
    btnCheDoHocChuDe: $("#btnCheDoHocChuDe"),
    btnCheDoHocNgauNhien: $("#btnCheDoHocNgauNhien"),

    lblTienDoTong: $("#lblTienDoTong"),
    barTong: $("#barTong"),
  };

  // ====== Tải dữ liệu ======
  async function khoiDong(){
    apDungGiaoDien(state.caiDat.giaoDien);

    // Ưu tiên dữ liệu người dùng đã nhập trước đó
    const duLieuDaLuu = taiLocal(KHOA.DU_LIEU, null);
    if (duLieuDaLuu && duLieuDaLuu.packs?.length){
      state.duLieu = duLieuDaLuu;
      thongBao("Đã nạp dữ liệu từ bộ nhớ trình duyệt.", "ok");
    } else {
      state.duLieu = await taiJson("data/default-pack.en-US.json");
      luuLocal(KHOA.DU_LIEU, state.duLieu);
      thongBao("Đã nạp gói dữ liệu mặc định.", "ok");
    }

    napPackTheoCaiDat();
    ganSuKien();
    veUI();
    chuyenMode(state.caiDat.mode, true);
    moHuongDanLanDau();
  }

  function moHuongDanLanDau(){
    const daMo = taiLocal("dnhv_da_mo_huong_dan", false);
    if (!daMo){
      dom.dlgHuongDan.showModal();
      luuLocal("dnhv_da_mo_huong_dan", true);
    }
  }

  function napPackTheoCaiDat(){
    const pack = state.duLieu.packs.find(p => p.id === state.caiDat.packId) || state.duLieu.packs[0];
    state.pack = pack;
    state.caiDat.packId = pack.id;
    luuLocal(KHOA.CAI_DAT, state.caiDat);
  }

  // ====== Ràng buộc dữ liệu ======
  function chuanHoaDuLieu(duLieu){
    if (!duLieu || typeof duLieu !== "object") throw new Error("Tệp không phải JSON hợp lệ.");
    if (duLieu.schemaVersion !== 1) throw new Error("schemaVersion không đúng (cần = 1).");
    if (!Array.isArray(duLieu.packs) || duLieu.packs.length === 0) throw new Error("Thiếu danh sách packs.");
    for (const p of duLieu.packs){
      if (!p.id || !p.ten) throw new Error("Mỗi pack cần có id và ten.");
      if (!Array.isArray(p.topics) || !Array.isArray(p.items)) throw new Error("Pack phải có topics và items (mảng).");
      const topicIds = new Set(p.topics.map(t => t.id));
      for (const it of p.items){
        const batBuoc = ["id","topicId","term","meaning_vi","example","example_vi"];
        for (const k of batBuoc){
          if (typeof it[k] !== "string" || it[k].trim() === "") throw new Error(`Mục ${it.id || "(không có id)"} thiếu trường bắt buộc: ${k}`);
        }
        if (!topicIds.has(it.topicId)) throw new Error(`Mục ${it.id} có topicId không tồn tại: ${it.topicId}`);
        if (it.difficulty != null && ![1,2,3].includes(Number(it.difficulty))) throw new Error(`Mục ${it.id} có difficulty không hợp lệ (1-3).`);
        if (it.tags != null && !Array.isArray(it.tags)) throw new Error(`Mục ${it.id} có tags không phải mảng.`);
      }
    }
    return duLieu;
  }

  function csvSangDuLieu(csv){
    // Cột khuyến nghị: packId, packTen, topic, topicId, term, ipa, meaning_vi, example, example_vi, pos, tags, difficulty
    const idx = (name) => csv.header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const iTopic = idx("topic");
    const iTopicId = idx("topicId");
    const iTerm = idx("term");
    const iIpa = idx("ipa");
    const iMean = idx("meaning_vi");
    const iEx = idx("example");
    const iExVi = idx("example_vi");
    if (iTerm < 0 || iMean < 0 || iEx < 0 || iExVi < 0) {
      throw new Error("CSV thiếu cột bắt buộc. Cần: term, meaning_vi, example, example_vi. (topic/topicId khuyến nghị)");
    }

    const packId = "import-1";
    const topicsMap = new Map();
    const items = [];

    for (let r=0;r<csv.rows.length;r++){
      const row = csv.rows[r];
      const topicName = (iTopic >= 0 ? row[iTopic] : "Chưa phân loại") || "Chưa phân loại";
      const topicId = (iTopicId >= 0 ? row[iTopicId] : null) || ("topic-" + slug(topicName));
      if (!topicsMap.has(topicId)){
        topicsMap.set(topicId, { id: topicId, ten: topicName });
      }
      const it = {
        id: `${topicId}-${String(r+1).padStart(3,"0")}`,
        topicId,
        term: (row[iTerm]||"").trim(),
        ipa: (iIpa >= 0 ? (row[iIpa]||"").trim() : ""),
        meaning_vi: (row[iMean]||"").trim(),
        example: (row[iEx]||"").trim(),
        example_vi: (row[iExVi]||"").trim(),
        pos: "",
        tags: [],
        difficulty: 1
      };
      items.push(it);
    }

    return chuanHoaDuLieu({
      schemaVersion: 1,
      packs: [{
        id: packId,
        ten: "Dữ liệu CSV đã nhập",
        moTa: "Tạo tự động từ CSV.",
        ngonNguHoc: "unknown",
        ngonNguGiaiNghia: "vi-VN",
        topics: Array.from(topicsMap.values()),
        items
      }]
    });
  }

  function slug(s){
    return s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // ====== Lọc & danh sách ======
  function timKiemTrongItem(it, q){
    if (!q) return true;
    const s = q.toLowerCase();
    const tags = (it.tags||[]).join(" ").toLowerCase();
    return (
      it.term.toLowerCase().includes(s) ||
      it.meaning_vi.toLowerCase().includes(s) ||
      (it.example||"").toLowerCase().includes(s) ||
      tags.includes(s)
    );
  }

  function layTienDo(itemId){
    return state.tienDo.byItem[itemId] || { status: TRANG_THAI.CHUA_HOC, difficult: false };
  }

  function setTienDo(itemId, patch){
    const cur = layTienDo(itemId);
    state.tienDo.byItem[itemId] = { ...cur, ...patch, lastSeen: Date.now() };
    luuLocal(KHOA.TIEN_DO, state.tienDo);
  }

  function itemsDaLoc(){
    const p = state.pack;
    const q = state.boLoc.q.trim();
    return p.items.filter(it => {
      if (state.boLoc.topicId !== "tat-ca" && it.topicId !== state.boLoc.topicId) return false;
      if (state.boLoc.difficulty !== "tat-ca" && String(it.difficulty||1) !== String(state.boLoc.difficulty)) return false;
      if (state.boLoc.status !== "tat-ca"){
        const st = layTienDo(it.id).status;
        if (st !== state.boLoc.status) return false;
      }
      if (!timKiemTrongItem(it, q)) return false;
      return true;
    });
  }

  // ====== Học ======
  function taoDanhSachHocTheoChuDe(topicId){
    const list = state.pack.items.filter(it => it.topicId === topicId);
    state.hoc.danhSach = list.map(it => it.id);
    state.hoc.index = 0;
    state.hoc.topicIdDangChon = topicId;
    renderCard();
  }

  function taoDanhSachHocNgauNhien(){
    const list = itemsDaLoc();
    const ids = list.map(it => it.id);
    tronMang(ids);
    state.hoc.danhSach = ids;
    state.hoc.index = 0;
    state.hoc.topicIdDangChon = null;
    renderCard();
  }

  function taoDanhSachTuKho(){
    const list = state.pack.items.filter(it => layTienDo(it.id).difficult);
    const ids = list.map(it => it.id);
    state.hoc.danhSach = ids;
    state.hoc.index = 0;
    state.hoc.topicIdDangChon = null;
    renderCard();
  }

  function taoDanhSachChuaThuoc(){
    const list = state.pack.items.filter(it => layTienDo(it.id).status !== TRANG_THAI.DA_THUOC);
    const ids = list.map(it => it.id);
    state.hoc.danhSach = ids;
    state.hoc.index = 0;
    state.hoc.topicIdDangChon = null;
    renderCard();
  }

  function tronMang(a){
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
  }

  function itemHienTai(){
    const id = state.hoc.danhSach[state.hoc.index];
    return state.pack.items.find(it => it.id === id) || null;
  }

  function truoc(){
    if (!state.hoc.danhSach.length) return;
    state.hoc.index = (state.hoc.index - 1 + state.hoc.danhSach.length) % state.hoc.danhSach.length;
    state.hoc.flipped = false;
    renderCard();
  }

  function tiep(){
    if (!state.hoc.danhSach.length) return;
    state.hoc.index = (state.hoc.index + 1) % state.hoc.danhSach.length;
    state.hoc.flipped = false;
    renderCard();
  }

  function lat(){
    state.hoc.flipped = !state.hoc.flipped;
    renderCard();
  }

  function batTatTuDong(force){
    state.caiDat.auto = typeof force === "boolean" ? force : !state.caiDat.auto;
    luuLocal(KHOA.CAI_DAT, state.caiDat);
    if (state.caiDat.auto){
      dongTimer();
      state.autoTimer = setInterval(() => {
        // nếu đang lật mặt trước -> lật; nếu đang mặt sau -> sang thẻ tiếp
        if (!state.hoc.flipped) lat();
        else tiep();
      }, state.caiDat.intervalSec * 1000);
      thongBao(`Đã bật tự động (${state.caiDat.intervalSec}s).`, "ok");
    } else {
      dongTimer();
      thongBao("Đã tắt tự động.", "ok");
    }
    renderAutoUI();
  }

  function dongTimer(){
    if (state.autoTimer){
      clearInterval(state.autoTimer);
      state.autoTimer = null;
    }
  }

  // ====== UI ======
  function veUI(){
    // dropdown pack
    dom.chonGoi.innerHTML = "";
    for (const p of state.duLieu.packs){
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.ten;
      if (p.id === state.caiDat.packId) opt.selected = true;
      dom.chonGoi.appendChild(opt);
    }
    dom.chonGiaoDien.value = state.caiDat.giaoDien;

    // lọc chủ đề
    dom.locChuDe.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "tat-ca";
    optAll.textContent = "Tất cả";
    dom.locChuDe.appendChild(optAll);
    for (const t of state.pack.topics){
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.ten;
      dom.locChuDe.appendChild(opt);
    }
    dom.locChuDe.value = state.boLoc.topicId;

    // danh sách chủ đề
    renderChuDe();
    renderTatCa();
    taoDanhSachHocKhoiTao();
    renderToggles();
    renderAutoUI();
    renderTienDo();
  }

  function renderChuDe(){
    dom.dsChuDe.innerHTML = "";
    for (const t of state.pack.topics){
      const n = demTienDoChuDe(t.id);
      const el = document.createElement("button");
      el.className = "item";
      el.type = "button";
      el.innerHTML = `<span><b>${t.ten}</b><div class="phu">${n.daThuoc}/${n.tong} đã thuộc</div></span><span class="phu">${phanTram(n.daThuoc,n.tong)}%</span>`;
      el.addEventListener("click", () => {
        state.boLoc.topicId = t.id;
        dom.locChuDe.value = t.id;
        state.caiDat.mode = "chu-de";
        luuLocal(KHOA.CAI_DAT, state.caiDat);
        taoDanhSachHocTheoChuDe(t.id);
        renderChuDe();
        renderTatCa();
        thongBao(`Đang học chủ đề: ${t.ten}`, "ok");
      });
      dom.dsChuDe.appendChild(el);
    }
  }

  function renderTatCa(){
    const list = itemsDaLoc();
    dom.dsTatCa.innerHTML = "";
    if (!list.length){
      const el = document.createElement("div");
      el.className = "mo-ta";
      el.textContent = "Không có mục nào khớp bộ lọc/tìm kiếm.";
      dom.dsTatCa.appendChild(el);
      return;
    }
    for (const it of list.slice(0, 260)){
      const td = layTienDo(it.id);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "item";
      el.innerHTML = `<span><b>${escapeHtml(it.term)}</b><div class="phu">${escapeHtml(it.meaning_vi)} • ${nhanTrangThai(td.status)}${td.difficult ? " • ⭐" : ""}</div></span><span class="phu">ĐK ${it.difficulty||1}</span>`;
      el.addEventListener("click", () => {
        state.hoc.danhSach = list.map(x => x.id);
        state.hoc.index = state.hoc.danhSach.indexOf(it.id);
        state.hoc.flipped = false;
        state.hoc.topicIdDangChon = null;
        renderCard();
        thongBao("Đã mở mục từ danh sách.", "ok");
      });
      dom.dsTatCa.appendChild(el);
    }
  }

  function taoDanhSachHocKhoiTao(){
    if (state.caiDat.mode === "tu-kho") taoDanhSachTuKho();
    else if (state.caiDat.mode === "ngau-nhien") taoDanhSachHocNgauNhien();
    else {
      const topicId = state.boLoc.topicId !== "tat-ca" ? state.boLoc.topicId : state.pack.topics[0]?.id;
      if (topicId) taoDanhSachHocTheoChuDe(topicId);
      else renderCard();
    }
  }

  function renderCard(){
    const it = itemHienTai();
    const has = !!it;
    dom.oTerm.textContent = has ? it.term : "Không có dữ liệu";
    dom.oMeaning.textContent = has ? it.meaning_vi : "Hãy nhập dữ liệu ở tab Nhập/Xuất.";
    dom.oExample.textContent = has && state.caiDat.hienViDu ? it.example : "";
    dom.oExampleVi.textContent = has && state.caiDat.hienViDu ? it.example_vi : "";
    dom.oIpa.textContent = has && state.caiDat.hienIpa && it.ipa ? `/${it.ipa}/` : "";

    // chip
    const topic = has ? state.pack.topics.find(t => t.id === it.topicId) : null;
    dom.chipChuDe.textContent = topic ? topic.ten : "—";
    dom.chipGoi.textContent = state.pack?.ten || "—";

    // trạng thái & độ khó
    if (has){
      const td = layTienDo(it.id);
      dom.chonTrangThai.value = td.status || TRANG_THAI.CHUA_HOC;
      dom.chonDoKho.value = String(it.difficulty||1);
      dom.btnDanhDauKho.setAttribute("aria-pressed", td.difficult ? "true" : "false");
      dom.btnDanhDauKho.textContent = td.difficult ? "⭐ Đã đánh dấu" : "⭐ Từ khó";
    }

    // flip
    dom.flashcard.classList.toggle("is-flipped", state.hoc.flipped);
    const frontHidden = state.hoc.flipped ? "true" : "false";
    const backHidden = state.hoc.flipped ? "false" : "true";
    dom.flashcard.querySelector(".mat.truoc").setAttribute("aria-hidden", frontHidden);
    dom.flashcard.querySelector(".mat.sau").setAttribute("aria-hidden", backHidden);

    // hiển thị nghĩa
    $(".mat.sau .meaning").style.display = state.caiDat.hienNghia ? "block" : "none";

    // chỉ mục
    dom.dongChiMuc.textContent = has ? `${state.hoc.index + 1} / ${state.hoc.danhSach.length}` : "0 / 0";

    // cập nhật tiến độ
    if (has){
      setTienDo(it.id, { status: layTienDo(it.id).status }); // chạm để lưu lastSeen
    }
    renderTienDo();
  }

  function renderTienDo(){
    const all = state.pack.items;
    const daThuoc = all.filter(it => layTienDo(it.id).status === TRANG_THAI.DA_THUOC).length;
    dom.lblTienDoTong.textContent = `${daThuoc}/${all.length} đã thuộc`;
    const pct = phanTram(daThuoc, all.length);
    dom.barTong.style.width = `${pct}%`;
    renderChuDe(); // cập nhật thống kê
  }

  function demTienDoChuDe(topicId){
    const list = state.pack.items.filter(it => it.topicId === topicId);
    const daThuoc = list.filter(it => layTienDo(it.id).status === TRANG_THAI.DA_THUOC).length;
    return { tong: list.length, daThuoc };
  }

  function phanTram(a,b){
    if (!b) return 0;
    return Math.round((a/b)*100);
  }

  function renderAutoUI(){
    dom.btnTuDong.setAttribute("aria-pressed", state.caiDat.auto ? "true" : "false");
    dom.btnTuDong.textContent = state.caiDat.auto ? "Tự động: BẬT" : "Tự động";
    dom.oKhoang.value = String(state.caiDat.intervalSec);
    dom.lblGiay.textContent = `${state.caiDat.intervalSec}s`;
  }

  function renderToggles(){
    dom.anHienNghia.checked = state.caiDat.hienNghia;
    dom.anHienIpa.checked = state.caiDat.hienIpa;
    dom.anHienViDu.checked = state.caiDat.hienViDu;
  }

  function apDungGiaoDien(mode){
    document.documentElement.dataset.theme = mode;
    if (mode === "sang"){
      document.documentElement.style.colorScheme = "light";
    } else if (mode === "toi"){
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.style.colorScheme = "";
    }
  }

  function nhanTrangThai(st){
    if (st === TRANG_THAI.DA_THUOC) return "Đã thuộc";
    if (st === TRANG_THAI.DANG_HOC) return "Đang học";
    return "Chưa học";
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[m]));
  }

  // ====== Tab điều hướng ======
  function chuyenTab(name){
    $$(".tab").forEach(btn => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$("[data-tab-panel]").forEach(p => p.classList.toggle("is-hidden", p.dataset.tabPanel !== name));
  }

  // ====== Mode ======
  function chuyenMode(mode, khoiTao=false){
    state.caiDat.mode = mode;
    luuLocal(KHOA.CAI_DAT, state.caiDat);

    if (mode === "tu-kho") taoDanhSachTuKho();
    else if (mode === "ngau-nhien") taoDanhSachHocNgauNhien();
    else {
      const topicId = state.hoc.topicIdDangChon || (state.boLoc.topicId !== "tat-ca" ? state.boLoc.topicId : state.pack.topics[0]?.id);
      if (topicId) taoDanhSachHocTheoChuDe(topicId);
    }

    if (!khoiTao) thongBao(`Đã chuyển chế độ: ${mode === "chu-de" ? "Học theo chủ đề" : mode === "ngau-nhien" ? "Học ngẫu nhiên" : "Ôn lại từ khó"}`, "ok");
  }

  // ====== Nhập/Xuất ======
  async function docTepNguoiDung(){
    const f = dom.tepTaiLen.files?.[0];
    if (!f) throw new Error("Bạn chưa chọn tệp để tải lên.");
    const ten = f.name.toLowerCase();
    if (ten.endsWith(".json")){
      const text = await f.text();
      let obj;
      try { obj = JSON.parse(text); } catch { throw new Error("JSON lỗi cú pháp."); }
      return chuanHoaDuLieu(obj);
    }
    if (ten.endsWith(".csv")){
      const csv = await taiCsv(f);
      return csvSangDuLieu(csv);
    }
    throw new Error("Định dạng tệp không hỗ trợ. Chỉ nhận .json hoặc .csv.");
  }

  function gopDuLieu(duLieuMoi){
    const cu = state.duLieu;
    const mapPack = new Map(cu.packs.map(p => [p.id, p]));
    for (const pMoi of duLieuMoi.packs){
      if (!mapPack.has(pMoi.id)){
        cu.packs.push(pMoi);
        continue;
      }
      const pCu = mapPack.get(pMoi.id);
      // gộp topics
      const topicMap = new Map(pCu.topics.map(t => [t.id, t]));
      for (const t of pMoi.topics){
        if (!topicMap.has(t.id)) pCu.topics.push(t);
      }
      // gộp items theo id
      const itemMap = new Map(pCu.items.map(it => [it.id, it]));
      for (const it of pMoi.items){
        if (!itemMap.has(it.id)) pCu.items.push(it);
      }
    }
    return cu;
  }

  function thayTheDuLieu(duLieuMoi){
    return duLieuMoi;
  }

  function taiXuongJson(obj, tenFile){
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tenFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ====== Sự kiện ======
  function ganSuKien(){
    // Tabs
    $$(".tab").forEach(btn => btn.addEventListener("click", () => chuyenTab(btn.dataset.tab)));

    // Search
    dom.oTim.addEventListener("input", () => {
      state.boLoc.q = dom.oTim.value;
      renderTatCa();
      if (dom.oTim.value.trim()) chuyenTab("tat-ca");
    });
    dom.btnXoaTim.addEventListener("click", () => {
      dom.oTim.value = "";
      state.boLoc.q = "";
      renderTatCa();
      dom.oTim.focus();
    });

    // Bộ lọc
    dom.locTrangThai.addEventListener("change", () => { state.boLoc.status = dom.locTrangThai.value; renderTatCa(); });
    dom.locDoKho.addEventListener("change", () => { state.boLoc.difficulty = dom.locDoKho.value; renderTatCa(); });
    dom.locChuDe.addEventListener("change", () => { state.boLoc.topicId = dom.locChuDe.value; renderTatCa(); });

    // Flashcard & điều khiển
    dom.flashcard.addEventListener("click", lat);
    dom.btnLat.addEventListener("click", lat);
    dom.btnTruoc.addEventListener("click", truoc);
    dom.btnTiep.addEventListener("click", tiep);

    dom.btnTuDong.addEventListener("click", () => batTatTuDong());
    dom.oKhoang.addEventListener("input", () => {
      state.caiDat.intervalSec = clamp(Number(dom.oKhoang.value || 5), 3, 10);
      dom.lblGiay.textContent = `${state.caiDat.intervalSec}s`;
      luuLocal(KHOA.CAI_DAT, state.caiDat);
      if (state.caiDat.auto){
        batTatTuDong(false);
        batTatTuDong(true);
      }
    });

    dom.anHienNghia.addEventListener("change", () => {
      state.caiDat.hienNghia = dom.anHienNghia.checked;
      luuLocal(KHOA.CAI_DAT, state.caiDat);
      renderCard();
    });
    dom.anHienIpa.addEventListener("change", () => {
      state.caiDat.hienIpa = dom.anHienIpa.checked;
      luuLocal(KHOA.CAI_DAT, state.caiDat);
      renderCard();
    });
    dom.anHienViDu.addEventListener("change", () => {
      state.caiDat.hienViDu = dom.anHienViDu.checked;
      luuLocal(KHOA.CAI_DAT, state.caiDat);
      renderCard();
    });

    dom.btnDanhDauKho.addEventListener("click", () => {
      const it = itemHienTai(); if (!it) return;
      const td = layTienDo(it.id);
      setTienDo(it.id, { difficult: !td.difficult });
      renderCard();
      thongBao(td.difficult ? "Đã bỏ đánh dấu từ khó." : "Đã đánh dấu từ khó.", "ok");
    });

    dom.chonTrangThai.addEventListener("change", () => {
      const it = itemHienTai(); if (!it) return;
      setTienDo(it.id, { status: dom.chonTrangThai.value });
      renderCard();
      renderTatCa();
    });

    dom.chonDoKho.addEventListener("change", () => {
      const it = itemHienTai(); if (!it) return;
      it.difficulty = Number(dom.chonDoKho.value);
      luuLocal(KHOA.DU_LIEU, state.duLieu);
      renderCard();
      renderTatCa();
    });

    dom.btnCheDoHocChuDe.addEventListener("click", () => chuyenMode("chu-de"));
    dom.btnCheDoHocNgauNhien.addEventListener("click", () => chuyenMode("ngau-nhien"));

    // Ôn tập
    dom.btnOnTuKho.addEventListener("click", () => { chuyenMode("tu-kho"); chuyenTab("on-tap"); });
    dom.btnOnChuaThuoc.addEventListener("click", () => { state.caiDat.mode = "ngau-nhien"; luuLocal(KHOA.CAI_DAT, state.caiDat); taoDanhSachChuaThuoc(); thongBao("Đang ôn mục chưa thuộc.", "ok"); });

    // Dialogs
    dom.btnCheDo.addEventListener("click", () => dom.dlgCheDo.showModal());
    dom.btnCaiDat.addEventListener("click", () => dom.dlgCaiDat.showModal());
    dom.btnHuongDan.addEventListener("click", () => dom.dlgHuongDan.showModal());

    dom.dlgCheDo.addEventListener("close", () => {
      const v = dom.dlgCheDo.returnValue;
      if (v === "cancel") return;
      const mode = $("input[name='mode']:checked", dom.dlgCheDo)?.value || "chu-de";
      chuyenMode(mode);
    });

    dom.dlgCaiDat.addEventListener("close", () => {
      const v = dom.dlgCaiDat.returnValue;
      if (v === "cancel") return;

      state.caiDat.packId = dom.chonGoi.value;
      state.caiDat.giaoDien = dom.chonGiaoDien.value;
      luuLocal(KHOA.CAI_DAT, state.caiDat);
      apDungGiaoDien(state.caiDat.giaoDien);

      napPackTheoCaiDat();
      veUI();
      thongBao("Đã lưu cài đặt.", "ok");
    });

    // Import/export
    dom.btnNhapGop.addEventListener("click", async () => {
      try {
        const duLieuMoi = await docTepNguoiDung();
        state.duLieu = gopDuLieu(duLieuMoi);
        luuLocal(KHOA.DU_LIEU, state.duLieu);
        napPackTheoCaiDat();
        veUI();
        thongBao("Nhập (gộp) thành công.", "ok");
      } catch (e){
        thongBao(e.message || "Nhập thất bại.", "loi");
      }
    });

    dom.btnNhapThay.addEventListener("click", async () => {
      try {
        const duLieuMoi = await docTepNguoiDung();
        state.duLieu = thayTheDuLieu(duLieuMoi);
        luuLocal(KHOA.DU_LIEU, state.duLieu);
        // reset tiến độ (vì id có thể đổi)
        state.tienDo = { byItem: {}, kho: {} };
        luuLocal(KHOA.TIEN_DO, state.tienDo);
        state.caiDat.packId = state.duLieu.packs[0].id;
        luuLocal(KHOA.CAI_DAT, state.caiDat);

        napPackTheoCaiDat();
        veUI();
        thongBao("Nhập (thay thế) thành công.", "ok");
      } catch (e){
        thongBao(e.message || "Nhập thất bại.", "loi");
      }
    });

    dom.btnXuatJson.addEventListener("click", () => {
      taiXuongJson(state.duLieu, `du-lieu-${new Date().toISOString().slice(0,10)}.json`);
    });

    dom.btnKhoiPhucMacDinh.addEventListener("click", async () => {
      if (!confirm("Bạn chắc chắn muốn khôi phục gói mặc định? (Dữ liệu hiện tại sẽ bị thay thế)")) return;
      try{
        const def = await taiJson("data/default-pack.en-US.json");
        state.duLieu = def;
        luuLocal(KHOA.DU_LIEU, state.duLieu);
        state.tienDo = { byItem: {}, kho: {} };
        luuLocal(KHOA.TIEN_DO, state.tienDo);
        state.caiDat.packId = "en-US";
        luuLocal(KHOA.CAI_DAT, state.caiDat);
        napPackTheoCaiDat();
        veUI();
        thongBao("Đã khôi phục gói mặc định.", "ok");
      } catch(e){
        thongBao(e.message || "Khôi phục thất bại.", "loi");
      }
    });

    dom.btnXoaDuLieu.addEventListener("click", () => {
      if (!confirm("Xóa toàn bộ dữ liệu & tiến độ trên trình duyệt?")) return;
      localStorage.removeItem(KHOA.DU_LIEU);
      localStorage.removeItem(KHOA.TIEN_DO);
      localStorage.removeItem(KHOA.CAI_DAT);
      localStorage.removeItem("dnhv_da_mo_huong_dan");
      thongBao("Đã xóa. Hãy tải lại trang.", "ok");
    });

    // Phím tắt
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== dom.oTim){
        e.preventDefault();
        dom.oTim.focus();
        return;
      }
      if (document.activeElement === dom.oTim) return;

      if (e.key === " "){
        e.preventDefault();
        lat();
      } else if (e.key === "ArrowLeft"){
        e.preventDefault();
        truoc();
      } else if (e.key === "ArrowRight"){
        e.preventDefault();
        tiep();
      } else if (e.key.toLowerCase() === "a"){
        e.preventDefault();
        batTatTuDong();
      } else if (e.key.toLowerCase() === "k"){
        e.preventDefault();
        dom.btnDanhDauKho.click();
      }
    });
  }

  // ====== Bắt đầu ======
  khoiDong().catch(err => {
    console.error(err);
    alert("Không khởi động được ứng dụng. Hãy kiểm tra file dữ liệu.");
  });
})();
