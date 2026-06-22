/* ============================================================
   CORNER 角落旅行社 — 共用互動 (corner.js)
   nav 捲動態 / 漢堡選單 / reveal 交錯入場 / hero 入場序列 / hero 視差
   全站動態走 expoOut；reveal 結束戛然不漸弱（無 1.2s 全顯兜底）。
   ============================================================ */
(function(){
  // ---------- NAV 捲動態 ----------
  var nav = document.getElementById('nav');
  if(nav){
    var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  // ---------- 漢堡 / 全屏選單 ----------
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.nav-menu');
  if(toggle && menu){
    toggle.addEventListener('click', function(){
      menu.classList.toggle('open');
      toggle.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        menu.classList.remove('open'); toggle.classList.remove('open'); document.body.style.overflow='';
      });
    });
  }

  // ---------- REVEAL：交錯入場（index×60ms，標題再慢 0.1s） ----------
  var els = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce){
    els.forEach(function(el){ el.classList.add('in'); });
  } else if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      // 同一批進場者依視覺順序給 stagger
      entries.filter(function(e){return e.isIntersecting;})
        .sort(function(a,b){return a.boundingClientRect.top - b.boundingClientRect.top;})
        .forEach(function(e, i){
          var el = e.target;
          var base = el.hasAttribute('data-reveal-title') ? 100 : 0; // 標題比卡片再慢
          el.style.transitionDelay = (base + i*60) + 'ms';
          el.classList.add('in');
          // 落定後清掉 delay，避免日後 hover/transition 受影響
          setTimeout(function(){ el.style.transitionDelay = ''; }, base + i*60 + 850);
          io.unobserve(el);
        });
    }, {threshold:.01, rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight*0.95){ el.classList.add('in'); } // 首屏即顯
      else io.observe(el);
    });
  } else {
    els.forEach(function(el){ el.classList.add('in'); });
  }

  // ---------- HERO 入場序列（.hero-seq 的直接子元素，120ms stagger） ----------
  var seq = document.querySelector('.hero-seq');
  if(seq && !reduce){
    var kids = Array.prototype.slice.call(seq.children);
    kids.forEach(function(k){ k.style.opacity='0'; k.style.transform='translateY(28px)'; k.style.transition='opacity .9s var(--ease-expo), transform .9s var(--ease-expo)'; });
    var start = function(){
      kids.forEach(function(k, i){
        setTimeout(function(){ k.style.opacity='1'; k.style.transform='none'; }, 200 + i*120);
      });
    };
    var heroImg = document.querySelector('.hero-img img');
    if(heroImg && !heroImg.complete){ heroImg.addEventListener('load', start); setTimeout(start, 1400); }
    else start();
  }

  // ---------- HERO 視差（圖層慢、文字層快並淡出） ----------
  var pImg = document.querySelector('[data-parallax-img]');
  var pTxt = document.querySelector('[data-parallax-txt]');
  if((pImg || pTxt) && !reduce){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var y = window.scrollY;
        if(pImg) pImg.style.transform = 'translateY(' + (y*0.10) + 'px)';
        if(pTxt){
          pTxt.style.transform = 'translateY(' + (y*0.35) + 'px)';
          pTxt.style.opacity = Math.max(0, 1 - y/520);
        }
        ticking = false;
      });
    }, {passive:true});
  }
  // ---------- 收藏的角落：照片視差（捲動景深；和紙切入靠 .reveal→.in 觸發） ----------
  var lcards = document.querySelectorAll('.land-card');
  if(lcards.length && !reduce){
    var lraf = false;
    var lpar = function(){
      var vh = window.innerHeight;
      lcards.forEach(function(c){
        var r = c.getBoundingClientRect();
        if(r.bottom < -60 || r.top > vh + 60) return;
        var prog = ((r.top + r.height/2) - vh/2) / vh;
        if(prog > 0.6) prog = 0.6; if(prog < -0.6) prog = -0.6;
        var img = c.querySelector('img');
        if(img) img.style.transform = 'translateY(' + (prog * -30) + 'px) scale(1.12)';
      });
      lraf = false;
    };
    window.addEventListener('scroll', function(){ if(lraf) return; lraf = true; requestAnimationFrame(lpar); }, {passive:true});
    lpar();
  }
})();
