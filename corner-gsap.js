/* ============================================================
   CORNER — GSAP 動態層（只在首頁載入；依官方 gsap-scrolltrigger 最佳實踐）
   reveal 交錯 / 圖片框內視差(遮罩固定照片位移) / hero 入場+視差 / 為什麼 staggered 捲入 / 標題進場
   GSAP 不在時自動降級：顯示所有內容。
   ============================================================ */
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
      gsap.fromTo(img, {yPercent:-8}, {
        yPercent:8, ease:'none',
        scrollTrigger:{ trigger:frame, start:'top bottom', end:'bottom top', scrub:true }
      });
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

    // 5) 為什麼：不規則高低四塊，捲動時依序滑入定位
    var wb = gsap.utils.toArray('.why-stagger .why-block');
    if(wb.length) gsap.from(wb, {
      opacity:0, y:90, duration:1.05, ease:'power3.out', stagger:.14,
      scrollTrigger:{ trigger:'.why-stagger', start:'top 80%', once:true }
    });

    return function(){ /* cleanup handled by matchMedia revert */ };
  });

  // ===== 低動效偏好：全部直接顯示 =====
  mm.add('(prefers-reduced-motion: reduce)', function(){
    gsap.set('.reveal,.ghead,.why-block,.hero-seq > *',{opacity:1, y:0, clearProps:'transform'});
  });
})();
