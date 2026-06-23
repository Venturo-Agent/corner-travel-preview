/* ============================================================
   CORNER — GSAP 動態層（只在首頁載入；依官方 gsap-scrolltrigger 最佳實踐）
   reveal 交錯 / 圖片框內視差(遮罩固定照片位移) / hero 入場+視差 / 為什麼 staggered 捲入 / 標題進場
   GSAP 不在時自動降級：顯示所有內容。
   ============================================================ */
// ===== Hero 封面輪播（自動 + 圓點 + 左右；不依賴 GSAP）=====
(function(){
  var slides = document.querySelectorAll('.hero-slide');
  if(slides.length < 2) return;
  var dots = document.querySelectorAll('.hero-dot');
  var cmaps = document.querySelectorAll('.cmap');
  var reduceM = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var i = 0, timer;
  function go(n){
    slides[i].classList.remove('active'); if(dots[i]) dots[i].classList.remove('on'); if(cmaps[i]) cmaps[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('active'); if(dots[i]) dots[i].classList.add('on'); if(cmaps[i]) cmaps[i].classList.add('active');
  }
  function loop(){ if(!reduceM) timer = setInterval(function(){ go(i+1); }, 5000); }
  function reset(){ clearInterval(timer); loop(); }
  if(!slides[0].classList.contains('active')) slides[0].classList.add('active');
  if(dots[0]) dots[0].classList.add('on');
  dots.forEach(function(d,k){ d.addEventListener('click', function(){ go(k); reset(); }); });
  var pv = document.querySelector('.hero-arrow.prev'), nx = document.querySelector('.hero-arrow.next');
  if(pv) pv.addEventListener('click', function(){ go(i-1); reset(); });
  if(nx) nx.addEventListener('click', function(){ go(i+1); reset(); });
  loop();
})();

(function(){
  if(!window.gsap || !window.ScrollTrigger){
    document.querySelectorAll('.reveal,.why-block,.ghead').forEach(function(e){e.style.opacity='1';e.style.transform='none';});
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  // ===== 有動效 =====
  mm.add('(prefers-reduced-motion: no-preference)', function(){

    // 1) 標題：行進場（clip + 上移），比一般 reveal 更講究
    gsap.utils.toArray('.ghead').forEach(function(h){
      gsap.from(h, {
        opacity:0, yPercent:30, duration:1, ease:'power3.out',
        scrollTrigger:{ trigger:h, start:'top 88%', once:true }
      });
    });

    // 2) 一般 reveal：淡入上移（fromTo 明確收在可見，避免被 CSS opacity:0 卡住）
    gsap.utils.toArray('.reveal').forEach(function(el){
      gsap.fromTo(el, {opacity:0, y:44}, {
        opacity:1, y:0, duration:.9, ease:'power3.out',
        scrollTrigger:{ trigger:el, start:'top 86%', once:true }
      });
    });

    // 3) 圖片框內視差：遮罩(框)固定、裡面照片隨捲動上下位移（Izanami 波動感）
    gsap.utils.toArray('.px-img').forEach(function(img){
      var frame = img.closest('.land-card,.trip-card,.wb-photo,.testi,.px-frame') || img.parentElement;
      gsap.fromTo(img, {yPercent:-13}, {
        yPercent:13, ease:'none',
        scrollTrigger:{ trigger:frame, start:'top bottom', end:'bottom top', scrub:true }
      });
    });

    // 3b) 手風琴（為什麼/怎麼進行）照片：在斜切框內隨捲動位移（不動 skew/hover）
    gsap.utils.toArray('.slant-col .ph img').forEach(function(img){
      var col = img.closest('.slant-col');
      gsap.fromTo(img, {yPercent:-9}, {yPercent:9, ease:'none',
        scrollTrigger:{ trigger:col, start:'top bottom', end:'bottom top', scrub:true }});
    });

    // 4) HERO：入場序列 + 圖層視差 + 文字隨捲動上移淡出
    var hk = gsap.utils.toArray('.hero-seq > *');
    if(hk.length) gsap.from(hk, {opacity:0, y:32, duration:1, ease:'power3.out', stagger:.14, delay:.15});
    var himg = document.querySelector('.hero-img');
    if(himg) gsap.to(himg, {yPercent:16, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom top', scrub:true }});
    var hin = document.querySelector('.hero-inner');
    if(hin) gsap.to(hin, {yPercent:40, opacity:0, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'bottom 60%', scrub:true }});
    // 捲動提示：到下一段就淡出
    var cue = document.querySelector('.scroll-cue');
    if(cue) gsap.to(cue, {opacity:0, ease:'none',
      scrollTrigger:{ trigger:'.hero', start:'top top', end:'15% top', scrub:true }});

    // 5) 為什麼/怎麼進行：手風琴各欄捲動時依序滑入、定位成原本欄位後保留 hover 展開
    gsap.utils.toArray('.slant-acc').forEach(function(acc){
      gsap.from(acc.querySelectorAll('.slant-col'), {
        opacity:0, y:96, duration:1.05, ease:'power3.out', stagger:.13,
        scrollTrigger:{ trigger:acc, start:'top 82%', once:true }
      });
    });

    return function(){ /* cleanup handled by matchMedia revert */ };
  });

  // ===== 低動效偏好：全部直接顯示 =====
  mm.add('(prefers-reduced-motion: reduce)', function(){
    gsap.set('.reveal,.ghead,.why-block,.hero-seq > *',{opacity:1, y:0, clearProps:'transform'});
  });
})();
