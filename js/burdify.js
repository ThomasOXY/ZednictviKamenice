(function(){
    'use strict';

    var defaults = {
      name: "jb-gallery",
      index: false,
      easing: 'linear',
      speed: 600,
      height: '100%',
      width: '100%',
      addClass: '',
      startClass: 'lg-start-zoom',
      backdropDuration: 150,
      hideUiDelay: 3000,
      controls: true,
      loop: true,
      getTitleFromAlt: true,

      counter: true,
      appendCounterTo: '.jbg-toolbar',
      appendSubHtmlTo: '.jbg-container',


      galleryId: 1
    };


    function Plugin(element, options) {
      this.el = element;
      this.$el = $(element);

      this.settings = $.extend({}, defaults, options);

      this.$items = this.$el.children();

      this.hideUi = false;

      this.init();
      return this;
    }
    Plugin.prototype.init = function() {

      var _this = this;

      _this.$items.on('click.jb',function(event){
        try {
            event.preventDefault();
        } catch (e) {
          event.returnValue = false;
        }

        _this.index = _this.settings.index || _this.$items.index(this);

        if (!$('body').hasClass('jbg-on')) {
          _this.build(_this.index);
          $('body').addClass('jbg-on');
        }
      });
    };

    Plugin.prototype.build = function(index) {
      var _this = this;

      _this.structure();

      _this.slide(index, false, false, false);

      if (_this.$items.length > 1) {

          _this.arrow();

          _this.mousewheel();

          _this.swipe();

      }

      _this.counter();

      _this.closeGallery();

      _this.$outer.on('mousemove.jb click.jb swipe.jb', function() {

          _this.$outer.removeClass('jbg-hide-ui');

          clearTimeout(_this.hideUi);

          // Timeout will be cleared on each slide movement also
          _this.hideUi = setTimeout(function() {
              _this.$outer.addClass('jbg-hide-ui');
          }, _this.settings.hideUiDelay);

      });

    }

    Plugin.prototype.structure = function() {
      var list = '';
      var controls = '';
      var i = 0;
      var subHtmlCont = '';
      var template;
      var _this = this;

      $('body').append('<div class="jbg-backdrop"></div>');

      // create gallery $items
      for (i = 0; i < this.$items.length; i++) {
        list += '<div class="jbg-item"></div>';
      }
      if (this.settings.controls && this.$items.length > 1){
        controls = '<div class="jbg-actions">' +
          '<div class="jbg-prev"><i class="fas fa-chevron-left"></i></div>' +
          '<div class="jbg-next"><i class="fas fa-chevron-right"></i></div>' +
          '</div>';
      }


      template = '<div class="jbg-outer ' + this.settings.addClass + ' ' + this.settings.startClass + '">' +
          '<div class="jbg" style="width:' + this.settings.width + '; height:' + this.settings.height + '">' +
          '<div class="jbg-inner">' + list + '</div>' +
          '<div class="jbg-toolbar group">' +
          '<span class="jbg-close"><i class="far fa-times-circle"></i></span>' +
          '</div>' +
          controls +
          '<div class="jbg-container"></div>' +
          '</div>' +
          '</div>';

      $('body').append(template);
      this.$outer = $('.jbg-outer');
      this.$slide = this.$outer.find('.jbg-item');

      _this.setTop();
      $(window).on('resize.jb orientationchange.jb', function() {
          setTimeout(function() {
              _this.setTop();
          }, 100);
      });
      this.$slide.eq(this.index).addClass('jbg-current');
      this.prevScrollTop = $(window).scrollTop();
    };

    Plugin.prototype.setTop = function() {
      if (this.settings.height !== '100%') {
        var wH = $(window).height();
        var top = (wH - parseInt(this.settings.height, 10)) / 2;
        var $jGallery = this.$outer.find('.jbg');
        if(wH >= parseInt(this.setting.height, 10)) {
          $jGallery.css('top', top + 'px');
        } else {
          $jGallery.css('top', '0px');
        }
      }
    };

    /**
     *  @desc Create image counter
     *  Ex: 1/10
     */
    Plugin.prototype.counter = function() {
        if (this.settings.counter) {
            $(this.settings.appendCounterTo).append('<div id="jbg-counter"><span id="jbg-counter-current">' + (parseInt(this.index, 10) + 1) + '</span> / <span id="jbg-counter-all">' + this.$items.length + '</span></div>');
        }
    };

    Plugin.prototype.addToContainer = function(index) {
      var subHtml = null;
      var subHtmlUrl;
      var $currentEle;

      $currentEle = this.$items.eq(index);

      subHtml = $currentEle.attr('data-html');
      if (this.settings.getTitleFromAlt && !subHtml) {
          subHtml = $currentEle.attr('title') || $currentEle.find('img').first().attr('title');
      }

      if (typeof subHtml == 'undefined' && subHtml == null) {
        subHtml = '';
      }
      if (this.settings.appendSubHtmlTo === '.jbg-container') {
        this.$outer.find(this.settings.appendSubHtmlTo).html(subHtml);
      }

      if (typeof subHtml !== 'undefined' && subHtml !== null) {
          if (subHtml === '') {
              this.$outer.find(this.settings.appendSubHtmlTo).addClass('jbg-empty-html');
          } else {
              this.$outer.find(this.settings.appendSubHtmlTo).removeClass('jbg-empty-html');
          }
      }

    }

    /**
     *  @desc Load slide content into slide.
     *  @param {Number} index - index of the slide.
     *  @param {Boolean} rec - if true call loadcontent() function again.
     *  @param {Boolean} delay - delay for adding complete class. it is 0 except first time.
     */
    Plugin.prototype.loadContent = function(index, rec, delay) {

      var _this = this;
      var _hasPoster = false;
      var _$img;
      var _src;
      var _poster;
      var _srcset;
      var _sizes;
      var _html;
        _src = _this.$items.eq(index).attr('href') || _this.$items.eq(index).attr('data-src');


        if (!_this.$slide.eq(index).hasClass('jbg-loaded')) {

            _this.$slide.eq(index).prepend('<div class="jbg-img-wrap"><img class="jbg-object jbg-image" src="' + _src + '" /></div>');

            _this.$slide.eq(index).addClass('jbg-loaded');
        }

        _this.$slide.eq(index).find('.jbg-object').on('load.jb error.jb', function() {

            // For first time add some delay for displaying the start animation.
            var _speed = 0;

            // Do not change the delay value because it is required for zoom plugin.
            // If gallery opened from direct url (hash) speed value should be 0
            if (delay && !$('body').hasClass('lg-from-hash')) {
                _speed = delay;
            }

            setTimeout(function() {
                _this.$slide.eq(index).addClass('lg-complete');
                _this.$el.trigger('onSlideItemLoad.lg', [index, delay || 0]);
            }, _speed);

        });
    };


    Plugin.prototype.slide = function(index, fromTouch, fromThumb, direction) {

        var _prevIndex = this.$outer.find('.jbg-current').index();
        var _this = this;

        // Prevent if multiple call
        // Required for hsh plugin
        if (_this.jGalleryOn && (_prevIndex === index)) {
            return;
        }

        var _length = this.$slide.length;
        var _time = _this.lGalleryOn ? this.settings.speed : 0;

        if (!_this.lgBusy) {

            _this.lgBusy = true;

            clearTimeout(_this.hideBartimeout);

            if(this.settings.appendSubHtmlTo) {
              setTimeout(function(){
                _this.addToContainer(index);
              }, _time);
            }


            if (!direction) {
                if (index < _prevIndex) {
                    direction = 'prev';
                } else if (index > _prevIndex) {
                    direction = 'next';
                }
            }

                // remove all transitions
                _this.$outer.addClass('jbg-no-trans');

                this.$slide.removeClass('jbg-prev-slide jbg-next-slide');

                if((index + 1) > (_length - 1)){
                  var nextIndex = 0,
                      prevIndex = this.index-1;
                }
                else if ((index - 1) < 0) {
                  var prevIndex = _length - 1,
                      nextIndex = this.index + 1;
                } else {
                  var nextIndex = this.index + 1,
                      prevIndex = this.index - 1;
                }


                if (direction === 'prev') {

                    //prevslide
                    this.$slide.eq(index).addClass('jbg-prev-slide');
                    this.$slide.eq(_prevIndex).addClass('jbg-next-slide');
                } else {

                    // next slide
                    this.$slide.eq(index).addClass('jbg-next-slide');
                    this.$slide.eq(_prevIndex).addClass('jbg-prev-slide');
                }

                // give 50 ms for browser to add/remove class
                setTimeout(function() {
                    _this.$slide.removeClass('jbg-current');

                    //_this.$slide.eq(_prevIndex).removeClass('lg-current');
                    _this.$slide.eq(index).addClass('jbg-current');

                    // reset all transitions
                    _this.$outer.removeClass('jbg-no-trans');
                }, 50);

            if (_this.jGalleryOn) {
                _this.loadContent(index, false, 0);

                _this.lgBusy = false;

            } else {
                _this.loadContent(index, false, _this.settings.backdropDuration);

                _this.lgBusy = false;
            }

            _this.jGalleryOn = true;

            if (this.settings.counter) {
                $('#jbg-counter-current').text(index+1);
            }

        }

    };


    Plugin.prototype.nextSlide = function(fromTouch){
      var _this = this,
          _loop = _this.settings.loop;

      if((_this.index + 1) < _this.$items.length) {
        _this.index++;
        _this.slide(_this.index, fromTouch, false, 'next');
      } else {
        if(_loop) {
          _this.index = 0;
          _this.slide(_this.index, fromTouch, false, 'next');
        }
      }
    };

    Plugin.prototype.prevSlide = function(fromTouch){
      var _this = this,
          _loop = _this.settings.loop;

      if(_this.index > 0) {
        _this.index--;
        _this.slide(_this.index, fromTouch, false, 'prev');
      } else {
        if(_loop) {
          _this.index = _this.$items.length - 1;
          _this.slide(_this.index, fromTouch, false, 'prev');
        }
      }
    };

    Plugin.prototype.arrow = function() {
        var _this = this;
        this.$outer.find('.jbg-prev').on('click.jb', function() {
            _this.prevSlide();
        });

        this.$outer.find('.jbg-next').on('click.jb', function() {
            _this.nextSlide();
        });
    };
    Plugin.prototype.mousewheel = function() {
        var _this = this;
        _this.$outer.on('mousewheel.jb', function(e) {

            if (!e.deltaY) {
                return;
            }

            if (e.deltaY > 0) {
                _this.prevSlide();
            } else {
                _this.nextSlide();
            }

            e.preventDefault();
        });

    };

    Plugin.prototype.swipe = function() {
        var _this = this;

        _this.$outer.on('swipeleft', function(e){
          _this.nextSlide();
        });
        _this.$outer.on('swiperight', function(e){
          _this.prevSlide();
        });
    }

    Plugin.prototype.closeGallery = function(){

      var _this = this;
      var mosedown = false;
      this.$outer.find('.jbg-close').on('click.jb', function() {
        _this.destroy();
      });
    };

    Plugin.prototype.destroy = function(d){
      var _this = this;

      $(window).scrollTop(_this.prevScrollTop);
      $('body').removeClass('jbg-on');
      if (_this.$outer) {
        _this.$outer.remove();
      }

      this.$el.off('.jb.tm');

      this.jGalleryOn = false;

      $(window).off('.jb');

      $('.jbg-backdrop').remove();
    }



    $.fn.gallery = function(options) {
      return this.each(function() {
        if (!$.data(this, 'jb-gallery')) {
            $.data(this, 'jb-gallery', new Plugin(this, options));
        } else {
          try {
            $(this).data('jb-gallery').init();
          } catch (e) {
            console.error('jb-gallery neni spravne nactena!');
          }
        }
      });



    }
}(jQuery));



/*


$('body').append('<div class="jb-gallery"></div>');
console.log(this.html());
$(this).children().each(function(){
  console.log(this);
  $('.jb-gallery').append('<div class="jb-item"></div>');
});


*/
