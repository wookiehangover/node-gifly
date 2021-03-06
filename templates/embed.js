(function(w,d,h){
  var id = +new Date() +'_<%= hash %>', jq, G = w.GIFLY = w.GIFLY || {},
  autoplay = <%= autoplay %>, controls = <%= controls %>,
  gif ='<div class="gifly-embed" id="'+id+'"><div class="gifly-figure"><img src="'+h+'/c/<%= hash %>"><div class="gifly-progress"></div></div><div class="gifly-controls"><a href="'+h+'" class="gifly-logo">gif.ly</a><a href="#" data-action="play" class="icon-play"></a><a href="http://<%= host %>/<%= hash %>.gif" target="_blank"><i class="icon-link"></i></a><a href="'+h+'/k/?src=/<%= hash %>.gif" class="icon-magic"></a></div></div>';
  if( (jq = w.jQuery || w.$) && jq.fn && parseFloat(jq.fn.jquery) >= 1.8 ) G.$ = jq;

  if( location.hostname === "www.thepensblog.com" ){
    console.error("you're using too much of my bandwidth, sorry");
    return;
  }

  function loadScript(cb) {
    var script = d.createElement('script');
    script.type  = 'text/javascript';
    script.async = true;
    script.src   = h+'/assets/js/embed-scripts.js';
    var entry = d.getElementsByTagName('script')[0], readyHandler;
    entry.parentNode.insertBefore(script, entry);
    if( script.addEventListener ){
      script.addEventListener('load', cb, false);
    } else {
      script.attachEvent('onreadystatechange', readyHandler = function() {
        if (/complete|loaded/.test(script.readyState)) {
          cb();
          script.detachEvent('onreadystatechange', readyHandler);
        }
      });
    }
  }

  function loadCSS(){
    var link = d.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = h+'/assets/css/embed.css';
    var entry = d.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(link, entry);
  }

  function onLoad(){
    var $el = G.$('#'+id),
    img = $el.find('img');
    $el
      .on('click', '[data-action="play"]', function(e){
        img.attr('src', h+'/<%= hash %>.gif');
        G.$(e.currentTarget).attr({
          'data-action': 'pause',
          'class': 'icon-pause'
        });
        return false;
      })
      .on('click', '[data-action="pause"]', function(e){
        img.attr('src', h+'/c/<%= hash %>');
        G.$(e.currentTarget).attr({
          'data-action': 'play',
          'class': 'icon-play'
        });
        return false;
      });
    var rendered = G.backgroundRender($el, h+'/<%= hash %>.gif');
    if( autoplay ){
      rendered.done(function(){
        $el.find('[data-action="play"]').trigger('click');
      });
    }
    if( controls ){
      $el.addClass('show-controls');
    }
  }

  if( !G.css ){
    G.css = true;
    loadCSS();
  }

  d.write(gif);

  if( G.$ && G.backgroundRender )
    onLoad();
  else if( G.loading )
    G.callbacks.push(onLoad);
  else {
    G.loading = true;
    G.callbacks = G.callbacks || [];
    loadScript(function(){
      G.loading = false;
      onLoad();
      var l = G.callbacks.length;
      while(l--){ G.callbacks[l](); }
    });
  }
})(window, document, 'http://<%= host %>');
