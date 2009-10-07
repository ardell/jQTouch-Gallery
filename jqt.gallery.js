/*

jQTouch Gallery v0.1

Created by Ryan McKillen <http://ryonlife.com>
Project hosted on GitHub <http://github.com/RyOnLife/jQTouch-Gallery>
  
  Wiki/Documentation <http://wiki.github.com/RyOnLife/jQTouch-Gallery>
  Isuues <http://github.com/RyOnLife/jQTouch-Gallery/issues>
    
Not possible without the awesome efforts behind the jQTouch project <http://jqtouch.com>
    
Copyright (c) 2009 by Ryan McKillen
See LICENSE for MIT license details

*/

(function($) {
  if($.jQTouch) {
    $.jQTouch.addExtension(function gallery(jQTouch){  
      var settings = {}, load = 0, ww = $(window).width(), wh = window.innerHeight;

      function gallery_init(options) {
        var defaults = {
          preload: 1,
          toggleToolbars: 5000,
          done: 'home'
        };
        settings = $.extend({}, defaults, options);
        load = settings.preload;
          
        for(var i = 0; i < settings.media.length; i++) page(i); // Build all gallery pages

        $('.gallery')
          .bind('pageAnimationStart', function(e, info){
            if(info.direction == 'in') {
              // Automatic toolbar toggling
              $(this).data('autoToggle', true);
              $('.toolbar', this).removeClass('hidden').show();
              var $this = $(this); 
              setTimeout(function(){
                toggleToolbars($this, 'auto');
              }, settings.toggleToolbars);
              preload(); // Preload media on upcoming gallery pages
            }
          })
          .bind('pageAnimationEnd', function(e, info){ // Orientation change since initialization
            if(info.direction == 'in') {
              orientation($(this));
            }
          })
          .bind('click', function(){ // Manual toolbar toggling
            $(this).data('autoToggle', false);
            toggleToolbars(this, 'user');
          });          
        
        jQT.addAnimation({name:'flipRight', selector:'.flipRight'}); // Rightward completement to jQTouch's .flip

        $('body').bind('turn', function(e, data){ // Orientation chance
          var g = $('.gallery.current');
          if(g.length) orientation(g);
        });

        // CSS hack: transparent toolbars with opaque text
        var toolbar_bg = $('.gallery .toolbar').css('background-image');
        $('.gallery .toolbar').css({background: 'none'});
        $('.gallery .toolbar .transparent').css({backgroundImage: toolbar_bg});
        
        $('a[href="#' + settings.gallery + '"]')
          .attr('href', '#' + settings.gallery + '_1') // Point gallery link at correct div
          .parent().children('small').text(settings.media.length); // Display gallery count to user
      }

      function page(i) {
        // Append gallery page to DOM
        var id = settings.gallery + '_' + eval(i + 1);
        if($('#' + id).length) return; // Quit function if page already exists
        var caption = (settings.media[i].caption.length) ? '<div class="caption">' + settings.media[i].caption + '<div class="caption_transparent"></div></div>' : '';
        $('body').append('<div id="' + id + '" class="gallery" style="height:' + wh + 'px;"><div class="toolbar"><h1>' + settings.title + '</h1><a class="cancel slide" href="#' + settings.done + '">Done</a>' + caption + '<div class="transparent"></div></div><div class="toolbar gallery_toolbar"><h1>' + eval(i + 1) + ' of ' + settings.media.length + '</h1><a href="#" class="gallery_arrow arrow_left flip"></a><a href="#" class="gallery_arrow arrow_right flipRight"></a><div class="transparent"></div></div><div class="play"></div></div>');
        var g = $('#' + id);

        // Positioning and links for arrows on bottom toolbar
        if(settings.media.length > 1) {
          positionArrows(g);
          var left_link = (i == 0) ? settings.media.length : i, right_link = (i == settings.media.length - 1) ? 1 : i + 2;
          $('a.gallery_arrow', g)
            .filter('.arrow_left').attr({href: '#' + settings.gallery + '_' + left_link})
            .end().filter('.arrow_right').attr({href: '#' + settings.gallery + '_' + right_link});
          g.bind('swipe', function(evt, data){ // Swipe to move through gallery
            $('a.arrow_' + data.direction, g).click();
          });
          /*g.live('swipe', function(evt, data){
            $('a.arrow_' + data.direction, g).click();
          });*/          
          /*g.swipe(function(evt, data){
            $('a.arrow_' + data.direction, g).click();          
          });*/       
        }

        if(i < settings.preload) media(i, g); // Preload media according to settings
      }

      // Preloads next unloaded media
      function preload() {
        if(load < settings.media.length) {
          var g = $('#' + settings.gallery + '_' + eval(load + 1));
          media(load, g);
          load++;        
        }
      }

      // Size gallery for portrait or landscape
      function orientation(g) {
        ww = $(window).width(), wh = window.innerHeight;
        g.css({height:wh + 'px'});
        adjustMedia($('.media', g));
        positionArrows(g);      
      }

      // Adds media to gallery page
      function media(i, g) {
        if(settings.media[i].youtube) settings.media[i].image = 'http://img.youtube.com/vi/' + settings.media[i].youtube + '/0.jpg';
        var media = $('<img src="' + settings.media[i].image + '" class="media" />');
        if(settings.media[i].youtube) {
          media.addClass('youtube');
          $('.play', g).bind('click', function(){
            document.location.href = 'http://www.youtube.com/watch?v=' + settings.media[i].youtube;
          });
        }
        media.load(function(){ // Cannot adjust size and positioning until loaded
          $('body').append(media); // Measurement hack
          adjustMedia(media);
          $('.toolbar:first-child', g).after(media); // Measurement hack
          if(i >= settings.preload) preload(); // Preload media according to settings        
        });
      }

      function adjustMedia(media) {
        // Media width and height (uses measurement hack)
        media.addClass('measure');
        var mw = media.width(), mh = media.height();
        media.removeClass('measure');

        // Larger of media width or height fills screen
        if(mw > mh) { 
          mh = (mw < ww) ? mh * ((ww - mw) / mw + 1) : mh * (1 + ((ww - mw) / mw));
          mw = ww;
        } else {
          mw = (mw < wh) ? mw * ((wh - mh) / mh + 1) : mw * (1 + ((wh - mh) / mh));
          mh = wh;
        }
        media.attr({width:mw, height:mh});

        // Center media on screen
        var x = ww / 2 - mw / 2 + 'px', y = wh / 2 - mh / 2 + 'px';
        media.css({left: x, top: y});
      }

      function positionArrows(g) {
        // Center arrows in toolbar
        var as = sizeFromCSS($('a.gallery_arrow', g)), ts = sizeFromCSS($('.toolbar .transparent', g)), hs = sizeFromCSS($('h1', g));
        var x = ww / 2 - as[0] + hs[0] / 2 + 10 + 'px', y = ts[1] / 2 - as[1] / 2 + 'px';
        $('a.gallery_arrow', g)
          .css({bottom: y, display: 'block'})
          .filter('.arrow_left').css({right:x})
          .end()
          .filter('.arrow_right').css({left:x});

        // Center video play button on screen
        if($('.youtube', g).length) {
          var play = $('.play', g);
          var ps = sizeFromCSS(play);
          x = ww / 2 - ps[0] / 2 + 'px', y = wh / 2 - ps[1] / 2 + 'px';
          play.css({left:x, top:y, display:'block'});
        }
      }

      // Fade toolbars in or out
      function toggleToolbars(g, src) {
        if((src == 'user' || (src == 'auto' && g.data('autoToggle') == true)) && settings.toggleToolbars) {
          if(!$('.toolbar', g).hasClass('hidden')) {
            $('.toolbar', g).addClass('hidden').fadeOut('fast');
          } else {
            $('.toolbar', g).removeClass('hidden').fadeIn('fast');
          }
        }
      }

      // Grabs element width and height based on stylesheet
      function sizeFromCSS(el) {
        var w = el.css('width'), h = el.css('height');
        w = parseInt(w.substring(0, w.length - 2)); h = parseInt(h.substring(0, h.length - 2));
        return [w, h];
      }
      
      return {gallery_init:gallery_init}
    });
  }
})(jQuery);