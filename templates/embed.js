(function(w,d,h){
  var jq, G = w.GIFLY = w.GIFLY || {};
  if( (jq = w.jQuery || w.$) && jq.fn && parseFloat(jq.fn.jquery) >= 1.8 ){
    G.$ = jq;
  }
  function loadScript(url, callback) {
    var script = d.createElement('script');
    script.type  = 'text/javascript';
    script.async = true;
    script.src   = url;
    var entry = d.getElementsByTagName('script')[0], readyHandler;
    entry.parentNode.insertBefore(script, entry);
    if( script.addEventListener ){
      script.addEventListener('load', callback, false);
    } else {
      script.attachEvent('onreadystatechange', readyHandler = function() {
        if (/complete|loaded/.test(script.readyState)) {
          callback();
          script.detachEvent('onreadystatechange', readyHandler);
        }
      });
    }
  }

  var link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.type = 'text/css';
  link.href = h+'/assets/css/embed.css';
  var entry = document.getElementsByTagName('script')[0];
  entry.parentNode.insertBefore(link, entry);

  var id = +new Date() +'_<%= hash %>',
  s ='<div class="gifly-embed" id="'+id+'"><div class="gifly-figure"><img src="'+h+'/c/<%= hash %>"><div class="gifly-progress"></div></div><div class="gifly-controls"><a href="'+h+'" class="gifly-logo">gif.ly</a><a href="#" data-action="play" class="icon-play"></a><a href="http://<%= host %>/<%= hash %>.gif" target="_blank"><i class="icon-link"></i></a><a href="'+ h +'/k/?src=/<%= hash %>.gif" class="icon-magic"></a></div></div>';

  function gifLoaded(){
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

    G.backgroundRender($el, h+'/<%= hash %>.gif');
  }

  if( G.$ ){
    // console.log('we have the jqueries');
    gifLoaded();
  } else if( G.loading ){
    // console.log('jqueries are loading, attach a callback')
    G.callbacks.push(gifLoaded);
  } else {
    // console.log('loading a jquery');
    G.loading = true;
    G.callbacks = G.callbacks || [];
    loadScript(h+'/assets/js/embed-scripts.js', function(){
      G.loading = false;
      gifLoaded();
      var l = G.callbacks.length;
      while(l--){ G.callbacks[l](); }
    });
  }

  d.write(s);
})(window, document, 'http://<%= host %>');
